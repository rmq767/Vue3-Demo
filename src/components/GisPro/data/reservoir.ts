import type { Reservoir, StrataLayer } from "./types";

/** 9 层示意地层，from/to 是自上而下的归一化深度。颜色只服务 3D 剖面。 */
export const STRATA: StrataLayer[] = [
  { id: "S1", name: "第四系", from: 0, to: 0.08, colorKey: "quaternary", color: "#b49a72" },
  { id: "S2", name: "白垩系", from: 0.08, to: 0.18, colorKey: "cretaceous", color: "#9b8061" },
  { id: "S3", name: "侏罗系", from: 0.18, to: 0.29, colorKey: "jurassic", color: "#82684b" },
  { id: "S4", name: "三叠系", from: 0.29, to: 0.41, colorKey: "triassic", color: "#66877d" },
  { id: "S5", name: "二叠系", from: 0.41, to: 0.53, colorKey: "permian", color: "#52798c" },
  { id: "S6", name: "石炭系", from: 0.53, to: 0.64, colorKey: "carboniferous", color: "#725883" },
  { id: "S7", name: "奥陶系", from: 0.64, to: 0.75, colorKey: "ordovician", color: "#4d7284" },
  { id: "S8", name: "寒武系", from: 0.75, to: 0.87, colorKey: "cambrian", color: "#3d5b6a" },
  { id: "S9", name: "前寒武系", from: 0.87, to: 1, colorKey: "precambrian", color: "#304552" },
];

const layer = (
  id: string,
  name: string,
  depth: number,
  thickness: number,
  colorKey: string,
  pressure: number,
  saturation: number,
) => ({ id, name, depth, thickness, colorKey, pressure, saturation });

export const RESERVOIRS: Reservoir[] = [
  {
    id: "R1",
    name: "延9 油藏",
    shortName: "延9",
    colorKey: "oil",
    topDepth: 1180,
    bottomDepth: 1320,
    pressure: 24.6,
    saturation: 68.4,
    layers: [
      layer("R1-L1", "延9-1", 1180, 42, "oil", 24.2, 61.5),
      layer("R1-L2", "延9-2", 1230, 46, "oil", 24.8, 69.8),
      layer("R1-L3", "延9-3", 1284, 36, "oil", 25.1, 73.2),
    ],
  },
  {
    id: "R2",
    name: "长6 气藏",
    shortName: "长6",
    colorKey: "gas",
    topDepth: 1560,
    bottomDepth: 1740,
    pressure: 28.9,
    saturation: 57.8,
    layers: [
      layer("R2-L1", "长6-1", 1560, 54, "gas", 28.1, 51.2),
      layer("R2-L2", "长6-2", 1622, 58, "gas", 29.4, 58.6),
      layer("R2-L3", "长6-3", 1690, 50, "gas", 29.8, 63.4),
    ],
  },
  {
    id: "R3",
    name: "马家沟 深层",
    shortName: "马家沟",
    colorKey: "violet",
    topDepth: 1960,
    bottomDepth: 2140,
    pressure: 31.7,
    saturation: 44.9,
    layers: [
      layer("R3-L1", "马五1", 1960, 52, "violet", 30.6, 41.8),
      layer("R3-L2", "马五2", 2020, 58, "violet", 31.9, 45.2),
      layer("R3-L3", "马五3", 2082, 58, "violet", 32.4, 47.6),
    ],
  },
];

export function strataAt(fraction: number): StrataLayer {
  const clamped = Math.min(0.9999, Math.max(0, fraction));
  return STRATA.find((item) => clamped >= item.from && clamped < item.to) ?? STRATA[STRATA.length - 1];
}
