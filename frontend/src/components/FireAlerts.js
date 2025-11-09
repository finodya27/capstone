import React from "react";

const FireAlerts = ({ alerts = [] }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-400 text-black";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 80) return "bg-green-500";
    if (conf >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // ✅ Jika belum ada deteksi
  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 shadow-md max-w-md">
          <svg
            className="w-14 h-14 text-green-500 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-green-700 mb-1">
            All Clear
          </h3>
          <p className="text-sm text-green-600">
            No fire alerts detected — system monitoring normally
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 border-b-2 border-blue-500 pb-2 text-center">
        Fire Detection Alerts
      </h2>

      {/* 🔥 1 alert = 1 baris berisi beberapa card */}
      <div className="space-y-6">
        {alerts.map((alert, index) => (
          <div
            key={alert.id || index}
            className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
          >
            <div className="flex flex-wrap justify-center gap-4">
              {/* Fire Detected */}
              <div className="flex-1 min-w-[180px] bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow p-4 flex flex-col items-center justify-center">
                <span className="text-3xl mb-2">🔥</span>
                <p className="font-bold text-lg">Fire Detected</p>
                <p className="text-xs opacity-80">{formatTime(alert.timestamp)}</p>
              </div>

              {/* Severity */}
              <div
                className={`flex-1 min-w-[180px] rounded-xl shadow p-4 flex flex-col items-center justify-center ${getSeverityColor(
                  alert.severity
                )}`}
              >
                <span className="text-3xl mb-2">⚠️</span>
                <p className="font-bold text-lg capitalize">
                  {alert.severity || "Unknown"}
                </p>
                <p className="text-xs opacity-80">Severity Level</p>
              </div>

              {/* Location */}
              <div className="flex-1 min-w-[180px] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl shadow p-4 flex flex-col items-center justify-center">
                <span className="text-3xl mb-2">📍</span>
                <p className="font-bold text-sm">
                  {alert.location?.latitude?.toFixed(5)},{" "}
                  {alert.location?.longitude?.toFixed(5)}
                </p>
                <p className="text-xs opacity-80">Location</p>
              </div>

              {/* Confidence */}
              <div className="flex-1 min-w-[180px] bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 rounded-xl shadow p-4 flex flex-col items-center justify-center border border-gray-200">
                <span className="text-3xl mb-2">🎯</span>
                <p className="font-bold text-lg">{alert.confidence ?? 0}%</p>
                <div className="w-24 h-2 bg-gray-300 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full ${getConfidenceColor(
                      alert.confidence
                    )}`}
                    style={{
                      width: `${Math.min(alert.confidence || 0, 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs opacity-70 mt-1">Confidence</p>
              </div>

              {/* Optional Description */}
              {alert.description && (
                <div className="flex-1 min-w-[200px] bg-gradient-to-br from-yellow-100 to-yellow-50 text-gray-800 rounded-xl shadow p-4 flex flex-col items-center justify-center border border-yellow-200">
                  <span className="text-2xl mb-1">📝</span>
                  <p className="italic text-sm text-center">
                    “{alert.description}”
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Additional Info</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FireAlerts;
