# backend/api/fire_detection_sync.py
from flask import Blueprint, jsonify
from firebase_admin import firestore, db
from datetime import datetime

fire_sync_blueprint = Blueprint("fire_sync", __name__)

@fire_sync_blueprint.route("/sync/fire-detection", methods=["GET"])
def sync_fire_detection():
    """
    Mengambil data terbaru dari Firestore (sensors_thermal + sensors_env)
    dan jika fire_detected == True, maka simpan laporan ke Realtime Database.
    """
    try:
        fs = firestore.client()
        rtdb = db.reference("/fire_reports")

        # Ambil data terbaru dari sensors_thermal
        thermal_ref = fs.collection("sensors_thermal").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(1)
        thermal_docs = list(thermal_ref.stream())

        if not thermal_docs:
            return jsonify({"message": "Tidak ada data thermal ditemukan."}), 404

        thermal_data = thermal_docs[0].to_dict()
        print("🔥 Thermal Data:", thermal_data)

        # Ambil data terbaru dari sensors_env
        env_ref = fs.collection("sensors_env").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(1)
        env_docs = list(env_ref.stream())

        env_data = env_docs[0].to_dict() if env_docs else {}

        # Jika tidak ada deteksi api
        if not thermal_data.get("fire_detected", False):
            return jsonify({
                "message": "Tidak ada api terdeteksi.",
                "max_temp": thermal_data.get("max_temp"),
                "timestamp": thermal_data.get("timestamp")
            }), 200

        # Jika terdeteksi api, siapkan laporan untuk disimpan ke Realtime Database
        fire_report = {
            "timestamp": thermal_data.get("timestamp", datetime.utcnow().isoformat()),
            "severity": "high" if thermal_data.get("max_temp", 0) > 60 else "medium",
            "temperature": thermal_data.get("max_temp"),
            "humidity": env_data.get("humidity"),
            "sensor_type": thermal_data.get("sensor_type", "unknown"),
            "image_url": thermal_data.get("image_url"),
            "fire_bbox": thermal_data.get("fire_bbox"),
            "location": {
                "latitude": env_data.get("latitude"),
                "longitude": env_data.get("longitude"),
            }
        }

        # Simpan laporan ke Realtime Database
        new_ref = rtdb.push(fire_report)
        return jsonify({
            "message": "🔥 Fire detected, laporan disimpan ke Realtime Database!",
            "report_id": new_ref.key,
            "data": fire_report
        }), 201

    except Exception as e:
        print("❌ Error:", e)
        return jsonify({"error": str(e)}), 500
