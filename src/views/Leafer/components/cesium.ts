import { CesiumData, CesiumDataItem, MyConstructorOptions } from "@/types/gis";
import * as Cesium from "cesium";
import { ElMessage } from "element-plus";
import { onBeforeUnmount, Ref, ref, shallowRef } from "vue";

/**
 * @description 初始化cesium
 * @param id
 * @return {*}
 */
export const initCesium = (id: string, checkedWell: Ref<string[]>) => {
  const viewer = shallowRef<Cesium.Viewer>();
  const defaultConfig = {
    max: 1000_0000, //最大缩放
    min: 100, //最小缩放
  };
  const marker = [] as Cesium.Entity[];

  const init = () => {
    viewer.value = new Cesium.Viewer(id, {
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
    viewer.value.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: "http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
      })
    );

    // 获取比例 渲染清晰 抗锯齿
    viewer.value.resolutionScale = window.devicePixelRatio;
    viewer.value.scene.postProcessStages.fxaa.enabled = true;

    // 禁止鼠标双击放大事件
    viewer.value.screenSpaceEventHandler.setInputAction(() => {},
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    // 鼠标移入事件
    viewer.value.screenSpaceEventHandler.setInputAction(
      (move: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
        // 获取地图上的点位实体(entity)坐标
        const pick = viewer.value?.scene.pick(move.endPosition);
        if (pick && pick.id) {
          // 如果pick不是undefined，那么就是点到点位了
          (viewer.value as any)._container.style.cursor = "pointer";
        } else {
          (viewer.value as any)._container.style.cursor = "default";
        }
      },
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );

    // 鼠标单击选中取消
    viewer.value.screenSpaceEventHandler.setInputAction(
      (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        // 获取地图上的点位实体(entity)坐标
        const pick = viewer.value?.scene.pick(click.position);
        if (pick && pick.id) {
          const entity = pick.id as Cesium.Entity;
          const checked = entity.properties!.checked.valueOf();
          const id = entity.id;
          if (checked && checkedWell.value.length - 1 === 0) {
            ElMessage.warning("最少选择1口井");
            return;
          }
          if (!checked && checkedWell.value.length + 1 > 3) {
            ElMessage.warning("最多只能选择3口井");
            return;
          }
          if (checked) {
            // 选中-》取消选中
            checkedWell.value.splice(checkedWell.value.indexOf(id), 1);
            entity.properties!.checked = false;
            entity.label!.fillColor = new Cesium.ConstantProperty(
              Cesium.Color.BLACK
            );
            entity.label!.backgroundColor = new Cesium.ConstantProperty(
              Cesium.Color.WHITE.withAlpha(0.8)
            );
            // 重新渲染
          } else {
            // 取消选中-》选中
            checkedWell.value.push(id);
            entity.properties!.checked = true;
            entity.label!.fillColor = new Cesium.ConstantProperty(
              Cesium.Color.WHITE
            );
            entity.label!.backgroundColor = new Cesium.ConstantProperty(
              Cesium.Color.fromCssColorString("#409eff").withAlpha(0.8)
            );
          }
          viewer.value?.scene.requestRender();
        }
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );

    (viewer.value?.scene.screenSpaceCameraController as any).zoomEventTypes =
      []; // 禁用默认缩放事件
    // 自定义缩放逻辑 解决缩放过多问题
    document.addEventListener("wheel", function (event) {
      event.preventDefault();
      const delta = Math.sign(event.deltaY); // 获取滚轮方向
      const zoomAmount = 5; // 自定义缩放倍率
      if (delta > 0) {
        viewer.value?.camera.zoomOut(
          viewer.value?.camera.positionCartographic.height / zoomAmount
        );
      } else {
        viewer.value?.camera.zoomIn(
          viewer.value?.camera.positionCartographic.height / zoomAmount
        );
      }
    });
  };

  /**
   * @description 通过矩形设置相机位置
   * @param {CesiumData[]} data
   */
  const setCameraPosition = (data: CesiumData[]) => {
    const points = data.map((item) => {
      return {
        lon: item.pointData[0].lon,
        lat: item.pointData[0].lat,
      };
    });
    // 假设你有一个矩形，由四个角点定义
    const rect = getRectangle(points);
    // 调整摄像机距离以确保矩形完全可见
    viewer.value?.camera.setView({
      destination: rect,
    });
  };

  /**
   * @description 通过点获取矩形
   * @param {CesiumDataItem[]} data
   * @return {*}
   */
  const getRectangle = (data: CesiumDataItem[]) => {
    // 初始化边界值
    let minLongitude = Cesium.Math.toRadians(Infinity);
    let maxLongitude = Cesium.Math.toRadians(-Infinity);
    let minLatitude = Cesium.Math.toRadians(Infinity);
    let maxLatitude = Cesium.Math.toRadians(-Infinity);

    // 遍历点数组，找到边界值
    data.forEach((point) => {
      const lon = Cesium.Math.toRadians(point.lon);
      const lat = Cesium.Math.toRadians(point.lat);
      if (lon < minLongitude) minLongitude = lon;
      if (lon > maxLongitude) maxLongitude = lon;
      if (lat < minLatitude) minLatitude = lat;
      if (lat > maxLatitude) maxLatitude = lat;
    });

    // 创建包含所有点的矩形（边界框）
    const boundingRectangle = new Cesium.Rectangle(
      minLongitude - 0.05,
      minLatitude - 0.05,
      maxLongitude + 0.05,
      maxLatitude + 0.05
    );
    return boundingRectangle;
  };

  const drawPoint = (item: CesiumData) => {
    const position = Cesium.Cartesian3.fromDegrees(
      item.pointData[0].lon,
      item.pointData[0].lat
    );
    const fillColor = checkedWell.value.includes(item.businessId!)
      ? Cesium.Color.WHITE
      : Cesium.Color.BLACK;
    const background = checkedWell.value.includes(item.businessId!)
      ? Cesium.Color.fromCssColorString("#409eff").withAlpha(0.8)
      : Cesium.Color.WHITE.withAlpha(0.8);
    const point = viewer.value!.entities.add({
      position: position,
      name: item.name,
      id: item.businessId,
      properties: {
        checked: checkedWell.value.includes(item.businessId!),
      },
      point: {
        pixelSize: 12,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: item.name,
        font: "10px",
        scale: 0.7,
        pixelOffset: new Cesium.Cartesian2(0, -20),
        fillColor: fillColor,
        backgroundColor: background,
        showBackground: true,
        outlineWidth: 0,
        backgroundPadding: new Cesium.Cartesian2(8, 10),
      },
    });
    marker.push(point);
  };

  const drawCesiumPoint = (data: CesiumData[]) => {
    data.forEach((item) => {
      drawPoint(item);
    });
  };

  const destroyed = () => {
    viewer.value?.entities.removeAll();
    viewer.value?.destroy();
    viewer.value = undefined;
  };

  onBeforeUnmount(() => {
    destroyed();
  });

  return {
    viewer, //视图
    // adjustNorthUp,
    // flyTo,
    // destroyed,
    init, //初始化
    setCameraPosition,
    drawCesiumPoint,
    // orbitTickFunction,
    // getFrame,
  };
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

const getColor = (c: any) => {
  return new Cesium.CallbackProperty(function (time, result) {
    // 根据某种逻辑计算颜色
    const color = new Cesium.Color(c); // 替换...为实际的颜色值
    result = color; // 注意：这里通常不需要显式地将result设置为color，因为Cesium会自动处理
    // 但是，由于Cesium的API设计，你可能需要返回一个Cesium.Property的实例，对于颜色来说就是Cesium.Color
    // 而在这种情况下，Cesium.Color已经是一个“值属性”，它自身就代表了颜色值
    // 因此，直接返回color即可（实际上Cesium内部会处理这个转换）
    return color; // 尽管这里看起来有些冗余，但按照Cesium的API设计，这是正确的做法
  }, false);
};
