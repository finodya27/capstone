import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ======================================================
// FIX ICON
// ======================================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// ======================================================
// Auto resize map
// ======================================================
const ResizeHandler = () => {
  const map = useMap();
  useEffect(() => {
    const resize = () => map.invalidateSize();
    setTimeout(resize, 300);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [map]);
  return null;
};

// ======================================================
// Auto follow marker
// ======================================================
const FollowDrone = ({ lat, lng }) => {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom(), {
        animate: true,
      });
    }
  }, [lat, lng, map]);

  return null;
};

// ======================================================
// MAIN MAP COMPONENT
// ======================================================
const MapView = ({ telemetryData, fireAlerts }) => {
  const mapRef = useRef();

  const defaultPosition = [-7.027623, 110.414056];

  // ✅ Ambil GPS dari 2 kemungkinan format
  const lat =
    telemetryData?.gps?.latitude ?? telemetryData?.latitude ?? null;
  const lng =
    telemetryData?.gps?.longitude ?? telemetryData?.longitude ?? null;

  const hasGps = !!(lat && lng);

  const centerPosition = hasGps ? [lat, lng] : defaultPosition;
  const zoomLevel = hasGps ? 16 : 13;

  const source = telemetryData?.source ?? "unknown";
  const isLive = source === "pixhawk";

  return (
    <div className="w-full h-full flex-1 min-h-[500px] relative">
      {/* Status Badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-white rounded-xl shadow-md px-4 py-2 text-sm font-bold flex items-center gap-2">
        <span
          className={`w-3 h-3 rounded-full ${
            isLive ? "bg-green-500" : "bg-orange-500"
          }`}
        />
        {isLive ? "LIVE - Pixhawk" : "OFFLINE - Firebase"}
      </div>

      <MapContainer
        center={centerPosition}
        zoom={zoomLevel}
        ref={mapRef}
        className="w-full h-full flex-1 rounded-lg overflow-hidden"
        scrollWheelZoom={true}
      >
        <ResizeHandler />
        {hasGps && <FollowDrone lat={lat} lng={lng} />}

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* ================= Drone Marker ================= */}
        {hasGps && (
          <Marker position={[lat, lng]}>
            <Popup>
              <div className="text-center">
                <b className="text-blue-600">🚁 Drone Location</b>
                <br />

                <span className="text-sm text-gray-600">
                  GPS: {lat.toFixed(6)}, {lng.toFixed(6)}
                </span>

                <br />
                <span className="text-sm">
                  Battery:{" "}
                  <span
                    className={`font-semibold ${
                      telemetryData?.battery > 60
                        ? "text-green-600"
                        : telemetryData?.battery > 30
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {telemetryData?.battery ?? "N/A"}%
                  </span>
                </span>

                <br />
                <span className="text-sm text-gray-600">
                  Altitude: {telemetryData?.altitude ?? "N/A"} m
                </span>

                <br />
                <span className="text-xs text-gray-500">
                  Source: {source}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ================= Fire Markers ================= */}
        {(fireAlerts ?? []).map((alert, index) =>
          alert?.location?.latitude && alert?.location?.longitude ? (
            <Marker
              key={alert.id || index}
              position={[
                alert.location.latitude,
                alert.location.longitude,
              ]}
            >
              <Popup>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-xl">🔥</span>
                    <b className="ml-2 text-red-600">
                      Fire Detected!
                    </b>
                  </div>

                  <div className="text-sm space-y-1">
                    <div>
                      <b>Time:</b>
                      <br />
                      {alert.timestamp
                        ? new Date(alert.timestamp).toLocaleString(
                            "id-ID"
                          )
                        : "N/A"}
                    </div>

                    {alert.severity && (
                      <div>
                        <b>Severity:</b>
                        <br />
                        <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-red-500 text-white">
                          {alert.severity}
                        </span>
                      </div>
                    )}

                    {alert.confidence && (
                      <div>
                        <b>Confidence:</b>
                        <br />
                        {alert.confidence}%
                      </div>
                    )}

                    <div className="pt-2 border-t text-xs text-gray-500">
                      {alert.location.latitude.toFixed(6)},{" "}
                      {alert.location.longitude.toFixed(6)}
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
