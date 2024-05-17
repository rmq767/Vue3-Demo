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

export interface CesiumConfig {
  lookAt?: [number, number, number];
}

export interface CesiumDrawGetData {
  degrees: number[];
  index: number;
  data?: any;
}

export interface CesiumData {
  type: CesiumFilterType;
  name: string;
  businessId?: string;
  legendUrl?: string;
  pointData: CesiumDataItem[];
}

export interface CesiumDataItem {
  lon: number;
  lat: number;
  id?: string;
  flag?: string;
  remark?: string;
}

export interface MyConstructorOptions extends Cesium.Entity {
  data?: any;
  type?: CesiumFilterType;
  isStatic?: boolean;
}
/**
 * @description 大屏根据类型获取下拉
 */
export interface ScreenOptionParams {
  type: number;
  businessName: string;
}
/**
 * @description 获取大屏数据
 */
export interface ScreenDataParams {
  type: number;
  businessId: string;
}
