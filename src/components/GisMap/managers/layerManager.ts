import * as Cesium from "cesium";
import type { Block, FieldData, GisFeature, LonLat, Pipeline, Platform, Well } from "../data/types";
import { findFeature } from "../data/field";
import type { GisViewerContext } from "../core/viewer";
import { cartesianFromLonLat, cartesiansFromLonLat, closeRing, rectangleOfLonLat } from "../core/geo";
import { pulseRingIcon } from "../core/icons";
import {
  HEX,
  createBlockEntity,
  createFlowParticles,
  createPipelineEntity,
  createPlatformEntity,
  createSelectionEntity,
  createTrajectoryEntities,
  createWellEntity,
  updateBlockEntity,
  updatePipelineEntity,
  updatePlatformEntity,
  updateWellEntity,
} from "./entities";

export type LayerKey = "block" | "well" | "platform" | "pipeline" | "trajectory";

export interface LayerManager {
  setVisible: (key: LayerKey, visible: boolean) => void;
  setLabels: (visible: boolean) => void;
  setEffects: (enabled: boolean) => void;
  setMode: (is2D: boolean) => void;
  pulseWells: (ids: string[]) => void;
  select: (id: string | null) => void;
  syncFeature: (id: string) => void;
  syncAll: () => void;
  pick: (position: Cesium.Cartesian2) => string | null;
  flyTo: (id: string) => void;
  flyToWellUnderground: (id: string) => void;
  flyHome: () => void;
  destroy: () => void;
}

function degrees(value: number): number {
  return Cesium.Math.toRadians(value);
}

