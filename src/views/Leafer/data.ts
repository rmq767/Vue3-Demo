import type {
  Field,
  FieldEdge,
  FieldNode,
  Medium,
  NodeKind,
  NodeStatus,
} from "./types";

export const KIND_LABEL: Record<NodeKind, string> = {
  wellhead: "生产井",
  manifold: "阀组",
  separator: "三相分离器",
  meter: "气体计量",
  tank: "缓冲储罐",
  pump: "外输泵",
  terminal: "外输界区",
};

export const STATUS_LABEL: Record<NodeStatus, string> = {
  running: "运行",
  standby: "待机",
  maintenance: "检修",
};

export const MEDIUM_LABEL: Record<Medium, string> = {
  mixed: "混合液",
  oil: "原油",
  gas: "天然气",
  water: "生产水",
};

const BASE_NODES: FieldNode[] = [
  {
    id: "w-01",
    tag: "W-07-01",
    name: "1 号生产井",
    kind: "wellhead",
    x: 250,
    y: 180,
    width: 64,
    height: 96,
    status: "running",
    rate: 12.6,
    pressure: 2.4,
    unit: "t/d",
  },
  {
    id: "w-02",
    tag: "W-07-02",
    name: "2 号生产井",
    kind: "wellhead",
    x: 250,
    y: 330,
    width: 64,
    height: 96,
    status: "running",
    rate: 9.8,
    pressure: 2.1,
    unit: "t/d",
  },
  {
    id: "w-03",
    tag: "W-07-03",
    name: "3 号生产井",
    kind: "wellhead",
    x: 250,
    y: 480,
    width: 64,
    height: 96,
    status: "standby",
    rate: 8.2,
    pressure: 1.9,
    unit: "t/d",
  },
  {
    id: "w-04",
    tag: "W-07-04",
    name: "4 号生产井",
    kind: "wellhead",
    x: 250,
    y: 630,
    width: 64,
    height: 96,
    status: "maintenance",
    rate: 0,
    pressure: 0,
    unit: "t/d",
  },
  {
    id: "m-07",
    tag: "M-07",
    name: "井场阀组",
    kind: "manifold",
    x: 520,
    y: 405,
    width: 140,
    height: 64,
    status: "running",
    rate: 30.6,
    pressure: 1.8,
    unit: "t/d",
  },
  {
    id: "v-101",
    tag: "V-101",
    name: "三相分离器",
    kind: "separator",
    x: 700,
    y: 405,
    width: 100,
    height: 150,
    status: "running",
    rate: 30.6,
    pressure: 1.6,
    unit: "t/d",
  },
  {
    id: "f-101",
    tag: "F-101",
    name: "气体计量",
    kind: "meter",
    x: 890,
    y: 245,
    width: 96,
    height: 64,
    status: "standby",
    rate: 2.8,
    pressure: 0.9,
    unit: "10⁴m³/d",
  },
  {
    id: "t-201",
    tag: "T-201",
    name: "缓冲储罐",
    kind: "tank",
    x: 890,
    y: 470,
    width: 104,
    height: 124,
    status: "running",
    rate: 26.4,
    pressure: 1.4,
    unit: "m³",
  },
  {
    id: "p-301",
    tag: "P-301",
    name: "外输泵",
    kind: "pump",
    x: 1080,
    y: 470,
    width: 84,
    height: 84,
    status: "running",
    rate: 26.4,
    pressure: 1.2,
    unit: "m³/h",
  },
  {
    id: "x-01",
    tag: "X-01",
    name: "外输界区",
    kind: "terminal",
    x: 1230,
    y: 470,
    width: 100,
    height: 64,
    status: "running",
    rate: 26.4,
    pressure: 1.1,
    unit: "m³/h",
  },
];

const BASE_EDGES: FieldEdge[] = [
  {
    id: "e-w-01",
    from: "w-01",
    to: "m-07",
    medium: "mixed",
    dn: 80,
    fromSide: "right",
    toSide: "left",
    fromOffset: 0.26,
    toOffset: -0.3,
    via: 340,
    showLabel: false,
  },
  {
    id: "e-w-02",
    from: "w-02",
    to: "m-07",
    medium: "mixed",
    dn: 80,
    fromSide: "right",
    toSide: "left",
    fromOffset: 0.26,
    toOffset: -0.1,
    via: 366,
    showLabel: false,
  },
  {
    id: "e-w-03",
    from: "w-03",
    to: "m-07",
    medium: "mixed",
    dn: 80,
    fromSide: "right",
    toSide: "left",
    fromOffset: 0.26,
    toOffset: 0.1,
    via: 392,
    showLabel: false,
  },
  {
    id: "e-w-04",
    from: "w-04",
    to: "m-07",
    medium: "mixed",
    dn: 80,
    fromSide: "right",
    toSide: "left",
    fromOffset: 0.26,
    toOffset: 0.3,
    via: 418,
    showLabel: false,
  },
  {
    id: "e-m-v",
    from: "m-07",
    to: "v-101",
    medium: "mixed",
    dn: 200,
    fromSide: "right",
    toSide: "left",
  },
  {
    id: "e-v-f",
    from: "v-101",
    to: "f-101",
    medium: "gas",
    dn: 100,
    fromSide: "top",
    toSide: "left",
  },
  {
    id: "e-v-t",
    from: "v-101",
    to: "t-201",
    medium: "oil",
    dn: 150,
    fromSide: "right",
    toSide: "left",
    fromOffset: -0.25,
  },
  {
    id: "e-t-p",
    from: "t-201",
    to: "p-301",
    medium: "oil",
    dn: 150,
    fromSide: "right",
    toSide: "left",
  },
  {
    id: "e-p-x",
    from: "p-301",
    to: "x-01",
    medium: "oil",
    dn: 150,
    fromSide: "right",
    toSide: "left",
  },
];

export function createField(): Field {
  return {
    nodes: BASE_NODES.map((node) => ({ ...node })),
    edges: BASE_EDGES.map((edge) => ({ ...edge })),
  };
}

export function resetField(field: Field): void {
  const baseNodes = new Map(BASE_NODES.map((node) => [node.id, node]));
  const baseEdges = new Map(BASE_EDGES.map((edge) => [edge.id, edge]));
  field.nodes.forEach((node) => {
    const base = baseNodes.get(node.id);
    if (base) Object.assign(node, base);
  });
  field.edges.forEach((edge) => {
    const base = baseEdges.get(edge.id);
    if (base) Object.assign(edge, base);
  });
}

export function isEdgeActive(edge: FieldEdge, field: Field): boolean {
  const from = field.nodes.find((node) => node.id === edge.from);
  const to = field.nodes.find((node) => node.id === edge.to);
  return from?.status === "running" && to?.status === "running";
}

export function nodeMeta(node: FieldNode): string {
  return `${STATUS_LABEL[node.status]} · ${node.rate.toFixed(1)} ${node.unit}`;
}
