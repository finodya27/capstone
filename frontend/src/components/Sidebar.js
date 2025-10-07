// frontend/src/components/Sidebar.js
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = ({ onLogout, isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard Monitoring", path: "/dashboard", icon: "📊" },
    { name: "Analytics", path: "/analytics", icon: "📈" },
    { name: "Settings", path: "/settings", icon: "⚙️" },
  ];

  // Fungsi untuk menangani klik item menu
  const handleMenuItemClick = (path) => {
    navigate(path);
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`h-screen bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 text-white flex flex-col justify-between fixed left-0 top-0 transition-all duration-300 shadow-2xl z-40 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div>
          {/* Header */}
          <div className="p-6 border-b border-blue-600/50 flex items-center justify-between">
            <div className={`${isCollapsed ? "hidden" : ""}`}>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Fire Quad System
              </h1>
              <p className="text-sm text-blue-200 mt-1">Monitoring System</p>
            </div>
            {/* Tombol Toggle di dalam Sidebar */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`text-white text-2xl p-2 rounded-full transition-colors duration-200 hover:bg-white/20 ${
                isCollapsed ? "mx-auto" : ""
              }`}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              ☰
            </button>
          </div>

          {/* Navigasi */}
          <nav className="mt-6 flex flex-col space-y-2 px-3">
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
        </div>

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
    </>
  );
};

export default Sidebar;