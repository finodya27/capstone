import firebase_admin
from firebase_admin import credentials
import os

def initialize_firebase():
    """Menginisialisasi Firebase Admin SDK dengan kredensial yang disediakan."""
    try:
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://drone-monitoring-system-fef66-default-rtdb.asia-southeast1.firebasedatabase.app'
        })
        print("Firebase berhasil diinisialisasi!")
    except Exception as e:
        print(f"Error saat menginisialisasi Firebase: {e}")