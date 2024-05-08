import {
  CesiumConfig,
  CesiumDataType,
  CesiumDrawGetData,
  MyConstructorOptions,
} from "@/types/gis";
import * as Cesium from "cesium";
import { Ref, ref } from "vue";

/**
 * @description gis筛选类型
 */
export const filterType = [
  {
    label: "方案",
    value: "plan",
  },
  {
    label: "区块",
    value: "block",
  },
  {
    label: "平台",
    value: "platform",
  },
  {
    label: "井号",
    value: "well",
  },
  {
    label: "管道",
    value: "pipeline",
  },
  {
    label: "设备",
    value: "device",
  },
];

export const Token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5NGI2Y2QzZS01NDNhLTQzNjItOWQ4ZC1hYTk2ZDJkMjg2NjEiLCJpZCI6MjAxODIxLCJpYXQiOjE3MTAzOTkxNDJ9.QfyFdDreE7x97CtwJtX_z3XcLpwfqfadhdtnIWHRBiU";

export const initCesium = (config?: CesiumConfig) => {
  const viewer = ref<Cesium.Viewer>();
  const roadMap = ref<Cesium.ImageryLayer>();
  const hasRoadMap = ref(true);
  const defaultConfig = {
    lookAt: [104.045034, 30.540885, 2000],
    ...config,
  };

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
      // 地形
      // terrainProvider: await Cesium.createWorldTerrainAsync({
      //   requestVertexNormals: true,
      //   requestWaterMask: true,
      // }),

      baseLayer: new Cesium.ImageryLayer(
        new Cesium.UrlTemplateImageryProvider({
          url: "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
        })
      ),
    });
    // 最小缩放高度（米）
    viewer.value.scene.screenSpaceCameraController.minimumZoomDistance = 200;
    // 最大缩放高度（米）
    viewer.value.scene.screenSpaceCameraController.maximumZoomDistance = 1000000;
    // 去除版权样式
    (viewer.value.cesiumWidget.creditContainer as HTMLElement).style.display =
      "none"; //去除版权样式
    // 再加上高德影像注记地图
    roadMap.value = viewer.value.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: "http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
      })
    );
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
        pitch: -Cesium.Math.PI / 2,
        roll: 0,
      },
    });
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
   * @description 根据笛卡尔坐标获取经纬度
   */
  const getDegreesFromCartesian = (cartesian: Cesium.Cartesian3) => {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    return [longitude, latitude];
  };

  /**
   * @description 根据经纬度获取笛卡尔坐标
   */
  const getCartesian3FromDegrees = (degrees: number[]) => {
    const cartesian = Cesium.Cartesian3.fromDegrees(degrees[0], degrees[1]);
    return cartesian;
  };

  /**
   * @description 放大缩小地图
   */
  const zoomFn = (type: "zoomIn" | "zoomOut", step = 200) => {
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
    // 如果地图方向已经为正北方向，则直接返回
    if (
      viewer.value?.scene.camera.heading === 6.283185307179586 &&
      viewer.value?.scene.camera.pitch === -1.5707963267948966 &&
      viewer.value?.scene.camera.roll === 0
    ) {
      return;
    }
    // 旋转到正北方向
    const centerResult = viewer.value!.camera.pickEllipsoid(
      new Cesium.Cartesian2(
        viewer.value!.canvas.clientWidth / 2,
        viewer.value!.canvas.clientHeight / 2
      )
    );
    const curPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
      centerResult!
    );
    const curLongitude = (curPosition.longitude * 180) / Math.PI;
    const curLatitude = (curPosition.latitude * 180) / Math.PI;
    viewer.value?.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        curLongitude,
        curLatitude,
        2000
      ),
      orientation: {
        heading: 0, //偏航角 摇头
        pitch: -Cesium.Math.PI / 2, //俯仰角 点头
        roll: 0, //翻滚角 歪头
      },
      duration: 2,
    });
  };

  /**
   * @description 是否加载道路图
   */
  const loadRoadNetwork = () => {
    if (hasRoadMap.value) {
      viewer.value?.imageryLayers.remove(roadMap.value!);
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
  const flyTo = (longitude: number, latitude: number) => {
    viewer.value?.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 1000),
      orientation: {
        heading: 0, //偏航角 摇头
        pitch: -Cesium.Math.PI / 2, //俯仰角 点头
        roll: 0, //翻滚角 歪头
      },
    });
  };

  const destroyed = () => {
    viewer.value?.entities.removeAll();
    viewer.value?.destroy();
    viewer.value = undefined;
  };

  return {
    viewer, //视图
    getCartesian,
    getDegreesFromCartesian,
    getCartesian3FromDegrees,
    zoomFn,
    adjustNorthUp,
    loadRoadNetwork,
    flyTo,
    destroyed,
    init, //初始化
  };
};

