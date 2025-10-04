import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://127.0.0.1:5000"; // ganti sesuai backendmu

export default function useTelemetry() {
  const [telemetry, setTelemetry] = useState(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("connect", () => {
      console.log("🔌 Connected to telemetry socket");
    });

    socket.on("telemetry", (data) => {
    console.log("📡 Telemetry:", data);
    setTelemetry(data);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from telemetry socket");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return telemetry;
}
