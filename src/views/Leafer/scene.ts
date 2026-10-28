import { Ellipse, Group, Path, Rect, Text } from "leafer-ui";
import {
  MEDIUM_LABEL,
  STATUS_LABEL,
  isEdgeActive,
  nodeMeta,
} from "./data";
import {
  COLORS,
  DRAG_BOUNDS,
  FONT_BODY,
  FONT_DISPLAY,
  FONT_MONO,
  GRID,
  LABEL_WIDTH,
  MEDIUM_COLOR,
  SHEET,
  STATUS_COLOR,
} from "./theme";
import {
  arrowAt,
  buildRoute,
  buildRoundedPath,
  labelAnchor,
  portPoint,
} from "./routing";
import type {
  EdgeView,
  Field,
  FieldEdge,
  FieldNode,
  NodeView,
  Point,
  SceneHandles,
  Selection,
} from "./types";

export function buildScene(field: Field): SceneHandles {
  const world = new Group({ x: 0, y: 0 });
  const paper = new Group();
  const edgeLayer = new Group();
  const nodeLayer = new Group();
  const overlay = new Group({ hittable: false });
  const selection = new Group({ hittable: false });
  const labels: (Text | Group)[] = [];

  const grid = buildPaper(paper);

  const nodes = new Map<string, NodeView>();
  field.nodes.forEach((node) => {
    const view = createNodeView(node, labels);
    nodes.set(node.id, view);
    nodeLayer.add(view.group);
  });

  const edges = new Map<string, EdgeView>();
  field.edges.forEach((edge) => {
    const view = createEdgeView(edge, field, labels);
    edges.set(edge.id, view);
    edgeLayer.add(view.group);
  });

  overlay.add(selection);
  world.add([paper, edgeLayer, nodeLayer, overlay]);

  return {
    world,
    paper,
    grid,
    edgeLayer,
    nodeLayer,
    overlay,
    selection,
    nodes,
    edges,
    labels,
  };
}

export function renderNode(scene: SceneHandles, node: FieldNode): void {
  const view = scene.nodes.get(node.id);
  if (!view) return;

  view.group.set({
    x: node.x - view.groupWidth / 2,
    y: node.y - node.height / 2,
  });
  view.tagText.text = node.tag;
  view.metaText.text = nodeMeta(node);
  view.metaText.fill = STATUS_COLOR[node.status];
  view.statusDot.fill = STATUS_COLOR[node.status];
}

export function renderEdge(
  scene: SceneHandles,
  edge: FieldEdge,
  field: Field
): void {
  const view = scene.edges.get(edge.id);
  if (!view) return;
  applyEdgeGeometry(view, edge, field);
  applyFlowStyle(view, edge, field);
}

export function renderConnectedEdges(
  scene: SceneHandles,
  field: Field,
  nodeId: string
): void {
  field.edges.forEach((edge) => {
    if (edge.from === nodeId || edge.to === nodeId) {
      renderEdge(scene, edge, field);
    }
  });
}

export function applyFlowStyles(scene: SceneHandles, field: Field): void {
  field.edges.forEach((edge) => {
    const view = scene.edges.get(edge.id);
    if (view) applyFlowStyle(view, edge, field);
  });
}

