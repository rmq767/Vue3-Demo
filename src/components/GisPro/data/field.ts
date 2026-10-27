import type {
  Block,
  BlockRankItem,
  FeatureDetail,
  FieldData,
  Medium,
  Pipeline,
  SearchItem,
  Station,
  Stats,
  Vec2,
  Well,
  WellKind,
  WellStatus,
} from "./types";
import { RESERVOIRS, STRATA } from "./reservoir";

const CENTER = { lon: 107.55, lat: 37.35 };

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261027);

function range(min: number, max: number): number {
  return min + rand() * (max - min);
}

function round(value: number, digits = 1): number {
  return Number(value.toFixed(digits));
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function pathLength(path: Vec2[]): number {
  return path.slice(1).reduce((total, point, index) => total + distance(point, path[index]), 0);
}

function midpoint(a: Vec2, b: Vec2, offset = 0): Vec2 {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  return {
    x: (a.x + b.x) / 2 + (-dz / len) * offset,
    z: (a.z + b.z) / 2 + (dx / len) * offset,
  };
}

const BLOCK_DEFS = [
  { id: "B1", name: "北区", shortName: "北", colorKey: "primary", center: { x: -100, z: -780 }, radius: 330, count: 9 },
  { id: "B2", name: "东区", shortName: "东", colorKey: "success", center: { x: 760, z: -430 }, radius: 320, count: 8 },
  { id: "B3", name: "南区", shortName: "南", colorKey: "warning", center: { x: 590, z: 620 }, radius: 330, count: 9 },
  { id: "B4", name: "西区", shortName: "西", colorKey: "violet", center: { x: -760, z: 250 }, radius: 320, count: 8 },
  { id: "B5", name: "中区", shortName: "中", colorKey: "info", center: { x: -170, z: 130 }, radius: 300, count: 8 },
];

const STATION_DEFS = [
  { id: "S-01", name: "极光联合站", pos: { x: 60, z: -70 }, type: "联合站", tanks: 4, buildings: 5, status: "normal" as const },
  { id: "S-02", name: "北区接转站", pos: { x: -230, z: -980 }, type: "接转站", tanks: 2, buildings: 3, status: "normal" as const },
  { id: "S-03", name: "东区接转站", pos: { x: 1020, z: -560 }, type: "接转站", tanks: 2, buildings: 3, status: "normal" as const },
  { id: "S-04", name: "南区计量站", pos: { x: 850, z: 900 }, type: "计量站", tanks: 1, buildings: 2, status: "maintenance" as const },
  { id: "S-05", name: "西区注水站", pos: { x: -1040, z: 400 }, type: "注水站", tanks: 2, buildings: 3, status: "normal" as const },
  { id: "S-06", name: "外输首站", pos: { x: 420, z: -280 }, type: "外输首站", tanks: 3, buildings: 4, status: "normal" as const },
  { id: "S-07", name: "污水站", pos: { x: -430, z: 930 }, type: "污水站", tanks: 2, buildings: 2, status: "normal" as const },
  { id: "S-08", name: "增压站", pos: { x: 520, z: 180 }, type: "增压站", tanks: 1, buildings: 2, status: "normal" as const },
];

const WARNING_IDS = new Set(["W-007", "W-018", "W-024", "W-033"]);
const OFFLINE_IDS = new Set(["W-031", "W-039"]);

function kindFor(index: number): WellKind {
  if (index % 11 === 4) return "water";
  if (index % 11 === 8) return "observation";
  if (index % 7 === 2 || index % 13 === 6) return "gas";
  return "oil";
}

function statusFor(id: string): WellStatus {
  if (WARNING_IDS.has(id)) return "warning";
  if (OFFLINE_IDS.has(id)) return "offline";
  return "normal";
}

function metricsFor(kind: WellKind, status: WellStatus) {
  const offline = status === "offline";
  if (kind === "gas") {
    return {
      oil: offline ? 0 : round(range(0.2, 2.6)),
      gas: offline ? 0 : round(range(6, 19)),
      water: offline ? 0 : round(range(1, 12)),
      pressure: offline ? 0 : round(range(18, 29)),
      temp: offline ? 0 : round(range(52, 76)),
    };
  }
  if (kind === "water") {
    return {
      oil: 0,
      gas: 0,
      water: offline ? 0 : round(range(18, 62)),
      pressure: offline ? 0 : round(range(12, 21)),
      temp: offline ? 0 : round(range(35, 48)),
    };
  }
  if (kind === "observation") {
    return {
      oil: 0,
      gas: 0,
      water: 0,
      pressure: offline ? 0 : round(range(8, 14)),
      temp: offline ? 0 : round(range(30, 42)),
    };
  }
  return {
    oil: offline ? 0 : round(range(9, 46)),
    gas: offline ? 0 : round(range(0.4, 4.8)),
    water: offline ? 0 : round(range(8, 48)),
    pressure: offline ? 0 : round(range(14, 30)),
    temp: offline ? 0 : round(range(45, 84)),
  };
}

function historyFor(base: number, status: WellStatus): number[] {
  const count = 24;
  if (status === "offline") return Array.from({ length: count }, () => 0);
  const values: number[] = [];
  let value = Math.max(1, base);
  for (let i = 0; i < count; i += 1) {
    value = Math.max(0.2, value + range(-base * 0.12, base * 0.12));
    values.push(round(value, 2));
  }
  values[values.length - 1] = round(base, 2);
  return values;
}

function nearestStation(pos: Vec2, stations: Station[]): Station {
  return stations.reduce((best, station) =>
    distance(pos, station.pos) < distance(pos, best.pos) ? station : best,
  );
}

function createStations(): Station[] {
  return STATION_DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    pos: def.pos,
    type: def.type,
    capacity: def.type === "联合站" ? 12000 : def.type === "外输首站" ? 8000 : 3600,
    throughput: 0,
    pressure: round(range(3.2, 9.6)),
    status: def.status,
    tanks: def.tanks,
    buildings: def.buildings,
    wellIds: [],
    rotation: range(0, Math.PI * 2),
  }));
}

