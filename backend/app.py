# backend/app.py
import os
import atexit
import time
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv

# Import yang diperlukan
from backend.database.db import initialize_firebase
from backend.api.telemetry import telemetry_blueprint, pixhawk, create_drone_data_from_pixhawk # Tambah create_drone_data_from_pixhawk
from backend.api.reports import reports_blueprint
from backend.api.auth import auth_blueprint
from backend.api.user import user_blueprint
from backend.api.video import video_blueprint
from backend.api.servo import servo_api
from firebase_admin import db # Import database untuk auto-save
from datetime import datetime # Import datetime untuk timestamp auto-save

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
# Telemetry Callback (attribute-based) - HANYA untuk Socket.IO
# =====================================================
def telemetry_callback(vehicle, attr_name, value):
    try:
        # Gunakan get_telemetry() untuk mendapatkan data lengkap (termasuk QoS)
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
# Background Task 1 → Telemetry Polling (JAGA KONEKSI & SOCKET.IO)
# =====================================================
def telemetry_background_task():
    """Mengambil data Pixhawk setiap 0.5s dan mengirimkannya via Socket.IO."""
    while True:
        try:
            if pixhawk and pixhawk.vehicle:
                # get_telemetry() akan melakukan polling, menghitung QoS, dan menjaga koneksi
                telemetry = pixhawk.get_telemetry() 
                if telemetry and telemetry.get("source") == "pixhawk":
                    socketio.emit("telemetry", telemetry)
            time.sleep(0.5)
        except Exception as e:
            # Print error hanya jika severity tinggi
            # print(f"⚠️ Error di background telemetry: {e}") 
            time.sleep(1)

socketio.start_background_task(telemetry_background_task)


# =====================================================
# Background Task 2 → Telemetry Auto-Save to Firebase (Setiap 1 Menit)
# =====================================================
FIREBASE_SAVE_INTERVAL = 60 # Simpan setiap 60 detik (1 menit)

def firebase_autosave_task():
    """
    Background task untuk mengambil data dari Pixhawk (jika terhubung) 
    dan menyimpannya ke Firebase setiap 60 detik.
    """
    while True:
        try:
            # Tidur selama interval sebelum mencoba save lagi
            time.sleep(FIREBASE_SAVE_INTERVAL) 
            
            if pixhawk and pixhawk.vehicle:
                # Dapatkan data terbaru dari Pixhawk (diprioritaskan)
                telemetry = pixhawk.get_telemetry()
                
                # Hanya simpan jika data Pixhawk berhasil diambil
                if telemetry and telemetry.get("source") == "pixhawk": 
                    
                    # Konversi ke model data (menambahkan timestamp saat ini)
                    drone_data = create_drone_data_from_pixhawk(telemetry) 
                    
                    # Simpan ke Firebase Realtime Database
                    ref = db.reference("/drone_data")
                    ref.push().set(drone_data.to_dict())
                    
                    print(f"✅ Auto-save data Pixhawk ke Firebase: {datetime.now().isoformat()}")
                else:
                    print("ⓘ Pixhawk tidak terhubung/tidak ada data, auto-save dilewati.")
                
        except Exception as e:
            print(f"⚠️ Error di background auto-save Firebase: {e}")

# Aktifkan background task auto-save
socketio.start_background_task(firebase_autosave_task)


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
