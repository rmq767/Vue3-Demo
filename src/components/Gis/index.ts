import {
  CesiumConfig,
  CesiumData,
  CesiumDataType,
  CesiumDrawGetData,
  CesiumFilterType,
  MyConstructorOptions,
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
  const hasRoadMap = ref(true);
  const defaultConfig = {
    lookAt: [108.904967, 34.313311, 500_0000], //首次聚焦位置
    max: 500_0000, //最大缩放
    min: 200, //最小缩放
    flyHeight: 8000, //飞行高度
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
      // 点击选中元素
      // selectionIndicator: false,
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
   * @description 放大缩小地图
   */
  const zoomFn = (type: "zoomIn" | "zoomOut", step = 200) => {
    debugger;
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
        defaultConfig.flyHeight
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
  const flyTo = (longitude: number, latitude: number) => {
    viewer.value?.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        longitude,
        latitude,
        defaultConfig.flyHeight
      ),
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
    zoomFn,
    adjustNorthUp,
    loadRoadNetwork,
    flyTo,
    destroyed,
    init, //初始化
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

  // 多边形
  const polygonHierarchy = new Cesium.PolygonHierarchy();
  const polygonEntity = new Cesium.Entity({
    name: "polygon",
    isStatic: false,
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
        polygonHierarchy.positions.push(
          getCartesian3FromDegrees(item.degrees, 10)
        );
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
    drawType: "area" | "line" = "area"
  ) => {
    if (drawType === "area") {
      viewer.value?.entities.add({
        name: "area",
        type,
        isStatic: true,
        polygon: {
          hierarchy: polygonHierarchy,
          fill: true,
          material: Cesium.Color.RED.withAlpha(alpha),
        },
      } as unknown as MyConstructorOptions);
    } else {
      const data = [
        ...polygonHierarchy.positions,
        polygonHierarchy.positions[0],
      ];
      viewer.value?.entities.add({
        name: "areaLine",
        type,
        isStatic: true,
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
      } as unknown as MyConstructorOptions);
    }
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
          // pixelOffset: new Cesium.Cartesian2(0, -16),
          fillColor: Cesium.Color.GREEN,
          backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(4, 4),
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
      config.animate && animatePoint(position, type);
      viewer.value?.entities.add({
        position: position,
        type,
        data,
        isStatic: true,
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
          pixelOffset: new Cesium.Cartesian2(0, -16),
          fillColor: Cesium.Color.BLACK,
          backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
          showBackground: true,
          ...config.billboard,
        },
      } as unknown as MyConstructorOptions);
    } else {
      config.animate && animatePoint(position, type);
      viewer.value?.entities.add({
        position: position,
        type,
        data,
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
          pixelOffset: new Cesium.Cartesian2(0, -16),
          fillColor: Cesium.Color.BLACK,
          backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
          showBackground: true,
          ...config.label,
        },
      } as unknown as MyConstructorOptions);
    }
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
          const tipsEl = document.getElementById("tips") as HTMLElement;
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
        material: Cesium.Color.GREEN,
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
  const animatePoint = (position: Cesium.Cartesian3, type: number) => {
    // 定义运动时间（以秒为单位）
    const duration = 2.0;
    const size = 0;

    const p1 = viewer.value?.entities.add({
      type,
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
        drawArea(polygonHierarchy, item.type);
        item.pointData?.forEach((p) => {
          const position = getCartesian3FromDegrees([p.lon, p.lat]);
          drawPoint(position, item.type, {
            name: p.flag,
            content: p.remark,
          });
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
          drawPoint(
            position,
            item.type,
            {
              name: p.flag,
              content: p.remark,
            },
            {
              size: 16,
              img: item.legendUrl,
              animate: true,
            }
          );
        });
      }
    });

    // 获取所有可见实体点的笛卡尔坐标
    const allEntities = viewer.value?.entities.values;
    const showEntities = allEntities?.filter((item) => item.show);
    // 获取所有实体的笛卡尔坐标
    const pointData: Cesium.Cartesian3[] = [];
    showEntities?.forEach((item) => {
      // 线和面没有position 但是线和面有端点，端点有position
      const data = item.position?.getValue(
        viewer.value!.clock.currentTime,
        new Cesium.Cartesian3()
      );
      if (data) {
        pointData.push(data);
      }
    });

    return pointData;
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
    const tipsEl = document.getElementById("tips") as HTMLElement;
    if (tipsEl) {
      tipsEl.style.display = "block";
      tipsEl.style.left = x + 10 + "px";
      tipsEl.style.top = y + "px";
      tipsEl.innerHTML = `<div>${entity.data.content}</div>`;
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
