export type Kind = "block" | "well" | "platform" | "pipeline";
export type Status = "normal" | "warning" | "offline";
export type WellType = "直井" | "定向井" | "水平井";
export type PipelineStatus = "running" | "maintenance" | "stopped";

export interface LonLat {
  lon: number;
  lat: number;
}

interface Base {
  id: string;
  name: string;
  kind: Kind;
  status: Status;
}

export interface Block extends Base {
  kind: "block";
  boundary: LonLat[];
  center: LonLat;
  color: string;
  areaKm2: number;
  wellCount: number;
  dailyGas: number;
}

export interface TrajectoryPoint {
  md: number;
  tvd: number;
  hd: number;
  lon: number;
  lat: number;
}

export interface Well extends Base {
  kind: "well";
  blockId: string;
  platformId?: string;
  position: LonLat;
  wellType: WellType;
  depth: number;
  dailyGas: number;
  pressure: number;
  temperature: number;
  history: number[];
  trajectory?: TrajectoryPoint[];
}

export interface Platform extends Base {
  kind: "platform";
  blockId: string;
  position: LonLat;
  type: "集气站" | "采气平台" | "处理厂" | "增压站";
  capacity: number;
  dailyGas: number;
  wellIds: string[];
}

export interface Pipeline extends Base {
  kind: "pipeline";
  path: LonLat[];
  medium: "天然气" | "污水" | "凝析油";
  diameter: number;
  lengthKm: number;
  designPressure: number;
  flow: number;
  fromName: string;
  toName: string;
  runStatus: PipelineStatus;
}

export type GisFeature = Block | Well | Platform | Pipeline;

export interface Alarm {
  id: string;
  ts: number;
  level: "info" | "warning" | "danger";
  sourceId: string;
  sourceName: string;
  message: string;
  expiresAt?: number;
}

export interface FieldEvent {
  id: string;
  ts: number;
  level: "info" | "warning" | "danger";
  sourceId: string;
  sourceName: string;
  message: string;
}

export interface FieldData {
  blocks: Block[];
  wells: Well[];
  platforms: Platform[];
  pipelines: Pipeline[];
}

export interface SearchItem {
  id: string;
  name: string;
  kind: Kind;
  sub: string;
}

export interface LayerItem {
  key: "block" | "well" | "platform" | "pipeline" | "trajectory";
  label: string;
  count: number;
  color: string;
  visible: boolean;
}

export interface BlockRankingItem {
  id: string;
  name: string;
  color: string;
  gas: number;
  percent: number;
}

export interface HeaderStats {
  wells: number;
  openWells: number;
  gas: number;
  pipelineKm: number;
  alarms: number;
}
