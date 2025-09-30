from flask import Blueprint, jsonify, request
from firebase_admin import db
from backend.utils.auth_helper import token_required

reports_blueprint = Blueprint('reports', __name__)

@reports_blueprint.route('/reports', methods=['GET'])
@token_required
def get_reports(current_user):
    """
    API untuk mengambil daftar semua laporan kebakaran dari database.
    Memerlukan token JWT untuk otentikasi.
    """
    try:
        ref = db.reference('/fire_reports')
        reports = ref.get()
        if not reports:
            return jsonify({"message": "Tidak ada laporan ditemukan."}), 404
        
        return jsonify(reports), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
