import type { Group, Leafer } from "leafer-ui";
import { SHEET } from "./theme";
import type { FieldNode, Point } from "./types";

export interface CameraState {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.28;
const MAX_SCALE = 2.6;

export class CameraController {
  readonly state: CameraState = { x: 0, y: 0, scale: 1 };

  private frame = 0;
  private onChange?: (state: CameraState) => void;

  constructor(
    private readonly leafer: Leafer,
    private readonly world: Group,
    onChange?: (state: CameraState) => void
  ) {
    this.onChange = onChange;
  }

  get viewportWidth(): number {
    return Number(this.leafer.width) || 0;
  }

  get viewportHeight(): number {
    return Number(this.leafer.height) || 0;
  }

  apply(): void {
    this.world.set({
      x: this.state.x,
      y: this.state.y,
      scale: this.state.scale,
    });
    this.onChange?.({ ...this.state });
  }

  fit(padding = 52): void {
    this.stop();
    const width = this.viewportWidth;
    const height = this.viewportHeight;
    if (!width || !height) return;

    const scale = clamp(
      Math.min(
        (width - padding * 2) / SHEET.width,
        (height - padding * 2) / SHEET.height
      ),
      MIN_SCALE,
      MAX_SCALE
    );

    this.state.scale = scale;
    this.state.x = (width - SHEET.width * scale) / 2;
    this.state.y = (height - SHEET.height * scale) / 2;
    this.apply();
  }

  fitAnimated(padding = 52): void {
    const width = this.viewportWidth;
    const height = this.viewportHeight;
    if (!width || !height) return;

    const scale = clamp(
      Math.min(
        (width - padding * 2) / SHEET.width,
        (height - padding * 2) / SHEET.height
      ),
      MIN_SCALE,
      MAX_SCALE
    );

    this.animateTo({
      scale,
      x: (width - SHEET.width * scale) / 2,
      y: (height - SHEET.height * scale) / 2,
    });
  }

  zoomAt(px: number, py: number, factor: number): void {
    this.stop();
    const nextScale = clamp(this.state.scale * factor, MIN_SCALE, MAX_SCALE);
    if (Math.abs(nextScale - this.state.scale) < 0.0001) return;

    const ratio = nextScale / this.state.scale;
    this.state.x = px - (px - this.state.x) * ratio;
    this.state.y = py - (py - this.state.y) * ratio;
    this.state.scale = nextScale;
    this.apply();
  }

  zoomBy(factor: number): void {
    this.zoomAt(this.viewportWidth / 2, this.viewportHeight / 2, factor);
  }

  panBy(dx: number, dy: number): void {
    this.stop();
    this.state.x += dx;
    this.state.y += dy;
    this.apply();
  }

  focusNode(node: FieldNode): void {
    const scale = clamp(Math.max(this.state.scale, 1.05), MIN_SCALE, 1.6);
    this.animateTo({
      scale,
      x: this.viewportWidth / 2 - node.x * scale,
      y: this.viewportHeight / 2 - node.y * scale,
    });
  }

  handleResize(prevWidth: number, prevHeight: number): void {
    const width = this.viewportWidth;
    const height = this.viewportHeight;
    if (!width || !height) return;

    if (!prevWidth || !prevHeight) {
      this.fit();
      return;
    }

    const center = this.toWorld(prevWidth / 2, prevHeight / 2);
    this.state.x = width / 2 - center.x * this.state.scale;
    this.state.y = height / 2 - center.y * this.state.scale;
    this.apply();
  }

  toWorld(px: number, py: number): Point {
    return {
      x: (px - this.state.x) / this.state.scale,
      y: (py - this.state.y) / this.state.scale,
    };
  }

  getState(): CameraState {
    return { ...this.state };
  }

  setState(state: CameraState): void {
    this.stop();
    this.state.x = state.x;
    this.state.y = state.y;
    this.state.scale = state.scale;
    this.apply();
  }

  stop(): void {
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  destroy(): void {
    this.stop();
    this.onChange = undefined;
  }

  private animateTo(target: CameraState, duration = 240): void {
    this.stop();
    const from = { ...this.state };
    const start = performance.now();

    const tick = (now: number) => {
      const raw = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - raw, 3);
      this.state.x = from.x + (target.x - from.x) * eased;
      this.state.y = from.y + (target.y - from.y) * eased;
      this.state.scale = from.scale + (target.scale - from.scale) * eased;
      this.apply();

      if (raw < 1) {
        this.frame = requestAnimationFrame(tick);
      } else {
        this.frame = 0;
      }
    };

    this.frame = requestAnimationFrame(tick);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
