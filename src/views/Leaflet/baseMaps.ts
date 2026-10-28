import * as L from "leaflet";
import type { BasemapKey, Crs } from "./types";

export interface BasemapDef {
  key: BasemapKey;
  label: string;
  en: string;
  crs: Crs;
  credit: string;
  maxZoom: number;
}

export const BASEMAPS: BasemapDef[] = [
  {
    key: "gaode-vector",
    label: "高德矢量",
    en: "AMAP VECTOR",
    crs: "gcj02",
    credit: "© 高德地图",
    maxZoom: 18,
  },
  {
    key: "gaode-satellite",
    label: "高德影像",
    en: "AMAP SATELLITE",
    crs: "gcj02",
    credit: "© 高德地图",
    maxZoom: 18,
  },
  {
    key: "osm",
    label: "OSM",
    en: "OPENSTREETMAP",
    crs: "wgs84",
    credit: "© OpenStreetMap contributors",
    maxZoom: 19,
  },
  {
    key: "esri",
    label: "Esri 影像",
    en: "ESRI IMAGERY",
    crs: "wgs84",
    credit: "© Esri World Imagery",
    maxZoom: 18,
  },
];

export const DEFAULT_BASEMAP: BasemapKey = "gaode-satellite";

export function basemapDef(key: BasemapKey): BasemapDef {
  return BASEMAPS.find((item) => item.key === key) ?? BASEMAPS[0];
}

const ERROR_TILE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

function tileLayer(url: string, options: L.TileLayerOptions = {}): L.TileLayer {
  return L.tileLayer(url, {
    minZoom: 12,
    maxZoom: 19,
    maxNativeZoom: 18,
    errorTileUrl: ERROR_TILE,
    updateWhenZooming: false,
    keepBuffer: 3,
    ...options,
  });
}

export function createBasemapLayers(key: BasemapKey): L.Layer[] {
  if (key === "gaode-vector") {
    return [
      tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}", {
        subdomains: "1234",
        zIndex: 1,
        className: "lgis-tiles lgis-tiles--vector",
      }),
    ];
  }
  if (key === "gaode-satellite") {
    return [
      tileLayer("https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}", {
        subdomains: "1234",
        zIndex: 1,
        className: "lgis-tiles lgis-tiles--satellite",
      }),
      tileLayer("https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}", {
        subdomains: "1234",
        zIndex: 2,
        className: "lgis-tiles lgis-tiles--satellite",
      }),
    ];
  }
  if (key === "osm") {
    return [
      tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        maxNativeZoom: 19,
        zIndex: 1,
        className: "lgis-tiles lgis-tiles--osm",
      }),
    ];
  }
  return [
    tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        zIndex: 1,
        className: "lgis-tiles lgis-tiles--esri",
      },
    ),
  ];
}

/** 在线瓦片不可达时的本地网格底图，纯 Canvas 绘制，不依赖网络。 */
class GridFallbackLayer extends L.GridLayer {
  createTile(coords: L.Coords): HTMLElement {
    const size = this.getTileSize();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const canvas = document.createElement("canvas");
    canvas.width = size.x * ratio;
    canvas.height = size.y * ratio;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;
    ctx.scale(ratio, ratio);

    ctx.fillStyle = "#04101a";
    ctx.fillRect(0, 0, size.x, size.y);

    ctx.strokeStyle = "rgba(18, 56, 74, 0.55)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= size.x; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i + 0.5, 0);
      ctx.lineTo(i + 0.5, size.y);
      ctx.stroke();
    }
    for (let i = 0; i <= size.y; i += 32) {
      ctx.beginPath();
      ctx.moveTo(0, i + 0.5);
      ctx.lineTo(size.x, i + 0.5);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(61, 225, 255, 0.12)";
    for (let i = 0; i <= size.x; i += 128) {
      ctx.beginPath();
      ctx.moveTo(i + 0.5, 0);
      ctx.lineTo(i + 0.5, size.y);
      ctx.stroke();
    }
    for (let i = 0; i <= size.y; i += 128) {
      ctx.beginPath();
      ctx.moveTo(0, i + 0.5);
      ctx.lineTo(size.x, i + 0.5);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(61, 225, 255, 0.22)";
    ctx.font = "9px 'SFMono-Regular', Consolas, monospace";
    ctx.fillText(`${coords.z} / ${coords.x} / ${coords.y}`, 10, 16);

    ctx.strokeStyle = "rgba(61, 225, 255, 0.2)";
    ctx.beginPath();
    ctx.moveTo(size.x / 2 - 5, size.y / 2);
    ctx.lineTo(size.x / 2 + 5, size.y / 2);
    ctx.moveTo(size.x / 2, size.y / 2 - 5);
    ctx.lineTo(size.x / 2, size.y / 2 + 5);
    ctx.stroke();

    return canvas;
  }
}

export function createGridFallback(): L.GridLayer {
  return new GridFallbackLayer({
    tileSize: 256,
    minZoom: 12,
    maxZoom: 19,
    attribution: "",
  });
}
