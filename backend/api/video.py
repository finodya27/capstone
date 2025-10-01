from flask import Response, Blueprint
import cv2
import requests
import numpy as np
import firebase_admin
from firebase_admin import credentials, db

video_blueprint = Blueprint("video", __name__)

# --- Firebase setup ---
cred = credentials.Certificate("backend/firebase_key.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        "databaseURL": "https://drone-monitoring-system-fef66-default-rtdb.asia-southeast1.firebasedatabase.app/"
    })


def get_latest_stream_url():
    """Ambil URL terbaru dari Firebase Realtime Database (node 'tunnels')."""
    ref = db.reference("tunnels")
    tunnels = ref.get()
    if not tunnels:
        return None

    latest_entry = max(
        tunnels.values(),
        key=lambda x: x.get("timestamp", "")
    )
    url = latest_entry.get("url")

    if url and "action=stream" not in url:
        url = url.rstrip("/") + "/?action=stream"

    return url


def generate_stream(source=0, detection=False, resize=(640, 480)):
    """Streaming video dari kamera lokal (OpenCV) atau MJPEG (requests)."""
    # --- Webcam lokal (pakai OpenCV) ---
    if isinstance(source, int):
        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            print(f"[ERROR] Tidak bisa buka kamera lokal index {source}")
            return

        while True:
            success, frame = cap.read()
            if not success:
                break

            if resize:
                frame = cv2.resize(frame, resize)

            if detection:
                cv2.putText(frame, "Fire Detection Mode", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            ret, buffer = cv2.imencode(".jpg", frame)
            if not ret:
                continue

            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")

    # --- MJPEG-streamer (pakai requests manual parsing) ---
    elif isinstance(source, str) and source.startswith("http"):
        yield from relay_stream(source, detection=detection, resize=resize)


def relay_stream(url, detection=False, resize=(640, 480)):
    """Relay MJPEG stream pakai requests (lebih aman dari pada OpenCV)."""
    try:
        r = requests.get(url, stream=True, timeout=10)
        if r.status_code != 200:
            print(f"[ERROR] Gagal buka stream: {url}, status {r.status_code}")
            return

        bytes_data = b""
        for chunk in r.iter_content(chunk_size=1024):
            bytes_data += chunk
            a = bytes_data.find(b"\xff\xd8")  # start JPEG
            b = bytes_data.find(b"\xff\xd9")  # end JPEG
            if a != -1 and b != -1:
                jpg = bytes_data[a:b+2]
                bytes_data = bytes_data[b+2:]  # buang buffer lama (biar ga delay)

                frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
                if frame is None:
                    continue

                if resize:
                    frame = cv2.resize(frame, resize)

                if detection:
                    cv2.putText(frame, "Fire Detection Mode", (10, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

                ret, buffer = cv2.imencode(".jpg", frame)
                if not ret:
                    continue

                yield (b"--frame\r\n"
                       b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")
    except Exception as e:
        print(f"[ERROR] Relay stream error: {e}")


@video_blueprint.route("/video/raw")
def video_raw():
    """Streaming video asli (ambil link terbaru dari Firebase)."""
    url = get_latest_stream_url()
    if not url:
        return "No stream URL found in Firebase", 404

    return Response(generate_stream(url),
                    mimetype="multipart/x-mixed-replace; boundary=frame")


@video_blueprint.route("/video/detection")
def video_detection():
    """Streaming video hasil deteksi kebakaran (kamera lokal eksternal)."""
    return Response(generate_stream(1, detection=True),
                    mimetype="multipart/x-mixed-replace; boundary=frame")
