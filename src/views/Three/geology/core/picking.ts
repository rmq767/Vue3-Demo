import * as THREE from "three";

export interface PickResult {
  object: THREE.Object3D;
  /** InstancedMesh 命中时为实例下标，其余为 null */
  instanceId: number | null;
  /** 世界坐标命中点 */
  point: THREE.Vector3;
  distance: number;
}

/** three 的 Raycaster 不检查 visible，图层关掉后仍会被命中，需要自己过滤祖先链 */
function isVisibleChain(object: THREE.Object3D): boolean {
  let node: THREE.Object3D | null = object;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
}

/**
 * 射线拾取器。NDC 必须按 canvas 自身矩形换算，用 window 尺寸会在侧栏变化时打偏。
 */
export function createPicker(dom: HTMLElement, camera: THREE.Camera) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  return {
    pick(
      clientX: number,
      clientY: number,
      targets: THREE.Object3D[],
      /** Raycaster 不认识裁剪面，被切掉的部分照样能命中，用这个回调剔除 */
      accept?: (point: THREE.Vector3) => boolean
    ): PickResult | null {
      const rect = dom.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      ndc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(targets, true);
      for (const hit of hits) {
        if (!isVisibleChain(hit.object)) continue;
        if (accept && !accept(hit.point)) continue;
        return {
          object: hit.object,
          instanceId: hit.instanceId ?? null,
          point: hit.point.clone(),
          distance: hit.distance,
        };
      }
      return null;
    },
  };
}
