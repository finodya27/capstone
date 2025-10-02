from dronekit import connect
import time

# Global cache agar koneksi hanya dibuat sekali
_vehicle_connection = None

class PixhawkHelper:
    def __init__(self, device="udp:127.0.0.1:14551", baud=57600):
        """
        device bisa berupa:
          - "COM3" (atau port serial lain, Windows)
          - "/dev/ttyUSB0" (Linux)
          - "udp:127.0.0.1:14551" (UDP dari MAVProxy)
        """
        global _vehicle_connection
        try:
            if _vehicle_connection is None:
                # Kalau koneksi UDP, DroneKit abaikan baudrate (tidak dipakai)
                if str(device).startswith("udp:"):
                    _vehicle_connection = connect(device, wait_ready=True, timeout=60)
                else:
                    _vehicle_connection = connect(device, baud=baud, wait_ready=True, timeout=60)

                print(f"✅ Terhubung ke Pixhawk pada {device}")
            else:
                print("♻️ Menggunakan koneksi Pixhawk yang sudah ada.")

            self.vehicle = _vehicle_connection

        except Exception as e:
            print("⚠️ Gagal konek ke Pixhawk:", e)
            self.vehicle = None

    def get_telemetry(self):
        if not self.vehicle:
            return None

        try:
            location = self.vehicle.location.global_frame
            gps_0 = getattr(self.vehicle, "gps_0", None)

            # Baca sonar/rangefinder
            sonar_range = None
            if "RNGFND1_DIST" in self.vehicle.parameters:
                sonar_range = self.vehicle.parameters["RNGFND1_DIST"] / 100.0  # cm → m
            elif hasattr(self.vehicle, "rangefinder"):
                sonar_range = self.vehicle.rangefinder.distance

            # Gunakan sonar kalau ada, fallback ke altitude relatif
            final_altitude = sonar_range if sonar_range is not None else self.vehicle.location.global_relative_frame.alt

            data = {
                "source": "pixhawk",
                "latitude": round(location.lat, 6) if location.lat else None,
                "longitude": round(location.lon, 6) if location.lon else None,
                "altitude": round(final_altitude, 2) if final_altitude is not None else None,
                "sonarrange": round(sonar_range, 2) if sonar_range is not None else None,
                "battery": round(self.vehicle.battery.level, 2) if self.vehicle.battery and self.vehicle.battery.level is not None else None,
                "heading": round(self.vehicle.heading, 2) if self.vehicle.heading is not None else None,
                "airspeed": round(self.vehicle.airspeed, 2) if self.vehicle.airspeed is not None else None,
                "groundspeed": round(self.vehicle.groundspeed, 2) if self.vehicle.groundspeed is not None else None,
                "attitude": {
                    "roll": round(self.vehicle.attitude.roll, 2) if self.vehicle.attitude.roll is not None else None,
                    "pitch": round(self.vehicle.attitude.pitch, 2) if self.vehicle.attitude.pitch is not None else None,
                    "yaw": round(self.vehicle.attitude.yaw, 2) if self.vehicle.attitude.yaw is not None else None,
                },
                "gps": {
                    "latitude": round(location.lat, 6) if location.lat else None,
                    "longitude": round(location.lon, 6) if location.lon else None,
                    "altitude": round(location.alt, 2) if location.alt else None,
                    "fix_type": gps_0.fix_type if gps_0 else None,
                    "satellites_visible": gps_0.satellites_visible if gps_0 else None
                }
            }
            return data
        except Exception as e:
            print("⚠️ Error baca Pixhawk:", e)
            return None

    def close(self):
        global _vehicle_connection
        if self.vehicle:
            try:
                self.vehicle.close()
                print("🔌 Koneksi ke Pixhawk ditutup.")
            except Exception as e:
                print("⚠️ Gagal menutup koneksi:", e)
        _vehicle_connection = None
        self.vehicle = None

    def __del__(self):
        self.close()
