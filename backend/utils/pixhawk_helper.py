from dronekit import connect
import time
import json
from pymavlink import mavutil

# Global cache agar koneksi hanya dibuat sekali
_vehicle_connection = None

class PixhawkHelper:
    def __init__(self, device="udp:127.0.0.1:14551", baud=57600):
        """
        device default diarahkan ke UDP 14551 (sesuai konfigurasi MAVProxy terbaru).
        """
        global _vehicle_connection

        # Statistik internal untuk estimasi message rate & packet loss
        self.last_time = time.time()
        self.msgs_in_interval = 0
        
        # Untuk menghitung packet loss dengan RADIO_STATUS.rxerrors (delta)
        # Akan digunakan jika master.stats tidak tersedia
        self.last_rxerrors = None
        self.current_packet_loss = None  # Persen loss terakhir
        
        # cache radio-status terakhir
        self._last_radio_status = {}
        
        # last heartbeat tracking (untuk menghitung heartbeat_delay)
        self._last_hb_seen = None

        try:
            if _vehicle_connection is None:
                # Untuk koneksi UDP, DroneKit abaikan baudrate
                if str(device).startswith("udp:"):
                    _vehicle_connection = connect(device, wait_ready=True, timeout=60)
                else:
                    _vehicle_connection = connect(device, baud=baud, wait_ready=True, timeout=60)

                print(f"✅ Terhubung ke Pixhawk pada {device}")
            else:
                print("♻️ Menggunakan koneksi Pixhawk yang sudah ada.")

            self.vehicle = _vehicle_connection
            
            # Coba ambil master dari vehicle._master (preferred)
            self.master = getattr(self.vehicle, "_master", None)
            
            # Jika tidak ada, buat koneksi mavutil fallback
            if self.master is None:
                try:
                    # gunakan device yang sama (udp:127.0.0.1:14551)
                    # NOTE: Koneksi DroneKit (vehicle) dan mavutil (master) ke port yang sama bisa konflik
                    self.master = mavutil.mavlink_connection(device)
                    print("ⓘ Menggunakan mavutil connection fallback.")
                except Exception as e:
                    print("⚠️ Tidak dapat membuat mavutil connection:", e)
                    self.master = None

        except Exception as e:
            print("⚠️ Gagal konek ke Pixhawk:", e)
            self.vehicle = None
            self.master = None

    def _poll_incoming_messages(self):
        """
        Drain message yang tersedia dari master (jika ada) secara non-blocking.
        Menghitung jumlah pesan, menyimpan RADIO_STATUS terakhir, dan mengupdate counters.
        """
        if not self.master:
            return

        try:
            while True:
                # Menggunakan recv_match(blocking=False) yang non-blocking
                msg = self.master.recv_match(blocking=False)

                if msg is None:
                    break

                # Pesan diterima
                self.msgs_in_interval += 1

                # Simpan RADIO_STATUS fields bila tersedia
                try:
                    mtype = msg.get_type()
                    if mtype == "RADIO_STATUS":
                        radio_info = {
                            "rssi": getattr(msg, "rssi", None),
                            "remrssi": getattr(msg, "remrssi", None),
                            "rxerrors": getattr(msg, "rxerrors", None),
                        }

                        # Perbarui status radio
                        self._last_radio_status = radio_info

                        # Update packet loss estimation menggunakan rxerrors delta
                        cur_rxerrors = radio_info.get("rxerrors")
                        if cur_rxerrors is not None:
                            if self.last_rxerrors is None:
                                self.last_rxerrors = cur_rxerrors
                                self.current_packet_loss = None # Belum ada delta
                            else:
                                # Delta error sejak RADIO_STATUS terakhir
                                delta_rx_errors = max(0, cur_rxerrors - self.last_rxerrors)
                                
                                # Gunakan msgs_in_interval sebagai indikasi pesan yang berhasil diterima
                                recent_msgs_received = self.msgs_in_interval 
                                denom = delta_rx_errors + recent_msgs_received
                                
                                if denom > 0:
                                    # Loss = (Error / Total) * 100
                                    self.current_packet_loss = round((delta_rx_errors / denom) * 100.0, 2)
                                else:
                                    self.current_packet_loss = 0.0 # Tidak ada data yang diterima/error

                                # update last_rxerrors untuk interval berikutnya
                                self.last_rxerrors = cur_rxerrors

                    # Tangkap juga heartbeat messages untuk time reference
                    if mtype == "HEARTBEAT":
                        self._last_hb_seen = time.time()

                except Exception:
                    # jangan gagal hanya karena parsing message
                    pass
        except Exception:
            # jika master tidak mendukung recv_match atau terjadi error pada loop, abaikan
            pass

    def _calculate_message_rate(self):
        """
        Menghitung messages per second selama interval sejak pemanggilan terakhir.
        Reset counter msgs_in_interval setelah dihitung.
        """
        now = time.time()
        delta = now - self.last_time
        rate = 0.0

        if delta > 0:
            msgs = self.msgs_in_interval
            rate = msgs / delta
            
        # reset untuk interval berikutnya
        self.msgs_in_interval = 0
        self.last_time = now

        return round(rate, 2)

    def _get_mavlink_stats(self):
        """
        Ambil stats dari vehicle._master.stats (jika tersedia).
        """
        stats_vals = {"packet_loss": None, "rx_rate": None, "tx_rate": None}
        try:
            master_obj = getattr(self.vehicle, "_master", None)
            if master_obj and hasattr(master_obj, "stats"):
                stats = master_obj.stats
                # DroneKit (pymavlink) stats memberikan persentase
                stats_vals["packet_loss"] = float(stats.packet_loss())
                stats_vals["rx_rate"] = float(stats.rx_rate()) # bytes/sec
                stats_vals["tx_rate"] = float(stats.tx_rate()) # bytes/sec
        except Exception:
            pass

        return stats_vals

    def _calculate_qos_score(self, gps_obj, packet_loss, msg_rate, rssi, heartbeat_delay):
        """
        Gabungkan beberapa metrik menjadi satu skor QoS 0..100 yang lebih realistis.
        Bobot disesuaikan agar 'null' (data tidak tersedia) memberikan penalti.
        """
        score = 100
        
        # 1. Komponen Kualitas Link (Paling Penting untuk QoS Komunikasi)
        
        # A. Packet Loss (Jika hilang, kita anggap buruk)
        if packet_loss is None:
            # Penalti besar jika Packet Loss tidak terdeteksi (data link tidak stabil)
            score -= 30 
        else:
            # Penalti lebih kuat: 1% loss = 0.6 penalti (max 60 penalti)
            score -= min(60, packet_loss * 0.6) 

        # B. Heartbeat Delay (Jika hilang, kita anggap buruk)
        if heartbeat_delay is None:
            # Penalti medium jika Heartbeat tidak terdeteksi
            score -= 15
        else:
            # Penalti berdasarkan delay: 0.5s delay = 10 penalti
            score -= min(30, heartbeat_delay * 20) 

        # C. RSSI (Signal Strength)
        if rssi is None:
            # Penalti ringan jika sinyal tidak terdetksi
            score -= 5
        else:
            rssi_val = float(rssi)
            # Normalisasi ke 0-100 (Asumsi max 255 untuk radio, max 100 untuk Mavlink)
            if rssi_val > 100:
                 rssi_norm = (rssi_val / 255.0) * 100 
            else:
                 rssi_norm = rssi_val
            
            # Penalti jika sinyal lemah (misalnya 50 RSSI = 15 penalti)
            if rssi_norm < 100:
                 # Hanya memberi penalti jika RSSI tidak 100%
                 score -= (100 - rssi_norm) * 0.3 

        # 2. Komponen GPS (Penting untuk Navigasi)
        
        sat = getattr(gps_obj, "satellites_visible", 0) if gps_obj else 0
        fix = getattr(gps_obj, "fix_type", 0) if gps_obj else 0
        
        # Penalti dari Fix Type
        if fix < 3: # Tidak ada 3D fix
            score -= 20
        
        # Bonus dari Satellites (max 15 sat = +15)
        score += min(sat * 1, 15) 
        
        # Batasan skor akhir (0 - 100)
        return int(round(max(0, min(100, score))))

    def _compute_heartbeat_delay(self):
        """
        Hitung delay sejak heartbeat terakhir terlihat.
        """
        now = time.time()
        
        # Preferensi: waktu lokal saat kita menerima pesan HEARTBEAT
        if self._last_hb_seen is not None:
            delta = now - self._last_hb_seen
            return round(delta, 3) if delta >= 0 else None

        # Fallback: vehicle.last_heartbeat (seringkali kurang reliabel/format berbeda)
        last_hb = getattr(self.vehicle, "last_heartbeat", None)
        if last_hb is None or last_hb <= 0:
            return None

        try:
            # Asumsi: last_heartbeat adalah detik sejak boot atau epoch
            if last_hb < 1e6: 
                 return None 
            
            # Jika terlihat seperti epoch detik (>= 1e9), gunakan langsung
            elif last_hb > 1e9:
                 delta = now - float(last_hb)
                 return round(delta, 3) if delta >= 0 else None
            
            # Jika terlihat seperti epoch milidetik (>1e6), bagi 1000
            else:
                 delta = now - (float(last_hb) / 1000.0)
                 return round(delta, 3) if delta >= 0 else None
                 
        except Exception:
            return None

    def get_telemetry(self):
        """
        Kembalikan dictionary telemetry dengan QoS yang lengkap.
        """
        if not self.vehicle:
            return None

        try:
            # 1. Poll incoming messages (update internal state: msg_rate counters, RADIO_STATUS, _last_hb_seen)
            self._poll_incoming_messages()

            # 2. Hitung metrik QoS
            msg_rate_internal = self._calculate_message_rate()
            mav_stats = self._get_mavlink_stats()
            packet_loss_stat = mav_stats.get("packet_loss")
            rx_rate_stat = mav_stats.get("rx_rate")
            tx_rate_stat = mav_stats.get("tx_rate")
            hb_delay = self._compute_heartbeat_delay()
            
            # Tentukan Packet Loss akhir (prioritaskan master.stats)
            packet_loss = packet_loss_stat if packet_loss_stat is not None else self.current_packet_loss
            
            # Tentukan RX Rate akhir
            rx_rate = msg_rate_internal 
            if rx_rate == 0.0 and rx_rate_stat is not None:
                rx_rate = rx_rate_stat # Fallback ke bytes/sec dari master.stats
            
            # Tentukan RSSI
            rssi = self._last_radio_status.get("rssi") or self._last_radio_status.get("remrssi")
            if rssi is None:
                 try:
                    rssi = getattr(self.vehicle, "rssi", None)
                 except Exception:
                    rssi = None

            # GPS object (safely)
            gps_0 = getattr(self.vehicle, "gps_0", None)
            
            # 3. Hitung Aggregated QoS Score
            qos_score = self._calculate_qos_score(gps_0, packet_loss, msg_rate_internal, rssi, hb_delay)

            qos_obj = {
                "score": qos_score,
                "packet_loss": packet_loss,
                "rx_rate": rx_rate, 
                "tx_rate": tx_rate_stat,
                "heartbeat_delay": hb_delay
            }
            
            # 4. Ambil Telemetry lainnya (dengan safe access dan rounding)
            def safe_round(val, nd=6):
                try:
                    return round(val, nd) if val is not None else None
                except Exception:
                    return None
            
            # Ambil properti lokasi/attitude dengan aman
            location = getattr(self.vehicle, "location", None)
            global_frame = getattr(location, "global_frame", None)
            global_relative_frame = getattr(location, "global_relative_frame", None)
            attitude = getattr(self.vehicle, "attitude", None)
            battery = getattr(self.vehicle, "battery", None)

            data = {
                "source": "pixhawk",
                "latitude": safe_round(getattr(global_frame, "lat", None), 6),
                "longitude": safe_round(getattr(global_frame, "lon", None), 6),
                "altitude": safe_round(getattr(global_relative_frame, "alt", None), 2),
                "qos": qos_obj,
                "battery": safe_round(getattr(battery, "level", None), 2) if battery else None,
                "heading": safe_round(getattr(self.vehicle, "heading", None), 2),
                "airspeed": safe_round(getattr(self.vehicle, "airspeed", None), 2),
                "groundspeed": safe_round(getattr(self.vehicle, "groundspeed", None), 2),
                "attitude": {
                    "roll": safe_round(getattr(attitude, "roll", None), 2) if attitude else None,
                    "pitch": safe_round(getattr(attitude, "pitch", None), 2) if attitude else None,
                    "yaw": safe_round(getattr(attitude, "yaw", None), 2) if attitude else None,
                },
                "gps": {
                    "fix_type": getattr(gps_0, "fix_type", None),
                    "satellites_visible": getattr(gps_0, "satellites_visible", None)
                }
            }

            # Print JSON ke terminal (rapi)
            print("📡 Telemetry Pixhawk:", json.dumps(data, indent=2, default=str))

            return data

        except Exception as e:
            # Error saat membaca properti vehicle/proses telemetry
            print(f"⚠️ Error saat proses telemetry: {e}")
            return None

    def close(self):
        global _vehicle_connection
        if getattr(self, "vehicle", None):
            try:
                self.vehicle.close()
                print("🔌 Koneksi ke Pixhawk ditutup.")
            except Exception as e:
                print(f"⚠️ Gagal menutup koneksi: {e}")
        _vehicle_connection = None
        self.vehicle = None
        self.master = None

    def __del__(self):
        self.close()