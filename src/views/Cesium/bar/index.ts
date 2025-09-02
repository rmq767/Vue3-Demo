import { onMounted, onUnmounted, ref, shallowRef } from "vue";
import * as Cesium from "cesium";
import SC from "@/assets/geo/四川省1.json";
import * as turf from "@turf/turf";

const coordinates = [
  {
    position: [101.73, 26.56],
    name: "攀枝花",
    value: 100,
    desc: "攀枝花市，四川省辖地级市，别称渡口、钢城，地处中国西南川滇结合部，位于四川省最南端，东、北面与四川省凉山彝族自治州的会理、德昌、盐源3县接壤，西、南面与云南省的宁蒗、华坪、永仁3县交界，地处攀西裂谷中南段，属浸蚀、剥蚀中山丘陵、山原峡谷地貌，夏季长，四季不分明，而旱、雨季分明，全市总面积7440平方千米。截至2022年10月，全市辖3个区、2个县。2023年末，攀枝花市户籍总人口106.65万人，常住人口121.8万人。",
  },
  {
    position: [103.04, 30.02],
    name: "雅安",
    value: 59,
    desc: "雅安市，别称雨城，四川省地级市，位于四川盆地西缘、邛崃山东麓，东靠成都市、西连甘孜藏族自治州、南接凉山彝族自治州、北接阿坝藏族羌族自治州，属四川盆地西缘山地，跨四川盆地和青藏高原两大地形区，属亚热带季风性湿润气候，全市总面积15046平方千米。 [39]截至2025年3月，雅安市辖2个市辖区、6个县。 [79]截至2024年末，雅安市常住人口143.3万人。",
  },
  {
    position: [103.77, 29.55],
    name: "乐山",
    value: 80,
    desc: "乐山市，古称嘉州、嘉定州，四川省辖地级市，位于四川中部，四川盆地西南部，北与眉山市接壤，东与自贡市、宜宾市毗邻，南与凉山州相接，西与雅安市连界。 [91]地势西南高，东北低，属中亚热带气候带，总面积12720.03平方千米。截至2023年6月，全市辖4个区、6个县，代管1个县级市。 [44]截至2023年底，全市常住人口314.7万人。",
  },
  {
    position: [103.85, 30.08],
    name: "眉山",
    value: 70,
    desc: "眉山市（Meishan City），古称眉州，四川省辖地级市。地处成都平原南部，北接省会成都市，南连乐山市，东邻内江市、资阳市、自贡市，西接雅安市，总面积7140平方千米。 [4]截至2024年10月，眉山市辖2个区、4个县。 [44]截至2024年末，眉山市常住人口295.6万人。 [131]眉山话属于西南官话灌赤片中的岷江小片。",
  },
  {
    position: [104.07, 30.57],
    name: "成都",
    value: 200,
    desc: "成都市（Chengdu City），简称“蓉”，别称蓉城、锦城，四川省辖地级市、省会、副省级市、超大城市，地处中国西南地区、四川盆地西部、青藏高原东缘，地势由西北向东南倾斜，西部以深丘和山地为主，东部主要由平原、台地和部分低山丘陵组成，是成都平原的腹心地带，属亚热带季风气候区，热量充足，雨量丰富，四季分明，雨热同期，总面积14335平方千米，通用语言为西南官话。 [317-318]截至2025年3月，成都市下辖12个区、3个县、代管5个县级市。截至2024年末，成都市常住人口2147.4万人。",
  },
  {
    position: [104.68, 31.47],
    name: "绵阳",
    value: 120,
    desc: "绵阳市（Mianyang City），简称“绵”，别称绵州、涪城，四川省辖地级市，省域副中心城市， [172]Ⅱ型大城市， [171]三线城市。 [179]位于四川盆地西北部，涪江中上游地带。东邻广元市和南充市，南接遂宁市，西接德阳市，西北与阿坝藏族羌族自治州、甘肃省陇南市接壤。介于北纬30°42′—33°03′、东经103°45′—105°43′之间，总面积2.02万平方千米。 [1]截至2022年10月，绵阳市辖3个区、5个县、代管1个县级市。 [169]2023年末，绵阳常住人口491.10万人。 [217]绵阳方言属北方方言区。",
  },
  {
    position: [105.59, 30.53],
    name: "遂宁",
    value: 75,
    desc: "遂宁市，别称斗城、遂州，四川省辖地级市。位于四川盆地中部，涪江中游 [120]，与重庆市、成都市呈等距三角；是成渝经济区区域性中心城市，四川省现代产业基地，以“养心”文化为特色的现代生态花园城市。 [1]总面积5322.25平方公里 [95]，辖2个市辖区、2个县，代管1个县级市。 [74]地处丘陵低山地区，气候属亚热带湿润季风气候 [68]。2024年末，遂宁市常住人口274.8万人，户籍人口351.06万人。 ",
  },
  {
    position: [107.47, 31.21],
    name: "达州",
    value: 80,
    desc: "达州市，四川省辖地级市，公元965年北宋时期改通州为达州而得名 [131]，处于四川省东北部，大巴山南麓，北高南低，由东北向西南倾斜，山、丘间分布宽缓谷地及缓丘平坝，地貌复杂多样，石灰岩广布，喀斯特地貌发育，属亚热带季风气候，气候温和，四季分明，总面积1.66万平方千米。 [19] [38]截至2024年1月，达州市辖2个区、4个县，代管1个县级市， [36]截至2023年末，达州市常住人口532.4万人。",
  },
];
let dataSourceList: Cesium.CustomDataSource[] = [];