function createWells(stations: Station[]): { wells: Well[]; blocks: Block[] } {
  const wells: Well[] = [];
  const blocks: Block[] = [];
  let index = 0;

  for (const def of BLOCK_DEFS) {
    const blockWells: Well[] = [];
    for (let i = 0; i < def.count; i += 1) {
      index += 1;
      const id = `W-${String(index).padStart(3, "0")}`;
      const angle = range(0, Math.PI * 2);
      const radius = def.radius * Math.sqrt(range(0.08, 0.98));
      const pos = {
        x: def.center.x + Math.cos(angle) * radius,
        z: def.center.z + Math.sin(angle) * radius,
      };
      const kind = kindFor(index);
      const status = statusFor(id);
      const metrics = metricsFor(kind, status);
      const station = nearestStation(pos, stations);
      const depth = Math.round(range(1180, 2480));
      const reservoir =
        depth >= 1900 ? RESERVOIRS[2] : depth >= 1450 ? RESERVOIRS[1] : RESERVOIRS[0];
      const well: Well = {
        id,
        name: `极光${String(index).padStart(2, "0")}井`,
        blockId: def.id,
        stationId: station.id,
        pos,
        kind,
        status,
        depth,
        rotation: range(0, Math.PI * 2),
        metrics,
        history: historyFor(metrics.oil || metrics.gas * 8 || 8, status),
        reservoirId: reservoir.id,
        lateralLength: kind === "gas" || index % 5 === 0 ? Math.round(range(380, 980)) : 0,
        azimuth: range(0, Math.PI * 2),
      };
      wells.push(well);
      blockWells.push(well);
      station.wellIds.push(id);
    }

    blocks.push({
      id: def.id,
      name: def.name,
      shortName: def.shortName,
      colorKey: def.colorKey,
      center: def.center,
      radius: def.radius,
      wellIds: blockWells.map((well) => well.id),
      dailyOil: round(blockWells.reduce((total, well) => total + well.metrics.oil, 0)),
      dailyGas: round(blockWells.reduce((total, well) => total + well.metrics.gas, 0)),
    });
  }

  return { wells, blocks };
}

