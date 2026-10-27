import type { Status, WellType } from "../data/types";

const iconCache = new Map<string, string>();

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");
  return { canvas, context };
}

function rgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(
    normalized.length === 3
      ? normalized.split("").map((char) => char + char).join("")
      : normalized,
    16,
  );
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

const STATUS_COLORS: Record<Status, string> = {
  normal: "#00e5ff",
  warning: "#ffb020",
  offline: "#71889a",
};

function drawWellGlyph(
  context: CanvasRenderingContext2D,
  type: WellType,
  color: string,
) {
  context.save();
  context.strokeStyle = "rgba(235, 250, 255, 0.95)";
  context.lineWidth = 1.7;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = color;
  context.shadowBlur = 4;

  if (type === "直井") {
    context.beginPath();
    context.moveTo(32, 13);
    context.lineTo(32, 39);
    context.moveTo(25, 39);
    context.lineTo(32, 27);
    context.lineTo(39, 39);
    context.moveTo(27, 15);
    context.lineTo(37, 15);
    context.stroke();
  } else if (type === "定向井") {
    context.beginPath();
    context.moveTo(23, 39);
    context.lineTo(37, 14);
    context.moveTo(31, 39);
    context.lineTo(37, 14);
    context.moveTo(27, 24);
    context.lineTo(34, 25);
    context.stroke();
  } else {
    context.beginPath();
    context.moveTo(25, 13);
    context.lineTo(25, 31);
    context.lineTo(41, 31);
    context.moveTo(36, 26);
    context.lineTo(41, 31);
    context.lineTo(36, 36);
    context.stroke();
  }
  context.restore();
}

export function wellIcon(type: WellType, status: Status): string {
  const key = `well-${type}-${status}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const color = STATUS_COLORS[status];
  const { canvas, context } = createCanvas(64, 64);

  context.save();
  context.shadowColor = color;
  context.shadowBlur = 16;
  context.fillStyle = "rgba(3, 15, 25, 0.9)";
  context.strokeStyle = color;
  context.lineWidth = 2.2;
  roundRect(context, 11, 8, 42, 34, 6);
  context.fill();
  context.stroke();
  context.restore();

  context.save();
  context.fillStyle = "rgba(3, 15, 25, 0.9)";
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(23, 41);
  context.lineTo(32, 58);
  context.lineTo(41, 41);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = color;
  context.beginPath();
  context.ellipse(32, 58, 7, 2.4, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();

  drawWellGlyph(context, type, color);

  if (status === "warning") {
    context.save();
    context.fillStyle = "#ffb020";
    context.beginPath();
    context.arc(14, 11, 3, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  const url = canvas.toDataURL("image/png");
  iconCache.set(key, url);
  return url;
}

export function platformIcon(hasAlarm: boolean, type = "平台"): string {
  const key = `platform-${hasAlarm}-${type}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const color = hasAlarm ? "#ffb020" : "#3cf5c8";
  const { canvas, context } = createCanvas(72, 72);

  context.save();
  context.shadowColor = color;
  context.shadowBlur = 16;
  context.fillStyle = "rgba(3, 15, 25, 0.92)";
  context.strokeStyle = color;
  context.lineWidth = 2.4;
  context.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = 36 + Math.cos(angle) * 27;
    const y = 32 + Math.sin(angle) * 27;
    if (i === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();

  context.save();
  context.strokeStyle = "rgba(235, 250, 255, 0.95)";
  context.lineWidth = 1.8;
  context.lineCap = "round";
  context.shadowColor = color;
  context.shadowBlur = 4;
  context.beginPath();
  context.moveTo(25, 43);
  context.lineTo(25, 19);
  context.moveTo(47, 43);
  context.lineTo(47, 19);
  context.moveTo(25, 27);
  context.lineTo(47, 27);
  context.moveTo(25, 36);
  context.lineTo(47, 36);
  context.moveTo(21, 43);
  context.lineTo(51, 43);
  context.stroke();
  context.fillStyle = color;
  context.beginPath();
  context.arc(36, 18, 3.2, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.save();
  context.fillStyle = rgba(color, 0.35);
  context.beginPath();
  context.ellipse(36, 63, 16, 4, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();

  const url = canvas.toDataURL("image/png");
  iconCache.set(key, url);
  return url;
}

export function particleIcon(color: string): string {
  const key = `particle-${color}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const { canvas, context } = createCanvas(24, 24);
  const gradient = context.createRadialGradient(12, 12, 0, 12, 12, 12);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.28, rgba(color, 0.95));
  gradient.addColorStop(1, rgba(color, 0));
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(12, 12, 12, 0, Math.PI * 2);
  context.fill();

  const url = canvas.toDataURL("image/png");
  iconCache.set(key, url);
  return url;
}

/** 实时数据脉冲环：白色描边，使用时通过 billboard.color 着色 */
export function pulseRingIcon(): string {
  const cached = iconCache.get("pulse-ring");
  if (cached) return cached;

  const { canvas, context } = createCanvas(128, 128);
  context.translate(64, 64);
  context.strokeStyle = "#ffffff";
  context.shadowColor = "#ffffff";

  context.shadowBlur = 12;
  context.lineWidth = 3;
  context.beginPath();
  context.arc(0, 0, 52, 0, Math.PI * 2);
  context.stroke();

  context.shadowBlur = 0;
  context.globalAlpha = 0.55;
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(0, 0, 43, 0, Math.PI * 2);
  context.stroke();

  const url = canvas.toDataURL("image/png");
  iconCache.set("pulse-ring", url);
  return url;
}

/**
 * 光墙竖直渐变纹理。
 * WallGeometry 底边 st.y=0、顶边 st.y=1，因此画布首行（纹理 v=0）对应墙底，需最亮。
 */
export function wallGradient(color: string): string {
  const key = `wall-${color}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const { canvas, context } = createCanvas(8, 256);
  const gradient = context.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, rgba(color, 0.52));
  gradient.addColorStop(0.3, rgba(color, 0.2));
  gradient.addColorStop(1, rgba(color, 0));
  context.fillStyle = gradient;
  context.fillRect(0, 0, 8, 256);

  const url = canvas.toDataURL("image/png");
  iconCache.set(key, url);
  return url;
}
