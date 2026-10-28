import type { FeatureKind } from "@/components/GisPro/data/types";

export type Crs = "wgs84" | "gcj02";

export type BasemapKey = "gaode-vector" | "gaode-satellite" | "osm" | "esri";

export type BasemapStatus = "loading" | "ready" | "fallback";

export const LAYER_KEYS = ["blocks", "wells", "stations", "pipelines"] as const;

export type LayerKey = (typeof LAYER_KEYS)[number];

export interface LonLat {
  lon: number;
  lat: number;
}

export interface HoverPayload {
  id: string;
  kind: FeatureKind;
  name: string;
  kindLabel: string;
  meta: string;
  hint: string;
  x: number;
  y: number;
}

export interface BasemapPatch {
  key: BasemapKey;
  status: BasemapStatus;
}
