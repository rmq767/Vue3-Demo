import * as turf from "@turf/turf";
import type {
  Block,
  FieldData,
  GisFeature,
  LonLat,
  Pipeline,
  PipelineStatus,
  Platform,
  Status,
  TrajectoryPoint,
  Well,
  WellType,
} from "./types";

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function range(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface BlockSeed {
  id: string;
  name: string;
  color: string;
  boundary: LonLat[];
}

const BLOCK_SEEDS: BlockSeed[] = [
  {
    id: "B-01",
    name: "彭州区块",
    color: "#00e5ff",
    boundary: [
      { lon: 103.70, lat: 31.0 },
      { lon: 103.80, lat: 31.14 },
      { lon: 103.96, lat: 31.17 },
      { lon: 104.04, lat: 31.04 },
      { lon: 103.96, lat: 30.9 },
      { lon: 103.8, lat: 30.87 },
      { lon: 103.7, lat: 30.93 },
    ],
  },
  {
    id: "B-02",
    name: "新都区块",
    color: "#38e0b0",
    boundary: [
      { lon: 103.98, lat: 30.92 },
      { lon: 104.1, lat: 30.99 },
      { lon: 104.28, lat: 30.96 },
      { lon: 104.3, lat: 30.82 },
      { lon: 104.16, lat: 30.7 },
      { lon: 104.0, lat: 30.74 },
    ],
  },
  {
    id: "B-03",
    name: "广汉区块",
    color: "#4d8dff",
    boundary: [
      { lon: 104.06, lat: 31.02 },
      { lon: 104.18, lat: 31.2 },
      { lon: 104.38, lat: 31.22 },
      { lon: 104.46, lat: 31.1 },
      { lon: 104.36, lat: 30.96 },
      { lon: 104.16, lat: 30.96 },
    ],
  },
  {
    id: "B-04",
    name: "金堂区块",
    color: "#b07cff",
    boundary: [
      { lon: 104.4, lat: 30.96 },
      { lon: 104.6, lat: 30.98 },
      { lon: 104.7, lat: 30.85 },
      { lon: 104.62, lat: 30.7 },
      { lon: 104.44, lat: 30.7 },
      { lon: 104.36, lat: 30.82 },
    ],
  },
  {
    id: "B-05",
    name: "中江区块",
    color: "#ffb020",
    boundary: [
      { lon: 104.48, lat: 31.12 },
      { lon: 104.58, lat: 31.3 },
      { lon: 104.78, lat: 31.26 },
      { lon: 104.8, lat: 31.1 },
      { lon: 104.64, lat: 31.0 },
      { lon: 104.5, lat: 31.02 },
    ],
  },
];

interface PlatformSeed {
  id: string;
  name: string;
  blockId: string;
  type: Platform["type"];
  position: LonLat;
  capacity: number;
}

const PLATFORM_SEEDS: PlatformSeed[] = [
  {
    id: "P-01",
    name: "彭州集气站",
    blockId: "B-01",
    type: "集气站",
    position: { lon: 103.9, lat: 31.02 },
    capacity: 120,
  },
  {
    id: "P-02",
    name: "新都采气平台",
    blockId: "B-02",
    type: "采气平台",
    position: { lon: 104.16, lat: 30.84 },
    capacity: 90,
  },
  {
    id: "P-03",
    name: "广汉处理厂",
    blockId: "B-03",
    type: "处理厂",
    position: { lon: 104.3, lat: 31.1 },
    capacity: 150,
  },
  {
    id: "P-04",
    name: "中江增压站",
    blockId: "B-05",
    type: "增压站",
    position: { lon: 104.62, lat: 31.16 },
    capacity: 80,
  },
];

interface WellSeed {
  id: string;
  name: string;
  blockId: string;
  platformId?: string;
  position: LonLat;
  wellType: WellType;
  status: Status;
}

const WELL_SEEDS: WellSeed[] = [
  { id: "W-001", name: "彭州1井", blockId: "B-01", platformId: "P-01", position: { lon: 103.878, lat: 31.038 }, wellType: "直井", status: "normal" },
  { id: "W-002", name: "彭州2-H1", blockId: "B-01", platformId: "P-01", position: { lon: 103.914, lat: 31.046 }, wellType: "水平井", status: "normal" },
  { id: "W-003", name: "彭州3井", blockId: "B-01", platformId: "P-01", position: { lon: 103.862, lat: 31.006 }, wellType: "定向井", status: "warning" },
  { id: "W-004", name: "彭州4井", blockId: "B-01", platformId: "P-01", position: { lon: 103.922, lat: 30.999 }, wellType: "直井", status: "normal" },
  { id: "W-005", name: "彭州5-H2", blockId: "B-01", platformId: "P-01", position: { lon: 103.893, lat: 30.982 }, wellType: "水平井", status: "normal" },
  { id: "W-006", name: "彭州6井", blockId: "B-01", platformId: "P-01", position: { lon: 103.936, lat: 31.02 }, wellType: "定向井", status: "offline" },
  { id: "W-007", name: "新都1井", blockId: "B-02", platformId: "P-02", position: { lon: 104.132, lat: 30.862 }, wellType: "直井", status: "normal" },
  { id: "W-008", name: "新都2-H1", blockId: "B-02", platformId: "P-02", position: { lon: 104.152, lat: 30.872 }, wellType: "水平井", status: "normal" },
  { id: "W-009", name: "新都3井", blockId: "B-02", platformId: "P-02", position: { lon: 104.178, lat: 30.856 }, wellType: "定向井", status: "normal" },
  { id: "W-010", name: "新都4井", blockId: "B-02", platformId: "P-02", position: { lon: 104.14, lat: 30.82 }, wellType: "直井", status: "normal" },
  { id: "W-011", name: "新都5-H2", blockId: "B-02", platformId: "P-02", position: { lon: 104.184, lat: 30.826 }, wellType: "水平井", status: "normal" },
  { id: "W-012", name: "新都6井", blockId: "B-02", platformId: "P-02", position: { lon: 104.196, lat: 30.846 }, wellType: "直井", status: "offline" },
  { id: "W-013", name: "广汉1井", blockId: "B-03", platformId: "P-03", position: { lon: 104.276, lat: 31.118 }, wellType: "直井", status: "normal" },
  { id: "W-014", name: "广汉2-H1", blockId: "B-03", platformId: "P-03", position: { lon: 104.296, lat: 31.102 }, wellType: "水平井", status: "normal" },
  { id: "W-015", name: "广汉3井", blockId: "B-03", platformId: "P-03", position: { lon: 104.322, lat: 31.124 }, wellType: "定向井", status: "normal" },
  { id: "W-016", name: "广汉4-H2", blockId: "B-03", platformId: "P-03", position: { lon: 104.306, lat: 31.074 }, wellType: "水平井", status: "warning" },
  { id: "W-017", name: "广汉5井", blockId: "B-03", platformId: "P-03", position: { lon: 104.262, lat: 31.086 }, wellType: "直井", status: "normal" },
  { id: "W-018", name: "中江1井", blockId: "B-05", platformId: "P-04", position: { lon: 104.592, lat: 31.176 }, wellType: "直井", status: "normal" },
  { id: "W-019", name: "中江2-H1", blockId: "B-05", platformId: "P-04", position: { lon: 104.622, lat: 31.19 }, wellType: "水平井", status: "normal" },
  { id: "W-020", name: "中江3井", blockId: "B-05", platformId: "P-04", position: { lon: 104.648, lat: 31.16 }, wellType: "定向井", status: "normal" },
  { id: "W-021", name: "中江4-H2", blockId: "B-05", platformId: "P-04", position: { lon: 104.612, lat: 31.142 }, wellType: "水平井", status: "warning" },
  { id: "W-022", name: "金堂1井", blockId: "B-04", position: { lon: 104.508, lat: 30.862 }, wellType: "直井", status: "normal" },
  { id: "W-023", name: "金堂2-H1", blockId: "B-04", position: { lon: 104.536, lat: 30.848 }, wellType: "水平井", status: "normal" },
  { id: "W-024", name: "金堂3井", blockId: "B-04", position: { lon: 104.474, lat: 30.826 }, wellType: "定向井", status: "normal" },
];

interface PipelineSeed {
  id: string;
  name: string;
  path: LonLat[];
  medium: Pipeline["medium"];
  diameter: number;
  designPressure: number;
  runStatus: PipelineStatus;
  fromName: string;
  toName: string;
}

const PIPELINE_SEEDS: PipelineSeed[] = [
  {
    id: "PL-01",
    name: "彭州—广汉集气干线",
    medium: "天然气",
    diameter: 400,
    designPressure: 10,
    runStatus: "running",
    fromName: "彭州集气站",
    toName: "广汉处理厂",
    path: [
      { lon: 103.9, lat: 31.02 },
      { lon: 104.02, lat: 31.06 },
      { lon: 104.18, lat: 31.04 },
      { lon: 104.3, lat: 31.1 },
    ],
  },
  {
    id: "PL-02",
    name: "新都—广汉污水线",
    medium: "污水",
    diameter: 150,
    designPressure: 6.3,
    runStatus: "maintenance",
    fromName: "新都采气平台",
    toName: "广汉处理厂",
    path: [
      { lon: 104.16, lat: 30.84 },
      { lon: 104.22, lat: 30.9 },
      { lon: 104.26, lat: 31.0 },
      { lon: 104.3, lat: 31.1 },
    ],
  },
  {
    id: "PL-03",
    name: "广汉—中江输气线",
    medium: "天然气",
    diameter: 350,
    designPressure: 10,
    runStatus: "running",
    fromName: "广汉处理厂",
    toName: "中江增压站",
    path: [
      { lon: 104.3, lat: 31.1 },
      { lon: 104.4, lat: 31.12 },
      { lon: 104.5, lat: 31.12 },
      { lon: 104.62, lat: 31.16 },
    ],
  },
  {
    id: "PL-04",
    name: "中江—金堂集输线",
    medium: "天然气",
    diameter: 300,
    designPressure: 8,
    runStatus: "running",
    fromName: "中江增压站",
    toName: "金堂阀室",
    path: [
      { lon: 104.62, lat: 31.16 },
      { lon: 104.66, lat: 31.06 },
      { lon: 104.58, lat: 30.94 },
      { lon: 104.51, lat: 30.86 },
    ],
  },
  {
    id: "PL-05",
    name: "彭州—新都联络线",
    medium: "天然气",
    diameter: 250,
    designPressure: 8,
    runStatus: "running",
    fromName: "彭州集气站",
    toName: "新都采气平台",
    path: [
      { lon: 103.9, lat: 31.02 },
      { lon: 103.98, lat: 30.94 },
      { lon: 104.08, lat: 30.88 },
      { lon: 104.16, lat: 30.84 },
    ],
  },
  {
    id: "PL-06",
    name: "金堂—外输首站凝析油线",
    medium: "凝析油",
    diameter: 200,
    designPressure: 6.3,
    runStatus: "stopped",
    fromName: "金堂阀室",
    toName: "外输首站",
    path: [
      { lon: 104.51, lat: 30.86 },
      { lon: 104.7, lat: 30.8 },
      { lon: 104.86, lat: 30.86 },
    ],
  },
];

const PIPELINE_STATUS: Record<PipelineStatus, Status> = {
  running: "normal",
  maintenance: "warning",
  stopped: "offline",
};

/** 确定性合成测斜轨迹：造斜段 + 稳斜段，水平井稳斜角约 88° */
function buildTrajectory(
  start: LonLat,
  depth: number,
  type: WellType,
  rng: () => number,
): TrajectoryPoint[] {
  const horizontal = type === "水平井";
  const kickoff = horizontal ? range(rng, 700, 1050) : range(rng, 450, 900);
  const targetAngle = horizontal ? 88 : range(rng, 30, 50);
  const buildLength = horizontal ? range(rng, 1000, 1500) : range(rng, 700, 1200);
  const azimuth = rng() * Math.PI * 2;
  const step = 150;
  const metersPerDegreeLat = 110574;
  const metersPerDegreeLon = 111320 * Math.cos((start.lat * Math.PI) / 180);

  const points: TrajectoryPoint[] = [
    { md: 0, tvd: 0, hd: 0, lon: start.lon, lat: start.lat },
  ];

  let tvd = 0;
  let horizontalDisplacement = 0;
  let md = 0;

  while (md < depth) {
    const delta = Math.min(step, depth - md);
    md += delta;
    let inclination = 0;
    if (md > kickoff) {
      const ratio = Math.min((md - kickoff) / buildLength, 1);
      inclination = targetAngle * ratio;
    }
    const radians = (inclination * Math.PI) / 180;
    tvd += delta * Math.cos(radians);
    horizontalDisplacement += delta * Math.sin(radians);

    const east = horizontalDisplacement * Math.sin(azimuth);
    const north = horizontalDisplacement * Math.cos(azimuth);
    points.push({
      md: round(md, 0),
      tvd: round(tvd, 1),
      hd: round(horizontalDisplacement, 1),
      lon: round(start.lon + east / metersPerDegreeLon, 6),
      lat: round(start.lat + north / metersPerDegreeLat, 6),
    });
  }

  return points;
}

function closedRing(boundary: LonLat[]): [number, number][] {
  const coords = boundary.map((point) => [point.lon, point.lat] as [number, number]);
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (!first || !last || first[0] !== last[0] || first[1] !== last[1]) {
    coords.push([...first] as [number, number]);
  }
  return coords;
}

function pipelineLengthKm(path: LonLat[]): number {
  const line = turf.lineString(path.map((point) => [point.lon, point.lat]));
  return round(turf.length(line, { units: "kilometers" }), 2);
}

function blockAreaKm2(boundary: LonLat[]): number {
  const polygon = turf.polygon([closedRing(boundary)]);
  return round(turf.area(polygon) / 1_000_000, 1);
}

function makeWell(seed: WellSeed, rng: () => number): Well {
  const offline = seed.status === "offline";
  const depth =
    seed.wellType === "水平井"
      ? round(range(rng, 4300, 5300), 0)
      : seed.wellType === "定向井"
        ? round(range(rng, 3600, 4900), 0)
        : round(range(rng, 2800, 4200), 0);
  const dailyGas = offline ? 0 : round(range(rng, 5, 30), 1);
  const pressure = offline ? 0 : round(range(rng, 8, 32), 1);
  const temperature = offline ? round(range(rng, 18, 26), 1) : round(range(rng, 42, 82), 1);
  const history = Array.from({ length: 30 }, () => {
    if (offline) return 0;
    return round(clamp(dailyGas * range(rng, 0.86, 1.14), 0, 40), 1);
  });
  const trajectory =
    seed.wellType === "直井" ? undefined : buildTrajectory(seed.position, depth, seed.wellType, rng);

  return {
    ...seed,
    kind: "well",
    depth,
    dailyGas,
    pressure,
    temperature,
    history,
    trajectory,
  };
}

function makePipeline(seed: PipelineSeed, rng: () => number): Pipeline {
  const flow =
    seed.runStatus === "running"
      ? seed.medium === "天然气"
        ? round(range(rng, 40, 170), 1)
        : seed.medium === "污水"
          ? round(range(rng, 260, 760), 0)
          : round(range(rng, 12, 48), 1)
      : 0;
  return {
    ...seed,
    kind: "pipeline",
    status: PIPELINE_STATUS[seed.runStatus],
    lengthKm: pipelineLengthKm(seed.path),
    flow,
  };
}

export function recalculateAggregates(field: FieldData) {
  field.blocks.forEach((block) => {
    const wells = field.wells.filter((well) => well.blockId === block.id);
    block.wellCount = wells.length;
    block.dailyGas = round(
      wells.reduce((total, well) => total + well.dailyGas, 0),
      1,
    );
  });
  field.platforms.forEach((platform) => {
    const wells = field.wells.filter((well) => well.platformId === platform.id);
    platform.wellIds = wells.map((well) => well.id);
    platform.dailyGas = round(
      wells.reduce((total, well) => total + well.dailyGas, 0),
      1,
    );
    platform.status = wells.some((well) => well.status === "warning") ? "warning" : "normal";
  });
}

export function createFieldData(): FieldData {
  const rng = mulberry32(20261027);

  const wells = WELL_SEEDS.map((seed) => makeWell(seed, rng));
  const blocks: Block[] = BLOCK_SEEDS.map((seed) => {
    const center = turf.centroid(turf.polygon([closedRing(seed.boundary)])).geometry.coordinates;
    return {
      ...seed,
      kind: "block",
      status: "normal",
      center: { lon: center[0], lat: center[1] },
      areaKm2: blockAreaKm2(seed.boundary),
      wellCount: 0,
      dailyGas: 0,
    };
  });
  const platforms: Platform[] = PLATFORM_SEEDS.map((seed) => ({
    ...seed,
    kind: "platform",
    status: "normal",
    dailyGas: 0,
    wellIds: [],
  }));
  const pipelines = PIPELINE_SEEDS.map((seed) => makePipeline(seed, rng));

  const field: FieldData = { blocks, wells, platforms, pipelines };
  recalculateAggregates(field);
  return field;
}

export function findFeature(field: FieldData, id: string): GisFeature | undefined {
  return (
    field.blocks.find((item) => item.id === id) ??
    field.wells.find((item) => item.id === id) ??
    field.platforms.find((item) => item.id === id) ??
    field.pipelines.find((item) => item.id === id)
  );
}

export function wellBlockName(field: FieldData, well: Well): string {
  return field.blocks.find((block) => block.id === well.blockId)?.name ?? "—";
}

export function wellPlatformName(field: FieldData, well: Well): string {
  if (!well.platformId) return "—";
  return field.platforms.find((platform) => platform.id === well.platformId)?.name ?? "—";
}

export function pipelineStatusLabel(code: PipelineStatus): string {
  if (code === "maintenance") return "检修中";
  if (code === "stopped") return "停输";
  return "运行中";
}

export function wellTypeShort(type: WellType): string {
  if (type === "水平井") return "水平井";
  if (type === "定向井") return "定向井";
  return "直井";
}
