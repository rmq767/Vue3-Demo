import * as L from "leaflet";
import { createFieldData, createSearchIndex, createStats } from "@/components/GisPro/data/field";
import type { FieldData, SearchItem, Stats } from "@/components/GisPro/data/types";
import {
  DEFAULT_BASEMAP,
  basemapDef,
  createBasemapLayers,
  createGridFallback,
} from "./baseMaps";
import { createFieldLayers, type FieldLayerManager } from "./fieldLayers";
import { crsToWgs84, localToWgs84, toLatLngTuple, wgs84ToCrs } from "./geo";
import type {
  BasemapKey,
  BasemapPatch,
  Crs,
  HoverPayload,
  LayerKey,
  LonLat,
} from "./types";
export interface LeafletCallbacks {
  onSelect: (id: string | null) => void;
  onHover: (payload: HoverPayload | null) => void;
  onWellProfile: (id: string) => void;
  onBasemap: (patch: BasemapPatch) => void;
  onZoom: (zoom: number) => void;
  onPointer: (point: LonLat | null) => void;
  onToast: (message: string) => void;
  onReady?: () => void;
}

export interface LeafletFieldApi {
  field: FieldData;
  stats: Stats;
  searchItems: SearchItem[];
  init: (container: HTMLElement) => void;
  destroy: () => void;
  setBasemap: (key: BasemapKey) => void;
  setLayerVisibility: (key: LayerKey, visible: boolean) => void;
  setLabelsVisible: (visible: boolean) => void;
  selectFeature: (id: string) => void;
  clearSelection: (restore?: boolean) => void;
  flyToFeature: (id: string) => void;
  focusBlock: (id: string) => void;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  refreshLabels: () => void;
}

const field = createFieldData();
const stats = createStats(field);
const searchItems = createSearchIndex(field);

