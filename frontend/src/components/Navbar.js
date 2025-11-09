// frontend/src/components/Navbar.js
import React from "react";

const Navbar = ({ title, subtitle, connectionStatus }) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case "pixhawk":
        return "bg-green-400 animate-pulse";
      case "firebase":
        return "bg-yellow-400";
      default:
        return "bg-red-400";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "pixhawk":
        return "Pixhawk Live";
      case "firebase":
        return "Firebase Fallback";
      default:
        return "Offline";
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 shadow-lg">
      <div className="px-6 py-4 flex justify-between items-center text-white">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-blue-200 text-sm">{subtitle}</p>
        </div>

        {/* Connection status indicator */}
        <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span className="text-sm">{getStatusText()}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
