from flask import Response, Blueprint
import cv2
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

    # ambil berdasarkan timestamp terbaru
    latest_entry = max(
        tunnels.values(),
        key=lambda x: x.get("timestamp", "")
    )
    return latest_entry.get("url")

def generate_stream(source=0, detection=False):
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"[ERROR] Tidak bisa membuka video source: {source}")
        return

    while True:
        success, frame = cap.read()
        if not success:
            break

        if detection:
            cv2.putText(frame, "Fire Detection Mode", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        _, buffer = cv2.imencode(".jpg", frame)
        frame_bytes = buffer.tobytes()
        yield (b"--frame\r\n"
               b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")

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
