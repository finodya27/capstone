# backend/utils/auth_helper.py
from flask import request, jsonify
import jwt
import datetime
import bcrypt
import os
from functools import wraps
import traceback

# =====================================================
# Load secret key dari environment
# =====================================================
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    print("⚠️ Peringatan: JWT_SECRET_KEY tidak ditemukan, gunakan default sementara.")
    SECRET_KEY = "default_secret_key"
else:
    # Hilangkan tanda kutip jika ada di .env
    SECRET_KEY = SECRET_KEY.strip().replace('"', '').replace("'", "")
print(f"🔐 JWT_SECRET_KEY Loaded: {SECRET_KEY[:8]}... (tersimpan aman)")

# =====================================================
# Fungsi untuk generate token JWT
# =====================================================
def generate_token(user_id: str) -> str:
    """Generate JWT token untuk user."""
    payload = {
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        "iat": datetime.datetime.utcnow(),
        "sub": user_id
    }

    try:
        print(f"🧩 Membuat token untuk user_id: {user_id}")
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        if isinstance(token, bytes):
            token = token.decode("utf-8")
        return token
    except Exception as e:
        print("🔥 ERROR saat generate_token:", e)
        traceback.print_exc()
        raise e

# =====================================================
# Fungsi hash & verifikasi password
# =====================================================
def hash_password(password: str) -> bytes:
    """Hash password menggunakan bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

def check_password(password: str, hashed_password: str) -> bool:
    """Verifikasi password dengan hash."""
    try:
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password)
    except Exception as e:
        print("⚠️ ERROR check_password:", e)
        traceback.print_exc()
        return False

# =====================================================
# Decorator validasi JWT token
# =====================================================
def token_required(f):
    """Decorator untuk memvalidasi JWT token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Ambil token dari Authorization header
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            parts = auth_header.split(" ")

            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
            elif len(parts) == 1:
                token = parts[0]

        if not token:
            return jsonify({
                "error": "Token tidak ditemukan",
                "message": "Authorization token is required"
            }), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = data["sub"]

        except jwt.ExpiredSignatureError:
            return jsonify({
                "error": "Token sudah kadaluarsa",
                "message": "Token has expired. Please login again."
            }), 401

        except jwt.InvalidTokenError:
            return jsonify({
                "error": "Token tidak valid",
                "message": "Invalid token. Please login again."
            }), 401

        except Exception as e:
            print("🔥 ERROR token_required:", e)
            traceback.print_exc()
            return jsonify({
                "error": "Token error",
                "message": str(e)
            }), 401

        return f(current_user, *args, **kwargs)
    return decorated
