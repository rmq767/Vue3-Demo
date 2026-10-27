/**
 * Aurora Field 设计 token（/GisPro 页面级）
 *
 * 单一代码事实源：HUD CSS 变量、Three 材质、ECharts、Cesium 颜色都从这里取。
 * 人类可读契约见根目录 DESIGN.md；新增颜色/字号时两边同步。
 */
export const TOKENS = {
  colors: {
    void: "#02060B",
    deep: "#04101A",
    elevated: "#071925",
    panel: "#06131F",
    panelGlass: "rgba(6, 22, 34, 0.78)",
    panelStrong: "rgba(4, 16, 26, 0.94)",
    hairline: "#12384A",
    lineSoft: "rgba(61, 225, 255, 0.16)",
    lineStrong: "rgba(61, 225, 255, 0.46)",
    primary: "#3DE1FF",
    primaryHover: "#7DEEFF",
    primaryDim: "#1B7D94",
    onPrimary: "#031018",
    success: "#4AF2C8",
    warning: "#FFC857",
    danger: "#FF5D73",
    info: "#5B8CFF",
    violet: "#9B8CFF",
    oil: "#F5A524",
    gas: "#4AF2C8",
    water: "#5B8CFF",
    ink: "#E6F7FF",
    inkSecondary: "#9EB8C8",
    inkMuted: "#5F7B8C",
    white: "#FFFFFF",
    black: "#000000",
  },
  fonts: {
    display: "Bahnschrift, 'DIN Alternate', 'Microsoft YaHei', sans-serif",
    body: "'Microsoft YaHei', 'PingFang SC', 'HarmonyOS Sans SC', sans-serif",
    number: "Bahnschrift, 'DIN Alternate', 'Segoe UI', sans-serif",
    mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
  },
  typography: {
    displayLg: {
      fontFamily: "Bahnschrift, 'DIN Alternate', 'Microsoft YaHei', sans-serif",
      fontSize: "40px",
      fontWeight: 600,
      lineHeight: 1.05,
      letterSpacing: "0.02em",
    },
    headingLg: {
      fontFamily: "Bahnschrift, 'DIN Alternate', 'Microsoft YaHei', sans-serif",
      fontSize: "24px",
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: "0.04em",
    },
    headingMd: {
      fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif",
      fontSize: "16px",
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: "0.06em",
    },
    kpiLg: {
      fontFamily: "Bahnschrift, 'DIN Alternate', 'Segoe UI', sans-serif",
      fontSize: "30px",
      fontWeight: 500,
      lineHeight: 1,
      letterSpacing: "0.02em",
    },
    bodyMd: {
      fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif",
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: 1.55,
      letterSpacing: "0.01em",
    },
    bodySm: {
      fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif",
      fontSize: "12px",
      fontWeight: 400,
      lineHeight: 1.45,
      letterSpacing: "0.01em",
    },
    caption: {
      fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif",
      fontSize: "11px",
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: "0.04em",
    },
    label: {
      fontFamily: "Bahnschrift, 'Segoe UI', sans-serif",
      fontSize: "10px",
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: "0.12em",
    },
    buttonMd: {
      fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif",
      fontSize: "13px",
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: "0.04em",
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
export function tokenCssVars(): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [key, value] of Object.entries(TOKENS.colors)) {
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

  return vars;
}

export type TokenColors = typeof TOKENS.colors;
