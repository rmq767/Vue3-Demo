/**
 * @description 格式化日期的格式
 */
export enum DateTimeFormat {
  YEAR = "YYYY",
  MONTH = "YYYY-MM",
  DATE = "YYYY-MM-DD",
  DATETIME = "YYYY-MM-DD HH:mm:ss",
}
/**
 * @description 列表的列
 */
export interface TableColumn {
  prop: string;
  label: string;
  width?: string;
  template?: TableColumnTemplate | string;
  filters?: TableColumnFilters[];
  slot?: string;
}

export type TableColumnTemplate = "date" | "progress";
export interface TableColumnFilters {
  text: string;
  value: string;
}

export interface Tree {
  label: string;
  id: string;
  children?: Tree[];
}

export interface Option {
  label: string;
  value: string;
}

export interface Pagination {
  pageNum: number;
  pageSize: number;
}

// ─── SearchFilter 筛选项配置 ─────────────────────────────────
export interface FilterItem {
  type: "input" | "select" | "date-picker" | "date-range" | "slot";
  label: string;
  prop: string;
  placeholder?: string;
  span?: number;
  options?: { label: string; value: any }[];
  pickerType?: "year" | "month" | "date";
  slot?: string;
}

// ─── VxeTable 列配置 ───────────────────────────────────────────
export interface VxeColumn {
  field: string;
  title: string;
  width?: number | string;
  minWidth?: number | string;
  fixed?: "left" | "right";
  align?: "left" | "center" | "right";
  slot?: boolean;
  visible?: boolean;
  [key: string]: any;
}
