# backend/app.py
import os
import atexit
import time
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv

# =====================================================
# Load Environment Variables
# =====================================================
load_dotenv()
print("🔐 JWT_SECRET_KEY loaded:", bool(os.getenv("JWT_SECRET_KEY")))

# =====================================================
# Firebase Initialization
# =====================================================
from backend.database.db import initialize_firebase
from firebase_admin import db, firestore, storage

try:
    initialize_firebase()
    # Coba koneksi ke bucket
    bucket = storage.bucket()
    print(f"✅ Firebase berhasil diinisialisasi ({bucket.name})")
except Exception as e:
    print(f"❌ Gagal inisialisasi Firebase: {e}")

# =====================================================
# Flask App Setup
# =====================================================
app = Flask(__name__)
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    supports_credentials=True,
)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# =====================================================
# Import Blueprints
# =====================================================
from backend.api.telemetry import telemetry_blueprint, pixhawk, create_drone_data_from_pixhawk
from backend.api.reports import reports_blueprint
from backend.api.auth import auth_blueprint
from backend.api.user import user_blueprint
from backend.api.video import video_blueprint
from backend.api.fire_detection_sync import fire_sync_blueprint
from backend.api.sensors_environment import sensor_env_api

# Register semua blueprint
app.register_blueprint(telemetry_blueprint, url_prefix="/api")
app.register_blueprint(reports_blueprint, url_prefix="/api")
app.register_blueprint(auth_blueprint, url_prefix="/api/auth")
app.register_blueprint(user_blueprint, url_prefix="/api/user")
app.register_blueprint(video_blueprint, url_prefix="/api/video")
app.register_blueprint(fire_sync_blueprint, url_prefix="/api")
app.register_blueprint(sensor_env_api, url_prefix="/api")
# =====================================================
# Routes Utama
# =====================================================
@app.route("/")
def home():
    return jsonify({"message": "🔥 Fire Quad System backend is running!"})


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Server is running"}), 200

# =====================================================
# Pixhawk Telemetry Listener
# =====================================================
def telemetry_callback(vehicle, attr_name, value):
    """Callback saat atribut Pixhawk berubah"""
    try:
        telemetry = pixhawk.get_telemetry()
        if telemetry and telemetry.get("source") == "pixhawk":
            socketio.emit("telemetry", telemetry)
    except Exception as e:
        print(f"⚠️ Error callback [{attr_name}]: {e}")


attributes_to_listen = [
    "location", "attitude", "battery",
    "airspeed", "groundspeed", "heading",
    "gps_0", "rangefinder", "velocity"
]

if pixhawk and pixhawk.vehicle:
    try:
        for attr in attributes_to_listen:
            pixhawk.vehicle.add_attribute_listener(attr, telemetry_callback)
        print("✅ Pixhawk listeners aktif")
    except Exception as e:
        print(f"⚠️ Gagal pasang listener Pixhawk: {e}")
else:
    print("⚠️ Pixhawk belum terkoneksi")

# =====================================================
# Background Task 1 → Kirim Telemetry ke Frontend
# =====================================================
def telemetry_background_task():
    """Mengambil data Pixhawk tiap 0.5s dan kirim via Socket.IO."""
    while True:
        try:
            if pixhawk and pixhawk.vehicle:
                telemetry = pixhawk.get_telemetry()
                if telemetry and telemetry.get("source") == "pixhawk":
                    socketio.emit("telemetry", telemetry)
            time.sleep(0.5)
        except Exception as e:
            print(f"⚠️ Error telemetry background: {e}")
            time.sleep(1)

socketio.start_background_task(telemetry_background_task)

# =====================================================
# Background Task 2 → Auto-save Telemetry ke Firebase
# =====================================================
FIREBASE_SAVE_INTERVAL = 10  # detik

def firebase_autosave_task():
    """Simpan data Pixhawk ke Realtime Database tiap 10 detik."""
    while True:
        try:
            time.sleep(FIREBASE_SAVE_INTERVAL)

            if pixhawk and pixhawk.vehicle:
                telemetry = pixhawk.get_telemetry()

                if telemetry and telemetry.get("source") == "pixhawk":

                    # ⚙️ Buang field QoS supaya tidak error di DroneData()
                    telemetry_no_qos = {
                        k: v for k, v in telemetry.items()
                        if k != "qos"  # Hapus qos karena tidak ada di DroneData
                    }

                    # Buat objek DroneData tanpa qos
                    drone_data = create_drone_data_from_pixhawk(telemetry_no_qos)

                    ref = db.reference("/drone_data")
                    ref.push().set(drone_data.to_dict())

                    print(f"✅ Auto-save Pixhawk data: {datetime.now().isoformat()}")

                else:
                    print("ⓘ Pixhawk tidak aktif, skip auto-save.")
        except Exception as e:
            print(f"⚠️ Error di background auto-save Firebase: {e}")
            time.sleep(5)

# =====================================================
# Background Task 3 → Sinkronisasi Fire Detection (Firestore -> RealtimeDB)
# =====================================================
def fire_sync_background():
    """Cek Firestore tiap 30 detik untuk update fire detection ke RealtimeDB."""
    fs = firestore.client()
    rtdb = db.reference("/fire_reports")

    while True:
        try:
            thermal_ref = (
                fs.collection("sensors_thermal")
                .order_by("timestamp", direction=firestore.Query.DESCENDING)
                .limit(1)
            )
            docs = list(thermal_ref.stream())
            if not docs:
                time.sleep(30)
                continue

            data = docs[0].to_dict()
            fire_detected = data.get("fire_detected", False)
            if fire_detected:
                print("🔥 Fire detected — creating report...")
                fire_report = {
                    "timestamp": data.get("timestamp", datetime.utcnow().isoformat()),
                    "severity": "high" if data.get("max_temp", 0) > 60 else "medium",
                    "temperature": data.get("max_temp"),
                    "sensor_type": data.get("sensor_type"),
                    "image_url": data.get("image_url"),
                    "fire_bbox": data.get("fire_bbox"),
                }
                rtdb.push(fire_report)
                socketio.emit("fire_alert", fire_report)
                print("🚨 Fire report saved and alert emitted.")
            time.sleep(30)
        except Exception as e:
            print(f"⚠️ Error di background fire sync: {e}")
            time.sleep(10)

socketio.start_background_task(fire_sync_background)

# =====================================================
# Cleanup Handler
# =====================================================
def cleanup():
    if pixhawk and pixhawk.vehicle:
        try:
            for attr in attributes_to_listen:
                pixhawk.vehicle.remove_attribute_listener(attr, telemetry_callback)
            print("✅ Pixhawk listeners dicabut")
        except Exception as e:
            print(f"⚠️ Error saat unregister listener: {e}")

atexit.register(cleanup)

# =====================================================
# Main Entry Point
# =====================================================
if __name__ == "__main__":
    firebase_cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if not firebase_cred_path or not os.path.exists(firebase_cred_path):
        print("❌ Error: File kredensial Firebase tidak ditemukan.")
        exit(1)

    print("🚀 Server Fire Quad System berjalan di http://0.0.0.0:5000")
    print("📡 CORS enabled untuk semua origins")
    socketio.run(app, host="0.0.0.0", port=5000, debug=False)