export const useCesium = (el: string) => {
  const viewer = shallowRef<Cesium.Viewer>();
  const tooltips = ref({
    x: 0,
    y: 0,
    show: false,
    info: {} as any,
  });
  const activeEntity = ref<Cesium.Entity | null>(); //选中的实体
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
    });
    // 去除版权样式
    (viewer.value.cesiumWidget.creditContainer as HTMLElement).style.display =
      "none"; //去除版权样式
    // 最小缩放高度（米）
    viewer.value.scene.screenSpaceCameraController.minimumZoomDistance = 10_0000;
    // 最大缩放高度（米）
    viewer.value.scene.screenSpaceCameraController.maximumZoomDistance = 100_0000;
    // 四川边界
    addSCRegion(viewer.value!);
    // 添加数据源
    coordinates.forEach((item) => {
      dataSourceList = [];
      const dataSource = initBar(item);
      viewer.value?.dataSources.add(dataSource).then((res) => {
        dataSourceList.push(res);
      });
    });
  };
  /**
   * @description 初始化hover事件，hover到要素上时，要素高亮
   */
  const initHoverEvent = () => {
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.value!.canvas);
    let entity = null as null | Cesium.Entity;
    handler.setInputAction(
      (move: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
        const pick = viewer.value?.scene.pick(move.endPosition);
        if (pick && pick.id) {
          // hover到另一个entity上，移除上一个entity的label
          if (entity && entity !== pick.id) {
            const entityCollection = entity.entityCollection;
            const item = entity.properties as any;
            const label = entityCollection.getById("label" + item.name);
            label!.label!.fillColor = new Cesium.ConstantProperty(
              Cesium.Color.WHITE
            );
          }
          // hover到新的entity上，给新的entity添加label
          entity = pick.id as Cesium.Entity;
          (viewer.value as any)._container.style.cursor = "pointer";
          const entityCollection = entity.entityCollection;
          const item = entity.properties as any;
          const label = entityCollection.getById("label" + item.name);
          label!.label!.fillColor = new Cesium.ConstantProperty(
            Cesium.Color.PINK
          );
          viewer.value?.scene.requestRender();
        } else {
          // 移除上一个entity的label
          (viewer.value as any)._container.style.cursor = "default";
          if (!pick && entity) {
            const entityCollection = entity.entityCollection;
            const item = entity.properties as any;
            const label = entityCollection.getById("label" + item.name);
            label!.label!.fillColor = new Cesium.ConstantProperty(
              Cesium.Color.WHITE
            );
          }
          viewer.value?.scene.requestRender();
        }
      },
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
  };
  /**
   * @description 初始化点击事件，点击聚焦实体并展示信息
   */
  const initClickEvent = () => {
    let selectDataSource = null as null | Cesium.DataSource; // 选中数据源
    viewer.value?.screenSpaceEventHandler.setInputAction(
      (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const pick = viewer.value?.scene.pick(click.position);
        if (pick && pick.id) {
          const entity = pick.id as Cesium.Entity;
          const entityCollection = entity.entityCollection;
          const currentDataSource =
            entityCollection.owner as Cesium.CustomDataSource;
          // 同一数据源点击不重复处理
          if (selectDataSource === currentDataSource) {
            return;
          }
          tooltips.value.show = false;
          // 飞向选中实体
          viewer.value
            ?.flyTo(entityCollection, {
              duration: 0.5,
            })
            .then(() => {
              // 动画结束后展示信息
              currentDataSource?.entities.values.forEach((entity) => {
                if (entity.name === "box") {
                  activeEntity.value = entity;
                  updatePosition(entity);
                  tooltips.value.info = entity.properties?.getValue();
                  tooltips.value.show = true;
                }
              });
            });

          selectDataSource = currentDataSource;

          // 处理选中和未选中的透明度
          dataSourceList?.forEach((dataSource) => {
            dataSource?.entities.values.forEach((entity) => {
              if (entity.name === "box") {
                if (dataSource === currentDataSource) {
                  // 高亮选中
                  const material = entity.box!
                    .material as Cesium.ColorMaterialProperty;
                  const color = material.color as Cesium.ConstantProperty;
                  color.setValue(Cesium.Color.fromAlpha(color.getValue(), 0.8));
                } else {
                  // 其他置灰
                  const material = entity.box!
                    .material as Cesium.ColorMaterialProperty;
                  const color = material.color as Cesium.ConstantProperty;
                  color.setValue(Cesium.Color.fromAlpha(color.getValue(), 0.1));
                }
              }
            });
          });
        } else {
          // 点击空白区域恢复所有实体透明度
          if (selectDataSource) {
            activeEntity.value = null;
            tooltips.value.show = false;
            dataSourceList?.forEach((dataSource) => {
              dataSource?.entities.values.forEach((entity) => {
                if (entity.name === "box") {
                  const material = entity.box!
                    .material as Cesium.ColorMaterialProperty;
                  const color = material.color as Cesium.ConstantProperty;
                  color.setValue(Cesium.Color.fromAlpha(color.getValue(), 0.8));
                }
              });
            });
            selectDataSource = null;
          }
        }
        // 统一在最后请求渲染，避免多次触发
        viewer.value?.scene.requestRender();
        // 解决点击空白区域后，会有几率box为空的问题
        setTimeout(() => {
          viewer.value?.scene.requestRender();
        }, 100);
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
  };

  const initRenderListener = () => {
    // 监听场景渲染事件，实时更新坐标
    viewer.value?.scene.postRender.addEventListener(addRenderEventListener);
  };

  onMounted(() => {
    init();
    initHoverEvent();
    initClickEvent();
    initRenderListener();
  });
  onUnmounted(() => {
    viewer.value?.scene.postRender.removeEventListener(addRenderEventListener);
    viewer.value!.destroy();
  });
  /**
   * @description 初始化bar
   */
  const initBar = (item: any) => {
    const dataSource = new Cesium.CustomDataSource("bar");
    const boxPosition = Cesium.Cartesian3.fromDegrees(
      item.position[0],
      item.position[1],
      0
    );
    let material = Cesium.Color.BLUE.withAlpha(0.8);
    if (item.value >= 200) {
      material = Cesium.Color.RED.withAlpha(0.8);
    } else if (item.value >= 100) {
      material = Cesium.Color.YELLOW.withAlpha(0.8);
    } else if (item.value >= 60) {
      material = Cesium.Color.GREEN.withAlpha(0.8);
    } else {
      material = Cesium.Color.BLUE.withAlpha(0.8);
    }
    const box = new Cesium.Entity({
      id: "box" + item.name,
      name: "box",
      position: boxPosition,
      box: {
        dimensions: new Cesium.Cartesian3(10000, 10000, item.value * 1000),
        material: material,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
      },
      properties: item,
    });

    const labelPosition = Cesium.Cartesian3.fromDegrees(
      item.position[0],
      item.position[1],
      item.value * 1000 + 5000
    );
    const label = new Cesium.Entity({
      id: "label" + item.name,
      name: "label",
      position: labelPosition,
      label: {
        text: item.name,
        font: "20px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        outlineColor: Cesium.Color.BLACK,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        // heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
      },
      properties: item,
    });

    const valuePosition = Cesium.Cartesian3.fromDegrees(
      item.position[0],
      item.position[1],
      item.value * 1000 + 5000
    );
    const value = new Cesium.Entity({
      id: "value" + item.name,
      name: "value",
      position: valuePosition,
      label: {
        text: String(item.value),
        font: "16px sans-serif",
        fillColor: Cesium.Color.SKYBLUE,
        outlineWidth: 2,
        outlineColor: Cesium.Color.WHITE,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -20),
        // heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
      },
      properties: item,
    });

    dataSource.entities.add(box);
    dataSource.entities.add(label);
    dataSource.entities.add(value);

    return dataSource;
  };
  /**
   * @description 更新tooltips位置
   * @param {Cesium.Entity} entity
   */
  function updatePosition(entity: Cesium.Entity) {
    // 获取box的笛卡尔坐标
    const position = entity.position?.getValue();
    // 将笛卡尔坐标转换为经纬度坐标
    let p1 = getDegreesFromCartesian3(position!);
    p1[0] = p1[0] + 0.1; // 右偏移0.1度
    // 经纬度坐标转换为笛卡尔坐标，加了高度
    let p2 = getCartesian3FromDegrees(
      p1!,
      entity.properties?.value.getValue() * 1000 * 0.9
    ); // 高度在0.9倍位置
    // 将笛卡尔坐标转换为屏幕坐标
    const p = getScreenPositionFromCartesian3(p2!, viewer.value!);
    tooltips.value.x = p!.x;
    tooltips.value.y = p!.y;
  }
  /**
   * @description 添加屏幕事件监听
   */
  function addRenderEventListener() {
    if (activeEntity.value && tooltips.value.show) {
      updatePosition(activeEntity.value);
    }
  }

  return {
    viewer,
    tooltips,
  };
};

