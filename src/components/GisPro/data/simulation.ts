import { createStats, featureName, refreshFieldAggregates } from "./chuanxi";
import type {
  Alarm,
  AlarmLevel,
  FeatureKind,
  FieldData,
  Pipeline,
  SimulationSnapshot,
  Stats,
  TickResult,
  Well,
} from "./types";

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 1): number {
  return Number(value.toFixed(digits));
}

interface Violation {
  level: AlarmLevel;
  message: string;
}

interface AlarmState {
  alarm: Alarm;
  normalTicks: number;
}

const TARGET_GAS = 460;
const ALARM_COOLDOWN = 60_000;
const RESOLVE_TICKS = 3;

export class Simulation {
  private readonly rand = mulberry32(20261029);
  private alarms: Alarm[] = [];
  private alarmState = new Map<string, AlarmState>();
  private lastRaised = new Map<string, number>();
  private alarmSeq = 0;
  private tickCount = 0;

  constructor(private readonly field: FieldData) {}

  getTicks(): number {
    return this.tickCount;
  }

  getAlarms(): Alarm[] {
    return this.alarms;
  }

  getStats(): Stats {
    return createStats(this.field, this.activeAlarmCount());
  }

  snapshot(): SimulationSnapshot {
    return { stats: this.getStats(), alarms: [...this.alarms] };
  }

  private activeAlarmCount(): number {
    return this.alarms.filter((alarm) => alarm.status !== "resolved").length;
  }

  raiseAlarm(
    targetId: string,
    level: AlarmLevel,
    message: string,
    targetType?: FeatureKind,
  ): Alarm | null {
    const existing = this.alarmState.get(targetId)?.alarm;
    if (existing && existing.status !== "resolved") return existing;

    const kind = targetType ?? this.resolveTargetType(targetId);
    if (!kind) return null;
    this.alarmSeq += 1;
    const alarm: Alarm = {
      id: `A-${String(this.alarmSeq).padStart(3, "0")}`,
      level,
      targetType: kind,
      targetId,
      targetName: featureName(this.field, targetId),
      message,
      ts: Date.now(),
      status: "active",
    };
    this.alarms.unshift(alarm);
    this.alarms = this.alarms.slice(0, 10);
    this.alarmState.set(targetId, { alarm, normalTicks: 0 });
    this.lastRaised.set(targetId, Date.now());
    return alarm;
  }

  ackAlarm(id: string): void {
    const alarm = this.alarms.find((item) => item.id === id);
    if (alarm && alarm.status === "active") alarm.status = "ack";
  }

  private resolveTargetType(id: string): FeatureKind | null {
    if (this.field.wells.some((well) => well.id === id)) return "well";
    if (this.field.stations.some((station) => station.id === id)) return "station";
    if (this.field.pipelines.some((pipeline) => pipeline.id === id)) return "pipeline";
    return null;
  }

  private wellViolation(well: Well): Violation | null {
    if (well.status === "offline") return null;
    const { gas, pressure, temp, water, h2s = 0 } = well.metrics;
    if (h2s > 95) return { level: "critical", message: `硫化氢 ${h2s.toFixed(1)} g/m³，超过 90 g/m³ 预警阈值` };
    if (h2s > 90) return { level: "warning", message: `硫化氢 ${h2s.toFixed(1)} g/m³，超过 90 g/m³ 预警阈值` };
    if (pressure > 58) return { level: "critical", message: `井口压力 ${pressure.toFixed(1)} MPa，超过 58 MPa 预警阈值` };
    if (pressure < 32) return { level: "warning", message: `井口压力 ${pressure.toFixed(1)} MPa，低于 32 MPa 预警阈值` };
    if (temp > 80) return { level: "warning", message: `井口温度 ${temp.toFixed(1)} °C，超过 80 °C 预警阈值` };
    if (water > 12) return { level: "warning", message: `产水 ${water.toFixed(1)} m³/d，超过 12 m³/d 预警阈值` };
    if (gas > 35) return { level: "warning", message: `日产气 ${gas.toFixed(1)} 万m³/d，超过 35 万m³/d 预警阈值` };
    if (gas < 3) return { level: "warning", message: `日产气 ${gas.toFixed(1)} 万m³/d，低于 3 万m³/d 预警阈值` };
    return null;
  }

