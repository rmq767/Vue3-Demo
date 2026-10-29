/**
 * GisPro 设计 token（页面级）
 *
 * 单一代码事实源：HUD CSS 变量、ECharts、Cesium、Three 都从这里取。
 * 人类可读契约见根目录 DESIGN.md；新增颜色/字号时两边同步。
 */

export type ThemeMode = "light" | "dark";

export interface ThemeDefinition {
  mode: ThemeMode;
  label: string;
  colors: Record<string, string>;
}

const LIGHT_COLORS: Record<string, string> = {
  appBg: "#EEF2F4",
  surface: "#FFFFFF",
  surfaceAlt: "#F6F8FA",
  border: "#D9E1E6",
  borderStrong: "#B9C7CF",
  text: "#18252D",
  textSecondary: "#4E606B",
  textMuted: "#788A94",
  selected: "#0B6E99",
  overlay: "rgba(16, 30, 40, 0.45)",
  sceneBg: "#DCE7EC",
  sceneGround: "#DCE7EC",
  sceneGrid: "#B9C7CF",

  void: "#EEF2F4",
  deep: "#F6F8FA",
  elevated: "#FFFFFF",
  panel: "#FFFFFF",
  panelGlass: "rgba(255, 255, 255, 0.92)",
  panelStrong: "#FFFFFF",
  hairline: "#D9E1E6",
  lineSoft: "#E3EAEE",
  lineStrong: "#B9C7CF",
  primary: "#0B6E99",
  primaryHover: "#085A7D",
  primaryDim: "#7FA7B8",
  onPrimary: "#FFFFFF",
  success: "#2E7D32",
  warning: "#A96500",
  danger: "#B3261E",
  info: "#2F6FA8",
  violet: "#6B5CA5",
  oil: "#B7791F",
  gas: "#0E7490",
  water: "#386FA4",
  sulfur: "#A97B12",
  ink: "#18252D",
  inkSecondary: "#4E606B",
  inkMuted: "#788A94",
  white: "#FFFFFF",
  black: "#000000",
};

const DARK_COLORS: Record<string, string> = {
  appBg: "#101619",
  surface: "#1E2B32",
  surfaceAlt: "#26343C",
  border: "#2A3A43",
  borderStrong: "#3C515C",
  text: "#E6EEF2",
  textSecondary: "#A7B7C0",
  textMuted: "#7C8E98",
  selected: "#5FA8C9",
  overlay: "rgba(0, 0, 0, 0.5)",
  sceneBg: "#0B1216",
  sceneGround: "#0B1216",
  sceneGrid: "#2A3A43",

  void: "#101619",
  deep: "#1B272D",
  elevated: "#26343C",
  panel: "#1E2B32",
  panelGlass: "rgba(30, 43, 50, 0.92)",
  panelStrong: "#26343C",
  hairline: "#2A3A43",
  lineSoft: "#2A3A43",
  lineStrong: "#3C515C",
  primary: "#5FA8C9",
  primaryHover: "#7CBEDC",
  primaryDim: "#3E7E99",
  onPrimary: "#0C151A",
  success: "#63B98A",
  warning: "#D6A24C",
  danger: "#D97A70",
  info: "#7FA6C8",
  violet: "#9B8FCB",
  oil: "#D6B05A",
  gas: "#6FC3D6",
  water: "#7FA6C8",
  sulfur: "#D6B05A",
  ink: "#E6EEF2",
  inkSecondary: "#A7B7C0",
  inkMuted: "#7C8E98",
  white: "#FFFFFF",
  black: "#000000",
};

export const THEMES: Record<ThemeMode, ThemeDefinition> = {
  light: { mode: "light", label: "亮色", colors: LIGHT_COLORS },
  dark: { mode: "dark", label: "暗色", colors: DARK_COLORS },
};

