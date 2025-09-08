import * as Cesium from "cesium";

export enum CesiumDataType {
  Point = "point",
  Polyline = "polyline",
  Polygon = "polygon",
}

export enum CesiumFilterType {
  Plan,
  Block,
  Platform,
  Well,
  Pipeline,
  Device,
}

export enum PolygonType {
  Area = "area",
  Line = "line",
}

export interface CesiumConfig {
  lookAt?: [number, number, number];
  max?: number;
  min?: number;
}

export interface CesiumDrawGetData {
  degrees: number[];
  index: number;
  data?: any;
}

export interface CesiumData {
  type: CesiumFilterType;
  name: string;
  pointData: CesiumDataItem[];
  remark?: string;
}

export type WellType = "直井" | "水平井" | "定向井";

export interface CesiumDataItem {
  lon: number;
  lat: number;
  id?: string;
  name?: string;
  remark?: string;
  img?: string;
}

export interface MyConstructorOptions extends Cesium.Entity {
  data?: any;
  type?: CesiumFilterType;
  wellType?: WellType;
  isStatic?: boolean;
}
/**
 * @description 大屏根据类型获取下拉
 */
export interface ScreenOptionParams {
  // type: number;
  businessName: string;
}
/**
 * @description 获取大屏数据
 */
export interface ScreenDataParams {
  type: number;
  businessId: string;
}
