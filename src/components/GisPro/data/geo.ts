import type { Vec2 } from "./types";

const METERS_PER_DEG_LAT = 110540;

/** 与 cameraRig / cameraSync 的本地 ENU 约定一致：x 向东，z 向南。 */
export function lonLatToLocal(
  lon: number,
  lat: number,
  originLon: number,
  originLat: number,
): Vec2 {
  return {
    x: (lon - originLon) * 111320 * Math.cos((originLat * Math.PI) / 180),
    z: -(lat - originLat) * METERS_PER_DEG_LAT,
  };
}

export function localDistance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}
