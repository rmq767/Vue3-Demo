import { onBeforeUnmount, onMounted, Ref, ref, shallowRef, watch } from "vue";
import * as Leaflet from "leaflet";
import "leaflet.chinatmsproviders";
import { CesiumData } from "@/types/gis";
import { ElMessage } from "element-plus";

interface CustomCircleMarkerOptions extends Leaflet.CircleMarkerOptions {
  data: any;
}

export const useLeaflet = (id: string, checkedWell: Ref<string[]>) => {
  const map = shallowRef<Leaflet.Map | null>(null);
  // const checkedWell = ref<string[]>([]);
  // 高德图层
  const gaodeNormal = (Leaflet.tileLayer as any).chinaProvider(
    "GaoDe.Normal.Map",
    {
      maxZoom: 18,
      minZoom: 4,
    }
  );
  const gdNormal = Leaflet.layerGroup([gaodeNormal]);
  let markers = [] as Leaflet.CircleMarker<any>[];
  let labelMarkers = [] as Leaflet.Marker<any>[];

  /**
   * @description 初始化地图
   */
  const initMap = () => {
    // 地图范围限制
    const corner1 = Leaflet.latLng(-90, -180); //设置左上角经纬度
    const corner2 = Leaflet.latLng(90, 180); //设置右下点经纬度
    const bounds = Leaflet.latLngBounds(corner1, corner2); //构建视图限制范
    const render = Leaflet.canvas();
    map.value = new Leaflet.Map(id, {
      maxZoom: 18,
      minZoom: 4,
      // center: coordTransform([104.04504, 30.540729]),
      zoom: 14,
      attributionControl: false, //去掉右下角logo
      layers: [gdNormal],
      maxBounds: bounds,
      renderer: render,
      crs: Leaflet.CRS.EPSG3857,
      zoomControl: false,
      doubleClickZoom: false,
    });
  };

  /**
   * @description 绘制点
   */
  const drawPoint = (data?: CesiumData[]) => {
    if (data?.length) {
      const points = [] as any[];
      data.forEach((item) => {
        // 获取所有点坐标
        points.push({
          lng: item.pointData[0].lon,
          lat: item.pointData[0].lat,
        });
        const customLabel = Leaflet.divIcon({
          html: `<div class='tooltip-content'>${item.name}</div>`,
          className: checkedWell.value?.includes(item.businessId!)
            ? "tooltip"
            : "",
        });
        const labelMarker = Leaflet.marker(
          [item.pointData[0].lat, item.pointData[0].lon],
          {
            icon: customLabel,
            data: {
              name: item.name,
              id: item.businessId,
              checked: checkedWell.value?.includes(item.businessId!),
            },
          } as any
        ).addTo(map.value!);
        labelMarkers.push(labelMarker);
        labelMarker.on("click", choosePoint);
        // 添加点
        const marker = Leaflet.circleMarker(
          {
            lat: item.pointData[0].lat,
            lng: item.pointData[0].lon,
          },
          {
            stroke: true,
            color: "#fff",
            fillColor: "red",
            fill: true,
            fillOpacity: 1,
            radius: 8,
            data: {
              name: item.name,
              id: item.businessId,
              checked: checkedWell.value?.includes(item.businessId!),
            },
            icon: customLabel,
          } as CustomCircleMarkerOptions
        ).addTo(map.value!);
        debugger;
        markers.push(marker);
        marker.on("click", choosePoint);
      });
      // 创建边界对象并扩展以包含所有点
      const bounds = Leaflet.latLngBounds(points);
      // 调整地图视图以包含所有点
      map.value?.fitBounds(bounds, {
        padding: [10, 10],
      });
    }
  };

  /**
   * @description 选中井
   */
  const choosePoint = (item: any) => {
    const data = item.target.options.data;
    const { id } = data;
    // 根据id查找对应的labelMarker和pointMarker
    const targetLabel = labelMarkers.find(
      (item) => (item.options as any).data.id === id
    )!;
    const targetPoint = markers.find(
      (item) => (item.options as any).data.id === id
    )!;
    const checkedStatus = !data.checked;
    if (checkedStatus && checkedWell.value.length + 1 > 3) {
      ElMessage.warning("最多只能选择3口井");
      return;
    }
    if (!checkedStatus && checkedWell.value.length - 1 === 0) {
      ElMessage.warning("最少选择1口井");
      return;
    }
    // 更新labelMarker和pointMarker的checked属性
    (targetLabel.options as any).data.checked = checkedStatus;
    (targetPoint.options as any).data.checked = checkedStatus;
    if (checkedStatus) {
      bindTooltip(targetLabel, data, true);
    } else {
      bindTooltip(targetLabel, data, false);
    }
  };

  const bindTooltip = (
    target: Leaflet.Marker<any>,
    data: any,
    bind = false
  ) => {
    const { id } = data;
    const icon = target.options.icon!;
    if (bind) {
      icon.options.className = "tooltip";
      checkedWell.value.push(id);
    } else {
      icon.options.className = "";
      const index = checkedWell.value.indexOf(id);
      if (index > -1) {
        checkedWell.value.splice(index, 1);
      }
    }
    target.setIcon(icon!);
  };

  /**
   * @description 销毁地图移除事件
   */
  const destroyMap = () => {
    if (map.value) {
      markers.forEach((item) => {
        item.off("click", choosePoint);
      });
      labelMarkers.forEach((item) => {
        item.off("click", choosePoint);
      });
      markers = [];
      labelMarkers = [];
      map.value.remove();
    }
  };

  onBeforeUnmount(() => {
    destroyMap();
  });

  return {
    map,
    checked: checkedWell,
    drawPoint,
    initMap,
    destroyMap,
  };
};
