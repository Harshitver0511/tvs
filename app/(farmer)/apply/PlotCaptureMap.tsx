"use client";
import "leaflet/dist/leaflet.css"; // bundled only where a map is used (was a render-blocking CDN link)

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLowData } from "@/app/components/pwa/connectivity";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  Circle,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  Satellite,
  Compass,
  Footprints,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Sparkles,
  Crosshair,
  Navigation,
  Calculator,
  Shuffle,
  Trash2,
  Square,
  Layers,
} from "lucide-react";

// GPS walk: record a corner every few metres, ignoring fixes worse than this accuracy
const WALK_MIN_STEP_M = 4;
const WALK_MAX_ACCURACY_M = 30;

function metersBetween(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Completely self-contained numbered vertex pin icon (zero external image dependencies, zero broken images)
function createNumberedMarkerIcon(index: number, isEnclosed: boolean) {
  const bg = isEnclosed ? "#2ED573" : "#FFD152";
  const num = index + 1;

  return L.divIcon({
    className: "custom-vertex-marker-wrapper",
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        background-color: ${bg};
        border: 2.5px solid #000000;
        border-radius: 50%;
        box-shadow: 2px 2px 0px #000000;
        font-family: monospace, sans-serif;
        font-weight: 900;
        font-size: 12px;
        color: #000000;
        line-height: 1;
        cursor: pointer;
        user-select: none;
      ">
        ${num}
        <div style="
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid #000000;
        "></div>
      </div>
    `,
    iconSize: [26, 31],
    iconAnchor: [13, 31],
  });
}

// Custom Live Pulsating GPS Marker Icon
const liveGpsIcon = L.divIcon({
  className: "custom-live-gps-icon",
  html: `
    <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center;">
      <div style="position:absolute; width:28px; height:28px; border-radius:50%; background:rgba(46,213,115,0.45); animation:pulse 1.8s infinite;"></div>
      <div style="width:14px; height:14px; border-radius:50%; background:#2ED573; border:2.5px solid #000; box-shadow:0 0 8px rgba(0,0,0,0.6);"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface PlotCaptureMapProps {
  initialCenter?: [number, number];
  userLocation?: { lat: number; lng: number } | null;
  initialPolygon?: [number, number][];
  declaredAcres: number;
  onPolygonChange: (coords: [number, number][], computedAcres: number, source: "drawn" | "gps_walk") => void;
  onRequestLocation?: () => void;
}

// MapController to smoothly fly to new center when GPS position is detected
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 16, { animate: true, duration: 1.2 });
  }, [center, map]);
  return null;
}

// Compute spherical polygon area in acres from lat/lng coordinates
function computePolygonAcres(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const R = 6378137; // Earth radius in meters
  let area = 0;

  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const lat1 = (coords[i][0] * Math.PI) / 180;
    const lat2 = (coords[j][0] * Math.PI) / 180;
    const lon1 = (coords[i][1] * Math.PI) / 180;
    const lon2 = (coords[j][1] * Math.PI) / 180;

    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs((area * R * R) / 2.0);
  // Convert square meters to acres (1 acre = 4046.856 sqm)
  const acres = area / 4046.8564224;
  return parseFloat(acres.toFixed(2));
}

/**
 * Untangles polygon vertices by sorting them angularly around the geometric centroid.
 * This mathematically guarantees a simple, non-self-intersecting boundary
 * where lines NEVER cross each other!
 */
function sortVerticesConvexly(coords: [number, number][]): [number, number][] {
  if (coords.length < 3) return coords;

  const n = coords.length;
  const cLat = coords.reduce((sum, p) => sum + p[0], 0) / n;
  const cLng = coords.reduce((sum, p) => sum + p[1], 0) / n;

  return [...coords].sort((a, b) => {
    const angleA = Math.atan2(a[0] - cLat, a[1] - cLng);
    const angleB = Math.atan2(b[0] - cLat, b[1] - cLng);
    return angleA - angleB;
  });
}

function MapClickHandler({ onAddPoint }: { onAddPoint: (pt: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onAddPoint([parseFloat(e.latlng.lat.toFixed(5)), parseFloat(e.latlng.lng.toFixed(5))]);
    },
  });
  return null;
}

