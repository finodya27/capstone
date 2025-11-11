# backend/api/video.py
from flask import Blueprint, jsonify, Response
import cv2
import numpy as np
import time
from firebase_admin import storage

video_blueprint = Blueprint("video", __name__)

# =====================================================================
# 🔹 Helper: Ambil daftar file dari Firebase Storage (urut terbaru)
# =====================================================================
def list_files_in_folder(folder_name: str, limit=5):
    try:
        bucket = storage.bucket()
        blobs = list(bucket.list_blobs(prefix=f"{folder_name}/"))
        if not blobs:
            print(f"[INFO] Folder '{folder_name}' kosong di Firebase Storage.")
            return []

        sorted_blobs = sorted(blobs, key=lambda x: x.updated, reverse=True)
        files = []
        for blob in sorted_blobs[:limit]:
            public_url = f"https://storage.googleapis.com/{bucket.name}/{blob.name}"
            files.append({
                "name": blob.name,
                "url": public_url,
                "updated": blob.updated.isoformat(),
                "size": blob.size,
            })
        return files
    except Exception as e:
        print(f"[ERROR] list_files_in_folder: {e}")
        return []


# =====================================================================
# 🔹 Helper: Ambil gambar terbaru dari Storage sebagai frame OpenCV
# =====================================================================
def get_latest_image_from_storage(folder_name: str):
    try:
        bucket = storage.bucket()
        blobs = list(bucket.list_blobs(prefix=f"{folder_name}/"))
        if not blobs:
            return None

        latest_blob = max(blobs, key=lambda b: b.updated)
        img_bytes = latest_blob.download_as_bytes()
        img_array = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        return frame
    except Exception as e:
        print(f"[ERROR] get_latest_image_from_storage: {e}")
        return None


# =====================================================================
# 🔸 Stream Thermal View (MJPEG) — TANPA TEKS
# =====================================================================
@video_blueprint.route("/thermal")
def video_thermal():
    def generate():
        while True:
            frame = get_latest_image_from_storage("thermal_images")
            if frame is not None:
                # ✅ Tidak ada teks tambahan sama sekali
                ret, buffer = cv2.imencode(".jpg", frame)
                if ret:
                    yield (b"--frame\r\n"
                           b"Content-Type: image/jpeg\r\n"
                           b"Content-Length: " + f"{len(buffer)}".encode() + b"\r\n\r\n" +
                           buffer.tobytes() + b"\r\n")
            time.sleep(1.5)  # jeda antar frame

    return Response(
        generate(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


# =====================================================================
# 🔸 Stream Fire Detection View (MJPEG) — TANPA TEKS
# =====================================================================
@video_blueprint.route("/detected-fire")
def video_detected_fire():
    def generate():
        while True:
            frame = get_latest_image_from_storage("detected_fire")
            if frame is not None:
                # ✅ Tidak ada teks tambahan sama sekali
                ret, buffer = cv2.imencode(".jpg", frame)
                if ret:
                    yield (b"--frame\r\n"
                           b"Content-Type: image/jpeg\r\n"
                           b"Content-Length: " + f"{len(buffer)}".encode() + b"\r\n\r\n" +
                           buffer.tobytes() + b"\r\n")
            time.sleep(1.5)

    return Response(
        generate(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


# =====================================================================
# 🔹 Endpoint: List semua gambar
# =====================================================================
@video_blueprint.route("/list/<folder>")
def list_video_images(folder):
    files = list_files_in_folder(folder)
    if not files:
        return jsonify({"message": f"Tidak ada gambar di folder '{folder}'."}), 404
    return jsonify({"folder": folder, "files": files}), 200


# =====================================================================
# 🔹 Endpoint: Ambil gambar terbaru untuk frontend
# =====================================================================
@video_blueprint.route("/latest/<folder>")
def latest_image(folder):
    try:
        folder_map = {
            "fire": "detected_fire",
            "thermal": "thermal_images",
            "detected_fire": "detected_fire",
            "thermal_images": "thermal_images",
        }

        real_folder = folder_map.get(folder)
        if not real_folder:
            return jsonify({"error": f"Invalid folder: {folder}"}), 400

        files = list_files_in_folder(real_folder, limit=1)
        if not files and real_folder == "detected_fire":
            print("[INFO] Folder detected_fire kosong, fallback ke thermal_images.")
            files = list_files_in_folder("thermal_images", limit=1)

        if not files:
            return jsonify({"message": f"Tidak ada gambar di folder '{real_folder}'."}), 404

        return jsonify(files[0]), 200

    except Exception as e:
        print(f"[ERROR] latest_image error: {e}")
        return jsonify({"error": str(e)}), 500
