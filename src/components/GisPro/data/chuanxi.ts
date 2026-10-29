import type {
  Block,
  BlockRankItem,
  FeatureDetail,
  FieldData,
  FieldMeta,
  Medium,
  Pipeline,
  PipelineService,
  PlatformInfo,
  SearchItem,
  Station,
  StationMedium,
  Stats,
  Vec2,
  Well,
  WellKind,
  WellStatus,
} from "./types";
import { RESERVOIRS, STRATA } from "./reservoir";
import { lonLatToLocal } from "./geo";

const CENTER = { lon: 103.93, lat: 31.04 };

const META: FieldMeta = {
  reservesGas: 1140,
  areaKm2: 139,
  annualCapacity: 20,
  annualOutput2024: 13.7,
  sulfurAnnual: 13,
  pipelineKm: 53,
  platformCount: 6,
  wellCount: 29,
  purifiedYield: 0.884,
};

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

const rand = mulberry32(20261029);

function range(min: number, max: number): number {
  return min + rand() * (max - min);
}

function round(value: number, digits = 1): number {
  return Number(value.toFixed(digits));
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

interface WellSeed {
  id: string;
  name: string;
  gas: number;
  depth: number;
  lateral: number;
  testGas?: number;
  status?: WellStatus;
  h2s?: number;
  pressure?: number;
  temp?: number;
  water?: number;
  commissionedAt?: string;
}

interface PlatformSeed {
  id: string;
  name: string;
  blockId: string;
  stationId: string;
  lon: number;
  lat: number;
  commissionedAt: string;
  wells: WellSeed[];
}

interface StationSeed {
  id: string;
  name: string;
  lon: number;
  lat: number;
  type: string;
  medium: StationMedium;
  tanks: number;
  buildings: number;
  capacity: number;
  pressure: number;
  units?: number;
  vehicles?: number;
  staff?: number;
  coverageKm?: number;
  h2sOut?: number;
  commissionedAt: string;
}

interface BlockSeed {
  id: string;
  name: string;
  shortName: string;
  county: string;
  colorKey: string;
  platformIds: string[];
  radius: number;
}

interface PipelineSeed {
  id: string;
  name: string;
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  service: PipelineService;
  medium: Medium;
  diameter: number;
  designPressure: number;
  lengthKm: number;
  status: Pipeline["status"];
}

const PLATFORM_SEEDS: PlatformSeed[] = [
  {
    id: "PF-03",
    name: "3#平台",
    blockId: "B-01",
    stationId: "S-02",
    lon: 103.86,
    lat: 31.06,
    commissionedAt: "2022-03",
    wells: [
      { id: "W-301", name: "彭州3-1D", gas: 18.2, depth: 6180, lateral: 980 },
      { id: "W-302", name: "彭州3-2D", gas: 16.7, depth: 6250, lateral: 1050 },
      { id: "W-303", name: "彭州3-3D", gas: 15.4, depth: 6120, lateral: 900 },
      { id: "W-304", name: "彭州3-4D", gas: 14.8, depth: 6300, lateral: 1120 },
    ],
  },
  {
    id: "PF-04",
    name: "4#平台",
    blockId: "B-02",
    stationId: "S-02",
    lon: 103.895,
    lat: 31.09,
    commissionedAt: "2022-03",
    wells: [
      { id: "W-401", name: "彭州4-1D", gas: 17.5, depth: 6320, lateral: 1000 },
      { id: "W-402", name: "彭州4-2D", gas: 22.0, depth: 6380, lateral: 1100, testGas: 47 },
      { id: "W-403", name: "彭州4-3D", gas: 16.1, depth: 6280, lateral: 950 },
      { id: "W-404", name: "彭州4-4D", gas: 15.2, depth: 6400, lateral: 1080 },
      { id: "W-405", name: "彭州4-5D", gas: 13.3, depth: 6350, lateral: 1020 },
    ],
  },
  {
    id: "PF-05",
    name: "5#平台",
    blockId: "B-01",
    stationId: "S-03",
    lon: 103.825,
    lat: 30.995,
    commissionedAt: "2023-06",
    wells: [
      { id: "W-501", name: "彭州5-1D", gas: 28.5, depth: 8208, lateral: 1200, testGas: 95, commissionedAt: "2023-06" },
      { id: "W-502", name: "彭州5-2D", gas: 19.2, depth: 7900, lateral: 1150 },
      { id: "W-503", name: "彭州5-3D", gas: 17.0, depth: 7760, lateral: 1080 },
      { id: "W-504", name: "彭州5-4D", gas: 15.7, depth: 7680, lateral: 1020 },
      { id: "W-505", name: "彭州5-5D", gas: 14.1, depth: 7520, lateral: 980 },
    ],
  },
  {
    id: "PF-06",
    name: "6#平台",
    blockId: "B-03",
    stationId: "S-04",
    lon: 103.955,
    lat: 31.06,
    commissionedAt: "2024-03",
    wells: [
      { id: "W-601", name: "彭州6-1D", gas: 18.6, depth: 6420, lateral: 1040 },
      { id: "W-602", name: "彭州6-2D", gas: 17.8, depth: 6380, lateral: 980 },
      { id: "W-603", name: "彭州6-3D", gas: 16.9, depth: 6300, lateral: 920 },
      { id: "W-604", name: "彭州6-4D", gas: 16.2, depth: 6260, lateral: 880 },
      { id: "W-605", name: "彭州6-5D", gas: 15.1, depth: 6220, lateral: 850 },
      { id: "W-606", name: "彭州6-6D", gas: 0, depth: 6100, lateral: 0, status: "offline" },
    ],
  },
  {
    id: "PF-07",
    name: "7#平台",
    blockId: "B-03",
    stationId: "S-04",
    lon: 103.975,
    lat: 31.025,
    commissionedAt: "2025-12",
    wells: [
      { id: "W-701", name: "彭州7-1D", gas: 15.7, depth: 6050, lateral: 780 },
      { id: "W-702", name: "彭州7-2D", gas: 14.9, depth: 6000, lateral: 740 },
      { id: "W-703", name: "彭州7-3D", gas: 14.2, depth: 5960, lateral: 700 },
      { id: "W-704", name: "彭州7-4D", gas: 13.5, depth: 5920, lateral: 680 },
    ],
  },
  {
    id: "PF-08",
    name: "8#平台",
    blockId: "B-02",
    stationId: "S-05",
    lon: 103.905,
    lat: 31.12,
    commissionedAt: "2025-12",
    wells: [
      { id: "W-801", name: "彭州8-1D", gas: 16.8, depth: 6150, lateral: 900 },
      { id: "W-802", name: "彭州8-2D", gas: 15.6, depth: 6120, lateral: 860 },
      { id: "W-803", name: "彭州8-3D", gas: 14.7, depth: 6080, lateral: 820 },
      { id: "W-804", name: "彭州8-4D", gas: 13.9, depth: 6040, lateral: 780 },
      {
        id: "W-805",
        name: "彭州8-5D",
        gas: 12.4,
        depth: 6000,
        lateral: 760,
        status: "warning",
        h2s: 91.5,
        pressure: 54.8,
        temp: 70.1,
        water: 6.2,
      },
    ],
  },
];

const STATION_SEEDS: StationSeed[] = [
  {
    id: "S-01",
    name: "中心控制站",
    lon: 103.93,
    lat: 31.045,
    type: "中心控制站",
    medium: "none",
    tanks: 0,
    buildings: 3,
    capacity: 0,
    pressure: 0,
    units: 8,
    staff: 18,
    coverageKm: 30,
    commissionedAt: "2024-03",
  },
  {
    id: "S-02",
    name: "1#脱硫站",
    lon: 103.905,
    lat: 31.075,
    type: "脱硫站",
    medium: "rawGas",
    tanks: 2,
    buildings: 2,
    capacity: 150,
    pressure: 8.8,
    units: 2,
    h2sOut: 12,
    commissionedAt: "2024-03",
  },
  {
    id: "S-03",
    name: "2#脱硫站",
    lon: 103.835,
    lat: 31.005,
    type: "脱硫站",
    medium: "rawGas",
    tanks: 2,
    buildings: 2,
    capacity: 150,
    pressure: 8.5,
    units: 2,
    h2sOut: 11,
    commissionedAt: "2024-03",
  },
  {
    id: "S-04",
    name: "3#脱硫站",
    lon: 103.955,
    lat: 31.045,
    type: "脱硫站",
    medium: "rawGas",
    tanks: 2,
    buildings: 2,
    capacity: 150,
    pressure: 8.7,
    units: 2,
    h2sOut: 14,
    commissionedAt: "2024-03",
  },
  {
    id: "S-05",
    name: "4#脱硫站",
    lon: 103.905,
    lat: 31.105,
    type: "脱硫站",
    medium: "rawGas",
    tanks: 2,
    buildings: 2,
    capacity: 100,
    pressure: 8.4,
    units: 2,
    h2sOut: 10,
    commissionedAt: "2025-12",
  },
  {
    id: "S-06",
    name: "外输首站",
    lon: 103.945,
    lat: 31.025,
    type: "外输首站",
    medium: "sweetGas",
    tanks: 0,
    buildings: 2,
    capacity: 600,
    pressure: 6.8,
    units: 4,
    h2sOut: 8,
    commissionedAt: "2024-03",
  },
  {
    id: "S-07",
    name: "水处理站",
    lon: 103.965,
    lat: 30.995,
    type: "水处理站",
    medium: "water",
    tanks: 3,
    buildings: 2,
    capacity: 5000,
    pressure: 0.6,
    units: 2,
    commissionedAt: "2023-04",
  },
  {
    id: "S-08",
    name: "应急救援站",
    lon: 103.915,
    lat: 31.025,
    type: "应急救援站",
    medium: "none",
    tanks: 0,
    buildings: 3,
    capacity: 0,
    pressure: 0,
    units: 3,
    vehicles: 12,
    staff: 24,
    coverageKm: 30,
    commissionedAt: "2024-03",
  },
];

const BLOCK_SEEDS: BlockSeed[] = [
  {
    id: "B-01",
    name: "丽春区块",
    shortName: "丽春",
    county: "彭州市丽春镇",
    colorKey: "gas",
    platformIds: ["PF-03", "PF-05"],
    radius: 3600,
  },
  {
    id: "B-02",
    name: "隆丰区块",
    shortName: "隆丰",
    county: "彭州市隆丰街道",
    colorKey: "sulfur",
    platformIds: ["PF-04", "PF-08"],
    radius: 3600,
  },
  {
    id: "B-03",
    name: "葛仙山区块",
    shortName: "葛仙山",
    county: "彭州市葛仙山镇",
    colorKey: "water",
    platformIds: ["PF-06", "PF-07"],
    radius: 3400,
  },
];

const PIPELINE_SEEDS: PipelineSeed[] = [
  { id: "P-01", name: "3#平台—1#脱硫站集气干线", fromId: "PF-03", toId: "S-02", fromName: "3#平台", toName: "1#脱硫站", service: "rawGas", medium: "gas", diameter: 400, designPressure: 10, lengthKm: 8.2, status: "running" },
  { id: "P-02", name: "4#平台—1#脱硫站集气干线", fromId: "PF-04", toId: "S-02", fromName: "4#平台", toName: "1#脱硫站", service: "rawGas", medium: "gas", diameter: 400, designPressure: 10, lengthKm: 7.4, status: "running" },
  { id: "P-03", name: "5#平台—2#脱硫站集气干线", fromId: "PF-05", toId: "S-03", fromName: "5#平台", toName: "2#脱硫站", service: "rawGas", medium: "gas", diameter: 350, designPressure: 10, lengthKm: 6.8, status: "running" },
  { id: "P-04", name: "6#平台—3#脱硫站集气干线", fromId: "PF-06", toId: "S-04", fromName: "6#平台", toName: "3#脱硫站", service: "rawGas", medium: "gas", diameter: 350, designPressure: 10, lengthKm: 5.9, status: "running" },
  { id: "P-05", name: "7#平台—3#脱硫站集气干线", fromId: "PF-07", toId: "S-04", fromName: "7#平台", toName: "3#脱硫站", service: "rawGas", medium: "gas", diameter: 300, designPressure: 10, lengthKm: 4.7, status: "running" },
  { id: "P-06", name: "8#平台—4#脱硫站集气干线", fromId: "PF-08", toId: "S-05", fromName: "8#平台", toName: "4#脱硫站", service: "rawGas", medium: "gas", diameter: 300, designPressure: 10, lengthKm: 4.1, status: "running" },
  { id: "P-07", name: "1#脱硫站—外输首站净化气干线", fromId: "S-02", toId: "S-06", fromName: "1#脱硫站", toName: "外输首站", service: "sweetGas", medium: "gas", diameter: 450, designPressure: 6.3, lengthKm: 3.8, status: "running" },
  { id: "P-08", name: "2#脱硫站—外输首站净化气干线", fromId: "S-03", toId: "S-06", fromName: "2#脱硫站", toName: "外输首站", service: "sweetGas", medium: "gas", diameter: 400, designPressure: 6.3, lengthKm: 3.2, status: "running" },
  { id: "P-09", name: "3#脱硫站—外输首站净化气干线", fromId: "S-04", toId: "S-06", fromName: "3#脱硫站", toName: "外输首站", service: "sweetGas", medium: "gas", diameter: 400, designPressure: 6.3, lengthKm: 2.7, status: "running" },
  { id: "P-10", name: "4#脱硫站—外输首站净化气干线", fromId: "S-05", toId: "S-06", fromName: "4#脱硫站", toName: "外输首站", service: "sweetGas", medium: "gas", diameter: 300, designPressure: 6.3, lengthKm: 2.3, status: "running" },
  { id: "P-11", name: "1#脱硫站—水处理站采出水线", fromId: "S-02", toId: "S-07", fromName: "1#脱硫站", toName: "水处理站", service: "producedWater", medium: "water", diameter: 150, designPressure: 4, lengthKm: 1.9, status: "maintenance" },
  { id: "P-12", name: "3#脱硫站—水处理站采出水线", fromId: "S-04", toId: "S-07", fromName: "3#脱硫站", toName: "水处理站", service: "producedWater", medium: "water", diameter: 150, designPressure: 4, lengthKm: 2.0, status: "running" },
];

function reservoirForDepth(depth: number): string {
  if (depth >= 6020) return "R-LEI4C";
  if (depth >= 5850) return "R-LEI4B";
  return "R-LEI4A";
}

function historyForGas(gas: number, status: WellStatus): number[] {
  if (status === "offline") return Array.from({ length: 24 }, () => 0);
  const values: number[] = [];
  for (let i = 0; i < 24; i += 1) {
    const drift = 1 + (rand() - 0.5) * 0.08;
    values.push(round(Math.max(0.2, gas * drift), 2));
  }
  values[values.length - 1] = round(gas, 2);
  return values;
}

function historyForFlow(flow: number, digits = 1): number[] {
  const values: number[] = [];
  for (let i = 0; i < 24; i += 1) {
    values.push(round(Math.max(0, flow * (0.92 + rand() * 0.14)), digits));
  }
  values[values.length - 1] = round(flow, digits);
  return values;
}

function metricsFor(seed: WellSeed, status: WellStatus): Well["metrics"] {
  if (status === "offline") {
    return { oil: 0, gas: 0, water: 0, pressure: 0, temp: 0, h2s: 0 };
  }
  return {
    oil: 0,
    gas: seed.gas,
    water: seed.water ?? round(range(0.5, 8), 1),
    pressure: seed.pressure ?? round(range(38, 55), 1),
    temp: seed.temp ?? round(range(48, 72), 1),
    h2s: seed.h2s ?? round(range(50, 89.5), 1),
  };
}

function createWellsAndPlatforms(): {
  wells: Well[];
  platforms: PlatformInfo[];
} {
  const wells: Well[] = [];
  const platforms: PlatformInfo[] = [];

  for (const platformSeed of PLATFORM_SEEDS) {
    const platformPos = lonLatToLocal(platformSeed.lon, platformSeed.lat, CENTER.lon, CENTER.lat);
    const platform: PlatformInfo = {
      id: platformSeed.id,
      name: platformSeed.name,
      blockId: platformSeed.blockId,
      stationId: platformSeed.stationId,
      pos: platformPos,
      lon: platformSeed.lon,
      lat: platformSeed.lat,
      wellIds: [],
      commissionedAt: platformSeed.commissionedAt,
    };

    for (const wellSeed of platformSeed.wells) {
      const status = wellSeed.status ?? "normal";
      const angle = range(0, Math.PI * 2);
      const radius = range(60, 220);
      const pos = {
        x: platformPos.x + Math.cos(angle) * radius,
        z: platformPos.z + Math.sin(angle) * radius,
      };
      const well: Well = {
        id: wellSeed.id,
        name: wellSeed.name,
        blockId: platformSeed.blockId,
        stationId: platformSeed.stationId,
        pos,
        kind: "gas" as WellKind,
        status,
        depth: wellSeed.depth,
        rotation: range(0, Math.PI * 2),
        metrics: metricsFor(wellSeed, status),
        history: historyForGas(wellSeed.gas, status),
        reservoirId: reservoirForDepth(wellSeed.depth),
        lateralLength: wellSeed.lateral,
        azimuth: range(0, Math.PI * 2),
        platformId: platformSeed.id,
        testGas: wellSeed.testGas,
        commissionedAt: wellSeed.commissionedAt ?? platformSeed.commissionedAt,
      };
      wells.push(well);
      platform.wellIds.push(well.id);
    }

    platforms.push(platform);
  }

  return { wells, platforms };
}

function createStations(platforms: PlatformInfo[], wells: Well[]): Station[] {
  const wellsForPlatforms = (platformIds: string[]): string[] =>
    platforms
      .filter((platform) => platformIds.includes(platform.id))
      .flatMap((platform) => platform.wellIds);

  return STATION_SEEDS.map((seed) => {
    let wellIds: string[] = [];
    if (seed.id === "S-01") wellIds = wells.map((well) => well.id);
    else if (seed.id === "S-07") wellIds = wells.filter((well) => well.status !== "offline").map((well) => well.id);
    else if (seed.id !== "S-06" && seed.id !== "S-08") {
      wellIds = wellsForPlatforms(
        platforms.filter((platform) => platform.stationId === seed.id).map((platform) => platform.id),
      );
    }

    return {
      id: seed.id,
      name: seed.name,
      pos: lonLatToLocal(seed.lon, seed.lat, CENTER.lon, CENTER.lat),
      type: seed.type,
      capacity: seed.capacity,
      throughput: 0,
      pressure: seed.pressure,
      status: "normal" as const,
      tanks: seed.tanks,
      buildings: seed.buildings,
      wellIds,
      rotation: range(0, Math.PI * 2),
      medium: seed.medium,
      units: seed.units,
      vehicles: seed.vehicles,
      staff: seed.staff,
      coverageKm: seed.coverageKm,
      h2sOut: seed.h2sOut,
      commissionedAt: seed.commissionedAt,
    };
  });
}

function sumBy<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0);
}

