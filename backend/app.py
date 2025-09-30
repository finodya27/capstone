import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv


# Impor inisialisasi Firebase
from backend.database.db import initialize_firebase

# Muat variabel lingkungan dari file .env
load_dotenv()

# Inisialisasi Firebase
initialize_firebase()

# Inisialisasi Flask
app = Flask(__name__)

# Aktifkan CORS untuk semua endpoint dengan prefix /api
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Impor dan daftarkan blueprint API dari setiap modul
from backend.api.telemetry import telemetry_blueprint
from backend.api.reports import reports_blueprint
from backend.api.auth import auth_blueprint
from backend.api.video import video_blueprint
from backend.api.servo import servo_api

app.register_blueprint(telemetry_blueprint, url_prefix="/api")
app.register_blueprint(reports_blueprint, url_prefix="/api")
app.register_blueprint(auth_blueprint, url_prefix="/api/auth")
app.register_blueprint(video_blueprint, url_prefix="/api")
app.register_blueprint(servo_api, url_prefix='/api')


# Route default untuk testing
@app.route("/")
def home():
    return jsonify({"message": "Server Fire Quad System berjalan!"})

if __name__ == "__main__":
    # Pastikan file kredensial ada sebelum menjalankan server
    firebase_cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if not firebase_cred_path or not os.path.exists(firebase_cred_path):
        print("Error: File kredensial Firebase tidak ditemukan.")
        exit(1)

    # Jalankan server
    app.run(host="0.0.0.0", port=5000, debug=False)
