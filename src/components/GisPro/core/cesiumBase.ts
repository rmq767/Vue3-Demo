import * as Cesium from "cesium";
import type { FieldData, ImageryStatus } from "../data/types";
import { TOKENS } from "../styles/tokens";
import { createMarkerDataUrl } from "../fx/materials";

const ESRI_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const GAODE_URL =
  "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}";

export interface CesiumBase {
  viewer: Cesium.Viewer;
  setMarkerVisible(visible: boolean): void;
  getImageryStatus(): ImageryStatus;
  destroy(): void;
}

interface CesiumBaseOptions {
  container: HTMLElement;
  field: FieldData;
  onImagery?: (status: ImageryStatus) => void;
}

export function createCesiumBase(options: CesiumBaseOptions): CesiumBase {
  const { container, field, onImagery } = options;

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
  scene.backgroundColor = Cesium.Color.fromCssColorString(TOKENS.colors.void);
  scene.globe.baseColor = Cesium.Color.fromCssColorString("#0a2634");
  scene.globe.enableLighting = false;
  scene.globe.depthTestAgainstTerrain = false;
  scene.globe.showGroundAtmosphere = true;
  scene.globe.maximumScreenSpaceError = 2.2;
  scene.globe.tileCacheSize = 256;
  scene.highDynamicRange = false;
  scene.fog.enabled = false;
  if (scene.skyBox) scene.skyBox.show = true;
  if (scene.sun) scene.sun.show = false;
  if (scene.moon) scene.moon.show = false;
  if (scene.skyAtmosphere) {
    scene.skyAtmosphere.show = true;
    scene.skyAtmosphere.hueShift = -0.22;
    scene.skyAtmosphere.saturationShift = -0.35;
    scene.skyAtmosphere.brightnessShift = -0.32;
  }
  scene.postProcessStages.fxaa.enabled = true;

  scene.screenSpaceCameraController.enableInputs = false;
  viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
  );

  const grid = new Cesium.GridImageryProvider({
    cells: 6,
    color: Cesium.Color.fromCssColorString(TOKENS.colors.primary).withAlpha(0.26),
    glowColor: Cesium.Color.fromCssColorString(TOKENS.colors.primary).withAlpha(0.32),
    backgroundColor: Cesium.Color.fromCssColorString("#06141d"),
  });
  viewer.imageryLayers.addImageryProvider(grid);

  let imageryStatus: ImageryStatus = "loading";
  const setImageryStatus = (status: ImageryStatus): void => {
    imageryStatus = status;
    onImagery?.(status);
  };

  const esriProvider = new Cesium.UrlTemplateImageryProvider({
    url: ESRI_URL,
    maximumLevel: 19,
    credit: new Cesium.Credit("Imagery © Esri"),
  });
  const esriLayer = viewer.imageryLayers.addImageryProvider(esriProvider);
  esriLayer.brightness = 0.66;
  esriLayer.contrast = 1.18;
  esriLayer.saturation = 0.44;
  esriLayer.gamma = 0.94;
  esriLayer.show = false;

  const gaodeProvider = new Cesium.UrlTemplateImageryProvider({
    url: GAODE_URL,
    maximumLevel: 18,
    credit: new Cesium.Credit("Imagery © AMap"),
  });
  const gaodeLayer = viewer.imageryLayers.addImageryProvider(gaodeProvider);
  gaodeLayer.brightness = 0.64;
  gaodeLayer.contrast = 1.14;
  gaodeLayer.saturation = 0.42;
  gaodeLayer.gamma = 0.98;
  gaodeLayer.show = false;

  let gaodeActive = true;
  let esriActive = false;
  const activateEsri = (): void => {
    if (esriActive) return;
    gaodeActive = false;
    gaodeLayer.show = false;
    esriLayer.show = true;
    esriActive = true;
    setImageryStatus("esri");
  };

  gaodeProvider.errorEvent.addEventListener(() => {
    if (!gaodeActive) return;
    activateEsri();
  });

  esriProvider.errorEvent.addEventListener(() => {
    if (!esriActive) return;
    esriLayer.show = false;
    setImageryStatus("offline");
  });

  const imageryTimer = window.setTimeout(() => {
    if (imageryStatus === "loading") setImageryStatus("gaode");
  }, 2400);

  const marker = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(field.center.lon, field.center.lat, 0),
    billboard: {
      image: createMarkerDataUrl(),
      scale: 1.1,
      scaleByDistance: new Cesium.NearFarScalar(30_000, 0.45, 2_000_000, 1.9),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    },
  });

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      field.center.lon,
      field.center.lat,
      30_000_000,
    ),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-45),
      roll: 0,
    },
  });

  return {
    viewer,
    setMarkerVisible: (visible: boolean) => {
      marker.show = visible;
      scene.requestRender();
    },
    getImageryStatus: () => imageryStatus,
    destroy: () => {
      window.clearTimeout(imageryTimer);
      if (!viewer.isDestroyed()) viewer.destroy();
    },
  };
}
