/**
 * 程序化地质体演示的色值与场景常量。
 * 本页所有 hex 只允许出现在这里，`.vue` 通过 cssVars() 注入的变量取色。
 * 与 /GisPro 的 Aurora Field 大屏 token 无关（DESIGN.md 声明其适用范围仅 /GisPro）。
 */

/** 场景尺度，单位米 */
export const SCENE = {
  width: 240,
  depth: 160,
  /** 地形水平分段数（垂直分段按宽高比推导） */
  segments: 180,
  /** 最大起伏 */
  relief: 46,
  /** 噪声基频，越小地形越平缓 */
  baseFrequency: 0.0075,
  seed: 20261028,
};

export interface Stratum {
  name: string;
  color: string;
  /** 层厚，米 */
  thickness: number;
}

/** 自上而下的岩性序列，沿用原钻井演示的地层顺序 */
export const STRATA: Stratum[] = [
  { name: "第四系覆盖层", color: "#C9B896", thickness: 6 },
  { name: "粘土层", color: "#B08F6B", thickness: 8 },
  { name: "砂岩层", color: "#D8C79E", thickness: 12 },
  { name: "泥岩层", color: "#8C8A82", thickness: 10 },
  { name: "石灰岩层", color: "#C4C7C1", thickness: 14 },
  { name: "白云岩层", color: "#A6B2AC", thickness: 12 },
  { name: "花岗闪长岩", color: "#B9A0A4", thickness: 16 },
  { name: "片麻岩", color: "#888CA0", thickness: 18 },
  { name: "混合花岗岩", color: "#A58F9E", thickness: 20 },
];

export const TOTAL_DEPTH = STRATA.reduce((sum, s) => sum + s.thickness, 0);

/** 地形按高程着色，at 为归一化高度 0..1 */
export const TERRAIN_RAMP = [
  { at: 0.0, color: "#8FA383" },
  { at: 0.38, color: "#B7B493" },
  { at: 0.68, color: "#CFC4A8" },
  { at: 1.0, color: "#E6E7E4" },
];

export const PALETTE = {
  canvas: "#EDF1F4",
  ink: "#22303B",
  inkSoft: "#63768A",
  hairline: "#CFD8E0",
  panel: "rgba(255, 255, 255, 0.88)",
  panelInk: "#22303B",
  accent: "#2B7FD4",
  onAccent: "#FFFFFF",
  /** 选中态：唯一允许发光/加亮的语义色 */
  select: "#D4582B",
  wellbore: "#1F5FA9",
  stationNormal: "#4C8E6E",
  stationBusy: "#C9A227",
  /** 剖切面指示线 */
  clip: "#7A8B99",
};

export const STATION_COUNT = 28;

/** 注入到页面根元素的 CSS 变量，避免 .vue 里写裸 hex */
export function cssVars(): Record<string, string> {
  const entries: Record<string, string> = {
    "--geo-canvas": PALETTE.canvas,
    "--geo-ink": PALETTE.ink,
    "--geo-ink-soft": PALETTE.inkSoft,
    "--geo-hairline": PALETTE.hairline,
    "--geo-panel": PALETTE.panel,
    "--geo-panel-ink": PALETTE.panelInk,
    "--geo-accent": PALETTE.accent,
    "--geo-on-accent": PALETTE.onAccent,
    "--geo-select": PALETTE.select,
  };
  return entries;
}
