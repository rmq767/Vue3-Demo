import { onMounted, onUnmounted, shallowRef } from "vue";
import * as Cesium from "cesium";
import SC from "@/assets/geo/四川省1.json";
import * as turf from "@turf/turf";

let targetY = -100.0;
let planeEntities = [];

export const useCesium = (el: string) => {
  const viewer = shallowRef<Cesium.Viewer>();
  /**
   * @description 初始化地图
   */
  const init = async () => {
    viewer.value = new Cesium.Viewer(el, {
      // 是否展示查询按钮 如果设置为false，将不会创建右上角查询(放大镜)按钮。
      geocoder: false,
      //查看器的显示模式 如果设置为false，将不会创建右上角投影方式控件(显示二三维切换按钮)。
      sceneModePicker: false,
      // 是否展示图层选择器 如果设置为false，将不会创建右上角图层按钮。
      baseLayerPicker: false,
      // 是否显示帮助 如果设置为false，则不会创建右上角帮助(问号)按钮。
      navigationHelpButton: false,
      // 是否展示home控件 如果设置为false，将不会创建右上角主页(房子)按钮。
      homeButton: false,
      // 是否展示动画控件 如果设置为false，将不会创建左下角动画小部件。
      animation: false,
      // 是否展示全屏按钮 如果设置为false，将不会创建右下角全屏按钮。
      fullscreenButton: false,
      // 是否展示时间轴 如果设置为false，则不会创建正下方时间轴小部件。
      timeline: false,
      // 是否展示场景控制 为 true 时，每个几何实例将仅以3D渲染以节省GPU内存。
      scene3DOnly: true,
      // 是否点击要素之后展示信息
      infoBox: false,
      // 是否展示场景的底部
      shadows: false,
      // 启用请求渲染模式
      requestRenderMode: true,
      // 初始场景模式 1 2D模式 2 2D循环模式 3 3D模式  Cesium.SceneMode
      sceneMode: Cesium.SceneMode.SCENE3D,
      // 点击选中元素
      selectionIndicator: false,

      // baseLayer: new Cesium.ImageryLayer(
      //   new Cesium.UrlTemplateImageryProvider({
      //     url: "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
      //   })
      // ),
    });
    // 现在垂直地形夸张的操作，默认值0
    viewer.value.scene.verticalExaggeration = 1;
    // 垂直地形夸张相对高度，默认值0
    viewer.value.scene.verticalExaggerationRelativeHeight = 0.1;
    // 去除版权样式
    (viewer.value.cesiumWidget.creditContainer as HTMLElement).style.display =
      "none"; //去除版权样式
    //默认视角定位中国上空
    // viewer.value.camera.setView({
    //   destination: Cesium.Rectangle.fromDegrees(80, 22, 130, 30000),
    // });
    // // 再加上高德影像注记地图;
    // viewer.value.imageryLayers.addImageryProvider(
    //   new Cesium.UrlTemplateImageryProvider({
    //     url: "http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
    //   })
    // );
    // initBox();
    initLabel();
    initBillboard();
    // const model1 = initModel();

    // let direction = 1;
    // const max = 3;
    // const min = 0;
    // const start = () => {
    //   const size = model1!.model!.silhouetteSize?.getValue();
    //   if (direction === -1) {
    //     (model1!.model!.silhouetteSize as unknown as number) -= 0.08;
    //     if (size <= min) {
    //       direction = 1;
    //     }
    //   }
    //   if (direction === 1) {
    //     (model1!.model!.silhouetteSize as unknown as number) += 0.08;
    //     if (size >= max) {
    //       direction = -1;
    //     }
    //   }
    //   if (targetY <= 500) {
    //     targetY += 1;
    //   }
    //   // console.log(targetY);
    //   viewer.value?.scene.requestRender();
    //   requestAnimationFrame(start);
    // };
    // requestAnimationFrame(start);

    addCesiumTerrain(viewer.value!);
    addSCRegion(viewer.value!);
    // try {
    //   const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(3591124);
    //   viewer.value?.scene.primitives.add(tileset);
    //   viewer.value?.zoomTo(
    //     tileset,
    //     new Cesium.HeadingPitchRange(
    //       Cesium.Math.toRadians(0.0),
    //       Cesium.Math.toRadians(-15.0),
    //       200.0
    //     )
    //   );
    // } catch (error) {
    //   console.log(`Error loading tileset: ${error}`);
    // }
  };

  onMounted(() => {
    init();
    initFly();
  });
  onUnmounted(() => {
    viewer.value!.destroy();
  });

  const initBox = () => {
    const position = Cesium.Cartesian3.fromDegrees(103.61, 31.0, 0);
    viewer.value?.entities.add({
      name: "box",
      position: position,
      box: {
        dimensions: new Cesium.Cartesian3(20.0, 20.0, 20.0),
        material: Cesium.Color.BLUE.withAlpha(0.8),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 关键设置：贴地
        outline: true,
        outlineColor: Cesium.Color.BLACK,
      },
    });
  };
  const initLabel = () => {
    const position = Cesium.Cartesian3.fromDegrees(103.61, 31.01, 0);
    viewer.value?.entities.add({
      name: "label",
      position: position,
      label: {
        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1, 1.5e5, 0.5),
        text: "Hello, Cesium!",
        font: "24px sans-serif",
        fillColor: Cesium.Color.BLACK,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 关键设置：贴地
      },
    });
  };
  const initBillboard = () => {
    const position = Cesium.Cartesian3.fromDegrees(103.61, 31.02, 0);
    viewer.value?.entities.add({
      name: "billboard",
      position: position,
      billboard: {
        scale: 0.1,
        scaleByDistance: new Cesium.NearFarScalar(1.0e3, 1.0, 1.0e6, 0.1),
        image:
          "https://fuss10.elemecdn.com/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg",
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 关键设置：贴地
      },
    });
  };

  let clippingPlanes: Cesium.ClippingPlaneCollection;
  const initModel = () => {
    clippingPlanes = new Cesium.ClippingPlaneCollection({
      planes: [
        new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, 0.0, -1.0), 0.0),
      ],
      edgeWidth: 1,
    });

    const position = Cesium.Cartesian3.fromDegrees(103.57, 31.01, 0);
    const model = viewer.value?.entities.add({
      name: "model",
      position: position,
      model: {
        uri: "/three/dpf/大牌坊.gltf",
        scale: 30,
        // color: Cesium.Color.fromAlpha(Cesium.Color.RED, 0.7),
        // colorBlendMode: Cesium.ColorBlendMode.HIGHLIGHT,
        // colorBlendAmount: 0.5,
        silhouetteColor: Cesium.Color.fromAlpha(Cesium.Color.RED, 1),
        silhouetteSize: 1,
        // minimumPixelSize: 128,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 关键设置：贴地
        clippingPlanes: clippingPlanes,
      },
      // orientation: new Cesium.Quaternion(0, 0, 0, 0),
    });
    viewer.value!.trackedEntity = model;

    for (let i = 0; i < clippingPlanes.length; ++i) {
      const plane = clippingPlanes.get(i);
      const planeEntity = viewer.value?.entities.add({
        position: position,
        plane: {
          dimensions: new Cesium.Cartesian2(300.0, 300.0),
          material: Cesium.Color.WHITE.withAlpha(0),
          plane: new Cesium.CallbackProperty(
            createPlaneUpdateFunction(plane),
            false
          ),
          // outline: true,
          // outlineColor: Cesium.Color.WHITE,
        },
      });

      planeEntities.push(planeEntity);
    }

    return model;
  };

  const initFly = () => {
    // Set bounds of our simulation time.
    const start = Cesium.JulianDate.fromDate(new Date(2015, 2, 25, 16));
    const duration = 8;
    const stop = Cesium.JulianDate.addSeconds(
      start,
      duration,
      new Cesium.JulianDate()
    );

    // Make sure viewer is at the desired time.
    viewer.value!.clock.startTime = start.clone();
    viewer.value!.clock.stopTime = stop.clone();
    viewer.value!.clock.currentTime = start.clone();
    viewer.value!.clock.multiplier = 1.0;
    viewer.value!.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.value!.clock.shouldAnimate = true;

    // Set timeline to simulation bounds.
    viewer.value!.timeline?.zoomTo(start, stop);

    // Prepare time samples.
    const times = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0];
    const firstTime = times[0];
    const lastTime = times[times.length - 1];
    const delta = lastTime - firstTime;

    // Prepare point samples. Before and after points are used to
    // calculate the first and last tangents for the spline.
    const before = Cesium.Cartesian3.fromDegrees(103.62, 30.98, 6200.01);
    const points = [
      Cesium.Cartesian3.fromDegrees(103.62, 30.98, 6200.01),
      Cesium.Cartesian3.fromDegrees(103.63, 31.0, 6170.9),
      Cesium.Cartesian3.fromDegrees(103.62, 31.01, 6170.6),
      Cesium.Cartesian3.fromDegrees(103.62, 31.02, 6250.36),
      Cesium.Cartesian3.fromDegrees(103.61, 31.02, 6270.82),
      Cesium.Cartesian3.fromDegrees(103.6, 31.01, 6250.54),
      Cesium.Cartesian3.fromDegrees(103.58, 31.0, 6280.9),
      Cesium.Cartesian3.fromDegrees(103.58, 30.99, 6380.81),
      Cesium.Cartesian3.fromDegrees(103.6, 30.99, 6430.31),
    ];
    const after = Cesium.Cartesian3.fromDegrees(103.61, 31.0, 6430.31);

    // Calculate first and last tangents.
    const firstTangent = Cesium.Cartesian3.subtract(
      points[0],
      before,
      new Cesium.Cartesian3()
    );
    const lastTangent = Cesium.Cartesian3.subtract(
      after,
      points[8],
      new Cesium.Cartesian3()
    );

    // Create the position spline.
    const positionSpline = new Cesium.CatmullRomSpline({
      times: times,
      points: points,
      firstTangent: firstTangent,
      lastTangent: lastTangent,
    });

    // Create the callback position property and make it return spline evaluations.
    const position = new Cesium.CallbackPositionProperty(function (
      time,
      result
    ) {
      const splineTime =
        (delta * Cesium.JulianDate.secondsDifference(time!, start)) / duration;
      if (splineTime < firstTime || splineTime > lastTime) {
        return undefined;
      }
      return positionSpline.evaluate(splineTime, result);
    },
    false);

    const orientation = new Cesium.VelocityOrientationProperty(position);

    // Add a waypoints.
    for (let i = 0; i < points.length; ++i) {
      viewer.value?.entities.add({
        position: points[i],
        point: {
          pixelSize: 8,
          color: Cesium.Color.TRANSPARENT,
          outlineColor: Cesium.Color.YELLOW,
          outlineWidth: 3,
          heightReference: Cesium.HeightReference.RELATIVE_TO_TERRAIN,
        },
      });
    }

    // Create the entity and bind its position to the callback position property
    const entity = viewer.value?.entities.add({
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: start,
          stop: stop,
        }),
      ]),
      position: position,
      orientation: orientation,
      // model: {
      //   uri: "../SampleData/models/CesiumDrone/CesiumDrone.glb",
      //   minimumPixelSize: 64,
      //   maximumScale: 20000,
      // },
      point: {
        pixelSize: 10,
        color: Cesium.Color.RED,
        heightReference: Cesium.HeightReference.RELATIVE_TO_TERRAIN,
      },
      // path: {
      //   material: new Cesium.PolylineGlowMaterialProperty({
      //     glowPower: 0.1,
      //     color: Cesium.Color.YELLOW,
      //   }),
      //   width: 10,
      //   resolution: 0.01,
      //   leadTime: 1,
      //   trailTime: 0.1,
      // },
      trackingReferenceFrame: Cesium.TrackingReferenceFrame.INERTIAL,
      viewFrom: new Cesium.Cartesian3(-100, 0, 10),
    });

    viewer.value!.trackedEntity = entity;
  };

  return {
    viewer,
    initBox,
  };
};

