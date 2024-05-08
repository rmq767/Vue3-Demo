import * as Cesium from 'cesium';

export enum CesiumDataType {
  Point = 'point',
  Polyline = 'polyline',
  Polygon = 'polygon'
}

export enum CesiumFilterType {
  Plan = 'plan',
  Block = 'block',
  Platform = 'platform',
  Well = 'well',
  Pipeline = 'pipeline',
  Device = 'device'
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
  id?: string;
  data?: CesiumDataItem[];
  children?: CesiumData[];
}

export interface CesiumDataItem {
  longitude: number;
  latitude: number;
  name: string;
  id?: string;
  flag?: string;
  remark?: string;
}

export interface MyConstructorOptions extends Cesium.Entity {
  data?: any;
  type?: CesiumFilterType;
}
