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
