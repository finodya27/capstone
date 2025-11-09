// frontend/src/components/FlightLog.js
import React, { useState, useEffect } from "react";

const FlightLog = ({ telemetryData }) => {
  const [logs, setLogs] = useState([]);

  // Fungsi untuk menambah log baru
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString("id-ID", { hour12: false });
    setLogs((prev) => [{ time: timestamp, msg: message }, ...prev.slice(0, 49)]);
  };

  // Simulasi data hybrid (kalau belum ada koneksi drone)
  useEffect(() => {
    const hybridLogs = [
      "🟢 System initialized",
      "🔄 Checking GPS connection...",
      "📡 GPS fix acquired (12 satellites)",
      "⚙️ Mode: STABILIZE",
      "🔋 Battery 92%",
      "🛫 Takeoff initiated...",
      "⬆️ Altitude: 15m",
      "➡️ Heading: 90° (East)",
      "🔥 Fire detected near coordinates (-7.025, 110.412)",
      "🚨 Switching to AUTO mode",
      "📩 Sending fire report to GCS...",
      "✅ Data synchronized successfully.",
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < hybridLogs.length) {
        addLog(hybridLogs[i]);
        i++;
      } else {
        // Setelah selesai, loop terus dengan status random
        const random = [
          `⚡ Battery: ${(Math.random() * 100).toFixed(0)}%`,
          `📡 GPS: ${(Math.random() * 15).toFixed(0)} satellites`,
          `🌡️ Temp: ${(20 + Math.random() * 10).toFixed(1)}°C`,
          `🧭 Heading: ${(Math.random() * 360).toFixed(0)}°`,
          `📈 Altitude: ${(Math.random() * 100).toFixed(1)}m`,
        ];
        addLog(random[Math.floor(Math.random() * random.length)]);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Kalau nanti sudah terkoneksi drone, bisa ubah jadi:
  // useEffect(() => {
  //   if (telemetryData) addLog(`Telemetry update: ${JSON.stringify(telemetryData)}`);
  // }, [telemetryData]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 mt-6 overflow-hidden">
      <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">🧾 Flight Log</h2>
        <span className="text-xs opacity-80">Real-time Monitor</span>
      </div>

      <div className="h-64 overflow-y-auto font-mono text-sm bg-gray-50 p-4">
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">No log data available...</p>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className={`flex justify-between items-start border-b border-gray-200 py-1 ${
                idx === 0 ? "text-blue-700 font-semibold" : "text-gray-700"
              }`}
            >
              <span>{log.msg}</span>
              <span className="text-xs text-gray-400">{log.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FlightLog;
