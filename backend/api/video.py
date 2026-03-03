from flask import Blueprint, jsonify, Response
import cv2
import numpy as np
import time
import json
from firebase_admin import storage

video_blueprint = Blueprint("video", __name__)


# ============================================================
# 1. Ambil blob terbaru APA SAJA (.jpg / .png / .json)
# ============================================================
def get_latest_blob(folder_name: str):
    bucket = storage.bucket()
    blobs = list(bucket.list_blobs(prefix=f"{folder_name}/"))

    if not blobs:
        return None

    return max(blobs, key=lambda b: b.updated)


# ============================================================
# 2. Ambil gambar terbaru:
#    - Jika file = JPG → langsung pakai
#    - Jika file = JSON → baca JSON → ambil remote_path → ambil JPG
# ============================================================
def get_latest_image_from_storage(folder_name: str):
    try:
        bucket = storage.bucket()

        # Ambil file terbaru
        latest_blob = get_latest_blob(folder_name)
        if not latest_blob:
            return None

        name = latest_blob.name.lower()

        # CASE A → File = gambar
        if name.endswith((".jpg", ".jpeg", ".png")):
            img_bytes = latest_blob.download_as_bytes()
            img_array = np.frombuffer(img_bytes, np.uint8)
            return cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        # CASE B → File = JSON metadata
        if name.endswith(".json"):
            json_bytes = latest_blob.download_as_bytes()
            meta = json.loads(json_bytes.decode("utf-8"))

            # Ambil path gambar dari JSON
            remote_path = meta.get("image", {}).get("remote_path")
            if not remote_path:
                print("[WARN] JSON tidak memiliki remote_path image.")
                return None

            # Ambil file JPG sesuai remote_path
            img_blob = bucket.blob(remote_path)
            if not img_blob.exists():
                print(f"[ERROR] File image '{remote_path}' tidak ditemukan di storage.")
                return None

            img_bytes = img_blob.download_as_bytes()
            img_array = np.frombuffer(img_bytes, np.uint8)
            return cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        # Tidak dikenal
        return None

    except Exception as e:
        print(f"[ERROR] get_latest_image_from_storage: {e}")
        return None


# ============================================================
# 3. MJPEG STREAM → DETECTED FIRE VIEW
# ============================================================
@video_blueprint.route("/detected-fire")
def video_detected_fire():
    def generate():
        while True:
            frame = get_latest_image_from_storage("detected_fire")
            if frame is not None:
                ret, buffer = cv2.imencode(".jpg", frame)
                if ret:
                    yield (
                        b"--frame\r\n"
                        b"Content-Type: image/jpeg\r\n\r\n" +
                        buffer.tobytes() + b"\r\n"
                    )
            time.sleep(1.2)

    return Response(
        generate(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


# ============================================================
# 4. Endpoint untuk FRONTEND → ambil JSON info file TERBARU
# ============================================================
@video_blueprint.route("/latest/detected_fire")
def latest_detected_fire():
    try:
        bucket = storage.bucket()

        latest_blob = get_latest_blob("detected_fire")
        if not latest_blob:
            return jsonify({"message": "No files"}), 404

        name = latest_blob.name.lower()

        # CASE A: Jika file terbaru = JSON → ambil image.remote_path
        if name.endswith(".json"):
            meta = json.loads(latest_blob.download_as_bytes().decode())
            remote_path = meta.get("image", {}).get("remote_path")

            if remote_path:
                url = f"https://storage.googleapis.com/{bucket.name}/{remote_path}"
                return jsonify({
                    "name": remote_path,
                    "url": url,
                    "updated": latest_blob.updated.isoformat()
                }), 200

        # CASE B: Jika file terbaru = JPG/JPEG/PNG
        if name.endswith((".jpg", ".jpeg", ".png")):
            url = f"https://storage.googleapis.com/{bucket.name}/{latest_blob.name}"
            return jsonify({
                "name": latest_blob.name,
                "url": url,
                "updated": latest_blob.updated.isoformat()
            }), 200

        return jsonify({"error": "Unknown file type"}), 400

    except Exception as e:
        print("[ERROR] latest_detected_fire:", e)
        return jsonify({"error": str(e)}), 500
