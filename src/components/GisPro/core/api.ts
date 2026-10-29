import type { CameraHud, LayerKey } from "../data/types";
import type { ThemeMode } from "../styles/tokens";

export type QualityLevel = "high" | "medium" | "low";

export interface DebugInfo {
  fps: number;
  drawCalls: number;
  triangles: number;
  quality: QualityLevel;
  labels: number;
}

/** 页面与 3D 引擎之间的窄接口；HUD 不直接触碰 Three/Cesium 对象。 */
export interface GisProEngineApi {
  focusFeature(id: string): void;
  clearSelection(): void;
  setLayer(key: LayerKey, visible: boolean): void;
  setTheme(theme: ThemeMode): void;
  openWellTrajectory(id: string): void;
  closeWellTrajectory(): void;
  playTour(): void;
  pauseTour(): void;
  resumeTour(): void;
  nextChapter(): void;
  goToChapter(index: number): void;
  resetView(): void;
  ackAlarm(id: string): void;
  setQuality(quality: QualityLevel): void;
  getCameraHud(): CameraHud;
  getDebugInfo(): DebugInfo;
  destroy(): void;
}
