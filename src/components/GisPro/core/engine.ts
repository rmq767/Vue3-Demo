import * as THREE from "three";
import gsap from "gsap";
import type { GisProEngineApi, DebugInfo, QualityLevel } from "./api";
import type {
  Alarm,
  CameraHud,
  CameraState,
  FeatureDetail,
  FeatureKind,
  FieldData,
  HoverInfo,
  ImageryStatus,
  LayerKey,
  Stats,
} from "../data/types";
import { buildFeatureDetail, findPipeline, findStation, findWell } from "../data/chuanxi";
import { createSimulation } from "../data/simulation";
import { createTourScript } from "../data/tourScript";
import { createCesiumBase } from "./cesiumBase";
import { createThreeStage } from "./threeStage";
import { createCameraRig } from "./cameraRig";
import { createCameraSync } from "./cameraSync";
import { createOrbitController, type OrbitController } from "./orbit";
import { createPicker, type Picker, type PickResult } from "./picker";
import { createLabelSystem } from "./labels";
import { createTourController, type TourController } from "./tour";
import { createFacilities } from "../scene/facilities";
import { createPipelineSystem } from "../scene/pipeline";
import { createEffects, type EffectsSystem } from "../scene/effects";
import { createWellTrajectory, type WellTrajectoryView } from "../scene/wellTrajectory";
import { DEFAULT_THEME, getSceneTheme, type ThemeMode } from "../styles/tokens";

export interface EngineElements {
  stage: HTMLElement;
  cesium: HTMLElement;
  three: HTMLElement;
  labels: HTMLElement;
}

export interface EngineCallbacks {
  onReady?: () => void;
  onTick?: (stats: Stats, alarms: Alarm[]) => void;
  onSelect?: (detail: FeatureDetail | null) => void;
  onHover?: (hover: HoverInfo | null) => void;
  onTour?: (patch: {
    playing?: boolean;
    chapter?: number;
    canResume?: boolean;
  }) => void;
  onTourProgress?: (progress: number) => void;
  onCamera?: (hud: CameraHud) => void;
  onImagery?: (status: ImageryStatus) => void;
  onSceneMode?: (mode: "surface" | "trajectory") => void;
  onTourTrajectory?: (active: boolean) => void;
  onCaption?: (label: string, subtitle: string) => void;
  onLayer?: (key: LayerKey, visible: boolean) => void;
  onFps?: (fps: number) => void;
}

function kindOf(field: FieldData, id: string): FeatureKind | null {
  if (findWell(field, id)) return "well";
  if (findStation(field, id)) return "station";
  if (findPipeline(field, id)) return "pipeline";
  return null;
}

