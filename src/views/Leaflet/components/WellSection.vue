<script lang="ts" setup>
import { computed } from "vue";
import type {
  FeatureDetail,
  Reservoir,
  StrataLayer,
  Well,
} from "@/components/GisPro/data/types";
import AfIcon from "@/components/GisPro/ui/AfIcon.vue";

const props = defineProps<{
  well: Well;
  detail: FeatureDetail;
  strata: StrataLayer[];
  reservoirs: Reservoir[];
}>();

const emit = defineEmits<{ close: []; locate: [] }>();

const VIEW_W = 440;
const VIEW_H = 330;
const TOP = 14;
const PLOT_H = 288;
const AXIS_X = 58;
const PLOT_W = 286;

const RESERVOIR_COLORS: Record<string, string> = {
  oil: "#f5a524",
  gas: "#4af2c8",
  violet: "#9b8cff",
};

const maxDepth = computed(() => {
  const target = props.reservoirs.find((item) => item.id === props.well.reservoirId);
  const depth = Math.max(
    props.well.depth + 80,
    target ? target.bottomDepth + 60 : 0,
  );
  return Math.ceil(depth / 100) * 100;
});

const depthToY = (depth: number): number =>
  TOP + (Math.min(depth, maxDepth.value) / maxDepth.value) * PLOT_H;

const strataBands = computed(() =>
  props.strata
    .map((layer) => ({
      ...layer,
      y: TOP + layer.from * PLOT_H,
      height: Math.max(1, (layer.to - layer.from) * PLOT_H),
    }))
    .filter((layer) => layer.height >= 2),
);

const depthTicks = computed(() => {
  const ticks: { depth: number; y: number }[] = [];
  const step = 500;
  for (let depth = 0; depth <= maxDepth.value; depth += step) {
    ticks.push({ depth, y: depthToY(depth) });
  }
  return ticks;
});

const reservoirBands = computed(() =>
  props.reservoirs
    .filter((reservoir) => reservoir.topDepth < maxDepth.value)
    .map((reservoir) => {
      const top = Math.min(reservoir.topDepth, maxDepth.value);
      const bottom = Math.min(reservoir.bottomDepth, maxDepth.value);
      const y = depthToY(top);
      const height = Math.max(3, depthToY(bottom) - y);
      return {
        ...reservoir,
        x: AXIS_X,
        width: PLOT_W,
        y,
        height,
        color: RESERVOIR_COLORS[reservoir.colorKey] ?? "#3de1ff",
        isTarget: reservoir.id === props.well.reservoirId,
        chipY: y + height / 2,
      };
    }),
);

const wellGeometry = computed(() => {
  const lateral = props.well.lateralLength > 0;
  const side = Math.sin(props.well.azimuth) >= 0 ? 1 : -1;
  const x0 = lateral && side < 0 ? AXIS_X + PLOT_W - 44 : 118;
  const kickoffDepth = lateral ? maxDepth.value * 0.56 : props.well.depth;
  const startY = TOP + 1;
  const kickoffY = depthToY(kickoffDepth);
  const endY = depthToY(props.well.depth);
  const available = side > 0 ? AXIS_X + PLOT_W - 16 - x0 : x0 - AXIS_X - 16;
  const dx = lateral ? Math.min(available, 42 + props.well.lateralLength * 0.14) : 0;
  const endX = x0 + side * dx;
  const path = lateral
    ? `M ${x0} ${startY} L ${x0} ${kickoffY} C ${x0 + side * 12} ${kickoffY + (endY - kickoffY) * 0.46}, ${endX - side * 12} ${endY - (endY - kickoffY) * 0.22}, ${endX} ${endY}`
    : `M ${x0} ${startY} L ${x0} ${endY}`;

  const target = reservoirBands.value.find((item) => item.isTarget);
  const perfY = target ? target.chipY : depthToY(props.well.depth) - 18;
  let perfX = x0;
  if (lateral && perfY > kickoffY) {
    const t = Math.min(1, Math.max(0, (perfY - kickoffY) / Math.max(1, endY - kickoffY)));
    const eased = t * t * (3 - 2 * t);
    perfX = x0 + side * dx * eased;
  }

  return { x0, side, startY, kickoffY, endY, endX, path, perfX, perfY, lateral };
});

