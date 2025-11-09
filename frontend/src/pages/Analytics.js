// frontend/src/pages/Analytics.js
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import api from "../utils/api";

// 🧩 Data Dummy sementara
const sampleLogs = [
  {
    id: 1,
    start_time: "2025-11-01 08:12:00",
    duration: "12m 20s",
    location: "-7.771, 110.375",
    battery: 68,
    fire_detected: true,
    summary: [
      "Sistem online dan siap terbang.",
      "Mode penerbangan: STABILIZE.",
      "GPS terkunci pada ketinggian 212 meter.",
      "Mode berganti: ALT_HOLD → LOITER.",
      "Drone ARM dan lepas landas.",
      "Koneksi sempat terputus namun tersambung kembali.",
      "Mode LAND untuk pendaratan.",
      "Drone DISARM setelah deteksi pendaratan aman.",
    ],
  },
  {
    id: 2,
    start_time: "2025-11-04 09:10:00",
    duration: "8m 43s",
    location: "-7.769, 110.376",
    battery: 75,
    fire_detected: false,
    summary: [
      "Sistem dinyalakan dan kalibrasi barometer.",
      "GPS kehilangan sinyal sesaat lalu kembali normal.",
      "Mode STABILIZE → LOITER.",
      "Tidak ada deteksi api selama misi.",
      "Drone mendarat manual tanpa anomali.",
    ],
  },
  {
    id: 3,
    start_time: "2025-11-07 10:05:00",
    duration: "15m 10s",
    location: "-7.773, 110.372",
    battery: 52,
    fire_detected: true,
    summary: [
      "Sistem aktif, semua sensor OK.",
      "Mode STABILIZE diaktifkan, lalu LOITER.",
      "GPS lock stabil di 210 meter.",
      "Terdeteksi potensi kebakaran — sensor suhu meningkat.",
      "Mode LAND otomatis setelah deteksi crash ringan.",
      "Drone DISARM dan log tersimpan.",
    ],
  },
];

const Analytics = () => {
  const [flightLogs, setFlightLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const USE_DUMMY_DATA = true;

  const stats = {
    firesDetected: 132,
    avgResponse: "3m 12s",
    topArea: "Kecamatan Banyumanik",
    totalFlightTime: "42 jam 15m",
  };

  const fireTrendData = [
    { month: "Jan", fires: 8 },
    { month: "Feb", fires: 12 },
    { month: "Mar", fires: 15 },
    { month: "Apr", fires: 9 },
    { month: "Mei", fires: 10 },
    { month: "Jun", fires: 14 },
    { month: "Jul", fires: 18 },
    { month: "Agu", fires: 21 },
    { month: "Sep", fires: 17 },
    { month: "Okt", fires: 20 },
    { month: "Nov", fires: 25 },
    { month: "Des", fires: 23 },
  ];

  const areaDistribution = [
    { area: "Tembalang", fires: 45 },
    { area: "Banyumanik", fires: 37 },
    { area: "Pedurungan", fires: 22 },
    { area: "Gajahmungkur", fires: 15 },
    { area: "Candisari", fires: 13 },
  ];

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        if (USE_DUMMY_DATA) {
          setFlightLogs(sampleLogs);
        } else {
          const res = await api.get("/flight-logs");
          setFlightLogs(res.data.logs);
        }
      } catch (err) {
        console.warn("⚠️ Gagal ambil data API, fallback ke dummy.");
        setFlightLogs(sampleLogs);
      }
    };
    fetchLogs();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <Layout
      pageTitle="Analytics"
      subtitle="Analisis Performa & Data Kebakaran "
      connectionStatus="firebase"
      onLogout={handleLogout}
    >
      {/* Statistik Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "🔥 Kebakaran Terdeteksi",
            value: stats.firesDetected,
            color: "text-red-500",
          },
          {
            label: "🕒 Waktu Respons Rata-rata",
            value: stats.avgResponse,
            color: "text-yellow-500",
          },
          {
            label: "📍 Area Terbanyak",
            value: stats.topArea,
            color: "text-green-600",
          },
          {
            label: "🚁 Durasi Penerbangan",
            value: stats.totalFlightTime,
            color: "text-blue-500",
          },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-md p-5 border border-gray-200">
            <p className="text-gray-500 text-sm">{item.label}</p>
            <h2 className={`text-2xl font-semibold mt-2 ${item.color}`}>
              {item.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🔥 Tren Kebakaran per Bulan (2025)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={fireTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="fires" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📍 Distribusi Lokasi Kebakaran
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={areaDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="area" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="fires" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Log Penerbangan */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📜 Log Penerbangan Drone
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-50 rounded-xl overflow-hidden text-gray-800">
            <thead className="bg-gray-200">
              <tr>
                {["Waktu Mulai", "Durasi", "Lokasi", "Battery", "Deteksi Api", "Aksi"].map((header, i) => (
                  <th key={i} className="px-4 py-2 text-left text-sm font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flightLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-t border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <td className="px-4 py-2">{log.start_time}</td>
                  <td className="px-4 py-2">{log.duration}</td>
                  <td className="px-4 py-2">{log.location}</td>
                  <td className="px-4 py-2 text-blue-600">{log.battery}%</td>
                  <td className="px-4 py-2">
                    {log.fire_detected ? (
                      <span className="text-red-500 font-semibold">🔥 Ya</span>
                    ) : (
                      <span className="text-gray-500">Tidak</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
                    >
                      Lihat Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Detail Penerbangan #{selectedLog.id}
            </h2>
            <p className="text-gray-500 mb-4">
              Waktu Mulai: {selectedLog.start_time} <br />
              Durasi: {selectedLog.duration} <br />
              Lokasi: {selectedLog.location}
            </p>
            <ul className="list-disc ml-5 text-gray-700 space-y-1 mb-4">
              {selectedLog.summary.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
            <div className="text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Analytics;