export function renderSelection(
  scene: SceneHandles,
  field: Field,
  selection: Selection
): void {
  scene.selection.removeAll(true);

  if (!selection) return;

  if (selection.type === "node") {
    const node = field.nodes.find((item) => item.id === selection.id);
    if (!node) return;
    const pad = 7;
    const left = node.x - node.width / 2 - pad;
    const top = node.y - node.height / 2 - pad;
    const width = node.width + pad * 2;
    const height = node.height + pad * 2;

    scene.selection.add(
      new Rect({
        x: left,
        y: top,
        width,
        height,
        stroke: COLORS.accent,
        strokeWidth: 1.4,
        dashPattern: [5, 4],
      })
    );

    const chipWidth = 62;
    const chip = new Rect({
      x: left,
      y: top - 17,
      width: chipWidth,
      height: 14,
      fill: COLORS.accent,
      cornerRadius: 1,
    });
    const chipText = new Text({
      x: left,
      y: top - 15.5,
      width: chipWidth,
      text: "SELECTED",
      textAlign: "center",
      fontFamily: FONT_MONO,
      fontSize: 7,
      letterSpacing: 0.8,
      fill: COLORS.white,
    });
    scene.selection.add([chip, chipText]);

    const corners: Point[] = [
      { x: left, y: top },
      { x: left + width, y: top },
      { x: left, y: top + height },
      { x: left + width, y: top + height },
    ];
    corners.forEach((corner) => {
      scene.selection.add(
        new Rect({
          x: corner.x - 3,
          y: corner.y - 3,
          width: 6,
          height: 6,
          fill: COLORS.sheet,
          stroke: COLORS.accent,
          strokeWidth: 1.2,
        })
      );
    });
    return;
  }

  const edge = field.edges.find((item) => item.id === selection.id);
  if (!edge) return;
  const view = scene.edges.get(edge.id);
  if (!view) return;

  const points = edgePoints(edge, field);
  if (!points) return;
  const d = buildRoundedPath(points, 10);

  scene.selection.add([
    new Path({
      path: d,
      stroke: COLORS.accent,
      strokeWidth: 5,
      opacity: 0.32,
    }),
    new Path({
      path: d,
      stroke: COLORS.accent,
      strokeWidth: 1.6,
      dashPattern: [6, 4],
    }),
  ]);

  const anchor = labelAnchor(points);
  scene.selection.add(
    new Ellipse({
      x: anchor.point.x - 4,
      y: anchor.point.y - 4,
      width: 8,
      height: 8,
      fill: COLORS.accent,
      stroke: COLORS.sheet,
      strokeWidth: 2,
    })
  );
}

export function setLabelsVisible(
  scene: SceneHandles,
  visible: boolean
): void {
  scene.labels.forEach((label) => {
    label.visible = visible;
  });
}

function buildPaper(paper: Group): Group {
  const margin = SHEET.margin;

  paper.add([
    new Rect({
      x: 0,
      y: 0,
      width: SHEET.width,
      height: SHEET.height,
      fill: COLORS.sheet,
      hittable: false,
    }),
    new Rect({
      x: margin,
      y: margin,
      width: SHEET.width - margin * 2,
      height: SHEET.height - margin * 2,
      stroke: COLORS.frame,
      strokeWidth: 1.2,
      hittable: false,
    }),
  ]);

  const grid = buildGrid();
  paper.add(grid);

  const title = new Text({
    x: 48,
    y: 42,
    text: "井场 07 集输管网组态图",
    fontFamily: FONT_DISPLAY,
    fontSize: 23,
    fontWeight: 600,
    letterSpacing: 0.6,
    fill: COLORS.ink,
  });
  const subtitle = new Text({
    x: 48,
    y: 78,
    text: "WELL PAD 07 · GATHERING NETWORK SCHEMATIC",
    fontFamily: FONT_DISPLAY,
    fontSize: 9,
    letterSpacing: 2.2,
    fill: COLORS.inkSoft,
  });
  paper.add([
    title,
    subtitle,
    linePath("M48 96 L212 96", COLORS.accent, 2),
  ]);

  paper.add(buildLegend());
  paper.add(buildSectionLabel(166, 112, "01", "生产井区", "WELL PAD"));
  paper.add(buildSectionLabel(470, 112, "02", "集输与分离", "GATHERING"));
  paper.add(buildSectionLabel(855, 112, "03", "计量与外输", "METERING"));
  paper.add(
    new Rect({
      x: 160,
      y: 150,
      width: 190,
      height: 580,
      stroke: COLORS.frame,
      strokeWidth: 1,
      dashPattern: [5, 5],
      hittable: false,
    })
  );

  paper.add(buildTitleBlock());
  paper.add(buildFooterNote());
  return grid;
}

