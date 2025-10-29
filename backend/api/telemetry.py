from flask import Blueprint, request, jsonify
from firebase_admin import db
from backend.utils.pixhawk_helper import PixhawkHelper
from backend.database.models import DroneData
from datetime import datetime
import time

telemetry_blueprint = Blueprint("telemetry", __name__)

# Gunakan koneksi UDP dari MAVProxy
# MAVProxy command:
# mavproxy.py --master=COM3 --baudrate 57600 --out=udp:127.0.0.1:14550 --out=udp:127.0.0.1:14551
pixhawk = PixhawkHelper(device="udp:127.0.0.1:14551", baud=57600)


def get_sonar_range(telemetry):
    if "sonarrange" in telemetry:
        return telemetry["sonarrange"]
    return telemetry.get("altitude", None)


def create_drone_data_from_pixhawk(telemetry):
    sonar_altitude = get_sonar_range(telemetry)

    return DroneData(
        battery=telemetry.get("battery"),
        altitude=sonar_altitude,
        heading=telemetry.get("heading"),
        airspeed=telemetry.get("airspeed"),
        groundspeed=telemetry.get("groundspeed"),
        attitude={
            "roll": telemetry["attitude"].get("roll"),
            "pitch": telemetry["attitude"].get("pitch"),
            "yaw": telemetry["attitude"].get("yaw"),
        } if "attitude" in telemetry else {},
        gps={
            "latitude": telemetry["gps"].get("latitude"),
            "longitude": telemetry["gps"].get("longitude"),
            "altitude": telemetry["gps"].get("altitude"),
            "fix_type": telemetry["gps"].get("fix_type"),
            "satellites_visible": telemetry["gps"].get("satellites_visible"),
        } if "gps" in telemetry else {},
        qos=telemetry.get("qos", None),  # ✅ QoS ikut disimpan
        fire_detected=False,
        temperature=None,
        wind_direction=None,
        timestamp=datetime.utcnow().isoformat()
    )


@telemetry_blueprint.route("/telemetry", methods=["POST"])
def post_telemetry_data():
    try:
        telemetry = pixhawk.get_telemetry()
        if telemetry:

            # ✅ QoS Tambahan
            try:
                stats = pixhawk.vehicle._master.stats
                telemetry["qos"] = {
                    "packet_loss": stats.packet_loss(),
                    "rx_rate": stats.rx_rate(),
                    "tx_rate": stats.tx_rate(),
                    "heartbeat_delay": round(time.time() - pixhawk.vehicle.last_heartbeat, 3)
                }
            except Exception as qos_err:
                print(f"⚠️ QoS error: {qos_err}")

            drone_data = create_drone_data_from_pixhawk(telemetry)

            ref = db.reference("/drone_data")
            ref.push().set(drone_data.to_dict())

            return jsonify({
                "message": "✅ Data dari Pixhawk berhasil disimpan.",
                "data": drone_data.to_dict()
            }), 200

        raise Exception("Pixhawk tidak merespons.")

    except Exception as e:
        print("⚠️ Gagal ambil data Pixhawk:", e)
        try:
            ref = db.reference("/drone_data")
            data = ref.order_by_key().limit_to_last(1).get()
            if not data:
                return jsonify({"error": "Tidak ada data telemetry yang tersedia."}), 404

            latest_key = list(data.keys())[0]
            telemetry = data[latest_key]
            return jsonify({
                "message": "⚠️ Pixhawk offline. Menampilkan data terakhir dari Firebase.",
                "data": telemetry
            }), 200

        except Exception as db_err:
            return jsonify({"error": f"Gagal mengambil dari Firebase: {db_err}"}), 500


@telemetry_blueprint.route("/telemetry/latest", methods=["GET"])
def get_latest_telemetry():
    try:
        telemetry = pixhawk.get_telemetry()
        if telemetry:

            # ✅ QoS Tambahan
            try:
                stats = pixhawk.vehicle._master.stats
                telemetry["qos"] = {
                    "packet_loss": stats.packet_loss(),
                    "rx_rate": stats.rx_rate(),
                    "tx_rate": stats.tx_rate(),
                    "heartbeat_delay": round(time.time() - pixhawk.vehicle.last_heartbeat, 3)
                }
            except Exception as qos_err:
                print(f"⚠️ QoS error: {qos_err}")

            drone_data = create_drone_data_from_pixhawk(telemetry)
            return jsonify({
                "message": "✅ Data terbaru dari Pixhawk.",
                "data": drone_data.to_dict()
            }), 200

        raise Exception("Pixhawk tidak merespons.")

    except Exception as e:
        print("⚠️ Gagal ambil data Pixhawk:", e)
        try:
            ref = db.reference("/drone_data")
            data = ref.order_by_key().limit_to_last(1).get()
            if not data:
                return jsonify({"error": "Tidak ada data telemetry yang tersedia."}), 404

            latest_key = list(data.keys())[0]
            telemetry = data[latest_key]
            return jsonify({
                "message": "⚠️ Pixhawk offline. Menampilkan data terakhir dari Firebase.",
                "data": telemetry
            }), 200

        except Exception as db_err:
            return jsonify({"error": f"Gagal mengambil dari Firebase: {db_err}"}), 500