function stationUnit(station: Station): string {
  return station.type === "联合站" || station.type === "外输首站" ? "t/d" : "万方/d";
}

function stationThroughput(station: Station, wells: Well[]): number {
  const list = wells.filter((well) => station.wellIds.includes(well.id));
  if (stationUnit(station) === "t/d") {
    return round(list.reduce((total, well) => total + well.metrics.oil, 0), 0);
  }
  return round(list.reduce((total, well) => total + well.metrics.gas, 0));
}

function createPipelines(stations: Station[], wells: Well[], blocks: Block[]): Pipeline[] {
  const central = stations[0];
  const pipelines: Pipeline[] = [];
  const trunkDefs: { station: Station; medium: Medium; name: string }[] = [
    { station: stations[1], medium: "gas", name: "北区集气干线" },
    { station: stations[2], medium: "oil", name: "东区输油干线" },
    { station: stations[3], medium: "oil", name: "南区输油支线" },
    { station: stations[4], medium: "water", name: "西区注水干线" },
    { station: stations[5], medium: "gas", name: "外输增压干线" },
    { station: stations[6], medium: "water", name: "污水回注干线" },
    { station: stations[7], medium: "oil", name: "中区集油支线" },
  ];

  trunkDefs.forEach((def, index) => {
    const path = [
      def.station.pos,
      midpoint(def.station.pos, central.pos, index % 2 === 0 ? 80 : -80),
      central.pos,
    ];
    pipelines.push({
      id: `P-${String(index + 1).padStart(2, "0")}`,
      name: def.name,
      fromId: def.station.id,
      toId: central.id,
      path,
      medium: def.medium,
      diameter: [219, 273, 323, 377][index % 4],
      lengthKm: round(pathLength(path) / 1000, 2),
      flow: round(range(240, 1680), 0),
      status: index === 4 ? "maintenance" : "running",
    });
  });

  blocks.forEach((block, index) => {
    const well = wells.find((item) => item.blockId === block.id && item.kind === "oil") ??
      wells.find((item) => item.blockId === block.id);
    const target = stations[(index % (stations.length - 1)) + 1];
    if (!well) return;
    const path = [well.pos, midpoint(well.pos, target.pos, index % 2 === 0 ? 44 : -44), target.pos];
    pipelines.push({
      id: `P-${String(pipelines.length + 1).padStart(2, "0")}`,
      name: `${block.shortName}区集输支线`,
      fromId: well.id,
      toId: target.id,
      path,
      medium: index % 3 === 0 ? "gas" : "oil",
      diameter: [159, 219, 273][index % 3],
      lengthKm: round(pathLength(path) / 1000, 2),
      flow: round(range(120, 860), 0),
      status: index === 2 ? "stopped" : "running",
    });
  });

  return pipelines;
}

function createProductionHistory(totalOil: number, totalGas: number): FieldData["productionHistory"] {
  const oil: number[] = [];
  const gas: number[] = [];
  let oilValue = totalOil;
  let gasValue = totalGas;
  for (let i = 0; i < 24; i += 1) {
    oilValue = Math.max(totalOil * 0.82, oilValue + range(-totalOil * 0.035, totalOil * 0.04));
    gasValue = Math.max(totalGas * 0.84, gasValue + range(-totalGas * 0.03, totalGas * 0.045));
    oil.push(round(oilValue, 0));
    gas.push(round(gasValue, 1));
  }
  oil[oil.length - 1] = round(totalOil, 0);
  gas[gas.length - 1] = round(totalGas, 1);
  return { oil, gas };
}

export function createFieldData(): FieldData {
  const stations = createStations();
  const { wells, blocks } = createWells(stations);
  for (const station of stations) {
    station.throughput = stationThroughput(station, wells);
  }
  const pipelines = createPipelines(stations, wells, blocks);
  const totalOil = round(wells.reduce((total, well) => total + well.metrics.oil, 0));
  const totalGas = round(wells.reduce((total, well) => total + well.metrics.gas, 0));

  return {
    center: CENTER,
    blocks,
    wells,
    stations,
    pipelines,
    reservoirs: RESERVOIRS,
    strata: STRATA,
    productionHistory: createProductionHistory(totalOil, totalGas),
  };
}