function buildGrid(): Group {
  const group = new Group({ hittable: false });
  const left = 32;
  const top = 32;
  const right = SHEET.width - 32;
  const bottom = SHEET.height - 32;

  let minor = "";
  let major = "";

  for (let x = left; x <= right; x += GRID.minor) {
    const d = `M${x} ${top} L${x} ${bottom}`;
    if (x % GRID.major === 0) major += d;
    else minor += d;
  }
  for (let y = top; y <= bottom; y += GRID.minor) {
    const d = `M${left} ${y} L${right} ${y}`;
    if (y % GRID.major === 0) major += d;
    else minor += d;
  }

  group.add([
    linePath(minor, COLORS.grid, 1),
    linePath(major, COLORS.gridMajor, 1),
  ]);
  return group;
}

function buildLegend(): Group {
  const group = new Group({ x: 1000, y: 44, hittable: false });
  group.add(
    new Text({
      x: 0,
      y: -16,
      text: "图例 / LEGEND",
      fontFamily: FONT_DISPLAY,
      fontSize: 8,
      letterSpacing: 1.6,
      fill: COLORS.inkFaint,
    })
  );

  const media: { label: string; color: string }[] = [
    { label: MEDIUM_LABEL.mixed, color: MEDIUM_COLOR.mixed },
    { label: MEDIUM_LABEL.oil, color: MEDIUM_COLOR.oil },
    { label: MEDIUM_LABEL.gas, color: MEDIUM_COLOR.gas },
    { label: MEDIUM_LABEL.water, color: MEDIUM_COLOR.water },
  ];
  media.forEach((item, index) => {
    const x = index * 92;
    group.add([
      linePath(`M${x} 7 L${x + 20} 7`, item.color, 2),
      new Text({
        x: x + 27,
        y: 0,
        text: item.label,
        fontFamily: FONT_BODY,
        fontSize: 10,
        fill: COLORS.inkSoft,
      }),
    ]);
  });

  const statuses = ["running", "standby", "maintenance"] as const;
  statuses.forEach((status, index) => {
    const x = index * 88;
    group.add([
      new Ellipse({
        x,
        y: 26,
        width: 7,
        height: 7,
        fill: STATUS_COLOR[status],
      }),
      new Text({
        x: x + 13,
        y: 23,
        text: STATUS_LABEL[status],
        fontFamily: FONT_BODY,
        fontSize: 9,
        fill: COLORS.inkSoft,
      }),
    ]);
  });

  return group;
}

function buildSectionLabel(
  x: number,
  y: number,
  index: string,
  title: string,
  english: string
): Group {
  const group = new Group({ x, y, hittable: false });
  group.add([
    new Text({
      x: 0,
      y: 1,
      text: index,
      fontFamily: FONT_DISPLAY,
      fontSize: 9,
      fontWeight: 600,
      fill: COLORS.accent,
    }),
    new Text({
      x: 22,
      y: 0,
      text: title,
      fontFamily: FONT_BODY,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 1,
      fill: COLORS.ink,
    }),
    new Text({
      x: 22,
      y: 17,
      text: english,
      fontFamily: FONT_DISPLAY,
      fontSize: 7,
      letterSpacing: 1.4,
      fill: COLORS.inkFaint,
    }),
    linePath("M0 34 L142 34", COLORS.frame, 1, [4, 4]),
  ]);
  return group;
}

