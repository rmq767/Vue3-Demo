import * as THREE from "three";
import { TOKENS } from "../styles/tokens";

function rng(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function canvas(size: number): HTMLCanvasElement {
  const element = document.createElement("canvas");
  element.width = size;
  element.height = size;
  return element;
}

function texture(
  element: HTMLCanvasElement,
  repeat = 1,
  colorSpace: THREE.ColorSpace = THREE.SRGBColorSpace,
): THREE.CanvasTexture {
  const map = new THREE.CanvasTexture(element);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat, repeat);
  map.colorSpace = colorSpace;
  map.anisotropy = 4;
  return map;
}

function sandTexture(): THREE.CanvasTexture {
  const size = 512;
  const element = canvas(size);
  const ctx = element.getContext("2d");
  if (!ctx) return texture(element, 6);
  const random = rng(11);
  ctx.fillStyle = "#927b5c";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 90; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = 20 + random() * 100;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, random() > 0.5 ? "rgba(168,143,105,.34)" : "rgba(92,72,52,.3)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  for (let i = 0; i < 7000; i += 1) {
    const shade = 90 + Math.floor(random() * 130);
    ctx.fillStyle = `rgba(${shade},${Math.floor(shade * 0.84)},${Math.floor(shade * 0.63)},${0.1 + random() * 0.18})`;
    ctx.fillRect(random() * size, random() * size, 1 + random() * 1.4, 1 + random() * 1.4);
  }
  return texture(element, 6);
}

function rockTexture(): THREE.CanvasTexture {
  const size = 512;
  const element = canvas(size);
  const ctx = element.getContext("2d");
  if (!ctx) return texture(element, 4);
  const random = rng(23);
  ctx.fillStyle = "#3f4449";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i += 1) {
    const shade = 42 + Math.floor(random() * 80);
    ctx.fillStyle = `rgba(${shade},${shade + 3},${shade + 5},${0.2 + random() * 0.4})`;
    const x = random() * size;
    const y = random() * size;
    const w = 1 + random() * 8;
    const h = 1 + random() * 4;
    ctx.fillRect(x, y, w, h);
  }
  return texture(element, 3);
}

function steelTexture(): THREE.CanvasTexture {
  const size = 256;
  const element = canvas(size);
  const ctx = element.getContext("2d");
  if (!ctx) return texture(element, 2);
  const random = rng(37);
  ctx.fillStyle = "#53616a";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 300; i += 1) {
    ctx.strokeStyle = `rgba(${130 + random() * 70},${150 + random() * 60},${160 + random() * 50},${0.05 + random() * 0.16})`;
    ctx.lineWidth = random() * 1.4;
    ctx.beginPath();
    const x = random() * size;
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (random() * 8 - 4), size);
    ctx.stroke();
  }
  return texture(element, 2);
}

