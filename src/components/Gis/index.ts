import {
  CesiumConfig,
  CesiumDataType,
  CesiumDrawGetData,
  PolygonType,
} from "@/types/gis";
import * as Cesium from "cesium";
import { Ref, ref, shallowRef, watch } from "vue";

export const Token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5NGI2Y2QzZS01NDNhLTQzNjItOWQ4ZC1hYTk2ZDJkMjg2NjEiLCJpZCI6MjAxODIxLCJpYXQiOjE3MTAzOTkxNDJ9.QfyFdDreE7x97CtwJtX_z3XcLpwfqfadhdtnIWHRBiU";

/**
 * @description 初始化cesium
 * @return {*}
 */
export const initCesium = (el: string) => {
  const viewer = shallowRef<Cesium.Viewer>();
  const roadMap = shallowRef<Cesium.ImageryLayer>();
  const hasRoadMap = ref(false);
  const defaultConfig = {
    lookAt: [108.341768, 22.804393, 1000_0000], //首次聚焦位置
    max: 1000_0000, //最大缩放
    min: 100, //最小缩放
    flyHeight: 1_000, //飞行高度
    pitch: -0.5,
  };
  let frame: Cesium.Matrix4;
  let sphere: Cesium.BoundingSphere | null = null;

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
      // // 是否展示场景的底部
      // shadows: true,
      // 启用请求渲染模式
      requestRenderMode: true,
      // 初始场景模式 1 2D模式 2 2D循环模式 3 3D模式  Cesium.SceneMode
      sceneMode: Cesium.SceneMode.SCENE3D,
      // 点击选中元素
      selectionIndicator: false,

      baseLayer: new Cesium.ImageryLayer(
        new Cesium.UrlTemplateImageryProvider({
          url: "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
        })
      ),
    });
    // 最小缩放高度（米）
    viewer.value.scene.screenSpaceCameraController.minimumZoomDistance =
      defaultConfig.min;
    // 最大缩放高度（米）
    viewer.value.scene.screenSpaceCameraController.maximumZoomDistance =
      defaultConfig.max;
    // 去除版权样式
    (viewer.value.cesiumWidget.creditContainer as HTMLElement).style.display =
      "none"; //去除版权样式
    // 获取比例 渲染清晰 抗锯齿
    viewer.value.resolutionScale = window.devicePixelRatio;
    viewer.value.scene.postProcessStages.fxaa.enabled = true;
    //默认视角定位中国上空
    viewer.value.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        defaultConfig.lookAt[0],
        defaultConfig.lookAt[1],
        defaultConfig.lookAt[2]
      ),
      orientation: {
        heading: 0,
        pitch: (-Cesium.Math.PI / 180) * 80,
        roll: 0,
      },
    });
    viewer.value.screenSpaceEventHandler.setInputAction(() => {
      zoomFn("zoomIn");
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  };

  /**
   * @description 放大缩小地图
   */
  const zoomFn = (type: "zoomIn" | "zoomOut") => {
    // 获取当前相机高度
    const height = viewer.value?.camera.positionCartographic.height!;
    // 根据当前相机高度，设置缩放步长
    if (type === "zoomIn") {
      viewer.value?.camera.zoomIn(height / 10);
    } else {
      viewer.value?.camera.zoomOut(height / 10);
    }
  };

  /**
   * @description 调整地图的方向为正北
   */
  const adjustNorthUp = () => {
    if (sphere) {
      // 有焦点位置，则将焦点位置设置为地图中心点，并设置地图方向为正北方向
      viewer.value?.camera.flyToBoundingSphere(sphere, {
        offset: new Cesium.HeadingPitchRange(0, -Cesium.Math.PI / 2, 0),
      });
    } else {
      // 没有焦点位置，则将地图方向设置为正北方向，焦点为当前视图中心点
      const fushi = -Cesium.Math.PI / 2;
      const yizhou = Cesium.Math.PI * 2;
      if (
        viewer.value?.scene.camera.heading === yizhou &&
        viewer.value?.scene.camera.pitch === fushi &&
        viewer.value?.scene.camera.roll === 0
      ) {
        return;
      }
      const centerResult =
        viewer.value!.camera.pickEllipsoid(
          new Cesium.Cartesian2(
            viewer.value!.canvas.clientWidth / 2,
            viewer.value!.canvas.clientHeight / 2
          )
        ) || viewer.value?.camera.position;
      const curPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
        centerResult!
      );
      const curLongitude = (curPosition.longitude * 180) / Math.PI;
      const curLatitude = (curPosition.latitude * 180) / Math.PI;
      viewer.value?.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          curLongitude,
          curLatitude,
          defaultConfig.flyHeight
        ),
        orientation: {
          heading: 0, //偏航角 摇头
          pitch: fushi, //俯仰角 点头
          roll: 0, //翻滚角 歪头
        },
        duration: 2,
      });
    }
  };

  /**
   * @description 是否加载道路图
   */
  const loadRoadNetwork = () => {
    if (hasRoadMap.value) {
      viewer.value?.imageryLayers.remove(roadMap.value!, true);
      hasRoadMap.value = false;
    } else {
      roadMap.value = viewer.value!.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
          url: "http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
        })
      );
      hasRoadMap.value = true;
    }
  };

  /**
   * @description 根据经纬度，移动视角
   */
  const flyTo = (
    longitude: number,
    latitude: number,
    maxDistance = defaultConfig.flyHeight
  ) => {
    const centerPoint = getCartesian3FromDegrees([longitude, latitude]);
    sphere = new Cesium.BoundingSphere(centerPoint, maxDistance);
    viewer.value?.camera.flyToBoundingSphere(sphere, {
      offset: new Cesium.HeadingPitchRange(0, defaultConfig.pitch, 0),
      complete: () => {
        // 获取相机位置的 Cartographic 表示
        const cartographic = viewer.value?.camera.positionCartographic;
        // 获取并显示相机高度
        const height = cartographic?.height;
        if (height) {
          defaultConfig.flyHeight = height;
        }
      },
    });
  };

  /**
   * @description 获取当前笛卡尔坐标和固定参考帧
   */
  const getFrame = () => {
    // 定义一个变量result，用于存储笛卡尔坐标
    let result = new Cesium.Cartesian3();
    // 获取viewer中的camera和scene
    const camera = viewer.value!.camera;
    const scene = viewer.value!.scene;
    // 定义一个变量rayScratch，用于存储射线
    const rayScratch = new Cesium.Ray();
    // 设置rayScratch的起点和方向
    rayScratch.origin = camera.positionWC;
    rayScratch.direction = camera.directionWC;
    // 获取场景中地球的pick值，如果没有则返回camera的坐标
    result =
      scene.globe.pick(rayScratch, scene, result) ||
      viewer.value!.camera.position;
    // focusPoint = result; // 设置focusPoint为result，用于调整视角时使用
    // 将笛卡尔坐标转换为相机坐标
    result = camera.worldToCameraCoordinatesPoint(result, result);
    // 定义一个变量newTransformScratch，用于存储矩阵
    const newTransformScratch = new Cesium.Matrix4();
    // 将笛卡尔坐标转换为固定参考帧
    frame = Cesium.Transforms.eastNorthUpToFixedFrame(
      result,
      scene.globe.ellipsoid,
      newTransformScratch
    );
  };

  /**
   * @description 调整视角
   * @param {number} x
   * @param {number} y
   */
  const orbitTickFunction = (x: number, y: number) => {
    viewer.value?.camera.lookAtTransform(frame);
    viewer.value?.camera.rotateLeft(x);
    viewer.value?.camera.rotateUp(y);
    viewer.value?.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  };

  const destroyed = () => {
    viewer.value?.entities.removeAll();
    viewer.value?.destroy();
    viewer.value = undefined;
  };

  return {
    viewer, //视图
    zoomFn,
    adjustNorthUp,
    loadRoadNetwork,
    flyTo,
    destroyed,
    init, //初始化
    orbitTickFunction,
    getFrame,
  };
};