function buildTitleBlock(): Group {
  const width = 372;
  const height = 104;
  const group = new Group({ x: 1040, y: 766, hittable: false });

  group.add([
    new Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: COLORS.sheet,
      stroke: COLORS.ink,
      strokeWidth: 1.2,
    }),
    linePath(`M0 48 L${width} 48`, COLORS.ink, 0.8),
    linePath(`M0 76 L${width} 76`, COLORS.ink, 0.8),
    linePath("M236 48 L236 104", COLORS.ink, 0.8),
  ]);

  group.add([
    new Text({
      x: 16,
      y: 10,
      text: "井场 07 集输管网组态图",
      fontFamily: FONT_BODY,
      fontSize: 14,
      fontWeight: 600,
      fill: COLORS.ink,
    }),
    new Text({
      x: 16,
      y: 31,
      text: "WELL PAD 07 · GATHERING NETWORK",
      fontFamily: FONT_DISPLAY,
      fontSize: 8,
      letterSpacing: 1.2,
      fill: COLORS.inkSoft,
    }),
    new Text({
      x: 16,
      y: 56,
      text: "图号  LF-PID-0701",
      fontFamily: FONT_BODY,
      fontSize: 9,
      fill: COLORS.inkSoft,
    }),
    new Text({
      x: 248,
      y: 56,
      text: "比例  NTS",
      fontFamily: FONT_BODY,
      fontSize: 9,
      fill: COLORS.inkSoft,
    }),
    new Text({
      x: 16,
      y: 84,
      text: "版本  REV.C",
      fontFamily: FONT_BODY,
      fontSize: 9,
      fill: COLORS.inkSoft,
    }),
    new Text({
      x: 248,
      y: 84,
      text: "日期  2026-10-28",
      fontFamily: FONT_BODY,
      fontSize: 9,
      fill: COLORS.inkSoft,
    }),
    new Text({
      x: 248,
      y: 12,
      text: "07",
      fontFamily: FONT_DISPLAY,
      fontSize: 23,
      fontWeight: 600,
      fill: COLORS.accent,
    }),
    new Text({
      x: 248,
      y: 36,
      text: "PAD / SCHEMATIC",
      fontFamily: FONT_DISPLAY,
      fontSize: 7,
      letterSpacing: 1.2,
      fill: COLORS.inkFaint,
    }),
  ]);

  return group;
}

function buildFooterNote(): Group {
  const group = new Group({ hittable: false });
  group.add([
    new Ellipse({
      x: 52,
      y: 794,
      width: 30,
      height: 30,
      stroke: COLORS.inkSoft,
      strokeWidth: 1,
    }),
    linePath("M67 817 L67 800", COLORS.ink, 1.2),
    new Path({
      path: "M67 799 L63 805 L71 805 Z",
      fill: COLORS.ink,
    }),
    new Text({
      x: 64,
      y: 819,
      width: 8,
      text: "N",
      textAlign: "center",
      fontFamily: FONT_DISPLAY,
      fontSize: 7,
      fill: COLORS.inkSoft,
    }),
    new Text({
      x: 96,
      y: 796,
      width: 560,
      text: "NOTE · 本图为 Leafer Canvas 交互演示，非施工图；拖拽设备可自动重排管线。",
      fontFamily: FONT_BODY,
      fontSize: 9,
      fill: COLORS.inkFaint,
    }),
  ]);
  return group;
}

function createNodeView(
  node: FieldNode,
  labels: (Text | Group)[]
): NodeView {
  const groupWidth = Math.max(node.width, LABEL_WIDTH);
  const groupHeight = node.height + 46;
  const sx = (groupWidth - node.width) / 2;

  const group = new Group({
    x: node.x - groupWidth / 2,
    y: node.y - node.height / 2,
    width: groupWidth,
    height: groupHeight,
    draggable: true,
    dragBounds: { ...DRAG_BOUNDS },
    data: { nodeId: node.id },
  });

  const hit = new Rect({
    x: 0,
    y: 0,
    width: groupWidth,
    height: node.height,
    fill: "rgba(0,0,0,0.001)",
    data: { nodeId: node.id },
  });

  const statusDot = new Ellipse({
    x: sx + node.width - 6,
    y: 5,
    width: 8,
    height: 8,
    fill: STATUS_COLOR[node.status],
    stroke: COLORS.sheet,
    strokeWidth: 1.6,
    hittable: false,
  });

  const tagText = new Text({
    x: groupWidth / 2 - LABEL_WIDTH / 2,
    y: node.height + 12,
    width: LABEL_WIDTH,
    text: node.tag,
    textAlign: "center",
    fontFamily: FONT_DISPLAY,
    fontSize: 12,
    fontWeight: 600,
    fill: COLORS.ink,
    hittable: false,
  });

  const metaText = new Text({
    x: groupWidth / 2 - LABEL_WIDTH / 2,
    y: node.height + 28,
    width: LABEL_WIDTH,
    text: nodeMeta(node),
    textAlign: "center",
    fontFamily: FONT_BODY,
    fontSize: 10,
    fill: STATUS_COLOR[node.status],
    hittable: false,
  });

  group.add([hit, ...drawSymbol(node, sx), statusDot, tagText, metaText]);
  labels.push(tagText, metaText);

  return { group, tagText, metaText, statusDot, groupWidth };
}