/**
 * @description 添加山地地形
 * @param {Cesium.Viewer} viewer
 */
async function addCesiumTerrain(viewer: Cesium.Viewer) {
  // 关闭一些不必要的视觉效果，优化性能
  viewer.scene.sun!.show = false; // 太阳
  viewer.scene.moon!.show = false; // 月亮
  viewer.scene.skyBox!.show = false; // 天空盒
  viewer.scene.fog.enabled = false; // 雾
  viewer.scene.skyAtmosphere!.show = false; // 大气
  // 加载默认地形
  const terrain = await Cesium.createWorldTerrainAsync({
    requestVertexNormals: true,
    requestWaterMask: false,
  });
  viewer.terrainProvider = terrain;
  viewer.scene.globe.depthTestAgainstTerrain = true; //地形可以遮挡模型
}
/**
 * @description 添加四川区域
 * @param {Cesium.Viewer} viewer
 */
function addSCRegion(viewer: Cesium.Viewer) {
  const coors = SC.features[0].geometry.coordinates[0];
  const geojson = turf.polygon(coors);
  const simplified = turf.simplify(geojson, {
    tolerance: 0.05,
    highQuality: true, // 是否花费更多时间使用其他算法创建更高质量的简化
  });

  const areas = new Cesium.ClippingPolygon({
    positions: Cesium.Cartesian3.fromDegreesArray(
      simplified.geometry.coordinates[0].flat()
    ),
  });
  viewer.scene.globe.clippingPolygons = new Cesium.ClippingPolygonCollection({
    polygons: [areas],
    inverse: true,
  });

  // 设置30度向下视角 (pitch = -30度)
  const pitch = (-25 * Math.PI) / 180; // 转换为弧度
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(103.6, 30.97, 3000),
    orientation: {
      heading: 0,
      pitch: pitch,
      roll: 0,
    },
  });
}

function createPlaneUpdateFunction(plane: any) {
  return function () {
    plane.distance = targetY;
    return plane;
  };
}
