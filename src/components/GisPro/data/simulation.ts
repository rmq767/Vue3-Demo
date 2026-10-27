import { createStats, featureName, findStation, findWell, pipelineMediumLabel } from "./field";
import type {
  Alarm,
  AlarmLevel,
  FeatureKind,
  FieldData,
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

export class Simulation {
  private readonly rand = mulberry32(20261028);
  private alarms: Alarm[] = [];
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
    const existing = this.alarms.find(
      (alarm) => alarm.targetId === targetId && alarm.status !== "resolved",
    );
    if (existing) return existing;

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
    return alarm;
  }

  ackAlarm(id: string): void {
    const alarm = this.alarms.find((item) => item.id === id);
    if (alarm && alarm.status === "active") alarm.status = "ack";
  }

  resolveAlarm(id: string): void {
    const alarm = this.alarms.find((item) => item.id === id);
    if (alarm) alarm.status = "resolved";
  }

  resolveTarget(targetId: string): void {
    this.alarms
      .filter((alarm) => alarm.targetId === targetId && alarm.status !== "resolved")
      .forEach((alarm) => {
        alarm.status = "resolved";
      });
  }

  private resolveTargetType(id: string): FeatureKind | null {
    if (findWell(this.field, id)) return "well";
    if (findStation(this.field, id)) return "station";
    if (this.field.pipelines.some((pipeline) => pipeline.id === id)) return "pipeline";
    return null;
  }

  private chooseWells(): Well[] {
    const active = this.field.wells.filter((well) => well.status !== "offline");
    const count = 3 + Math.floor(this.rand() * 3);
    const picked = new Set<string>();
    const result: Well[] = [];
    while (result.length < count && picked.size < active.length) {
      const well = active[Math.floor(this.rand() * active.length)];
      if (picked.has(well.id)) continue;
      picked.add(well.id);
      result.push(well);
    }
    return result;
  }

  private mutateWell(well: Well): void {
    const oilDelta = this.rand() * 2.2 - 1.1;
    const gasDelta = this.rand() * 0.5 - 0.25;
    const pressureDelta = this.rand() * 0.7 - 0.35;
    well.metrics.oil = round(clamp(well.metrics.oil + oilDelta, 0, 62), 1);
    well.metrics.gas = round(clamp(well.metrics.gas + gasDelta, 0, 24), 1);
    well.metrics.pressure = round(clamp(well.metrics.pressure + pressureDelta, 4, 34), 1);
    well.metrics.temp = round(clamp(well.metrics.temp + this.rand() * 0.5 - 0.25, 28, 92), 1);
    well.metrics.water = round(clamp(well.metrics.water + this.rand() * 1.2 - 0.6, 0, 92), 1);

    const base = well.metrics.oil || well.metrics.gas * 8 || 8;
    well.history = [...well.history.slice(1), round(base + this.rand() * 2 - 1, 2)];
  }

  private refreshAggregates(): void {
    for (const station of this.field.stations) {
      const wells = this.field.wells.filter((well) => station.wellIds.includes(well.id));
      const isLiquid = station.type === "联合站" || station.type === "外输首站";
      station.throughput = round(
        isLiquid
          ? wells.reduce((total, well) => total + well.metrics.oil, 0)
          : wells.reduce((total, well) => total + well.metrics.gas, 0),
        isLiquid ? 0 : 1,
      );
      const target = isLiquid ? 6.4 : 4.2;
      station.pressure = round(clamp(station.pressure + (this.rand() * 0.8 - 0.4), target - 2.6, target + 3.4), 1);
    }

    for (const pipeline of this.field.pipelines) {
      if (pipeline.status !== "running") {
        pipeline.flow = 0;
        continue;
      }
      const mediumBase = pipeline.medium === "gas" ? 760 : pipeline.medium === "water" ? 420 : 620;
      pipeline.flow = round(
        clamp(pipeline.flow + (this.rand() * 160 - 80), mediumBase * 0.35, mediumBase * 2.1),
        0,
      );
    }

    for (const block of this.field.blocks) {
      const wells = this.field.wells.filter((well) => well.blockId === block.id);
      block.dailyOil = round(wells.reduce((total, well) => total + well.metrics.oil, 0));
      block.dailyGas = round(wells.reduce((total, well) => total + well.metrics.gas, 0));
    }

    const stats = this.getStats();
    this.field.productionHistory.oil = [
      ...this.field.productionHistory.oil.slice(1),
      round(stats.totalOil, 0),
    ];
    this.field.productionHistory.gas = [
      ...this.field.productionHistory.gas.slice(1),
      round(stats.totalGas, 1),
    ];
  }

  private refreshAlarms(): void {
    for (const well of this.field.wells) {
      if (well.status !== "warning") continue;
      if (this.alarms.some((alarm) => alarm.targetId === well.id && alarm.status !== "resolved")) {
        continue;
      }
      this.raiseAlarm(
        well.id,
        "warning",
        `套压 ${well.metrics.pressure.toFixed(1)} MPa，超预警阈值`,
        "well",
      );
    }

    for (const pipeline of this.field.pipelines) {
      if (pipeline.status === "running") continue;
      if (this.alarms.some((alarm) => alarm.targetId === pipeline.id && alarm.status !== "resolved")) {
        continue;
      }
      this.raiseAlarm(
        pipeline.id,
        pipeline.status === "maintenance" ? "info" : "warning",
        `${pipeline.name} ${pipeline.status === "maintenance" ? "检修中" : "已停输"} · ${pipelineMediumLabel(pipeline.medium)}`,
        "pipeline",
      );
    }
  }

  tick(): TickResult {
    this.tickCount += 1;
    const wells = this.chooseWells();
    wells.forEach((well) => this.mutateWell(well));
    this.refreshAggregates();
    this.refreshAlarms();

    const changedStationIds = this.field.stations
      .filter((station, index) => station.status !== "normal" || index % 3 === this.tickCount % 3)
      .map((station) => station.id);
    const changedPipelineIds = this.field.pipelines
      .filter((pipeline) => pipeline.status !== "running" || this.rand() > 0.5)
      .map((pipeline) => pipeline.id);

    return {
      changedWellIds: wells.map((well) => well.id),
      changedStationIds,
      changedPipelineIds,
      stats: this.getStats(),
      alarms: [...this.alarms],
    };
  }
}

export function createSimulation(field: FieldData): Simulation {
  return new Simulation(field);
}
