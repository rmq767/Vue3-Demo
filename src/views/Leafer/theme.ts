import type { Medium, NodeStatus } from "./types";

export const COLORS = {
  page: "#ddd8ca",
  sheet: "#f5f2e9",
  sheetOff: "#efeadd",
  panel: "#1d2a2f",
  panelSoft: "#2a3a3f",
  ink: "#1d2a2f",
  inkSoft: "#66757a",
  inkFaint: "#98a19f",
  hairline: "#d8d2c3",
  grid: "#e7e2d5",
  gridMajor: "#d6cebc",
  frame: "#b9b19e",
  accent: "#1f6f78",
  accentSoft: "#dcebe8",
  white: "#ffffff",
} as const;

export const STATUS_COLOR: Record<NodeStatus, string> = {
  running: "#2f7d6e",
  standby: "#6b7a80",
  maintenance: "#b24a3f",
};

export const MEDIUM_COLOR: Record<Medium, string> = {
  mixed: "#3f6b72",
  oil: "#b57325",
  gas: "#2f7d6e",
  water: "#4e6e8e",
};

export const FONT_DISPLAY =
  'Bahnschrift, "DIN Alternate", "Segoe UI", "Microsoft YaHei", sans-serif';
export const FONT_BODY =
  '"Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif';
export const FONT_MONO =
  '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

export const SHEET = {
  width: 1440,
  height: 900,
  margin: 28,
} as const;

export const GRID = {
  minor: 20,
  major: 100,
} as const;

export const DRAG_BOUNDS = {
  x: 80,
  y: 100,
  width: 1160,
  height: 540,
} as const;

export const LABEL_WIDTH = 156;

export function themeCssVars(): Record<string, string> {
  return {
    "--lf-page": COLORS.page,
    "--lf-paper": COLORS.sheet,
    "--lf-paper-off": COLORS.sheetOff,
    "--lf-panel": COLORS.panel,
    "--lf-panel-soft": COLORS.panelSoft,
    "--lf-ink": COLORS.ink,
    "--lf-ink-soft": COLORS.inkSoft,
    "--lf-ink-faint": COLORS.inkFaint,
    "--lf-hairline": COLORS.hairline,
    "--lf-accent": COLORS.accent,
    "--lf-accent-soft": COLORS.accentSoft,
    "--lf-font-display": FONT_DISPLAY,
    "--lf-font-body": FONT_BODY,
    "--lf-font-mono": FONT_MONO,
  };
}
