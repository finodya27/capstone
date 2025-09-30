import cv2

cap = cv2.VideoCapture(0)  # coba ganti ke 1 kalau ada webcam USB

while True:
    ret, frame = cap.read()
    if not ret:
        print("Tidak bisa akses kamera")
        break

    cv2.imshow("Kamera Test", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
