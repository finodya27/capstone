"use client";
import React, { useEffect, useState } from "react";

const AttitudePanel = ({ attitude = {}, airspeed = 0, groundspeed = 0, altitude = 0 }) => {
  const toDeg = (rad) => (rad != null ? rad * 180 / Math.PI : 0);

  const [smooth, setSmooth] = useState({
    roll: 0, pitch: 0, yaw: 0,
    airspeed: 0, groundspeed: 0, altitude: 0
  });

  useEffect(() => {
    const t = setInterval(() => {
      setSmooth((prev) => ({
        roll: lerp(prev.roll, toDeg(attitude.roll), 0.15),
        pitch: lerp(prev.pitch, toDeg(attitude.pitch), 0.15),
        yaw: lerp(prev.yaw, toDeg(attitude.yaw), 0.15),
        airspeed: lerp(prev.airspeed, airspeed, 0.2),
        groundspeed: lerp(prev.groundspeed, groundspeed, 0.2),
        altitude: lerp(prev.altitude, altitude, 0.2),
      }));
    }, 70);

    return () => clearInterval(t);
  }, [attitude, airspeed, groundspeed, altitude]);

  return (
    <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-gray-200 text-gray-800 w-full max-w-full overflow-hidden max-h-[520px]">
      <h3 className="text-base sm:text-lg font-bold text-indigo-600 mb-4 tracking-wider text-center sm:text-left">
        FLIGHT INSTRUMENTS
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <GaugeCircle title="VERT SPEED" value={smooth.groundspeed} min={-10} max={10} unit=" m/s" />
        <GaugeCircle title="AIRSPEED" value={smooth.airspeed} min={0} max={60} unit=" m/s" />
        <GaugeCircle title="ALTITUDE" value={smooth.altitude} min={0} max={200} unit=" m" />

        <CompassHorizon
          roll={smooth.roll}
          pitch={smooth.pitch}
          yaw={smooth.yaw}
        />

      </div>
    </div>
  );
};

export default AttitudePanel;

/* =====================
   Utils
===================== */
const lerp = (a = 0, b = 0, t = 0.1) => a + (b - a) * t;


/* =====================
   Gauge Circle
===================== */
const GaugeCircle = ({ title, value, min, max, unit }) => {
  const clamp = (v) => Math.min(Math.max(v, min), max);
  const norm = (clamp(value) - min) / (max - min);
  const degree = (norm * 240) - 120;

  return (
    <div className="bg-gray-50 rounded-xl p-3 shadow-sm border border-gray-200 text-center w-full">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 xl:w-32 xl:h-32 mx-auto">

        {/* Tick marks */}
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {[...Array(31)].map((_, i) => {
            const a = ((i / 30) * 240 - 120) * Math.PI / 180;
            const x1 = 50 + 38 * Math.cos(a);
            const y1 = 50 + 38 * Math.sin(a);
            const x2 = 50 + 45 * Math.cos(a);
            const y2 = 50 + 45 * Math.sin(a);
            return (
              <line 
                key={i} 
                x1={x1} 
                y1={y1} 
                x2={x2} 
                y2={y2} 
                stroke="#6366f1" 
                strokeWidth="1" 
              />
            );
          })}
        </svg>

        {/* Needle */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
          style={{ transform: `rotate(${degree}deg)` }}
        >
          <div className="w-1 h-8 sm:h-10 md:h-12 xl:h-14 bg-rose-500 rounded-full origin-bottom"></div>
        </div>

        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-indigo-500 rounded-full" />
        </div>
      </div>

      <p className="text-[10px] sm:text-xs text-gray-500 mt-2 tracking-widest">{title}</p>
      <p className="text-sm sm:text-base font-mono text-gray-800">
        {value.toFixed(1)}{unit}
      </p>
    </div>
  );
};


/* =====================
   Compass + Horizon
===================== */
const CompassHorizon = ({ roll = 0, pitch = 0, yaw = 0 }) => {
  const pitchPx = pitch * 0.7;

  return (
    <div className="bg-gray-50 rounded-xl p-3 shadow-sm border border-gray-200 w-full">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 xl:w-32 xl:h-32 mx-auto overflow-hidden border border-indigo-400 rounded-full">

        {/* Horizon */}
        <div
          className="absolute w-full h-full"
          style={{
            transform: `rotate(${roll}deg) translateY(${pitchPx}px)`,
            transition: "transform 0.08s linear"
          }}
        >
          <div className="h-1/2 bg-sky-400"></div>
          <div className="h-1/2 bg-amber-400"></div>
        </div>

        {/* Compass labels */}
        <div
          className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-gray-700"
          style={{ transform: `rotate(${-yaw}deg)`, transition: "transform 0.08s linear" }}
        >
          <div className="absolute top-1 text-indigo-500">N</div>
          <div className="absolute right-1">E</div>
          <div className="absolute bottom-1">S</div>
          <div className="absolute left-1">W</div>
        </div>

        {/* Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 xl:w-10 xl:h-10 border-2 border-indigo-500"></div>
        </div>
      </div>

      <p className="text-center text-indigo-500 mt-2 font-mono text-xs sm:text-sm">
        HDG {yaw.toFixed(1)}°
      </p>
    </div>
  );
};