function rustTexture(): THREE.CanvasTexture {
  const size = 256;
  const element = canvas(size);
  const ctx = element.getContext("2d");
  if (!ctx) return texture(element, 2);
  const random = rng(41);
  ctx.fillStyle = "#8b4f2c";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 240; i += 1) {
    const radius = 2 + random() * 18;
    const x = random() * size;
    const y = random() * size;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${130 + random() * 60},${60 + random() * 30},${25 + random() * 20},.55)`);
    gradient.addColorStop(1, "rgba(80,40,20,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  return texture(element, 1);
}

function warningTexture(): THREE.CanvasTexture {
  const size = 128;
  const element = canvas(size);
  const ctx = element.getContext("2d");
  if (!ctx) return texture(element, 1);
  ctx.fillStyle = "#121b20";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = TOKENS.colors.oil;
  for (let i = -size; i < size * 2; i += 32) {
    ctx.save();
    ctx.translate(i, 0);
    ctx.rotate(-Math.PI / 4);
    ctx.fillRect(0, -size, 14, size * 3);
    ctx.restore();
  }
  return texture(element, 2);
}

function flameTexture(): THREE.CanvasTexture {
  const size = 128;
  const element = canvas(size);
  const ctx = element.getContext("2d");
  if (!ctx) return texture(element, 1);
  const gradient = ctx.createRadialGradient(size / 2, size * 0.7, 2, size / 2, size * 0.65, size * 0.5);
  gradient.addColorStop(0, "rgba(255,255,235,1)");
  gradient.addColorStop(0.18, "rgba(255,220,130,1)");
  gradient.addColorStop(0.42, "rgba(255,140,45,.86)");
  gradient.addColorStop(0.7, "rgba(190,65,20,.35)");
  gradient.addColorStop(1, "rgba(60,20,8,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return texture(element, 1);
}

function smokeTexture(): THREE.CanvasTexture {
  const size = 128;
  const element = canvas(size);
  const ctx = element.getContext("2d");
  if (!ctx) return texture(element, 1);
  const random = rng(53);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size * 0.5);
  gradient.addColorStop(0, "rgba(190,205,210,.7)");
  gradient.addColorStop(0.55, "rgba(130,148,158,.3)");
  gradient.addColorStop(1, "rgba(80,90,100,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 24; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = 8 + random() * 24;
    const cloud = ctx.createRadialGradient(x, y, 0, x, y, radius);
    cloud.addColorStop(0, `rgba(210,225,230,${0.05 + random() * 0.12})`);
    cloud.addColorStop(1, "rgba(100,110,120,0)");
    ctx.fillStyle = cloud;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  return texture(element, 1);
}

function glowTexture(): THREE.CanvasTexture {
  const size = 128;
  const element = canvas(size);
  const ctx = element.getContext("2d");
  if (!ctx) return texture(element, 1);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.16, "rgba(255,255,255,.85)");
  gradient.addColorStop(0.42, "rgba(255,255,255,.26)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return texture(element, 1);
}

function shadowTexture(): THREE.CanvasTexture {
  const size = 512;
  const element = canvas(size);
  const ctx = element.getContext("2d");
  if (!ctx) return texture(element, 1);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(0,0,0,.72)");
  gradient.addColorStop(0.46, "rgba(0,0,0,.42)");
  gradient.addColorStop(0.78, "rgba(0,0,0,.12)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return texture(element, 1);
}

function noiseTexture(): THREE.CanvasTexture {
  const size = 256;
  const element = canvas(size);
  const ctx = element.getContext("2d");
  if (!ctx) return texture(element, 1, THREE.NoColorSpace);
  const image = ctx.createImageData(size, size);
  const random = rng(71);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.floor(random() * 255);
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return texture(element, 1, THREE.NoColorSpace);
}

export function createMarkerDataUrl(): string {
  const size = 256;
  const element = canvas(size);
  const ctx = element.getContext("2d");
  if (!ctx) return "";
  ctx.clearRect(0, 0, size, size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.06, "rgba(61,225,255,.95)");
  gradient.addColorStop(0.16, "rgba(61,225,255,.32)");
  gradient.addColorStop(0.42, "rgba(61,225,255,.08)");
  gradient.addColorStop(1, "rgba(61,225,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(61,225,255,.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(245,165,36,.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 4, 0, Math.PI * 2);
  ctx.fill();
  return element.toDataURL("image/png");
}

function environmentTexture(renderer: THREE.WebGLRenderer): THREE.Texture {
  const width = 1024;
  const height = 512;
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  const ctx = element.getContext("2d");
  if (!ctx) return new THREE.Texture();

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#020812");
  sky.addColorStop(0.42, "#041c2a");
  sky.addColorStop(0.56, "#0a2f3a");
  sky.addColorStop(0.62, "#2e2a20");
  sky.addColorStop(0.7, "#0b1a21");
  sky.addColorStop(1, "#02060b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const random = rng(83);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 900; i += 1) {
    const x = random() * width;
    const y = random() * height * 0.55;
    const alpha = 0.12 + random() * 0.5;
    ctx.fillStyle = `rgba(200,235,255,${alpha})`;
    ctx.fillRect(x, y, random() > 0.92 ? 2 : 1, random() > 0.92 ? 2 : 1);
  }
  const aurora = ctx.createLinearGradient(0, 40, width, 210);
  aurora.addColorStop(0, "rgba(74,242,200,0)");
  aurora.addColorStop(0.3, "rgba(74,242,200,.18)");
  aurora.addColorStop(0.52, "rgba(61,225,255,.22)");
  aurora.addColorStop(0.7, "rgba(155,140,255,.12)");
  aurora.addColorStop(1, "rgba(74,242,200,0)");
  ctx.fillStyle = aurora;
  ctx.fillRect(0, 20, width, 220);
  ctx.globalCompositeOperation = "source-over";

  const map = new THREE.CanvasTexture(element);
  map.mapping = THREE.EquirectangularReflectionMapping;
  map.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(map).texture;
  map.dispose();
  pmrem.dispose();
  return env;
}

export interface SceneMaterials {
  sand: THREE.MeshStandardMaterial;
  rock: THREE.MeshStandardMaterial;
  steel: THREE.MeshStandardMaterial;
  darkSteel: THREE.MeshStandardMaterial;
  rust: THREE.MeshStandardMaterial;
  paint: THREE.MeshStandardMaterial;
  tank: THREE.MeshStandardMaterial;
  building: THREE.MeshStandardMaterial;
  road: THREE.MeshStandardMaterial;
  warning: THREE.MeshStandardMaterial;
  pipe: THREE.MeshStandardMaterial;
  glowWhite: THREE.MeshBasicMaterial;
  glowCyan: THREE.MeshBasicMaterial;
  glowAmber: THREE.MeshBasicMaterial;
  glowDanger: THREE.MeshBasicMaterial;
  flame: THREE.MeshBasicMaterial;
  smoke: THREE.SpriteMaterial;
  glowSprite: THREE.SpriteMaterial;
  shadow: THREE.MeshBasicMaterial;
  noise: THREE.CanvasTexture;
  environment: THREE.Texture;
  textures: THREE.Texture[];
  dispose(): void;
}

export function createSceneMaterials(renderer: THREE.WebGLRenderer): SceneMaterials {
  const sandMap = sandTexture();
  const rockMap = rockTexture();
  const steelMap = steelTexture();
  const rustMap = rustTexture();
  const warningMap = warningTexture();
  const flameMap = flameTexture();
  const smokeMap = smokeTexture();
  const glowMap = glowTexture();
  const shadowMap = shadowTexture();
  const noise = noiseTexture();
  const environment = environmentTexture(renderer);

  const sand = new THREE.MeshStandardMaterial({
    map: sandMap,
    vertexColors: true,
    color: 0xffffff,
    roughness: 0.96,
    metalness: 0.02,
  });
  const rock = new THREE.MeshStandardMaterial({
    map: rockMap,
    color: 0x9aa1a6,
    roughness: 0.9,
    metalness: 0.05,
  });
  const steel = new THREE.MeshStandardMaterial({
    map: steelMap,
    color: 0xc4d2d9,
    roughness: 0.5,
    metalness: 0.48,
    envMap: environment,
    envMapIntensity: 0.6,
  });
  const darkSteel = new THREE.MeshStandardMaterial({
    color: 0x24323a,
    roughness: 0.55,
    metalness: 0.65,
    envMap: environment,
    envMapIntensity: 0.5,
  });
  const rust = new THREE.MeshStandardMaterial({
    map: rustMap,
    color: 0xa78472,
    roughness: 0.86,
    metalness: 0.24,
  });
  const paint = new THREE.MeshStandardMaterial({
    color: TOKENS.colors.oil,
    roughness: 0.58,
    metalness: 0.3,
    envMap: environment,
    envMapIntensity: 0.4,
  });
  const tank = new THREE.MeshStandardMaterial({
    color: 0xb9c4c5,
    roughness: 0.38,
    metalness: 0.72,
    envMap: environment,
    envMapIntensity: 0.8,
  });
  const building = new THREE.MeshStandardMaterial({
    color: 0x2c3c44,
    roughness: 0.72,
    metalness: 0.18,
  });
  const road = new THREE.MeshStandardMaterial({
    color: 0x1a2329,
    roughness: 0.95,
    metalness: 0.02,
  });
  const warning = new THREE.MeshStandardMaterial({
    map: warningMap,
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.2,
  });
  const pipe = new THREE.MeshStandardMaterial({
    color: 0x4c5b62,
    roughness: 0.48,
    metalness: 0.68,
    envMap: environment,
    envMapIntensity: 0.5,
  });

  const glow = (color: string, opacity = 0.9): THREE.MeshBasicMaterial =>
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

  const flame = new THREE.MeshBasicMaterial({
    map: flameMap,
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const smoke = new THREE.SpriteMaterial({
    map: smokeMap,
    color: 0x8d9ca6,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });

  const glowSprite = new THREE.SpriteMaterial({
    map: glowMap,
    color: new THREE.Color(TOKENS.colors.primary),
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const shadow = new THREE.MeshBasicMaterial({
    map: shadowMap,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const textures = [
    sandMap,
    rockMap,
    steelMap,
    rustMap,
    warningMap,
    flameMap,
    smokeMap,
    glowMap,
    shadowMap,
    noise,
    environment,
  ];

  return {
    sand,
    rock,
    steel,
    darkSteel,
    rust,
    paint,
    tank,
    building,
    road,
    warning,
    pipe,
    glowWhite: glow(TOKENS.colors.white, 0.9),
    glowCyan: glow(TOKENS.colors.primary, 0.9),
    glowAmber: glow(TOKENS.colors.oil, 0.88),
    glowDanger: glow(TOKENS.colors.danger, 0.9),
    flame,
    smoke,
    glowSprite,
    shadow,
    noise,
    environment,
    textures,
    dispose: () => {
      const materials = [
        sand,
        rock,
        steel,
        darkSteel,
        rust,
        paint,
        tank,
        building,
        road,
        warning,
        pipe,
        flame,
        smoke,
        glowSprite,
        shadow,
      ];
      materials.forEach((material) => material.dispose());
      textures.forEach((item) => item.dispose());
    },
  };
}
