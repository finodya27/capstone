import React, { useState, useRef, useEffect } from "react";

function VideoStream({ type }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  const streamUrl =
    type === "detection"
      ? "http://127.0.0.1:5000/api/video/detection"
      : "http://127.0.0.1:5000/api/video/raw";

  const title = type === "detection" ? "Fire Detection Feed" : "Raw Camera Feed";
  const icon = type === "detection" ? "🔥" : "📹";

  // Handle image load
  const handleImageLoad = () => {
    setIsLoading(false);
    setIsError(false);
  };

  // Handle image error
  const handleImageError = () => {
    setIsLoading(false);
    setIsError(true);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Retry connection
  const handleRetry = () => {
    setIsLoading(true);
    setIsError(false);
    if (imgRef.current) {
      imgRef.current.src = streamUrl + '?t=' + new Date().getTime();
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`bg-gray-900 rounded-lg overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'relative'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            type === "detection" ? "bg-red-500/20" : "bg-blue-500/20"
          }`}>
            <span className="text-xl">{icon}</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">{title}</h3>
            <p className="text-gray-300 text-sm">
              {isError ? "Connection Error" : isLoading ? "Connecting..." : "Live Stream"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isError ? "bg-red-500" : isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500 animate-pulse"
            }`}></div>
            <span className="text-gray-300 text-xs">
              {isError ? "Offline" : isLoading ? "Loading" : "Live"}
            </span>
          </div>

          {/* Controls */}
          <div className="flex space-x-1">
            {isError && (
              <button
                onClick={handleRetry}
                className="p-1 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
                title="Retry Connection"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            
            <button
              onClick={toggleFullscreen}
              className="p-1 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
              title="Toggle Fullscreen"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isFullscreen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Video Content */}
      <div className={`relative bg-black ${isFullscreen ? 'h-full' : 'aspect-video'} flex items-center justify-center`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-sm">Connecting to stream...</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-white mb-2">Stream Unavailable</p>
              <p className="text-gray-400 text-sm mb-4">Unable to connect to camera feed</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        <img
          ref={imgRef}
          src={streamUrl}
          alt={`${type} stream`}
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            isLoading || isError ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Overlay info */}
        {!isLoading && !isError && (
          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
            <div className="flex items-center space-x-2 text-xs text-white">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              <span>REC</span>
              <span className="text-gray-300">•</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        )}

        {/* Detection overlay for fire detection feed */}
        {type === "detection" && !isLoading && !isError && (
          <div className="absolute bottom-2 right-2 bg-red-500/80 backdrop-blur-sm rounded px-2 py-1">
            <div className="flex items-center space-x-2 text-xs text-white">
              <span>🔥</span>
              <span>AI Detection Active</span>
            </div>
          </div>
        )}

        {/* Fullscreen overlay controls */}
        {isFullscreen && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="flex items-center space-x-4 text-white">
              <button
                onClick={toggleFullscreen}
                className="flex items-center space-x-2 hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-sm">Exit Fullscreen</span>
              </button>
              <span className="text-gray-400">•</span>
              <span className="text-sm">{title}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <span>Resolution: Auto</span>
          <span>•</span>
          <span>FPS: 30</span>
          <span>•</span>
          <span>Quality: {isError ? "Offline" : "HD"}</span>
        </div>
        <div className="flex items-center space-x-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Low Latency Stream</span>
        </div>
      </div>
    </div>
  );
}

export default VideoStream;