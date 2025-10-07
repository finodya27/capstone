// frontend/src/pages/Analytics.js
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";

const Analytics = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar 
        onLogout={handleLogout} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
      
      <main 
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-20" : "ml-64"
        } p-6`}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
          <p className="text-gray-600 mt-2">
            Monitor drone performance, flight data, and sensor analytics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Flight Statistics</h2>
            <p className="text-gray-600">
              View detailed drone flight performance and historical data.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Sensor Data Analysis</h2>
            <p className="text-gray-600">
              Analyze temperature, humidity, and wind sensor readings over time.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;