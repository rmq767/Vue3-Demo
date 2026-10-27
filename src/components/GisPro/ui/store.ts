import { reactive } from "vue";
import type { GisProEngineApi, QualityLevel } from "../core/api";
import { createSearchIndex, createStats } from "../data/field";
import type {
  Alarm,
  CameraHud,
  FeatureDetail,
  FieldData,
  HoverInfo,
  ImageryStatus,
  LayerKey,
  Reservoir,
  SearchItem,
  Stats,
} from "../data/types";

export type SceneMode = "surface" | "trajectory";

export interface HudState {
  ready: boolean;
  introPlaying: boolean;
  introCanSkip: boolean;
  tourPlaying: boolean;
  tourChapter: number;
  tourCanResume: boolean;
  tourProgress: number;
  sceneMode: SceneMode;
  tourTrajectory: boolean;
  underground: boolean;
  layers: Record<LayerKey, boolean>;
  stats: Stats;
  alarms: Alarm[];
  selected: FeatureDetail | null;
  hover: HoverInfo;
  search: SearchItem[];
  reservoirs: Reservoir[];
  imagery: ImageryStatus;
  quality: QualityLevel;
  fps: number;
  camera: CameraHud;
  clock: string;
  date: string;
  toast: string;
  caption: {
    visible: boolean;
    label: string;
    subtitle: string;
  };
}

const emptyStats = (): Stats => ({
  totalOil: 0,
  totalGas: 0,
  totalWater: 0,
  openWells: 0,
  totalWells: 0,
  waterCut: 0,
  pipelineKm: 0,
  alarmCount: 0,
  reserves: 0,
  blockRanking: [],
  history: {
    oil: Array.from({ length: 24 }, () => 0),
    gas: Array.from({ length: 24 }, () => 0),
  },
});

function clockText(date: Date): string {
  const pad = (value: number) => `${value}`.padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function dateText(date: Date): string {
  const pad = (value: number) => `${value}`.padStart(2, "0");
  const weeks = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${weeks[date.getDay()]}`;
}

const now = new Date();

export const state = reactive<HudState>({
  ready: false,
  introPlaying: false,
  introCanSkip: false,
  tourPlaying: false,
  tourChapter: 0,
  tourCanResume: false,
  tourProgress: 0,
  sceneMode: "surface",
  tourTrajectory: false,
  underground: false,
  layers: {
    wells: true,
    stations: true,
    pipelines: true,
    arcs: false,
    blocks: true,
    underground: false,
    labels: true,
  },
  stats: emptyStats(),
  alarms: [],
  selected: null,
  hover: {
    visible: false,
    x: 0,
    y: 0,
    name: "",
    kindLabel: "",
    meta: "",
  },
  search: [],
  reservoirs: [],
  imagery: "loading",
  quality: "high",
  fps: 0,
  camera: { height: 0, range: 0, heading: 0, pitch: 0 },
  clock: clockText(now),
  date: dateText(now),
  toast: "",
  caption: {
    visible: false,
    label: "",
    subtitle: "",
  },
});

let api: GisProEngineApi | null = null;
let toastTimer = 0;

export function bindEngine(engine: GisProEngineApi): void {
  api = engine;
}

export function unbindEngine(): void {
  api = null;
}

export function initStore(field: FieldData): void {
  state.ready = false;
  state.introPlaying = false;
  state.tourPlaying = false;
  state.tourChapter = 0;
  state.tourCanResume = false;
  state.tourProgress = 0;
  state.sceneMode = "surface";
  state.tourTrajectory = false;
  state.selected = null;
  state.stats = createStats(field, 0);
  state.search = createSearchIndex(field);
  state.alarms = [];
  state.reservoirs = field.reservoirs;
}

export function applySnapshot(stats: Stats, alarms: Alarm[]): void {
  state.stats = stats;
  state.alarms = alarms;
}

export function setAlarms(alarms: Alarm[]): void {
  state.alarms = alarms;
}

export function setSelected(detail: FeatureDetail | null): void {
  state.selected = detail;
}

export function setHover(hover: HoverInfo): void {
  state.hover = hover;
}

export function setCamera(camera: CameraHud): void {
  state.camera = camera;
}

export function setFps(fps: number): void {
  state.fps = fps;
}

export function setQuality(quality: QualityLevel): void {
  state.quality = quality;
}

export function setImagery(imagery: ImageryStatus): void {
  state.imagery = imagery;
}

export function setReady(ready: boolean): void {
  state.ready = ready;
}

export function setIntro(playing: boolean, canSkip = playing): void {
  state.introPlaying = playing;
  state.introCanSkip = canSkip;
}

export function setTour(patch: {
  playing?: boolean;
  chapter?: number;
  canResume?: boolean;
}): void {
  if (patch.playing !== undefined) state.tourPlaying = patch.playing;
  if (patch.chapter !== undefined) state.tourChapter = patch.chapter;
  if (patch.canResume !== undefined) state.tourCanResume = patch.canResume;
}

export function setTourProgress(progress: number): void {
  state.tourProgress = Math.max(0, Math.min(100, progress));
}

export function setSceneMode(mode: SceneMode): void {
  state.sceneMode = mode;
  state.underground = false;
  state.layers.underground = false;
}

export function setTourTrajectory(active: boolean): void {
  state.tourTrajectory = active;
}

export function setClock(date = new Date()): void {
  state.clock = clockText(date);
  state.date = dateText(date);
}

export function setCaption(label: string, subtitle = ""): void {
  state.caption.visible = Boolean(label);
  state.caption.label = label;
  state.caption.subtitle = subtitle;
}

export function setLayerState(key: LayerKey, visible: boolean): void {
  state.layers[key] = visible;
}

export function showToast(message: string): void {
  state.toast = message;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    state.toast = "";
  }, 2200);
}

export const actions = {
  focus(id: string): void {
    api?.focusFeature(id);
  },
  clearSelection(): void {
    api?.clearSelection();
  },
  setLayer(key: LayerKey, visible: boolean): void {
    if (key === "underground") {
      actions.setUnderground(visible);
      return;
    }
    state.layers[key] = visible;
    api?.setLayer(key, visible);
  },
  toggleLayer(key: LayerKey): void {
    actions.setLayer(key, !state.layers[key]);
  },
  setUnderground(active: boolean): void {
    state.underground = false;
    state.layers.underground = false;
    void active;
    api?.setUnderground(false);
  },
  toggleUnderground(): void {
    actions.setUnderground(false);
  },
  openWellTrajectory(id: string): void {
    api?.openWellTrajectory(id);
  },
  closeWellTrajectory(): void {
    api?.closeWellTrajectory();
  },
  playTour(): void {
    api?.playTour();
  },
  pauseTour(): void {
    api?.pauseTour();
  },
  resumeTour(): void {
    api?.resumeTour();
  },
  nextChapter(): void {
    api?.nextChapter();
  },
  goToChapter(index: number): void {
    api?.goToChapter(index);
  },
  skipIntro(): void {
    api?.skipIntro();
  },
  resetView(): void {
    api?.resetView();
  },
  ackAlarm(id: string): void {
    api?.ackAlarm(id);
    state.alarms = state.alarms.map((alarm) =>
      alarm.id === id && alarm.status === "active" ? { ...alarm, status: "ack" } : alarm,
    );
  },
  replayAlarm(): void {
    api?.replayAlarm();
  },
  setQuality(quality: QualityLevel): void {
    state.quality = quality;
    api?.setQuality(quality);
  },
};