export function createLayerManager(
  context: GisViewerContext,
  field: FieldData,
): LayerManager {
  const viewer = context.viewer;
  const scene = viewer.scene;

  const blockDs = new Cesium.CustomDataSource("gis-block");
  const wellDs = new Cesium.CustomDataSource("gis-well");
  const platformDs = new Cesium.CustomDataSource("gis-platform");
  const pipelineDs = new Cesium.CustomDataSource("gis-pipeline");
  const trajectoryDs = new Cesium.CustomDataSource("gis-trajectory");
  const flowDs = new Cesium.CustomDataSource("gis-flow");
  const pulseDs = new Cesium.CustomDataSource("gis-pulse");
  const selectionDs = new Cesium.CustomDataSource("gis-selection");
  const dataSources = [
    blockDs,
    wellDs,
    platformDs,
    pipelineDs,
    trajectoryDs,
    flowDs,
    pulseDs,
    selectionDs,
  ];
  dataSources.forEach((dataSource) => {
    viewer.dataSources.add(dataSource);
  });

  const featureById = new Map<string, GisFeature>();
  [...field.blocks, ...field.wells, ...field.platforms, ...field.pipelines].forEach(
    (feature) => featureById.set(feature.id, feature),
  );

  const entityMap = new Map<string, Cesium.Entity>();
  const selectionBeams = new Set<Cesium.Entity>();
  const pulseTimers = new Set<number>();
  const homePoints: LonLat[] = [];
  field.blocks.forEach((block) => homePoints.push(...block.boundary));
  field.wells.forEach((well) => homePoints.push(well.position));
  field.platforms.forEach((platform) => homePoints.push(platform.position));
  field.pipelines.forEach((pipeline) => homePoints.push(...pipeline.path));

  let labelsVisible = true;
  let effectsEnabled = true;
  let trajectoryVisible = false;
  let is2D = false;
  let destroyed = false;
  let rafId = 0;
  let lastFrame = 0;

  const requestRender = () => {
    if (!destroyed) scene.requestRender();
  };

  const platformHasAlarm = (platform: Platform) =>
    field.wells.some((well) => well.platformId === platform.id && well.status === "warning");

  const addBaseEntity = (
    dataSource: Cesium.CustomDataSource,
    entity: Cesium.Entity,
    id: string,
  ) => {
    dataSource.entities.add(entity);
    entityMap.set(id, entity);
  };

  field.blocks.forEach((block) => {
    addBaseEntity(blockDs, createBlockEntity(block, labelsVisible), block.id);
  });
  field.wells.forEach((well) => {
    addBaseEntity(wellDs, createWellEntity(well, labelsVisible), well.id);
    createTrajectoryEntities(well).forEach((entity) => trajectoryDs.entities.add(entity));
  });
  field.platforms.forEach((platform) => {
    addBaseEntity(
      platformDs,
      createPlatformEntity(platform, platformHasAlarm(platform), labelsVisible),
      platform.id,
    );
  });
  field.pipelines.forEach((pipeline) => {
    addBaseEntity(pipelineDs, createPipelineEntity(pipeline, labelsVisible), pipeline.id);
    createFlowParticles(pipeline).forEach((entity) => flowDs.entities.add(entity));
  });

  trajectoryDs.show = false;
  flowDs.show = effectsEnabled;
  pulseDs.show = effectsEnabled;

  const startLoop = () => {
    if (rafId || destroyed) return;
    const tick = (timestamp: number) => {
      if (destroyed) return;
      rafId = requestAnimationFrame(tick);
      if (timestamp - lastFrame < 33) return;
      lastFrame = timestamp;
      scene.requestRender();
    };
    rafId = requestAnimationFrame(tick);
  };

  const stopLoop = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  };

  const syncInternal = (feature: GisFeature) => {
    const entity = entityMap.get(feature.id);
    if (!entity) return;
    if (feature.kind === "well") updateWellEntity(entity, feature);
    else if (feature.kind === "block") updateBlockEntity(entity, feature);
    else if (feature.kind === "platform") {
      updatePlatformEntity(entity, feature, platformHasAlarm(feature));
    } else {
      updatePipelineEntity(entity, feature);
    }
  };

  const setVisible = (key: LayerKey, visible: boolean) => {
    const map: Record<LayerKey, Cesium.CustomDataSource> = {
      block: blockDs,
      well: wellDs,
      platform: platformDs,
      pipeline: pipelineDs,
      trajectory: trajectoryDs,
    };
    if (key === "trajectory") {
      trajectoryVisible = visible;
      trajectoryDs.show = visible && !is2D;
      context.setUnderground(visible && !is2D);
    } else {
      map[key].show = visible;
    }
    requestRender();
  };

  const setLabels = (visible: boolean) => {
    labelsVisible = visible;
    entityMap.forEach((entity) => {
      if (entity.label) entity.label.show = new Cesium.ConstantProperty(visible);
    });
    requestRender();
  };

  const setEffects = (enabled: boolean) => {
    effectsEnabled = enabled;
    flowDs.show = enabled;
    pulseDs.show = enabled;
    if (!enabled) {
      pulseDs.entities.removeAll();
      pulseTimers.forEach((timer) => window.clearTimeout(timer));
      pulseTimers.clear();
    }
    if (enabled) startLoop();
    else stopLoop();
    requestRender();
  };

  const setMode = (twoD: boolean) => {
    is2D = twoD;
    blockDs.entities.values.forEach((entity) => {
      if (entity.wall) entity.wall.show = new Cesium.ConstantProperty(!twoD);
    });
    platformDs.entities.values.forEach((entity) => {
      if (entity.cylinder) entity.cylinder.show = new Cesium.ConstantProperty(!twoD);
    });
    pipelineDs.entities.values.forEach((entity) => {
      if (entity.polylineVolume) {
        entity.polylineVolume.show = new Cesium.ConstantProperty(!twoD);
      }
    });
    trajectoryDs.show = trajectoryVisible && !twoD;
    selectionBeams.forEach((entity) => {
      if (entity.polyline) entity.polyline.show = new Cesium.ConstantProperty(!twoD);
    });
    context.setUnderground(trajectoryVisible && !twoD);
    requestRender();
  };

  const select = (id: string | null) => {
    selectionDs.entities.removeAll();
    selectionBeams.clear();
    if (!id) {
      requestRender();
      return;
    }
    const feature = featureById.get(id);
    if (!feature) {
      requestRender();
      return;
    }
    let selection: Cesium.Entity | undefined;
    if (feature.kind === "well") {
      selection = createSelectionEntity(id, { kind: "well", well: feature });
    } else if (feature.kind === "block") {
      selection = createSelectionEntity(id, { kind: "block", block: feature });
    } else if (feature.kind === "platform") {
      selection = createSelectionEntity(id, { kind: "platform", platform: feature });
    } else {
      selection = createSelectionEntity(id, { kind: "pipeline", pipeline: feature });
    }
    if (selection) {
      selectionDs.entities.add(selection);
      if (selection.ellipse && selection.polyline) {
        selectionBeams.add(selection);
        if (is2D) selection.polyline.show = new Cesium.ConstantProperty(false);
      }
    }
    requestRender();
  };

  const pulseWells = (ids: string[]) => {
    if (destroyed || !effectsEnabled || !wellDs.show) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const now = performance.now();
    const ringImage = pulseRingIcon();
    const targets = Array.from(new Set(ids))
      .map((id) => field.wells.find((well) => well.id === id))
      .filter((well): well is Well => Boolean(well))
      .slice(0, 3);
    const rippleDuration = 1800;
    const rippleSegments = 72;

    const addPulseEntity = (entity: Cesium.Entity, lifetime: number) => {
      pulseDs.entities.add(entity);
      const timer = window.setTimeout(() => {
        pulseTimers.delete(timer);
        if (destroyed) return;
        pulseDs.entities.remove(entity);
        requestRender();
      }, lifetime);
      pulseTimers.add(timer);
    };

    targets.forEach((well, index) => {
      const hex =
        well.status === "warning"
          ? HEX.amber
          : well.status === "offline"
            ? HEX.grey
            : HEX.cyan;
      const baseColor = Cesium.Color.fromCssColorString(hex);
      const start = now + index * 90;
      const latScale = 111320 * Math.cos(Cesium.Math.toRadians(well.position.lat));

      [0, 420].forEach((offset, ring) => {
        const ringStart = start + offset;
        const progress = () =>
          Math.min(Math.max((performance.now() - ringStart) / rippleDuration, 0), 1);

        // 地面扩散波纹：单点触发的“数据刷新”信号，3D / 2D 均可见。
        const ripple = new Cesium.Entity({
          id: `pulse:${well.id}:${now}:${ring}:ripple`,
          polyline: {
            positions: new Cesium.CallbackProperty(() => {
              const p = progress();
              const radius = 90 + p ** 0.82 * 1500;
              const points: Cesium.Cartesian3[] = [];
              for (let i = 0; i <= rippleSegments; i += 1) {
                const angle = (i / rippleSegments) * Math.PI * 2;
                points.push(
                  cartesianFromLonLat(
                    {
                      lon: well.position.lon + (radius * Math.sin(angle)) / latScale,
                      lat: well.position.lat + (radius * Math.cos(angle)) / 110540,
                    },
                    8,
                  ),
                );
              }
              return points;
            }, false),
            width: 2.6,
            arcType: Cesium.ArcType.NONE,
            material: new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(
                () => baseColor.withAlpha((1 - progress()) ** 1.4 * 0.95),
                false,
              ),
            ),
          },
        });
        addPulseEntity(ripple, rippleDuration + offset + index * 90 + 120);

        // 井口光环：短促爆闪，弥补远视角下地面波纹过小的问题。
        const halo = new Cesium.Entity({
          id: `pulse:${well.id}:${now}:${ring}:halo`,
          position: cartesianFromLonLat(well.position, 12),
          billboard: {
            image: ringImage,
            scale: new Cesium.CallbackProperty(() => 0.3 + progress() * 0.62, false),
            color: new Cesium.CallbackProperty(
              () => baseColor.withAlpha((1 - progress()) ** 0.9),
              false,
            ),
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
        addPulseEntity(halo, rippleDuration + offset + index * 90 + 120);
      });
    });
    requestRender();
  };

  const pick = (position: Cesium.Cartesian2): string | null => {
    if (destroyed) return null;
    const picked = scene.drillPick(position, 8, 8, 8) ?? [];
    let best: { id: string; priority: number } | null = null;

    for (const item of picked) {
      const target = item.id;
      if (!(target instanceof Cesium.Entity)) continue;
      const entityId = target.id;
      let id: string | null = null;
      let priority = 0;
      if (entityId.startsWith("well:")) {
        id = entityId.slice(5);
      } else if (entityId.startsWith("platform:")) {
        id = entityId.slice(9);
      } else if (entityId.startsWith("traj:")) {
        id = entityId.split(":")[1];
      } else if (entityId.startsWith("flow:")) {
        id = entityId.split(":")[1];
      } else if (entityId.startsWith("sel:")) {
        id = entityId.slice(4);
      } else if (entityId.startsWith("pipeline:")) {
        id = entityId.slice(9);
        priority = 1;
      } else if (entityId.startsWith("block:")) {
        id = entityId.slice(6);
        priority = 2;
      }
      if (id && (!best || priority < best.priority)) {
        best = { id, priority };
      }
    }
    return best?.id ?? null;
  };

  const pointsOf = (feature: GisFeature): LonLat[] => {
    if (feature.kind === "block") return closeRing(feature.boundary);
    if (feature.kind === "pipeline") return feature.path;
    return [feature.position];
  };

  const sphereOf = (feature: GisFeature): Cesium.BoundingSphere => {
    if (feature.kind === "well" || feature.kind === "platform") {
      return new Cesium.BoundingSphere(cartesianFromLonLat(feature.position, 0), 500);
    }
    return Cesium.BoundingSphere.fromPoints(cartesiansFromLonLat(pointsOf(feature), 0));
  };

  const flyTo = (id: string) => {
    const feature = featureById.get(id);
    if (!feature) return;
    if (scene.mode !== Cesium.SceneMode.SCENE3D) {
      viewer.camera.flyTo({
        destination: rectangleOfLonLat(pointsOf(feature), 0.01),
        duration: 1.1,
      });
      return;
    }
    const sphere = sphereOf(feature);
    const range =
      feature.kind === "well"
        ? 4500
        : feature.kind === "platform"
          ? 6200
          : Math.max(sphere.radius * 2.15, 6000);
    viewer.camera.flyToBoundingSphere(sphere, {
      offset: new Cesium.HeadingPitchRange(degrees(-12), degrees(-36), range),
      duration: 1.4,
    });
  };

  const flyToWellUnderground = (id: string) => {
    const feature = featureById.get(id);
    if (!feature || feature.kind !== "well") return;
    if (scene.mode !== Cesium.SceneMode.SCENE3D) {
      flyTo(id);
      return;
    }
    const sphere = new Cesium.BoundingSphere(cartesianFromLonLat(feature.position, -1500), 3500);
    viewer.camera.flyToBoundingSphere(sphere, {
      offset: new Cesium.HeadingPitchRange(degrees(-8), degrees(-52), 9000),
      duration: 1.6,
    });
  };

  const homeSphere = Cesium.BoundingSphere.fromPoints(cartesiansFromLonLat(homePoints, 0));
  const homeRect = rectangleOfLonLat(homePoints, 0.03);

  const flyHome = () => {
    if (scene.mode !== Cesium.SceneMode.SCENE3D) {
      viewer.camera.flyTo({ destination: homeRect, duration: 1.4 });
      return;
    }
    viewer.camera.flyToBoundingSphere(homeSphere, {
      offset: new Cesium.HeadingPitchRange(
        degrees(-18),
        degrees(-38),
        Math.max(homeSphere.radius * 2.2, 20000),
      ),
      duration: 2.2,
    });
  };

  const syncFeature = (id: string) => {
    const feature = featureById.get(id);
    if (!feature) return;
    syncInternal(feature);
    requestRender();
  };

  const syncAll = () => {
    featureById.forEach((feature) => syncInternal(feature));
    requestRender();
  };

  startLoop();
  requestRender();

  return {
    setVisible,
    setLabels,
    setEffects,
    setMode,
    pulseWells,
    select,
    syncFeature,
    syncAll,
    pick,
    flyTo,
    flyToWellUnderground,
    flyHome,
    destroy: () => {
      destroyed = true;
      stopLoop();
      pulseTimers.forEach((timer) => window.clearTimeout(timer));
      pulseTimers.clear();
      selectionBeams.clear();
      entityMap.clear();
      dataSources.forEach((dataSource) => {
        if (!viewer.isDestroyed()) viewer.dataSources.remove(dataSource, true);
      });
    },
  };
}
