import type { FieldData, FieldEvent, Well } from "./types";
import { recalculateAggregates } from "./field";

export interface RealtimeState {
  rng: () => number;
  warnExpiry: Map<string, number>;
  sequence: number;
}

export interface RealtimeResult {
  changedWellIds: string[];
  events: FieldEvent[];
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function createRealtimeState(seed = 20261027): RealtimeState {
  return {
    rng: mulberry32(seed),
    warnExpiry: new Map(),
    sequence: 0,
  };
}

function nextId(state: RealtimeState, now: number): string {
  state.sequence += 1;
  return `evt-${now}-${state.sequence}`;
}

function makeEvent(
  state: RealtimeState,
  now: number,
  level: FieldEvent["level"],
  well: Well,
  message: string,
): FieldEvent {
  return {
    id: nextId(state, now),
    ts: now,
    level,
    sourceId: well.id,
    sourceName: well.name,
    message,
  };
}

/**
 * 一次实时模拟 tick：产气/压力随机游走、告警产生与自动解除、区块/平台汇总。
 * 直接修改传入的 reactive field，返回变更与事件。
 */
export function tickField(
  field: FieldData,
  state: RealtimeState,
  now = Date.now(),
): RealtimeResult {
  const events: FieldEvent[] = [];
  const changed = new Set<string>();
  const rng = state.rng;

  // 模拟告警到期自动解除
  state.warnExpiry.forEach((expiresAt, wellId) => {
    if (expiresAt > now) return;
    const well = field.wells.find((item) => item.id === wellId);
    if (well && well.status === "warning") {
      well.status = "normal";
      well.pressure = round(clamp(well.pressure * 0.82, 8, 26), 1);
      changed.add(well.id);
      events.push(makeEvent(state, now, "info", well, "预警解除，参数恢复正常区间"));
    }
    state.warnExpiry.delete(wellId);
  });

  // 产气/压力/温度随机游走
  const candidates = field.wells.filter((well) => well.status !== "offline");
  const adjustCount = Math.min(candidates.length, 3 + Math.floor(rng() * 3));
  const shuffled = candidates
    .map((well) => ({ well, sort: rng() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, adjustCount)
    .map((item) => item.well);

  shuffled.forEach((well) => {
    const previousGas = well.dailyGas;
    well.dailyGas = round(clamp(well.dailyGas * (0.97 + rng() * 0.06), 0.8, 34), 1);
    well.pressure = round(clamp(well.pressure + (rng() - 0.5) * 1.2, 6, 34), 1);
    well.temperature = round(clamp(well.temperature + (rng() - 0.5) * 1.4, 32, 88), 1);
    well.history.push(well.dailyGas);
    if (well.history.length > 30) well.history.shift();
    changed.add(well.id);

    const delta = (well.dailyGas - previousGas) / Math.max(previousGas, 0.1);
    if (Math.abs(delta) > 0.035 && well.status !== "warning" && rng() < 0.35) {
      events.push(
        makeEvent(
          state,
          now,
          "info",
          well,
          `产气量${delta > 0 ? "上升" : "下降"} ${(Math.abs(delta) * 100).toFixed(1)}%`,
        ),
      );
    }
  });

  // 低概率新告警，最多保留 2 条模拟告警
  if (state.warnExpiry.size < 2 && rng() < 0.1) {
    const normalWells = field.wells.filter((well) => well.status === "normal");
    if (normalWells.length) {
      const well = normalWells[Math.floor(rng() * normalWells.length)];
      well.status = "warning";
      well.pressure = round(clamp(Math.max(well.pressure, 27) + rng() * 4, 27, 34), 1);
      well.dailyGas = round(clamp(well.dailyGas * 0.92, 0, 34), 1);
      changed.add(well.id);
      state.warnExpiry.set(well.id, now + 18000 + rng() * 14000);
      events.push(makeEvent(state, now, "warning", well, "套压异常升高，触发参数预警"));
    }
  }

  // 管道流量联动
  field.pipelines.forEach((pipeline) => {
    if (pipeline.runStatus !== "running") {
      pipeline.flow = 0;
      return;
    }
    const drift = pipeline.medium === "天然气" ? 0.04 : 0.06;
    pipeline.flow = round(
      clamp(pipeline.flow * (1 - drift / 2 + rng() * drift), 0, 600),
      pipeline.medium === "天然气" ? 1 : 0,
    );
  });

  recalculateAggregates(field);

  return {
    changedWellIds: Array.from(changed),
    events: events.slice(0, 2),
  };
}
