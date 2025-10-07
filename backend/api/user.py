# backend/api/user.py
from flask import Blueprint, request, jsonify
from firebase_admin import db, storage
from backend.utils.auth_helper import token_required
import datetime
import base64
import uuid

user_blueprint = Blueprint('user', __name__)

@user_blueprint.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Mendapatkan data profil user yang sedang login."""
    try:
        ref = db.reference(f'/users/{current_user}')
        user_data = ref.get()
        
        if not user_data:
            return jsonify({"error": "User tidak ditemukan."}), 404
        
        # Jangan kirim password ke frontend
        user_data.pop('password', None)
        
        return jsonify({
            "data": {
                "name": user_data.get('username', ''),
                "email": user_data.get('email', ''),
                "phone": user_data.get('phone', ''),
                "role": user_data.get('role', 'User'),
                "department": user_data.get('department', ''),
                "profileImage": user_data.get('profileImage', None)
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@user_blueprint.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update data profil user."""
    try:
        # Cek apakah ada file upload atau form data biasa
        if request.content_type and 'multipart/form-data' in request.content_type:
            # Ada file upload
            name = request.form.get('name')
            email = request.form.get('email')
            phone = request.form.get('phone')
            role = request.form.get('role')
            department = request.form.get('department')
            profile_image = request.files.get('profileImage')
        else:
            # JSON biasa
            data = request.json
            name = data.get('name')
            email = data.get('email')
            phone = data.get('phone')
            role = data.get('role')
            department = data.get('department')
            profile_image = None
        
        ref = db.reference(f'/users/{current_user}')
        user_data = ref.get()
        
        if not user_data:
            return jsonify({"error": "User tidak ditemukan."}), 404
        
        # Update data
        update_data = {
            "username": name or user_data.get('username'),
            "email": email or user_data.get('email'),
            "phone": phone or user_data.get('phone', ''),
            "role": role or user_data.get('role', 'User'),
            "department": department or user_data.get('department', ''),
            "updated_at": datetime.datetime.now().isoformat()
        }
        
        # Handle profile image upload
        if profile_image:
            try:
                # Baca file dan convert ke base64
                image_data = profile_image.read()
                image_base64 = base64.b64encode(image_data).decode('utf-8')
                image_type = profile_image.content_type or 'image/jpeg'
                
                # Simpan sebagai data URL
                update_data['profileImage'] = f"data:{image_type};base64,{image_base64}"
            except Exception as img_error:
                print(f"Error uploading image: {img_error}")
        
        ref.update(update_data)
        
        return jsonify({
            "message": "Profile berhasil diupdate.",
            "data": {
                "name": update_data['username'],
                "email": update_data['email'],
                "phone": update_data['phone'],
                "role": update_data['role'],
                "department": update_data['department'],
                "profileImage": update_data.get('profileImage')
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@user_blueprint.route('/all', methods=['GET'])
@token_required
def get_all_users(current_user):
    """Mendapatkan semua data user (untuk admin)."""
    try:
        ref = db.reference('/users')
        users_data = ref.get()
        
        if not users_data:
            return jsonify({"data": []}), 200
        
        users_list = []
        for user_id, user_info in users_data.items():
            user_info.pop('password', None)  # Jangan kirim password
            users_list.append({
                "id": user_id,
                "name": user_info.get('username'),
                "email": user_info.get('email'),
                "role": user_info.get('role', 'User'),
                "department": user_info.get('department', ''),
                "created_at": user_info.get('created_at')
            })
        
        return jsonify({"data": users_list}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500