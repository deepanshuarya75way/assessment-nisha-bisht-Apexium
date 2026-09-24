import React, { useState, useRef } from "react";
import { Anchor, Upload, Loader2 } from "lucide-react";

const SEED_INCIDENTS = [
  {
    id: "INC-2024-0847",
    severity: "Critical",
    location: "North Sea, Block 22/4",
    coordinates: "57.42°N, 1.89°E",
    detected: "2024-09-05 14:32 UTC",
    area: "18.4 km²",
    confidence: 97,
    vessel: "MV NORDIC SPIRIT",
    vesselMeta: "IMO 9412763 · Panama · Crude Oil Tanker",
    status: "Under Review",
    live: false,
  },
  {
    id: "INC-2024-0831",
    severity: "High",
    location: "English Channel, Sector 7",
    coordinates: "50.83°N, 1.08°W",
    detected: "2024-09-04 08:17 UTC",
    area: "9.2 km²",
    confidence: 91,
    vessel: "MT ATLAS CARRIER",
    vesselMeta: "IMO 9387441 · Liberia · Product Tanker",
    status: "Confirmed",
    live: false,
  },
  {
    id: "INC-2024-0819",
    severity: "Medium",
    location: "Bay of Biscay, Zone C",
    coordinates: "45.27°N, 3.39°W",
    detected: "2024-09-03 21:05 UTC",
    area: "4.1 km²",
    confidence: 84,
    vessel: "MV CORAL HAVEN",
    vesselMeta: "IMO 9501027 · Malta · Bulk Carrier",
    status: "Investigating",
    live: false,
  },
  {
    id: "INC-2024-0802",
    severity: "Low",
    location: "Strait of Gibraltar",
    coordinates: "35.94°N, 5.49°W",
    detected: "2024-09-02 11:44 UTC",
    area: "1.8 km²",
    confidence: 76,
    vessel: "MV SERRANO",
    vesselMeta: "IMO 9633851 · Spain · Container Ship",
    status: "Monitoring",
    live: false,
  },
];

const SEED_VESSELS = [
  {
    rank: 1,
    vessel: "MV NORDIC SPIRIT",
    flag: "PA",
    imo: "9412763",
    mmsi: "357142000",
    type: "Crude Oil Tanker",
    speed: "0.3 kn",
    position: "57.41°N 1.91°E",
    proximity: "0.8 nm",
    correlation: 97,
    risk: "Critical",
  },
  {
    rank: 2,
    vessel: "MT ATLAS CARRIER",
    flag: "LR",
    imo: "9387441",
    mmsi: "636020441",
    type: "Product Tanker",
    speed: "4.1 kn",
    position: "50.83°N 1.08°W",
    proximity: "2.3 nm",
    correlation: 91,
    risk: "High",
  },
  {
    rank: 3,
    vessel: "MV CORAL HAVEN",
    flag: "MT",
    imo: "9501027",
    mmsi: "229334000",
    type: "Bulk Carrier",
    speed: "7.6 kn",
    position: "45.27°N 3.39°W",
    proximity: "5.1 nm",
    correlation: 84,
    risk: "Medium",
  },
  {
    rank: 4,
    vessel: "MV SERRANO",
    flag: "ES",
    imo: "9633851",
    mmsi: "224182000",
    type: "Container Ship",
    speed: "11.2 kn",
    position: "35.94°N 5.49°W",
    proximity: "8.7 nm",
    correlation: 76,
    risk: "Low",
  },
  {
    rank: 5,
    vessel: "MT POSEIDON ACE",
    flag: "MH",
    imo: "9298173",
    mmsi: "538005771",
    type: "Crude Oil Tanker",
    speed: "0.0 kn",
    position: "57.39°N 1.85°E",
    proximity: "1.4 nm",
    correlation: 62,
    risk: "Medium",
  },
];

const SEVERITY_STYLES = {
  Critical: "bg-red-50 text-red-700 ring-1 ring-red-200",
  High: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  Medium: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Low: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
};

