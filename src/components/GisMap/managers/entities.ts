import * as Cesium from "cesium";
import type { Block, Pipeline, Platform, Well } from "../data/types";
import {
  cartesianFromLonLat,
  cartesiansFromLonLat,
  closeRing,
  midpointOfPath,
  sampleAlongCartesian,
} from "../core/geo";
import { particleIcon, platformIcon, wallGradient, wellIcon } from "../core/icons";

export const HEX = {
  cyan: "#00e5ff",
  mint: "#3cf5c8",
  blue: "#4d8dff",
  violet: "#b07cff",
  amber: "#ffb020",
  danger: "#ff4d5e",
  grey: "#71889a",
  text: "#cfe9f5",
};

const WALL_HEIGHT = 620;

function color(hex: string, alpha?: number): Cesium.Color {
  const base = Cesium.Color.fromCssColorString(hex);
  return alpha === undefined ? base : base.withAlpha(alpha);
}

function constant<T>(value: T): Cesium.ConstantProperty {
  return new Cesium.ConstantProperty(value);
}

function labelShow(visible: boolean): Cesium.ConstantProperty {
  return constant(visible);
}

function pulsePhase(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  return (hash / 1000) * Math.PI * 2;
}

function pulseValue(time: Cesium.JulianDate | undefined, phase: number): number {
  const seconds = time ? time.secondsOfDay : 0;
  return (Math.sin(seconds * 1.6 + phase) + 1) / 2;
}

export function wellStatusColor(well: Well): string {
  if (well.status === "warning") return HEX.amber;
  if (well.status === "offline") return HEX.grey;
  return HEX.cyan;
}

export function pipelineRunColor(pipeline: Pipeline): string {
  if (pipeline.runStatus === "stopped") return HEX.grey;
  if (pipeline.runStatus === "maintenance") return HEX.amber;
  if (pipeline.medium === "污水") return HEX.blue;
  if (pipeline.medium === "凝析油") return HEX.violet;
  return HEX.cyan;
}

function blockLabelText(block: Block): string {
  return `${block.name} · ${block.dailyGas.toFixed(1)} 万方/日`;
}

function wellLabelText(well: Well): string {
  if (well.status === "offline") return `${well.name} · 停产`;
  return `${well.name} · ${well.dailyGas.toFixed(1)} 万方/日`;
}

function platformLabelText(platform: Platform): string {
  return `${platform.name} · ${platform.wellIds.length} 口井`;
}

function pipelineLabelText(pipeline: Pipeline): string {
  return `${pipeline.name} · DN${pipeline.diameter} · ${pipeline.lengthKm.toFixed(1)} km`;
}

export function createBlockEntity(block: Block, labelsVisible: boolean): Cesium.Entity {
  const ring = closeRing(block.boundary);
  const groundRing = cartesiansFromLonLat(ring, 0);
  const lineRing = cartesiansFromLonLat(ring, 6);
  const minHeights = ring.map(() => 0);
  const maxHeights = ring.map(() => WALL_HEIGHT);
  const baseColor = color(block.color);

  return new Cesium.Entity({
    id: `block:${block.id}`,
    position: cartesianFromLonLat(block.center, 30),
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(cartesiansFromLonLat(block.boundary, 0)),
      material: new Cesium.ColorMaterialProperty(color(block.color, 0.085)),
      outline: false,
    },
    polyline: {
      positions: lineRing,
      width: 2.5,
      material: new Cesium.PolylineGlowMaterialProperty({
        color: baseColor.withAlpha(0.9),
        glowPower: 0.32,
      }),
    },
    wall: {
      positions: groundRing,
      minimumHeights: minHeights,
      maximumHeights: maxHeights,
      material: new Cesium.ImageMaterialProperty({
        image: wallGradient(block.color),
        transparent: true,
        color: Cesium.Color.WHITE,
      }),
    },
    label: {
      text: blockLabelText(block),
      font: "600 15px 'Microsoft YaHei', sans-serif",
      fillColor: Cesium.Color.WHITE,
      outlineColor: color("#021018", 0.95),
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      showBackground: true,
      backgroundColor: color(block.color, 0.16),
      backgroundPadding: new Cesium.Cartesian2(10, 6),
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      show: labelShow(labelsVisible),
    },
  });
}

