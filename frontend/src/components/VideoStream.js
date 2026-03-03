import React, { useState, useRef, useEffect } from "react";

function VideoStream({ type }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // ============================================================
  // 1. Tentukan URL sumber berdasarkan type
  // ============================================================
const latestUrl =
    type === "fire"
      ? "http://127.0.0.1:5000/api/video/latest/detected_fire"
      : "https://infomatchacii.web.id/stream.mjpg";


  // ============================================================
  // 2. Metadata UI
  // ============================================================
  const { title, icon, bgColor } =
    type === "thermal"
      ? { title: "Thermal View", icon: "🌡️", bgColor: "bg-orange-500/20" }
      : type === "fire"
      ? { title: "Detected Fire", icon: "🔥", bgColor: "bg-red-500/20" }
      : { title: "External Stream", icon: "🌍", bgColor: "bg-blue-500/20" };

  // ============================================================
  // 3. Ambil frame terbaru (khusus thermal & fire)
  // ============================================================
  const fetchLatestImage = async () => {
    // External MJPEG → tidak fetch JSON
    if (type === "external") {
      setImageUrl(latestUrl);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch(`${latestUrl}?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data?.url) {
        setImageUrl(`${data.url}?t=${Date.now()}`); // anti-cache
        setIsError(false);
      } else {
        throw new Error("No URL found");
      }
    } catch (err) {
      console.error("Fetch image failed:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // 4. Auto-refresh frame hanya untuk thermal & fire
  // ============================================================
  useEffect(() => {
    fetchLatestImage();

    if (type !== "external") {
      const interval = setInterval(fetchLatestImage, 1000);
      return () => clearInterval(interval);
    }
  }, [latestUrl]);

  // ============================================================
  // 5. Fullscreen toggle
  // ============================================================
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // ============================================================
  // 6. Render Komponen
  // ============================================================
  return (
    <div
      ref={containerRef}
      className={`bg-gray-900 rounded-lg overflow-hidden transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "relative"
      }`}
    >
      {/* HEADER */}
      {!isFullscreen && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${bgColor}`}>
              <span className="text-xl">{icon}</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">{title}</h3>
              <p className="text-gray-300 text-sm">
                {type === "external"
                  ? "External MJPEG Stream"
                  : isError
                  ? "Connection Error"
                  : isLoading
                  ? "Fetching latest image..."
                  : "Latest Firebase Frame"}
              </p>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
          >
            {isFullscreen ? "❌" : "⛶"}
          </button>
        </div>
      )}

      {/* IMAGE / STREAM */}
      <div
        className={`relative bg-black ${
          isFullscreen ? "h-full" : "aspect-video"
        } flex items-center justify-center`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
              <p className="text-white text-sm mt-3">Loading...</p>
            </div>
          </div>
        )}

        {isError && (
          <p className="text-white">⚠️ Error loading image</p>
        )}

        {!isLoading && !isError && imageUrl && (
          <img
            src={imageUrl}
            alt={`${type} feed`}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* FOOTER */}
      {!isFullscreen && (
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
          <span>
            Source:{" "}
            {type === "external" ? "External Stream" : "Firebase Storage"}
          </span>
          <span>📡 Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}

export default VideoStream;