function sulfurForGas(gas: number, meta: FieldMeta): number {
  if (!meta.annualCapacity) return 0;
  return round((meta.sulfurAnnual * 10000 * gas) / (meta.annualCapacity * 10000), 1);
}

function refreshStationThroughput(stations: Station[], wells: Well[], meta: FieldMeta): void {
  const totalRaw = sumBy(wells.filter((well) => well.status !== "offline"), (well) => well.metrics.gas);
  for (const station of stations) {
    const related = wells.filter((well) => station.wellIds.includes(well.id));
    if (station.medium === "rawGas") {
      station.throughput = round(sumBy(related, (well) => well.metrics.gas), 1);
    } else if (station.medium === "sweetGas") {
      station.throughput = round(totalRaw * meta.purifiedYield, 1);
    } else if (station.medium === "water") {
      station.throughput = round(sumBy(related, (well) => well.metrics.water), 1);
    } else {
      station.throughput = 0;
    }
  }
}

function createPipelines(
  platforms: PlatformInfo[],
  stations: Station[],
  wells: Well[],
  meta: FieldMeta,
): Pipeline[] {
  const platformById = new Map(platforms.map((platform) => [platform.id, platform]));
  const stationById = new Map(stations.map((station) => [station.id, station]));
  const wellById = new Map(wells.map((well) => [well.id, well]));

  return PIPELINE_SEEDS.map((seed) => {
    const fromPos = platformById.get(seed.fromId)?.pos ?? stationById.get(seed.fromId)?.pos ?? { x: 0, z: 0 };
    const toPos = platformById.get(seed.toId)?.pos ?? stationById.get(seed.toId)?.pos ?? { x: 0, z: 0 };
    let flow = 0;

    if (seed.service === "rawGas") {
      const platform = platformById.get(seed.fromId);
      flow = round(
        sumBy(
          (platform?.wellIds ?? []).map((id) => wellById.get(id)).filter((well): well is Well => Boolean(well)),
          (well) => well.metrics.gas,
        ),
        1,
      );
    } else if (seed.service === "sweetGas") {
      flow = round((stationById.get(seed.fromId)?.throughput ?? 0) * meta.purifiedYield, 1);
    } else {
      const station = stationById.get(seed.fromId);
      flow = round(
        sumBy(
          (station?.wellIds ?? []).map((id) => wellById.get(id)).filter((well): well is Well => Boolean(well)),
          (well) => well.metrics.water,
        ),
        1,
      );
    }

    return {
      id: seed.id,
      name: seed.name,
      fromId: seed.fromId,
      toId: seed.toId,
      path: [fromPos, midpoint(fromPos, toPos, 80), toPos],
      medium: seed.medium,
      diameter: seed.diameter,
      lengthKm: seed.lengthKm,
      flow,
      status: seed.status,
      service: seed.service,
      designPressure: seed.designPressure,
      fromName: seed.fromName,
      toName: seed.toName,
      history: historyForFlow(flow, seed.service === "producedWater" ? 0 : 1),
    };
  });
}