export function findWell(field: FieldData, id: string): Well | undefined {
  return field.wells.find((well) => well.id === id);
}

export function findStation(field: FieldData, id: string): Station | undefined {
  return field.stations.find((station) => station.id === id);
}

export function findPipeline(field: FieldData, id: string): Pipeline | undefined {
  return field.pipelines.find((pipeline) => pipeline.id === id);
}

export function createSearchIndex(field: FieldData): SearchItem[] {
  return [
    ...field.wells.map((well) => ({
      id: well.id,
      name: well.name,
      kind: "well" as const,
      sub: `${well.kind === "oil" ? "油井" : well.kind === "gas" ? "气井" : well.kind === "water" ? "注水井" : "观察井"} · ${well.metrics.oil.toFixed(1)} t/d`,
    })),
    ...field.stations.map((station) => ({
      id: station.id,
      name: station.name,
      kind: "station" as const,
      sub: `${station.type} · ${station.wellIds.length} 口井`,
    })),
    ...field.pipelines.map((pipeline) => ({
      id: pipeline.id,
      name: pipeline.name,
      kind: "pipeline" as const,
      sub: `${pipelineMediumLabel(pipeline.medium)} · DN${pipeline.diameter}`,
    })),
  ];
}

export function pipelineMediumLabel(medium: Medium): string {
  return medium === "oil" ? "原油" : medium === "gas" ? "天然气" : "采出水";
}

export function pipelineStatusLabel(status: Pipeline["status"]): string {
  return status === "running" ? "运行中" : status === "maintenance" ? "检修中" : "停输";
}

export function wellKindLabel(kind: WellKind): string {
  return kind === "oil" ? "油井" : kind === "gas" ? "气井" : kind === "water" ? "注水井" : "观察井";
}

export function wellStatusLabel(status: WellStatus): string {
  return status === "normal" ? "运行正常" : status === "warning" ? "参数预警" : "停产";
}

function statusTone(status: WellStatus): "success" | "warning" | "muted" {
  return status === "normal" ? "success" : status === "warning" ? "warning" : "muted";
}

function stationThroughputUnit(station: Station): string {
  return stationUnit(station);
}

