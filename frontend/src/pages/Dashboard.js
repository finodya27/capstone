// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import MapView from "../components/MapView";
import TelemetryPanel from "../components/TelemetryPanel";
import SensorPanel from "../components/SensorPanel";
import FireAlerts from "../components/FireAlerts";
import VideoStream from "../components/VideoStream";
import FlightLog from "../components/FlightLog";
import api from "../utils/api";

const Dashboard = () => {
  const [telemetryData, setTelemetryData] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [fireAlerts, setFireAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const fetchTelemetryData = async () => {
    try {
      const res = await api.get("/telemetry/latest");
      if (res.data?.data) setTelemetryData(res.data.data);
    } catch {
      console.warn("⚠️ Telemetry unavailable.");
    }
  };

  const fetchSensorData = async () => {
    try {
      const res = await api.get("/sensors/latest");
      setSensorData(res.data.data);
    } catch {
      setSensorData({
        humidity: 48,
        distance: 120,
        temperature: 26,
        windDirection: 215,
        windSpeed: 8,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const fetchFireAlerts = async () => {
    try {
      const res = await api.get("/reports");
      if (res.data) {
        const data = Object.keys(res.data).map((key) => ({
          id: key,
          ...res.data[key],
        }));
        const sorted = data.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setFireAlerts(sorted);
      }
    } catch (err) {
      console.error("Gagal ambil data fire alerts:", err);
    }
  };

  useEffect(() => {
    const load = async () => {
      await Promise.all([
        fetchTelemetryData(),
        fetchSensorData(),
        fetchFireAlerts(),
      ]);
      setIsLoading(false);
    };
    load();

    const interval = setInterval(() => {
      fetchTelemetryData();
      fetchSensorData();
      fetchFireAlerts();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
        <div className="text-center">
          <div className="animate-spin h-14 w-14 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium">Loading Dashboard...</p>
          <p className="text-gray-400 text-sm">Menunggu data telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout
      pageTitle="Dashboard"
      subtitle="Real-time Monitoring"
      connectionStatus={telemetryData?.source}
      onLogout={handleLogout}
    >
      {!telemetryData && (
        <div
          className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6"
          role="alert"
        >
          <strong className="font-semibold">Perhatian:</strong> Data telemetry belum tersedia — menggunakan fallback data.
        </div>
      )}

      {/* GRID 1: Telemetry - Map - Sensor */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Telemetry */}
        <div className="xl:col-span-3 h-full flex">
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 w-full flex-1">
            <TelemetryPanel telemetryData={telemetryData} />
          </div>
        </div>

        {/* Map */}
        <div className="xl:col-span-6 h-full flex">
          <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 w-full flex-1">
            <MapView telemetryData={telemetryData} fireAlerts={fireAlerts} />
          </div>
        </div>

        {/* Sensor */}
        <div className="xl:col-span-3 h-full flex">
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 w-full flex-1">
            <SensorPanel sensorData={sensorData} />
          </div>
        </div>
      </div>

      {/* GRID 2: Fire Alerts */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 mt-6">
        <FireAlerts alerts={fireAlerts} />
      </div>

      {/* GRID 3: Video Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
          <VideoStream type="raw" />
        </div>
        <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
          <VideoStream type="detection" />
        </div>
      </div>

      {/* GRID 4: Flight Log */}
        <div className="mt-6">
            <FlightLog telemetryData={telemetryData} />
        </div>

    </Layout>
  );
};

export default Dashboard;
