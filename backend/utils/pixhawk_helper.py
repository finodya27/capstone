from dronekit import connect
import time
import json
from pymavlink import mavutil

# Cache global agar koneksi Pixhawk tidak dibuat berulang
_vehicle_connection = None


class PixhawkHelper:
    def __init__(self, device=None, baud=57600):
        """
        Inisialisasi koneksi ke Pixhawk via MAVProxy.
        Mencoba koneksi otomatis ke port UDP aktif (14551 → 14552).
        """
        global _vehicle_connection

        self.vehicle = None
        self.master = None
        self.fallback_mode = False

        # Statistik internal untuk perhitungan QoS
        self.last_time = time.time()
        self.msgs_in_interval = 0
        self.last_rxerrors = None
        self.current_packet_loss = None
        self._last_radio_status = {}
        self._last_hb_seen = None

        # Daftar device default (UDP)
        possible_devices = (
            [device] if device
            else ["udp:127.0.0.1:14551", "udp:127.0.0.1:14552", "udp:0.0.0.0:14551"]
        )

        # Coba konek ke device satu per satu
        connected = False
        for dev in possible_devices:
            try:
                print(f"🔌 Mencoba koneksi ke Pixhawk pada {dev} ...")
                _vehicle_connection = connect(
                    dev,
                    wait_ready=False,
                    heartbeat_timeout=30,
                    baud=baud
                )
                self.vehicle = _vehicle_connection
                self.master = getattr(self.vehicle, "_master", None)
                print(f"✅ Terhubung ke Pixhawk pada {dev}")
                connected = True
                break
            except Exception as e:
                print(f"⚠️ Gagal konek ke {dev}: {e}")

        if not connected:
            print("🕓 Tidak ada koneksi aktif ke Pixhawk (14551/14552).")
            print("🟡 Mode fallback aktif (Firebase-only).")
            self.fallback_mode = True
            return

        # Fallback manual jika tidak ada self.master
        if self.master is None:
            try:
                self.master = mavutil.mavlink_connection(dev)
                print("ⓘ Menggunakan mavutil connection fallback.")
            except Exception as e:
                print(f"⚠️ Tidak dapat membuat mavutil connection: {e}")
                self.master = None

    # ==============================================================
    # =============== PEMBACAAN DATA MAVLINK =======================
    # ==============================================================

    def _poll_incoming_messages(self):
        """Ambil pesan MAVLink baru untuk update statistik (non-blocking)."""
        if not self.master:
            return

        try:
            while True:
                msg = self.master.recv_match(blocking=False)
                if msg is None:
                    break

                self.msgs_in_interval += 1
                mtype = msg.get_type()

                # 🔸 Radio status
                if mtype == "RADIO_STATUS":
                    radio_info = {
                        "rssi": getattr(msg, "rssi", None),
                        "remrssi": getattr(msg, "remrssi", None),
                        "rxerrors": getattr(msg, "rxerrors", None),
                    }
                    self._last_radio_status = radio_info

                    cur_rxerrors = radio_info.get("rxerrors")
                    if cur_rxerrors is not None:
                        if self.last_rxerrors is None:
                            self.last_rxerrors = cur_rxerrors
                            self.current_packet_loss = None
                        else:
                            delta = max(0, cur_rxerrors - self.last_rxerrors)
                            denom = delta + self.msgs_in_interval
                            self.current_packet_loss = (
                                round((delta / denom) * 100.0, 2) if denom > 0 else 0.0
                            )
                            self.last_rxerrors = cur_rxerrors

                # 🔸 Heartbeat detection
                if mtype == "HEARTBEAT":
                    self._last_hb_seen = time.time()

        except Exception as e:
            # Tidak fatal — abaikan kesalahan parsing MAVLink
            print(f"⚠️ _poll_incoming_messages error: {e}")

    def _calculate_message_rate(self):
        """Hitung kecepatan pesan masuk per detik."""
        now = time.time()
        delta = now - self.last_time
        rate = (self.msgs_in_interval / delta) if delta > 0 else 0.0
        self.msgs_in_interval = 0
        self.last_time = now
        return round(rate, 2)

    def _get_mavlink_stats(self):
        """Ambil statistik MAVLink seperti packet loss, rx_rate, tx_rate."""
        stats = {"packet_loss": None, "rx_rate": None, "tx_rate": None}
        try:
            m = getattr(self.vehicle, "_master", None)
            if m and hasattr(m, "stats"):
                s = m.stats
                stats["packet_loss"] = float(s.packet_loss())
                stats["rx_rate"] = float(s.rx_rate())
                stats["tx_rate"] = float(s.tx_rate())
        except Exception:
            pass
        return stats

    def _compute_heartbeat_delay(self):
        """Hitung jeda waktu heartbeat terakhir (ms → detik)."""
        now = time.time()
        if self._last_hb_seen:
            return round(now - self._last_hb_seen, 3)

        last_hb = getattr(self.vehicle, "last_heartbeat", None)
        if last_hb:
            try:
                if last_hb > 1e9:  # Jika timestamp UNIX
                    return round(now - last_hb, 3)
                else:
                    return round(now - (last_hb / 1000.0), 3)
            except Exception:
                return None
        return None

    def _calculate_qos_score(self, gps, loss, rate, rssi, hb_delay):
        """Hitung skor QoS total berdasarkan sinyal, loss, delay, dan GPS."""
        score = 100

        # Packet loss (maks penalti 60)
        if loss is None:
            score -= 30
        else:
            score -= min(60, loss * 0.6)

        # Heartbeat delay (maks penalti 30)
        if hb_delay is None:
            score -= 15
        else:
            score -= min(30, hb_delay * 20)

        # RSSI (maks penalti 30)
        if rssi is not None:
            val = float(rssi)
            norm = (val / 255.0) * 100 if val > 100 else val
            if norm < 100:
                score -= (100 - norm) * 0.3
        else:
            score -= 5

        # GPS fix & satelit
        sat = getattr(gps, "satellites_visible", 0) if gps else 0
        fix = getattr(gps, "fix_type", 0) if gps else 0
        if fix < 3:
            score -= 20
        score += min(sat, 15)

        return int(max(0, min(100, round(score))))

    # ==============================================================
    # ================== FUNGSI UTAMA TELEMETRI ===================
    # ==============================================================

    def get_telemetry(self):
        """Ambil data telemetry lengkap dari Pixhawk."""
        if self.fallback_mode or not self.vehicle:
            return None

        try:
            # Ambil data MAVLink terbaru
            self._poll_incoming_messages()
            msg_rate = self._calculate_message_rate()
            stats = self._get_mavlink_stats()

            packet_loss = stats.get("packet_loss") or self.current_packet_loss
            hb_delay = self._compute_heartbeat_delay()
            rssi = (
                self._last_radio_status.get("rssi")
                or self._last_radio_status.get("remrssi")
            )
            gps = getattr(self.vehicle, "gps_0", None)

            # Hitung QoS
            qos_score = self._calculate_qos_score(gps, packet_loss, msg_rate, rssi, hb_delay)
            qos_data = {
                "score": qos_score,
                "packet_loss": packet_loss,
                "rx_rate": msg_rate,
                "heartbeat_delay": hb_delay,
                "rssi": rssi,
            }

            # Ambil data utama
            def safe_round(v, nd=6):
                try:
                    return round(v, nd) if v is not None else None
                except Exception:
                    return None

            loc = getattr(self.vehicle, "location", None)
            global_frame = getattr(loc, "global_frame", None)
            global_rel = getattr(loc, "global_relative_frame", None)
            attitude = getattr(self.vehicle, "attitude", None)
            battery = getattr(self.vehicle, "battery", None)

            data = {
                "source": "pixhawk",
                "latitude": safe_round(getattr(global_frame, "lat", None)),
                "longitude": safe_round(getattr(global_frame, "lon", None)),
                "altitude": safe_round(getattr(global_rel, "alt", None)),
                "battery": safe_round(getattr(battery, "level", None)) if battery else None,
                "heading": safe_round(getattr(self.vehicle, "heading", None)),
                "airspeed": safe_round(getattr(self.vehicle, "airspeed", None)),
                "groundspeed": safe_round(getattr(self.vehicle, "groundspeed", None)),
                "attitude": {
                    "roll": safe_round(getattr(attitude, "roll", None)),
                    "pitch": safe_round(getattr(attitude, "pitch", None)),
                    "yaw": safe_round(getattr(attitude, "yaw", None)),
                } if attitude else {},
                "gps": {
                    "fix_type": getattr(gps, "fix_type", None),
                    "satellites_visible": getattr(gps, "satellites_visible", None),
                },
                # QoS ditambahkan, tapi tidak dikirim ke constructor Telemetry (hindari error)
                "qos": qos_data,
            }

            return data

        except Exception as e:
            print(f"⚠️ Error saat membaca telemetry: {e}")
            return None

    # ==============================================================
    # ================== PENUTUPAN KONEKSI =========================
    # ==============================================================

    def close(self):
        """Menutup koneksi dengan Pixhawk."""
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
        """Panggil close() saat objek dihancurkan."""
        try:
            self.close()
        except Exception:
            pass
