import type { Ellipse, Group, Path, Rect, Text } from "leafer-ui";

export type NodeKind =
  | "wellhead"
  | "manifold"
  | "separator"
  | "meter"
  | "tank"
  | "pump"
  | "terminal";

export type Medium = "mixed" | "oil" | "gas" | "water";

export type NodeStatus = "running" | "standby" | "maintenance";

export type PortSide = "left" | "right" | "top" | "bottom";

export interface FieldNode {
  id: string;
  tag: string;
  name: string;
  kind: NodeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  status: NodeStatus;
  rate: number;
  pressure: number;
  unit: string;
}

export interface FieldEdge {
  id: string;
  from: string;
  to: string;
  medium: Medium;
  dn: number;
  fromSide: PortSide;
  toSide: PortSide;
  fromOffset?: number;
  toOffset?: number;
  via?: number;
  showLabel?: boolean;
}

export interface Field {
  nodes: FieldNode[];
  edges: FieldEdge[];
}

export interface Point {
  x: number;
  y: number;
}

export type Selection =
  | { type: "node"; id: string }
  | { type: "edge"; id: string }
  | null;

export interface NodeView {
  group: Group;
  tagText: Text;
  metaText: Text;
  statusDot: Ellipse;
  groupWidth: number;
}

export interface EdgeView {
  group: Group;
  casing: Path;
  line: Path;
  hit: Path;
  arrow: Path;
  labelGroup: Group;
  labelText: Text;
  labelBg: Rect;
}

export interface SceneHandles {
  world: Group;
  paper: Group;
  grid: Group;
  edgeLayer: Group;
  nodeLayer: Group;
  overlay: Group;
  selection: Group;
  nodes: Map<string, NodeView>;
  edges: Map<string, EdgeView>;
  labels: (Text | Group)[];
}