export function refreshFieldAggregates(field: FieldData): void {
  const meta = field.meta ?? META;
  refreshStationThroughput(field.stations, field.wells, meta);

  const platformById = new Map((field.platforms ?? []).map((platform) => [platform.id, platform]));
  const stationById = new Map(field.stations.map((station) => [station.id, station]));
  const wellById = new Map(field.wells.map((well) => [well.id, well]));

  for (const pipeline of field.pipelines) {
    let flow = 0;
    if (pipeline.service === "rawGas") {
      const platform = platformById.get(pipeline.fromId);
      flow = round(
        sumBy(
          (platform?.wellIds ?? []).map((id) => wellById.get(id)).filter((well): well is Well => Boolean(well)),
          (well) => well.metrics.gas,
        ),
        1,
      );
    } else if (pipeline.service === "sweetGas") {
      flow = round((stationById.get(pipeline.fromId)?.throughput ?? 0) * meta.purifiedYield, 1);
    } else if (pipeline.service === "producedWater") {
      const station = stationById.get(pipeline.fromId);
      flow = round(
        sumBy(
          (station?.wellIds ?? []).map((id) => wellById.get(id)).filter((well): well is Well => Boolean(well)),
          (well) => well.metrics.water,
        ),
        1,
      );
    }
    pipeline.flow = flow;
    if (pipeline.history?.length) {
      pipeline.history[pipeline.history.length - 1] = round(flow, pipeline.service === "producedWater" ? 0 : 1);
    }
  }

  for (const block of field.blocks) {
    const blockWells = field.wells.filter((well) => block.wellIds.includes(well.id));
    block.dailyGas = round(sumBy(blockWells, (well) => well.metrics.gas), 1);
    block.dailyOil = 0;
  }

  const openWells = field.wells.filter((well) => well.status !== "offline");
  const totalGas = round(sumBy(openWells, (well) => well.metrics.gas), 1);
  const totalWater = round(sumBy(openWells, (well) => well.metrics.water), 1);
  const history = field.productionHistory;
  if (history.gas.length) history.gas[history.gas.length - 1] = totalGas;
  if (history.water?.length) history.water[history.water.length - 1] = totalWater;
  if (history.sweetGas?.length) {
    history.sweetGas[history.sweetGas.length - 1] = round(totalGas * meta.purifiedYield, 1);
  }
}

