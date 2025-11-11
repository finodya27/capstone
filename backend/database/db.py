import os
import firebase_admin
from firebase_admin import credentials, db, firestore
from google.cloud import storage as gcs_storage
from dotenv import load_dotenv

# =====================================================
# Load .env secara eksplisit dari folder backend/
# =====================================================
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
    print(f"🧩 .env ditemukan dan dimuat dari: {dotenv_path}")
else:
    print("⚠️ File .env tidak ditemukan, pastikan ada di folder backend/")

# =====================================================
# Firebase Initialization
# =====================================================
def initialize_firebase():
    """
    Inisialisasi Firebase Admin SDK untuk:
    - Realtime Database
    - Cloud Firestore
    - Cloud Storage (GCS)
    """
    try:
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        if not cred_path or not os.path.exists(cred_path):
            raise FileNotFoundError(
                f"❌ File kredensial Firebase tidak ditemukan di path: {cred_path}"
            )

        # =====================================================
        # Inisialisasi Firebase hanya sekali
        # =====================================================
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, {
                "databaseURL": (
                    "https://drone-monitoring-system-fef66-default-rtdb."
                    "asia-southeast1.firebasedatabase.app"
                ),
                "storageBucket": "drone-monitoring-system-fef66.firebasestorage.app"
            })
            print("✅ Firebase berhasil diinisialisasi (RealtimeDB + Firestore + Storage)")
        else:
            print("ℹ️ Firebase sudah diinisialisasi sebelumnya, skip re-init.")

        # =====================================================
        # Tes koneksi ke Google Cloud Storage (pakai .firebasestorage.app)
        # =====================================================
        try:
            bucket_name = "drone-monitoring-system-fef66.firebasestorage.app"
            client = gcs_storage.Client.from_service_account_json(cred_path)
            bucket = client.bucket(bucket_name)
            print(f"📦 GCS bucket aktif: {bucket.name}")

            blobs = list(bucket.list_blobs(max_results=3))
            if blobs:
                print(f"📸 Contoh file di bucket: {[b.name for b in blobs[:3]]}")
            else:
                print("ℹ️ Bucket aktif tetapi kosong.")
        except Exception as e:
            print(f"⚠️ Gagal memverifikasi koneksi GCS: {e}")

    except Exception as e:
        print(f"❌ Error saat inisialisasi Firebase: {e}")


# =====================================================
# Helper Functions
# =====================================================
def get_realtime_db_ref(path="/"):
    """Mengambil referensi Realtime Database pada path tertentu."""
    try:
        ref = db.reference(path)
        print(f"🔗 Realtime DB aktif di path: {path}")
        return ref
    except Exception as e:
        print(f"⚠️ Gagal mengakses Realtime Database: {e}")
        return None


def get_firestore_client():
    """Mengembalikan client Firestore."""
    try:
        client = firestore.client()
        print("🔥 Firestore client aktif.")
        return client
    except Exception as e:
        print(f"⚠️ Gagal mengakses Firestore: {e}")
        return None


def get_storage_bucket():
    """
    Mengembalikan bucket menggunakan Google Cloud Storage client
    (karena Firebase Admin SDK pakai domain .firebasestorage.app).
    """
    try:
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        if not cred_path or not os.path.exists(cred_path):
            raise FileNotFoundError("File kredensial tidak ditemukan atau path kosong.")

        bucket_name = "drone-monitoring-system-fef66.firebasestorage.app"
        client = gcs_storage.Client.from_service_account_json(cred_path)
        bucket = client.bucket(bucket_name)
        print(f"📦 Storage bucket aktif (GCS): {bucket.name}")
        return bucket
    except Exception as e:
        print(f"⚠️ Gagal mengakses Storage (GCS): {e}")
        return None


def debug_list_files_in_folder(folder_name: str, limit=5):
    """Debug helper untuk menampilkan isi folder Storage."""
    try:
        bucket = get_storage_bucket()
        if not bucket:
            print("❌ Bucket tidak ditemukan atau tidak dapat diakses.")
            return []

        print(f"📂 Mengecek folder '{folder_name}/' di bucket: {bucket.name}")

        blobs = list(bucket.list_blobs(prefix=f"{folder_name}/"))
        if not blobs:
            print(f"[INFO] Tidak ada file ditemukan di folder '{folder_name}/'")
            return []

        sorted_blobs = sorted(blobs, key=lambda x: x.updated, reverse=True)
        print(f"✅ Menemukan {len(sorted_blobs)} file di folder '{folder_name}/'")

        for blob in sorted_blobs[:limit]:
            print(f"📸 {blob.name} | Updated: {blob.updated} | Size: {blob.size} bytes")

        return sorted_blobs[:limit]
    except Exception as e:
        print(f"⚠️ Error saat memeriksa folder Storage: {e}")
        return []
