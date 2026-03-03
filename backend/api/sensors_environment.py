from flask import Blueprint, jsonify
from firebase_admin import firestore

sensor_env_api = Blueprint("sensor_env_api", __name__)

@sensor_env_api.route("/sensors-env/latest", methods=["GET"])
def get_latest_sensor_env():
    try:
        fs = firestore.client()

        docs = (
            fs.collection("sensors_env")
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(1)
            .stream()
        )

        docs = list(docs)

        if not docs:
            return jsonify({"message": "Tidak ada data sensors_env ditemukan."}), 404

        data = docs[0].to_dict()

        return jsonify({
            "humidity": data.get("humidity"),
            "temperature": data.get("temperature"),
            "timestamp": data.get("timestamp"),
            "source": "firestore"
        }), 200

    except Exception as e:
        print("❌ Error sensors-env:", e)
        return jsonify({"error": str(e)}), 500
