import firebase_admin
from firebase_admin import storage
import datetime

def get_latest_image(folder_name):
    """
    Mengambil URL gambar terbaru dari Firebase Storage (folder tertentu).
    folder_name bisa 'detected_fire' atau 'thermal_images'.
    """
    try:
        bucket = storage.bucket()
        blobs = list(bucket.list_blobs(prefix=f"{folder_name}/"))
        
        if not blobs:
            return None

        # Urutkan berdasarkan waktu pembuatan (descending)
        blobs.sort(key=lambda b: b.time_created, reverse=True)
        latest_blob = blobs[0]

        # Buat signed URL agar bisa diakses frontend (berlaku 1 jam)
        url = latest_blob.generate_signed_url(
            expiration=datetime.timedelta(hours=1),
            method="GET"
        )

        return {
            "name": latest_blob.name,
            "size": latest_blob.size,
            "url": url,
            "updated": latest_blob.updated.isoformat(),
        }

    except Exception as e:
        print(f"⚠️ Error ambil gambar dari Firebase Storage: {e}")
        return None
