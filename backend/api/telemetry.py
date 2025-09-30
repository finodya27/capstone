from flask import Blueprint, request, jsonify
from firebase_admin import db
from backend.utils.pixhawk_helper import PixhawkHelper
from backend.database.models import DroneData
from datetime import datetime

telemetry_blueprint = Blueprint("telemetry", __name__)
pixhawk = PixhawkHelper(device="COM3", baud=57600)

# Fungsi untuk mengambil data ketinggian dari sonar (sonarrange)
def get_sonar_range(telemetry):
    # Ambil nilai 'sonarrange' dari telemetry
    if "sonarrange" in telemetry:
        return telemetry["sonarrange"]
    else:
        # Jika tidak ada sonarrange, kembalikan nilai default atau ketinggian dari GPS
        return telemetry["altitude"]  # fallback ke altitude dari GPS jika sonar tidak tersedia

# Fungsi util: Membuat objek DroneData dari hasil Pixhawk dan sonar
def create_drone_data_from_pixhawk(telemetry):
    # Ambil ketinggian dari sonar (sonarrange) atau fallback ke GPS jika tidak ada
    sonar_altitude = get_sonar_range(telemetry)

    # Membuat objek DroneData dengan menggunakan data telemetry Pixhawk dan ketinggian dari sonar
    return DroneData(
        battery=telemetry["battery"],
        altitude=sonar_altitude,  # Gantikan dengan data dari sonar atau rangefinder
        heading=telemetry["heading"],
        airspeed=telemetry["airspeed"],
        groundspeed=telemetry["groundspeed"],
        attitude={
            "roll": telemetry["attitude"]["roll"],
            "pitch": telemetry["attitude"]["pitch"],
            "yaw": telemetry["attitude"]["yaw"],
        },
        gps={
            "latitude": telemetry["gps"]["latitude"],
            "longitude": telemetry["gps"]["longitude"],
            "altitude": telemetry["gps"]["altitude"],  # Altitude GPS tetap dipertahankan
            "fix_type": telemetry["gps"]["fix_type"],
            "satellites_visible": telemetry["gps"]["satellites_visible"],
        },
        fire_detected=False,
        temperature=None,
        wind_direction=None,
        timestamp=datetime.utcnow().isoformat()
    )

@telemetry_blueprint.route("/telemetry", methods=["POST"])
def post_telemetry_data():
    try:
        telemetry = pixhawk.get_telemetry()  # Ambil data telemetry dari Pixhawk
        if telemetry:
            # Membuat data drone dari telemetry dan sonar
            drone_data = create_drone_data_from_pixhawk(telemetry)

            # Menyimpan data ke Firebase
            ref = db.reference("/drone_data")
            ref.push().set(drone_data.to_dict())

            return jsonify({
                "message": "✅ Data dari Pixhawk berhasil disimpan.",
                "data": drone_data.to_dict()
            }), 200

        # Fallback jika tidak ada data dari Pixhawk
        raise Exception("Pixhawk tidak merespons.")

    except Exception as e:
        print("⚠️ Gagal ambil data Pixhawk:", e)

        # Ambil data terakhir dari Firebase jika Pixhawk tidak merespons
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
            # Membuat data drone dari telemetry dan sonar
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
