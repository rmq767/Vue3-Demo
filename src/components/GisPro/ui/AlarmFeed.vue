<script lang="ts" setup>
import { computed } from "vue";
import AfIcon from "./AfIcon.vue";
import AfPanel from "./AfPanel.vue";
import { actions, state } from "./store";

const active = computed(() =>
  [...state.alarms]
    .filter((alarm) => alarm.status !== "resolved")
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 6),
);

const activeCount = computed(() => active.value.length);

function levelLabel(level: string): string {
  if (level === "critical") return "危急";
  if (level === "warning") return "预警";
  return "提示";
}

function timeLabel(ts: number): string {
  const date = new Date(ts);
  const pad = (value: number) => `${value}`.padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function focus(id: string): void {
  actions.focus(id);
}

function acknowledge(id: string, event: Event): void {
  event.stopPropagation();
  actions.ackAlarm(id);
}
</script>

<template>
  <AfPanel title="告警中心" subtitle="ALARM STREAM">
    <template #extra>
      <span class="af-alarm-count" :class="{ 'is-active': activeCount > 0 }">
        {{ activeCount.toString().padStart(2, "0") }}
      </span>
      <button class="af-text-btn" type="button" @click="actions.replayAlarm()">
        演练
      </button>
    </template>

    <div class="af-alarms" role="status" aria-live="polite">
      <article
        v-for="alarm in active"
        :key="alarm.id"
        class="af-alarm"
        :class="[`is-${alarm.level}`, { 'is-ack': alarm.status === 'ack' }]"
        tabindex="0"
        @click="focus(alarm.targetId)"
        @keydown.enter="focus(alarm.targetId)"
      >
        <span class="af-alarm__bar"></span>
        <div class="af-alarm__content">
          <div class="af-alarm__top">
            <span class="af-alarm__level">{{ levelLabel(alarm.level) }}</span>
            <strong>{{ alarm.targetName }}</strong>
            <em>{{ timeLabel(alarm.ts) }}</em>
          </div>
          <p>{{ alarm.message }}</p>
          <div class="af-alarm__bottom">
            <span>{{ alarm.status === "ack" ? "已确认 · 待处置" : "点击定位目标" }}</span>
            <button
              v-if="alarm.status === 'active'"
              class="af-mini-btn"
              type="button"
              @click="acknowledge(alarm.id, $event)"
            >
              确认
            </button>
            <span v-else class="af-alarm__ack">
              <AfIcon name="check" :size="12" /> ACK
            </span>
          </div>
        </div>
      </article>

      <div v-if="!active.length" class="af-alarm-empty">
        <span class="af-alarm-empty__ring"><AfIcon name="check" :size="18" /></span>
        <div>
          <strong>暂无活动告警</strong>
          <p>全部井站运行平稳 · 最近巡检正常</p>
        </div>
      </div>
    </div>
  </AfPanel>
</template>
