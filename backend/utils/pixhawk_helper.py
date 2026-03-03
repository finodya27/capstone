from dronekit import connect
import time
import json
from pymavlink import mavutil

_vehicle_connection = None


class PixhawkHelper:
    def __init__(self, device=None, baud=57600):
        global _vehicle_connection

        self.vehicle = None
        self.master = None
        self.fallback_mode = False

        # Statistik internal
        self.last_time = time.time()
        self.msgs_in_interval = 0
        self.last_rxerrors = None
        self.current_packet_loss = None
        self._last_radio_status = {}
        self._last_hb_seen = None

        # GPS & altitude storage
        self._last_lat = None
        self._last_lon = None
        self._last_alt = None
        self._last_sonar = None  # ✅ FIX: inisialisasi sonar

        # ============================================================
        # 🔥 FIX: hanya gunakan dua port ini
        # ============================================================
        possible_devices = (
            [device] if device else
            [
                "udp:127.0.0.1:14551",
                "udp:127.0.0.1:14550",
            ]
        )

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

        # ============================================================
        # Jika gagal, aktifkan fallback
        # ============================================================
        if not connected:
            print("🟡 Tidak ada koneksi aktif. Mode fallback aktif.")
            self.fallback_mode = True
            return

        # ============================================================
        # Backup MAVLink manual jika diperlukan
        # ============================================================
        if self.master is None:
            try:
                self.master = mavutil.mavlink_connection(dev)
                print("ⓘ Fallback mavutil aktif.")
            except Exception as e:
                print(f"⚠️ Tidak bisa fallback: {e}")
                self.master = None

    # ==============================================================

    def _poll_incoming_messages(self):
        if not self.master:
            return

        try:
            while True:
                msg = self.master.recv_match(blocking=False)
                if msg is None:
                    break

                mtype = msg.get_type()
                self.msgs_in_interval += 1

                # -------------------------------
                # HEARTBEAT
                # -------------------------------
                if mtype == "HEARTBEAT":
                    self._last_hb_seen = time.time()

                # -------------------------------
                # GPS FIX
                # -------------------------------
                if mtype == "GLOBAL_POSITION_INT":
                    self._last_lat = msg.lat / 1e7
                    self._last_lon = msg.lon / 1e7
                    self._last_alt = msg.relative_alt / 1000.0  # mm → meter

                # ✅ SONAR / DISTANCE SENSOR (FIXED)
                if mtype == "DISTANCE_SENSOR":
                    dist = getattr(msg, "current_distance", None)
                    if dist is not None:
                        # cm → meter
                        self._last_sonar = dist / 100.0

        except Exception as e:
            print("⚠️ _poll_incoming_messages error:", e)

    # ==============================================================

    def _calculate_message_rate(self):
        now = time.time()
        delta = now - self.last_time
        rate = (self.msgs_in_interval / delta) if delta > 0 else 0
        self.msgs_in_interval = 0
        self.last_time = now
        return round(rate, 2)

    def _get_mavlink_stats(self):
        stats = {"packet_loss": None, "rx_rate": None, "tx_rate": None}
        try:
            m = getattr(self.vehicle, "_master", None)
            if m and hasattr(m, "stats"):
                s = m.stats
                stats["packet_loss"] = float(s.packet_loss())
                stats["rx_rate"] = float(s.rx_rate())
                stats["tx_rate"] = float(s.tx_rate())
        except:
            pass
        return stats

    def _compute_heartbeat_delay(self):
        now = time.time()
        if self._last_hb_seen:
            return round(now - self._last_hb_seen, 3)
        return None

    # ==============================================================

    def get_telemetry(self):
        if self.fallback_mode or not self.vehicle:
            return None

        try:
            self._poll_incoming_messages()

            msg_rate = self._calculate_message_rate()
            stats = self._get_mavlink_stats()

            packet_loss = stats.get("packet_loss") or self.current_packet_loss
            hb_delay = self._compute_heartbeat_delay()

            gps = getattr(self.vehicle, "gps_0", None)
            att = getattr(self.vehicle, "attitude", None)
            bat = getattr(self.vehicle, "battery", None)

            def safe_round(v, nd=6):
                try:
                    return round(v, nd)
                except:
                    return None

            return {
                "source": "pixhawk",
                "latitude": self._last_lat,
                "longitude": self._last_lon,
                "altitude": self._last_alt,
                "sonar_range": self._last_sonar,  # ✅ dikirim ke API

                "battery": safe_round(getattr(bat, "level", None)) if bat else None,
                "heading": safe_round(getattr(self.vehicle, "heading", None)),
                "airspeed": safe_round(getattr(self.vehicle, "airspeed", None)),
                "groundspeed": safe_round(getattr(self.vehicle, "groundspeed", None)),

                "attitude": {
                    "roll": safe_round(getattr(att, "roll", None)),
                    "pitch": safe_round(getattr(att, "pitch", None)),
                    "yaw": safe_round(getattr(att, "yaw", None)),
                } if att else {},

                "gps": {
                    "fix_type": getattr(gps, "fix_type", None),
                    "satellites_visible": getattr(gps, "satellites_visible", None),
                }
            }

        except Exception as e:
            print("⚠️ Error telemetry:", e)
            return None
