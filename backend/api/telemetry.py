from flask import Blueprint, jsonify, request
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
    return telemetry.get("sonar_range")


def create_drone_data_from_pixhawk(telemetry):
    gps_data = telemetry.get("gps", {})

    latitude = telemetry.get("latitude") or gps_data.get("latitude")
    longitude = telemetry.get("longitude") or gps_data.get("longitude")
    gps_altitude = telemetry.get("altitude") or gps_data.get("altitude")

    sonar_altitude = get_sonar_range(telemetry)

    return DroneData(
        battery=telemetry.get("battery"),
        altitude=gps_altitude,
        sonar_range=sonar_altitude,
        heading=telemetry.get("heading"),
        airspeed=telemetry.get("airspeed"),
        groundspeed=telemetry.get("groundspeed"),
        attitude=telemetry.get("attitude", {}),
        gps={
            "latitude": latitude,
            "longitude": longitude,
            "altitude": gps_altitude,
            "fix_type": gps_data.get("fix_type"),
            "satellites_visible": gps_data.get("satellites_visible"),
        },
        fire_detected=False,
        temperature=None,
        wind_direction=None,
        timestamp=datetime.utcnow().isoformat()
    )


def get_latest_from_firebase():
    """Mengambil data telemetry terbaru (berdasarkan timestamp) dari Firebase."""
    ref = db.reference("/drone_data")
    # Urutkan berdasarkan timestamp dan ambil yang paling akhir
    data = ref.order_by_child("timestamp").limit_to_last(1).get() 
    
    if data:
        # data dikembalikan sebagai dict {key: {telemetry_data}}
        latest_key = list(data.keys())[0]
        return data[latest_key]
    return None

@telemetry_blueprint.route("/telemetry/latest", methods=["GET"])
def get_latest_telemetry():
    """
    Endpoint untuk mengambil data telemetry. Prioritas: Pixhawk > Firebase.
    """
    # 1. Coba ambil data dari Pixhawk (Prioritas Utama)
    try:
        telemetry = pixhawk.get_telemetry()
        # Periksa apakah Pixhawk terhubung dan berhasil mengambil data
        if telemetry and telemetry.get("source") == "pixhawk":
            drone_data = create_drone_data_from_pixhawk(telemetry)
            
            return jsonify({
                "message": "✅ Data terbaru dari Pixhawk.",
                "source": "pixhawk",
                "data": drone_data.to_dict()
            }), 200

        # Jika get_telemetry() mengembalikan None atau bukan data Pixhawk, pindah ke fallback
        print("⚠️ Pixhawk tidak merespons atau offline. Mencoba ambil dari Firebase.")
        raise Exception("Pixhawk tidak merespons.") 

    except Exception as e:
        print(f"⚠️ Gagal ambil data Pixhawk: {e}. Mengambil data terakhir dari Firebase.")
        
        # 2. Jika Pixhawk gagal/offline, ambil data terbaru dari Firebase (Fallback)
        try:
            telemetry = get_latest_from_firebase()
            
            if telemetry:
                return jsonify({
                    "message": "⚠️ Pixhawk offline. Menampilkan data terakhir dari Firebase.",
                    "source": "firebase",
                    "data": telemetry 
                }), 200
            else:
                # Mengatasi masalah 'loading terus' saat tidak ada data sama sekali
                return jsonify({
                    "error": "Tidak ada data telemetry yang tersedia (Pixhawk offline dan Firebase kosong)."
                }), 404
            
        except Exception as db_err:
            print(f"❌ Gagal mengambil dari Firebase: {db_err}")
            return jsonify({
                "error": f"Gagal mengambil dari Firebase: {db_err}"
            }), 500

@telemetry_blueprint.route("/telemetry/push_pixhawk_data", methods=["POST"])
def post_pixhawk_data_manually():
    """
    Endpoint POST untuk pendorongan data Pixhawk secara manual ke Firebase.
    Berguna untuk setup awal atau debugging.
    
    Jika ada JSON body, akan menggunakan data body. 
    Jika tidak ada JSON body, akan mencoba ambil data langsung dari Pixhawk.
    """
    # 1. Cek apakah ada data manual dari request body (Postman)
    manual_data = request.get_json(silent=True)
    
    if manual_data:
        print("ⓘ Menerima data manual dari Postman/request body.")
        
        # Pastikan field penting ada
        if "timestamp" not in manual_data:
             manual_data["timestamp"] = datetime.utcnow().isoformat()
        if "source" not in manual_data:
             manual_data["source"] = "manual"
        
        # Simpan langsung dictionary dari request body
        ref = db.reference("/drone_data")
        ref.push().set(manual_data)
        
        return jsonify({
            "message": "✅ Data manual berhasil didorong ke Firebase.",
            "data": manual_data
        }), 200

    # 2. Jika tidak ada data manual, coba ambil dari Pixhawk (Logika fallback lama)
    try:
        telemetry = pixhawk.get_telemetry()
        
        if not telemetry or telemetry.get("source") != "pixhawk":
            raise Exception("Pixhawk tidak terhubung atau tidak merespons.")

        # 3. Konversi dan simpan ke Firebase
        drone_data = create_drone_data_from_pixhawk(telemetry)

        ref = db.reference("/drone_data")
        ref.push().set(drone_data.to_dict())

        return jsonify({
            "message": "✅ Data Pixhawk berhasil didorong ke Firebase secara manual.",
            "data": drone_data.to_dict()
        }), 200

    except Exception as e:
        print(f"⚠️ Gagal mendorong data Pixhawk ke Firebase: {e}")
        # Pesan error yang lebih informatif untuk user
        return jsonify({
            "error": f"Gagal mengambil/mendorong data Pixhawk: {e}. Coba kirim JSON body manual."
        }), 500