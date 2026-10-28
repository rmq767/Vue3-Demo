import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { SCENE, TERRAIN_RAMP } from "./tokens";
import { seededRandom } from "./random";

export interface Terrain {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  /** 归一化高程 0..1，不含垂直夸张 */
  normalizedAt(x: number, z: number): number;
  /** 当前实际高程，米 */
  heightAt(x: number, z: number): number;
  setExaggeration(value: number): void;
  getExaggeration(): number;
  setWireframe(on: boolean): void;
}

const OCTAVES = 5;

/**
 * 地形高程场：5 度 fBm 单纯形噪声，纯解析函数，
 * 因此「网格上的点」和「任意坐标查询」永远给出同一个值——
 * 台站、井口、拾取读数都靠这一点落到正确高程。
 */
export function createTerrain(): Terrain {
  const noise = new SimplexNoise(seededRandom(SCENE.seed));
  let exaggeration = 1;

  const fbm = (x: number, z: number): number => {
    let amplitude = 1;
    let frequency = 1;
    let sum = 0;
    let norm = 0;
    for (let i = 0; i < OCTAVES; i++) {
      sum += amplitude * noise.noise(x * frequency, z * frequency);
      norm += amplitude;
      amplitude *= 0.5;
      frequency *= 2.03;
    }
    return sum / norm;
  };

  const normalizedAt = (x: number, z: number): number => {
    const n = fbm(x * SCENE.baseFrequency, z * SCENE.baseFrequency);
    // 幂曲线压谷抬梁，避免纯噪声的糊状起伏
    return THREE.MathUtils.clamp(Math.pow((n + 1) / 2, 1.45), 0, 1);
  };

  const heightAt = (x: number, z: number): number =>
    normalizedAt(x, z) * SCENE.relief * exaggeration;

  const segX = SCENE.segments;
  const segZ = Math.max(
    2,
    Math.round(SCENE.segments * (SCENE.depth / SCENE.width))
  );
  const geometry = new THREE.PlaneGeometry(
    SCENE.width,
    SCENE.depth,
    segX,
    segZ
  );
  geometry.rotateX(-Math.PI / 2);

  const stops = TERRAIN_RAMP.map((s) => ({ at: s.at, color: new THREE.Color(s.color) }));
  const scratch = new THREE.Color();
  const rampInto = (t: number): THREE.Color => {
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i].at || i === stops.length - 1) {
        const span = stops[i].at - stops[i - 1].at;
        scratch.lerpColors(stops[i - 1].color, stops[i].color, span === 0 ? 0 : (t - stops[i - 1].at) / span);
        return scratch;
      }
    }
    return stops[0].color;
  };

  const position = geometry.attributes.position as THREE.BufferAttribute;
  const color = new THREE.BufferAttribute(
    new Float32Array(position.count * 3),
    3
  );
  geometry.setAttribute("color", color);

  const applyHeights = () => {
    for (let i = 0; i < position.count; i++) {
      position.setY(i, heightAt(position.getX(i), position.getZ(i)));
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  const applyColors = () => {
    for (let i = 0; i < position.count; i++) {
      const c = rampInto(normalizedAt(position.getX(i), position.getZ(i)));
      color.setXYZ(i, c.r, c.g, c.b);
    }
    color.needsUpdate = true;
  };

  applyHeights();
  applyColors();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "terrain";
  mesh.userData.kind = "terrain";
  mesh.receiveShadow = true;
  mesh.castShadow = true;

  return {
    mesh,
    material,
    normalizedAt,
    heightAt,
    setExaggeration(value: number) {
      exaggeration = value;
      applyHeights();
    },
    getExaggeration: () => exaggeration,
    setWireframe(on: boolean) {
      material.wireframe = on;
    },
  };
}
