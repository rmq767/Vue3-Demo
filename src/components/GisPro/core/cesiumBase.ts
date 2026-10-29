import * as Cesium from "cesium";
import type { FieldData, ImageryStatus } from "../data/types";
import {
  getSceneTheme,
  type ScenePalette,
  type ThemeMode,
} from "../styles/tokens";

const GAODE_URL =
  "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}";

export interface CesiumBase {
  viewer: Cesium.Viewer;
  setUnderground(active: boolean): void;
  getImageryStatus(): ImageryStatus;
  applyTheme(mode: ThemeMode): void;
  destroy(): void;
}

interface CesiumBaseOptions {
  container: HTMLElement;
  field: FieldData;
  theme?: ThemeMode;
  onImagery?: (status: ImageryStatus) => void;
}

function makeGrid(palette: ScenePalette): Cesium.GridImageryProvider {
  return new Cesium.GridImageryProvider({
    cells: 5,
    color: Cesium.Color.fromCssColorString(palette.grid.color).withAlpha(0.14),
    glowColor: Cesium.Color.fromCssColorString(palette.grid.color).withAlpha(0.06),
    backgroundColor: Cesium.Color.fromCssColorString(palette.grid.backgroundColor),
  });
}

export function createCesiumBase(options: CesiumBaseOptions): CesiumBase {
  const { container, field, theme = "light", onImagery } = options;
  let palette = getSceneTheme(theme);

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
    scene3DOnly: true,
    requestRenderMode: false,
    shouldAnimate: false,
    sceneMode: Cesium.SceneMode.SCENE3D,
  });

  const scene = viewer.scene;
  const credit = viewer.cesiumWidget.creditContainer as HTMLElement;
  if (credit) credit.style.display = "none";

  viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 1.25);
  scene.backgroundColor = Cesium.Color.fromCssColorString(palette.sky);
  scene.globe.baseColor = Cesium.Color.fromCssColorString(palette.grid.backgroundColor);
  scene.globe.enableLighting = false;
  scene.globe.depthTestAgainstTerrain = false;
  scene.globe.showGroundAtmosphere = theme === "light";
  scene.globe.maximumScreenSpaceError = 2.2;
  scene.globe.tileCacheSize = 256;
  scene.highDynamicRange = false;
  scene.fog.enabled = false;
  if (scene.skyBox) scene.skyBox.show = false;
  if (scene.sun) scene.sun.show = false;
  if (scene.moon) scene.moon.show = false;
  if (scene.skyAtmosphere) {
    scene.skyAtmosphere.show = theme === "light";
    scene.skyAtmosphere.hueShift = -0.08;
    scene.skyAtmosphere.saturationShift = -0.25;
    scene.skyAtmosphere.brightnessShift = 0.08;
  }
  scene.postProcessStages.fxaa.enabled = true;

  scene.screenSpaceCameraController.enableInputs = false;
  viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
  );

  let imageryStatus: ImageryStatus = "loading";
  const setImageryStatus = (status: ImageryStatus): void => {
    if (imageryStatus === status) return;
    imageryStatus = status;
    onImagery?.(status);
  };

  let gridLayer: Cesium.ImageryLayer | null = viewer.imageryLayers.addImageryProvider(
    makeGrid(palette),
  );
  viewer.imageryLayers.lowerToBottom(gridLayer);

  const gaodeProvider = new Cesium.UrlTemplateImageryProvider({
    url: GAODE_URL,
    maximumLevel: 18,
    credit: new Cesium.Credit("Imagery © AMap"),
  });
  const imageryLayer = viewer.imageryLayers.addImageryProvider(gaodeProvider);
  imageryLayer.brightness = palette.imagery.brightness;
  imageryLayer.contrast = palette.imagery.contrast;
  imageryLayer.saturation = palette.imagery.saturation;
  imageryLayer.gamma = palette.imagery.gamma;
  imageryLayer.alpha = palette.imagery.alpha;

  let imageryFailed = false;
  gaodeProvider.errorEvent.addEventListener(() => {
    if (imageryFailed) return;
    imageryFailed = true;
    imageryLayer.show = false;
    setImageryStatus("offline");
  });
  const statusTimer = window.setTimeout(() => {
    if (!imageryFailed) setImageryStatus("gaode");
  }, 1200);

  const rebuildGrid = (next: ScenePalette): void => {
    if (gridLayer) viewer.imageryLayers.remove(gridLayer, true);
    gridLayer = viewer.imageryLayers.addImageryProvider(makeGrid(next));
    viewer.imageryLayers.lowerToBottom(gridLayer);
  };

  let underground = false;
  const applyTheme = (mode: ThemeMode): void => {
    palette = getSceneTheme(mode);
    scene.backgroundColor = Cesium.Color.fromCssColorString(
      underground ? palette.grid.backgroundColor : palette.sky,
    );
    scene.globe.baseColor = Cesium.Color.fromCssColorString(palette.grid.backgroundColor);
    scene.globe.show = !underground;
    scene.globe.showGroundAtmosphere = mode === "light" && !underground;
    if (scene.skyAtmosphere) scene.skyAtmosphere.show = mode === "light";
    imageryLayer.brightness = palette.imagery.brightness;
    imageryLayer.contrast = palette.imagery.contrast;
    imageryLayer.saturation = palette.imagery.saturation;
    imageryLayer.gamma = palette.imagery.gamma;
    imageryLayer.alpha = palette.imagery.alpha;
    rebuildGrid(palette);
    scene.requestRender();
  };

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(field.center.lon, field.center.lat, 80_000),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-50),
      roll: 0,
    },
  });

  return {
    viewer,
    setUnderground: (active: boolean) => {
      underground = active;
      scene.globe.show = !active;
      // 不能用 visibility:hidden：轨道拖拽绑在该画布上，隐藏后无法接收指针事件。
      container.style.opacity = active ? "0" : "1";
      container.style.visibility = "";
      scene.backgroundColor = Cesium.Color.fromCssColorString(
        active ? palette.grid.backgroundColor : palette.sky,
      );
      scene.requestRender();
    },
    getImageryStatus: () => imageryStatus,
    applyTheme,
    destroy: () => {
      window.clearTimeout(statusTimer);
      if (!viewer.isDestroyed()) viewer.destroy();
    },
  };
}
