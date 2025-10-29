// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MapView from "../components/MapView";
import TelemetryPanel from "../components/TelemetryPanel";
import SensorPanel from "../components/SensorPanel";
import FireAlerts from "../components/FireAlerts";
import VideoStream from "../components/VideoStream";
import api from "../utils/api";

const Dashboard = () => {
    const [telemetryData, setTelemetryData] = useState(null);
    const [sensorData, setSensorData] = useState(null);
    const [fireAlerts, setFireAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();

    // Fungsi logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    // Ambil data telemetry
    const fetchTelemetryData = async () => {
        try {
            const res = await api.get("/telemetry/latest");
            // Backend sudah dijamin mengembalikan data.data jika berhasil (baik dari Pixhawk atau Firebase)
            if (res.data && res.data.data) {
                setTelemetryData(res.data.data);
            } else {
                 console.warn("Telemetry API mengembalikan status 200, tetapi data kosong.");
            }
        } catch (err) {
            // Walaupun ada error di backend (misal status 404 jika firebase kosong), 
            // kita harus tetap melanjutkan proses untuk mematikan loading.
            console.error("Gagal ambil data telemetry:", err);
            // setTelemetryData tetap null jika terjadi error 404
        }
    };

    // Ambil data sensor
    const fetchSensorData = async () => {
        try {
            const res = await api.get("/sensors/latest");
            setSensorData(res.data.data);
        } catch (err) {
            console.error("Gagal ambil data sensor:", err);
            // ✅ Data DUMMY untuk /sensors/latest (Sesuai dengan kode asli dan log 404)
            // Ini akan membuat SensorPanel tidak kosong sementara endpoint backend belum dibuat.
            setSensorData({
                humidity: Math.floor(Math.random() * 100),
                distance: Math.floor(Math.random() * 500),
                temperature: Math.floor(Math.random() * 50) + 10,
                windDirection: Math.floor(Math.random() * 360),
                windSpeed: Math.floor(Math.random() * 30),
                timestamp: new Date().toISOString(),
            });
        }
    };

    // Ambil data fire alert
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
            // setIsLoading(true); // Sudah true by default
            
            // Lakukan semua fetching secara paralel
            await Promise.all([
                fetchTelemetryData(),
                fetchSensorData(),
                fetchFireAlerts(),
            ]);
            
            // ✅ PERBAIKAN UTAMA: MATIKAN LOADING SETELAH SEMUA FETCH UPAYA PERTAMA SELESAI
            // Ini memastikan tampilan loading hilang, meskipun telemetryData mungkin null
            setIsLoading(false);
        };

        loadData();

        // Interval untuk refresh data
        const interval = setInterval(() => {
            fetchTelemetryData();
            fetchSensorData();
            fetchFireAlerts();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // Tampilan Loading
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading Dashboard...</p>
                    {/* Tampilkan pesan 'Menunggu data telemetry...' di bawah 'Loading Dashboard' */}
                    <p className="text-gray-500 text-sm mt-2">Menunggu data telemetry...</p>
                </div>
            </div>
        );
    }
    
    // Tampilan Dashboard Utama
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Sidebar 
                onLogout={handleLogout} 
                isCollapsed={isCollapsed} 
                setIsCollapsed={setIsCollapsed} 
            />

            <div 
                className={`flex-1 transition-all duration-300 ${
                    isCollapsed ? "ml-20" : "ml-64"
                } overflow-y-auto`}
            >
                {/* Header */}
                <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-md">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                Dashboard Monitoring
                            </h1>
                            <p className="text-blue-100 text-sm">
                                Real-time Fire Quad System
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                            {/* Tampilkan indikator status koneksi berdasarkan telemetryData */}
                            <div className={`w-2 h-2 rounded-full ${
                                telemetryData && telemetryData.source === 'pixhawk' ? 'bg-green-400 animate-pulse' : 
                                telemetryData && telemetryData.source === 'firebase' ? 'bg-yellow-400' : 'bg-red-400'
                            }`}></div>
                            <span className="text-white text-sm">
                                {telemetryData && telemetryData.source === 'pixhawk' ? 'Pixhawk Live' : 
                                 telemetryData && telemetryData.source === 'firebase' ? 'Firebase Fallback' : 'Offline'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Konten Utama */}
                <main className="p-6">
                    {/* Tampilkan peringatan jika data telemetry masih null setelah loading selesai */}
                    {!telemetryData && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                            <strong className="font-bold">Perhatian:</strong>
                            <span className="block sm:inline"> Data telemetry utama (Pixhawk/Firebase) tidak tersedia. Tampilan mungkin kosong.</span>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-8">
                        <div className="xl:col-span-3">
                            <TelemetryPanel telemetryData={telemetryData} />
                        </div>

                        <div className="xl:col-span-6">
                            <MapView telemetryData={telemetryData} fireAlerts={fireAlerts} />
                        </div>

                        <div className="xl:col-span-3">
                            <SensorPanel sensorData={sensorData} />
                        </div>
                    </div>

                    <div className="mt-8">
                        <FireAlerts alerts={fireAlerts} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        <VideoStream type="raw" />
                        <VideoStream type="detection" />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