export default function PlotCaptureMap({
  initialCenter = [20.1384, 78.3182],
  userLocation = null,
  initialPolygon = [],
  declaredAcres,
  onPolygonChange,
  onRequestLocation,
}: PlotCaptureMapProps) {
  const t = useTranslations("plotMap");
  const lowData = useLowData();
  const effectiveCenter: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : initialCenter;

  const [mapCenter, setMapCenter] = useState<[number, number]>(effectiveCenter);
  const [points, setPoints] = useState<[number, number][]>(initialPolygon);
  const [isEnclosed, setIsEnclosed] = useState<boolean>(initialPolygon.length >= 3);
  const [computedAcres, setComputedAcres] = useState<number>(computePolygonAcres(initialPolygon));
  const [walkActive, setWalkActive] = useState(false);
  const [walkError, setWalkError] = useState("");
  const [layerChoice, setLayerChoice] = useState<"satellite" | "map" | null>(null);
  const layer = layerChoice ?? (lowData ? "map" : "satellite");
  const watchIdRef = useRef<number | null>(null);

  // Adopt a polygon supplied by the parent (GPS auto-corners, pincode, restored draft)
  const [adoptedPolygon, setAdoptedPolygon] = useState(initialPolygon);
  if (initialPolygon !== adoptedPolygon && initialPolygon.length >= 3 && points.length === 0) {
    setAdoptedPolygon(initialPolygon);
    setPoints(initialPolygon);
    setComputedAcres(computePolygonAcres(initialPolygon));
    setIsEnclosed(true);
  }

  useEffect(() => {
    if (userLocation) setMapCenter([userLocation.lat, userLocation.lng]);
  }, [userLocation]);

  // Stop GPS tracking if the component goes away mid-walk
  useEffect(
    () => () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    },
    []
  );

  const enclose = (pts: [number, number][], source: "drawn" | "gps_walk") => {
    const acres = computePolygonAcres(pts);
    setPoints(pts);
    setComputedAcres(acres);
    setIsEnclosed(true);
    onPolygonChange(pts, acres, source);
  };

  const handleAddPoint = (newPoint: [number, number]) => {
    if (walkActive) return; // corners come from GPS while walking
    setPoints((prev) => [...prev, newPoint]);
    setIsEnclosed(false);
  };

  const handleCalculateArea = () => {
    if (points.length < 3) return;
    enclose(sortVerticesConvexly(points), "drawn");
  };

  const handleClear = () => {
    setPoints([]);
    setIsEnclosed(false);
    setComputedAcres(0);
    onPolygonChange([], 0, "drawn");
  };

  const handleUndo = () => {
    const next = points.slice(0, -1);
    setPoints(next);
    if (next.length < 3) {
      setIsEnclosed(false);
      setComputedAcres(0);
    }
  };

  const handleRecenterLive = () => {
    if (userLocation) setMapCenter([userLocation.lat, userLocation.lng]);
    else onRequestLocation?.();
  };

  const handlePlotAroundMe = () => {
    const c = userLocation ? [userLocation.lat, userLocation.lng] : mapCenter;
    setMapCenter(c as [number, number]);
    enclose(
      sortVerticesConvexly([
        [+(c[0] - 0.0018).toFixed(5), +(c[1] - 0.0022).toFixed(5)],
        [+(c[0] + 0.0022).toFixed(5), +(c[1] - 0.0018).toFixed(5)],
        [+(c[0] + 0.0018).toFixed(5), +(c[1] + 0.0025).toFixed(5)],
        [+(c[0] - 0.0022).toFixed(5), +(c[1] + 0.002).toFixed(5)],
      ]),
      "drawn"
    );
  };

  const stopWalk = () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setWalkActive(false);
    // Walked order is the true field outline — don't re-sort; the server rejects self-crossing shapes
    if (points.length >= 3) enclose(points, "gps_walk");
    else if (points.length > 0) setWalkError(t("walk.tooFew"));
  };

  // Real GPS walk: the farmer walks the field edge and a corner is recorded every few metres
  const startWalk = () => {
    if (!("geolocation" in navigator)) {
      setWalkError(t("walk.unavailable"));
      return;
    }
    setWalkError("");
    setPoints([]);
    setIsEnclosed(false);
    setComputedAcres(0);
    setWalkActive(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (pos.coords.accuracy > WALK_MAX_ACCURACY_M) return;
        const pt: [number, number] = [+pos.coords.latitude.toFixed(6), +pos.coords.longitude.toFixed(6)];
        setMapCenter(pt);
        setPoints((prev) => (prev.length && metersBetween(prev[prev.length - 1], pt) < WALK_MIN_STEP_M ? prev : [...prev, pt]));
      },
      () => {
        if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setWalkActive(false);
        setWalkError(t("walk.denied"));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
  };

  const acreageDiffPct = declaredAcres > 0 ? Math.abs(((computedAcres - declaredAcres) / declaredAcres) * 100) : 0;
  const isAcreageMismatch = acreageDiffPct > 20 && isEnclosed && points.length >= 3;
  const toolBtn =
    "px-3 text-xs font-bold border-2 border-black flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
  const layerLabel = t(layer === "satellite" ? "layer.toMap" : "layer.toSatellite");

  return (
    <div className="space-y-3 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white border-2 border-black" style={{ boxShadow: "3px 3px 0 #000" }}>
        <span className="text-xs font-bold text-neutral-800 bg-[#FAF8F5] px-2 py-1 border border-black">
          {t("pointsMarked", { count: points.length })}
        </span>

        <div className="flex items-center gap-1.5 flex-wrap">
          {!walkActive ? (
            <button type="button" onClick={startWalk} className={`${toolBtn} bg-[#E8F8F0] hover:bg-[#C8E6C9]`} style={{ boxShadow: "2px 2px 0 #000" }}>
              <Footprints className="w-4 h-4" aria-hidden />
              <span>{t("walk.start")}</span>
            </button>
          ) : (
            <button type="button" onClick={stopWalk} className={`${toolBtn} bg-[#C62828] text-white animate-pulse`} style={{ boxShadow: "2px 2px 0 #000" }}>
              <Square className="w-4 h-4" aria-hidden />
              <span>{t("walk.stop")}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCalculateArea}
            disabled={points.length < 3 || walkActive}
            className={`${toolBtn} bg-[#2ED573] text-black hover:bg-[#52E08A]`}
            style={{ boxShadow: "2px 2px 0 #000" }}
          >
            <Calculator className="w-4 h-4" aria-hidden />
            <span>{t("calculate")}</span>
          </button>
          <button type="button" onClick={handleRecenterLive} className={`${toolBtn} bg-white hover:bg-neutral-100`} aria-label={t("recenter")} title={t("recenter")}>
            <Crosshair className="w-4 h-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={handlePlotAroundMe}
            disabled={walkActive}
            className={`${toolBtn} bg-white hover:bg-[#FFD152]`}
            aria-label={t("aroundMe")}
            title={t("aroundMe")}
          >
            <Navigation className="w-4 h-4" aria-hidden />
          </button>
          {points.length >= 3 && !walkActive && (
            <button type="button" onClick={handleCalculateArea} className={`${toolBtn} bg-white hover:bg-neutral-100`} aria-label={t("untangle")} title={t("untangle")}>
              <Shuffle className="w-4 h-4" aria-hidden />
            </button>
          )}
          <button
            type="button"
            onClick={handleUndo}
            disabled={points.length === 0 || walkActive}
            className={`${toolBtn} bg-white hover:bg-neutral-100`}
            aria-label={t("undo")}
            title={t("undo")}
          >
            <RotateCcw className="w-4 h-4" aria-hidden />
          </button>
          <button type="button" onClick={handleClear} disabled={points.length === 0 || walkActive} className={`${toolBtn} bg-white text-[#B71C1C] hover:bg-red-50`}>
            <Trash2 className="w-4 h-4" aria-hidden />
            <span>{t("clear")}</span>
          </button>
          <button
            type="button"
            onClick={() => setLayerChoice(layer === "satellite" ? "map" : "satellite")}
            className={`${toolBtn} bg-white hover:bg-neutral-100`}
            aria-label={layerLabel}
            title={layerLabel}
          >
            {layer === "satellite" ? <Layers className="w-4 h-4" aria-hidden /> : <Satellite className="w-4 h-4" aria-hidden />}
          </button>
        </div>
      </div>

      {(walkActive || walkError) && (
        <div
          role="status"
          className={`p-2 text-xs border-2 border-black font-bold flex items-center gap-2 ${
            walkError ? "bg-[#FFEBEE] text-[#B71C1C]" : "bg-[#E8F5E9] text-[#1B5E20]"
          }`}
        >
          <Compass className={`w-4 h-4 ${walkActive ? "animate-spin" : ""}`} aria-hidden />
          <span>{walkError || t("walk.active", { count: points.length })}</span>
        </div>
      )}

      <div className="w-full h-[380px] relative overflow-hidden" style={{ border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}>
        <MapContainer center={mapCenter} zoom={16} scrollWheelZoom={false} className="w-full h-full cursor-crosshair">
          <MapController center={mapCenter} />
          {layer === "satellite" ? (
            <TileLayer
              key="satellite"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          ) : (
            <TileLayer
              key="map"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}
          <MapClickHandler onAddPoint={handleAddPoint} />

          {userLocation && (
            <>
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={40}
                pathOptions={{ color: "#2ED573", fillColor: "#2ED573", fillOpacity: 0.2, weight: 2 }}
              />
              <Marker position={[userLocation.lat, userLocation.lng]} icon={liveGpsIcon}>
                <Tooltip permanent direction="top" offset={[0, -12]}>
                  <div className="font-mono text-[10px] font-black uppercase text-black bg-white px-1 border border-black">📍 {t("youAreHere")}</div>
                </Tooltip>
              </Marker>
            </>
          )}

          {isEnclosed && points.length >= 3 && (
            <Polygon positions={points} pathOptions={{ color: "#2ED573", fillColor: "#2ED573", fillOpacity: 0.35, weight: 3 }} />
          )}
          {walkActive && points.length >= 2 && <Polyline positions={points} pathOptions={{ color: "#FFD152", weight: 4, dashArray: "6 6" }} />}

          {points.map((pt, idx) => (
            <Marker key={`${idx}-${pt[0]}-${pt[1]}`} position={pt} icon={createNumberedMarkerIcon(idx, isEnclosed)}>
              <Tooltip direction="top" offset={[0, -28]}>
                <div className="text-[10px] font-bold font-mono">
                  {t("corner", { n: idx + 1 })}: {pt[0].toFixed(5)}°, {pt[1].toFixed(5)}°
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>

        <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-white/95 border-2 border-black px-2.5 py-1.5 z-[1000] text-[11px] sm:text-xs font-bold flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-black shrink-0" aria-hidden />
          <span>
            {walkActive
              ? t("hint.walking")
              : isEnclosed
              ? t("hint.enclosed")
              : points.length < 3
              ? t("hint.tap", { count: points.length })
              : t("hint.calculate", { count: points.length })}
          </span>
        </div>

        <div className="absolute top-3 right-3 bg-black text-white px-3 py-1.5 z-[1000] text-xs font-display border border-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FFD152]" aria-hidden />
          <span>
            {isEnclosed ? (
              <>
                {t("area")}: <strong className="text-[#FFD152] font-mono text-sm">{t("acres", { value: computedAcres })}</strong>
              </>
            ) : (
              t("pointsMarked", { count: points.length })
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-white border-2 border-black" style={{ boxShadow: "2px 2px 0 #000" }}>
          <div className="text-[11px] font-mono uppercase text-neutral-700 font-bold">{t("declaredVsMeasured")}</div>
          <div className="flex items-baseline flex-wrap gap-2 mt-1">
            <span className="text-xl font-display font-black">{t("acres", { value: declaredAcres })}</span>
            <span className="text-xs font-mono text-neutral-700">{t("declared")}</span>
            <span className="text-xs font-mono font-bold text-neutral-700" aria-hidden>
              |
            </span>
            <span className="text-xl font-display font-black text-[#1B7F45]">{isEnclosed ? t("acres", { value: computedAcres }) : "—"}</span>
            <span className="text-xs font-mono text-neutral-700">{t("measured")}</span>
          </div>
        </div>

        <div
          className={`p-3 border-2 border-black flex items-center gap-2.5 ${
            isAcreageMismatch ? "bg-[#FFF3E0] text-[#8A3A00]" : isEnclosed ? "bg-[#E8F8F0] text-[#1B5E20]" : "bg-neutral-100 text-neutral-800"
          }`}
          style={{ boxShadow: "2px 2px 0 #000" }}
        >
          {isAcreageMismatch ? (
            <>
              <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden />
              <div>
                <div className="text-xs font-display uppercase font-black">{t("mismatch.title", { pct: acreageDiffPct.toFixed(0) })}</div>
                <div className="text-[11px] font-mono">{t("mismatch.body")}</div>
              </div>
            </>
          ) : isEnclosed ? (
            <>
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#1B7F45]" aria-hidden />
              <div>
                <div className="text-xs font-display uppercase font-black">{t("ok.title")}</div>
                <div className="text-[11px] font-mono">{t("ok.body", { value: computedAcres })}</div>
              </div>
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5 shrink-0" aria-hidden />
              <div>
                <div className="text-xs font-display uppercase font-black">{t("drawing.title")}</div>
                <div className="text-[11px] font-mono">{t("drawing.body")}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
