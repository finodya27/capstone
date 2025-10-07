# backend/app.py
import os
import atexit
import time
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv

from backend.database.db import initialize_firebase
from backend.api.telemetry import telemetry_blueprint, pixhawk
from backend.api.reports import reports_blueprint
from backend.api.auth import auth_blueprint
from backend.api.user import user_blueprint
from backend.api.video import video_blueprint
from backend.api.servo import servo_api

# =====================================================
# Load Environment
# =====================================================
load_dotenv()

# =====================================================
# Initialize Firebase
# =====================================================
try:
    initialize_firebase()
    print("✅ Firebase berhasil diinisialisasi")
except Exception as e:
    print(f"❌ Gagal inisialisasi Firebase: {e}")

# =====================================================
# Flask & SocketIO
# =====================================================
app = Flask(__name__)

# ✅ FIX CORS - Konfigurasi CORS yang lebih lengkap
CORS(app, 
     resources={r"/api/*": {"origins": "*"}},
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# =====================================================
# Register API Blueprints
# =====================================================
app.register_blueprint(telemetry_blueprint, url_prefix="/api")
app.register_blueprint(reports_blueprint, url_prefix="/api")
app.register_blueprint(auth_blueprint, url_prefix="/api/auth")
app.register_blueprint(user_blueprint, url_prefix="/api/user")
app.register_blueprint(video_blueprint, url_prefix="/api")
app.register_blueprint(servo_api, url_prefix="/api")

# =====================================================
# Default Route
# =====================================================
@app.route("/")
def home():
    return jsonify({"message": "🔥 Server Fire Quad System berjalan!"})

# ✅ Health check endpoint
@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Server is running"}), 200

# =====================================================
# Socket.IO event handlers
# =====================================================
@socketio.on("disconnect")
def handle_disconnect():
    print("⚠️ Client terputus dari Socket.IO")

# =====================================================
# Telemetry Callback (attribute-based)
# =====================================================
def telemetry_callback(vehicle, attr_name, value):
    try:
        telemetry = pixhawk.get_telemetry()
        if telemetry:
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
# Background Task → Telemetry Polling
# =====================================================
def telemetry_background_task():
    while True:
        try:
            if pixhawk and pixhawk.vehicle:
                telemetry = pixhawk.get_telemetry()
                if telemetry:
                    socketio.emit("telemetry", telemetry)
            time.sleep(0.5)
        except Exception as e:
            print(f"⚠️ Error di background telemetry: {e}")
            time.sleep(1)

socketio.start_background_task(telemetry_background_task)

# =====================================================
# Cleanup saat server mati
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