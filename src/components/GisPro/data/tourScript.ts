import { findPipeline, findStation, findWell, pipelineMediumLabel } from "./field";
import type { CameraState, FieldData, TourChapterScript, TourScript } from "./types";

const TOP = 0;

function centerState(overrides: Partial<CameraState> = {}): CameraState {
  return {
    x: 0,
    z: 0,
    height: TOP,
    heading: -18,
    pitch: -26,
    range: 5600,
    ...overrides,
  };
}

function wellState(field: FieldData, id: string, overrides: Partial<CameraState> = {}): CameraState {
  const well = findWell(field, id);
  return {
    x: well?.pos.x ?? 0,
    z: well?.pos.z ?? 0,
    height: TOP,
    heading: -34,
    pitch: -24,
    range: 380,
    ...overrides,
  };
}

function stationState(field: FieldData, id: string, overrides: Partial<CameraState> = {}): CameraState {
  const station = findStation(field, id);
  return {
    x: station?.pos.x ?? 0,
    z: station?.pos.z ?? 0,
    height: TOP,
    heading: 36,
    pitch: -25,
    range: 780,
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
    height: 200 + depth / 2,
    heading: -14,
    pitch: -20,
    range: 5200,
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
    pitch: -24,
    range: 900,
    ...overrides,
  };
}

export function createTourScript(field: FieldData): TourScript {
  const introShots = [
    { range: 30_000_000, heading: -30, pitch: -45, duration: 2.0 },
    { range: 1_200_000, heading: -27, pitch: -48, duration: 1.35 },
    { range: 34_000, heading: -23, pitch: -42, duration: 1.35 },
    { range: 11_000, heading: -20, pitch: -32, duration: 1.15 },
    { range: 5_600, heading: -18, pitch: -26, duration: 0.9 },
  ];
  const intro = introShots.map((shot, index) => ({
    id: `intro-${index + 1}`,
    label: index === introShots.length - 1 ? "极光油田" : "进入油田",
    duration: shot.duration,
    hold: index === introShots.length - 1 ? 0.45 : 0,
    state: centerState({
      range: shot.range,
      heading: shot.heading,
      pitch: shot.pitch,
    }),
  }));

  const trajectoryWell = findWell(field, "W-018");
  const trunk = field.pipelines[0];

  const chapters: TourChapterScript[] = [
    {
      id: "overview",
      label: "全景",
      subtitle: "地面油田数字孪生",
      labels: false,
      shots: [
        {
          id: "overview-a",
          label: "极光油田",
          subtitle: `42 口井 · 8 座站库 · ${field.pipelines.length} 条管线`,
          duration: 1.2,
          hold: 2.4,
          state: centerState({ heading: -16, pitch: -26, range: 5600 }),
        },
        {
          id: "overview-b",
          label: "极光油田",
          subtitle: "生产运行总览",
          duration: 4.8,
          hold: 1.6,
          state: centerState({ heading: -52, pitch: -24, range: 6000 }),
        },
      ],
    },
    {
      id: "well",
      label: "井场",
      subtitle: "抽油机与单井实时参数",
      labels: true,
      shots: [
        {
          id: "well-a",
          label: "18 号井场",
          subtitle: "套压异常 · 进入预警监视",
          duration: 1.1,
          hold: 2.2,
          cue: "well",
          targetId: "W-018",
          state: wellState(field, "W-018"),
        },
        {
          id: "well-b",
          label: "7 号井场",
          subtitle: "游梁式抽油机 · 连续生产",
          duration: 1.4,
          hold: 1.8,
          targetId: "W-007",
          state: wellState(field, "W-007", { heading: -8, pitch: -20, range: 350 }),
        },
      ],
    },
    {
      id: "trajectory",
      label: "井轨迹",
      subtitle: "地层柱与井眼轨迹",
      labels: false,
      trajectoryWellId: "W-018",
      shots: [
        {
          id: "trajectory-a",
          label: "极光18井 · 井轨迹",
          subtitle: `${Math.round(trajectoryWell?.depth ?? 0)} m · 马家沟深层 · 地层柱 / 井眼轨迹 / 油藏层带`,
          duration: 1.4,
          hold: 3.4,
          cue: "trajectory",
          targetId: "W-018",
          state: trajectoryState(field, "W-018"),
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
          label: "集输管网",
          subtitle: `${field.pipelines.length} 条管线 · 流向实时可视化`,
          duration: 1.3,
          hold: 1.2,
          cue: "pipeline",
          targetId: trunk?.id,
          state: centerState({ heading: 22, pitch: -26, range: 2400 }),
        },
        {
          id: "pipeline-b",
          label: trunk?.name ?? "集输干线",
          subtitle: `${trunk?.id ?? ""} · ${pipelineMediumLabel(trunk?.medium ?? "gas")} · 流向实时可视化`,
          duration: 1.4,
          hold: 2.4,
          cue: "pipeline",
          targetId: trunk?.id,
          state: pipelineState(field, trunk?.id ?? ""),
        },
      ],
    },
    {
      id: "station",
      label: "站库",
      subtitle: "联合站与储运",
      labels: true,
      shots: [
        {
          id: "station-a",
          label: "极光联合站",
          subtitle: "外输 · 储罐 · 火炬",
          duration: 1.2,
          hold: 2.8,
          cue: "station",
          targetId: "S-01",
          state: stationState(field, "S-01"),
        },
      ],
    },
  ];

  return {
    intro,
    overview: centerState(),
    chapters,
    alarm: {
      shot: {
        id: "alarm-a",
        label: "18 号井套压异常",
        subtitle: "32.6 MPa · 超过 30 MPa 预警阈值",
        duration: 0.9,
        hold: 2.2,
        cue: "alarm",
        targetId: "W-018",
        state: wellState(field, "W-018", { heading: -18, pitch: -17, range: 320 }),
      },
      targetId: "W-018",
      message: "套压 32.6 MPa，超过 30 MPa 预警阈值",
      resolveAfter: 7,
    },
  };
}