/**
 * @description 画图获取坐标
 * @param {(Ref<Cesium.Viewer | undefined>)} viewer
 * @return {*}
 */
export const useDrawAndGetData = (viewer: Ref<Cesium.Viewer | undefined>) => {
  const data = ref<Array<CesiumDrawGetData>>([]); //存储坐标数据
  const index = ref<number>(0); //当前点的索引
  const pickEntity = shallowRef<Cesium.Entity>(); //当前点击的实体
  const alpha = 0.3;
  const labelAlpha = 0.5;
  let areaType = "area" as PolygonType;

  // 多边形
  const polygonHierarchy = new Cesium.PolygonHierarchy();
  const polygonAreaEntity = new Cesium.Entity({
    name: "polygon",
    polygon: {
      hierarchy: new Cesium.CallbackProperty(function () {
        return polygonHierarchy;
      }, false),
      outline: true,
      outlineColor: Cesium.Color.RED,
      outlineWidth: 10,
      fill: true,
      material: Cesium.Color.RED.withAlpha(alpha),
    },
  });

  // 线段多边形
  let polygonLinePositions: Cesium.Cartesian3[] = [];
  const polygonLineEntity = new Cesium.Entity({
    name: "polygon",
    polyline: {
      positions: new Cesium.CallbackProperty(function () {
        let position = [];
        if (polygonLinePositions.length >= 3) {
          position = [...polygonLinePositions, polygonLinePositions[0]];
        } else {
          position = [...polygonLinePositions];
        }
        return position;
      }, false),
      width: 4,
      // clampToGround: true,
      material: new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.RED.withAlpha(1),
        dashLength: 20,
      }),
    },
  });

  // 线段
  let polylinePositions: Cesium.Cartesian3[] = [];
  const polylineEntity = new Cesium.Entity({
    name: "polyline",
    polyline: {
      positions: new Cesium.CallbackProperty(function () {
        return polylinePositions;
      }, false),
      width: 20,
      material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.WHITE),
    },
  });

  /**
   * @description 画点
   * @param {number[]} position 经纬度
   * @param {number} index 索引
   * @param {*} [config] 配置
   */
  function drawPointFn(
    position: number[],
    index: number,
    config?: {
      point?: Cesium.PointGraphics.ConstructorOptions;
      properties?: any;
    }
  ) {
    // 添加点
    viewer.value?.entities.add({
      id: String(index),
      name: "point",
      properties: config?.properties || {},
      position: Cesium.Cartesian3.fromDegrees(position[0], position[1], 10),
      point: {
        pixelSize: config?.point?.pixelSize || 6,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        ...config?.point,
      },
      label: {
        text: `点${index + 1}--[${position[0]},${position[1]}]`,
        font: "12px sans-serif",
        pixelOffset: new Cesium.Cartesian2(0, -20),
        fillColor: Cesium.Color.RED,
        backgroundColor: Cesium.Color.WHITE.withAlpha(labelAlpha),
        showBackground: true,
      },
    });
  }

  /**
   * @description 获取笛卡尔坐标
   */
  function getCartesian(position: Cesium.Cartesian2) {
    const cartesian = viewer.value!.camera.pickEllipsoid(
      position,
      viewer.value!.scene.globe.ellipsoid
    );
    return cartesian;
  }

  /**
   * @description 编辑数据 重画展示
   * @param {CesiumDrawGetData[]} oldData 渲染数据
   * @param {CesiumDataType} type 画的类型
   */
  function draw(oldData: CesiumDrawGetData[], type: CesiumDataType) {
    // 清空之前画的数据 不然会复用数据
    reset();
    oldData.forEach((item, index) => {
      // 重画 点线面
      if (type === CesiumDataType.Point) {
        drawPointFn(item.degrees, index, {
          point: {
            pixelSize: 16,
          },
          properties: item.data,
        });
      }
      if (type === CesiumDataType.Polyline) {
        drawPointFn(item.degrees, index, {
          point: {
            pixelSize: 6,
          },
          properties: item.data,
        });
        polylinePositions.push(getCartesian3FromDegrees(item.degrees));
      }
      if (type === CesiumDataType.Polygon) {
        drawPointFn(item.degrees, index, {
          point: {
            pixelSize: 6,
          },
          properties: item.data,
        });
        if (areaType === PolygonType.Area) {
          polygonHierarchy.positions.push(
            getCartesian3FromDegrees(item.degrees)
          );
        } else {
          polygonLinePositions.push(getCartesian3FromDegrees(item.degrees));
        }
      }
    });
    data.value = oldData;
    index.value = oldData.length;
  }

  /**
   * @description 重置数据
   */
  function reset() {
    data.value = [];
    index.value = 0;
    polylinePositions = [];
    polygonHierarchy.positions = [];
    polygonLinePositions = [];
  }
  /**
   * @description 根据点击位置获取经纬度
   * @param {Cesium.Cartesian2} position
   * @return {*}
   */
  function getPositionFromClick(position: Cesium.Cartesian2) {
    // 获取点击位置笛卡尔坐标
    const cartesian = viewer.value?.camera.pickEllipsoid(
      position,
      viewer.value?.scene.globe.ellipsoid
    );
    // 获取点击位置的经纬度坐标
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian!);
    const longitude = Number(
      Cesium.Math.toDegrees(cartographic.longitude).toFixed(6)
    );
    const latitude = Number(
      Cesium.Math.toDegrees(cartographic.latitude).toFixed(6)
    );
    return { longitude, latitude, cartesian };
  }
  /**
   * @description 初始化绘制点
   * @return {*}
   */
  function initDrawPoint() {
    if (!viewer.value) {
      return;
    }
    // 监听地图点击事件
    viewer.value.screenSpaceEventHandler.setInputAction(
      (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const pick = viewer.value?.scene.pick(click.position);
        if (!pick) {
          // 获取点击位置经纬度坐标
          const { latitude, longitude } = getPositionFromClick(click.position);
          // 画单个点 重绘
          index.value = 0;
          data.value = [{ degrees: [longitude, latitude], index: index.value }];
          removeAllEntities();
          // 画点
          drawPointFn([longitude, latitude], index.value, {
            point: {
              pixelSize: 16,
            },
          });
          // viewer.value?.scene.requestRender();
          requestAnimationFrame(() => {
            viewer.value?.scene.requestRender();
          });
        }
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
  }
  /**
   * @description 初始化画线
   * @return {*}
   */
  function initDrawLine() {
    if (!viewer.value) {
      return;
    }
    viewer.value.entities.add(polylineEntity);
    // 监听地图点击事件
    viewer.value.screenSpaceEventHandler.setInputAction(
      (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const pick = viewer.value?.scene.pick(click.position);
        if (!pick) {
          // 获取点击位置经纬度坐标
          const { latitude, longitude, cartesian } = getPositionFromClick(
            click.position
          );
          // 画线和面的端点 连续
          data.value.push({
            degrees: [longitude, latitude],
            index: index.value,
          });
          drawPointFn([longitude, latitude], index.value);
          // 画线
          polylinePositions.push(cartesian!.clone());
          index.value += 1;
          // viewer.value?.scene.requestRender();
          requestAnimationFrame(() => {
            viewer.value?.scene.requestRender();
          });
        }
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
  }
  /**
   * @description 初始化画面
   * @param {("area" | "line")} [type="area"]
   * @return {*}
   */
  function initDrawArea(type: PolygonType = PolygonType.Area) {
    areaType = type;
    if (!viewer.value) {
      return;
    }
    if (type === PolygonType.Area) {
      const p = viewer.value.entities.add(polygonAreaEntity);
      (p.polygon as any).material = Cesium.Color.BLUE.withAlpha(alpha);
    } else {
      const p = viewer.value.entities.add(polygonLineEntity);
      (p.polyline as any).material = new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.BLUE.withAlpha(1),
        dashLength: 20,
      });
    }
    // 监听地图点击事件
    viewer.value.screenSpaceEventHandler.setInputAction(
      (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const pick = viewer.value?.scene.pick(click.position);
        if (!pick) {
          // 获取点击位置经纬度坐标
          const { latitude, longitude, cartesian } = getPositionFromClick(
            click.position
          );
          // 画线和面的端点 连续
          data.value.push({
            degrees: [longitude, latitude],
            index: index.value,
          });
          drawPointFn([longitude, latitude], index.value);
          if (type === PolygonType.Area) {
            polygonHierarchy.positions.push(cartesian!.clone());
          } else {
            polygonLinePositions.push(cartesian!.clone());
          }
          index.value += 1;
          // viewer.value?.scene.requestRender();
          requestAnimationFrame(() => {
            viewer.value?.scene.requestRender();
          });
        }
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
  }
  /**
   * @description 初始化拖动entity事件
   * @param {CesiumDataType} type
   * @return {*}
   */
  function initEntityMove(type: CesiumDataType) {
    if (!viewer.value) {
      return;
    }
    // 鼠标左键按下
    viewer.value.screenSpaceEventHandler.setInputAction(
      (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const pick = viewer.value?.scene.pick(click.position);
        if (
          pick &&
          pick.id &&
          pick.id.name !== "polygon" &&
          pick.id.name !== "polyline" &&
          pick.id.name !== undefined
        ) {
          // 点击点
          pickEntity.value = pick.id;
          // 禁用拖动地图
          viewer.value!.scene.screenSpaceCameraController.enableRotate = false;
          viewer.value!.scene.screenSpaceCameraController.enableTranslate =
            false;
          viewer.value!.scene.screenSpaceCameraController.enableZoom = false;
        } else {
          pickEntity.value = undefined;
        }
      },
      Cesium.ScreenSpaceEventType.LEFT_DOWN
    );

    // 鼠标左键放开
    viewer.value.screenSpaceEventHandler.setInputAction(() => {
      pickEntity.value = undefined;
      viewer.value!.scene.screenSpaceCameraController.enableRotate = true;
      viewer.value!.scene.screenSpaceCameraController.enableTranslate = true;
      viewer.value!.scene.screenSpaceCameraController.enableZoom = true;
      // 鼠标抬起重新渲染 非常重要
      viewer.value?.scene.requestRender();
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    // 鼠标移入事件
    viewer.value.screenSpaceEventHandler.setInputAction(
      (move: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
        // 获取地图上的点位实体(entity)坐标
        const pick = viewer.value?.scene.pick(move.endPosition);
        // 如果pick不是undefined，那么就是点到点位了
        if (
          pick &&
          pick.id &&
          pick.id.name !== "polygon" &&
          pick.id.name !== "polyline" &&
          pick.id.name !== undefined
        ) {
          (viewer.value as any)._container.style.cursor = "pointer";
        } else {
          // 移除弹框
          (viewer.value as any)._container.style.cursor = "default";
        }
        if (pickEntity.value) {
          // 获取点位实体的坐标
          const index = Number(pickEntity.value.id);
          const cartesian = getCartesian(move.endPosition);
          const degrees = getDegreesFromCartesian3(cartesian!);
          // 修改坐标
          data.value[index].degrees = degrees;
          // 更新点位置
          (pickEntity.value.position as any) = cartesian;
          (pickEntity.value.label!.text as any) = `点${index + 1}--[${
            degrees[0]
          },${degrees[1]}]`;
          // 更新线的位置
          if (type === CesiumDataType.Polyline) {
            polylinePositions[index] = cartesian!;
          }
          // 更新面的位置
          if (type === CesiumDataType.Polygon) {
            if (areaType === PolygonType.Area) {
              polygonHierarchy.positions[index] = cartesian!;
            } else {
              polygonLinePositions[index] = cartesian!;
            }
          }
          // 鼠标抬起重新渲染 非常重要
          viewer.value?.scene.requestRender();
        }
      },
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
  }

  function removeAllEntities() {
    viewer.value?.entities.values.forEach((item) => {
      if (item) {
        viewer.value?.entities.remove(item);
      }
    });
  }

  return {
    data,
    draw,
    reset,
    initDrawPoint,
    initDrawLine,
    initDrawArea,
    initEntityMove,
  };
};

/**
 * @description 画点线面
 * @param {(Ref<Cesium.Viewer | undefined>)} viewer
 * @return {*}
 */
export const useDraw = (
  viewer: Ref<Cesium.Viewer | undefined>,
  addTerrain: boolean = false
) => {
  // 是否添加地形
  watch(viewer, (newVal) => {
    if (newVal && addTerrain) {
      addCesiumTerrain(newVal);
    }
  });
  /**
   * @description 画面
   * @param {Cesium.Cartesian3[]} positions
   * @param {PolygonType} [drawType=PolygonType.Area]
   * @param {{
   *       polygon?: Cesium.PolygonGraphics.ConstructorOptions;
   *       polyline?: Cesium.PolylineGraphics.ConstructorOptions;
   *       label?: Cesium.LabelGraphics.ConstructorOptions;
   *       showPoint?: boolean;
   *       showLabel?: boolean;
   *       properties?: any;
   *     }} [config]
   */
  function drawArea(
    positions: Cesium.Cartesian3[],
    drawType: PolygonType = PolygonType.Area, //展示区域类型
    config?: {
      polygon?: Cesium.PolygonGraphics.ConstructorOptions;
      polyline?: Cesium.PolylineGraphics.ConstructorOptions;
      label?: Cesium.LabelGraphics.ConstructorOptions;
      showPoint?: boolean;
      showLabel?: boolean;
      properties?: any;
    }
  ) {
    const showPoint = config?.showPoint ?? true; // 使用nullish coalescing操作符设置默认值
    const showLabel = config?.showLabel ?? true; // 使用nullish coalescing操作符设置默认值

    const polygonHierarchy = new Cesium.PolygonHierarchy(positions);
    const dataSource = new Cesium.CustomDataSource("area");
    let polygon: Cesium.Entity;

    if (drawType === PolygonType.Area) {
      polygon = new Cesium.Entity({
        name: "polygon",
        polygon: {
          material: Cesium.Color.RED.withAlpha(0.3),
          hierarchy: polygonHierarchy,
          fill: true,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          ...(config?.polygon || {}),
        },
      });
    } else {
      const data = [
        ...polygonHierarchy.positions,
        polygonHierarchy.positions[0],
      ];
      polygon = new Cesium.Entity({
        name: "polygon",
        polyline: {
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.RED.withAlpha(0.3),
            dashLength: 20,
          }),
          positions: data,
          width: 4,
          clampToGround: true,
          ...(config?.polyline || {}),
        },
      });
    }

    dataSource.entities.add(polygon);

    if (showPoint) {
      positions.forEach((p) => {
        const entity = drawPoint(p, {
          label: {
            text: config?.properties.name,
          },
          properties: config?.properties,
          isChildren: true,
        });
        dataSource.entities.add(entity);
      });
    }

    if (showLabel) {
      // 画区域中心标签
      const centerPoint = getCartesian3FromDegrees(
        getCenterPoint(polygonHierarchy.positions)
      );
      const label = drawLabel(centerPoint, config?.label);
      dataSource.entities.add(label);
    }

    viewer.value?.dataSources.add(dataSource);
  }

  /**
   * @description 画线
   * @param {Cesium.Cartesian3[]} positions
   * @param {{
   *       polyline?: Cesium.PolylineGraphics.ConstructorOptions;
   *       polylineVolume?: Cesium.PolylineVolumeGraphics.ConstructorOptions;
   *       properties?: any;
   *       showPoint?: boolean;
   *       showLabel?: boolean;
   *       is3D?: boolean;
   *     }} [config]
   */
  function drawLine(
    positions: Cesium.Cartesian3[],
    config?: {
      polyline?: Cesium.PolylineGraphics.ConstructorOptions;
      polylineVolume?: Cesium.PolylineVolumeGraphics.ConstructorOptions;
      properties?: any;
      showPoint?: boolean;
      showLabel?: boolean;
      is3D?: boolean;
    }
  ) {
    const showPoint = config?.showPoint ?? true; // 使用nullish coalescing操作符设置默认值
    const showLabel = config?.showLabel ?? true; // 使用nullish coalescing操作符设置默认值
    const is3D = config?.is3D ?? false; // 使用nullish coalescing操作符设置默认值

    const dataSource = new Cesium.CustomDataSource("line");

    if (!is3D) {
      const line = new Cesium.Entity({
        name: "polyline",
        polyline: {
          positions,
          width: 10,
          material: Cesium.Color.WHITE.withAlpha(0.3),
          clampToGround: true,
          ...(config?.polyline || {}),
        },
      });
      dataSource.entities.add(line);
    } else {
      const line = new Cesium.Entity({
        name: "polyline",
        polylineVolume: {
          positions,
          shape: computeCircle(20),
          material: Cesium.Color.WHITE.withAlpha(0.6),
          ...(config?.polylineVolume || {}),
        },
      });
      dataSource.entities.add(line);
    }

    if (showPoint) {
      positions.forEach((p) => {
        const entity = drawPoint(p, {
          label: {
            text: config?.properties.name,
          },
          properties: config?.properties,
          isChildren: true,
        });
        dataSource.entities.add(entity);
      });
    }

    if (showLabel) {
      const labelList = drawLineLabel(positions, config?.properties);
      labelList.forEach((label) => {
        dataSource.entities.add(label);
      });
    }

    viewer.value?.dataSources.add(dataSource);
  }

  /**
   * @description 绘制线段上的标签
   * @param {Cesium.Cartesian3[]} polylinePositions
   * @param {*} [properties]
   * @return {*}
   */
  function drawLineLabel(
    polylinePositions: Cesium.Cartesian3[],
    properties?: any
  ) {
    let entityArr = [];
    for (let i = 0; i < polylinePositions.length - 1; i++) {
      const p1 = polylinePositions[i];
      const p2 = polylinePositions[i + 1];
      const midpoint = Cesium.Cartesian3.midpoint(
        p1,
        p2,
        new Cesium.Cartesian3()
      );
      const labelEntity = new Cesium.Entity({
        name: "polyline",
        position: midpoint,
        label: {
          text: properties?.name,
          font: "12px sans-serif",
          scale: 0.8,
          fillColor: Cesium.Color.BLACK.withAlpha(0.9),
          backgroundColor: Cesium.Color.WHITE.withAlpha(0.6),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(2, 2),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            10_0000
          ),
          scaleByDistance: new Cesium.NearFarScalar(100, 1.5, 10_0000, 0.8),
          pixelOffset: new Cesium.Cartesian2(0, -10),
          heightReference: Cesium.HeightReference.NONE,
        },
      });
      entityArr.push(labelEntity);
    }
    return entityArr;
  }
  /**
   * @description 画点 单独点/面和线的点
   * @param {Cesium.Cartesian3} position
   * @param {{
   *       img?: string;
   *       animate?: boolean;
   *       billboard?: Cesium.BillboardGraphics.ConstructorOptions;
   *       label?: Cesium.LabelGraphics.ConstructorOptions;
   *       point?: Cesium.PointGraphics.ConstructorOptions;
   *       properties?: any;
   *       isChildren?: boolean;
   *     }} [config]
   * @return {*}
   */
  function drawPoint(
    position: Cesium.Cartesian3,
    config?: {
      img?: string;
      animate?: boolean;
      billboard?: Cesium.BillboardGraphics.ConstructorOptions;
      label?: Cesium.LabelGraphics.ConstructorOptions;
      point?: Cesium.PointGraphics.ConstructorOptions;
      properties?: any;
      isChildren?: boolean; // 是否是面和线子节点
    }
  ) {
    const isChildren = config?.isChildren ?? false; // 使用nullish coalescing操作符设置默认值

    let entity: Cesium.Entity;
    if (config?.img) {
      // config.animate && animatePoint(position, type, data?.wellType);
      entity = new Cesium.Entity({
        position: position,
        properties: config?.properties || {}, // 用来存信息
        billboard: {
          image: config.img,
          color: Cesium.Color.RED,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          ...(config.billboard || {}),
        },
        label: {
          font: "12px sans-serif",
          scale: 0.8,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          fillColor: new Cesium.Color(0.2, 0.494, 0.8, 1),
          backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
          showBackground: true,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            10_0000
          ),
          scaleByDistance: new Cesium.NearFarScalar(100, 1.5, 10_0000, 0.8),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          ...(config.label || {}),
        },
      });
    } else {
      // config.animate && animatePoint(position, type, data?.wellType);
      entity = new Cesium.Entity({
        position: position,
        properties: config?.properties || {}, // 用来存信息
        point: {
          pixelSize: config?.point?.pixelSize || 10,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          ...(config?.point || {}),
        },
        label: {
          font: "12px sans-serif",
          scale: 0.8,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          fillColor: new Cesium.Color(0.2, 0.494, 0.8, 1),
          backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
          showBackground: true,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            10_0000
          ),
          scaleByDistance: new Cesium.NearFarScalar(100, 1.5, 10_0000, 0.8),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          ...(config?.label || {}),
        },
      });
    }
    // 单独的点直接添加到viewer中
    if (!isChildren) {
      const dataSource = new Cesium.CustomDataSource("point");
      dataSource.entities.add(entity);
      viewer.value?.dataSources.add(dataSource);
    }

    return entity;
  }

  /**
   * @description 画点的label
   * @param {Cesium.Cartesian3} position
   * @param {Cesium.LabelGraphics.ConstructorOptions} [label]
   * @return {*}
   */
  function drawLabel(
    position: Cesium.Cartesian3,
    label?: Cesium.LabelGraphics.ConstructorOptions
  ) {
    return new Cesium.Entity({
      position: position,
      label: {
        showBackground: false,
        disableDepthTestDistance: 0,
        scaleByDistance: new Cesium.NearFarScalar(100, 2, 100_0000, 0.5),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        ...(label || {}),
      },
    });
  }

  function initHoverEvent() {
    // 当创建图形HOOK和绘画HOOK同时存在，移动的事件会覆盖，绘画优先
    const moveFn = viewer.value?.screenSpaceEventHandler.getInputAction(
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
    if (moveFn) {
      return;
    }
    // 鼠标移入事件
    viewer.value?.screenSpaceEventHandler.setInputAction(
      (move: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
        // 获取地图上的点位实体(entity)坐标
        const pick = viewer.value?.scene.pick(move.endPosition);
        // 如果pick不是undefined，那么就是点到点位了  忽略区域的线框
        if (
          pick &&
          pick.id &&
          pick.id.name !== "polygon" &&
          pick.id.name !== "polyline"
        ) {
          const entity = pick.id as Cesium.Entity;
          if (entity && entity.properties) {
            (viewer.value as any)._container.style.cursor = "pointer";
            showTooltip(
              move.endPosition.x,
              move.endPosition.y,
              entity.properties.getValue()
            );
          }
        } else {
          // 移除弹框
          (viewer.value as any)._container.style.cursor = "default";
          const tipsEl = document.getElementById("cesium-tips") as HTMLElement;
          if (tipsEl) {
            tipsEl.style.display = "none";
          }
        }
      },
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
  }

  return {
    drawArea,
    drawLine,
    drawPoint,
    initHoverEvent,
  };
};

const showTooltip = (x: number, y: number, info: any) => {
  if (info && info.remark) {
    const tipsEl = document.getElementById("cesium-tips") as HTMLElement;
    if (tipsEl) {
      tipsEl.style.display = "block";
      tipsEl.style.left = x + 20 + "px";
      tipsEl.style.top = y + "px";
      tipsEl.innerHTML = `<div>${info.remark}</div>`;
    } else {
      const tipsEl = document.createElement("div");
      tipsEl.id = "cesium-tips";
      tipsEl.style.position = "absolute";
      tipsEl.style.backgroundColor = "rgba(0,0,0,0.8)";
      tipsEl.style.color = "white";
      tipsEl.style.zIndex = "999";
      tipsEl.style.maxWidth = "250px";
      tipsEl.style.fontSize = "14px";
      tipsEl.style.lineHeight = "20px";
      tipsEl.style.padding = "8px";
      tipsEl.style.borderRadius = "5px";
      document.getElementById("cesium-container")!.appendChild(tipsEl);
      tipsEl.style.left = x + 20 + "px";
      tipsEl.style.top = y + "px";
    }
  }
};

/**
 * @description 根据笛卡尔坐标获取经纬度
 * @param {Cesium.Cartesian3} cartesian
 * @return {*}
 */
export const getDegreesFromCartesian3 = (cartesian: Cesium.Cartesian3) => {
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  const longitude = Number(
    Cesium.Math.toDegrees(cartographic.longitude).toFixed(6)
  );
  const latitude = Number(
    Cesium.Math.toDegrees(cartographic.latitude).toFixed(6)
  );
  return [longitude, latitude];
};

/**
 * @description 根据经纬度获取笛卡尔坐标
 * @param {number[]} degrees
 * @param {number} height 渲染高度 防止重叠
 * @return {*}
 */
export const getCartesian3FromDegrees = (
  degrees: number[],
  height: number = 0
) => {
  const cartesian = Cesium.Cartesian3.fromDegrees(
    degrees[0],
    degrees[1],
    height
  );
  return cartesian;
};

/**
 * @description 根据经纬度获取笛卡尔坐标
 * @param {Cesium.Cartographic} cartographic
 * @return {*}
 */
export const getCartes3FromCartographic = (
  cartographic: Cesium.Cartographic
) => {
  const cartesian3 = Cesium.Cartesian3.fromDegrees(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height
  );
  return cartesian3;
};

/**
 * @description 获取范围的中心坐标
 * @param {Cesium.Cartesian3[]} positions
 * @return {*}
 */
export const getCenterPoint = (positions: Cesium.Cartesian3[]) => {
  // 初始化中心点坐标
  let center = Cesium.Cartesian3.ZERO;
  // 计算坐标总数
  const count = positions.length;
  // 计算坐标总和
  positions.forEach((position) => {
    center = Cesium.Cartesian3.add(center, position, new Cesium.Cartesian3());
  });
  // 取坐标平均值
  center = Cesium.Cartesian3.divideByScalar(
    center,
    count,
    new Cesium.Cartesian3()
  );
  // 将中心点坐标转换为地理坐标
  const centerCartographic = Cesium.Cartographic.fromCartesian(center);
  // 将地理坐标转换为经纬度坐标
  const centerLongitude = Number(
    Cesium.Math.toDegrees(centerCartographic.longitude).toFixed(6)
  );
  const centerLatitude = Number(
    Cesium.Math.toDegrees(centerCartographic.latitude).toFixed(6)
  );

  return [centerLongitude, centerLatitude];
};

/**
 * @description 通过笛卡尔点 获取最远距离和2点
 */
export const getLongestDistance = (positions: Cesium.Cartesian3[]) => {
  // 初始化最远距离和对应的点
  let maxDistance = 0.0;
  let farthestPoint1, farthestPoint2;

  // 计算所有点对之间的距离
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const distance = Cesium.Cartesian3.distance(positions[i], positions[j]);
      if (distance > maxDistance) {
        maxDistance = distance;
        farthestPoint1 = positions[i];
        farthestPoint2 = positions[j];
      }
    }
  }
  return {
    maxDistance,
    farthestPoint1,
    farthestPoint2,
  };
};

function computeCircle(radius: number) {
  const positions = [];
  for (let i = 0; i < 360; i++) {
    const radians = Cesium.Math.toRadians(i);
    positions.push(
      new Cesium.Cartesian2(
        radius * Math.cos(radians),
        radius * Math.sin(radians)
      )
    );
  }
  return positions;
}

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
  viewer.scene.globe.depthTestAgainstTerrain = false; //地形可以遮挡模型
  // 现在垂直地形夸张的操作，默认值0
  viewer.scene.verticalExaggeration = 1;
  // 垂直地形夸张相对高度，默认值0
  viewer.scene.verticalExaggerationRelativeHeight = 0.1;
}
