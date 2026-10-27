import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { QualityLevel } from "./api";
import { TOKENS } from "../styles/tokens";
import { createSceneMaterials, type SceneMaterials } from "../fx/materials";

const WIDTH = 1920;
const HEIGHT = 1080;

export interface ThreeStage {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  glowRenderer: THREE.WebGLRenderer;
  materials: SceneMaterials;
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  quality: QualityLevel;
  render(): void;
  setQuality(quality: QualityLevel): void;
  resize(): void;
  dispose(): void;
}

export function createThreeStage(host: HTMLElement): ThreeStage {
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
  renderer.toneMappingExposure = 1.36;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "af-canvas af-canvas--solid";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const glowRenderer = new THREE.WebGLRenderer({
    alpha: false,
    antialias: false,
    powerPreference: "high-performance",
    stencil: false,
  });
  glowRenderer.setPixelRatio(1);
  glowRenderer.setSize(800, 450, false);
  glowRenderer.setClearColor(0x000000, 1);
  glowRenderer.outputColorSpace = THREE.SRGBColorSpace;
  glowRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  glowRenderer.toneMappingExposure = 1.18;
  glowRenderer.domElement.className = "af-canvas af-canvas--glow";
  glowRenderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(glowRenderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(new THREE.Color(TOKENS.colors.deep), 0.000017);

  const camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 4, 250_000);
  camera.layers.set(0);

  const materials = createSceneMaterials(renderer);
  scene.environment = materials.environment;

  const hemi = new THREE.HemisphereLight(0x5a9ab0, 0x3a2a14, 1.72);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xd8f4ff, 2.85);
  key.position.set(2400, 4600, 1800);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -2500;
  key.shadow.camera.right = 2500;
  key.shadow.camera.top = 2500;
  key.shadow.camera.bottom = -2500;
  key.shadow.camera.near = 500;
  key.shadow.camera.far = 9000;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 1.8;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x3de1ff, 0.42);
  rim.position.set(-1800, 1500, -2600);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0x9dd8f0, 0.95);
  fill.position.set(200, 1400, 2800);
  scene.add(fill);

  const warm = new THREE.PointLight(0xffad66, 1.35, 2800, 2);
  warm.position.set(0, 880, 0);
  scene.add(warm);

  const glowTarget = new THREE.WebGLRenderTarget(800, 450, {
    type: THREE.HalfFloatType,
    depthBuffer: true,
  });
  const composer = new EffectComposer(glowRenderer, glowTarget);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(400, 225), 0.55, 0.62, 0.32);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let quality: QualityLevel = "high";
  let bloomEnabled = true;

  const render = (): void => {
    camera.layers.set(0);
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(scene, camera);

    camera.layers.set(1);
    if (bloomEnabled) {
      composer.render();
    } else {
      glowRenderer.setRenderTarget(null);
      glowRenderer.clear();
      glowRenderer.render(scene, camera);
    }
    camera.layers.set(0);
  };

  const applyQuality = (level: QualityLevel): void => {
    quality = level;
    if (level === "high") {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.setSize(WIDTH, HEIGHT, false);
      glowRenderer.setSize(800, 450, false);
      composer.setSize(800, 450);
      bloom.resolution.set(400, 225);
      bloom.strength = 0.55;
      bloomEnabled = true;
      renderer.shadowMap.enabled = true;
      key.castShadow = true;
    } else if (level === "medium") {
      renderer.setPixelRatio(1);
      renderer.setSize(WIDTH, HEIGHT, false);
      glowRenderer.setSize(720, 405, false);
      composer.setSize(720, 405);
      bloom.resolution.set(360, 202);
      bloom.strength = 1.1;
      bloomEnabled = true;
      renderer.shadowMap.enabled = false;
      key.castShadow = false;
    } else {
      renderer.setPixelRatio(1);
      renderer.setSize(WIDTH, HEIGHT, false);
      glowRenderer.setSize(640, 360, false);
      composer.setSize(640, 360);
      bloomEnabled = false;
      renderer.shadowMap.enabled = false;
      key.castShadow = false;
    }
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.material) {
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach((item) => {
            item.needsUpdate = true;
          });
        } else {
          material.needsUpdate = true;
        }
      }
    });
  };

  applyQuality("high");

  return {
    scene,
    camera,
    renderer,
    glowRenderer,
    materials,
    composer,
    bloom,
    get quality() {
      return quality;
    },
    render,
    setQuality: applyQuality,
    resize: () => {
      renderer.setSize(WIDTH, HEIGHT, false);
      const scale = quality === "high" ? 800 : quality === "medium" ? 720 : 640;
      composer.setSize(scale, Math.round(scale * 0.5625));
    },
    dispose: () => {
      composer.dispose();
      glowTarget.dispose();
      materials.dispose();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh && !(object as THREE.Points).isPoints && !(object as THREE.Sprite).isSprite) {
          return;
        }
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose());
        } else {
          material?.dispose();
        }
      });
      renderer.dispose();
      glowRenderer.dispose();
      renderer.forceContextLoss();
      glowRenderer.forceContextLoss();
      renderer.domElement.remove();
      glowRenderer.domElement.remove();
    },
  };
}
