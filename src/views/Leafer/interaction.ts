import {
  DragEvent as LeaferDragEvent,
  PointerEvent as LeaferPointerEvent,
} from "leafer-ui";
import type { Leafer } from "leafer-ui";
import { isEdgeActive } from "./data";
import {
  applyFlowStyles,
  renderConnectedEdges,
  renderEdge,
  renderNode,
  renderSelection,
} from "./scene";
import type { CameraController } from "./camera";
import type { Field, SceneHandles, Selection } from "./types";

interface InteractionOptions {
  leafer: Leafer;
  field: Field;
  scene: SceneHandles;
  camera: CameraController;
  onSelect: (selection: Selection) => void;
  onCursor: (x: number, y: number) => void;
  onSpace: (held: boolean) => void;
}

export interface InteractionApi {
  destroy(): void;
  selectNode(id: string, focus?: boolean): void;
  selectEdge(id: string): void;
  clearSelection(): void;
  syncNode(id: string): void;
  syncAll(): void;
  setFlowPaused(paused: boolean): void;
}

interface PressableLeaf {
  data?: { nodeId?: string; edgeId?: string };
  parent?: PressableLeaf;
}

const SNAP = 8;

export function createInteraction(
  options: InteractionOptions
): InteractionApi {
  const { leafer, field, scene, camera } = options;
  const view = leafer.view as HTMLElement;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let selection: Selection = null;
  let panning: { x: number; y: number } | null = null;
  let spaceHeld = false;
  let flowPaused = reducedMotion;
  let dashOffset = 0;
  let lastTick = 0;
  let frame = 0;
  let destroyed = false;

  const setSelection = (next: Selection): void => {
    selection = next;
    renderSelection(scene, field, next);
    options.onSelect(next);
  };

  const findPayload = (target: unknown): { nodeId?: string; edgeId?: string } => {
    let leaf = target as PressableLeaf | undefined;
    let guard = 0;
    while (leaf && guard < 12) {
      if (leaf.data?.nodeId || leaf.data?.edgeId) return leaf.data;
      leaf = leaf.parent;
      guard += 1;
    }
    return {};
  };

  const setNodeDragging = (enabled: boolean): void => {
    scene.nodes.forEach((nodeView) => {
      nodeView.group.set({ draggable: enabled });
    });
  };

  const startPan = (event: LeaferPointerEvent): void => {
    panning = { x: event.x, y: event.y };
    view.classList.add("is-dragging");
  };

  const endPan = (): void => {
    panning = null;
    view.classList.remove("is-dragging");
  };

  const onPointerDown = (event: LeaferPointerEvent): void => {
    if (spaceHeld || event.middle) {
      startPan(event);
      return;
    }

    const payload = findPayload(event.target);
    if (payload.nodeId) {
      setSelection({ type: "node", id: payload.nodeId });
      return;
    }
    if (payload.edgeId) {
      setSelection({ type: "edge", id: payload.edgeId });
      return;
    }

    setSelection(null);
    startPan(event);
  };

  const onPointerMove = (event: LeaferPointerEvent): void => {
    if (panning) {
      camera.panBy(event.x - panning.x, event.y - panning.y);
      panning = { x: event.x, y: event.y };
    }
    const world = camera.toWorld(event.x, event.y);
    options.onCursor(
      Math.round(world.x),
      Math.round(world.y)
    );
  };

  const onPointerUp = (): void => {
    endPan();
  };

  const onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const rect = view.getBoundingClientRect();
    const factor = Math.exp(-event.deltaY * 0.0014);
    camera.zoomAt(
      event.clientX - rect.left,
      event.clientY - rect.top,
      factor
    );
  };

  const isTyping = (target: EventTarget | null): boolean => {
    const element = target as HTMLElement | null;
    if (!element) return false;
    const tag = element.tagName;
    return (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      element.isContentEditable
    );
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (isTyping(event.target)) return;

    if (event.code === "Space") {
      event.preventDefault();
      if (!spaceHeld) {
        spaceHeld = true;
        setNodeDragging(false);
        options.onSpace(true);
        view.classList.add("is-pan-ready");
      }
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "f") {
      camera.fitAnimated();
    } else if (key === "+" || key === "=") {
      camera.zoomBy(1.2);
    } else if (key === "-" || key === "_") {
      camera.zoomBy(1 / 1.2);
    } else if (key === "escape") {
      setSelection(null);
    }
  };

  const releaseSpace = (): void => {
    if (!spaceHeld) return;
    spaceHeld = false;
    setNodeDragging(true);
    options.onSpace(false);
    view.classList.remove("is-pan-ready");
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    if (event.code === "Space") releaseSpace();
  };

  const onWindowBlur = (): void => {
    releaseSpace();
    endPan();
  };

  const syncNodeGeometry = (id: string, snap: boolean): void => {
    const nodeView = scene.nodes.get(id);
    const node = field.nodes.find((item) => item.id === id);
    if (!nodeView || !node) return;

    let centerX = Number(nodeView.group.x) + nodeView.groupWidth / 2;
    let centerY = Number(nodeView.group.y) + node.height / 2;

    if (snap) {
      centerX = Math.round(centerX / SNAP) * SNAP;
      centerY = Math.round(centerY / SNAP) * SNAP;
      nodeView.group.set({
        x: centerX - nodeView.groupWidth / 2,
        y: centerY - node.height / 2,
      });
    }

    node.x = centerX;
    node.y = centerY;

    renderConnectedEdges(scene, field, id);

    if (selection?.type === "node" && selection.id === id) {
      renderSelection(scene, field, selection);
    } else if (selection?.type === "edge") {
      const selectedEdge = field.edges.find(
        (edge) => edge.id === selection?.id
      );
      if (selectedEdge && (selectedEdge.from === id || selectedEdge.to === id)) {
        renderSelection(scene, field, selection);
      }
    }
  };

  scene.nodes.forEach((nodeView, id) => {
    nodeView.group.on(LeaferDragEvent.DRAG, () => {
      syncNodeGeometry(id, false);
    });
    nodeView.group.on(LeaferDragEvent.END, () => {
      syncNodeGeometry(id, true);
    });
  });

  const tick = (now: number): void => {
    frame = requestAnimationFrame(tick);
    if (flowPaused || document.hidden) {
      lastTick = now;
      return;
    }

    const delta = lastTick ? Math.min(now - lastTick, 64) : 16;
    lastTick = now;
    dashOffset -= delta * 0.035;

    field.edges.forEach((edge) => {
      if (!isEdgeActive(edge, field)) return;
      const edgeView = scene.edges.get(edge.id);
      if (edgeView) edgeView.line.dashOffset = dashOffset;
    });
  };

  leafer.on(LeaferPointerEvent.DOWN, onPointerDown);
  leafer.on(LeaferPointerEvent.MOVE, onPointerMove);
  leafer.on(LeaferPointerEvent.UP, onPointerUp);
  view.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onWindowBlur);
  window.addEventListener("pointerup", onPointerUp);
  frame = requestAnimationFrame(tick);

  return {
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(frame);
      leafer.off(LeaferPointerEvent.DOWN, onPointerDown);
      leafer.off(LeaferPointerEvent.MOVE, onPointerMove);
      leafer.off(LeaferPointerEvent.UP, onPointerUp);
      view.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("pointerup", onPointerUp);
    },
    selectNode(id: string, focus = false): void {
      const node = field.nodes.find((item) => item.id === id);
      if (!node) return;
      setSelection({ type: "node", id });
      if (focus) camera.focusNode(node);
    },
    selectEdge(id: string): void {
      const edge = field.edges.find((item) => item.id === id);
      if (!edge) return;
      setSelection({ type: "edge", id });
    },
    clearSelection(): void {
      setSelection(null);
    },
    syncNode(id: string): void {
      const node = field.nodes.find((item) => item.id === id);
      if (!node) return;
      renderNode(scene, node);
      renderConnectedEdges(scene, field, id);
      applyFlowStyles(scene, field);
      if (selection?.type === "node" && selection.id === id) {
        renderSelection(scene, field, selection);
      }
    },
    syncAll(): void {
      field.nodes.forEach((node) => {
        const nodeView = scene.nodes.get(node.id);
        if (nodeView) {
          nodeView.group.set({
            x: node.x - nodeView.groupWidth / 2,
            y: node.y - node.height / 2,
          });
        }
        renderNode(scene, node);
      });
      field.edges.forEach((edge) => renderEdge(scene, edge, field));
      applyFlowStyles(scene, field);
      renderSelection(scene, field, selection);
    },
    setFlowPaused(paused: boolean): void {
      flowPaused = paused;
      lastTick = 0;
    },
  };
}
