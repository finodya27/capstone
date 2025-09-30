from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
import datetime
import bcrypt
import os
from functools import wraps

app = Flask(__name__)
CORS(app)  # Aktifkan CORS untuk semua rute

# Secret key
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default_secret_key")

def generate_token(user_id: str) -> str:
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
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def check_password(password: str, hashed_password: str) -> bool:
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split(" ")
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]

        if not token:
            return jsonify({'message': 'Token hilang'}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = data['sub']
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token sudah kadaluarsa'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token tidak valid'}), 401

        return f(current_user, *args, **kwargs)

    return decorated

# Contoh route
@app.route("/protected", methods=["GET"])
@token_required
def protected_route(current_user):
    return jsonify({"message": f"Hai, {current_user}! Ini adalah data rahasia."})

if __name__ == "__main__":
    app.run(debug=True)
