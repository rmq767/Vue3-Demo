import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";

export interface ThreeConfig {
  scene: null | THREE.Scene;
  camera: null | THREE.PerspectiveCamera;
  renderder: null | THREE.Renderer;
  cube: null | THREE.Mesh;
  controller: null | OrbitControls;
  material: null | THREE.MeshBasicMaterial;
}
