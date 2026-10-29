import type { Reservoir, StrataLayer } from "./types";

/** 川西气田示意地层：雷四段（5700–6200 m）为主力气藏，from/to 为归一化深度。 */
export const STRATA: StrataLayer[] = [
  { id: "S1", name: "第四系", from: 0, to: 0.03, colorKey: "quaternary", color: "#c9b79a" },
  { id: "S2", name: "白垩系", from: 0.03, to: 0.12, colorKey: "cretaceous", color: "#b8a184" },
  { id: "S3", name: "侏罗系", from: 0.12, to: 0.28, colorKey: "jurassic", color: "#9c876b" },
  { id: "S4", name: "须家河组", from: 0.28, to: 0.48, colorKey: "xujiahe", color: "#8a7d63" },
  { id: "S5", name: "雷口坡组", from: 0.48, to: 0.66, colorKey: "leikoupo", color: "#6f8c88" },
  { id: "S6", name: "嘉陵江组", from: 0.66, to: 0.74, colorKey: "jialingjiang", color: "#6b7f8a" },
  { id: "S7", name: "飞仙关组", from: 0.74, to: 0.82, colorKey: "feixianguan", color: "#5e7480" },
  { id: "S8", name: "二叠系", from: 0.82, to: 0.93, colorKey: "permian", color: "#526a75" },
  { id: "S9", name: "前二叠系", from: 0.93, to: 1, colorKey: "prepermian", color: "#455a63" },
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
    id: "R-LEI4A",
    name: "雷四上亚段",
    shortName: "雷四上",
    colorKey: "gas",
    topDepth: 5700,
    bottomDepth: 5850,
    pressure: 64.2,
    saturation: 68.5,
    layers: [
      layer("R4A-L1", "雷四上-1", 5700, 46, "gas", 63.6, 64.8),
      layer("R4A-L2", "雷四上-2", 5750, 52, "gas", 64.3, 69.4),
      layer("R4A-L3", "雷四上-3", 5806, 40, "gas", 64.9, 71.2),
    ],
  },
  {
    id: "R-LEI4B",
    name: "雷四中亚段",
    shortName: "雷四中",
    colorKey: "sulfur",
    topDepth: 5850,
    bottomDepth: 6020,
    pressure: 65.4,
    saturation: 72.1,
    layers: [
      layer("R4B-L1", "雷四中-1", 5850, 54, "sulfur", 64.8, 69.8),
      layer("R4B-L2", "雷四中-2", 5908, 58, "sulfur", 65.5, 73.1),
      layer("R4B-L3", "雷四中-3", 5970, 46, "sulfur", 66.0, 74.4),
    ],
  },
  {
    id: "R-LEI4C",
    name: "雷四下亚段",
    shortName: "雷四下",
    colorKey: "info",
    topDepth: 6020,
    bottomDepth: 6200,
    pressure: 66.8,
    saturation: 64.3,
    layers: [
      layer("R4C-L1", "雷四下-1", 6020, 58, "info", 66.1, 62.6),
      layer("R4C-L2", "雷四下-2", 6082, 64, "info", 66.9, 65.4),
      layer("R4C-L3", "雷四下-3", 6150, 46, "info", 67.4, 66.1),
    ],
  },
];

export function strataAt(fraction: number): StrataLayer {
  const clamped = Math.min(0.9999, Math.max(0, fraction));
  return STRATA.find((item) => clamped >= item.from && clamped < item.to) ?? STRATA[STRATA.length - 1];
}