function createBlocks(platforms: PlatformInfo[], wells: Well[]): Block[] {
  return BLOCK_SEEDS.map((seed) => {
    const platformList = platforms.filter((platform) => seed.platformIds.includes(platform.id));
    const blockWells = wells.filter((well) => platformList.some((platform) => platform.wellIds.includes(well.id)));
    const center = platformList.length
      ? {
          x: platformList.reduce((total, platform) => total + platform.pos.x, 0) / platformList.length,
          z: platformList.reduce((total, platform) => total + platform.pos.z, 0) / platformList.length,
        }
      : { x: 0, z: 0 };
    return {
      id: seed.id,
      name: seed.name,
      shortName: seed.shortName,
      colorKey: seed.colorKey,
      center,
      radius: seed.radius,
      wellIds: blockWells.map((well) => well.id),
      dailyOil: 0,
      dailyGas: round(sumBy(blockWells, (well) => well.metrics.gas), 1),
      county: seed.county,
    };
  });
}

function createProductionHistory(
  totalGas: number,
  totalWater: number,
  meta: FieldMeta,
): FieldData["productionHistory"] {
  const gas: number[] = [];
  const water: number[] = [];
  for (let i = 0; i < 24; i += 1) {
    const profile = 0.965 + 0.025 * Math.sin(((i - 6) / 24) * Math.PI * 2);
    gas.push(round(totalGas * profile * (0.985 + rand() * 0.03), 1));
    water.push(round(totalWater * (0.9 + rand() * 0.18), 1));
  }
  gas[gas.length - 1] = round(totalGas, 1);
  water[water.length - 1] = round(totalWater, 1);
  return {
    oil: Array.from({ length: 24 }, () => 0),
    gas,
    sweetGas: gas.map((value) => round(value * meta.purifiedYield, 1)),
    water,
  };
}