const STATUS_STYLES = {
  "Under Review": "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  Confirmed: "bg-red-50 text-red-700 ring-1 ring-red-200",
  Investigating: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Monitoring: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
};

const RISK_DOT = {
  Critical: "bg-red-500",
  High: "bg-orange-500",
  Medium: "bg-amber-500",
  Low: "bg-blue-400",
};

const CONFIDENCE_BAR = (v) =>
  v >= 90 ? "bg-emerald-500" : v >= 75 ? "bg-amber-500" : "bg-orange-500";

function StatCard({
  label,
  value,
  sub,
  subTone = "text-slate-500",
  valueTone = "text-slate-900",
}) {
  return (
    <div className="bg-white rounded-lg ring-1 ring-slate-200 p-5">
      <div className="text-xs font-medium tracking-wide text-slate-500">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-semibold ${valueTone}`}>{value}</div>
      <div className={`mt-1 text-xs ${subTone}`}>{sub}</div>
    </div>
  );
}

export default function AquaTraceDashboard() {
  const [incidents, setIncidents] = useState(SEED_INCIDENTS);
  const [vessels, setVessels] = useState(SEED_VESSELS);
  const [selectedId, setSelectedId] = useState(SEED_INCIDENTS[0].id);
  const [mapMode, setMapMode] = useState("SAR");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const fileInputRef = useRef(null);

  const selected = incidents.find((i) => i.id === selectedId) || incidents[0];

  const activeCount = incidents.length;
  const numericAreas = incidents
    .map((i) => parseFloat(i.area))
    .filter((v) => !Number.isNaN(v));
  const totalArea = numericAreas.length
    ? numericAreas.reduce((sum, v) => sum + v, 0).toFixed(1)
    : "—";
  const avgConfidence = Math.round(
    incidents.reduce((sum, i) => sum + i.confidence, 0) / incidents.length,
  );

  async function runLiveDetection(file) {
    setLoading(true);
    setApiError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const predictRes = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      });
      if (!predictRes.ok) throw new Error("Predict endpoint unreachable");
      const predictData = await predictRes.json();

      // Simulated spill coordinates for the vessel search — in a full system
      // these would come from the SAR scene's geolocation metadata.
      const spillLat = 28.5;
      const spillLon = -90.0;
      const detectedAt = "2023-01-28 12:00:00";

      let candidateVessels = [];
      if (predictData.is_oil_spill) {
        const vesselRes = await fetch("http://localhost:5000/find_vessels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: spillLat,
            longitude: spillLon,
            detected_at: detectedAt,
          }),
        });
        if (vesselRes.ok) {
          const vesselData = await vesselRes.json();
          candidateVessels = vesselData.candidate_vessels || [];
        }
      }

      const confidencePct = Math.round(predictData.confidence * 100);
      const newId = `INC-LIVE-${Math.floor(Math.random() * 900 + 100)}`;

      const topVessel = candidateVessels[0];
      const newIncident = {
        id: newId,
        severity:
          confidencePct >= 90
            ? "Critical"
            : confidencePct >= 75
              ? "High"
              : "Medium",
        location: "Gulf of Mexico (live upload)",
        coordinates: `${spillLat}°N, ${Math.abs(spillLon)}°W`,
        detected:
          new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC",
        area: "—",
        confidence: confidencePct,
        vessel: topVessel
          ? topVessel.vessel_name || `MMSI ${topVessel.mmsi}`
          : "No vessel matched",
        vesselMeta: topVessel
          ? `MMSI ${topVessel.mmsi} · Type ${topVessel.vessel_type} · ${topVessel.distance_nm.toFixed(1)} nm away`
          : "No AIS vessels within range",
        status: predictData.is_oil_spill ? "Under Review" : "Monitoring",
        live: true,
      };

      setIncidents((prev) => [newIncident, ...prev]);
      setSelectedId(newId);

      if (candidateVessels.length > 0) {
        setVessels(
          candidateVessels.map((v, idx) => ({
            rank: idx + 1,
            vessel:
              v.vessel_name && v.vessel_name.trim()
                ? v.vessel_name
                : `MMSI ${v.mmsi}`,
            flag: "—",
            imo: "—",
            mmsi: String(v.mmsi),
            type: `Type ${v.vessel_type}`,
            speed: "—",
            position: "—",
            proximity: `${v.distance_nm.toFixed(1)} nm`,
            correlation: Math.max(10, 100 - Math.round(v.distance_nm * 4)),
            risk:
              v.distance_nm <= 2
                ? "Critical"
                : v.distance_nm <= 8
                  ? "High"
                  : v.distance_nm <= 15
                    ? "Medium"
                    : "Low",
          })),
        );
      }
    } catch (err) {
      setApiError(
        "Couldn't reach the local backend at localhost:5000. Make sure your Flask server (app.py) is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleGenerateReport() {
    const lines = [
      "AQUATRACE — INCIDENT REPORT",
      "=".repeat(40),
      "",
      `Incident ID:     ${selected.id}`,
      `Severity:        ${selected.severity}`,
      `Status:          ${selected.status}`,
      "",
      `Location:        ${selected.location}`,
      `Coordinates:     ${selected.coordinates}`,
      `Detected (UTC):  ${selected.detected}`,
      `Spill Area:      ${selected.area}`,
      `Confidence:      ${selected.confidence}%`,
      "",
      "ATTRIBUTED VESSEL",
      "-".repeat(40),
      `${selected.vessel}`,
      `${selected.vesselMeta}`,
      "",
      "-".repeat(40),
      `Report generated: ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`,
      selected.live
        ? "Source: Live detection (real model output + AIS match)"
        : "Source: Demo incident (sample data)",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected.id}_report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Nav */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-slate-900 flex items-center justify-center">
              <Anchor className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-[15px] text-slate-900">
                AquaTrace
              </div>
              <div className="text-[10px] tracking-wide text-slate-400">
                SPILL INTELLIGENCE
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            System Online
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files[0] && runLiveDetection(e.target.files[0])
              }
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-medium px-3.5 py-2 rounded-md transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {loading ? "Running detection…" : "Run live detection"}
            </button>
          </div>
        </div>
      </header>

      {/* Alert banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-[1400px] mx-auto px-6 py-2.5 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-amber-900">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <span>
              Active Alert: {incidents[0].severity.toLowerCase()} spill detected
              in {incidents[0].location}
              {incidents[0].area !== "—" ? ` — ${incidents[0].area}` : ""} — SAR
              pass {incidents[0].detected.split(" ")[1] || "14:32 UTC"}
            </span>
          </div>
          <span className="text-amber-700 hidden sm:block">
            Last satellite pass 6 min ago
          </span>
        </div>
      </div>

      {apiError && (
        <div className="max-w-[1400px] mx-auto px-6 pt-4">
          <div className="bg-red-50 ring-1 ring-red-200 text-red-700 text-sm rounded-md px-4 py-3">
            {apiError}
          </div>
        </div>
      )}

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="ACTIVE INCIDENTS"
            value={activeCount}
            sub="↑ 2 since yesterday"
            valueTone="text-red-600"
            subTone="text-red-500"
          />
          <StatCard
            label="TOTAL SPILL AREA"
            value={`${totalArea} km²`}
            sub="Across all active zones"
          />
          <StatCard
            label="VESSELS FLAGGED"
            value={vessels.length}
            sub="3 within 5 nm proximity"
          />
          <StatCard
            label="AVG CONFIDENCE"
            value={`${avgConfidence}%`}
            sub="SAR + optical fusion"
            valueTone="text-emerald-600"
          />
        </div>

        {/* Map + Incident detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 bg-white rounded-lg ring-1 ring-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-sm text-slate-900">
                  Maritime Surveillance Map
                </span>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2 py-0.5 rounded">
                  LIVE
                </span>
              </div>
              <div className="flex items-center bg-slate-100 rounded-md p-0.5">
                {["SAR", "OPTICAL", "AIS"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMapMode(m)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      mapMode === m
                        ? "bg-slate-900 text-white"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="relative h-[420px]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #22405c 0%, #345a78 35%, #5c8098 60%, #cfd9dc 85%, #e8e4d8 100%)",
              }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)",
                  backgroundSize: "60px 60px",
                }}
              />
              <span className="absolute top-3 left-3 text-[11px] font-medium bg-slate-900/80 text-white px-2.5 py-1 rounded">
                SAR IMAGERY — SENTINEL-1
              </span>
              <span className="absolute bottom-3 left-3 text-[11px] text-slate-700 bg-white/80 px-2 py-1 rounded">
                0 — 50 km
              </span>
              <span className="absolute bottom-3 right-3 text-[11px] text-slate-700 bg-white/80 px-2 py-1 rounded">
                {selected.coordinates}
              </span>

              {incidents.slice(0, 3).map((inc, idx) => (
                <button
                  key={inc.id}
                  onClick={() => setSelectedId(inc.id)}
                  className="absolute flex flex-col items-center"
                  style={{
                    top: `${28 + idx * 20}%`,
                    left: `${38 + idx * 12}%`,
                  }}
                >
                  <span
                    className={`text-[10px] font-medium text-white px-2 py-0.5 rounded mb-1 whitespace-nowrap ${
                      inc.severity === "Critical"
                        ? "bg-red-600"
                        : inc.severity === "High"
                          ? "bg-orange-500"
                          : "bg-amber-500"
                    }`}
                  >
                    ●{" "}
                    {inc.id
                      .replace("INC-2024-", "INC-")
                      .replace("INC-LIVE-", "LIVE-")}{" "}
                    {inc.severity.toUpperCase()}
                  </span>
                  <span
                    className={`w-6 h-6 rounded-full border-2 border-white ${
                      inc.id === selectedId
                        ? "ring-2 ring-offset-2 ring-slate-900"
                        : ""
                    }`}
                    style={{
                      background:
                        "radial-gradient(circle, rgba(200,120,60,0.9) 0%, rgba(200,120,60,0.3) 70%, transparent 100%)",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Incident detail */}
          <div className="bg-white rounded-lg ring-1 ring-slate-200 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900">
                Incident Detail
              </h3>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${SEVERITY_STYLES[selected.severity]}`}
              >
                {selected.severity}
              </span>
            </div>

            <div className="mt-4 font-mono text-[15px] font-semibold text-slate-900">
              {selected.id}
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Location", selected.location],
                ["Coordinates", selected.coordinates],
                ["Detected", selected.detected],
                ["Spill Area", selected.area],
                ["Confidence", `${selected.confidence}%`],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-slate-400">{label}</dt>
                  <dd className="font-medium text-slate-800 font-mono text-[13px]">
                    {val}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="text-[11px] tracking-wide text-slate-400 mb-2">
                ATTRIBUTED VESSEL
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <div className="font-semibold text-sm text-slate-900">
                  {selected.vessel}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {selected.vesselMeta}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={handleGenerateReport}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2.5 rounded-md transition-colors"
              >
                Generate Report
              </button>
              <button className="w-full bg-white ring-1 ring-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 rounded-md transition-colors">
                Flag for Authorities
              </button>
            </div>
          </div>
        </div>

        {/* Incident log */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg ring-1 ring-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-sm text-slate-900">
                Incident Log
              </h3>
              <div className="text-xs text-slate-400 flex items-center gap-3">
                <span>{incidents.length} active</span>
                <button className="text-slate-500 hover:text-slate-800 font-medium">
                  Export CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] tracking-wide text-slate-400 bg-slate-50">
                    <th className="px-5 py-2.5 font-medium">Incident ID</th>
                    <th className="px-3 py-2.5 font-medium">Severity</th>
                    <th className="px-3 py-2.5 font-medium">Location</th>
                    <th className="px-3 py-2.5 font-medium">Detected (UTC)</th>
                    <th className="px-3 py-2.5 font-medium">Area</th>
                    <th className="px-3 py-2.5 font-medium">Confidence</th>
                    <th className="px-3 py-2.5 font-medium">Vessel (AIS)</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr
                      key={inc.id}
                      onClick={() => setSelectedId(inc.id)}
                      className={`border-t border-slate-100 cursor-pointer transition-colors ${
                        inc.id === selectedId
                          ? "bg-slate-50"
                          : "hover:bg-slate-50/60"
                      }`}
                    >
                      <td className="px-5 py-3 font-mono text-[13px] text-slate-800">
                        {inc.id}
                        {inc.live && (
                          <span className="ml-1.5 text-[9px] font-sans font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            LIVE
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${SEVERITY_STYLES[inc.severity]}`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {inc.location}
                      </td>
                      <td className="px-3 py-3 text-slate-500 font-mono text-[13px]">
                        {inc.detected}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {inc.area}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full ${CONFIDENCE_BAR(inc.confidence)}`}
                              style={{ width: `${inc.confidence}%` }}
                            />
                          </div>
                          <span className="text-slate-600 text-xs">
                            {inc.confidence}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{inc.vessel}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[inc.status]}`}
                        >
                          {inc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AIS Vessel Correlation Analysis */}
        <div className="bg-white rounded-lg ring-1 ring-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                AIS Vessel Correlation Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Vessels within proximity at time of detection — ranked by
                correlation score
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              {vessels.length} vessels
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] tracking-wide text-slate-400 bg-slate-50">
                  <th className="px-5 py-2.5 font-medium">Vessel / IMO</th>
                  <th className="px-3 py-2.5 font-medium">MMSI</th>
                  <th className="px-3 py-2.5 font-medium">Type</th>
                  <th className="px-3 py-2.5 font-medium">Speed</th>
                  <th className="px-3 py-2.5 font-medium">Last Position</th>
                  <th className="px-3 py-2.5 font-medium">Proximity</th>
                  <th className="px-3 py-2.5 font-medium">Correlation</th>
                  <th className="px-5 py-2.5 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {vessels.map((v) => (
                  <tr key={v.rank} className="border-t border-slate-100">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono w-6">
                          #{v.rank}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 rounded px-1">
                          {v.flag}
                        </span>
                        <div>
                          <div className="font-medium text-slate-800">
                            {v.vessel}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            IMO {v.imo}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[13px] text-slate-600">
                      {v.mmsi}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{v.type}</td>
                    <td className="px-3 py-3 font-mono text-[13px] text-slate-600">
                      {v.speed}
                    </td>
                    <td className="px-3 py-3 font-mono text-[13px] text-slate-600">
                      {v.position}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-800">
                      {v.proximity}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full ${
                              v.correlation >= 90
                                ? "bg-red-500"
                                : v.correlation >= 75
                                  ? "bg-orange-500"
                                  : v.correlation >= 50
                                    ? "bg-amber-500"
                                    : "bg-blue-400"
                            }`}
                            style={{ width: `${v.correlation}%` }}
                          />
                        </div>
                        <span className="text-slate-600 text-xs">
                          {v.correlation}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${RISK_DOT[v.risk]}`}
                        />
                        <span className="text-slate-700 text-xs">{v.risk}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 pb-4">
          AquaTrace connects to your local detection API at{" "}
          <code className="font-mono">http://localhost:5000</code>. Click{" "}
          <span className="font-medium text-slate-500">
            "Run live detection"
          </span>{" "}
          and upload a SAR chip to see a real prediction and AIS match appear at
          the top of the log.
        </div>
      </main>
    </div>
  );
}
