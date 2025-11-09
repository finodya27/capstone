// frontend/src/components/Sidebar.js
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png"; // ✅ sesuaikan nama file logo kamu

const Sidebar = ({ onLogout, isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Analytics", path: "/analytics", icon: "📈" },
    { name: "Settings", path: "/settings", icon: "⚙️" },
  ];

  const handleMenuItemClick = (path) => navigate(path);

  return (
    <div
      className={`h-screen bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 text-white
      flex flex-col justify-between fixed left-0 top-0
      transition-all duration-300 shadow-2xl z-40 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* ✅ Header — Logo + teks di bawahnya */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-5 border-b border-blue-600/50 flex flex-col items-center justify-center cursor-pointer group transition-all duration-300"
      >
        <img
          src={logo}
          alt="Fire Quad Logo"
          className={`transition-all duration-300 transform group-hover:scale-105 ${
            isCollapsed ? "w-10" : "w-28"
          } h-auto`}
          title="Klik untuk toggle sidebar"
        />

        {/* Teks di bawah logo */}
        {!isCollapsed && (
          <div className="mt-3 text-center transition-opacity duration-300">
            <h1 className="text-xl font-bold tracking-wide text-white font-['Orbitron']">
              Fire Quad
            </h1>
            <p className="text-xs text-blue-200 font-['Orbitron'] uppercase tracking-widest">
              System
            </p>
          </div>
        )}
      </div>

      {/* Navigasi */}
      <nav className="mt-3 flex flex-col space-y-2 px-3">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => handleMenuItemClick(item.path)}
            className={`flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${
              location.pathname === item.path
                ? "bg-blue-600 shadow-lg"
                : "hover:bg-blue-800/50"
            } ${isCollapsed ? "justify-center" : ""}`}
            title={isCollapsed ? item.name : ""}
          >
            <span className="text-xl">{item.icon}</span>
            {!isCollapsed && (
              <span className="ml-3 font-medium">{item.name}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Tombol Logout */}
      <div className="p-4 border-t border-blue-600/50">
        <button
          onClick={onLogout}
          className={`w-full flex items-center justify-center bg-red-600 hover:bg-red-700 py-3 rounded-lg transition shadow-lg ${
            isCollapsed ? "px-2" : "px-4"
          }`}
          title={isCollapsed ? "Logout" : ""}
        >
          <span className="text-lg">🔒</span>
          {!isCollapsed && <span className="ml-2 font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