export function createWellEntity(well: Well, labelsVisible: boolean): Cesium.Entity {
  const statusColor = color(wellStatusColor(well));
  const phase = pulsePhase(well.id);

  return new Cesium.Entity({
    id: `well:${well.id}`,
    position: cartesianFromLonLat(well.position, 0),
    billboard: {
      image: wellIcon(well.wellType, well.status),
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      scaleByDistance: new Cesium.NearFarScalar(1000, 1, 60000, 0.45),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: wellLabelText(well),
      font: "500 12px 'Microsoft YaHei', sans-serif",
      fillColor: statusColor.withAlpha(0.96),
      outlineColor: color("#021018", 0.92),
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, 10),
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 60000),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      show: labelShow(labelsVisible),
    },
    ellipse: {
      semiMajorAxis: new Cesium.CallbackProperty(
        (time?: Cesium.JulianDate) => 240 + pulseValue(time, phase) * 230,
        false,
      ),
      semiMinorAxis: new Cesium.CallbackProperty(
        (time?: Cesium.JulianDate) => 240 + pulseValue(time, phase) * 230,
        false,
      ),
      height: 0,
      material: new Cesium.ColorMaterialProperty(color(HEX.amber, 0.12)),
      outline: true,
      outlineColor: color(HEX.amber, 0.42),
      outlineWidth: 1,
      show: constant(well.status === "warning"),
    },
  });
}

export function createPlatformEntity(
  platform: Platform,
  hasAlarm: boolean,
  labelsVisible: boolean,
): Cesium.Entity {
  const platformColor = hasAlarm ? HEX.amber : HEX.mint;

  return new Cesium.Entity({
    id: `platform:${platform.id}`,
    position: cartesianFromLonLat(platform.position, 30),
    cylinder: {
      length: 60,
      topRadius: 240,
      bottomRadius: 400,
      material: color(platformColor, 0.24),
    },
    ellipse: {
      semiMajorAxis: 460,
      semiMinorAxis: 460,
      height: 0,
      material: color(platformColor, 0.1),
      outline: true,
      outlineColor: color(platformColor, 0.5),
      outlineWidth: 1.5,
    },
    billboard: {
      image: platformIcon(hasAlarm, platform.type),
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      scaleByDistance: new Cesium.NearFarScalar(1000, 1, 80000, 0.5),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: platformLabelText(platform),
      font: "500 12px 'Microsoft YaHei', sans-serif",
      fillColor: color(platformColor, 0.95),
      outlineColor: color("#021018", 0.92),
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, 10),
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 80000),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      show: labelShow(labelsVisible),
    },
  });
}

function circleShape(radius: number, segments = 12): Cesium.Cartesian2[] {
  const shape: Cesium.Cartesian2[] = [];
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    shape.push(new Cesium.Cartesian2(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }
  return shape;
}

export function createPipelineEntity(pipeline: Pipeline, labelsVisible: boolean): Cesium.Entity {
  const runColor = color(pipelineRunColor(pipeline));
  const mid = midpointOfPath(pipeline.path);

  const entity = new Cesium.Entity({
    id: `pipeline:${pipeline.id}`,
    position: cartesianFromLonLat(mid, 60),
    polylineVolume: {
      positions: cartesiansFromLonLat(pipeline.path, 20),
      shape: circleShape(10),
      material: new Cesium.ColorMaterialProperty(runColor.withAlpha(0.26)),
    },
    polyline: {
      positions: cartesiansFromLonLat(pipeline.path, 38),
      width: 2.5,
      material: new Cesium.PolylineGlowMaterialProperty({
        color: runColor,
        glowPower: 0.4,
      }),
    },
    label: {
      text: pipelineLabelText(pipeline),
      font: "500 11px 'Microsoft YaHei', sans-serif",
      fillColor: runColor.withAlpha(0.92),
      outlineColor: color("#021018", 0.92),
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 45000),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      show: labelShow(labelsVisible),
    },
  });
  pipelineVisual.set(entity, pipelineVisualSignature(pipeline));
  return entity;
}

