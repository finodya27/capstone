import React, { useState, useEffect } from "react";
import MapView from "../components/MapView";
import TelemetryPanel from "../components/TelemetryPanel";
import SensorPanel from "../components/SensorPanel";
import FireAlerts from "../components/FireAlerts";
import VideoStream from "../components/VideoStream";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [telemetryData, setTelemetryData] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [fireAlerts, setFireAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fungsi logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/"); 
  };

  // Fetch data telemetry
  const fetchTelemetryData = async () => {
    try {
      const res = await api.get("/telemetry/latest");
      setTelemetryData(res.data.data);
    } catch (err) {
      console.error("Gagal ambil data telemetry:", err);
    }
  };

  // Fetch data sensor (simulasi - sesuaikan dengan endpoint API Anda)
  const fetchSensorData = async () => {
    try {
      // Ganti dengan endpoint API sensor yang sebenarnya
      const res = await api.get("/sensors/latest");
      setSensorData(res.data.data);
    } catch (err) {
      console.error("Gagal ambil data sensor:", err);
      // Simulasi data sensor jika API belum ada
      setSensorData({
        humidity: Math.floor(Math.random() * 100),
        distance: Math.floor(Math.random() * 500),
        temperature: Math.floor(Math.random() * 50) + 10,
        windDirection: Math.floor(Math.random() * 360),
        windSpeed: Math.floor(Math.random() * 30),
        timestamp: new Date().toISOString()
      });
    }
  };

  // Fetch data fire reports
  const fetchFireAlerts = async () => {
    try {
      const res = await api.get("/reports");
      if (res.data) {
        const data = Object.keys(res.data).map((key) => ({
          id: key,
          ...res.data[key],
        }));

        const sortedData = data.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        setFireAlerts(sortedData);
      }
    } catch (err) {
      console.error("Gagal ambil data fire alerts:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchTelemetryData(),
        fetchSensorData(),
        fetchFireAlerts()
      ]);
      setIsLoading(false);
    };

    loadData();

    // refresh setiap 10 detik
    const interval = setInterval(() => {
      fetchTelemetryData();
      fetchSensorData();
      fetchFireAlerts();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header dengan gradien dan shadow */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  Fire Quad System
                </h1>
                <p className="text-blue-100 text-sm">Real-time Monitoring Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white text-sm">Live</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Main Content Grid - 3 Columns: Telemetry, Map, Sensor */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-8">
          {/* Telemetry Panel - Kiri (3 columns) */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b flex-shrink-0">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Drone Telemetry
                </h3>
              </div>
              <div className="flex-grow overflow-y-auto">
                <TelemetryPanel telemetryData={telemetryData} />
              </div>
            </div>
          </div>

          {/* Map Section - Tengah (6 columns) */}
          <div className="xl:col-span-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Real-time Map
                </h2>
              </div>
              <div className="flex-grow p-6">
                <div className="h-full">
                  <MapView telemetryData={telemetryData} fireAlerts={fireAlerts} />
                </div>
              </div>
            </div>
          </div>

          {/* Sensor Panel - Kanan (3 columns) */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col">
              <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 border-b flex-shrink-0">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Environmental Sensors
                </h3>
              </div>
              <div className="flex-grow overflow-y-auto">
                <SensorPanel sensorData={sensorData} />
              </div>
            </div>
          </div>
        </div>

        {/* Fire Alerts Section - Full width di bawah */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Fire Detection Alerts
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  fireAlerts.length > 0 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {fireAlerts.length > 0 ? `${fireAlerts.length} Active Alerts` : 'All Clear'}
                </span>
              </h2>
            </div>
            <FireAlerts alerts={fireAlerts} />
          </div>
        </div>

        {/* Video Streaming Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Raw Camera Feed
              </h2>
            </div>
            <VideoStream type="raw" />
          </div>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
                Fire Detection Feed
              </h2>
            </div>
            <VideoStream type="detection" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;