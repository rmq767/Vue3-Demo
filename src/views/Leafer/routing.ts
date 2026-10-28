import type { FieldNode, Point, PortSide } from "./types";

const SIDE_NORMAL: Record<PortSide, Point> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
};

interface RouteOptions {
  stub?: number;
  via?: number;
}

export function portPoint(
  node: FieldNode,
  side: PortSide,
  offset = 0
): Point {
  const { x, y, width, height } = node;
  if (side === "left") return { x: x - width / 2, y: y + offset * height };
  if (side === "right") return { x: x + width / 2, y: y + offset * height };
  if (side === "top") return { x: x + offset * width, y: y - height / 2 };
  return { x: x + offset * width, y: y + height / 2 };
}

export function buildRoute(
  from: Point,
  fromSide: PortSide,
  to: Point,
  toSide: PortSide,
  options: RouteOptions = {}
): Point[] {
  const stub = options.stub ?? 28;
  const p1 = shift(from, SIDE_NORMAL[fromSide], stub);
  const p3 = shift(to, SIDE_NORMAL[toSide], stub);
  const fromHorizontal = fromSide === "left" || fromSide === "right";
  const toHorizontal = toSide === "left" || toSide === "right";

  let mids: Point[] = [];

  if (fromHorizontal && toHorizontal) {
    const midX = options.via ?? (p1.x + p3.x) / 2;
    mids = [
      { x: midX, y: p1.y },
      { x: midX, y: p3.y },
    ];
  } else if (!fromHorizontal && !toHorizontal) {
    const midY = options.via ?? (p1.y + p3.y) / 2;
    mids = [
      { x: p1.x, y: midY },
      { x: p3.x, y: midY },
    ];
  } else if (fromHorizontal) {
    mids = [{ x: p3.x, y: p1.y }];
  } else {
    mids = [{ x: p1.x, y: p3.y }];
  }

  return simplify([from, p1, ...mids, p3, to]);
}

export function buildRoundedPath(points: Point[], radius = 10): string {
  if (points.length < 2) return "";
  let d = `M${formatPoint(points[0])}`;

  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    const next = points[i + 1];
    const inLength = distance(prev, current);
    const outLength = distance(current, next);
    if (inLength < 0.01 || outLength < 0.01) continue;

    const r = Math.min(radius, inLength / 2, outLength / 2);
    const entry = lerp(current, prev, r / inLength);
    const exit = lerp(current, next, r / outLength);
    d += ` L${formatPoint(entry)} Q${formatPoint(current)} ${formatPoint(exit)}`;
  }

  d += ` L${formatPoint(points[points.length - 1])}`;
  return d;
}

export function pointAtRatio(points: Point[], ratio: number): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return { ...points[0] };

  const total = polylineLength(points);
  if (total < 0.01) return { ...points[0] };

  let target = Math.min(Math.max(ratio, 0), 1) * total;
  for (let i = 1; i < points.length; i += 1) {
    const segment = distance(points[i - 1], points[i]);
    if (target <= segment) {
      return lerp(points[i - 1], points[i], segment ? target / segment : 0);
    }
    target -= segment;
  }
  return { ...points[points.length - 1] };
}

export function directionAtRatio(
  points: Point[],
  ratio: number
): Point {
  if (points.length < 2) return { x: 1, y: 0 };
  const total = polylineLength(points);
  let target = Math.min(Math.max(ratio, 0), 1) * total;
  for (let i = 1; i < points.length; i += 1) {
    const segment = distance(points[i - 1], points[i]);
    if (target <= segment || i === points.length - 1) {
      const length = segment || 1;
      return {
        x: (points[i].x - points[i - 1].x) / length,
        y: (points[i].y - points[i - 1].y) / length,
      };
    }
    target -= segment;
  }
  return { x: 1, y: 0 };
}

export function labelAnchor(points: Point[]): {
  point: Point;
  horizontal: boolean;
} {
  const point = pointAtRatio(points, 0.5);
  const direction = directionAtRatio(points, 0.5);
  return {
    point,
    horizontal: Math.abs(direction.x) >= Math.abs(direction.y),
  };
}

export function arrowAt(points: Point[], ratio = 0.58): {
  point: Point;
  angle: number;
} {
  const point = pointAtRatio(points, ratio);
  const direction = directionAtRatio(points, ratio);
  return {
    point,
    angle: (Math.atan2(direction.y, direction.x) * 180) / Math.PI,
  };
}

export function polylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += distance(points[i - 1], points[i]);
  }
  return total;
}

function simplify(points: Point[]): Point[] {
  const result: Point[] = [];
  for (const point of points) {
    const last = result[result.length - 1];
    if (last && distance(last, point) < 0.01) continue;
    result.push(point);
  }
  for (let i = result.length - 2; i >= 1; i -= 1) {
    const prev = result[i - 1];
    const current = result[i];
    const next = result[i + 1];
    const cross =
      (current.x - prev.x) * (next.y - current.y) -
      (current.y - prev.y) * (next.x - current.x);
    if (Math.abs(cross) < 0.01) result.splice(i, 1);
  }
  return result;
}

function shift(point: Point, normal: Point, distanceValue: number): Point {
  return {
    x: point.x + normal.x * distanceValue,
    y: point.y + normal.y * distanceValue,
  };
}

function lerp(from: Point, to: Point, ratio: number): Point {
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function formatPoint(point: Point): string {
  return `${round(point.x)} ${round(point.y)}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