export interface ScenePalette {
  sky: string;
  fog: string;
  fogDensity: number;
  shadowOpacity: number;
  exposure: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  sunColor: string;
  sunIntensity: number;
  fillColor: string;
  fillIntensity: number;
  steel: string;
  steelDark: string;
  concrete: string;
  building: string;
  roof: string;
  road: string;
  tank: string;
  sulfur: string;
  pipeGas: string;
  pipeWater: string;
  pipeSelected: string;
  pipeMaintenance: string;
  pipeStopped: string;
  pipeCasing: string;
  pipeCasingOpacity: number;
  blockFillOpacity: number;
  selection: string;
  alarm: string;
  marker: string;
  markerHalo: string;
  markerHaloOpacity: number;
  markerRing: string;
  markerRingOpacity: number;
  imagery: {
    brightness: number;
    contrast: number;
    saturation: number;
    gamma: number;
    alpha: number;
  };
  grid: {
    color: string;
    backgroundColor: string;
  };
}

export const SCENE_THEMES: Record<ThemeMode, ScenePalette> = {
  light: {
    sky: "#D8E6EE",
    fog: "#D8E6EE",
    fogDensity: 0.000006,
    shadowOpacity: 0.16,
    exposure: 1.0,
    hemiSky: "#CBDDE7",
    hemiGround: "#D7D1C3",
    hemiIntensity: 1.3,
    sunColor: "#FFF6E5",
    sunIntensity: 2.5,
    fillColor: "#D6E6F2",
    fillIntensity: 0.5,
    steel: "#93A6AF",
    steelDark: "#465A64",
    concrete: "#A6B1B4",
    building: "#E7E2D6",
    roof: "#5C6D75",
    road: "#6F7C7A",
    tank: "#DDE3E1",
    sulfur: "#C79A2E",
    pipeGas: "#0891B2",
    pipeWater: "#2563EB",
    pipeSelected: "#0B6E99",
    pipeMaintenance: "#B45309",
    pipeStopped: "#64748B",
    pipeCasing: "#F4F8FA",
    pipeCasingOpacity: 0.9,
    blockFillOpacity: 0.18,
    selection: "#0B6E99",
    alarm: "#B3261E",
    marker: "#0B6E99",
    markerHalo: "#0F2A35",
    markerHaloOpacity: 0.9,
    markerRing: "#FFFFFF",
    markerRingOpacity: 0.96,
    imagery: { brightness: 1.12, contrast: 1.04, saturation: 0.72, gamma: 0.98, alpha: 1 },
    grid: { color: "#B9C7CF", backgroundColor: "#EEF2F4" },
  },
  dark: {
    sky: "#0B1216",
    fog: "#0B1216",
    fogDensity: 0.000012,
    shadowOpacity: 0.35,
    exposure: 1.16,
    hemiSky: "#6A8A9C",
    hemiGround: "#332C21",
    hemiIntensity: 1.35,
    sunColor: "#D3E3EC",
    sunIntensity: 2.2,
    fillColor: "#8FB4C4",
    fillIntensity: 0.55,
    steel: "#A9BAC2",
    steelDark: "#3E4C55",
    concrete: "#6E7C81",
    building: "#55636A",
    roof: "#414E55",
    road: "#39454A",
    tank: "#9AA6AA",
    sulfur: "#C79A2E",
    pipeGas: "#2DD4BF",
    pipeWater: "#60A5FA",
    pipeSelected: "#7DD3FC",
    pipeMaintenance: "#F59E0B",
    pipeStopped: "#94A3B8",
    pipeCasing: "#02090C",
    pipeCasingOpacity: 0.75,
    blockFillOpacity: 0.17,
    selection: "#7DD3FC",
    alarm: "#F87171",
    marker: "#38BDF8",
    markerHalo: "#F8FAFC",
    markerHaloOpacity: 0.75,
    markerRing: "#0B1216",
    markerRingOpacity: 0.9,
    imagery: { brightness: 0.82, contrast: 1.02, saturation: 0.35, gamma: 1, alpha: 1 },
    grid: { color: "#2A3A43", backgroundColor: "#101619" },
  },
};

export function getSceneTheme(mode: ThemeMode): ScenePalette {
  return SCENE_THEMES[mode] ?? SCENE_THEMES[DEFAULT_THEME];
}

export const DEFAULT_THEME: ThemeMode = "light";

export function getTheme(mode: ThemeMode): ThemeDefinition {
  return THEMES[mode] ?? THEMES[DEFAULT_THEME];
}

const FONT_BODY = "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";
const FONT_NUMBER = "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";