export function createEngine(
  field: FieldData,
  elements: EngineElements,
  callbacks: EngineCallbacks = {},
  initialTheme: ThemeMode = DEFAULT_THEME,
): GisProEngineApi {
  const query = new URLSearchParams(window.location.search);
  const exposeDebug = import.meta.env.DEV && query.get("debug") === "1";
  const requestedQuality = query.get("quality");
  const quality: QualityLevel =
    requestedQuality === "medium" || requestedQuality === "low" ? requestedQuality : "high";

  const script = createTourScript(field);
  const simulation = createSimulation(field);
  const cesiumBase = createCesiumBase({
    container: elements.cesium,
    field,
    theme: initialTheme,
    onImagery: (status) => callbacks.onImagery?.(status),
  });
  const stage = createThreeStage(elements.three, initialTheme);
  stage.setQuality(quality);
  const scenePalette = getSceneTheme(initialTheme);

  const fieldGroup = new THREE.Group();
  fieldGroup.name = "gis-field";
  stage.scene.add(fieldGroup);
  const groundHeight = (): number => 0;

  const facilities = createFacilities(field, stage.materials, groundHeight, scenePalette);
  fieldGroup.add(facilities.group);

  const pipelines = createPipelineSystem(field, stage.materials, groundHeight);
  fieldGroup.add(pipelines.group);

  const effects: EffectsSystem = createEffects(field, scenePalette, groundHeight, fieldGroup);

  let activateLabel:
    | ((id: string, kind: "well" | "station" | "pipeline" | "block") => void)
    | null = null;
  const labels = createLabelSystem(
    elements.labels,
    fieldGroup,
    field,
    stage.scene,
    (id, kind) => activateLabel?.(id, kind),
  );
  const wellTrajectory: WellTrajectoryView = createWellTrajectory(field, scenePalette);
  stage.scene.add(wellTrajectory.group);

  const cameraSync = createCameraSync(field);
  const rig = createCameraRig(cesiumBase.viewer, field, script.overview);

  let orbit: OrbitController | null = null;
  let picker: Picker | null = null;
  let tour: TourController | null = null;

  let selectedId: string | null = null;
  let selectedKind: FeatureKind | null = null;
  let trajectoryMode = false;
  let tourTrajectory = false;
  let labelsVisible = true;
  let lastWellPick = { id: "", time: 0 };
  let cameraTween: gsap.core.Tween | null = null;
  let cameraAnimating = false;
  let activeAlarmIds = new Set<string>();
  // 记录点选聚焦前的视角，取消聚焦时回到这里，避免相机继续绕旧目标旋转。
  let focusOrigin: CameraState | null = null;
  let started = false;
  let destroyed = false;
  let frameDt = 0.016;
  let elapsed = 0;
  let lastFrame = performance.now();
  let debugFps = 0;
  let fpsFrames = 0;
  let fpsWindowStart = performance.now();
  let lastCameraUpdate = 0;
  let lastProgressPoll = 0;

  const activeAlarmTargets = (): string[] =>
    simulation
      .getAlarms()
      .filter((alarm) => alarm.status !== "resolved")
      .map((alarm) => alarm.targetId);

  const refreshAlarms = (): void => {
    callbacks.onTick?.(simulation.getStats(), simulation.getAlarms());
    labels.setAlarms(activeAlarmTargets());
    if (selectedId) {
      const detail = buildFeatureDetail(field, selectedId);
      if (detail) callbacks.onSelect?.(detail);
    }
  };

  const applyLabels = (visible: boolean, notify = true): void => {
    labelsVisible = visible;
    if (!trajectoryMode) labels.setEnabled(visible);
    if (notify) callbacks.onLayer?.("labels", visible);
  };

  const animateCamera = (
    to: Partial<CameraState>,
    duration = 1,
    onDone?: () => void,
  ): void => {
    cameraTween?.kill();
    cameraAnimating = true;
    orbit?.setAutoRotate(false);
    cameraTween = gsap.to(rig.state, {
      ...to,
      duration,
      ease: "power2.inOut",
      overwrite: true,
      onComplete: () => {
        cameraTween = null;
        cameraAnimating = false;
        orbit?.sync();
        onDone?.();
      },
    });
  };

  const selectById = (id: string, focusCamera: boolean): void => {
    const detail = buildFeatureDetail(field, id);
    if (!detail) return;
    selectedId = id;
    selectedKind = detail.kind;
    callbacks.onSelect?.(detail);
    labels.setSelected(id);
    effects.setSelection(detail.kind, id);
    pipelines.setSelected(detail.kind === "pipeline" ? id : null);
    if (focusCamera) focusFeature(id);
  };

  const clearSelection = (): void => {
    if (trajectoryMode) closeWellTrajectory();
    const hadSelection = Boolean(selectedId);
    selectedId = null;
    selectedKind = null;
    callbacks.onSelect?.(null);
    labels.setSelected(null);
    effects.setSelection("well", null);
    pipelines.setSelected(null);
    if (!hadSelection) return;
    const origin = focusOrigin;
    focusOrigin = null;
    if (tour?.isPlaying()) return;
    if (origin) {
      animateCamera(origin, 0.9);
      return;
    }
    // 巡演 / 告警等入口留下的聚焦没有记录起点，退回标准全景。
    if (Math.hypot(rig.state.x, rig.state.z) > 24) {
      animateCamera(script.overview, 0.95);
    }
  };

  const focusBlock = (id: string): void => {
    const block = field.blocks.find((item) => item.id === id);
    if (!block) return;
    tour?.stop();
    focusOrigin = null;
    selectedId = null;
    selectedKind = null;
    callbacks.onSelect?.(null);
    labels.setSelected(null);
    effects.setSelection("well", null);
    pipelines.setSelected(null);
    animateCamera(
      {
        x: block.center.x,
        z: block.center.z,
        height: 0,
        heading: rig.state.heading,
        pitch: -32,
        range: Math.max(4200, block.radius * 2.8),
      },
      1.05,
    );
  };

  activateLabel = (id, kind) => {
    if (kind === "block") {
      focusBlock(id);
      return;
    }
    selectById(id, true);
  };

  const enterTourTrajectory = (wellId: string): void => {
    const well = findWell(field, wellId);
    if (!well) return;
    selectById(wellId, false);
    focusOrigin = null;
    tourTrajectory = true;
    trajectoryMode = true;
    fieldGroup.visible = false;
    labels.setEnabled(false);
    callbacks.onLayer?.("labels", false);
    cesiumBase.setMarkerVisible(false);
    cesiumBase.setUnderground(true);
    wellTrajectory.open(well);
    callbacks.onSceneMode?.("trajectory");
    callbacks.onTourTrajectory?.(true);
  };

  const exitTourTrajectory = (): void => {
    if (!tourTrajectory) return;
    tourTrajectory = false;
    trajectoryMode = false;
    wellTrajectory.close();
    fieldGroup.visible = true;
    cesiumBase.setUnderground(false);
    labels.setEnabled(labelsVisible);
    callbacks.onLayer?.("labels", labelsVisible);
    callbacks.onSceneMode?.("surface");
    callbacks.onTourTrajectory?.(false);
  };

  const closeWellTrajectory = (): void => {
    if (!trajectoryMode) return;
    if (tourTrajectory) {
      tourTrajectory = false;
      // 中止巡演回到全景时恢复场区标签；巡演章节本身的标签状态不再沿用。
      labelsVisible = true;
      callbacks.onTourTrajectory?.(false);
      tour?.stop();
      callbacks.onTour?.({ playing: false, chapter: -1, canResume: false });
      tour?.resetProgress();
    }
    trajectoryMode = false;
    focusOrigin = null;
    wellTrajectory.close();
    fieldGroup.visible = true;
    cesiumBase.setUnderground(false);
    labels.setEnabled(labelsVisible);
    callbacks.onLayer?.("labels", labelsVisible);
    callbacks.onSceneMode?.("surface");
    animateCamera(script.overview, 1.15);
  };

  const openWellTrajectory = (id: string): void => {
    const well = findWell(field, id);
    if (!well) return;
    selectById(id, false);
    focusOrigin = null;
    tourTrajectory = false;
    callbacks.onTourTrajectory?.(false);
    tour?.stop();
    trajectoryMode = true;
    fieldGroup.visible = false;
    labels.setEnabled(false);
    callbacks.onLayer?.("labels", false);
    cesiumBase.setMarkerVisible(false);
    cesiumBase.setUnderground(true);
    wellTrajectory.open(well);
    callbacks.onSceneMode?.("trajectory");
    const sectionDepth = Math.max(1600, Math.ceil((well.depth + 180) / 100) * 100);
    const sectionCenter = -sectionDepth / 2 + 500;
    animateCamera(
      {
        x: well.pos.x,
        z: well.pos.z,
        height: sectionCenter,
        heading: -14,
        pitch: -22,
        range: 15_000,
      },
      1.2,
    );
  };

  const focusFeature = (id: string): void => {
    const detail = buildFeatureDetail(field, id);
    if (!detail) return;
    const wasTrajectory = trajectoryMode;
    if (wasTrajectory) closeWellTrajectory();
    if (wasTrajectory) focusOrigin = { ...script.overview };
    else if (!focusOrigin) focusOrigin = { ...rig.state };
    tour?.stop();
    if (selectedId !== id) selectById(id, false);
    const target =
      detail.kind === "well"
        ? findWell(field, detail.wellId ?? id)
        : detail.kind === "station"
          ? findStation(field, detail.stationId ?? id)
          : findPipeline(field, detail.pipelineId ?? id);
    if (!target) return;
    const pos =
      detail.kind === "pipeline"
        ? (target as { path: { x: number; z: number }[] }).path[
            Math.floor((target as { path: { x: number; z: number }[] }).path.length / 2)
          ]
        : (target as { pos: { x: number; z: number } }).pos;
    animateCamera(
      {
        x: pos.x,
        z: pos.z,
        height: 0,
        heading: rig.state.heading,
        pitch: detail.kind === "well" ? -18 : detail.kind === "station" ? -25 : -25,
        range: detail.kind === "well" ? 340 : detail.kind === "station" ? 820 : 1100,
      },
      1.05,
    );
  };

  const handlePick = (result: PickResult | null): void => {
    if (!result) {
      lastWellPick = { id: "", time: 0 };
      clearSelection();
      return;
    }
    if (result.kind === "well") {
      const now = performance.now();
      if (lastWellPick.id === result.id && now - lastWellPick.time < 340) {
        lastWellPick = { id: "", time: 0 };
        openWellTrajectory(result.id);
      } else {
        lastWellPick = { id: result.id, time: now };
        selectById(result.id, true);
      }
      return;
    }
    lastWellPick = { id: "", time: 0 };
    selectById(result.id, true);
  };

  const handleHover = (result: { result: PickResult; x: number; y: number } | null): void => {
    if (!result) {
      callbacks.onHover?.(null);
      return;
    }
    const detail = buildFeatureDetail(field, result.result.id);
    if (!detail) {
      callbacks.onHover?.(null);
      return;
    }
    const firstMetric = detail.metrics[0];
    const meta = firstMetric
      ? `${firstMetric.label} ${firstMetric.value}${firstMetric.unit}`
      : detail.subtitle;
    callbacks.onHover?.({
      visible: true,
      x: result.x,
      y: result.y,
      name: detail.name,
      kindLabel:
        result.result.kind === "well" ? "井位" : result.result.kind === "station" ? "站库" : "管线",
      meta,
    });
  };

  const handleInteract = (): void => {
    if (destroyed) return;
    if (cameraTween) {
      cameraTween.kill();
      cameraTween = null;
    }
    cameraAnimating = false;
    if (tour?.isPlaying()) {
      tour.stop();
    }
    orbit?.setAutoRotate(false);
    orbit?.sync();
    callbacks.onHover?.(null);
  };

  picker = createPicker({
    stage: elements.stage,
    canvas: cesiumBase.viewer.scene.canvas,
    camera: stage.camera,
    getPickables: () => [...facilities.pickables, ...pipelines.pickables],
    onPick: handlePick,
    onHover: handleHover,
  });

  orbit = createOrbitController({
    canvas: cesiumBase.viewer.scene.canvas,
    state: rig.state,
    onTap: (x, y) => picker?.tap(x, y),
    onInteract: handleInteract,
  });

  tour = createTourController(rig, script, {
    onTour: (patch) => {
      callbacks.onTour?.(patch);
      // 暂停 / 结束巡演后立刻把轨道目标对到当前机位，并停掉自动环绕，
      // 否则暂停在地层柱上时镜头仍在缓慢转动，层间缝会持续闪。
      if (patch.playing === false) {
        orbit?.setAutoRotate(false);
        orbit?.sync();
      }
    },
    onCue: (cue, shot) => {
      callbacks.onCaption?.(shot.label, shot.subtitle ?? "");
      // 同一章节内切换镜头目标时，详情卡同步切换。
      if (shot.targetId) selectById(shot.targetId, false);
    },
    onChapterStart: (chapter) => {
      focusOrigin = null;
      if (chapter.trajectoryWellId) {
        enterTourTrajectory(chapter.trajectoryWellId);
      } else if (tourTrajectory) {
        exitTourTrajectory();
      }
      applyLabels(chapter.labels ?? true);
      const targetId = chapter.shots.find((shot) => shot.targetId)?.targetId;
      if (targetId) selectById(targetId, false);
      else if (chapter.id === "overview") clearSelection();
    },
    onComplete: () => {
      orbit?.sync();
      orbit?.setAutoRotate(true);
    },
  });

  const preRender = (): void => {
    if (destroyed) return;
    const now = performance.now();
    const dt = Math.min(0.06, Math.max(0.001, (now - lastFrame) / 1000));
    lastFrame = now;
    frameDt = dt;
    elapsed += dt;

    if (!cameraAnimating && !tour?.isPlaying()) {
      orbit?.update(dt);
    }
    rig.apply();

    const range = rig.state.range;
    fieldGroup.visible = !trajectoryMode && range < 200_000;
    cesiumBase.setMarkerVisible(!trajectoryMode && range > 26_000);

    if (now - lastCameraUpdate > 480) {
      lastCameraUpdate = now;
      callbacks.onCamera?.(rig.getHud());
    }

    if (now - lastProgressPoll > 100) {
      lastProgressPoll = now;
      callbacks.onTourProgress?.(tour?.getProgress() ?? 0);
    }
  };

  const postRender = (): void => {
    if (destroyed) return;
    cameraSync.sync(stage.camera, cesiumBase.viewer.camera);
    facilities.update(elapsed, frameDt);
    pipelines.update(elapsed);
    effects.update(elapsed);
    wellTrajectory.update(elapsed);

    stage.render();
    labels.update(stage.camera, rig.state.range);
    labels.render(stage.camera);

    fpsFrames += 1;
    const now = performance.now();
    const windowMs = now - fpsWindowStart;
    if (windowMs >= 1000) {
      debugFps = (fpsFrames * 1000) / windowMs;
      fpsFrames = 0;
      fpsWindowStart = now;
      callbacks.onFps?.(debugFps);
    }

    if (!started) {
      started = true;
      callbacks.onReady?.();
    }
  };

  const removePre = cesiumBase.viewer.scene.preRender.addEventListener(preRender);
  const removePost = cesiumBase.viewer.scene.postRender.addEventListener(postRender);

  const tickTimer = window.setInterval(() => {
    if (destroyed || document.hidden) return;
    const result = simulation.tick();
    const activeAlarms = result.alarms.filter((alarm) => alarm.status !== "resolved");
    const newAlarm = activeAlarms.find((alarm) => !activeAlarmIds.has(alarm.id));
    activeAlarmIds = new Set(activeAlarms.map((alarm) => alarm.id));
    if (newAlarm) effects.triggerAlarm(newAlarm.targetId);
    if (!activeAlarms.length) effects.clearAlarm();
    pipelines.refresh(field);
    labels.updateField(field);
    labels.setAlarms(activeAlarmTargets());
    callbacks.onTick?.(result.stats, result.alarms);
    if (selectedId) {
      const detail = buildFeatureDetail(field, selectedId);
      if (detail) callbacks.onSelect?.(detail);
    }
  }, 3000);

  let wasPlayingOnHide = false;
  const handleVisibility = (): void => {
    if (document.hidden) {
      wasPlayingOnHide = Boolean(tour?.isPlaying());
      if (wasPlayingOnHide) tour?.pause();
    } else if (wasPlayingOnHide) {
      wasPlayingOnHide = false;
      tour?.resume();
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);

  callbacks.onTick?.(simulation.getStats(), simulation.getAlarms());

  if (exposeDebug) {
    (window as unknown as { __af?: unknown }).__af = {
      stage,
      rig,
      orbit,
      tour,
      viewer: cesiumBase.viewer,
      picker,
      labels,
      wellTrajectory,
      focusFeature,
      clearSelection,
      handlePick,
      openWellTrajectory,
      closeWellTrajectory,
      ackAlarm: (id: string) => {
        simulation.ackAlarm(id);
        effects.clearAlarm();
        refreshAlarms();
      },
      handleInteract,
    };
  }

  return {
    focusFeature,
    clearSelection,
    setLayer: (key: LayerKey, visible: boolean) => {
      if (key === "wells") {
        facilities.wellGroup.visible = visible;
        labels.setKindEnabled("well", visible);
      } else if (key === "stations") {
        facilities.stationGroup.visible = visible;
        labels.setKindEnabled("station", visible);
      } else if (key === "pipelines") {
        pipelines.group.visible = visible;
        labels.setKindEnabled("pipeline", visible);
      } else if (key === "blocks") {
        facilities.blockGroup.visible = visible;
        labels.setKindEnabled("block", visible);
      } else if (key === "labels") {
        applyLabels(visible);
      }
    },
    setTheme: (theme: ThemeMode) => {
      const palette = getSceneTheme(theme);
      cesiumBase.applyTheme(theme);
      stage.applyTheme(theme);
      facilities.applyTheme(palette);
      pipelines.applyTheme(palette);
      effects.applyTheme(palette);
      wellTrajectory.applyTheme(palette);
    },
    openWellTrajectory,
    closeWellTrajectory,
    playTour: () => {
      if (trajectoryMode && !tourTrajectory) closeWellTrajectory();
      focusOrigin = null;
      tour?.play();
    },
    pauseTour: () => {
      tour?.pause();
      orbit?.setAutoRotate(false);
    },
    resumeTour: () => {
      if (trajectoryMode && !tourTrajectory) closeWellTrajectory();
      focusOrigin = null;
      tour?.resume();
    },
    nextChapter: () => {
      if (trajectoryMode && !tourTrajectory) closeWellTrajectory();
      focusOrigin = null;
      tour?.next();
    },
    goToChapter: (index: number) => {
      if (trajectoryMode && !tourTrajectory) closeWellTrajectory();
      focusOrigin = null;
      tour?.goTo(index);
    },
    resetView: () => {
      if (trajectoryMode) closeWellTrajectory();
      focusOrigin = null;
      animateCamera(script.overview, 1.15);
    },
    ackAlarm: (id: string) => {
      simulation.ackAlarm(id);
      effects.clearAlarm();
      refreshAlarms();
    },
    setQuality: (next: QualityLevel) => {
      stage.setQuality(next);
    },
    getCameraHud: () => rig.getHud(),
    getDebugInfo: (): DebugInfo => ({
      fps: Math.round(debugFps),
      drawCalls: stage.renderer.info.render.calls,
      triangles: stage.renderer.info.render.triangles,
      quality: stage.quality,
      labels: labels.getVisibleCount(),
    }),
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      window.clearInterval(tickTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      removePre();
      removePost();
      cameraTween?.kill();
      cameraTween = null;
      tour?.destroy();
      orbit?.destroy();
      picker?.destroy();
      labels.dispose();
      wellTrajectory.dispose();
      effects.dispose();
      pipelines.dispose();
      facilities.dispose();
      cameraSync.destroy();
      stage.dispose();
      cesiumBase.destroy();
    },
  };
}
