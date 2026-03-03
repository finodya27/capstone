import React from "react";

const SensorPanel = ({ sensorData }) => {
  if (!sensorData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-xl h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse bg-gray-300 w-32 h-6 mx-auto rounded mb-2"></div>
          <p className="text-gray-500 text-sm">Menunggu data sensor...</p>
        </div>
      </div>
    );
  }

  const {
    humidity = "N/A",
    temperature = "N/A",
    timestamp,
  } = sensorData;

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4 text-blue-800 border-b pb-2">
        Status Sensor
      </h2>

      <div className="space-y-4 flex-1">

        {/* Humidity */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <p className="text-sm font-medium text-gray-600">Humidity</p>
            <p className={`text-lg font-bold ${getHumidityColor(humidity)}`}>
              {humidity}%
            </p>
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div>
            <p className="text-sm font-medium text-gray-600">Temperature</p>
            <p className={`text-lg font-bold ${getTemperatureColor(temperature)}`}>
              {temperature}°C
            </p>
          </div>
        </div>

        {/* Timestamp */}
        {timestamp && (
          <div className="pt-3 border-t text-xs text-gray-500 text-center">
            Last updated: {new Date(timestamp).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorPanel;
