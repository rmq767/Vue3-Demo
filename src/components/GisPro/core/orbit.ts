import type { CameraState } from "../data/types";

interface OrbitOptions {
  canvas: HTMLCanvasElement;
  state: CameraState;
  onTap: (clientX: number, clientY: number) => void;
  onInteract: () => void;
}

export interface OrbitController {
  update(dt: number): void;
  sync(): void;
  setPitchRange(min: number, max: number): void;
  setAutoRotate(active: boolean): void;
  isAutoRotating(): boolean;
  destroy(): void;
}

const DEFAULT_MIN_PITCH = -85;
const DEFAULT_MAX_PITCH = -14;
const MIN_RANGE = 180;
const MAX_RANGE = 90_000;
const TARGET_RADIUS = 40_000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 自定义 Cesium 轨道控制。
 * 不依赖 Three OrbitControls，也不再让 Cesium 默认地球控制接管局部沙盘。
 */
export function createOrbitController(options: OrbitOptions): OrbitController {
  const { canvas, state, onTap, onInteract } = options;
  const desired: CameraState = { ...state };
  const pointers = new Map<number, { x: number; y: number }>();
  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;
  let pinchDistance = 0;
  let multiTouch = false;
  let autoRotate = false;
  let minPitch = DEFAULT_MIN_PITCH;
  let maxPitch = DEFAULT_MAX_PITCH;
  // 左键平移、右键或 Ctrl+左键旋转：像地图一样先把视野挪到目标区域，再决定看角度。
  let gesture: "none" | "orbit" | "pan" = "none";
  let tapCandidate = false;

  const clampState = (value: CameraState): void => {
    value.pitch = clamp(value.pitch, minPitch, maxPitch);
    value.range = clamp(value.range, MIN_RANGE, MAX_RANGE);
    const radius = Math.hypot(value.x, value.z);
    if (radius > TARGET_RADIUS) {
      value.x = (value.x / radius) * TARGET_RADIUS;
      value.z = (value.z / radius) * TARGET_RADIUS;
    }
  };

  const syncDesired = (): void => {
    desired.x = state.x;
    desired.z = state.z;
    desired.height = state.height;
    desired.heading = state.heading;
    desired.pitch = state.pitch;
    desired.range = state.range;
    clampState(desired);
  };

  const pointerDistance = (): number => {
    const list = [...pointers.values()];
    if (list.length < 2) return 0;
    return Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y);
  };

  const handlePointerDown = (event: PointerEvent): void => {
    onInteract();
    syncDesired();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    multiTouch = pointers.size > 1;
    if (pointers.size === 1) {
      dragging = true;
      moved = 0;
      lastX = event.clientX;
      lastY = event.clientY;
      tapCandidate = event.button === 0;
      gesture =
        event.button === 2 || event.button === 1 || event.ctrlKey || event.metaKey
          ? "orbit"
          : "pan";
      try {
        canvas.setPointerCapture?.(event.pointerId);
      } catch {
        // 指针可能在捕获前已释放。
      }
    } else {
      dragging = false;
      tapCandidate = false;
      gesture = "none";
      pinchDistance = pointerDistance();
    }
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2) {
      multiTouch = true;
      const distance = pointerDistance();
      if (pinchDistance > 0 && distance > 0) {
        desired.range = clamp(desired.range * (pinchDistance / distance), MIN_RANGE, MAX_RANGE);
        pinchDistance = distance;
      }
      moved = 100;
      return;
    }

    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (moved < 1) return;

    if (gesture === "pan") {
      const scale = (desired.range * 1.1) / Math.max(320, canvas.clientHeight || 1080);
      const vertical = scale / Math.max(0.35, Math.sin(Math.abs(desired.pitch) * (Math.PI / 180)));
      const rad = desired.heading * (Math.PI / 180);
      const rightX = Math.cos(rad);
      const rightZ = Math.sin(rad);
      const forwardX = Math.sin(rad);
      const forwardZ = -Math.cos(rad);
      desired.x += -dx * scale * rightX + dy * vertical * forwardX;
      desired.z += -dx * scale * rightZ + dy * vertical * forwardZ;
      clampState(desired);
    } else {
      desired.heading += dx * 0.18;
      desired.pitch = clamp(desired.pitch - dy * 0.13, minPitch, maxPitch);
    }
    autoRotate = false;
  };

  const handlePointerUp = (event: PointerEvent): void => {
    const wasSingle = pointers.size === 1;
    const wasTap = wasSingle && dragging && moved < 5 && !multiTouch && tapCandidate;
    pointers.delete(event.pointerId);
    try {
      canvas.releasePointerCapture?.(event.pointerId);
    } catch {
      // 指针捕获已自动释放。
    }

    if (wasTap) {
      onTap(event.clientX, event.clientY);
    }

    if (pointers.size === 1) {
      const remaining = [...pointers.values()][0];
      lastX = remaining.x;
      lastY = remaining.y;
      dragging = true;
      moved = 100;
      pinchDistance = 0;
      gesture = "pan";
    } else if (pointers.size === 0) {
      dragging = false;
      pinchDistance = 0;
      multiTouch = false;
      gesture = "none";
      tapCandidate = false;
    }
  };

  const handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    onInteract();
    syncDesired();
    desired.range = clamp(desired.range * Math.exp(event.deltaY * 0.0011), MIN_RANGE, MAX_RANGE);
    autoRotate = false;
  };

  const handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  canvas.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);
  canvas.addEventListener("wheel", handleWheel, { passive: false });
  canvas.addEventListener("contextmenu", handleContextMenu);

  const update = (dt: number): void => {
    if (autoRotate && !dragging && pointers.size === 0) {
      desired.heading += 2.2 * dt;
    }

    const k = 1 - Math.exp(-9 * Math.min(dt, 0.08));
    state.heading += (desired.heading - state.heading) * k;
    state.pitch += (desired.pitch - state.pitch) * k;
    state.x += (desired.x - state.x) * k;
    state.z += (desired.z - state.z) * k;
    state.height += (desired.height - state.height) * k;
    const currentLog = Math.log(Math.max(1, state.range));
    const desiredLog = Math.log(Math.max(1, desired.range));
    state.range = Math.exp(currentLog + (desiredLog - currentLog) * k);
    clampState(state);

    if (Math.abs(desired.heading - state.heading) < 0.0001) state.heading = desired.heading;
    if (Math.abs(desired.range - state.range) / Math.max(1, desired.range) < 0.0002) {
      state.range = desired.range;
    }
  };

  return {
    update,
    sync: syncDesired,
    setPitchRange: (min: number, max: number) => {
      minPitch = Math.min(min, max);
      maxPitch = Math.max(min, max);
      desired.pitch = clamp(desired.pitch, minPitch, maxPitch);
    },
    setAutoRotate: (active: boolean) => {
      autoRotate = active;
    },
    isAutoRotating: () => autoRotate,
    destroy: () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("contextmenu", handleContextMenu);
      pointers.clear();
    },
  };
}
