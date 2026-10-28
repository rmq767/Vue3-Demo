import * as L from "leaflet";
import {
  pipelineMediumLabel,
  pipelineStatusLabel,
  wellKindLabel,
} from "@/components/GisPro/data/field";
import type {
  Block,
  FeatureKind,
  FieldData,
  Pipeline,
  Station,
  Well,
} from "@/components/GisPro/data/types";
import {
  circleRing,
  convexHull,
  estimateTextWidth,
  localToWgs84,
  offsetRing,
  toLatLngTuple,
  wgs84ToCrs,
} from "./geo";
import type { Crs, HoverPayload, LayerKey, LonLat } from "./types";

export interface FieldLayerCallbacks {
  onSelect: (id: string) => void;
  onWellProfile: (id: string) => void;
  onHover: (payload: HoverPayload | null) => void;
}

export interface FieldLayerManager {
  rebuild: (crs: Crs) => void;
  refreshLabels: () => void;
  setVisible: (key: LayerKey, visible: boolean) => void;
  setLabelsVisible: (visible: boolean) => void;
  setSelected: (id: string | null) => void;
  getBounds: () => L.LatLngBounds | null;
  getVisibleLabelCount: () => number;
  destroy: () => void;
}

type LabelKind = FeatureKind | "block";

interface LabelEntry {
  id: string;
  kind: LabelKind;
  layer: LayerKey;
  minZoom: number;
  priority: number;
  width: number;
  height: number;
  marker: L.Marker;
  element: HTMLElement | null;
}

const COLOR_HEX: Record<string, string> = {
  primary: "#3de1ff",
  success: "#4af2c8",
  warning: "#ffc857",
  violet: "#9b8cff",
  info: "#5b8cff",
};

const MEDIUM_HEX: Record<string, string> = {
  oil: "#f5a524",
  gas: "#4af2c8",
  water: "#5b8cff",
};

const BLOCK_LABEL_MIN_ZOOM = 13;
const STATION_LABEL_MIN_ZOOM = 14;
const WELL_LABEL_MIN_ZOOM = 16;

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    if (char === '"') return "&quot;";
    return "&#39;";
  });
}

function wellPriority(well: Well): number {
  if (well.status === "warning") return 860;
  if (well.status === "offline") return 340;
  if (well.kind === "oil") return 520;
  if (well.kind === "gas") return 480;
  if (well.kind === "water") return 430;
  return 390;
}

function withHover(
  target: L.Layer,
  build: () => Omit<HoverPayload, "x" | "y">,
  onHover: (payload: HoverPayload | null) => void,
): void {
  const emit = (event: L.LeafletMouseEvent) => {
    const mouse = event.originalEvent as MouseEvent;
    onHover({ ...build(), x: mouse.clientX, y: mouse.clientY });
  };
  target.on("mouseover", emit);
  target.on("mousemove", emit);
  target.on("mouseout", () => onHover(null));
}

