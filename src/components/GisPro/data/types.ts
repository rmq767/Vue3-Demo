export type FeatureKind = "well" | "station" | "pipeline";
export type WellKind = "oil" | "gas" | "water" | "observation";
export type WellStatus = "normal" | "warning" | "offline";
export type StationStatus = "normal" | "maintenance";
export type Medium = "oil" | "gas" | "water";
export type PipelineStatus = "running" | "maintenance" | "stopped";
export type AlarmLevel = "info" | "warning" | "critical";
export type AlarmStatus = "active" | "ack" | "resolved";
export type LayerKey =
  | "wells"
  | "stations"
  | "pipelines"
  | "arcs"
  | "blocks"
  | "underground"
  | "labels";
export type ImageryStatus = "loading" | "esri" | "gaode" | "local" | "offline";
export type Tone = "default" | "primary" | "success" | "warning" | "danger" | "oil" | "muted";

export interface Vec2 {
  x: number;
  z: number;
}

export interface WellMetrics {
  oil: number;
  gas: number;
  water: number;
  pressure: number;
  temp: number;
}

export interface Well {
  id: string;
  name: string;
  blockId: string;
  stationId: string;
  pos: Vec2;
  kind: WellKind;
  status: WellStatus;
  depth: number;
  rotation: number;
  metrics: WellMetrics;
  history: number[];
  reservoirId: string;
  lateralLength: number;
  azimuth: number;
}

export interface Station {
  id: string;
  name: string;
  pos: Vec2;
  type: string;
  capacity: number;
  throughput: number;
  pressure: number;
  status: StationStatus;
  tanks: number;
  buildings: number;
  wellIds: string[];
  rotation: number;
}

export interface Pipeline {
  id: string;
  name: string;
  fromId: string;
  toId: string;
  path: Vec2[];
  medium: Medium;
  diameter: number;
  lengthKm: number;
  flow: number;
  status: PipelineStatus;
}

export interface Block {
  id: string;
  name: string;
  shortName: string;
  colorKey: string;
  center: Vec2;
  radius: number;
  wellIds: string[];
  dailyOil: number;
  dailyGas: number;
}

export interface StrataLayer {
  id: string;
  name: string;
  from: number;
  to: number;
  colorKey: string;
  color: string;
}

export interface ReservoirLayer {
  id: string;
  name: string;
  depth: number;
  thickness: number;
  colorKey: string;
  pressure: number;
  saturation: number;
}

export interface Reservoir {
  id: string;
  name: string;
  shortName: string;
  colorKey: string;
  topDepth: number;
  bottomDepth: number;
  pressure: number;
  saturation: number;
  layers: ReservoirLayer[];
}

export interface Alarm {
  id: string;
  level: AlarmLevel;
  targetType: FeatureKind;
  targetId: string;
  targetName: string;
  message: string;
  ts: number;
  status: AlarmStatus;
}

export interface FieldData {
  center: { lon: number; lat: number };
  blocks: Block[];
  wells: Well[];
  stations: Station[];
  pipelines: Pipeline[];
  reservoirs: Reservoir[];
  strata: StrataLayer[];
  productionHistory: {
    oil: number[];
    gas: number[];
  };
}

export interface Metric {
  label: string;
  value: string;
  unit: string;
  tone?: Tone;
}

export interface FeatureDetail {
  id: string;
  kind: FeatureKind;
  name: string;
  subtitle: string;
  status: string;
  statusLabel: string;
  statusTone: Tone;
  colorKey: string;
  metrics: Metric[];
  history?: number[];
  meta: { label: string; value: string }[];
  wellId?: string;
  stationId?: string;
  pipelineId?: string;
}

export interface BlockRankItem {
  id: string;
  name: string;
  oil: number;
  percent: number;
  colorKey: string;
}

export interface Stats {
  totalOil: number;
  totalGas: number;
  totalWater: number;
  openWells: number;
  totalWells: number;
  waterCut: number;
  pipelineKm: number;
  alarmCount: number;
  reserves: number;
  blockRanking: BlockRankItem[];
  history: {
    oil: number[];
    gas: number[];
  };
}

export interface SearchItem {
  id: string;
  name: string;
  kind: FeatureKind;
  sub: string;
}

export interface TickResult {
  changedWellIds: string[];
  changedStationIds: string[];
  changedPipelineIds: string[];
  stats: Stats;
  alarms: Alarm[];
}

export interface SimulationSnapshot {
  stats: Stats;
  alarms: Alarm[];
}

export interface HoverInfo {
  visible: boolean;
  x: number;
  y: number;
  name: string;
  kindLabel: string;
  meta: string;
}

export interface CameraHud {
  height: number;
  range: number;
  heading: number;
  pitch: number;
}

/**
 * 相机状态：围绕沙盘局部坐标 (x, z) 的 target 做轨道；
 * heading/pitch 单位为度，range 单位为米。
 */
export interface CameraState {
  x: number;
  z: number;
  height: number;
  heading: number;
  pitch: number;
  range: number;
}

export interface CameraShot {
  id: string;
  label: string;
  subtitle?: string;
  duration: number;
  hold?: number;
  cue?: string;
  targetId?: string;
  state: CameraState;
}

export interface TourChapter {
  id: string;
  label: string;
  subtitle: string;
}

export interface TourChapterScript extends TourChapter {
  shots: CameraShot[];
  underground?: boolean;
  labels?: boolean;
  /** 本章进入单井井轨迹视图，值为井 ID；下一章自动回到地面。 */
  trajectoryWellId?: string;
}

export interface TourScript {
  intro: CameraShot[];
  overview: CameraState;
  chapters: TourChapterScript[];
  alarm: {
    shot: CameraShot;
    targetId: string;
    message: string;
    resolveAfter: number;
  };
}

export interface FieldStatsInput {
  alarms: number;
}
