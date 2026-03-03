// frontend/src/components/FlightLog.js
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://127.0.0.1:5000";

const FlightLog = ({ telemetryData }) => {
  const [logs, setLogs] = useState([]);
  const [isDroneConnected, setIsDroneConnected] = useState(false);

  // Fungsi menambah log baru
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString("id-ID", { hour12: false });
    setLogs((prev) => [{ time: timestamp, msg: message }, ...prev.slice(0, 199)]);
  };

  // ============================
  // SOCKET.IO - Update Log MAVLink
  // ============================
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
    });

    // Terima log human-readable dari backend
    socket.on("flight_log", (data) => {
      if (data?.msg) {
        setIsDroneConnected(true); // ada pesan → drone dianggap aktif
        addLog(data.msg);
      }
    });

    // Jika Pixhawk kirim telemetri, set connected
    socket.on("telemetry", () => {
      setIsDroneConnected(true);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ============================
  // SIMULASI HYBRID — hanya aktif jika drone belum terhubung
  // ============================
  useEffect(() => {
    if (isDroneConnected) return; // matikan simulasi kalau drone aktif

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
      if (isDroneConnected) {
        clearInterval(interval);
        return;
      }

      if (i < hybridLogs.length) {
        addLog(hybridLogs[i]);
        i++;
      } else {
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
  }, [isDroneConnected]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 mt-6 overflow-hidden">
      <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">🧾 Flight Log</h2>
        <span className="text-xs opacity-80">
          {isDroneConnected ? "Realtime from Pixhawk" : "Simulator Mode"}
        </span>
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
