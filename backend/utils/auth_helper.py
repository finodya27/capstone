# backend/utils/auth_helper.py
from flask import request, jsonify
import jwt
import datetime
import bcrypt
import os
from functools import wraps

# Secret key untuk JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default_secret_key")

def generate_token(user_id: str) -> str:
    """Generate JWT token untuk user."""
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        'iat': datetime.datetime.utcnow(),
        'sub': user_id
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return token

def hash_password(password: str) -> bytes:
    """Hash password menggunakan bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def check_password(password: str, hashed_password: str) -> bool:
    """Verifikasi password dengan hash."""
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password)

def token_required(f):
    """Decorator untuk memvalidasi JWT token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Ambil token dari Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            parts = auth_header.split(" ")
            
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
            elif len(parts) == 1:
                # Jika hanya token tanpa "Bearer"
                token = parts[0]

        if not token:
            return jsonify({
                'error': 'Token tidak ditemukan',
                'message': 'Authorization token is required'
            }), 401

        try:
            # Decode token
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = data['sub']
            
        except jwt.ExpiredSignatureError:
            return jsonify({
                'error': 'Token sudah kadaluarsa',
                'message': 'Token has expired. Please login again.'
            }), 401
            
        except jwt.InvalidTokenError:
            return jsonify({
                'error': 'Token tidak valid',
                'message': 'Invalid token. Please login again.'
            }), 401
        
        except Exception as e:
            return jsonify({
                'error': 'Token error',
                'message': str(e)
            }), 401

        # Pass current_user ke function
        return f(current_user, *args, **kwargs)

    return decorated