function drawSymbol(node: FieldNode, sx: number): (Rect | Ellipse | Path | Text)[] {
  switch (node.kind) {
    case "wellhead":
      return drawWellhead(sx);
    case "manifold":
      return drawManifold(node, sx);
    case "separator":
      return drawSeparator(node, sx);
    case "meter":
      return drawMeter(node, sx);
    case "tank":
      return drawTank(node, sx);
    case "pump":
      return drawPump(node, sx);
    default:
      return drawTerminal(node, sx);
  }
}

function drawWellhead(sx: number): (Rect | Ellipse | Path | Text)[] {
  return [
    new Rect({
      x: sx + 8,
      y: 56,
      width: 48,
      height: 30,
      fill: COLORS.sheetOff,
      stroke: COLORS.ink,
      strokeWidth: 1.4,
      cornerRadius: 2,
      hittable: false,
    }),
    new Rect({
      x: sx + 28,
      y: 18,
      width: 8,
      height: 38,
      fill: COLORS.ink,
      hittable: false,
    }),
    linePath(`M${sx + 16} 34 L${sx + 48} 34`, COLORS.ink, 1.2),
    new Path({
      path: `M${sx + 19} 27 L${sx + 28} 34 L${sx + 19} 41 Z M${sx + 37} 27 L${sx + 28} 34 L${sx + 37} 41 Z`,
      fill: COLORS.accent,
      hittable: false,
    }),
    new Rect({
      x: sx + 24,
      y: 12,
      width: 16,
      height: 6,
      fill: COLORS.sheetOff,
      stroke: COLORS.ink,
      strokeWidth: 1.2,
      hittable: false,
    }),
    linePath(`M${sx + 56} 73 L${sx + 64} 73`, COLORS.ink, 1.5),
    linePath(`M${sx + 8} 66 L${sx + 56} 66`, COLORS.inkFaint, 1, [3, 3]),
    new Text({
      x: sx + 12,
      y: 68,
      text: "WH",
      fontFamily: FONT_MONO,
      fontSize: 7,
      fill: COLORS.inkSoft,
      hittable: false,
    }),
  ];
}

function drawManifold(node: FieldNode, sx: number): (Rect | Ellipse | Path)[] {
  const parts: (Rect | Ellipse | Path)[] = [
    new Rect({
      x: sx + 8,
      y: 10,
      width: 124,
      height: 44,
      fill: COLORS.sheetOff,
      stroke: COLORS.ink,
      strokeWidth: 1.5,
      cornerRadius: 22,
      hittable: false,
    }),
    linePath(`M${sx + 132} 32 L${sx + node.width} 32`, COLORS.ink, 1.5),
  ];

  [12.8, 25.6, 38.4, 51.2].forEach((y) => {
    parts.push(
      linePath(`M${sx} ${y} L${sx + 8} ${y}`, COLORS.ink, 1.4),
      new Ellipse({
        x: sx + 5,
        y: y - 3,
        width: 6,
        height: 6,
        fill: COLORS.sheet,
        stroke: COLORS.ink,
        strokeWidth: 1,
        hittable: false,
      })
    );
  });

  [40, 72, 104].forEach((x) => {
    parts.push(
      linePath(`M${sx + x} 15 L${sx + x} 49`, COLORS.inkFaint, 0.8, [3, 3])
    );
  });

  return parts;
}

