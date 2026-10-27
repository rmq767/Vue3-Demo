import * as Cesium from "cesium";
import * as THREE from "three";
import type { FieldData } from "../data/types";

export interface CameraSync {
  sync(threeCamera: THREE.PerspectiveCamera, cesiumCamera: Cesium.Camera): void;
  origin: Cesium.Cartesian3;
  destroy(): void;
}

/**
 * 将 Cesium 相机同步到 Three：
 * ENU（east, north, up）→ Three（x=east, y=up, z=-north）。
 * 用 right/up/direction 直接构造正交基，避免 lookAt 在俯视时 roll 翻转。
 */
export function createCameraSync(field: FieldData, width = 1920, height = 1080): CameraSync {
  const origin = Cesium.Cartesian3.fromDegrees(field.center.lon, field.center.lat, 0);
  const enuToFixed = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
  const inverseEnu = Cesium.Matrix4.inverseTransformation(enuToFixed, new Cesium.Matrix4());
  const inverseRot = Cesium.Matrix4.getMatrix3(inverseEnu, new Cesium.Matrix3());
  const aspect = width / height;

  const sync = (threeCamera: THREE.PerspectiveCamera, cesiumCamera: Cesium.Camera): void => {
    const p = Cesium.Matrix4.multiplyByPoint(
      inverseEnu,
      cesiumCamera.positionWC,
      new Cesium.Cartesian3(),
    );
    const r = Cesium.Matrix3.multiplyByVector(
      inverseRot,
      cesiumCamera.rightWC,
      new Cesium.Cartesian3(),
    );
    const u = Cesium.Matrix3.multiplyByVector(
      inverseRot,
      cesiumCamera.upWC,
      new Cesium.Cartesian3(),
    );
    const d = Cesium.Matrix3.multiplyByVector(
      inverseRot,
      cesiumCamera.directionWC,
      new Cesium.Cartesian3(),
    );

    threeCamera.position.set(p.x, p.z, -p.y);
    const basis = new THREE.Matrix4().makeBasis(
      new THREE.Vector3(r.x, r.z, -r.y),
      new THREE.Vector3(u.x, u.z, -u.y),
      new THREE.Vector3(-d.x, -d.z, d.y),
    );
    threeCamera.quaternion.setFromRotationMatrix(basis);

    const frustum = cesiumCamera.frustum as Cesium.PerspectiveFrustum;
    const fovy = frustum.fovy ?? Math.PI / 3;
    threeCamera.fov = Cesium.Math.toDegrees(fovy);
    threeCamera.aspect = aspect;
    threeCamera.near = 4;
    const cameraHeight = cesiumCamera.positionCartographic?.height ?? 4000;
    threeCamera.far = Math.min(200_000_000, Math.max(180_000, cameraHeight * 8));
    threeCamera.updateProjectionMatrix();
    threeCamera.updateMatrixWorld(true);
  };

  return {
    sync,
    origin,
    destroy: () => {
      // 纯计算对象，无资源需要释放。
    },
  };
}
