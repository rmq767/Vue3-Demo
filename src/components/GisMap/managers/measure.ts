import * as Cesium from "cesium";
import { formatKm, surfaceDistance } from "../core/geo";
import { HEX } from "./entities";

export interface MeasureManager {
  start: () => void;
  stop: () => void;
  addPoint: (position: Cesium.Cartesian3) => void;
  undo: () => void;
  setCursor: (position?: Cesium.Cartesian3) => void;
  getTotal: () => number;
  destroy: () => void;
}

const textStyle = {
  font: "500 12px 'Microsoft YaHei', sans-serif",
  fillColor: Cesium.Color.fromCssColorString("#ffd27a"),
  outlineColor: Cesium.Color.fromCssColorString("#021018").withAlpha(0.95),
  outlineWidth: 3,
  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
  showBackground: true,
  backgroundColor: Cesium.Color.fromCssColorString("#071a29").withAlpha(0.86),
  backgroundPadding: new Cesium.Cartesian2(8, 4),
  disableDepthTestDistance: Number.POSITIVE_INFINITY,
} as const;

export function createMeasureManager(
  viewer: Cesium.Viewer,
  onUpdate?: (totalMeters: number, pointCount: number) => void,
): MeasureManager {
  const resultDs = new Cesium.CustomDataSource("gis-measure");
  const cursorDs = new Cesium.CustomDataSource("gis-measure-cursor");
  viewer.dataSources.add(resultDs);
  viewer.dataSources.add(cursorDs);
  resultDs.show = false;
  cursorDs.show = false;

  const points: Cesium.Cartesian3[] = [];
  let cursor: Cesium.Cartesian3 | undefined;
  let active = false;
  let destroyed = false;

  const orange = Cesium.Color.fromCssColorString(HEX.amber);

  const cursorLine = cursorDs.entities.add({
    id: "measure:cursor-line",
    polyline: {
      positions: new Cesium.CallbackProperty(() => {
        if (points.length === 0 || !cursor) return [];
        return [points[points.length - 1], cursor];
      }, false),
      width: 1.6,
      material: new Cesium.PolylineDashMaterialProperty({
        color: orange.withAlpha(0.85),
        dashLength: 12,
        gapColor: orange.withAlpha(0.1),
      }),
      show: false,
    },
  });

  const cursorLabel = cursorDs.entities.add({
    id: "measure:cursor-label",
    position: new Cesium.CallbackPositionProperty(() => {
      if (points.length === 0 || !cursor) return undefined;
      return Cesium.Cartesian3.midpoint(points[points.length - 1], cursor, new Cesium.Cartesian3());
    }, false),
    label: {
      ...textStyle,
      text: new Cesium.CallbackProperty(() => {
        if (points.length === 0 || !cursor) return "";
        return formatKm(surfaceDistance(points[points.length - 1], cursor));
      }, false),
      show: false,
    },
  });

  const cursorPoint = cursorDs.entities.add({
    id: "measure:cursor-point",
    position: new Cesium.CallbackPositionProperty(() => cursor, false),
    point: {
      pixelSize: 7,
      color: orange.withAlpha(0.9),
      outlineColor: Cesium.Color.WHITE.withAlpha(0.8),
      outlineWidth: 1,
      show: false,
    },
  });

  const requestRender = () => {
    if (!destroyed) viewer.scene.requestRender();
  };

  const totalDistance = () => {
    let total = 0;
    for (let i = 1; i < points.length; i += 1) {
      total += surfaceDistance(points[i - 1], points[i]);
    }
    return total;
  };

  const updateCursor = () => {
    const show = active && points.length > 0 && !!cursor;
    if (cursorLine.polyline) cursorLine.polyline.show = new Cesium.ConstantProperty(show);
    if (cursorLabel.label) cursorLabel.label.show = new Cesium.ConstantProperty(show);
    if (cursorPoint.point) cursorPoint.point.show = new Cesium.ConstantProperty(show);
  };

  const render = () => {
    resultDs.entities.removeAll();
    if (!active) return;

    points.forEach((point, index) => {
      resultDs.entities.add({
        id: `measure:point:${index}`,
        position: point,
        point: {
          pixelSize: 9,
          color: orange,
          outlineColor: Cesium.Color.fromCssColorString("#021018"),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    });

    for (let i = 1; i < points.length; i += 1) {
      const from = points[i - 1];
      const to = points[i];
      const midpoint = Cesium.Cartesian3.midpoint(from, to, new Cesium.Cartesian3());
      resultDs.entities.add({
        id: `measure:line:${i}`,
        polyline: {
          positions: [from, to],
          width: 3,
          material: new Cesium.PolylineGlowMaterialProperty({
            color: orange,
            glowPower: 0.35,
          }),
        },
      });
      resultDs.entities.add({
        id: `measure:label:${i}`,
        position: midpoint,
        label: {
          ...textStyle,
          text: formatKm(surfaceDistance(from, to)),
        },
      });
    }

    if (points.length > 1) {
      resultDs.entities.add({
        id: "measure:total",
        position: points[points.length - 1],
        label: {
          ...textStyle,
          text: `总长 ${formatKm(totalDistance())}`,
          font: "600 14px 'Microsoft YaHei', sans-serif",
          fillColor: Cesium.Color.WHITE,
          pixelOffset: new Cesium.Cartesian2(0, -30),
        },
      });
    }

    updateCursor();
    onUpdate?.(totalDistance(), points.length);
    requestRender();
  };

  return {
    start: () => {
      active = true;
      points.length = 0;
      cursor = undefined;
      resultDs.show = true;
      cursorDs.show = true;
      render();
    },
    stop: () => {
      active = false;
      points.length = 0;
      cursor = undefined;
      resultDs.entities.removeAll();
      cursorDs.show = false;
      onUpdate?.(0, 0);
      requestRender();
    },
    addPoint: (position: Cesium.Cartesian3) => {
      if (!active) return;
      points.push(Cesium.Cartesian3.clone(position));
      cursor = undefined;
      render();
    },
    undo: () => {
      if (!active || points.length === 0) return;
      points.pop();
      render();
    },
    setCursor: (position?: Cesium.Cartesian3) => {
      if (!active) return;
      cursor = position ? Cesium.Cartesian3.clone(position) : undefined;
      updateCursor();
      requestRender();
    },
    getTotal: totalDistance,
    destroy: () => {
      destroyed = true;
      if (!viewer.isDestroyed()) {
        viewer.dataSources.remove(resultDs, true);
        viewer.dataSources.remove(cursorDs, true);
      }
    },
  };
}
