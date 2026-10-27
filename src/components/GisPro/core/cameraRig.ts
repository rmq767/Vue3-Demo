import * as Cesium from "cesium";
import type { CameraHud, CameraState, FieldData } from "../data/types";

const DEG = Math.PI / 180;
const METERS_PER_DEG_LAT = 110540;

export interface CameraRig {
  state: CameraState;
  apply(): void;
  targetCartesian(): Cesium.Cartesian3;
  getHud(): CameraHud;
  stateFromTarget(x: number, z: number, height?: number): void;
  destroy(): void;
}

/**
 * 相机唯一事实源：围绕本地沙盘 target 的 lookAt 轨道。
 * 所有镜头（开场/巡演/自由轨道/聚焦）只改 state，preRender 时统一 apply，
 * 保证 Cesium 渲染和 Three 同步永远同一帧。
 */
export function createCameraRig(
  viewer: Cesium.Viewer,
  field: FieldData,
  initial: CameraState,
): CameraRig {
  const state: CameraState = { ...initial };

  const targetCartesian = (): Cesium.Cartesian3 => {
    const lat = field.center.lat - state.z / METERS_PER_DEG_LAT;
    const lon =
      field.center.lon +
      state.x / (111320 * Math.max(0.2, Math.cos(field.center.lat * DEG)));
    return Cesium.Cartesian3.fromDegrees(lon, lat, state.height);
  };

  const apply = (): void => {
    const target = targetCartesian();
    const hpr = new Cesium.HeadingPitchRange(
      state.heading * DEG,
      state.pitch * DEG,
      Math.max(1, state.range),
    );
    viewer.camera.lookAt(target, hpr);
    viewer.scene.requestRender();
  };

  const getHud = (): CameraHud => {
    const carto = viewer.camera.positionCartographic;
    return {
      height: carto?.height ?? 0,
      range: state.range,
      heading: state.heading,
      pitch: state.pitch,
    };
  };

  const stateFromTarget = (x: number, z: number, height = 820): void => {
    state.x = x;
    state.z = z;
    state.height = height;
  };

  return {
    state,
    apply,
    targetCartesian,
    getHud,
    stateFromTarget,
    destroy: () => {
      // 相机引用由 Viewer 管理，无需额外释放。
    },
  };
}
