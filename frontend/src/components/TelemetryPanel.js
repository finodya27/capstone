import useTelemetry from "../hooks/useTelemetry";

const TelemetryPanel = () => {
  const telemetryData = useTelemetry();

  if (!telemetryData) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-4 rounded mb-2"></div>
          <div className="bg-gray-200 h-4 rounded mb-2"></div>
          <div className="bg-gray-200 h-4 rounded"></div>
        </div>
        <p className="text-gray-500 mt-2">Menunggu data telemetri...</p>
      </div>
    );
  }

  // destructuring dengan default biar aman
  const {
    battery = "N/A",
    altitude = "N/A",
    heading = "N/A",
    airspeed = "N/A",
    groundspeed = "N/A",
    attitude = {},
    gps = {},
  } = telemetryData;

  const toDegrees = (rad) =>
    rad !== undefined && rad !== null
      ? (rad * 180 / Math.PI).toFixed(2)
      : "N/A";

  const getBatteryColor = (level) => {
    if (level === "N/A") return "text-gray-500";
    if (level > 60) return "text-green-500";
    if (level > 30) return "text-yellow-500";
    return "text-red-500";
  };

  const getGpsStatus = (fixType, satellites) => {
    if (fixType === "N/A" || !satellites) return { status: "No Fix", color: "text-red-500" };
    if (fixType >= 3 && satellites >= 4) return { status: "Good Fix", color: "text-green-500" };
    if (fixType >= 2) return { status: "2D Fix", color: "text-yellow-500" };
    return { status: "Poor Fix", color: "text-orange-500" };
  };

  const gpsStatus = getGpsStatus(gps.fix_type, gps.satellites_visible);

  return (
    <div className="p-4">
      <div className="space-y-4">
        {/* Battery */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Battery</p>
              <p className={`text-lg font-bold ${getBatteryColor(battery)}`}>
                {battery}%
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="w-12 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  battery > 60 ? "bg-green-500" : 
                  battery > 30 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: battery !== "N/A" ? `${Math.min(battery, 100)}%` : "0%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Altitude */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Altitude</p>
              <p className="text-lg font-bold text-green-600">
                {altitude} m
              </p>
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <svg 
                className="w-5 h-5 text-purple-600 transition-transform duration-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ transform: `rotate(${heading !== "N/A" ? heading : 0}deg)` }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l-7-7 7-7m5 14l-7-7 7-7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Heading</p>
              <p className="text-lg font-bold text-purple-600">
                {heading}°
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <div 
                className="w-1 h-4 bg-purple-600 rounded-full transition-transform duration-500"
                style={{ transform: `rotate(${heading !== "N/A" ? heading : 0}deg)` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Speed */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center space-x-2 mb-1">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-xs font-medium text-gray-600">Airspeed</p>
            </div>
            <p className="text-sm font-bold text-orange-600">{airspeed} m/s</p>
          </div>
          <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
            <div className="flex items-center space-x-2 mb-1">
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p className="text-xs font-medium text-gray-600">Ground</p>
            </div>
            <p className="text-sm font-bold text-teal-600">{groundspeed} m/s</p>
          </div>
        </div>

        {/* Attitude */}
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center space-x-2 mb-2">
            <div className="bg-indigo-100 p-1 rounded-full">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600">Attitude (R/P/Y)</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <p className="text-gray-500">Roll</p>
              <p className="font-bold text-indigo-600">{toDegrees(attitude.roll)}°</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Pitch</p>
              <p className="font-bold text-indigo-600">{toDegrees(attitude.pitch)}°</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Yaw</p>
              <p className="font-bold text-indigo-600">{toDegrees(attitude.yaw)}°</p>
            </div>
          </div>
        </div>

        {/* GPS Status */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${gpsStatus.color.replace('text-', 'bg-')} animate-pulse`}></div>
              <p className="text-sm font-medium text-gray-600">GPS Status</p>
            </div>
            <span className={`text-sm font-medium ${gpsStatus.color}`}>
              {gpsStatus.status}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Latitude:</span>
              <span className="font-mono text-gray-800">{gps.latitude ?? "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span>Longitude:</span>
              <span className="font-mono text-gray-800">{gps.longitude ?? "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span>Satellites:</span>
              <span className="font-mono text-gray-800">{gps.satellites_visible ?? "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span>Fix Type:</span>
              <span className="font-mono text-gray-800">{gps.fix_type ?? "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryPanel;
