import * as THREE from "three";

export interface GroundBackdrop {
  mesh: THREE.Mesh;
  setVisible(visible: boolean): void;
  update(time: number): void;
  dispose(): void;
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

/**
 * 本地烘焙地形底图：不依赖在线瓦片，保证油田永远落在一片有起伏、
 * 有干河道和土路肌理的暗色地形上，而不是浮在纯黑背景里。
 * 这是演示底图，不代表真实卫星影像；HUD 会明确标注。
 */
function createTexture(): THREE.CanvasTexture {
  const size = 2048;
  const element = document.createElement("canvas");
  element.width = size;
  element.height = size;
  const ctx = element.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(element);
  const random = mulberry32(7123);

  ctx.fillStyle = "#655d49";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 320; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = 50 + random() * 260;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const palette =
      random() > 0.58
        ? "rgba(138,122,90,.24)"
        : random() > 0.45
          ? "rgba(68,72,55,.28)"
          : "rgba(154,126,86,.22)";
    gradient.addColorStop(0, palette);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  // 干河道：自然弯曲的浅色/深色带，而不是规则网格
  for (let river = 0; river < 5; river += 1) {
    const startX = random() * size;
    const startY = random() * size;
    const angle = random() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    let x = startX;
    let y = startY;
    let direction = angle;
    for (let step = 0; step < 30; step += 1) {
      direction += (random() - 0.5) * 0.6;
      x += Math.cos(direction) * (40 + random() * 60);
      y += Math.sin(direction) * (30 + random() * 55);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = river % 2 === 0 ? "rgba(146,129,96,.18)" : "rgba(45,51,41,.24)";
    ctx.lineWidth = 10 + random() * 18;
    ctx.stroke();
    ctx.strokeStyle = "rgba(170,153,114,.075)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // 大尺度田块/地表斑块，增加遥感感
  for (let i = 0; i < 46; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const width = 40 + random() * 190;
    const height = 24 + random() * 110;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(random() * Math.PI);
    ctx.fillStyle =
      random() > 0.6 ? "rgba(150,131,91,.075)" : "rgba(45,52,42,.09)";
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.restore();
  }

  ctx.globalCompositeOperation = "destination-in";
  const fade = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.5);
  fade.addColorStop(0, "rgba(255,255,255,1)");
  fade.addColorStop(0.72, "rgba(255,255,255,.96)");
  fade.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createGroundBackdrop(): GroundBackdrop {
  const texture = createTexture();
  const geometry = new THREE.CircleGeometry(26_000, 128);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
    roughness: 0.98,
    metalness: 0,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -14;
  mesh.receiveShadow = true;
  mesh.renderOrder = -2;
  mesh.name = "local-terrain";
  mesh.visible = false;

  return {
    mesh,
    setVisible: (visible: boolean) => {
      mesh.visible = visible;
    },
    update: () => {
      // 本地烘焙底图不做时间动画，避免额外的视觉噪声。
    },
    dispose: () => {
      texture.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
