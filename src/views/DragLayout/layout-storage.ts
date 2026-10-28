import {
  CHART_TYPE_OPTIONS,
  GRID_COLUMNS,
  STORAGE_KEY,
  createProps,
  type CardItem,
  type CardProps,
  type ChartType,
} from "./types";

interface PersistedLayout {
  v: 2;
  items: CardItem[];
}

const CHART_TYPES = CHART_TYPE_OPTIONS.map((option) => option.value);

const isInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

const isOverlapping = (a: CardItem, b: CardItem) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function parseCard(raw: unknown): CardItem | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, any>;
  if (typeof data.id !== "string" || !data.id) return null;

  const { x, y, w, h } = data;
  if (![x, y, w, h].every(isInt)) return null;
  if (x < 0 || y < 0 || w < 1 || h < 1) return null;
  if (w > GRID_COLUMNS || x + w > GRID_COLUMNS) return null;

  const chartType = data.props?.chartType as ChartType;
  if (!CHART_TYPES.includes(chartType)) return null;

  const title = typeof data.props?.title === "string" ? data.props.title : undefined;
  const props: CardProps = createProps(chartType, title);
  if (typeof data.props?.theme === "string" && /^#[0-9a-f]{6}$/i.test(data.props.theme)) {
    props.theme = data.props.theme;
  }

  return { id: data.id, x, y, w, h, props };
}

/**
 * 返回 null 表示没有可用存档（调用方使用默认布局）；
 * 返回空数组表示用户主动清空过画布，需保留空状态。
 */
export function loadLayout(): CardItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw) as Partial<PersistedLayout>;
    if (data.v !== 2 || !Array.isArray(data.items)) return null;
    if (data.items.length === 0) return [];

    const items: CardItem[] = [];
    for (const rawItem of data.items) {
      const item = parseCard(rawItem);
      if (!item) continue;
      if (items.some((kept) => kept.id === item.id || isOverlapping(kept, item))) continue;
      items.push(item);
    }

    return items.length ? items : null;
  } catch {
    return null;
  }
}

export function saveLayout(items: CardItem[]): void {
  const data: PersistedLayout = {
    v: 2,
    items: items.map((item) => ({
      id: item.id,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      props: {
        title: item.props.title,
        chartType: item.props.chartType,
        theme: item.props.theme,
      },
    })),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 隐私模式或配额不足时静默失败，不影响页面使用
  }
}
