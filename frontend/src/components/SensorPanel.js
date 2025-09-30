import React, { useState } from "react";
import axios from "../utils/api";  // sesuaikan path jika berbeda

const SensorPanel = ({ sensorData }) => {
  // State untuk servo control
  const [servoChannel, setServoChannel] = useState(9);
  const [servoPwm, setServoPwm] = useState(1500);
  const [servoMessage, setServoMessage] = useState("");

  if (!sensorData) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-4 rounded mb-2"></div>
          <div className="bg-gray-200 h-4 rounded mb-2"></div>
          <div className="bg-gray-200 h-4 rounded"></div>
        </div>
        <p className="text-gray-500 mt-2">Menunggu data sensor...</p>
      </div>
    );
  }

  const {
    humidity = "N/A",
    distance = "N/A", 
    temperature = "N/A",
    windDirection = "N/A",
    windSpeed = "N/A",
    timestamp
  } = sensorData;

  // Fungsi untuk mendapatkan arah mata angin
  const getWindDirection = (degrees) => {
    if (degrees === "N/A") return "N/A";
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  // Fungsi untuk mendapatkan warna berdasarkan nilai
  const getHumidityColor = (value) => {
    if (value === "N/A") return "text-gray-500";
    if (value < 30) return "text-red-500";
    if (value < 60) return "text-yellow-500";
    return "text-green-500";
  };

  const getTemperatureColor = (value) => {
    if (value === "N/A") return "text-gray-500";
    if (value > 35) return "text-red-500";
    if (value > 25) return "text-yellow-500";
    return "text-blue-500";
  };

  const getWindSpeedLevel = (speed) => {
    if (speed === "N/A") return { level: "N/A", color: "text-gray-500" };
    if (speed < 5) return { level: "Calm", color: "text-green-500" };
    if (speed < 15) return { level: "Moderate", color: "text-yellow-500" };
    if (speed < 25) return { level: "Strong", color: "text-orange-500" };
    return { level: "Very Strong", color: "text-red-500" };
  };

  // Fungsi untuk kirim perintah servo ke backend
  const moveServo = async () => {
    try {
      await axios.post("/servo/move", {
        channel: servoChannel,
        pwm: servoPwm,
      });
      setServoMessage(`Servo channel ${servoChannel} moved to PWM ${servoPwm}`);
    } catch (error) {
      setServoMessage(
        "Error: " +
          (error.response?.data?.error || error.message || "Unknown error")
      );
    }
  };

  const windLevel = getWindSpeedLevel(windSpeed);

  return (
    <div className="p-4">
      <div className="space-y-4">
        {/* Humidity */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.21 15c.68-1.15 1.4-2.3 2.16-3.41a25.65 25.65 0 002.16-3.41c.68-1.15 1.4-2.3 2.16-3.41a1 1 0 011.73 0c.76 1.11 1.48 2.26 2.16 3.41.76 1.11 1.48 2.26 2.16 3.41.68 1.15 1.4 2.3 2.16 3.41" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Humidity</p>
              <p className={`text-lg font-bold ${getHumidityColor(humidity)}`}>
                {humidity}%
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                style={{ width: humidity !== "N/A" ? `${Math.min(humidity, 100)}%` : "0%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Distance */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Distance Sensor</p>
              <p className="text-lg font-bold text-purple-600">
                {distance} cm
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">Range: 0-500cm</span>
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-full">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Temperature</p>
              <p className={`text-lg font-bold ${getTemperatureColor(temperature)}`}>
                {temperature}°C
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 via-yellow-400 to-red-600 transition-all duration-500"
                style={{ width: temperature !== "N/A" ? `${Math.min((temperature / 50) * 100, 100)}%` : "0%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Wind Direction */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full">
              <svg 
                className="w-5 h-5 text-green-600 transition-transform duration-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ transform: `rotate(${windDirection !== "N/A" ? windDirection : 0}deg)` }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l-7-7 7-7m5 14l-7-7 7-7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Wind Direction</p>
              <p className="text-lg font-bold text-green-600">
                {getWindDirection(windDirection)} ({windDirection}°)
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div 
                className="w-1 h-4 bg-green-600 rounded-full transition-transform duration-500"
                style={{ transform: `rotate(${windDirection !== "N/A" ? windDirection : 0}deg)` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Wind Speed */}
        <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-200">
          <div className="flex items-center space-x-3">
            <div className="bg-teal-100 p-2 rounded-full">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M7 7h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Wind Speed</p>
              <p className={`text-lg font-bold ${windLevel.color}`}>
                {windSpeed} m/s
              </p>
              <p className={`text-xs ${windLevel.color}`}>
                {windLevel.level}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex space-x-1">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`w-1 h-6 rounded-full transition-all duration-500 ${
                    windSpeed !== "N/A" && windSpeed >= bar * 6
                      ? "bg-teal-600"
                      : "bg-gray-200"
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Timestamp */}
        {timestamp && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 flex items-center justify-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {new Date(timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Tambahan: Kontrol Servo */}
      <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-indigo-100 p-2 rounded-full">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-indigo-800">Kontrol Servo</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channel (1-16)
            </label>
            <input
              type="number"
              value={servoChannel}
              onChange={(e) => setServoChannel(Number(e.target.value))}
              min={1}
              max={16}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PWM (1100-1900)
            </label>
            <input
              type="number"
              value={servoPwm}
              onChange={(e) => setServoPwm(Number(e.target.value))}
              min={1100}
              max={1900}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={moveServo}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
            >
              Gerakkan Servo
            </button>
          </div>
        </div>
        
        {/* PWM Slider untuk kemudahan */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PWM Slider: {servoPwm}
          </label>
          <input
            type="range"
            min="1100"
            max="1900"
            value={servoPwm}
            onChange={(e) => setServoPwm(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1100 (Min)</span>
            <span>1500 (Center)</span>
            <span>1900 (Max)</span>
          </div>
        </div>
        
        {servoMessage && (
          <div className={`p-3 rounded-md text-sm ${
            servoMessage.includes('Error') 
              ? 'bg-red-100 text-red-700 border border-red-300' 
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}>
            <div className="flex items-center">
              <svg 
                className={`w-4 h-4 mr-2 ${servoMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {servoMessage.includes('Error') ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              {servoMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorPanel;