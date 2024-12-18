import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import * as Leaflet from "leaflet";
import "leaflet.chinatmsproviders";
import { CesiumData } from "@/types/gis";
import { ElMessage } from "element-plus";

interface CustomCircleMarkerOptions extends Leaflet.CircleMarkerOptions {
  data: any;
}

export const useLeaflet = (id: string) => {
  const map = shallowRef<Leaflet.Map | null>(null);
  const checkedWell = ref<string[]>([]);
  // 高德图层
  const gaodeNormal = (Leaflet.tileLayer as any).chinaProvider(
    "GaoDe.Normal.Map",
    {
      maxZoom: 18,
      minZoom: 4,
    }
  );
  const gdNormal = Leaflet.layerGroup([gaodeNormal]);
  const markers = [] as Leaflet.CircleMarker<any>[];

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
  const drawPoint = (data?: CesiumData[], checkedId?: string[]) => {
    if (data?.length) {
      const points = [] as any[];
      data.forEach((item) => {
        // 获取所有点坐标
        points.push({
          lng: item.pointData[0].lon,
          lat: item.pointData[0].lat,
        });
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
            radius: 10,
            data: {
              name: item.name,
              id: item.businessId,
              checked: checkedId?.includes(item.businessId!),
            },
          } as CustomCircleMarkerOptions
        ).addTo(map.value!);
        markers.push(marker);
        bindTooltip(marker, item.name, checkedId?.includes(item.businessId!));
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
    const target = item.target;
    const data = target.options.data;
    const checkedStatus = !data.checked;
    if (checkedStatus && checkedWell.value.length + 1 > 3) {
      ElMessage.warning("最多只能选择3口井");
      return;
    }
    if (!checkedStatus && checkedWell.value.length - 1 === 0) {
      ElMessage.warning("最少选择1口井");
      return;
    }
    target.setStyle({
      data: {
        ...data,
        checked: checkedStatus,
      },
    });
    if (checkedStatus) {
      bindTooltip(target, data.name, true);
    } else {
      bindTooltip(target, data.name, false);
    }
  };

  const bindTooltip = (
    item: Leaflet.CircleMarker<any>,
    name: string,
    bind = false
  ) => {
    const option = {
      permanent: true, // 使Tooltip始终可见
      direction: "top", // 自动调整Tooltip的显示方向
      className: "",
      offset: [0, -5],
      opacity: 0.8,
    } as Leaflet.TooltipOptions;
    if (bind) {
      option.className = "tooltip";
      item.bindTooltip(name, option);
      checkedWell.value.push(
        (item.options as CustomCircleMarkerOptions).data.id
      );
    } else {
      item.bindTooltip(name, option);
      const index = checkedWell.value.indexOf(
        (item.options as CustomCircleMarkerOptions).data.id
      );
      if (index > -1) {
        checkedWell.value.splice(index, 1);
      }
    }
  };

  /**
   * @description 销毁地图移除事件
   */
  const destroyMap = () => {
    if (map.value) {
      markers.forEach((item) => {
        item.off("click", choosePoint);
      });
      map.value.remove();
    }
  };

  onMounted(() => {
    initMap();
  });

  onBeforeUnmount(() => {
    destroyMap();
  });

  return {
    map,
    checked: checkedWell,
    drawPoint,
  };
};
