export type ChartType = "line" | "bar" | "pie";

export interface CardProps {
  title: string;
  chartType: ChartType;
  theme: string;
}

export interface CardItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  props: CardProps;
}

export const GRID_COLUMNS = 8;
export const CARD_WIDTH = 4;
export const CARD_HEIGHT = 3;
export const GRID_MARGIN = 6;
export const STORAGE_KEY = "demo:drag-layout:v2";

export const CHART_TYPE_OPTIONS: Array<{ value: ChartType; label: string }> = [
  { value: "line", label: "折线图" },
  { value: "bar", label: "柱状图" },
  { value: "pie", label: "饼图" },
];

const DEFAULT_TITLES: Record<ChartType, string> = {
  line: "折线图",
  bar: "柱状图",
  pie: "饼图",
};

const DEFAULT_THEMES: Record<ChartType, string> = {
  line: "#5470c6",
  bar: "#91cc75",
  pie: "#fac858",
};

export const PANELS: Array<{ type: ChartType; title: string; img: string }> = [
  {
    type: "line",
    title: "折线图",
    img: "https://echarts.apache.org/examples/data/thumb/line-simple.webp",
  },
  {
    type: "bar",
    title: "柱状图",
    img: "https://echarts.apache.org/examples/data/thumb/bar-simple.webp",
  },
  {
    type: "pie",
    title: "饼图",
    img: "https://echarts.apache.org/examples/data/thumb/pie-simple.webp",
  },
];

export function createProps(type: ChartType, title?: string): CardProps {
  return {
    title: title?.trim() || DEFAULT_TITLES[type],
    chartType: type,
    theme: DEFAULT_THEMES[type],
  };
}

let idSeq = 0;

export function createId(): string {
  idSeq += 1;
  return `card-${Date.now().toString(36)}-${idSeq.toString(36)}`;
}

export function createCard(type: ChartType, x: number, y: number): CardItem {
  return {
    id: createId(),
    x,
    y,
    w: CARD_WIDTH,
    h: CARD_HEIGHT,
    props: createProps(type),
  };
}

export function defaultCards(): CardItem[] {
  const perRow = Math.max(1, Math.floor(GRID_COLUMNS / CARD_WIDTH));
  return PANELS.map((panel, index) =>
    createCard(
      panel.type,
      (index % perRow) * CARD_WIDTH,
      Math.floor(index / perRow) * CARD_HEIGHT,
    ),
  );
}
