import React, { useState, useRef, useEffect } from "react";

function VideoStream({ type }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Tentukan endpoint backend
const latestUrl =
  type === "thermal"
    ? "http://127.0.0.1:5000/api/video/latest/thermal_images"
    : "http://127.0.0.1:5000/api/video/latest/detected_fire";

  // Metadata tampilan
  const { title, icon, bgColor } =
    type === "thermal"
      ? { title: "Thermal View", icon: "🌡️", bgColor: "bg-orange-500/20" }
      : type === "fire"
      ? { title: "Detected Fire", icon: "🔥", bgColor: "bg-red-500/20" }
      : { title: "Live Stream", icon: "📹", bgColor: "bg-blue-500/20" };

  // Fungsi ambil gambar terbaru dari backend
  const fetchLatestImage = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(latestUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data?.url) {
        setImageUrl(data.url);
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

  // Ambil gambar pertama kali & refresh setiap 1 detik
  useEffect(() => {
    fetchLatestImage();
    const interval = setInterval(fetchLatestImage, 1000);
    return () => clearInterval(interval);
  }, [latestUrl]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bg-gray-900 rounded-lg overflow-hidden transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "relative"
      }`}
    >
      {/* Header */}
      {!isFullscreen && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${bgColor}`}>
              <span className="text-xl">{icon}</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">{title}</h3>
              <p className="text-gray-300 text-sm">
                {isError
                  ? "Connection Error"
                  : isLoading
                  ? "Fetching latest image..."
                  : "Live Feed from Firebase Storage"}
              </p>
            </div>
          </div>

          {/* Status + Controls */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isError
                  ? "bg-red-500"
                  : isLoading
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-green-500 animate-pulse"
              }`}
            ></div>
            <span className="text-gray-300 text-xs">
              {isError ? "Offline" : isLoading ? "Loading" : "Live"}
            </span>

            <button
              onClick={fetchLatestImage}
              className="ml-2 p-1 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
              title="Refresh Now"
            >
              🔄
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? "❌" : "⛶"}
            </button>
          </div>
        </div>
      )}

      {/* Image Display */}
      <div
        className={`relative bg-black ${
          isFullscreen ? "h-full" : "aspect-video"
        } flex items-center justify-center`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-sm">Loading latest frame...</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <svg
                className="w-16 h-16 text-red-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-white mb-2">Image Unavailable</p>
              <button
                onClick={fetchLatestImage}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!isLoading && !isError && imageUrl && (
          <img
            src={`http://127.0.0.1:5000/api/video/${type === "thermal" ? "thermal" : "detected-fire"}`}
            alt={`${type} stream`}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Footer */}
      {!isFullscreen && (
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <span>Source: Firebase</span>
            <span>•</span>
            <span>Auto Refresh: 5s</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📡 Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoStream;