  private stationViolation(stationId: string): Violation | null {
    const station = this.field.stations.find((item) => item.id === stationId);
    if (!station) return null;
    if (station.status === "maintenance") {
      return { level: "info", message: `${station.name} 检修中` };
    }
    if (station.medium === "rawGas") {
      if (station.throughput > station.capacity * 1.05) {
        return { level: "warning", message: `原料气处理量 ${station.throughput.toFixed(1)} 万m³/d，超过设计负荷` };
      }
      if (station.pressure > 10) {
        return { level: "warning", message: `外输压力 ${station.pressure.toFixed(1)} MPa，超过 10 MPa 预警阈值` };
      }
    }
    if (station.medium === "sweetGas" && (station.h2sOut ?? 0) > 20) {
      return { level: "critical", message: `净化气硫化氢 ${(station.h2sOut ?? 0).toFixed(1)} mg/m³，超过 20 mg/m³ 指标` };
    }
    return null;
  }

  private pipelineViolation(pipeline: Pipeline): Violation | null {
    if (pipeline.status === "maintenance") {
      return { level: "info", message: `${pipeline.name} 检修中` };
    }
    if (pipeline.status === "stopped") {
      return { level: "warning", message: `${pipeline.name} 已停输` };
    }
    return null;
  }

  private applyViolation(
    targetId: string,
    violation: Violation | null,
    targetType?: FeatureKind,
  ): void {
    const state = this.alarmState.get(targetId);
    if (!violation) {
      if (!state) return;
      state.normalTicks += 1;
      if (state.normalTicks >= RESOLVE_TICKS) {
        state.alarm.status = "resolved";
        this.alarmState.delete(targetId);
      }
      return;
    }

    if (state && state.alarm.status !== "resolved") {
      state.normalTicks = 0;
      return;
    }

    const last = this.lastRaised.get(targetId) ?? 0;
    if (Date.now() - last < ALARM_COOLDOWN) return;
    this.raiseAlarm(targetId, violation.level, violation.message, targetType);
  }

  private mutateWell(well: Well): void {
    if (well.status === "offline") return;
    const metrics = well.metrics;
    metrics.gas = round(clamp(metrics.gas + this.rand() * 0.3 - 0.15, 0.5, 40), 1);
    metrics.pressure = round(clamp(metrics.pressure + this.rand() * 0.16 - 0.08, 30, 60), 1);
    metrics.temp = round(clamp(metrics.temp + this.rand() * 0.12 - 0.06, 45, 85), 1);
    metrics.h2s = round(clamp((metrics.h2s ?? 60) + this.rand() * 0.3 - 0.15, 40, 98), 1);
    metrics.water = round(clamp(metrics.water + this.rand() * 0.06 - 0.03, 0, 15), 1);
    const base = Math.max(0.5, metrics.gas);
    well.history = [...well.history.slice(1), round(base + this.rand() * 0.4 - 0.2, 2)];
  }

  private balanceGas(): void {
    const openWells = this.field.wells.filter((well) => well.status !== "offline");
    if (!openWells.length) return;
    const current = openWells.reduce((total, well) => total + well.metrics.gas, 0);
    const adjust = (TARGET_GAS - current) / openWells.length;
    for (const well of openWells) {
      well.metrics.gas = round(clamp(well.metrics.gas + adjust, 0.5, 40), 1);
    }
  }

  tick(): TickResult {
    this.tickCount += 1;
    for (const well of this.field.wells) this.mutateWell(well);
    this.balanceGas();
    refreshFieldAggregates(this.field);

    for (const well of this.field.wells) {
      this.applyViolation(well.id, this.wellViolation(well), "well");
    }
    for (const station of this.field.stations) {
      this.applyViolation(station.id, this.stationViolation(station.id), "station");
    }
    for (const pipeline of this.field.pipelines) {
      this.applyViolation(pipeline.id, this.pipelineViolation(pipeline), "pipeline");
    }

    return {
      changedWellIds: this.field.wells.filter((well) => well.status !== "offline").map((well) => well.id),
      changedStationIds: this.field.stations.map((station) => station.id),
      changedPipelineIds: this.field.pipelines.map((pipeline) => pipeline.id),
      stats: this.getStats(),
      alarms: [...this.alarms],
    };
  }
}

export function createSimulation(field: FieldData): Simulation {
  return new Simulation(field);
}
