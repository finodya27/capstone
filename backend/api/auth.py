# backend/api/auth.py
from flask import Blueprint, request, jsonify
from firebase_admin import db
import datetime

from backend.utils.auth_helper import generate_token, hash_password, check_password

auth_blueprint = Blueprint('auth', __name__)

@auth_blueprint.route('/login', methods=['POST'])
def login():
    """Autentikasi pengguna berdasarkan email dan password hash."""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Email dan password diperlukan."}), 400

        ref = db.reference('/users')
        user_data = ref.order_by_child('email').equal_to(email).get()

        if not user_data:
            return jsonify({"error": "Email atau password salah."}), 401

        user_key = list(user_data.keys())[0]
        user_info = user_data[user_key]

        if check_password(password, user_info['password']):
            token = generate_token(user_key)
            return jsonify({
                "token": token, 
                "email": email,
                "name": user_info.get('username', ''),
                "role": user_info.get('role', 'User')
            }), 200
        else:
            return jsonify({"error": "Email atau password salah."}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_blueprint.route('/register', methods=['POST'])
def register():
    """Menambahkan akun pengguna baru ke database."""
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        phone = data.get('phone', '')
        role = data.get('role', 'User')
        department = data.get('department', '')

        if not username or not email or not password:
            return jsonify({"error": "Username, email, dan password wajib diisi."}), 400

        # Cek apakah email sudah terdaftar
        ref = db.reference('/users')
        existing_user = ref.order_by_child('email').equal_to(email).get()
        
        if existing_user:
            return jsonify({"error": "Email sudah terdaftar."}), 400

        hashed_password = hash_password(password)

        new_user_ref = ref.push()
        new_user_ref.set({
            "username": username,
            "email": email,
            "password": hashed_password.decode('utf-8'),
            "phone": phone,
            "role": role,
            "department": department,
            "created_at": datetime.datetime.now().isoformat()
        })

        return jsonify({
            "message": "Pengguna berhasil didaftarkan.",
            "data": {
                "username": username,
                "email": email,
                "role": role
            }
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500