function drawSeparator(
  node: FieldNode,
  sx: number
): (Rect | Ellipse | Path | Text)[] {
  return [
    new Rect({
      x: sx + 10,
      y: 6,
      width: 80,
      height: 136,
      fill: COLORS.sheetOff,
      stroke: COLORS.ink,
      strokeWidth: 1.5,
      cornerRadius: 28,
      hittable: false,
    }),
    new Ellipse({
      x: sx + 10,
      y: 0,
      width: 80,
      height: 14,
      fill: COLORS.sheet,
      stroke: COLORS.ink,
      strokeWidth: 1.2,
      hittable: false,
    }),
    new Ellipse({
      x: sx + 10,
      y: 134,
      width: 80,
      height: 14,
      fill: COLORS.sheet,
      stroke: COLORS.ink,
      strokeWidth: 1.2,
      hittable: false,
    }),
    linePath(`M${sx + 18} 24 L${sx + 82} 24`, COLORS.inkFaint, 1, [4, 3]),
    linePath(`M${sx + 16} 92 L${sx + 84} 92`, COLORS.inkSoft, 1, [6, 3]),
    linePath(`M${sx} 75 L${sx + 10} 75`, COLORS.ink, 1.5),
    linePath(`M${sx + 50} 0 L${sx + 50} 6`, COLORS.ink, 1.5),
    linePath(`M${sx + 90} 37.5 L${sx + node.width} 37.5`, COLORS.ink, 1.5),
    linePath(`M${sx + 50} 148 L${sx + 50} 158`, COLORS.inkSoft, 1.2),
    new Path({
      path: `M${sx + 46} 156 L${sx + 50} 162 L${sx + 54} 156 Z`,
      fill: COLORS.inkSoft,
      hittable: false,
    }),
    new Text({
      x: sx + 68,
      y: 26,
      width: 18,
      text: "气",
      textAlign: "right",
      fontFamily: FONT_BODY,
      fontSize: 8,
      fill: COLORS.inkFaint,
      hittable: false,
    }),
    new Text({
      x: sx + 68,
      y: 78,
      width: 18,
      text: "油",
      textAlign: "right",
      fontFamily: FONT_BODY,
      fontSize: 8,
      fill: COLORS.inkFaint,
      hittable: false,
    }),
    new Text({
      x: sx + 68,
      y: 108,
      width: 18,
      text: "水",
      textAlign: "right",
      fontFamily: FONT_BODY,
      fontSize: 8,
      fill: COLORS.inkFaint,
      hittable: false,
    }),
  ];
}

function drawMeter(node: FieldNode, sx: number): (Rect | Ellipse | Path)[] {
  return [
    new Rect({
      x: sx + 4,
      y: 14,
      width: 88,
      height: 36,
      fill: COLORS.sheetOff,
      stroke: COLORS.ink,
      strokeWidth: 1.5,
      cornerRadius: 2,
      hittable: false,
    }),
    new Ellipse({
      x: sx + 13,
      y: 19,
      width: 26,
      height: 26,
      fill: COLORS.sheet,
      stroke: COLORS.ink,
      strokeWidth: 1.2,
      hittable: false,
    }),
    linePath(`M${sx + 26} 32 L${sx + 34} 24`, COLORS.accent, 1.4),
    new Rect({
      x: sx + 56,
      y: 23,
      width: 28,
      height: 14,
      fill: COLORS.accentSoft,
      stroke: COLORS.hairline,
      strokeWidth: 0.8,
      hittable: false,
    }),
    linePath(`M${sx + 60} 27 L${sx + 80} 27`, COLORS.inkFaint, 1),
    linePath(`M${sx + 60} 32 L${sx + 76} 32`, COLORS.inkFaint, 1),
    linePath(`M${sx} 32 L${sx + 4} 32`, COLORS.ink, 1.5),
    linePath(`M${sx + 92} 32 L${sx + node.width} 32`, COLORS.ink, 1.5),
  ];
}