export function createFieldLayers(
  map: L.Map,
  field: FieldData,
  callbacks: FieldLayerCallbacks,
  initialCrs: Crs,
): FieldLayerManager {
  let crs: Crs = initialCrs;
  let selectedId: string | null = null;
  let labelsVisible = true;
  let visibleLabelCount = 0;
  let labelFrame = 0;

  const layerVisible: Record<LayerKey, boolean> = {
    blocks: true,
    wells: true,
    stations: true,
    pipelines: true,
  };

  const groups: Record<LayerKey, L.LayerGroup> = {
    blocks: L.layerGroup().addTo(map),
    wells: L.layerGroup().addTo(map),
    stations: L.layerGroup().addTo(map),
    pipelines: L.layerGroup().addTo(map),
  };

  if (!map.getPane("lgisLabels")) {
    const pane = map.createPane("lgisLabels");
    pane.style.zIndex = "640";
    pane.style.pointerEvents = "none";
  }
  const labelGroup = L.layerGroup().addTo(map);

  let labels: LabelEntry[] = [];
  let featureElements = new Map<string, Element[]>();
  let labelElements = new Map<string, HTMLElement>();
  const markerById = new Map<string, L.Marker>();

  const project = (point: LonLat): L.LatLngTuple =>
    toLatLngTuple(wgs84ToCrs(point, crs));

  const local = (pos: { x: number; z: number }): LonLat =>
    localToWgs84(field.center, pos);

  function registerElement(id: string, element: Element | null | undefined): void {
    if (!element) return;
    const list = featureElements.get(id) ?? [];
    list.push(element);
    featureElements.set(id, list);
  }

  function addLabel(
    id: string,
    kind: LabelKind,
    layer: LayerKey,
    point: LonLat,
    text: string,
    minZoom: number,
    priority: number,
    fontSize: number,
  ): void {
    const width = estimateTextWidth(text, fontSize);
    const height = kind === "block" ? 24 : 20;
    const icon = L.divIcon({
      className: `lgis-label-icon lgis-label-icon--${kind}`,
      html: `<span class="lgis-label lgis-label--${kind}">${escapeHtml(text)}</span>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    const marker = L.marker(project(point), {
      icon,
      pane: "lgisLabels",
      interactive: false,
      keyboard: false,
    }).addTo(labelGroup);
    const element = marker.getElement() ?? null;
    if (element) element.style.display = "none";
    const entry: LabelEntry = {
      id,
      kind,
      layer,
      minZoom,
      priority,
      width,
      height,
      marker,
      element,
    };
    labels.push(entry);
    const inner = element?.querySelector<HTMLElement>(".lgis-label");
    if (inner) labelElements.set(id, inner);
  }

  function addPolygon(block: Block): void {
    const wgsPoints = field.wells
      .filter((well) => well.blockId === block.id)
      .map((well) => local(well.pos));
    const base = wgsPoints.length >= 3
      ? convexHull(wgsPoints)
      : circleRing(local(block.center), block.radius, 32);
    const ring = offsetRing(base, 55);
    const latlngs = ring.map((point) => project(point));
    const color = COLOR_HEX[block.colorKey] ?? COLOR_HEX.primary;
    const polygon = L.polygon(latlngs, {
      className: "lgis-block",
      color,
      weight: 1.2,
      opacity: 0.5,
      dashArray: "6 6",
      fillColor: color,
      fillOpacity: 0.055,
      interactive: false,
    }).addTo(groups.blocks);

    const centroid = ring.reduce(
      (sum, point) => ({ lon: sum.lon + point.lon / ring.length, lat: sum.lat + point.lat / ring.length }),
      { lon: 0, lat: 0 },
    );
    addLabel(
      block.id,
      "block",
      "blocks",
      centroid,
      block.name,
      BLOCK_LABEL_MIN_ZOOM,
      480,
      13,
    );
    registerElement(block.id, polygon.getElement());
  }

  function addWell(well: Well): void {
    const warning = well.status === "warning" ? " is-warning" : "";
    const offline = well.status === "offline" ? " is-offline" : "";
    const icon = L.divIcon({
      className: "lgis-well-icon",
      html: `<span class="lgis-well lgis-well--${well.kind}${warning}${offline}"><i></i></span>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    const marker = L.marker(project(local(well.pos)), {
      icon,
      riseOnHover: true,
      keyboard: false,
      bubblingMouseEvents: false,
      title: "",
    }).addTo(groups.wells);
    marker.on("click", () => callbacks.onSelect(well.id));
    marker.on("dblclick", () => callbacks.onWellProfile(well.id));
    withHover(marker, () => {
      const block = field.blocks.find((item) => item.id === well.blockId);
      return {
        id: well.id,
        kind: "well",
        name: well.name,
        kindLabel: wellKindLabel(well.kind),
        meta: `${block?.name ?? "—"} · 日产油 ${well.metrics.oil.toFixed(1)} t/d · 套压 ${well.metrics.pressure.toFixed(1)} MPa`,
        hint: "单击查看详情 · 双击进入井轨迹",
      };
    }, callbacks.onHover);
    markerById.set(well.id, marker);
    registerElement(well.id, marker.getElement());
    addLabel(
      well.id,
      "well",
      "wells",
      local(well.pos),
      well.name,
      WELL_LABEL_MIN_ZOOM,
      wellPriority(well),
      10,
    );
  }

  function addStation(station: Station): void {
    const maintenance = station.status === "maintenance" ? " is-maintenance" : "";
    const icon = L.divIcon({
      className: "lgis-station-icon",
      html: `<span class="lgis-station${maintenance}"><i></i></span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    const marker = L.marker(project(local(station.pos)), {
      icon,
      riseOnHover: true,
      keyboard: false,
      bubblingMouseEvents: false,
      title: "",
    }).addTo(groups.stations);
    marker.on("click", () => callbacks.onSelect(station.id));
    withHover(marker, () => ({
      id: station.id,
      kind: "station",
      name: station.name,
      kindLabel: station.type,
      meta: `${station.wellIds.length} 口关联井 · 外输压力 ${station.pressure.toFixed(1)} MPa`,
      hint: "单击查看详情",
    }), callbacks.onHover);
    markerById.set(station.id, marker);
    registerElement(station.id, marker.getElement());
    addLabel(
      station.id,
      "station",
      "stations",
      local(station.pos),
      station.name,
      STATION_LABEL_MIN_ZOOM,
      720,
      10.5,
    );
  }

  function addPipeline(pipeline: Pipeline): void {
    const latlngs = pipeline.path.map((point) => project(local(point)));
    const statusClass =
      pipeline.status === "maintenance"
        ? " is-maintenance"
        : pipeline.status === "stopped"
          ? " is-stopped"
          : "";
    const casing = L.polyline(latlngs, {
      className: "lgis-pipe-casing",
      color: "#02060b",
      weight: 6,
      opacity: 0.55,
      interactive: false,
      bubblingMouseEvents: false,
    }).addTo(groups.pipelines);
    const flow = L.polyline(latlngs, {
      className: `lgis-flow lgis-flow--${pipeline.medium}${statusClass}`,
      color: MEDIUM_HEX[pipeline.medium],
      weight: 2.4,
      opacity: 0.95,
      interactive: false,
      bubblingMouseEvents: false,
    }).addTo(groups.pipelines);
    const hit = L.polyline(latlngs, {
      className: "lgis-pipe-hit",
      color: "#ffffff",
      weight: 16,
      opacity: 0.01,
      interactive: true,
      bubblingMouseEvents: false,
    }).addTo(groups.pipelines);
    hit.on("click", () => callbacks.onSelect(pipeline.id));
    withHover(hit, () => ({
      id: pipeline.id,
      kind: "pipeline",
      name: pipeline.name,
      kindLabel: `${pipelineMediumLabel(pipeline.medium)}管线`,
      meta: `DN${pipeline.diameter} · ${pipeline.lengthKm.toFixed(2)} km · ${pipelineStatusLabel(pipeline.status)}`,
      hint: "单击查看详情",
    }), callbacks.onHover);
    registerElement(pipeline.id, casing.getElement());
    registerElement(pipeline.id, flow.getElement());
  }

  function build(): void {
    for (const group of Object.values(groups)) {
      group.clearLayers();
      if (!map.hasLayer(group)) group.addTo(map);
    }
    labelGroup.clearLayers();
    labels = [];
    featureElements = new Map();
    labelElements = new Map();
    markerById.clear();
    visibleLabelCount = 0;

    for (const block of field.blocks) addPolygon(block);
    for (const well of field.wells) addWell(well);
    for (const station of field.stations) addStation(station);
    for (const pipeline of field.pipelines) addPipeline(pipeline);

    applyVisibility();
    applySelected();
    scheduleLabelUpdate();
  }

  function applyVisibility(): void {
    (Object.keys(groups) as LayerKey[]).forEach((key) => {
      const group = groups[key];
      const shouldShow = layerVisible[key];
      const onMap = map.hasLayer(group);
      if (shouldShow && !onMap) group.addTo(map);
      if (!shouldShow && onMap) map.removeLayer(group);
    });
    scheduleLabelUpdate();
  }

  function applySelected(): void {
    featureElements.forEach((elements, id) => {
      const isSelected = id === selectedId;
      elements.forEach((element) => {
        element.classList.toggle("is-selected", isSelected);
      });
    });
    labelElements.forEach((element, id) => {
      element.classList.toggle("is-selected", id === selectedId);
    });
    markerById.forEach((marker, id) => {
      marker.setZIndexOffset(id === selectedId ? 1200 : 0);
    });
    map.getContainer().classList.toggle("is-focused", Boolean(selectedId));
    scheduleLabelUpdate();
  }

  interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
  }

  function overlaps(a: Rect, b: Rect, gap = 5): boolean {
    return (
      a.x < b.x + b.w + gap &&
      a.x + a.w + gap > b.x &&
      a.y < b.y + b.h + gap &&
      a.y + a.h + gap > b.y
    );
  }

  function safeRects(): Rect[] {
    const mapRect = map.getContainer().getBoundingClientRect();
    const selectors = [
      ".lgis-header",
      ".lgis-left",
      ".lgis-right",
      ".lgis-basemap-dock",
      ".lgis-zoom",
      ".lgis-status",
    ];
    const rects: Rect[] = [];
    for (const selector of selectors) {
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        if (!element.offsetParent) return;
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        rects.push({
          x: rect.left - mapRect.left - 6,
          y: rect.top - mapRect.top - 6,
          w: rect.width + 12,
          h: rect.height + 12,
        });
      });
    }
    return rects;
  }

  function updateLabels(): void {
    labelFrame = 0;
    if (!map) return;
    const size = map.getSize();
    const zoom = map.getZoom();
    const occupied = safeRects();
    const ordered = [...labels].sort((a, b) => {
      const aScore = a.id === selectedId ? 5000 : a.priority;
      const bScore = b.id === selectedId ? 5000 : b.priority;
      return bScore - aScore;
    });
    let visible = 0;

    for (const entry of ordered) {
      if (!entry.element) continue;
      const isSelected = entry.id === selectedId;
      let show =
        labelsVisible &&
        layerVisible[entry.layer] &&
        (isSelected || zoom >= entry.minZoom);
      let rect: Rect | null = null;

      if (show) {
        const point = map.latLngToContainerPoint(entry.marker.getLatLng());
        if (
          point.x < -20 ||
          point.y < -20 ||
          point.x > size.x + 20 ||
          point.y > size.y + 20
        ) {
          show = false;
        } else {
          rect =
            entry.kind === "block"
              ? {
                  x: point.x - entry.width / 2,
                  y: point.y - entry.height / 2,
                  w: entry.width,
                  h: entry.height,
                }
              : {
                  x: point.x - entry.width / 2,
                  y: point.y - entry.height - 8,
                  w: entry.width,
                  h: entry.height,
                };
          if (occupied.some((block) => overlaps(block, rect as Rect))) show = false;
        }
      }

      entry.element.style.display = show ? "" : "none";
      if (show && rect) {
        occupied.push(rect);
        visible += 1;
      }
    }
    visibleLabelCount = visible;
  }

  function scheduleLabelUpdate(): void {
    if (labelFrame) return;
    labelFrame = window.requestAnimationFrame(updateLabels);
  }

  map.on("moveend zoomend resize", scheduleLabelUpdate);
  map.on("zoomstart", () => {
    // 缩放动画期间先收起标签，避免位置漂移
    labels.forEach((entry) => {
      if (entry.element && entry.id !== selectedId) entry.element.style.display = "none";
    });
  });

  build();

  return {
    rebuild(nextCrs: Crs) {
      crs = nextCrs;
      build();
    },
    refreshLabels: scheduleLabelUpdate,
    setVisible(key, visible) {
      layerVisible[key] = visible;
      applyVisibility();
    },
    setLabelsVisible(visible) {
      labelsVisible = visible;
      scheduleLabelUpdate();
    },
    setSelected(id) {
      selectedId = id;
      applySelected();
    },
    getBounds() {
      const points: L.LatLngTuple[] = [];
      field.wells.forEach((well) => points.push(project(local(well.pos))));
      field.stations.forEach((station) => points.push(project(local(station.pos))));
      field.pipelines.forEach((pipeline) =>
        pipeline.path.forEach((point) => points.push(project(local(point)))),
      );
      return points.length ? L.latLngBounds(points) : null;
    },
    getVisibleLabelCount() {
      return visibleLabelCount;
    },
    destroy() {
      map.off("moveend zoomend resize", scheduleLabelUpdate);
      if (labelFrame) window.cancelAnimationFrame(labelFrame);
      Object.values(groups).forEach((group) => group.clearLayers());
      labelGroup.clearLayers();
    },
  };
}