export const useDrawAndGetData = (viewer: Ref<Cesium.Viewer | undefined>) => {
  const data = ref<Array<CesiumDrawGetData>>([]); //存储坐标数据
  const index = ref<number>(0); //当前点的索引
  const pickEntity = ref<Cesium.Entity>(); //当前点击的实体

  // 多边形
  // let polygon: Cesium.Entity;
  const polygonHierarchy = new Cesium.PolygonHierarchy();
  const polygonEntity = new Cesium.Entity({
    name: "polygon",
    polygon: {
      hierarchy: new Cesium.CallbackProperty(function () {
        return polygonHierarchy;
      }, false),
      outline: true,
      outlineColor: Cesium.Color.RED,
      outlineWidth: 10,
      fill: true,
      material: Cesium.Color.RED.withAlpha(0.7),
    },
  });

  // 线段
  // let polyline: Cesium.Entity;
  let polylinePositions: Cesium.Cartesian3[] = [];
  const polylineEntity = new Cesium.Entity({
    name: "polyline",
    polyline: {
      positions: new Cesium.CallbackProperty(function () {
        return polylinePositions;
      }, false),
      width: 20,
      material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.WHITE),
      clampToGround: true,
    },
  });

  // 初始化事件
  const initEvent = (type: CesiumDataType) => {
    if (!viewer.value) {
      return;
    }
    if (type === CesiumDataType.Polyline) {
      viewer.value.entities.add(polylineEntity);
    }
    if (type === CesiumDataType.Polygon) {
      viewer.value.entities.add(polygonEntity);
    }
    // 禁用双击事件
    viewer.value.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
    // 监听地图点击事件
    viewer.value.screenSpaceEventHandler.setInputAction(
      (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const pick = viewer.value?.scene.pick(click.position);
        if (!pick) {
          // 获取点击位置笛卡尔坐标
          const cartesian = viewer.value?.camera.pickEllipsoid(
            click.position,
            viewer.value?.scene.globe.ellipsoid
          );
          // 获取点击位置的经纬度坐标
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian!);
          const longitude = Cesium.Math.toDegrees(cartographic.longitude);
          const latitude = Cesium.Math.toDegrees(cartographic.latitude);
          // 画点
          if (type === CesiumDataType.Point) {
            // 画单个点 重绘
            index.value = 0;
            data.value = [
              { degrees: [longitude, latitude], index: index.value },
            ];
            viewer.value?.entities.removeAll();
            // 画点
            drawPointFn([longitude, latitude], index.value);
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
            polygonHierarchy.positions.push(cartesian!.clone());
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
          const tipsEl = document.getElementById("tips") as HTMLElement;
          if (tipsEl) {
            tipsEl.style.display = "none";
          }
        }
        if (pickEntity.value) {
          // 获取点位实体的坐标
          const index = Number(pickEntity.value.id);

          const cartesian = getCartesian(move.endPosition);
          const degrees = getDegreesFromCartesian(cartesian!);

          // 修改坐标
          data.value[index].degrees = degrees;
          // 更新点位置
          const point = viewer.value!.entities.getById(String(index))!;
          (point.position as any) = getCartesian3FromDegrees(degrees);
          (point.label!.text as any) = `点${index + 1}--[${degrees[0]},${
            degrees[1]
          }]`;
          // 更新线的位置
          if (type === CesiumDataType.Polyline) {
            polylinePositions[index] = cartesian!;
          }
          // 更新面的位置
          if (type === CesiumDataType.Polygon) {
            polygonHierarchy.positions[index] = cartesian!;
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
   */
  const drawPointFn = (position: number[], index: number, data?: any) => {
    // 添加点
    viewer.value?.entities.add({
      id: String(index),
      name: "point",
      data: data,
      position: Cesium.Cartesian3.fromDegrees(position[0], position[1]),
      point: {
        pixelSize: 10,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: `点${index + 1}--[${position[0]},${position[1]}]`,
        font: "12px sans-serif",
        pixelOffset: new Cesium.Cartesian2(0, -24),
        fillColor: Cesium.Color.RED,
        backgroundColor: Cesium.Color.WHITE.withAlpha(0.5),
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
   * @description 根据笛卡尔坐标获取经纬度
   */
  const getDegreesFromCartesian = (cartesian: Cesium.Cartesian3) => {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    return [longitude, latitude];
  };

  /**
   * @description 根据经纬度获取笛卡尔坐标
   */
  const getCartesian3FromDegrees = (degrees: number[]) => {
    const cartesian = Cesium.Cartesian3.fromDegrees(degrees[0], degrees[1]);
    return cartesian;
  };

  /**
   * @description 编辑重画
   */
  const reDraw = (oldData: CesiumDrawGetData[], type: CesiumDataType) => {
    // 清空之前画的数据 不然会复用数据
    reset();
    oldData.forEach((item, index) => {
      // 重画 点线面
      drawPointFn(item.degrees, index, item.data);
      if (type === CesiumDataType.Polyline) {
        polylinePositions.push(getCartesian3FromDegrees(item.degrees));
      }
      if (type === CesiumDataType.Polygon) {
        polygonHierarchy.positions.push(getCartesian3FromDegrees(item.degrees));
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
    polygonHierarchy.positions = [];
  };

  return {
    data,
    initEvent,
    reDraw,
  };
};

export const useDraw = (viewer: Ref<Cesium.Viewer | undefined>) => {
  /**
   * @description 画区域
   */
  const drawArea = (
    polygonHierarchy: Cesium.PolygonHierarchy,
    type: "area" | "line" = "area"
  ) => {
    if (type === "area") {
      const area = viewer.value?.entities.add({
        name: "area",
        polygon: {
          hierarchy: polygonHierarchy,
          fill: true,
          material: Cesium.Color.RED.withAlpha(0.5),
        },
      });
      return area;
    } else {
      const data = [
        ...polygonHierarchy.positions,
        polygonHierarchy.positions[0],
      ];
      const area = viewer.value?.entities.add({
        name: "areaLine",
        polygon: {
          hierarchy: polygonHierarchy,
          fill: false,
          material: Cesium.Color.RED.withAlpha(0.2),
        },
        polyline: {
          positions: data,
          width: 6,
          material: Cesium.Color.RED.withAlpha(0.8),
          clampToGround: true,
        },
      });
      return area;
    }
  };
  /**
   * @description 画线
   */
  const drawLine = (polylinePositions: Cesium.Cartesian3[]) => {
    const line = viewer.value?.entities.add({
      name: "polyline",
      polyline: {
        positions: polylinePositions,
        width: 8,
        material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.WHITE),
        clampToGround: true,
      },
    });
    return line;
  };
  /**
   * @description 画点
   */
  const drawPoint = (position: Cesium.Cartesian3, img?: string, size = 16) => {
    if (img) {
      const point = viewer.value?.entities.add({
        position: position,
        billboard: {
          image: img,
          width: size,
          height: size,
          color: Cesium.Color.RED,
        },
      });
      return point;
    } else {
      const point = viewer.value?.entities.add({
        position: position,
        point: {
          pixelSize: size,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
      });
      return point;
    }
  };

  const initHoverEvent = () => {
    // 当创建图形HOOK和绘画HOOK同时存在，移动的事件会覆盖，绘画优先
    const moveFn = viewer.value?.screenSpaceEventHandler.getInputAction(
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
    console.log(moveFn);
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
          (viewer.value as any)._container.style.cursor = "pointer";
          showTooltip(move.endPosition.x, move.endPosition.y);
        } else {
          // 移除弹框
          (viewer.value as any)._container.style.cursor = "default";
          const tipsEl = document.getElementById("tips") as HTMLElement;
          if (tipsEl) {
            tipsEl.style.display = "none";
          }
        }
      },
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
  };

  // onMounted(() => {
  //   // viewer = shallowRef(viewer.value);
  //   initHoverEvent();
  // });
  return {
    drawArea,
    // drawAreaLine,
    drawLine,
    drawPoint,
    initHoverEvent,
  };
};

const showTooltip = (x: number, y: number, data?: any) => {
  const tipsEl = document.getElementById("tips") as HTMLElement;
  if (tipsEl) {
    tipsEl.style.display = "block";
    tipsEl.style.left = x + 10 + "px";
    tipsEl.style.top = y + "px";
    tipsEl.innerHTML = `<div>${x}</div><div>${y}</div><div>${data}</div>`;
  } else {
    const tipsEl = document.createElement("div");
    tipsEl.id = "tips";
    tipsEl.style.position = "absolute";
    tipsEl.style.backgroundColor = "rgba(0,0,0,0.5)";
    tipsEl.style.color = "white";
    tipsEl.style.padding = "5px";
    tipsEl.style.borderRadius = "5px";
    document.getElementById("cesium-container")!.appendChild(tipsEl);
    tipsEl.style.left = x + 10 + "px";
    tipsEl.style.top = y + "px";
  }
};