const bottomLabel = computed(() => {
  const geometry = wellGeometry.value;
  const anchor = geometry.side > 0 ? "start" : "end";
  const x = Math.min(
    VIEW_W - 8,
    Math.max(8, geometry.endX + geometry.side * 10),
  );
  return { x, anchor };
});

const perforations = computed(() => {
  const geometry = wellGeometry.value;
  return [-8, -3, 2, 7].map((offset) => ({
    x1: geometry.perfX - 5,
    x2: geometry.perfX + 5,
    y: geometry.perfY + offset,
  }));
});

const statsLine = computed(
  () =>
    `${props.detail.meta.find((item) => item.label === "层位")?.value ?? "—"} · ${
      props.well.lateralLength > 0 ? `水平段 ${props.well.lateralLength} m` : "直井"
    } · 方位角 ${Math.round((props.well.azimuth * 180) / Math.PI)}°`,
);
</script>

<template>
  <section class="lgis-panel lgis-section">
    <div class="lgis-panel__head">
      <div class="lgis-panel__title">
        <span class="lgis-panel__bar"></span>
        单井井轨迹
        <small>WELL SECTION</small>
      </div>
      <button class="lgis-icon-btn" type="button" title="关闭剖面" @click="emit('close')">
        <AfIcon name="close" :size="14" />
      </button>
    </div>

    <div class="lgis-section__body">
      <div class="lgis-detail__hero">
        <span class="lgis-detail__icon is-well">
          <AfIcon name="well" :size="18" />
        </span>
        <div class="lgis-detail__copy">
          <strong>{{ well.name }}</strong>
          <span>{{ detail.subtitle }}</span>
        </div>
        <em class="lgis-chip" :class="`is-${detail.statusTone}`">{{ detail.statusLabel }}</em>
      </div>

      <div class="lgis-detail__metrics is-compact">
        <div
          v-for="metric in detail.metrics"
          :key="metric.label"
          class="lgis-metric"
          :class="`is-${metric.tone ?? 'default'}`"
        >
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}<small>{{ metric.unit }}</small></strong>
        </div>
      </div>

      <div class="lgis-section__chart">
        <svg :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`" role="img" :aria-label="`${well.name} 井轨迹剖面`">
          <rect
            x="0"
            y="0"
            :width="VIEW_W"
            :height="VIEW_H"
            fill="rgba(2, 6, 11, 0.48)"
          />

          <g class="lgis-section__strata">
            <g v-for="band in strataBands" :key="band.id">
              <rect
                :x="AXIS_X"
                :y="band.y"
                :width="PLOT_W"
                :height="band.height"
                :fill="band.color"
                fill-opacity="0.24"
              />
              <line
                v-if="band.height > 12"
                :x1="AXIS_X"
                :x2="AXIS_X + PLOT_W"
                :y1="band.y"
                :y2="band.y"
                stroke="rgba(230, 247, 255, 0.14)"
                stroke-dasharray="3 4"
              />
              <text
                v-if="band.height >= 19"
                :x="AXIS_X + 8"
                :y="band.y + band.height / 2"
                dominant-baseline="middle"
                fill="rgba(230, 247, 255, 0.72)"
                font-size="8.5"
              >
                {{ band.name }}
              </text>
            </g>
          </g>

          <g class="lgis-section__reservoirs">
            <g v-for="band in reservoirBands" :key="band.id">
              <rect
                :x="band.x"
                :y="band.y"
                :width="band.width"
                :height="band.height"
                :fill="band.color"
                :fill-opacity="band.isTarget ? 0.2 : 0.1"
                :stroke="band.color"
                :stroke-opacity="band.isTarget ? 0.85 : 0.35"
                :stroke-width="band.isTarget ? 1.2 : 0.7"
                stroke-dasharray="5 4"
              />
              <line
                :x1="AXIS_X + PLOT_W"
                :x2="AXIS_X + PLOT_W + 8"
                :y1="band.chipY"
                :y2="band.chipY"
                :stroke="band.color"
                stroke-opacity="0.55"
              />
              <circle
                :cx="AXIS_X + PLOT_W + 12"
                :cy="band.chipY"
                r="2.6"
                :fill="band.color"
              />
              <text
                :x="AXIS_X + PLOT_W + 18"
                :y="band.chipY - 2"
                fill="rgba(230, 247, 255, 0.82)"
                font-size="8.5"
              >
                {{ band.shortName }}
              </text>
              <text
                :x="AXIS_X + PLOT_W + 18"
                :y="band.chipY + 9"
                fill="rgba(158, 184, 200, 0.7)"
                font-family="'SFMono-Regular', Consolas, monospace"
                font-size="7.5"
              >
                饱和 {{ band.saturation.toFixed(0) }}%
              </text>
            </g>
          </g>

          <g class="lgis-section__axis">
            <line
              :x1="AXIS_X"
              :x2="AXIS_X"
              :y1="TOP"
              :y2="TOP + PLOT_H"
              stroke="rgba(61, 225, 255, 0.32)"
            />
            <g v-for="tick in depthTicks" :key="tick.depth">
              <line
                :x1="AXIS_X - 4"
                :x2="AXIS_X"
                :y1="tick.y"
                :y2="tick.y"
                stroke="rgba(61, 225, 255, 0.4)"
              />
              <text
                :x="AXIS_X - 8"
                :y="tick.y + 3"
                text-anchor="end"
                fill="rgba(158, 184, 200, 0.8)"
                font-family="'SFMono-Regular', Consolas, monospace"
                font-size="7.5"
              >
                {{ tick.depth }}
              </text>
            </g>
            <text
              :x="AXIS_X - 8"
              :y="TOP - 2"
              text-anchor="end"
              fill="rgba(95, 123, 140, 0.8)"
              font-size="7"
            >
              m
            </text>
          </g>

          <g class="lgis-section__well">
            <line
              v-if="wellGeometry.lateral"
              :x1="wellGeometry.x0"
              :x2="wellGeometry.x0"
              :y1="wellGeometry.startY"
              :y2="wellGeometry.endY"
              stroke="rgba(230, 247, 255, 0.18)"
              stroke-dasharray="2 4"
            />
            <path
              :d="wellGeometry.path"
              fill="none"
              stroke="#02060b"
              stroke-width="6"
              stroke-linecap="round"
            />
            <path
              :d="wellGeometry.path"
              fill="none"
              :stroke="well.status === 'warning' ? '#ffc857' : well.status === 'offline' ? '#5f7b8c' : '#3de1ff'"
              stroke-width="2.4"
              stroke-linecap="round"
            />
            <g v-for="(perf, index) in perforations" :key="index">
              <line
                :x1="perf.x1"
                :x2="perf.x2"
                :y1="perf.y"
                :y2="perf.y"
                :stroke="well.status === 'warning' ? '#ffc857' : '#3de1ff'"
                stroke-width="1.4"
                stroke-linecap="round"
              />
            </g>
            <circle
              :cx="wellGeometry.x0"
              :cy="wellGeometry.startY"
              r="4"
              fill="#3de1ff"
              stroke="#02060b"
              stroke-width="1.5"
            />
            <circle
              :cx="wellGeometry.x0"
              :cy="wellGeometry.startY"
              r="8"
              fill="none"
              stroke="rgba(61, 225, 255, 0.45)"
            />
            <text
              :x="wellGeometry.x0 + 12"
              :y="wellGeometry.startY + 4"
              fill="rgba(230, 247, 255, 0.78)"
              font-size="8.5"
            >
              井口
            </text>
            <circle
              :cx="wellGeometry.endX"
              :cy="wellGeometry.endY"
              r="3.6"
              :fill="well.status === 'offline' ? '#5f7b8c' : '#f5a524'"
              stroke="#02060b"
              stroke-width="1.2"
            />
            <text
              :x="bottomLabel.x"
              :y="wellGeometry.endY + 4"
              :text-anchor="bottomLabel.anchor"
              fill="rgba(245, 165, 36, 0.9)"
              font-size="8.5"
            >
              井底 {{ well.depth }} m
            </text>
          </g>

          <text
            :x="AXIS_X"
            :y="VIEW_H - 10"
            fill="rgba(95, 123, 140, 0.82)"
            font-size="7.5"
          >
            地层柱示意 · 深度比例归一化
          </text>
        </svg>
      </div>

      <p class="lgis-section__line">{{ statsLine }}</p>

      <div class="lgis-detail__actions">
        <button class="lgis-btn is-primary" type="button" @click="emit('locate')">
          <AfIcon name="focus" :size="14" />定位井位
        </button>
        <button class="lgis-btn is-ghost" type="button" @click="emit('close')">
          <AfIcon name="reset" :size="14" />返回油田
        </button>
        <span class="lgis-detail__kind">{{ well.id }} / TVD</span>
      </div>
    </div>
  </section>
</template>
