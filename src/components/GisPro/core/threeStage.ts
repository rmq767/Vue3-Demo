import * as THREE from "three";
import type { QualityLevel } from "./api";
import {
  getSceneTheme,
  type ScenePalette,
  type ThemeMode,
} from "../styles/tokens";
import { createSceneMaterials, type SceneMaterials } from "../fx/materials";

const WIDTH = 1920;
const HEIGHT = 1080;

export interface ThreeStage {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  materials: SceneMaterials;
  quality: QualityLevel;
  render(): void;
  setQuality(quality: QualityLevel): void;
  applyTheme(mode: ThemeMode): void;
  resize(): void;
  dispose(): void;
}

export function createThreeStage(host: HTMLElement, initialTheme: ThemeMode = "light"): ThreeStage {
  let palette: ScenePalette = getSceneTheme(initialTheme);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  renderer.setSize(WIDTH, HEIGHT, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = palette.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "af-canvas af-canvas--solid";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(palette.fog, palette.fogDensity);

  const camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 4, 250_000);
  camera.layers.set(0);

  const materials = createSceneMaterials(palette);

  const hemi = new THREE.HemisphereLight(
    palette.hemiSky,
    palette.hemiGround,
    palette.hemiIntensity,
  );
  scene.add(hemi);

  const key = new THREE.DirectionalLight(palette.sunColor, palette.sunIntensity);
  key.position.set(6000, 9000, 4000);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -12_000;
  key.shadow.camera.right = 12_000;
  key.shadow.camera.top = 12_000;
  key.shadow.camera.bottom = -12_000;
  key.shadow.camera.near = 100;
  key.shadow.camera.far = 30_000;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 2.4;
  scene.add(key);

  const fill = new THREE.DirectionalLight(palette.fillColor, palette.fillIntensity);
  fill.position.set(-5000, 3500, 5000);
  scene.add(fill);

  const shadowGround = new THREE.Mesh(
    new THREE.PlaneGeometry(40_000, 40_000),
    new THREE.ShadowMaterial({
      color: 0x000000,
      opacity: palette.shadowOpacity,
      depthWrite: false,
    }),
  );
  shadowGround.rotation.x = -Math.PI / 2;
  shadowGround.position.y = 0;
  shadowGround.receiveShadow = true;
  shadowGround.name = "shadow-ground";
  scene.add(shadowGround);

  let quality: QualityLevel = "high";

  const applyQuality = (level: QualityLevel): void => {
    quality = level;
    if (level === "high") {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.shadowMap.enabled = true;
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
    } else if (level === "medium") {
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;
      key.castShadow = false;
    } else {
      renderer.setPixelRatio(0.9);
      renderer.shadowMap.enabled = false;
      key.castShadow = false;
    }
    renderer.setSize(WIDTH, HEIGHT, false);
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.material) return;
      const materialList = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materialList.forEach((material) => {
        material.needsUpdate = true;
      });
    });
  };

  applyQuality("high");

  const applyTheme = (mode: ThemeMode): void => {
    palette = getSceneTheme(mode);
    materials.applyTheme(palette);
    scene.fog = new THREE.FogExp2(palette.fog, palette.fogDensity);
    hemi.color.set(palette.hemiSky);
    hemi.groundColor.set(palette.hemiGround);
    hemi.intensity = palette.hemiIntensity;
    key.color.set(palette.sunColor);
    key.intensity = palette.sunIntensity;
    fill.color.set(palette.fillColor);
    fill.intensity = palette.fillIntensity;
    renderer.toneMappingExposure = palette.exposure;
    (shadowGround.material as THREE.ShadowMaterial).opacity = palette.shadowOpacity;
  };

  return {
    scene,
    camera,
    renderer,
    materials,
    get quality() {
      return quality;
    },
    render: () => {
      renderer.render(scene, camera);
    },
    setQuality: applyQuality,
    applyTheme,
    resize: () => {
      renderer.setSize(WIDTH, HEIGHT, false);
    },
    dispose: () => {
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh && !(object as THREE.Points).isPoints && !(object as THREE.Sprite).isSprite) {
          return;
        }
        mesh.geometry?.dispose();
      });
      (shadowGround.material as THREE.Material).dispose();
      materials.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