export function useLeafletField(callbacks: LeafletCallbacks): LeafletFieldApi {
  let map: L.Map | null = null;
  let layers: FieldLayerManager | null = null;
  let currentBase: BasemapKey = DEFAULT_BASEMAP;
  let currentCrs: Crs = basemapDef(DEFAULT_BASEMAP).crs;
  let baseLayers: L.Layer[] = [];
  let fallbackLayer: L.GridLayer | null = null;
  let fallbackActive = false;
  let selectedId: string | null = null;
  let preSelectView: { center: LonLat; zoom: number } | null = null;
  let labelsVisible = true;
  let tileGeneration = 0;
  let tileTimer = 0;
  let pointerFrame = 0;
  let pendingPointer: LonLat | null = null;
  let resizeObserver: ResizeObserver | null = null;

  const layerVisibility: Record<LayerKey, boolean> = {
    blocks: true,
    wells: true,
    stations: true,
    pipelines: true,
  };

  const display = (point: LonLat): L.LatLngTuple =>
    toLatLngTuple(wgs84ToCrs(point, currentCrs));

  const viewCenter = (): LonLat | null => {
    if (!map) return null;
    const center = map.getCenter();
    return crsToWgs84({ lon: center.lng, lat: center.lat }, currentCrs);
  };

  function clearTileHealth(): void {
    if (tileTimer) {
      window.clearTimeout(tileTimer);
      tileTimer = 0;
    }
  }

  function removeBasemapLayers(): void {
    clearTileHealth();
    if (!map) return;
    baseLayers.forEach((layer) => map?.removeLayer(layer));
    baseLayers = [];
    if (fallbackLayer) {
      map.removeLayer(fallbackLayer);
      fallbackLayer = null;
    }
  }

  function activateFallback(generation: number): void {
    if (!map || generation !== tileGeneration || fallbackActive) return;
    fallbackActive = true;
    clearTileHealth();
    baseLayers.forEach((layer) => map?.removeLayer(layer));
    baseLayers = [];
    fallbackLayer = createGridFallback().addTo(map);
    callbacks.onBasemap({ key: currentBase, status: "fallback" });
    callbacks.onToast("在线底图不可达，已切换本地网格底图");
  }

  function watchTiles(tiles: L.Layer[], generation: number): void {
    let loaded = 0;
    let errors = 0;
    const onLoad = () => {
      if (generation !== tileGeneration) return;
      loaded += 1;
      if (loaded === 1) {
        clearTileHealth();
        callbacks.onBasemap({ key: currentBase, status: "ready" });
      }
    };
    const onError = () => {
      if (generation !== tileGeneration || loaded > 0) return;
      errors += 1;
      if (errors >= 5) activateFallback(generation);
    };
    tiles.forEach((tile) => {
      tile.on("tileload", onLoad);
      tile.on("tileerror", onError);
    });
    tileTimer = window.setTimeout(() => {
      if (generation !== tileGeneration) return;
      if (loaded === 0) activateFallback(generation);
    }, 7000);
    if (navigator.onLine === false) activateFallback(generation);
  }

  function applyBasemap(key: BasemapKey): void {
    if (!map) return;
    currentBase = key;
    const def = basemapDef(key);
    currentCrs = def.crs;
    map.getContainer().dataset.basemap = key;
    fallbackActive = false;
    tileGeneration += 1;
    const generation = tileGeneration;
    const tiles = createBasemapLayers(key);
    baseLayers = tiles;
    tiles.forEach((tile) => map?.addLayer(tile));
    callbacks.onBasemap({ key, status: "loading" });
    watchTiles(tiles, generation);
  }

  function applyLayerVisibility(): void {
    (Object.keys(layerVisibility) as LayerKey[]).forEach((key) => {
      layers?.setVisible(key, layerVisibility[key]);
    });
  }

  function flyToFeature(id: string): void {
    if (!map) return;
    const well = field.wells.find((item) => item.id === id);
    if (well) {
      map.flyTo(display(localToWgs84(field.center, well.pos)), Math.max(map.getZoom(), 16.5), {
        duration: 0.9,
      });
      return;
    }
    const station = field.stations.find((item) => item.id === id);
    if (station) {
      map.flyTo(
        display(localToWgs84(field.center, station.pos)),
        Math.max(map.getZoom(), 16),
        { duration: 0.9 },
      );
      return;
    }
    const pipeline = field.pipelines.find((item) => item.id === id);
    if (pipeline) {
      const bounds = L.latLngBounds(
        pipeline.path.map((point) => display(localToWgs84(field.center, point))),
      );
      map.flyToBounds(bounds, {
        padding: [140, 140],
        maxZoom: 16,
        duration: 0.9,
      });
    }
  }

  function selectFeature(id: string): void {
    if (!map || !layers) return;
    callbacks.onHover(null);
    callbacks.onHover(null);
    if (!selectedId) {
      const center = viewCenter();
      if (center) preSelectView = { center, zoom: map.getZoom() };
    }
    selectedId = id;
    layers.setSelected(id);
    callbacks.onSelect(id);
    flyToFeature(id);
  }

  function clearSelection(restore = true): void {
    if (!selectedId) return;
    selectedId = null;
    layers?.setSelected(null);
    callbacks.onSelect(null);
    if (restore && preSelectView && map) {
      map.flyTo(display(preSelectView.center), preSelectView.zoom, { duration: 0.85 });
    }
    preSelectView = null;
  }

  function focusBlock(id: string): void {
    if (!map) return;
    const block = field.blocks.find((item) => item.id === id);
    if (!block) return;
    map.flyTo(display(localToWgs84(field.center, block.center)), 15, { duration: 0.85 });
  }

  function resetView(): void {
    if (!map) return;
    clearSelection(false);
    const bounds = layers?.getBounds();
    if (bounds) {
      map.flyToBounds(bounds, { padding: [90, 90], maxZoom: 15, duration: 0.85 });
    }
  }

  function init(container: HTMLElement): void {
    if (map) return;
    map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 12,
      maxZoom: 18,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 100,
      doubleClickZoom: true,
      preferCanvas: false,
      renderer: L.svg({ padding: 0.65 }),
    });
    map.getContainer().classList.add("lgis-map");
    map.setView([field.center.lat, field.center.lon], 14, { animate: false });
    applyBasemap(currentBase);

    layers = createFieldLayers(
      map,
      field,
      {
        onSelect: (id) => selectFeature(id),
        onWellProfile: (id) => {
          selectFeature(id);
          callbacks.onWellProfile(id);
        },
        onHover: callbacks.onHover,
      },
      currentCrs,
    );

    const bounds = layers.getBounds();
    if (bounds) {
      map.fitBounds(bounds, { padding: [90, 90], maxZoom: 15, animate: false });
    }
    layers.refreshLabels();

    map.on("zoomend", () => {
      if (!map) return;
      callbacks.onZoom(map.getZoom());
      layers?.refreshLabels();
    });
    map.on("mousemove", (event: L.LeafletMouseEvent) => {
      const point = crsToWgs84(
        { lon: event.latlng.lng, lat: event.latlng.lat },
        currentCrs,
      );
      pendingPointer = point;
      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(() => {
        pointerFrame = 0;
        callbacks.onPointer(pendingPointer);
      });
    });
    map.on("mouseout", () => callbacks.onPointer(viewCenter()));
    map.on("moveend", () => callbacks.onPointer(viewCenter()));
    map.on("dragstart", () => callbacks.onHover(null));
    map.on("click", () => {
      if (selectedId) clearSelection();
    });

    callbacks.onZoom(map.getZoom());
    callbacks.onPointer(viewCenter());

    resizeObserver = new ResizeObserver(() => {
      map?.invalidateSize({ pan: false });
      layers?.refreshLabels();
    });
    resizeObserver.observe(container);
    callbacks.onReady?.();
  }

  function setBasemap(key: BasemapKey): void {
    if (!map) return;
    callbacks.onHover(null);
    callbacks.onHover(null);
    if (key === currentBase && !fallbackActive) return;
    const center = viewCenter();
    const zoom = map.getZoom();
    const crsChanged = basemapDef(key).crs !== currentCrs;
    removeBasemapLayers();
    applyBasemap(key);
    if (crsChanged && layers) {
      layers.rebuild(currentCrs);
      layers.setSelected(selectedId);
      applyLayerVisibility();
      layers.setLabelsVisible(labelsVisible);
      if (center) map.setView(display(center), zoom, { animate: false });
      layers.refreshLabels();
    }
  }

  function setLayerVisibility(key: LayerKey, visible: boolean): void {
    layerVisibility[key] = visible;
    layers?.setVisible(key, visible);
  }

  function setLabelsVisible(visible: boolean): void {
    labelsVisible = visible;
    layers?.setLabelsVisible(visible);
  }

  function destroy(): void {
    tileGeneration += 1;
    clearTileHealth();
    if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    resizeObserver?.disconnect();
    resizeObserver = null;
    layers?.destroy();
    layers = null;
    map?.remove();
    map = null;
    baseLayers = [];
    fallbackLayer = null;
    selectedId = null;
    preSelectView = null;
  }

  return {
    field,
    stats,
    searchItems,
    init,
    destroy,
    setBasemap,
    setLayerVisibility,
    setLabelsVisible,
    selectFeature,
    clearSelection,
    flyToFeature,
    focusBlock,
    resetView,
    zoomIn: () => map?.zoomIn(),
    zoomOut: () => map?.zoomOut(),
    refreshLabels: () => layers?.refreshLabels(),
  };
}
