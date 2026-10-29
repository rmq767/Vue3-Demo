import {
  findPipeline,
  findPlatform,
  findStation,
  findWell,
  pipelineMediumLabel,
} from "./chuanxi";
import type { CameraState, FieldData, TourChapterScript, TourScript } from "./types";

const TOP = 0;

function centerState(overrides: Partial<CameraState> = {}): CameraState {
  return {
    x: 0,
    z: 0,
    height: TOP,
    heading: -18,
    pitch: -34,
    range: 11_000,
    ...overrides,
  };
}

function platformState(
  field: FieldData,
  id: string,
  overrides: Partial<CameraState> = {},
): CameraState {
  const platform = findPlatform(field, id);
  return {
    x: platform?.pos.x ?? 0,
    z: platform?.pos.z ?? 0,
    height: TOP,
    heading: -26,
    pitch: -30,
    range: 2400,
    ...overrides,
  };
}

function stationState(field: FieldData, id: string, overrides: Partial<CameraState> = {}): CameraState {
  const station = findStation(field, id);
  return {
    x: station?.pos.x ?? 0,
    z: station?.pos.z ?? 0,
    height: TOP,
    heading: 24,
    pitch: -28,
    range: 2200,
    ...overrides,
  };
}

/** 与 wellTrajectory 的地层柱尺寸保持一致：最小 1600m，顶部抬高 200m。 */
function trajectoryState(
  field: FieldData,
  id: string,
  overrides: Partial<CameraState> = {},
): CameraState {
  const well = findWell(field, id);
  const depth = Math.max(1600, Math.ceil(((well?.depth ?? 2000) + 180) / 100) * 100);
  return {
    x: well?.pos.x ?? 0,
    z: well?.pos.z ?? 0,
    height: -depth / 2 + 500,
    heading: -14,
    pitch: -22,
    range: 15_000,
    ...overrides,
  };
}

function pipelineState(
  field: FieldData,
  id: string,
  overrides: Partial<CameraState> = {},
): CameraState {
  const pipeline = findPipeline(field, id);
  const path = pipeline?.path ?? [];
  const mid = path[Math.floor((path.length - 1) / 2)] ?? { x: 0, z: 0 };
  return {
    x: mid.x,
    z: mid.z,
    height: TOP,
    heading: 22,
    pitch: -30,
    range: 4200,
    ...overrides,
  };
}

export function createTourScript(field: FieldData): TourScript {
  const platforms = field.platforms ?? [];
  const pipelineKm = field.pipelines.reduce((total, pipeline) => total + pipeline.lengthKm, 0);
  const trajectoryWell = findWell(field, "W-501");
  const warningWell = findWell(field, "W-805");
  const platform6 = findPlatform(field, "PF-06");
  const rawTrunk = field.pipelines.find((pipeline) => pipeline.service === "rawGas") ?? field.pipelines[0];
  const sweetTrunk = field.pipelines.find((pipeline) => pipeline.service === "sweetGas");
  const desulfurization = findStation(field, "S-02");

  const chapters: TourChapterScript[] = [
    {
      id: "overview",
      label: "全景",
      subtitle: "川西气田生产运行总览",
      labels: false,
      shots: [
        {
          id: "overview-a",
          label: "川西气田",
          subtitle: `${field.wells.length} 口井 · ${platforms.length} 个平台 · ${field.stations.length} 座站库 · ${pipelineKm.toFixed(1)} km 管网`,
          duration: 1.2,
          hold: 2.4,
          state: centerState(),
        },
        {
          id: "overview-b",
          label: "生产运行总览",
          subtitle: "原料气集输 · 脱硫净化 · 净化气外输",
          duration: 4.8,
          hold: 1.6,
          state: centerState({ heading: -52, pitch: -30, range: 13_000 }),
        },
      ],
    },
    {
      id: "platform",
      label: "平台",
      subtitle: "井场与单井实时参数",
      labels: true,
      shots: [
        {
          id: "platform-a",
          label: "6#平台",
          subtitle: `${platform6?.wellIds.length ?? 0} 口井 · 2024-03 投产`,
          duration: 1.1,
          hold: 2.2,
          cue: "well",
          targetId: platform6?.wellIds[0],
          state: platformState(field, "PF-06"),
        },
        {
          id: "platform-b",
          label: "8#平台",
          subtitle: `5 口井 · 彭州8-5D 参数预警`,
          duration: 1.4,
          hold: 2.0,
          cue: "well",
          targetId: warningWell?.id,
          state: platformState(field, "PF-08", { heading: -12, pitch: -24, range: 1700 }),
        },
      ],
    },
    {
      id: "trajectory",
      label: "井轨迹",
      subtitle: "地层柱与井眼轨迹",
      labels: false,
      trajectoryWellId: "W-501",
      shots: [
        {
          id: "trajectory-a",
          label: "彭州5-1D · 井轨迹",
          subtitle: `${trajectoryWell?.depth ?? 8208} m · 雷四段 · 地层柱 / 井眼轨迹 / 气藏层带`,
          duration: 1.4,
          hold: 3.4,
          cue: "trajectory",
          targetId: "W-501",
          state: trajectoryState(field, "W-501"),
        },
      ],
    },
    {
      id: "pipeline",
      label: "管网",
      subtitle: "集输流向与压力",
      labels: true,
      shots: [
        {
          id: "pipeline-a",
          label: "集气管网",
          subtitle: `${field.pipelines.length} 条管线 · ${pipelineKm.toFixed(1)} km · 原料气 / 净化气 / 采出水`,
          duration: 1.3,
          hold: 1.4,
          cue: "pipeline",
          targetId: rawTrunk?.id,
          state: centerState({ heading: 22, pitch: -30, range: 6800 }),
        },
        {
          id: "pipeline-b",
          label: sweetTrunk?.name ?? "净化气外输干线",
          subtitle: `${sweetTrunk?.id ?? ""} · ${pipelineMediumLabel(sweetTrunk ?? rawTrunk ?? "gas")} · 外输压力 ${desulfurization?.pressure.toFixed(1) ?? "—"} MPa`,
          duration: 1.4,
          hold: 2.2,
          cue: "pipeline",
          targetId: sweetTrunk?.id ?? rawTrunk?.id,
          state: pipelineState(field, sweetTrunk?.id ?? rawTrunk?.id ?? ""),
        },
      ],
    },
    {
      id: "station",
      label: "站库",
      subtitle: "脱硫净化与外输",
      labels: true,
      shots: [
        {
          id: "station-a",
          label: desulfurization?.name ?? "1#脱硫站",
          subtitle: "原料气处理 · 硫磺回收 · 净化气外输",
          duration: 1.2,
          hold: 2.8,
          cue: "station",
          targetId: desulfurization?.id,
          state: stationState(field, "S-02"),
        },
      ],
    },
  ];

  return {
    overview: centerState(),
    chapters,
  };
}