export const TOKENS = {
  colors: DARK_COLORS,
  fonts: {
    display: FONT_BODY,
    body: FONT_BODY,
    number: FONT_NUMBER,
    mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
  },
  typography: {
    displayLg: {
      fontFamily: FONT_BODY,
      fontSize: "40px",
      fontWeight: 600,
      lineHeight: 1.05,
      letterSpacing: "0.02em",
    },
    headingLg: {
      fontFamily: FONT_BODY,
      fontSize: "24px",
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: "0.02em",
    },
    headingMd: {
      fontFamily: FONT_BODY,
      fontSize: "16px",
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: "0.02em",
    },
    kpiLg: {
      fontFamily: FONT_NUMBER,
      fontSize: "30px",
      fontWeight: 500,
      lineHeight: 1,
      letterSpacing: "0.01em",
    },
    bodyMd: {
      fontFamily: FONT_BODY,
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: 1.55,
      letterSpacing: "0.01em",
    },
    bodySm: {
      fontFamily: FONT_BODY,
      fontSize: "12px",
      fontWeight: 400,
      lineHeight: 1.45,
      letterSpacing: "0.01em",
    },
    caption: {
      fontFamily: FONT_BODY,
      fontSize: "11px",
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: "0.02em",
    },
    label: {
      fontFamily: FONT_BODY,
      fontSize: "10px",
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: "0.04em",
    },
    buttonMd: {
      fontFamily: FONT_BODY,
      fontSize: "13px",
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: "0.02em",
    },
  },
  space: {
    xxs: "2px",
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    xxl: "32px",
    section: "40px",
  },
  radius: {
    none: "0px",
    xs: "2px",
    sm: "4px",
    md: "8px",
    full: "9999px",
  },
  layout: {
    width: 1920,
    height: 1080,
    margin: 24,
    header: 88,
    left: 344,
    right: 384,
    tour: 72,
    status: 24,
    gap: 20,
  },
  motion: {
    micro: 140,
    panel: 280,
    drawer: 320,
    camera: 900,
    pulse: 1600,
    intro: 8500,
  },
  z: {
    cesium: 0,
    solid: 1,
    glow: 2,
    labels: 3,
    atmosphere: 4,
    hud: 5,
    intro: 20,
  },
} as const;

function kebab(input: string): string {
  return input.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/** 生成挂到 .af-page 上的 CSS 变量，避免 HUD 里出现裸色值。 */
export function tokenCssVars(mode: ThemeMode = DEFAULT_THEME): Record<string, string> {
  const vars: Record<string, string> = {};
  const theme = getTheme(mode);

  for (const [key, value] of Object.entries(theme.colors)) {
    vars[`--af-${kebab(key)}`] = value;
  }
  for (const [key, value] of Object.entries(TOKENS.space)) {
    vars[`--af-space-${kebab(key)}`] = value;
  }
  for (const [key, value] of Object.entries(TOKENS.radius)) {
    vars[`--af-radius-${kebab(key)}`] = value;
  }
  for (const [key, value] of Object.entries(TOKENS.layout)) {
    vars[`--af-layout-${kebab(key)}`] = `${value}px`;
  }
  for (const [name, type] of Object.entries(TOKENS.typography)) {
    vars[`--af-type-${kebab(name)}-family`] = type.fontFamily;
    vars[`--af-type-${kebab(name)}-size`] = type.fontSize;
    vars[`--af-type-${kebab(name)}-weight`] = `${type.fontWeight}`;
    vars[`--af-type-${kebab(name)}-line`] = `${type.lineHeight}`;
    vars[`--af-type-${kebab(name)}-tracking`] = type.letterSpacing;
  }
  for (const [key, value] of Object.entries(TOKENS.motion)) {
    vars[`--af-motion-${kebab(key)}`] = `${value}ms`;
  }
  vars["--af-font-display"] = TOKENS.fonts.display;
  vars["--af-font-body"] = TOKENS.fonts.body;
  vars["--af-font-number"] = TOKENS.fonts.number;
  vars["--af-font-mono"] = TOKENS.fonts.mono;

  return vars;
}

export type TokenColors = typeof TOKENS.colors;
