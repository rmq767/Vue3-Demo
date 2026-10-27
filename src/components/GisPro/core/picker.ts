import * as THREE from "three";
import type { FeatureKind } from "../data/types";

export interface PickResult {
  id: string;
  kind: FeatureKind;
}

export interface HoverResult {
  result: PickResult;
  x: number;
  y: number;
}

interface PickerOptions {
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  getPickables: () => THREE.Object3D[];
  onPick: (result: PickResult | null) => void;
  onHover: (result: HoverResult | null) => void;
}

export interface Picker {
  pick(clientX: number, clientY: number): PickResult | null;
  tap(clientX: number, clientY: number): void;
  destroy(): void;
}

const WIDTH = 1920;
const HEIGHT = 1080;

function toStage(stage: HTMLElement, clientX: number, clientY: number): { x: number; y: number } | null {
  const rect = stage.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const x = ((clientX - rect.left) / rect.width) * WIDTH;
  const y = ((clientY - rect.top) / rect.height) * HEIGHT;
  if (x < 0 || y < 0 || x > WIDTH || y > HEIGHT) return null;
  return { x, y };
}

export function createPicker(options: PickerOptions): Picker {
  const { stage, canvas, camera, getPickables, onPick, onHover } = options;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let lastHover = 0;

  const pick = (clientX: number, clientY: number): PickResult | null => {
    const point = toStage(stage, clientX, clientY);
    if (!point) return null;
    ndc.set((point.x / WIDTH) * 2 - 1, -(point.y / HEIGHT) * 2 + 1);
    camera.layers.set(0);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(getPickables(), true);
    const hit = hits[0];
    if (!hit) return null;
    const ids = hit.object.userData.ids as string[] | undefined;
    const kind = hit.object.userData.kind as FeatureKind | undefined;
    if (ids && hit.instanceId != null && kind) {
      const id = ids[hit.instanceId];
      return id ? { id, kind } : null;
    }
    const id = hit.object.userData.id as string | undefined;
    const objectKind = hit.object.userData.kind as FeatureKind | undefined;
    return id && objectKind ? { id, kind: objectKind } : null;
  };

  const handleTap = (clientX: number, clientY: number): void => {
    onPick(pick(clientX, clientY));
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (event.buttons !== 0) {
      onHover(null);
      return;
    }
    const now = performance.now();
    if (now - lastHover < 48) return;
    lastHover = now;
    const hit = pick(event.clientX, event.clientY);
    const point = toStage(stage, event.clientX, event.clientY);
    if (hit && point) {
      onHover({ result: hit, x: point.x, y: point.y });
      canvas.style.cursor = "pointer";
    } else {
      onHover(null);
      canvas.style.cursor = "default";
    }
  };

  const handlePointerLeave = (): void => {
    onHover(null);
    canvas.style.cursor = "default";
  };

  canvas.addEventListener("pointermove", handlePointerMove, { passive: true });
  canvas.addEventListener("pointerleave", handlePointerLeave, { passive: true });

  return {
    pick,
    tap: handleTap,
    destroy: () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
    },
  };
}
