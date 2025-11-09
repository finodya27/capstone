// frontend/src/components/SensorPanel.js
import React from "react";

const SensorPanel = ({ sensorData }) => {
  if (!sensorData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-xl h-full flex flex-col items-center justify-center">
        <div className="animate-pulse w-full max-w-xs">
          <div className="bg-gray-200 h-4 rounded mb-2"></div>
          <div className="bg-gray-300 h-4 rounded mb-2 w-3/4 mx-auto"></div>
          <div className="bg-gray-200 h-4 rounded w-1/2 mx-auto"></div>
        </div>
        <p className="text-gray-500 mt-4 text-center">
          Menunggu data sensor...
        </p>
      </div>
    );
  }

  const {
    humidity = "N/A",
    distance = "N/A",
    temperature = "N/A",
    windDirection = "N/A",
    windSpeed = "N/A",
    timestamp,
  } = sensorData;

  // Helper arah angin
  const getWindDirection = (deg) => {
    if (deg === "N/A") return "N/A";
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
  };

  const getHumidityColor = (v) => {
    if (v === "N/A") return "text-gray-500";
    if (v < 30) return "text-red-500";
    if (v < 60) return "text-yellow-500";
    return "text-green-600";
  };

  const getTemperatureColor = (v) => {
    if (v === "N/A") return "text-gray-500";
    if (v > 35) return "text-red-500";
    if (v > 25) return "text-yellow-500";
    return "text-blue-600";
  };

  const getWindSpeedLevel = (speed) => {
    if (speed === "N/A") return { level: "N/A", color: "text-gray-500" };
    if (speed < 5) return { level: "Calm", color: "text-green-500" };
    if (speed < 15) return { level: "Moderate", color: "text-yellow-500" };
    if (speed < 25) return { level: "Strong", color: "text-orange-500" };
    return { level: "Very Strong", color: "text-red-500" };
  };

  const windLevel = getWindSpeedLevel(windSpeed);

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4 text-blue-800 border-b pb-2">
        Status Sensor
      </h2>

      {/* Scrollable area agar sama tinggi dengan panel Telemetry */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {/* Humidity */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">💧</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Humidity</p>
              <p className={`text-lg font-bold ${getHumidityColor(humidity)}`}>
                {humidity}%
              </p>
            </div>
          </div>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-700 transition-all duration-500"
              style={{
                width: humidity !== "N/A" ? `${Math.min(humidity, 100)}%` : "0%",
              }}
            ></div>
          </div>
        </div>

        {/* Distance */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-full">📏</div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Distance Sensor
              </p>
              <p className="text-lg font-bold text-purple-600">{distance} cm</p>
            </div>
          </div>
          <span className="text-xs text-gray-500">Range 0–500cm</span>
        </div>

        {/* Temperature */}
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-full">🌡️</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Temperature</p>
              <p
                className={`text-lg font-bold ${getTemperatureColor(
                  temperature
                )}`}
              >
                {temperature}°C
              </p>
            </div>
          </div>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 via-yellow-400 to-red-500 transition-all duration-500"
              style={{
                width:
                  temperature !== "N/A"
                    ? `${Math.min((temperature / 50) * 100, 100)}%`
                    : "0%",
              }}
            ></div>
          </div>
        </div>

        {/* Wind Direction */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full">🧭</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Wind Direction</p>
              <p className="text-lg font-bold text-green-600">
                {getWindDirection(windDirection)} ({windDirection}°)
              </p>
            </div>
          </div>
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <div
              className="w-1 h-4 bg-green-600 rounded-full transition-transform duration-500"
              style={{
                transform: `rotate(${windDirection !== "N/A" ? windDirection : 0}deg)`,
              }}
            ></div>
          </div>
        </div>

        {/* Wind Speed */}
        <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-200">
          <div className="flex items-center space-x-3">
            <div className="bg-teal-100 p-2 rounded-full">💨</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Wind Speed</p>
              <p className={`text-lg font-bold ${windLevel.color}`}>
                {windSpeed} m/s
              </p>
              <p className={`text-xs ${windLevel.color}`}>{windLevel.level}</p>
            </div>
          </div>
          <div className="flex space-x-1">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={`w-1 h-6 rounded-full transition-all ${
                  windSpeed !== "N/A" && windSpeed >= bar * 6
                    ? "bg-teal-600"
                    : "bg-gray-200"
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Timestamp */}
        {timestamp && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 flex items-center justify-center">
              🕓 Last updated: {new Date(timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorPanel;
