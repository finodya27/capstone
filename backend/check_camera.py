import cv2

def check_cameras(max_index=5):
    for i in range(max_index):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            print(f"✅ Kamera index {i} tersedia")
            cap.release()
        else:
            print(f"❌ Kamera index {i} tidak terdeteksi")

check_cameras()
