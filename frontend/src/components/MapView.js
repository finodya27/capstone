// frontend/src/components/MapView.js
import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Konfigurasi ikon default Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Komponen untuk memastikan map auto-resize saat container berubah ukuran
const ResizeHandler = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
    window.addEventListener("resize", () => map.invalidateSize());
    return () => window.removeEventListener("resize", () => map.invalidateSize());
  }, [map]);
  return null;
};

const MapView = ({ telemetryData, fireAlerts }) => {
  const mapRef = useRef();

  // Default posisi (misal Semarang)
  const defaultPosition = [-7.027623, 110.414056];

  // Gunakan posisi drone jika ada GPS valid
  const hasGps = telemetryData?.gps?.latitude && telemetryData?.gps?.longitude;
  const centerPosition = hasGps
    ? [telemetryData.gps.latitude, telemetryData.gps.longitude]
    : defaultPosition;

  const zoomLevel = hasGps ? 15 : 13;

  return (
    <div className="w-full h-full flex-1 min-h-[500px]">
      <MapContainer
        center={centerPosition}
        zoom={zoomLevel}
        ref={mapRef}
        className="w-full h-full flex-1 rounded-lg overflow-hidden"
        scrollWheelZoom={true}
      >
        <ResizeHandler />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Marker posisi drone */}
        {hasGps && (
          <Marker position={centerPosition}>
            <Popup>
              <div className="text-center">
                <b className="text-blue-600">🚁 Drone Location</b>
                <br />
                <span className="text-sm text-gray-600">
                  GPS: {telemetryData.gps.latitude.toFixed(6)},{" "}
                  {telemetryData.gps.longitude.toFixed(6)}
                </span>
                <br />
                <span className="text-sm">
                  Battery:{" "}
                  <span
                    className={`font-semibold ${
                      telemetryData.battery > 60
                        ? "text-green-600"
                        : telemetryData.battery > 30
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {telemetryData.battery ?? "N/A"}%
                  </span>
                </span>
                <br />
                <span className="text-sm text-gray-600">
                  Altitude: {telemetryData.altitude ?? "N/A"}m
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marker laporan kebakaran */}
        {(fireAlerts ?? []).map((alert, index) =>
          alert.location &&
          alert.location.latitude &&
          alert.location.longitude ? (
            <Marker
              key={alert.id || index}
              position={[alert.location.latitude, alert.location.longitude]}
            >
              <Popup>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-xl">🔥</span>
                    <b className="ml-2 text-red-600">Fire Detected!</b>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium text-gray-600">Time:</span>
                      <br />
                      <span className="text-gray-800">
                        {alert.timestamp
                          ? new Date(alert.timestamp).toLocaleString("id-ID")
                          : "N/A"}
                      </span>
                    </div>
                    {alert.severity && (
                      <div>
                        <span className="font-medium text-gray-600">
                          Severity:
                        </span>
                        <br />
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${
                            alert.severity.toLowerCase() === "critical"
                              ? "bg-red-500 text-white"
                              : alert.severity.toLowerCase() === "high"
                              ? "bg-orange-500 text-white"
                              : alert.severity.toLowerCase() === "medium"
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-500 text-white"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                    )}
                    {alert.confidence && (
                      <div>
                        <span className="font-medium text-gray-600">
                          Confidence:
                        </span>
                        <br />
                        <span className="text-gray-800">
                          {alert.confidence}%
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <span className="text-xs text-gray-500">
                        Coordinates:{" "}
                        {alert.location.latitude.toFixed(6)},{" "}
                        {alert.location.longitude.toFixed(6)}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