function pipelineVisualSignature(pipeline: Pipeline): string {
  return `${pipeline.name}|${pipeline.runStatus}|${pipeline.medium}|${pipeline.diameter}|${pipeline.lengthKm}`;
}

const pipelineVisual = new WeakMap<Cesium.Entity, string>();

/** 沿运行中管道流动的发光粒子 */
export function createFlowParticles(pipeline: Pipeline): Cesium.Entity[] {
  if (pipeline.runStatus !== "running") return [];
  const positions = cartesiansFromLonLat(pipeline.path, 26);
  const count = Math.min(12, Math.max(5, Math.round(pipeline.lengthKm / 2)));
  const colorHex = pipelineRunColor(pipeline);
  const image = particleIcon(colorHex);
  const duration = 9;

  return Array.from({ length: count }, (_, index) => {
    const phase = index / count;
    const position = new Cesium.CallbackPositionProperty((time, result) => {
      const seconds = time ? time.secondsOfDay : 0;
      const t = (((seconds / duration) % 1) + phase) % 1;
      return sampleAlongCartesian(positions, t, result);
    }, false);

    return new Cesium.Entity({
      id: `flow:${pipeline.id}:${index}`,
      position,
      billboard: {
        image,
        scale: 1.06,
        scaleByDistance: new Cesium.NearFarScalar(1000, 1.3, 70000, 0.7),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  });
}

export function createTrajectoryEntities(well: Well): Cesium.Entity[] {
  if (!well.trajectory || well.trajectory.length < 2) return [];
  const trajectoryColor = well.wellType === "水平井" ? color(HEX.amber) : color(HEX.mint);
  const positions = well.trajectory.map((point) =>
    cartesianFromLonLat({ lon: point.lon, lat: point.lat }, -point.tvd),
  );

  const entities: Cesium.Entity[] = [
    new Cesium.Entity({
      id: `traj:${well.id}`,
      polyline: {
        positions,
        width: 2.4,
        arcType: Cesium.ArcType.NONE,
        material: new Cesium.PolylineGlowMaterialProperty({
          color: trajectoryColor.withAlpha(0.9),
          glowPower: 0.32,
        }),
      },
    }),
  ];

  well.trajectory.forEach((point, index) => {
    if (index === 0 || index % 4 !== 0) return;
    entities.push(
      new Cesium.Entity({
        id: `traj:${well.id}:${index}`,
        position: cartesianFromLonLat({ lon: point.lon, lat: point.lat }, -point.tvd),
        point: {
          pixelSize: 5,
          color: trajectoryColor.withAlpha(0.92),
          outlineColor: color("#021018", 0.9),
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      }),
    );
  });

  return entities;
}

/** 选中叠加层：只叠加高亮，不修改基态实体 */
export function createSelectionEntity(wellOrFeatureId: string, payload: {
  kind: "block" | "well" | "platform" | "pipeline";
  well?: Well;
  platform?: Platform;
  block?: Block;
  pipeline?: Pipeline;
}): Cesium.Entity | undefined {
  const id = `sel:${wellOrFeatureId}`;
  if (payload.kind === "well" && payload.well) {
    const well = payload.well;
    const base = cartesianFromLonLat(well.position, 0);
    const beamTop = cartesianFromLonLat(well.position, 620);
    return new Cesium.Entity({
      id,
      position: base,
      ellipse: {
        semiMajorAxis: 460,
        semiMinorAxis: 460,
        height: 0,
        material: color(HEX.cyan, 0.06),
        outline: true,
        outlineColor: color(HEX.cyan, 0.9),
        outlineWidth: 2,
      },
      polyline: {
        positions: [base, beamTop],
        width: 3,
        material: new Cesium.PolylineGlowMaterialProperty({
          color: color(HEX.cyan, 0.85),
          glowPower: 0.45,
        }),
      },
    });
  }

  if (payload.kind === "platform" && payload.platform) {
    const platform = payload.platform;
    return new Cesium.Entity({
      id,
      position: cartesianFromLonLat(platform.position, 0),
      ellipse: {
        semiMajorAxis: 720,
        semiMinorAxis: 720,
        height: 0,
        material: color(HEX.cyan, 0.05),
        outline: true,
        outlineColor: color(HEX.cyan, 0.9),
        outlineWidth: 2.5,
      },
    });
  }

  if (payload.kind === "block" && payload.block) {
    const ring = closeRing(payload.block.boundary);
    return new Cesium.Entity({
      id,
      polyline: {
        positions: cartesiansFromLonLat(ring, 8),
        width: 6,
        material: new Cesium.PolylineGlowMaterialProperty({
          color: Cesium.Color.WHITE.withAlpha(0.9),
          glowPower: 0.5,
        }),
      },
    });
  }

  if (payload.kind === "pipeline" && payload.pipeline) {
    const pipeline = payload.pipeline;
    return new Cesium.Entity({
      id,
      polyline: {
        positions: cartesiansFromLonLat(pipeline.path, 42),
        width: 8,
        material: new Cesium.PolylineGlowMaterialProperty({
          color: Cesium.Color.WHITE.withAlpha(0.82),
          glowPower: 0.55,
        }),
      },
    });
  }

  return undefined;
}

export function updateWellEntity(entity: Cesium.Entity, well: Well) {
  const statusColor = color(wellStatusColor(well));
  if (entity.label) {
    entity.label.text = new Cesium.ConstantProperty(wellLabelText(well));
    entity.label.fillColor = new Cesium.ConstantProperty(statusColor.withAlpha(0.96));
  }
  if (entity.billboard) {
    entity.billboard.image = new Cesium.ConstantProperty(wellIcon(well.wellType, well.status));
  }
  if (entity.ellipse) {
    entity.ellipse.show = new Cesium.ConstantProperty(well.status === "warning");
  }
}

export function updateBlockEntity(entity: Cesium.Entity, block: Block) {
  if (entity.label) {
    entity.label.text = new Cesium.ConstantProperty(blockLabelText(block));
  }
}

export function updatePlatformEntity(
  entity: Cesium.Entity,
  platform: Platform,
  hasAlarm: boolean,
) {
  const platformColor = color(hasAlarm ? HEX.amber : HEX.mint);
  if (entity.label) {
    entity.label.text = new Cesium.ConstantProperty(platformLabelText(platform));
    entity.label.fillColor = new Cesium.ConstantProperty(platformColor.withAlpha(0.95));
  }
  if (entity.billboard) {
    entity.billboard.image = new Cesium.ConstantProperty(platformIcon(hasAlarm, platform.type));
  }
  if (entity.ellipse) {
    entity.ellipse.material = new Cesium.ColorMaterialProperty(platformColor.withAlpha(0.12));
    entity.ellipse.outlineColor = new Cesium.ConstantProperty(platformColor.withAlpha(0.55));
  }
  if (entity.cylinder) {
    entity.cylinder.material = new Cesium.ColorMaterialProperty(platformColor.withAlpha(0.24));
  }
}

export function updatePipelineEntity(entity: Cesium.Entity, pipeline: Pipeline) {
  const signature = pipelineVisualSignature(pipeline);
  if (pipelineVisual.get(entity) === signature) return;
  pipelineVisual.set(entity, signature);

  const runColor = color(pipelineRunColor(pipeline));
  if (entity.label) {
    entity.label.text = new Cesium.ConstantProperty(pipelineLabelText(pipeline));
    entity.label.fillColor = new Cesium.ConstantProperty(runColor.withAlpha(0.92));
  }
  if (entity.polyline) {
    entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
      color: runColor,
      glowPower: 0.4,
    });
  }
  if (entity.polylineVolume) {
    entity.polylineVolume.material = new Cesium.ColorMaterialProperty(runColor.withAlpha(0.26));
  }
}