function drawTank(node: FieldNode, sx: number): (Rect | Ellipse | Path)[] {
  return [
    new Rect({
      x: sx + 10,
      y: 10,
      width: 84,
      height: 108,
      fill: COLORS.sheetOff,
      stroke: COLORS.ink,
      strokeWidth: 1.5,
      cornerRadius: 16,
      hittable: false,
    }),
    new Ellipse({
      x: sx + 10,
      y: 2,
      width: 84,
      height: 14,
      fill: COLORS.sheet,
      stroke: COLORS.ink,
      strokeWidth: 1.2,
      hittable: false,
    }),
    new Rect({
      x: sx + 12,
      y: 68,
      width: 80,
      height: 48,
      fill: "rgba(181,115,37,0.14)",
      cornerRadius: [0, 0, 12, 12],
      hittable: false,
    }),
    linePath(`M${sx + 12} 68 L${sx + 92} 68`, MEDIUM_COLOR.oil, 1),
    linePath(`M${sx} 62 L${sx + 10} 62`, COLORS.ink, 1.5),
    linePath(`M${sx + 94} 62 L${sx + node.width} 62`, COLORS.ink, 1.5),
    linePath(`M${sx + 30} 16 L${sx + 30} 22`, COLORS.inkFaint, 1),
    linePath(`M${sx + 46} 16 L${sx + 46} 22`, COLORS.inkFaint, 1),
    linePath(`M${sx + 62} 16 L${sx + 62} 22`, COLORS.inkFaint, 1),
  ];
}

function drawPump(node: FieldNode, sx: number): (Rect | Ellipse | Path | Text)[] {
  return [
    new Ellipse({
      x: sx + 14,
      y: 14,
      width: 56,
      height: 56,
      fill: COLORS.sheetOff,
      stroke: COLORS.ink,
      strokeWidth: 1.5,
      hittable: false,
    }),
    new Path({
      path: `M${sx + 42} 28 L${sx + 53} 49 L${sx + 31} 49 Z`,
      fill: COLORS.accent,
      opacity: 0.9,
      hittable: false,
    }),
    linePath(`M${sx + 20} 73 L${sx + 64} 73`, COLORS.ink, 2),
    linePath(`M${sx} 42 L${sx + 14} 42`, COLORS.ink, 1.5),
    linePath(`M${sx + 70} 42 L${sx + node.width} 42`, COLORS.ink, 1.5),
    new Text({
      x: sx + 30,
      y: 57,
      width: 24,
      text: "P",
      textAlign: "center",
      fontFamily: FONT_DISPLAY,
      fontSize: 7,
      fill: COLORS.inkSoft,
      hittable: false,
    }),
  ];
}

function drawTerminal(node: FieldNode, sx: number): (Rect | Path | Text)[] {
  return [
    new Rect({
      x: sx + 8,
      y: 22,
      width: 56,
      height: 20,
      fill: COLORS.sheetOff,
      stroke: COLORS.ink,
      strokeWidth: 1.5,
      hittable: false,
    }),
    linePath(`M${sx + 64} 14 L${sx + 64} 50`, COLORS.ink, 2),
    linePath(`M${sx + 72} 32 L${sx + 82} 32`, COLORS.ink, 1.4),
    new Path({
      path: `M${sx + 82} 26 L${sx + 94} 32 L${sx + 82} 38 Z`,
      fill: COLORS.accent,
      hittable: false,
    }),
    linePath(`M${sx} 32 L${sx + 8} 32`, COLORS.ink, 1.5),
    new Text({
      x: sx + 14,
      y: 27,
      text: "EXPORT",
      fontFamily: FONT_MONO,
      fontSize: 7,
      letterSpacing: 0.5,
      fill: COLORS.inkSoft,
      hittable: false,
    }),
  ];
}

