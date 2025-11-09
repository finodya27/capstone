# backend/api/auth.py
from flask import Blueprint, request, jsonify
from firebase_admin import db
import datetime
import traceback
from backend.utils.auth_helper import generate_token, hash_password, check_password

auth_blueprint = Blueprint("auth", __name__)

# =====================================================
# LOGIN
# =====================================================
@auth_blueprint.route("/login", methods=["POST"])
def login():
    """Autentikasi pengguna berdasarkan email dan password hash."""
    try:
        data = request.json or {}
        email = data.get("email")
        password = data.get("password")

        print(f"📩 Login attempt: {email}")

        if not email or not password:
            return jsonify({"error": "Email dan password diperlukan."}), 400

        ref = db.reference("/users")
        user_data = ref.order_by_child("email").equal_to(email).get()

        if not user_data:
            print("❌ User tidak ditemukan di Firebase.")
            return jsonify({"error": "Email atau password salah."}), 401

        user_key = list(user_data.keys())[0]
        user_info = user_data[user_key]

        stored_hash = user_info.get("password", "")
        print(f"🔒 Stored hash (awal): {stored_hash[:15]}...")

        if check_password(password, stored_hash):
            token = generate_token(user_key)
            print(f"✅ Login sukses untuk: {email}")
            return jsonify({
                "token": token,
                "email": email,
                "name": user_info.get("username", ""),
                "role": user_info.get("role", "User")
            }), 200
        else:
            print("❌ Password salah untuk:", email)
            return jsonify({"error": "Email atau password salah."}), 401

    except Exception as e:
        print("🔥 ERROR di login:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# =====================================================
# REGISTER
# =====================================================
@auth_blueprint.route("/register", methods=["POST"])
def register():
    """Menambahkan akun pengguna baru ke database."""
    try:
        data = request.json or {}
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")
        phone = data.get("phone", "")
        role = data.get("role", "User")
        department = data.get("department", "")

        print(f"🧾 Register attempt: {email}")

        if not username or not email or not password:
            return jsonify({"error": "Username, email, dan password wajib diisi."}), 400

        ref = db.reference("/users")
        existing_user = ref.order_by_child("email").equal_to(email).get()

        if existing_user:
            print("⚠️ Email sudah terdaftar:", email)
            return jsonify({"error": "Email sudah terdaftar."}), 400

        hashed_password = hash_password(password)
        hashed_str = hashed_password.decode("utf-8")

        new_user_ref = ref.push()
        new_user_ref.set({
            "username": username,
            "email": email,
            "password": hashed_str,
            "phone": phone,
            "role": role,
            "department": department,
            "created_at": datetime.datetime.now().isoformat()
        })

        print(f"✅ User {email} berhasil diregister.")
        return jsonify({
            "message": "Pengguna berhasil didaftarkan.",
            "data": {
                "username": username,
                "email": email,
                "role": role
            }
        }), 201

    except Exception as e:
        print("🔥 ERROR di register:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
