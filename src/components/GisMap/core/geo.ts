import * as Cesium from "cesium";
import type { LonLat } from "../data/types";

export function cartesianFromLonLat(point: LonLat, height = 0): Cesium.Cartesian3 {
  return Cesium.Cartesian3.fromDegrees(point.lon, point.lat, height);
}

export function cartesiansFromLonLat(points: LonLat[], height = 0): Cesium.Cartesian3[] {
  const flat: number[] = [];
  points.forEach((point) => flat.push(point.lon, point.lat, height));
  return Cesium.Cartesian3.fromDegreesArrayHeights(flat);
}

export function closeRing(points: LonLat[]): LonLat[] {
  if (points.length < 3) return points.slice();
  const first = points[0];
  const last = points[points.length - 1];
  if (first.lon === last.lon && first.lat === last.lat) return points.slice();
  return [...points, { ...first }];
}

export function midpointOfPath(points: LonLat[]): LonLat {
  if (!points.length) return { lon: 0, lat: 0 };
  if (points.length === 1) return { ...points[0] };
  const distances: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = cartesianFromLonLat(points[i - 1]);
    const b = cartesianFromLonLat(points[i]);
    const distance = Cesium.Cartesian3.distance(a, b);
    distances.push(distance);
    total += distance;
  }
  if (total === 0) return { ...points[0] };
  let target = total / 2;
  for (let i = 0; i < distances.length; i += 1) {
    if (target <= distances[i]) {
      const ratio = target / distances[i];
      return {
        lon: points[i].lon + (points[i + 1].lon - points[i].lon) * ratio,
        lat: points[i].lat + (points[i + 1].lat - points[i].lat) * ratio,
      };
    }
    target -= distances[i];
  }
  return { ...points[points.length - 1] };
}

/** 沿折线按 0–1 比例取点，用于管道流动粒子 */
export function sampleAlongCartesian(
  positions: Cesium.Cartesian3[],
  t: number,
  result?: Cesium.Cartesian3,
): Cesium.Cartesian3 {
  const output = result ?? new Cesium.Cartesian3();
  if (positions.length === 0) return output;
  if (positions.length === 1) return Cesium.Cartesian3.clone(positions[0], output);

  const segments: number[] = [];
  let total = 0;
  for (let i = 1; i < positions.length; i += 1) {
    const distance = Cesium.Cartesian3.distance(positions[i - 1], positions[i]);
    segments.push(distance);
    total += distance;
  }
  if (total === 0) return Cesium.Cartesian3.clone(positions[0], output);

  let target = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 0; i < segments.length; i += 1) {
    if (target <= segments[i]) {
      const ratio = segments[i] === 0 ? 0 : target / segments[i];
      return Cesium.Cartesian3.lerp(positions[i], positions[i + 1], ratio, output);
    }
    target -= segments[i];
  }
  return Cesium.Cartesian3.clone(positions[positions.length - 1], output);
}

/** WGS84 椭球面测地距离（米） */
export function surfaceDistance(a: Cesium.Cartesian3, b: Cesium.Cartesian3): number {
  const ca = Cesium.Cartographic.fromCartesian(a);
  const cb = Cesium.Cartographic.fromCartesian(b);
  if (!ca || !cb) return Cesium.Cartesian3.distance(a, b);
  return new Cesium.EllipsoidGeodesic(ca, cb).surfaceDistance;
}

export function formatKm(meters: number): string {
  if (!Number.isFinite(meters)) return "0 m";
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${meters.toFixed(0)} m`;
}

export function formatNumber(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(digits);
}

export function groundCartesian(
  viewer: Cesium.Viewer,
  windowPosition: Cesium.Cartesian2,
): Cesium.Cartesian3 | undefined {
  const scene = viewer.scene;
  const ray = viewer.camera.getPickRay(windowPosition);
  if (!ray) return undefined;
  const globePosition = scene.globe.pick(ray, scene);
  if (globePosition) return globePosition;
  return viewer.camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid);
}

export function cameraHeight(viewer: Cesium.Viewer): number {
  const height = viewer.camera.positionCartographic?.height;
  return Number.isFinite(height) ? height : 0;
}

export function rectangleOfLonLat(points: LonLat[], padding = 0.02): Cesium.Rectangle {
  let west = 999;
  let south = 999;
  let east = -999;
  let north = -999;
  points.forEach((point) => {
    west = Math.min(west, point.lon);
    east = Math.max(east, point.lon);
    south = Math.min(south, point.lat);
    north = Math.max(north, point.lat);
  });
  return Cesium.Rectangle.fromDegrees(
    west - padding,
    south - padding,
    east + padding,
    north + padding,
  );
}

export function toDegrees(value: number): number {
  return Cesium.Math.toDegrees(value);
}

export function formatCoordinate(lon: number, lat: number): string {
  const lonText = `${Math.abs(lon).toFixed(5)}°${lon >= 0 ? "E" : "W"}`;
  const latText = `${Math.abs(lat).toFixed(5)}°${lat >= 0 ? "N" : "S"}`;
  return `${lonText}  ${latText}`;
}
