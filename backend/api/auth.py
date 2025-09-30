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

        # user_info['password'] disimpan di Firebase sebagai string hash
        if check_password(password, user_info['password']):
            token = generate_token(user_key)
            return jsonify({"token": token, "email": email}), 200
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

        if not username or not email or not password:
            return jsonify({"error": "Semua field wajib diisi."}), 400

        hashed_password = hash_password(password)

        ref = db.reference('/users')
        new_user_ref = ref.push()
        new_user_ref.set({
            "username": username,
            "email": email,
            "password": hashed_password.decode('utf-8'),  # simpan hash sebagai string
            "created_at": datetime.datetime.now().isoformat()
        })

        return jsonify({"message": "Pengguna berhasil didaftarkan."}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