function createEdgeView(
  edge: FieldEdge,
  field: Field,
  labels: (Text | Group)[]
): EdgeView {
  const group = new Group({ data: { edgeId: edge.id } });
  const color = MEDIUM_COLOR[edge.medium];
  const points = edgePoints(edge, field) ?? [];
  const d = buildRoundedPath(points, 10);

  const casing = new Path({
    path: d,
    stroke: COLORS.sheet,
    strokeWidth: 6,
    strokeCap: "round",
    strokeJoin: "round",
    hittable: false,
  });
  const line = new Path({
    path: d,
    stroke: color,
    strokeWidth: 2,
    strokeCap: "round",
    strokeJoin: "round",
    hittable: false,
  });
  const hit = new Path({
    path: d,
    stroke: "rgba(0,0,0,0.001)",
    strokeWidth: 16,
    strokeCap: "round",
    strokeJoin: "round",
    hitStroke: "path",
    data: { edgeId: edge.id },
  });

  const arrowPoint = arrowAt(points);
  const arrow = new Path({
    path: "M-4 -3 L4 0 L-4 3 Z",
    x: arrowPoint.point.x,
    y: arrowPoint.point.y,
    rotation: arrowPoint.angle,
    fill: color,
    stroke: COLORS.sheet,
    strokeWidth: 1,
    hittable: false,
  });

  const labelGroup = new Group({ hittable: false });
  const labelText = new Text({
    x: 5,
    y: -6,
    text: "",
    fontFamily: FONT_BODY,
    fontSize: 9,
    fill: COLORS.inkSoft,
    hittable: false,
  });
  const labelBg = new Rect({
    x: 0,
    y: -8,
    width: 10,
    height: 16,
    fill: COLORS.sheet,
    opacity: 0.92,
    cornerRadius: 2,
    hittable: false,
  });
  labelGroup.add([labelBg, labelText]);
  const hasLabel = edge.showLabel !== false;
  labelGroup.visible = hasLabel;
  if (hasLabel) labels.push(labelGroup);

  group.add([casing, line, hit, arrow, labelGroup]);

  const view: EdgeView = {
    group,
    casing,
    line,
    hit,
    arrow,
    labelGroup,
    labelText,
    labelBg,
  };

  applyEdgeGeometry(view, edge, field);
  applyFlowStyle(view, edge, field);
  return view;
}

function applyEdgeGeometry(
  view: EdgeView,
  edge: FieldEdge,
  field: Field
): void {
  const points = edgePoints(edge, field);
  if (!points) return;

  const d = buildRoundedPath(points, 10);
  view.casing.set({ path: d });
  view.line.set({ path: d });
  view.hit.set({ path: d });

  const arrow = arrowAt(points);
  view.arrow.set({
    x: arrow.point.x,
    y: arrow.point.y,
    rotation: arrow.angle,
  });

  const text = `DN${edge.dn} · ${MEDIUM_LABEL[edge.medium]}`;
  const width = approximateTextWidth(text);
  view.labelText.text = text;
  view.labelBg.set({ width });

  const anchor = labelAnchor(points);
  if (anchor.horizontal) {
    view.labelGroup.set({
      x: anchor.point.x - width / 2,
      y: anchor.point.y - 22,
    });
  } else {
    view.labelGroup.set({
      x: anchor.point.x + 10,
      y: anchor.point.y - 8,
    });
  }
}

function applyFlowStyle(
  view: EdgeView,
  edge: FieldEdge,
  field: Field
): void {
  const active = isEdgeActive(edge, field);
  view.line.set({
    stroke: MEDIUM_COLOR[edge.medium],
    dashPattern: active ? [7, 5] : [],
  });
  view.arrow.set({
    fill: MEDIUM_COLOR[edge.medium],
    opacity: active ? 1 : 0.42,
  });
}

function edgePoints(edge: FieldEdge, field: Field): Point[] | null {
  const from = field.nodes.find((node) => node.id === edge.from);
  const to = field.nodes.find((node) => node.id === edge.to);
  if (!from || !to) return null;

  return buildRoute(
    portPoint(from, edge.fromSide, edge.fromOffset ?? 0),
    edge.fromSide,
    portPoint(to, edge.toSide, edge.toOffset ?? 0),
    edge.toSide,
    { via: edge.via }
  );
}

function approximateTextWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    width += /[\u4e00-\u9fa5]/.test(char) ? 10 : 6;
  }
  return width + 14;
}

function linePath(
  d: string,
  color: string,
  width = 1,
  dashPattern?: number[]
): Path {
  return new Path({
    path: d,
    stroke: color,
    strokeWidth: width,
    dashPattern,
    hittable: false,
  });
}

