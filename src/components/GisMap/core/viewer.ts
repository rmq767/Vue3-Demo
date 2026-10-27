import * as Cesium from "cesium";

export type BasemapMode = "dark" | "satellite";

export interface GisViewerContext {
  viewer: Cesium.Viewer;
  setBasemap: (mode: BasemapMode) => void;
  setBloom: (enabled: boolean) => void;
  setUnderground: (enabled: boolean) => void;
  morph: (to2D: boolean, onComplete: () => void) => void;
  destroy: () => void;
}

const TILE_HOST = "https://webst02.is.autonavi.com/appmaptile";

function tileUrl(style: number): string {
  return `${TILE_HOST}?style=${style}&x={x}&y={y}&z={z}`;
}

interface LayerTuning {
  brightness: number;
  contrast: number;
  saturation: number;
  gamma: number;
}

const DARK_BASE: LayerTuning = { brightness: 0.24, contrast: 1.42, saturation: 0.15, gamma: 0.55 };
const DARK_LABEL: LayerTuning = { brightness: 0.5, contrast: 1.15, saturation: 0.25, gamma: 0.75 };
const SAT_BASE: LayerTuning = { brightness: 0.42, contrast: 1.25, saturation: 0.42, gamma: 0.7 };
const SAT_LABEL: LayerTuning = { brightness: 0.52, contrast: 1.1, saturation: 0.3, gamma: 0.8 };

export function createGisViewer(container: HTMLElement): GisViewerContext {
  const viewer = new Cesium.Viewer(container, {
    baseLayer: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    baseLayerPicker: false,
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    scene3DOnly: false,
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity,
    sceneMode: Cesium.SceneMode.SCENE3D,
  });

  const scene = viewer.scene;

  (viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none";
  viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 1.5);

  scene.backgroundColor = Cesium.Color.fromCssColorString("#030a12");
  scene.globe.baseColor = Cesium.Color.fromCssColorString("#04101c");
  scene.globe.enableLighting = false;
  scene.globe.depthTestAgainstTerrain = false;
  scene.globe.showGroundAtmosphere = false;
  scene.fog.enabled = false;
  if (scene.skyBox) scene.skyBox.show = false;
  if (scene.sun) scene.sun.show = false;
  if (scene.moon) scene.moon.show = false;
  const atmosphere = scene.skyAtmosphere;
  if (atmosphere) {
    atmosphere.show = true;
    atmosphere.hueShift = -0.15;
    atmosphere.saturationShift = -0.45;
    atmosphere.brightnessShift = -0.32;
  }
  scene.highDynamicRange = false;
  scene.postProcessStages.fxaa.enabled = true;

  const bloom = scene.postProcessStages.bloom;
  bloom.enabled = false;
  bloom.uniforms.glowOnly = false;
  bloom.uniforms.contrast = 160;
  bloom.uniforms.brightness = -0.4;
  bloom.uniforms.delta = 1;
  bloom.uniforms.sigma = 3;
  bloom.uniforms.stepSize = 1.5;

  scene.screenSpaceCameraController.minimumZoomDistance = 120;
  scene.screenSpaceCameraController.maximumZoomDistance = 12_000_000;

  viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
  );

  const addTileLayer = (style: number, tuning: LayerTuning) => {
    const layer = viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: tileUrl(style),
        maximumLevel: 18,
      }),
    );
    layer.brightness = tuning.brightness;
    layer.contrast = tuning.contrast;
    layer.saturation = tuning.saturation;
    layer.gamma = tuning.gamma;
    layer.show = false;
    return layer;
  };

  const darkBase = addTileLayer(7, DARK_BASE);
  const darkLabel = addTileLayer(8, DARK_LABEL);
  const satBase = addTileLayer(6, SAT_BASE);
  const satLabel = addTileLayer(8, SAT_LABEL);

  const setBasemap = (mode: BasemapMode) => {
    const dark = mode === "dark";
    darkBase.show = dark;
    darkLabel.show = dark;
    satBase.show = !dark;
    satLabel.show = !dark;
    viewer.imageryLayers.raiseToTop(darkLabel);
    viewer.imageryLayers.raiseToTop(satLabel);
    viewer.imageryLayers.raiseToTop(dark ? darkLabel : satLabel);
    scene.requestRender();
  };
  setBasemap("dark");

  const setBloom = (enabled: boolean) => {
    bloom.enabled = enabled;
    scene.requestRender();
  };

  const setUnderground = (enabled: boolean) => {
    const translucency = scene.globe.translucency;
    const allowed = enabled && scene.mode === Cesium.SceneMode.SCENE3D;
    translucency.enabled = allowed;
    if (allowed) {
      translucency.frontFaceAlpha = 0.5;
      translucency.frontFaceAlphaByDistance = new Cesium.NearFarScalar(2500, 0.26, 120000, 0.92);
      translucency.backFaceAlpha = 0.08;
      translucency.backFaceAlphaByDistance = new Cesium.NearFarScalar(2500, 0.02, 120000, 0.12);
    }
    scene.requestRender();
  };

  let morphing = false;
  const morph = (to2D: boolean, onComplete: () => void) => {
    if (morphing) return;
    morphing = true;
    scene.requestRenderMode = false;
    const finish = () => {
      scene.morphComplete.removeEventListener(finish);
      scene.requestRenderMode = true;
      morphing = false;
      scene.requestRender();
      onComplete();
    };
    scene.morphComplete.addEventListener(finish);
    if (to2D) scene.morphTo2D(1.2);
    else scene.morphTo3D(1.2);
  };

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(104.26, 31.0, 520_000),
    orientation: {
      heading: 0,
      pitch: -Cesium.Math.PI_OVER_TWO,
      roll: 0,
    },
  });

  return {
    viewer,
    setBasemap,
    setBloom,
    setUnderground,
    morph,
    destroy: () => viewer.destroy(),
  };
}
