// frontend/src/components/Layout.js
"use client";
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

/**
 * Layout global untuk semua halaman.
 * Navbar akan sticky di atas, Sidebar fixed di kiri.
 */
const Layout = ({ children, pageTitle, subtitle, connectionStatus, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 overflow-hidden">
      {/* Sidebar tetap fixed */}
      <Sidebar
        onLogout={onLogout}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Area kanan */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Navbar sticky di atas */}
        <div className="sticky top-0 z-50">
          <Navbar
            title={pageTitle}
            subtitle={subtitle}
            connectionStatus={connectionStatus}
          />
        </div>

        {/* Isi halaman scrollable */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
