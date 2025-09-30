from flask import Blueprint, request, jsonify
from backend.utils.pixhawk_helper import PixhawkHelper

servo_api = Blueprint('servo_api', __name__)

# Inisialisasi PixhawkHelper
pixhawk = PixhawkHelper()

@servo_api.route('/servo/move', methods=['POST'])
def move_servo():
    data = request.json
    servo_channel = data.get('channel')  # contoh: channel servo 9 (8 jika 0 based)
    pwm_value = data.get('pwm')          # contoh nilai PWM: 1100 - 1900
    
    if servo_channel is None or pwm_value is None:
        return jsonify({"error": "Missing channel or pwm"}), 400

    try:
        # Kirim perintah PWM ke servo channel
        pixhawk.vehicle.channels.overrides[str(servo_channel)] = pwm_value
        return jsonify({"status": "OK", "channel": servo_channel, "pwm": pwm_value})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