export function buildFeatureDetail(field: FieldData, id: string): FeatureDetail | null {
  const well = findWell(field, id);
  if (well) {
    const block = field.blocks.find((item) => item.id === well.blockId);
    return {
      id: well.id,
      kind: "well",
      name: well.name,
      subtitle: `${block?.name ?? "—"} · ${wellKindLabel(well.kind)} · ${well.stationId}`,
      status: well.status,
      statusLabel: wellStatusLabel(well.status),
      statusTone: statusTone(well.status),
      colorKey: well.kind === "gas" ? "gas" : well.kind === "water" ? "water" : "oil",
      metrics: [
        { label: "日产油", value: well.metrics.oil.toFixed(1), unit: "t/d", tone: "oil" },
        { label: "日产气", value: well.metrics.gas.toFixed(1), unit: "万方/d", tone: "success" },
        { label: "套压", value: well.metrics.pressure.toFixed(1), unit: "MPa", tone: "primary" },
        { label: "含水", value: well.metrics.water.toFixed(1), unit: "%", tone: "default" },
      ],
      history: well.history,
      meta: [
        { label: "井深", value: `${well.depth} m` },
        { label: "层位", value: field.reservoirs.find((item) => item.id === well.reservoirId)?.name ?? "—" },
        { label: "水平段", value: well.lateralLength ? `${well.lateralLength} m` : "直井" },
        { label: "温度", value: `${well.metrics.temp.toFixed(1)} °C` },
      ],
      wellId: well.id,
    };
  }

  const station = findStation(field, id);
  if (station) {
    const isLiquid = stationUnit(station) === "t/d";
    return {
      id: station.id,
      kind: "station",
      name: station.name,
      subtitle: `${station.type} · ${station.wellIds.length} 口关联井`,
      status: station.status,
      statusLabel: station.status === "normal" ? "运行正常" : "检修中",
      statusTone: station.status === "normal" ? "success" : "warning",
      colorKey: "primary",
      metrics: [
        {
          label: isLiquid ? "外输油量" : "外输气量",
          value: station.throughput.toFixed(isLiquid ? 0 : 1),
          unit: stationThroughputUnit(station),
          tone: isLiquid ? "oil" : "success",
        },
        { label: "外输压力", value: station.pressure.toFixed(1), unit: "MPa", tone: "primary" },
        { label: "设计罐容", value: station.capacity.toLocaleString(), unit: "m³", tone: "default" },
        { label: "关联井数", value: `${station.wellIds.length}`, unit: "口", tone: "default" },
      ],
      meta: [
        { label: "站库类型", value: station.type },
        { label: "储罐", value: `${station.tanks} 座` },
        { label: "厂房", value: `${station.buildings} 栋` },
        { label: "隶属", value: "极光采油厂" },
      ],
      stationId: station.id,
    };
  }

  const pipeline = findPipeline(field, id);
  if (pipeline) {
    const statusToneValue =
      pipeline.status === "running" ? "success" : pipeline.status === "maintenance" ? "warning" : "muted";
    return {
      id: pipeline.id,
      kind: "pipeline",
      name: pipeline.name,
      subtitle: `${pipelineMediumLabel(pipeline.medium)} · DN${pipeline.diameter} · ${pipeline.lengthKm.toFixed(2)} km`,
      status: pipeline.status,
      statusLabel: pipelineStatusLabel(pipeline.status),
      statusTone: statusToneValue,
      colorKey: pipeline.medium,
      metrics: [
        { label: "瞬时流量", value: pipeline.flow.toFixed(0), unit: "m³/h", tone: "primary" },
        { label: "管径", value: `DN${pipeline.diameter}`, unit: "", tone: "default" },
        { label: "长度", value: pipeline.lengthKm.toFixed(2), unit: "km", tone: "default" },
        { label: "介质", value: pipelineMediumLabel(pipeline.medium), unit: "", tone: "oil" },
      ],
      history: field.productionHistory.oil.slice(-12),
      meta: [
        { label: "起点", value: featureName(field, pipeline.fromId) },
        { label: "终点", value: featureName(field, pipeline.toId) },
        { label: "运行状态", value: pipelineStatusLabel(pipeline.status) },
        { label: "管道编号", value: pipeline.id },
      ],
      pipelineId: pipeline.id,
    };
  }

  return null;
}

export function featureName(field: FieldData, id: string): string {
  return (
    findWell(field, id)?.name ??
    findStation(field, id)?.name ??
    findPipeline(field, id)?.name ??
    id
  );
}

export function createStats(field: FieldData, alarmCount = 0): Stats {
  const totalOil = round(field.wells.reduce((total, well) => total + well.metrics.oil, 0));
  const totalGas = round(field.wells.reduce((total, well) => total + well.metrics.gas, 0));
  const totalWater = round(
    field.wells.reduce((total, well) => total + well.metrics.water, 0) / Math.max(1, field.wells.length),
  );
  const openWells = field.wells.filter((well) => well.status !== "offline").length;
  const waterCut = totalWater;
  const maxOil = Math.max(...field.blocks.map((block) => block.dailyOil), 1);
  const blockRanking: BlockRankItem[] = [...field.blocks]
    .sort((a, b) => b.dailyOil - a.dailyOil)
    .map((block) => ({
      id: block.id,
      name: block.name,
      oil: block.dailyOil,
      percent: Math.max(6, (block.dailyOil / maxOil) * 100),
      colorKey: block.colorKey,
    }));

  return {
    totalOil,
    totalGas,
    totalWater,
    openWells,
    totalWells: field.wells.length,
    waterCut,
    pipelineKm: round(field.pipelines.reduce((total, pipeline) => total + pipeline.lengthKm, 0), 1),
    alarmCount,
    reserves: 1.286,
    blockRanking,
    history: {
      oil: [...field.productionHistory.oil],
      gas: [...field.productionHistory.gas],
    },
  };
}

export function stationDisplayUnit(station: Station): string {
  return stationUnit(station);
}