export function createFieldData(): FieldData {
  const totalMeta = META;
  const { wells, platforms } = createWellsAndPlatforms();
  const stations = createStations(platforms, wells);
  refreshStationThroughput(stations, wells, totalMeta);
  const pipelines = createPipelines(platforms, stations, wells, totalMeta);
  const blocks = createBlocks(platforms, wells);
  const totalGas = round(sumBy(wells.filter((well) => well.status !== "offline"), (well) => well.metrics.gas), 1);
  const totalWater = round(sumBy(wells.filter((well) => well.status !== "offline"), (well) => well.metrics.water), 1);

  return {
    center: CENTER,
    blocks,
    wells,
    stations,
    pipelines,
    reservoirs: RESERVOIRS,
    strata: STRATA,
    productionHistory: createProductionHistory(totalGas, totalWater, totalMeta),
    platforms,
    meta: totalMeta,
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

export function findPlatform(field: FieldData, id: string): PlatformInfo | undefined {
  return field.platforms?.find((platform) => platform.id === id);
}

export function featureName(field: FieldData, id: string): string {
  return (
    findWell(field, id)?.name ??
    findStation(field, id)?.name ??
    findPipeline(field, id)?.name ??
    findPlatform(field, id)?.name ??
    id
  );
}

export function wellKindLabel(kind: WellKind): string {
  if (kind === "gas") return "气井";
  if (kind === "water") return "产水井";
  if (kind === "observation") return "观察井";
  return "油井";
}

export function wellStatusLabel(status: WellStatus): string {
  return status === "normal" ? "运行正常" : status === "warning" ? "参数预警" : "停产";
}

export function pipelineServiceLabel(service?: PipelineService): string {
  if (service === "rawGas") return "原料气";
  if (service === "sweetGas") return "净化气";
  if (service === "producedWater") return "采出水";
  return "";
}

export function pipelineMediumLabel(input: Medium | Pipeline): string {
  if (typeof input !== "string") {
    const serviceLabel = pipelineServiceLabel(input.service);
    if (serviceLabel) return serviceLabel;
    return input.medium === "gas" ? "天然气" : input.medium === "water" ? "采出水" : "原油";
  }
  return input === "gas" ? "天然气" : input === "water" ? "采出水" : "原油";
}

function pipelineHistory(field: FieldData, pipeline: Pipeline): number[] {
  if (pipeline.history?.length) return pipeline.history;
  if (pipeline.service === "producedWater") return field.productionHistory.water ?? field.productionHistory.gas;
  if (pipeline.service === "sweetGas") return field.productionHistory.sweetGas ?? field.productionHistory.gas;
  return field.productionHistory.gas;
}

function stationStatusLabel(station: Station): string {
  return station.status === "normal" ? "运行正常" : "检修中";
}

function statusTone(status: WellStatus): "success" | "warning" | "muted" {
  return status === "normal" ? "success" : status === "warning" ? "warning" : "muted";
}

function stationTone(station: Station): "success" | "warning" {
  return station.status === "normal" ? "success" : "warning";
}

function stationColorKey(station: Station): string {
  if (station.medium === "rawGas") return "gas";
  if (station.medium === "sweetGas") return "success";
  if (station.medium === "water") return "water";
  if (station.medium === "sulfur") return "sulfur";
  return "primary";
}

export function buildFeatureDetail(field: FieldData, id: string): FeatureDetail | null {
  const meta = field.meta ?? META;
  const well = findWell(field, id);
  if (well) {
    const block = field.blocks.find((item) => item.id === well.blockId);
    const platform = findPlatform(field, well.platformId ?? "");
    const h2s = well.metrics.h2s ?? 0;
    return {
      id: well.id,
      kind: "well",
      name: well.name,
      subtitle: `${block?.name ?? "—"} · ${platform?.name ?? "—"} · ${wellKindLabel(well.kind)}`,
      status: well.status,
      statusLabel: wellStatusLabel(well.status),
      statusTone: statusTone(well.status),
      colorKey: "gas",
      metrics: [
        { label: "日产气", value: well.metrics.gas.toFixed(1), unit: "万m³/d", tone: "success" },
        { label: "井口压力", value: well.metrics.pressure.toFixed(1), unit: "MPa", tone: "primary" },
        { label: "井口温度", value: well.metrics.temp.toFixed(1), unit: "°C", tone: "default" },
        {
          label: "硫化氢",
          value: h2s.toFixed(1),
          unit: "g/m³",
          tone: h2s > 90 ? "warning" : "default",
        },
      ],
      history: well.history,
      meta: [
        { label: "井深", value: `${well.depth} m` },
        { label: "层位", value: field.reservoirs.find((item) => item.id === well.reservoirId)?.name ?? "—" },
        { label: "水平段", value: well.lateralLength ? `${well.lateralLength} m` : "直井" },
        { label: "平台", value: platform?.name ?? "—" },
        { label: "测试日产气", value: well.testGas ? `${well.testGas} 万m³/d` : "—" },
        { label: "投产时间", value: well.commissionedAt ?? "—" },
      ],
      wellId: well.id,
    };
  }

  const station = findStation(field, id);
  if (station) {
    const onlineStations = field.stations.filter((item) => item.status === "normal").length;
    const metrics =
      station.medium === "rawGas"
        ? [
            { label: "原料气处理量", value: station.throughput.toFixed(1), unit: "万m³/d", tone: "success" as const },
            { label: "外输压力", value: station.pressure.toFixed(1), unit: "MPa", tone: "primary" as const },
            { label: "硫磺日产量", value: sulfurForGas(station.throughput, meta).toFixed(1), unit: "t/d", tone: "oil" as const },
            { label: "关联井数", value: `${station.wellIds.length}`, unit: "口", tone: "default" as const },
          ]
        : station.medium === "sweetGas"
          ? [
              { label: "外输净化气", value: station.throughput.toFixed(1), unit: "万m³/d", tone: "success" as const },
              { label: "外输压力", value: station.pressure.toFixed(1), unit: "MPa", tone: "primary" as const },
              { label: "硫化氢出口", value: (station.h2sOut ?? 0).toFixed(1), unit: "mg/m³", tone: "default" as const },
              { label: "供气脱硫站", value: `${station.units ?? 0}`, unit: "座", tone: "default" as const },
            ]
          : station.medium === "water"
            ? [
                { label: "处理水量", value: station.throughput.toFixed(1), unit: "m³/d", tone: "primary" as const },
                { label: "运行压力", value: station.pressure.toFixed(1), unit: "MPa", tone: "primary" as const },
                { label: "储罐", value: `${station.tanks}`, unit: "座", tone: "default" as const },
                { label: "关联井数", value: `${station.wellIds.length}`, unit: "口", tone: "default" as const },
              ]
            : station.type === "中心控制站"
              ? [
                  { label: "监控井数", value: `${field.wells.length}`, unit: "口", tone: "default" as const },
                  { label: "监控站库", value: `${field.stations.length}`, unit: "座", tone: "default" as const },
                  {
                    label: "站库在线率",
                    value: ((onlineStations / Math.max(1, field.stations.length)) * 100).toFixed(1),
                    unit: "%",
                    tone: "success" as const,
                  },
                  { label: "值班人员", value: `${station.staff ?? 0}`, unit: "人", tone: "default" as const },
                ]
              : [
                  { label: "应急车辆", value: `${station.vehicles ?? 0}`, unit: "辆", tone: "primary" as const },
                  { label: "值班人员", value: `${station.staff ?? 0}`, unit: "人", tone: "default" as const },
                  { label: "库房", value: `${station.buildings}`, unit: "栋", tone: "default" as const },
                  { label: "覆盖半径", value: `${station.coverageKm ?? 0}`, unit: "km", tone: "default" as const },
                ];

    const history =
      station.medium === "rawGas"
        ? field.productionHistory.gas
        : station.medium === "sweetGas"
          ? field.productionHistory.sweetGas
          : station.medium === "water"
            ? field.productionHistory.water
            : undefined;

    return {
      id: station.id,
      kind: "station",
      name: station.name,
      subtitle: `${station.type} · ${station.commissionedAt ?? "—"} 投产`,
      status: station.status,
      statusLabel: stationStatusLabel(station),
      statusTone: stationTone(station),
      colorKey: stationColorKey(station),
      metrics,
      history,
      meta: [
        { label: "站库类型", value: station.type },
        {
          label:
            station.medium === "rawGas"
              ? "脱硫装置"
              : station.medium === "water"
                ? "储罐"
                : station.medium === "sweetGas"
                  ? "供气脱硫站"
                  : "装置/库房",
          value:
            station.medium === "rawGas"
              ? `${station.units ?? 0} 套`
              : station.medium === "water"
                ? `${station.tanks} 座`
                : station.medium === "sweetGas"
                  ? `${station.units ?? 0} 座`
                  : `${station.units ?? station.buildings} 套`,
        },
        {
          label: "关联井数",
          value:
            station.wellIds.length > 0
              ? `${station.wellIds.length} 口`
              : station.medium === "sweetGas"
                ? `${station.units ?? 0} 座脱硫站`
                : "—",
        },
        { label: "隶属", value: "川西气田" },
      ],
      stationId: station.id,
    };
  }

  const pipeline = findPipeline(field, id);
  if (pipeline) {
    const isWater = pipeline.service === "producedWater";
    const unit = isWater ? "m³/d" : "万m³/d";
    const statusLabel = pipeline.status === "running" ? "运行中" : pipeline.status === "maintenance" ? "检修中" : "停输";
    return {
      id: pipeline.id,
      kind: "pipeline",
      name: pipeline.name,
      subtitle: `${pipelineMediumLabel(pipeline)} · DN${pipeline.diameter} · ${pipeline.lengthKm.toFixed(1)} km`,
      status: pipeline.status === "running" ? "normal" : pipeline.status === "maintenance" ? "maintenance" : "offline",
      statusLabel,
      statusTone: pipeline.status === "running" ? "success" : pipeline.status === "maintenance" ? "warning" : "muted",
      colorKey: isWater ? "water" : "gas",
      metrics: [
        { label: "瞬时流量", value: pipeline.flow.toFixed(isWater ? 0 : 1), unit, tone: isWater ? "primary" : "success" },
        { label: "管径", value: `DN${pipeline.diameter}`, unit: "", tone: "default" },
        { label: "长度", value: pipeline.lengthKm.toFixed(1), unit: "km", tone: "default" },
        { label: "设计压力", value: (pipeline.designPressure ?? 0).toFixed(1), unit: "MPa", tone: "primary" },
      ],
      history: pipelineHistory(field, pipeline),
      meta: [
        { label: "起点", value: pipeline.fromName ?? featureName(field, pipeline.fromId) },
        { label: "终点", value: pipeline.toName ?? featureName(field, pipeline.toId) },
        { label: "运行状态", value: statusLabel },
        { label: "管道编号", value: pipeline.id },
      ],
      pipelineId: pipeline.id,
    };
  }

  return null;
}

export function createStats(field: FieldData, alarmCount = 0): Stats {
  const meta = field.meta ?? META;
  const openWells = field.wells.filter((well) => well.status !== "offline");
  const totalGas = round(sumBy(openWells, (well) => well.metrics.gas), 1);
  const totalWater = round(sumBy(openWells, (well) => well.metrics.water), 1);
  const totalSweetGas = round(totalGas * meta.purifiedYield, 1);
  const maxGas = Math.max(...field.blocks.map((block) => block.dailyGas), 1);
  const blockRanking: BlockRankItem[] = [...field.blocks]
    .sort((a, b) => b.dailyGas - a.dailyGas)
    .map((block) => ({
      id: block.id,
      name: block.name,
      oil: 0,
      gas: block.dailyGas,
      percent: Math.max(6, (block.dailyGas / maxGas) * 100),
      colorKey: block.colorKey,
    }));

  return {
    totalOil: 0,
    totalGas,
    totalWater,
    openWells: openWells.length,
    totalWells: field.wells.length,
    waterCut: 0,
    pipelineKm: round(sumBy(field.pipelines, (pipeline) => pipeline.lengthKm), 1),
    alarmCount,
    reserves: meta.reservesGas,
    blockRanking,
    history: {
      oil: [...field.productionHistory.oil],
      gas: [...field.productionHistory.gas],
      sweetGas: [...(field.productionHistory.sweetGas ?? [])],
      water: [...(field.productionHistory.water ?? [])],
    },
    totalSweetGas,
    sulfurDaily: sulfurForGas(totalGas, meta),
    annualCapacity: meta.annualCapacity,
    sulfurAnnual: meta.sulfurAnnual,
    areaKm2: meta.areaKm2,
    pipelineCount: field.pipelines.length,
    platformCount: field.platforms?.length ?? meta.platformCount,
    stationCount: field.stations.length,
    updatedAt: Date.now(),
  };
}

export function createSearchIndex(field: FieldData): SearchItem[] {
  return [
    ...field.wells.map((well) => ({
      id: well.id,
      name: well.name,
      kind: "well" as const,
      sub: `${findPlatform(field, well.platformId ?? "")?.name ?? "—"} · 日产气 ${well.metrics.gas.toFixed(1)} 万m³/d`,
    })),
    ...field.stations.map((station) => ({
      id: station.id,
      name: station.name,
      kind: "station" as const,
      sub: `${station.type} · ${station.wellIds.length} 口关联井`,
    })),
    ...field.pipelines.map((pipeline) => ({
      id: pipeline.id,
      name: pipeline.name,
      kind: "pipeline" as const,
      sub: `${pipelineMediumLabel(pipeline)} · DN${pipeline.diameter}`,
    })),
  ];
}

export { META as CHUANXI_META, CENTER as CHUANXI_CENTER };
