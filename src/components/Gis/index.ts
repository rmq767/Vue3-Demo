import {
  CesiumConfig,
  CesiumData,
  CesiumDataType,
  CesiumDrawGetData,
  CesiumFilterType,
  MyConstructorOptions,
  WellType,
} from "@/types/gis";
import * as Cesium from "cesium";
import { Ref, ref, shallowRef } from "vue";

export const Token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5NGI2Y2QzZS01NDNhLTQzNjItOWQ4ZC1hYTk2ZDJkMjg2NjEiLCJpZCI6MjAxODIxLCJpYXQiOjE3MTAzOTkxNDJ9.QfyFdDreE7x97CtwJtX_z3XcLpwfqfadhdtnIWHRBiU";

/**
 * @description 初始化cesium
 * @param {CesiumConfig} [config] 聚焦点
 * @return {*}
 */
export const initCesium = (config?: CesiumConfig) => {
  const viewer = shallowRef<Cesium.Viewer>();
  const roadMap = shallowRef<Cesium.ImageryLayer>();
  const hasRoadMap = ref(false);
  const defaultConfig = {
    lookAt: [108.341768, 22.804393, 1000_0000], //首次聚焦位置
    max: 1000_0000, //最大缩放
    min: 100, //最小缩放
    flyHeight: 1_000, //飞行高度
    pitch: -0.5,
    ...config,
  };
  let frame: Cesium.Matrix4;
  let sphere: Cesium.BoundingSphere | null = null;

  const init = async () => {
    viewer.value = new Cesium.Viewer("cesium", {
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
      // 地形
      // terrainProvider: await Cesium.createWorldTerrainAsync({
      //   requestVertexNormals: true,
      //   requestWaterMask: true
      // }),

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
    // 再加上高德影像注记地图
    // roadMap.value = viewer.value.imageryLayers.addImageryProvider(
    //   new Cesium.UrlTemplateImageryProvider({
    //     url: 'http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8'
    //   })
    // );
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
  const zoomFn = (type: "zoomIn" | "zoomOut", step = 1_0000) => {
    if (type === "zoomIn") {
      viewer.value?.camera.zoomIn(step);
    } else {
      viewer.value?.camera.zoomOut(step);
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
export const useDrawAndGetData = (
  viewer: Ref<Cesium.Viewer | undefined>,
  editType?: Ref<CesiumFilterType | undefined>
) => {
  const data = ref<Array<CesiumDrawGetData>>([]); //存储坐标数据
  const index = ref<number>(0); //当前点的索引
  const pickEntity = shallowRef<Cesium.Entity>(); //当前点击的实体
  // const alpha = 0.3;
  const labelAlpha = 0.5;

  // 多边形
  // const polygonHierarchy = new Cesium.PolygonHierarchy();
  // const polygonEntity = new Cesium.Entity({
  //   name: 'polygon',
  //   isStatic: false,
  //   polygon: {
  //     hierarchy: new Cesium.CallbackProperty(function () {
  //       return polygonHierarchy;
  //     }, false),
  //     outline: true,
  //     outlineColor: Cesium.Color.RED,
  //     outlineWidth: 10,
  //     fill: true,
  //     material: Cesium.Color.RED.withAlpha(alpha)
  //   }
  // } as unknown as MyConstructorOptions);

  // 线段多边形
  let polygonLinePositions: Cesium.Cartesian3[] = [];
  const polygonEntity = new Cesium.Entity({
    name: "polygon",
    isStatic: false,
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
      clampToGround: true,
      material: new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.RED.withAlpha(1),
        dashLength: 20,
      }),
    },
  } as unknown as MyConstructorOptions);

  // 线段
  let polylinePositions: Cesium.Cartesian3[] = [];
  const polylineEntity = new Cesium.Entity({
    name: "polyline",
    isStatic: false,
    polyline: {
      positions: new Cesium.CallbackProperty(function () {
        return polylinePositions;
      }, false),
      width: 20,
      material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.WHITE),
    },
  } as unknown as MyConstructorOptions);

  /**
   * @description 初始化画图事件
   * @param {CesiumDataType} type
   * @return {*}
   */
  const initEvent = (type: CesiumDataType) => {
    if (!viewer.value) {
      return;
    }
    if (type === CesiumDataType.Polyline) {
      viewer.value.entities.add(polylineEntity);
    }
    if (type === CesiumDataType.Polygon) {
      const p = viewer.value.entities.add(polygonEntity);
      if (editType && editType.value === CesiumFilterType.Platform) {
        // (p.polygon as any).material = Cesium.Color.BLUE.withAlpha(alpha);
        (p.polyline as any).material = new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.BLUE.withAlpha(1),
          dashLength: 20,
        });
      }
    }
    // 监听地图点击事件
    viewer.value.screenSpaceEventHandler.setInputAction(
      (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const pick = viewer.value?.scene.pick(click.position);
        if (!pick || pick.id.isStatic) {
          // 获取点击位置笛卡尔坐标
          const cartesian = viewer.value?.camera.pickEllipsoid(
            click.position,
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
          // 画点
          if (type === CesiumDataType.Point) {
            // 画单个点 重绘
            index.value = 0;
            data.value = [
              { degrees: [longitude, latitude], index: index.value },
            ];
            removeNonStaticEntites();
            // 画点
            drawPointFn([longitude, latitude], index.value, 16);
            viewer.value?.scene.requestRender();
          } else {
            // 画线和面的端点 连续
            data.value.push({
              degrees: [longitude, latitude],
              index: index.value,
            });
            drawPointFn([longitude, latitude], index.value);
          }
          // 画线
          if (type === CesiumDataType.Polyline) {
            polylinePositions.push(cartesian!.clone());
          }
          // 画面
          if (type === CesiumDataType.Polygon) {
            // polygonHierarchy.positions.push(cartesian!.clone());
            polygonLinePositions.push(cartesian!.clone());
          }
          index.value += 1;
        }
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );

    // 鼠标左键按下
    viewer.value.screenSpaceEventHandler.setInputAction(
      (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const pick = viewer.value?.scene.pick(click.position);
        if (
          pick &&
          pick.id &&
          pick.id.name !== "polygon" &&
          pick.id.name !== "polyline" &&
          pick.id.name !== "areaLine" &&
          pick.id.name !== "area" &&
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
          pick.id.name !== "areaLine" &&
          pick.id.name !== "area" &&
          pick.id.name !== undefined
        ) {
          (viewer.value as any)._container.style.cursor = "pointer";
          // 有data才展示
          if (pick.id.data) {
            showTooltip(move.endPosition.x, move.endPosition.y, pick.id.data);
          }
        } else {
          // 移除弹框
          (viewer.value as any)._container.style.cursor = "default";
          const tipsEl = document.getElementById("cesium-tips") as HTMLElement;
          if (tipsEl) {
            tipsEl.style.display = "none";
          }
        }
        if (pickEntity.value) {
          // 获取点位实体的坐标
          const index = Number(pickEntity.value.id);
          const cartesian = getCartesian(move.endPosition);
          const degrees = getDegreesFromCartesian3(cartesian!);

          // 修改坐标
          data.value[index].degrees = degrees;
          // 更新点位置
          const point = viewer.value!.entities.getById(String(index))!;
          (point.position as any) = getCartesian3FromDegrees(degrees, 10);
          (point.label!.text as any) = `点${index + 1}--[${degrees[0]},${
            degrees[1]
          }]`;
          // 更新线的位置
          if (type === CesiumDataType.Polyline) {
            polylinePositions[index] = cartesian!;
          }
          // 更新面的位置
          if (type === CesiumDataType.Polygon) {
            // polygonHierarchy.positions[index] = cartesian!;
            polygonLinePositions[index] = cartesian!;
          }

          // 鼠标抬起重新渲染 非常重要
          viewer.value?.scene.requestRender();
        }
      },
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
  };

  /**
   * @description 画点
   * @param {number[]} position 经纬度
   * @param {number} index 索引
   * @param {*} [data] 信息
   */
  const drawPointFn = (
    position: number[],
    index: number,
    size = 6,
    data?: any
  ) => {
    // 添加点
    viewer.value?.entities.add({
      id: String(index),
      name: "point",
      data: data,
      position: Cesium.Cartesian3.fromDegrees(position[0], position[1], 10),
      isStatic: false,
      point: {
        pixelSize: size,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: `点${index + 1}--[${position[0]},${position[1]}]`,
        font: "12px sans-serif",
        pixelOffset: new Cesium.Cartesian2(0, -20),
        fillColor: Cesium.Color.RED,
        backgroundColor: Cesium.Color.WHITE.withAlpha(labelAlpha),
        showBackground: true,
      },
    } as unknown as MyConstructorOptions);
  };

  /**
   * @description 获取笛卡尔坐标
   */
  const getCartesian = (position: Cesium.Cartesian2) => {
    const cartesian = viewer.value!.camera.pickEllipsoid(
      position,
      viewer.value!.scene.globe.ellipsoid
    );
    return cartesian;
  };

  /**
   * @description 编辑数据 重画展示
   * @param {CesiumDrawGetData[]} oldData 渲染数据
   * @param {CesiumDataType} type 画的类型
   */
  const reDraw = (oldData: CesiumDrawGetData[], type: CesiumDataType) => {
    // 清空之前画的数据 不然会复用数据
    reset();
    oldData.forEach((item, index) => {
      // 重画 点线面
      if (type === CesiumDataType.Point) {
        drawPointFn(item.degrees, index, 16, item.data);
      }
      if (type === CesiumDataType.Polyline) {
        drawPointFn(item.degrees, index, 6, item.data);
        polylinePositions.push(getCartesian3FromDegrees(item.degrees, 10));
      }
      if (type === CesiumDataType.Polygon) {
        drawPointFn(item.degrees, index, 6, item.data);
        // polygonHierarchy.positions.push(
        //   getCartesian3FromDegrees(item.degrees, 10)
        // );
        polygonLinePositions.push(getCartesian3FromDegrees(item.degrees, 10));
      }
    });
    data.value = oldData;
    index.value = oldData.length;
  };

  /**
   * @description 重置数据
   */
  const reset = () => {
    data.value = [];
    index.value = 0;
    polylinePositions = [];
    // polygonHierarchy.positions = [];
    polygonLinePositions = [];
  };

  const removeStaticEntites = () => {
    const entities = viewer.value?.entities.values.filter(
      (item: MyConstructorOptions) => item.isStatic
    );
    entities?.forEach((item: MyConstructorOptions) => {
      viewer.value?.entities.remove(item);
    });
  };

  const removeNonStaticEntites = () => {
    const entities = viewer.value?.entities.values.filter(
      (item: MyConstructorOptions) => !item.isStatic
    );
    entities?.forEach((item: MyConstructorOptions) => {
      viewer.value?.entities.remove(item);
    });
  };

  return {
    data,
    initEvent,
    reDraw,
    removeStaticEntites,
    removeNonStaticEntites,
    reset,
  };
};

/**
 * @description 画点线面
 * @param {(Ref<Cesium.Viewer | undefined>)} viewer
 * @return {*}
 */
export const useDraw = (viewer: Ref<Cesium.Viewer | undefined>) => {
  const alpha = 0.3;
  const showLabelHeight = 10_0000; //显示标签高度
  /**
   * @description 画区域
   * @param {Cesium.PolygonHierarchy} polygonHierarchy 区域坐标
   * @param {string} type 类型
   * @param {('area' | 'line')} [drawType='area'] 展示区域类型
   * @return {*}
   */
  const drawArea = (
    polygonHierarchy: Cesium.PolygonHierarchy,
    type: number,
    config?: {
      polygon?: any;
      polyline?: any;
      label?: any;
    },
    drawType: "area" | "line" = "area"
  ) => {
    config = {
      polygon: {
        material: Cesium.Color.RED.withAlpha(alpha),
        ...config?.polygon,
      },
      polyline: {
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.RED.withAlpha(alpha),
          dashLength: 8,
        }),
        ...config?.polyline,
      },
      label: {
        ...config?.label,
      },
    };
    if (drawType === "area") {
      viewer.value?.entities.add({
        name: "area",
        type,
        isStatic: true,
        polygon: {
          hierarchy: polygonHierarchy,
          fill: true,
          ...config.polygon,
        },
      } as unknown as MyConstructorOptions);
    } else {
      // 画线段区域
      const data = [
        ...polygonHierarchy.positions,
        polygonHierarchy.positions[0],
      ];
      viewer.value?.entities.add({
        name: "areaLine",
        type,
        isStatic: true,
        // polygon: {
        //   hierarchy: polygonHierarchy,
        //   fill: false
        // },
        polyline: {
          positions: data,
          width: 4,
          clampToGround: true,
          ...config.polyline,
        },
      } as unknown as MyConstructorOptions);
    }

    // 画区域中心标签
    const centerPoint = getCartesian3FromDegrees(
      getCenterPoint(polygonHierarchy.positions)
    );
    drawLabel(centerPoint, type, config.label);
  };

  /**
   * @description 画线
   * @param {Cesium.Cartesian3[]} polylinePositions 线坐标
   * @param {string} type 类型
   * @param {boolean} [animate=false] 是否动画
   * @return {*}
   */
  const drawLine = (
    polylinePositions: Cesium.Cartesian3[],
    type: number,
    info?: any,
    animate = false
  ) => {
    viewer.value?.entities.add({
      name: "polyline",
      type,
      isStatic: true,
      polyline: {
        positions: polylinePositions,
        width: 6,
        material: Cesium.Color.WHITE.withAlpha(alpha),
        clampToGround: true,
      },
    } as unknown as MyConstructorOptions);
    animate && animateLine(polylinePositions, type);
    drawLineLabel(polylinePositions, type, info);
  };

  const drawLineLabel = (
    polylinePositions: Cesium.Cartesian3[],
    type: number,
    info: any
  ) => {
    for (let i = 0; i < polylinePositions.length - 1; i++) {
      const p1 = polylinePositions[i];
      const p2 = polylinePositions[i + 1];
      const midpoint = Cesium.Cartesian3.midpoint(
        p1,
        p2,
        new Cesium.Cartesian3()
      );
      viewer.value?.entities.add({
        name: "polyline",
        type,
        position: midpoint,
        isStatic: true,
        label: {
          text: info,
          font: "12px sans-serif",
          scale: 0.8,
          fillColor: Cesium.Color.BLACK.withAlpha(0.9),
          backgroundColor: Cesium.Color.WHITE.withAlpha(0.6),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(2, 2),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            showLabelHeight
          ),
          scaleByDistance: new Cesium.NearFarScalar(
            100,
            1.5,
            showLabelHeight,
            0.8
          ),
          pixelOffset: new Cesium.Cartesian2(0, -10),
        },
      } as unknown as MyConstructorOptions);
    }
  };

  /**
   * @description 画点
   * @param {Cesium.Cartesian3} position
   * @param {string} type
   * @param {{
   *       name?: string;
   *       content?: string;
   *     }} [data]
   * @param {{
   *       size?: number;
   *       img?: string;
   *       animate?: boolean;
   *       billboard?: any;
   *       label?: any;
   *       point?: any;
   *     }} [config]
   * @return {*}
   */
  const drawPoint = (
    position: Cesium.Cartesian3,
    type: number,
    data?: {
      name?: string;
      content?: string;
      wellType?: WellType;
    },
    config?: {
      size?: number;
      img?: string;
      animate?: boolean;
      billboard?: any;
      label?: any;
      point?: any;
    }
  ) => {
    config = {
      size: 4,
      img: "",
      animate: false,
      billboard: {},
      label: {},
      point: {},
      ...config,
    };
    if (config?.img) {
      config.animate && animatePoint(position, type, data?.wellType);
      viewer.value?.entities.add({
        position: position,
        type, //用来筛选一级展示对象
        data, // 用来存信息
        wellType: data?.wellType || "", //用来筛选二级井展示对象
        isStatic: true, //用来区分地图标点还是静态渲染
        billboard: {
          image: config.img,
          width: config.size,
          height: config.size,
          color: Cesium.Color.RED,
          ...config.billboard,
        },
        label: {
          text: data?.name,
          font: "12px sans-serif",
          scale: 0.8,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          fillColor: new Cesium.Color(0.2, 0.494, 0.8, 1),
          backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
          showBackground: true,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            showLabelHeight
          ),
          scaleByDistance: new Cesium.NearFarScalar(
            100,
            1.5,
            showLabelHeight,
            0.8
          ),
          ...config.label,
        },
      } as unknown as MyConstructorOptions);
    } else {
      config.animate && animatePoint(position, type, data?.wellType);
      viewer.value?.entities.add({
        position: position,
        type,
        data,
        wellType: data?.wellType || "",
        isStatic: true,
        point: {
          pixelSize: config.size,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          ...config.point,
        },
        label: {
          text: data?.name,
          font: "12px sans-serif",
          scale: 0.8,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          fillColor: new Cesium.Color(0.2, 0.494, 0.8, 1),
          backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
          showBackground: true,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            showLabelHeight
          ),
          scaleByDistance: new Cesium.NearFarScalar(
            100,
            1.5,
            showLabelHeight,
            0.8
          ),
          ...config.label,
        },
      } as unknown as MyConstructorOptions);
    }
  };

  /**
   * @description 画label
   * @param {Cesium.Cartesian3} position
   * @param {number} type
   * @param {*} [info]
   */
  const drawLabel = (
    position: Cesium.Cartesian3,
    type: number,
    label?: any
  ) => {
    viewer.value?.entities.add({
      position: position,
      type,
      isStatic: true,
      label: {
        showbackground: false,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: 0,
        scaleByDistance: new Cesium.NearFarScalar(100, 2, 100_0000, 0.5),
        // pixelOffset: new Cesium.Cartesian2(0, -20),
        // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
        //   showLabelHeight
        // ),
        // 这里设置了就不会被遮盖了，设为负值则在更上层
        // eyeOffset: new Cesium.Cartesian3(0, 0, -10000),
        ...label,
      },
    } as unknown as MyConstructorOptions);
  };
  /**
   * @description 初始化鼠标移入事件
   */
  const initHoverEvent = () => {
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
          pick.id.name !== "areaLine" &&
          pick.id.name !== "area" &&
          pick.id.name !== "polyline"
        ) {
          if (pick.id.data && pick.id.data.content) {
            (viewer.value as any)._container.style.cursor = "pointer";
            showTooltip(move.endPosition.x, move.endPosition.y, pick.id);
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
  };
  /**
   * @description 管道动画
   */
  const animateLine = (
    polylinePositions: Cesium.Cartesian3[],
    type: number
  ) => {
    // 定义运动时间（以秒为单位）
    const duration = 2.0;
    let index = 1;
    let startPoint = polylinePositions[index - 1];
    let endPoint = polylinePositions[index];
    let positions: Cesium.Cartesian3[] = [polylinePositions[0]];

    viewer.value?.entities.add({
      name: "polyline",
      type,
      isStatic: true,
      polyline: {
        positions: new Cesium.CallbackProperty(function () {
          return positions;
        }, false),
        width: 6,
        material: Cesium.Color.BLACK,
        clampToGround: true,
      },
    } as unknown as MyConstructorOptions);

    // 定义一个函数来计算轨迹上任意时间点的位置
    function calculatePosition(t: number) {
      // 使用简单的线性插值计算位置
      let ratio = t / duration;
      // // 解决动画到下一个时位置不准确的问题
      if (ratio > 1) {
        ratio = 1;
      }
      if (ratio >= 0.97) {
        ratio = 1;
      }
      return Cesium.Cartesian3.lerp(
        startPoint,
        endPoint,
        ratio,
        new Cesium.Cartesian3()
      );
    }
    // 使用requestAnimationFrame来更新实体位置
    let startTime = 0;
    function animate(time: number) {
      if (!startTime) {
        startTime = time;
      }
      let t = (time - startTime) / 1000; // 将时间转换为秒
      t = Number(t.toFixed(2));
      if (t > duration) {
        // 每个线段周期重置
        startTime = 0;
        index++;
        if (index > polylinePositions.length - 1) {
          index = 1;
          positions = [polylinePositions[index - 1]];
        }
        startPoint = polylinePositions[index - 1];
        endPoint = polylinePositions[index];
      }
      const position = calculatePosition(t);
      if (startTime) {
        // 重置之后 calculatePosition 函数会返回第一个点，需要跳过 否则会闪一下
        positions[index] = position.clone(); // 更新实体位置
      }
      viewer.value?.scene.requestRender();
      requestAnimationFrame(animate); // 递归调用，继续动画
    }
    requestAnimationFrame(animate); // 开始动画
  };
  /**
   * @description 点动画
   */
  const animatePoint = (
    position: Cesium.Cartesian3,
    type: number,
    wellType?: string
  ) => {
    // 定义运动时间（以秒为单位）
    const duration = 2.0;
    const size = 0;

    const p1 = viewer.value?.entities.add({
      type,
      wellType: wellType || "",
      position: position,
      isStatic: true,
      point: {
        pixelSize: size,
        color: Cesium.Color.TRANSPARENT,
        outlineColor: Cesium.Color.WHITE.withAlpha(0.3),
        outlineWidth: 2,
      },
    } as unknown as MyConstructorOptions);
    const p2 = viewer.value?.entities.add({
      type,
      wellType: wellType || "",
      position: position,
      isStatic: true,
      point: {
        pixelSize: size,
        color: Cesium.Color.TRANSPARENT,
        outlineColor: Cesium.Color.WHITE.withAlpha(0.3),
        outlineWidth: 2,
      },
    } as unknown as MyConstructorOptions);
    const p3 = viewer.value?.entities.add({
      type,
      wellType: wellType,
      position: position,
      isStatic: true,
      point: {
        pixelSize: size,
        color: Cesium.Color.TRANSPARENT,
        outlineColor: Cesium.Color.WHITE.withAlpha(0.3),
        outlineWidth: 2,
      },
    } as unknown as MyConstructorOptions);

    // 使用requestAnimationFrame来更新实体位置
    let startTime = 0;
    function animate(time: number) {
      if (!startTime) {
        startTime = time;
      }
      const t = (time - startTime) / 1000; // 将时间转换为秒
      if (t > duration) {
        // 每个线段周期重置
        startTime = 0;
      }
      (p1!.point!.pixelSize as any) = size + t * 12;
      (p1!.point!.outlineColor as any) = Cesium.Color.WHITE.withAlpha(
        0.3 + t * 0.2
      );
      (p2!.point!.pixelSize as any) = size + t * 9;
      (p2!.point!.outlineColor as any) = Cesium.Color.WHITE.withAlpha(
        0.3 + t * 0.1
      );
      (p3!.point!.pixelSize as any) = size + t * 6;
      (p3!.point!.outlineColor as any) = Cesium.Color.WHITE.withAlpha(
        0.3 + t * 0.05
      );
      viewer.value?.scene.requestRender();
      requestAnimationFrame(animate); // 递归调用，继续动画
    }
    requestAnimationFrame(animate); // 开始动画
  };
  /**
   * @description 根据搜索数据画图
   */
  const drawMapByData = (data: CesiumData[]) => {
    // 获取所有实体的笛卡尔坐标
    const allPointData: Cesium.Cartesian3[] = [];
    data.forEach((item) => {
      // 画面
      if (
        item.type === CesiumFilterType.Block ||
        item.type === CesiumFilterType.Platform
      ) {
        const positions = item.pointData?.map((p) =>
          getCartesian3FromDegrees([p.lon, p.lat])
        );
        const polygonHierarchy = new Cesium.PolygonHierarchy(positions);
        if (item.type === CesiumFilterType.Block) {
          drawArea(
            polygonHierarchy,
            item.type,
            {
              polyline: {
                material: new Cesium.PolylineDashMaterialProperty({
                  color: Cesium.Color.RED.withAlpha(1),
                  dashLength: 20,
                }),
              },
              label: {
                font: "30px sans-serif",
                text: item.name,
                fillColor: Cesium.Color.RED.withAlpha(0.3),
                // showBackground: true,
                // 这里设置了就不会被遮盖了，设为负值则在更上层
                // eyeOffset: new Cesium.Cartesian3(0, 0, -10000)
              },
            },
            "line"
          );
        }
        if (item.type === CesiumFilterType.Platform) {
          drawArea(
            polygonHierarchy,
            item.type,
            {
              polyline: {
                material: new Cesium.PolylineDashMaterialProperty({
                  color: Cesium.Color.BLUE.withAlpha(1),
                  dashLength: 20,
                }),
              },
              label: {
                font: "14px sans-serif",
                text: item.name,
                fillColor: Cesium.Color.BLUE.withAlpha(0.3),
                showBackground: false,
                // 这里设置了就不会被遮盖了，设为负值则在更上层
                // eyeOffset: new Cesium.Cartesian3(0, 0, -1000)
              },
            },
            "line"
          );
        }
        item.pointData?.forEach((p) => {
          const position = getCartesian3FromDegrees([p.lon, p.lat]);
          allPointData.push(position.clone());
          drawPoint(
            position,
            item.type,
            {
              name: p.flag,
              content: p.remark,
            },
            {
              label: {
                fillColor: Cesium.Color.BLACK,
              },
            }
          );
        });
      }
      // 画线
      if (item.type === CesiumFilterType.Pipeline) {
        const positions = item.pointData?.map((p) =>
          getCartesian3FromDegrees([p.lon, p.lat])
        );
        drawLine(positions!, item.type, item.name, true);
        item.pointData?.forEach((p) => {
          const position = getCartesian3FromDegrees([p.lon, p.lat]);
          allPointData.push(position.clone());
          drawPoint(
            position,
            item.type,
            {
              name: p.flag,
              content: p.remark,
            },
            {
              point: {
                color: Cesium.Color.WHITE,
                pixelSize: 6,
                outlineWidth: 0,
              },
              label: {
                fillColor: Cesium.Color.BLACK,
              },
            }
          );
        });
      }
      // 画点
      if (
        item.type === CesiumFilterType.Well ||
        item.type === CesiumFilterType.Device
      ) {
        item.pointData?.forEach((p) => {
          const position = getCartesian3FromDegrees([p.lon, p.lat], 2);
          allPointData.push(position.clone());
          // 井和设备label区别一下
          if (item.type === CesiumFilterType.Well) {
            // 画设备和井 name用name
            drawPoint(
              position,
              item.type,
              {
                name: item.name,
                content: p.remark,
                wellType: item.wellType,
              },
              {
                size: 16,
                img: item.legendUrl,
                animate: true,
              }
            );
          }
          if (item.type === CesiumFilterType.Device) {
            // 画设备和井 name用name
            drawPoint(
              position,
              item.type,
              {
                name: item.name,
                content: p.remark,
              },
              {
                size: 16,
                img: item.legendUrl,
                animate: true,
                label: {
                  fillColor: new Cesium.Color(0.722, 0.51, 0.188, 1),
                },
              }
            );
          }
        });
      }
    });
    return allPointData;
  };

  return {
    // drawArea,
    // drawLine,
    // drawPoint,
    drawMapByData,
    initHoverEvent,
  };
};

const showTooltip = (x: number, y: number, entity: any) => {
  if (entity.data && entity.data.content) {
    const tipsEl = document.getElementById("cesium-tips") as HTMLElement;
    if (tipsEl) {
      tipsEl.style.display = "block";
      tipsEl.style.left = x + 20 + "px";
      tipsEl.style.top = y + "px";
      tipsEl.innerHTML = `<div>${entity.data.content}</div>`;
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
  height?: number
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

/**
 * @description gis图例筛选类型
 */
export const filterGisType = [
  {
    label: "区块",
    id: "1",
  },
  {
    label: "平台",
    id: "2",
  },
  {
    label: "井",
    id: "3",
    children: [
      {
        label: "直井",
        id: "直井",
      },
      {
        label: "水平井",
        id: "水平井",
      },
      {
        label: "定向井",
        id: "定向井",
      },
    ],
  },
  {
    label: "管道",
    id: "4",
  },
  {
    label: "设备",
    id: "5",
  },
];