/**
 * @description 添加四川区域
 * @param {Cesium.Viewer} viewer
 */
function addSCRegion(viewer: Cesium.Viewer) {
  viewer.scene.skyAtmosphere!.show = false; // 大气
  const coors = SC.features[0].geometry.coordinates[0];
  const geojson = turf.polygon(coors);
  const simplified = turf.simplify(geojson, {
    tolerance: 0.05, // 简化容差，值越小，越精确
    highQuality: true, // 是否花费更多时间使用其他算法创建更高质量的简化
  });
  // 根据简化后的几何体创建裁剪区域
  const areas = new Cesium.ClippingPolygon({
    positions: Cesium.Cartesian3.fromDegreesArray(
      simplified.geometry.coordinates[0].flat()
    ),
  });
  // 设置裁剪区域
  viewer.scene.globe.clippingPolygons = new Cesium.ClippingPolygonCollection({
    polygons: [areas],
    inverse: true,
  });

  // 设置30度向下视角 (pitch = -30度)
  const pitch = (-40 * Math.PI) / 180; // 转换为弧度
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(103.06, 22.45, 600000),
    orientation: {
      heading: 0,
      pitch: pitch,
      roll: 0,
    },
  });
}

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
 * @description 根据笛卡尔坐标获取屏幕位置
 * @param {Cesium.Cartesian3} position
 * @param {Cesium.Viewer} viewer
 * @return {*}
 */
export const getScreenPositionFromCartesian3 = (
  position: Cesium.Cartesian3,
  viewer: Cesium.Viewer
) => {
  const screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
    viewer.scene,
    position
  );
  return screenPosition;
};
