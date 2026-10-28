import { gcj02towgs84, wgs84togcj02 } from "coordtransform";
import type { Vec2 } from "@/components/GisPro/data/types";
import type { Crs, LonLat } from "./types";

const DEG = Math.PI / 180;
const METERS_PER_DEG_LAT = 110540;
const METERS_PER_DEG_LON = 111320;

export function localToWgs84(center: { lon: number; lat: number }, pos: Vec2): LonLat {
  return {
    lon: center.lon + pos.x / (METERS_PER_DEG_LON * Math.max(0.2, Math.cos(center.lat * DEG))),
    lat: center.lat - pos.z / METERS_PER_DEG_LAT,
  };
}

/** 数据统一存 WGS84，底图为 GCJ02 时再偏移一次。 */
export function wgs84ToCrs(point: LonLat, crs: Crs): LonLat {
  if (crs === "wgs84") return point;
  const [lon, lat] = wgs84togcj02(point.lon, point.lat);
  return { lon, lat };
}

export function crsToWgs84(point: LonLat, crs: Crs): LonLat {
  if (crs === "wgs84") return point;
  const [lon, lat] = gcj02towgs84(point.lon, point.lat);
  return { lon, lat };
}

export function toLatLngTuple(point: LonLat): [number, number] {
  return [point.lat, point.lon];
}

export function formatLonLat(point: LonLat): string {
  return `${point.lon.toFixed(4)}°E / ${point.lat.toFixed(4)}°N`;
}

export function boundsOf(points: LonLat[]): {
  west: number;
  south: number;
  east: number;
  north: number;
} | null {
  if (!points.length) return null;
  let west = points[0].lon;
  let east = points[0].lon;
  let south = points[0].lat;
  let north = points[0].lat;
  for (const point of points) {
    west = Math.min(west, point.lon);
    east = Math.max(east, point.lon);
    south = Math.min(south, point.lat);
    north = Math.max(north, point.lat);
  }
  return { west, south, east, north };
}

/** 104 个顶点以内的凸包，足够区块轮廓使用。 */
export function convexHull(points: LonLat[]): LonLat[] {
  if (points.length <= 3) return points.slice();
  const sorted = [...points].sort((a, b) => (a.lon === b.lon ? a.lat - b.lat : a.lon - b.lon));
  const cross = (o: LonLat, a: LonLat, b: LonLat) =>
    (a.lon - o.lon) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lon - o.lon);

  const lower: LonLat[] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }
  const upper: LonLat[] = [];
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const point = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

/** 在米制空间沿质心把环外扩，避免经纬度直接缩放导致东西向变窄。 */
export function offsetRing(points: LonLat[], meters: number): LonLat[] {
  if (points.length < 3) return points.slice();
  const lat0 = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const lon0 = points.reduce((sum, point) => sum + point.lon, 0) / points.length;
  const lonScale = METERS_PER_DEG_LON * Math.max(0.2, Math.cos(lat0 * DEG));
  const local = points.map((point) => ({
    x: (point.lon - lon0) * lonScale,
    z: (point.lat - lat0) * METERS_PER_DEG_LAT,
  }));
  const radius =
    local.reduce((sum, point) => sum + Math.hypot(point.x, point.z), 0) / Math.max(1, local.length);
  const scale = (radius + meters) / Math.max(radius, 1);
  return local.map((point) => ({
    lon: lon0 + (point.x * scale) / lonScale,
    lat: lat0 + (point.z * scale) / METERS_PER_DEG_LAT,
  }));
}

export function estimateTextWidth(text: string, fontSize = 10): number {
  let width = 0;
  for (const char of text) {
    width += /[\u2e80-\uffff]/.test(char) ? fontSize : fontSize * 0.58;
  }
  return Math.ceil(width + 16);
}

export function circleRing(center: LonLat, radiusMeters: number, segments = 32): LonLat[] {
  const lonScale = METERS_PER_DEG_LON * Math.max(0.2, Math.cos(center.lat * DEG));
  return Array.from({ length: segments }, (_, index) => {
    const angle = (index / segments) * Math.PI * 2;
    return {
      lon: center.lon + (Math.cos(angle) * radiusMeters) / lonScale,
      lat: center.lat + (Math.sin(angle) * radiusMeters) / METERS_PER_DEG_LAT,
    };
  });
}
