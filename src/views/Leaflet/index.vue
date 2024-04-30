<template>
  <div id="map" class="h-full w-full"></div>
  <el-radio-group v-model="value" class="option" @change="changeMap">
    <el-radio-button
      v-for="item in options"
      :key="item.label"
      :value="item.value"
      :label="item.label"
    />
  </el-radio-group>
</template>

<script lang="ts">
export default { name: "" };
</script>
<script lang="ts" setup>
import * as Leaflet from "leaflet";
import { onMounted, ref } from "vue";
import "leaflet.chinatmsproviders";
import * as coordtransform from "coordtransform";

let map: Leaflet.Map | null = null;
const value = ref("高德地图");
const options = [
  { label: "高德地图", value: "高德地图" },
  { label: "高德影像", value: "高德影像" },
  { label: "OSM", value: "OSM" },
  { label: "天地图", value: "天地图" },
  { label: "天地图影像", value: "天地图影像" },
];

const changeMap = (m: string | number | boolean) => {
  map?.remove();
  switch (m) {
    case "高德地图":
      initMap([gdNormal]);
      break;
    case "高德影像":
      initMap([gdImage]);
      break;
    case "OSM":
      initMap([osmNormalMap]);
      break;
    case "天地图":
      initMap([tdtNormal]);
      break;
    case "天地图影像":
      initMap([tdtNormalImg]);
      break;
  }
};

const coordTransform = (coord: [number, number]) => {
  if (value.value.includes("高德")) {
    return coord.reverse();
  } else if (value.value.includes("OSM")) {
    return coordtransform.gcj02towgs84(...coord).reverse();
  }
  return coordtransform.gcj02towgs84(...coord).reverse();
};
// console.log(coordTransform([104.045034, 30.540885]));

// 图层
// 高德
var gaodeNormal = Leaflet.tileLayer.chinaProvider("GaoDe.Normal.Map", {
  maxZoom: 18,
  minZoom: 5,
});
var gaodeImgm = Leaflet.tileLayer.chinaProvider("GaoDe.Satellite.Map", {
  maxZoom: 18,
  minZoom: 5,
});
var gaodeImga = Leaflet.tileLayer.chinaProvider("GaoDe.Satellite.Annotion", {
  maxZoom: 18,
  minZoom: 5,
});
// osm
var osmNormal = Leaflet.tileLayer.chinaProvider("OSM.Normal.Map", {
  maxZoom: 18,
  minZoom: 5,
});
// 天地图
var tdtNormal = Leaflet.tileLayer.chinaProvider("TianDiTu.Normal.Map", {
  maxZoom: 18,
  minZoom: 5,
});
var tdtNormala = Leaflet.tileLayer.chinaProvider("TianDiTu.Normal.Annotion", {
  maxZoom: 18,
  minZoom: 5,
});
var tdtImgm = Leaflet.tileLayer.chinaProvider("TianDiTu.Satellite.Map", {
  maxZoom: 18,
  minZoom: 5,
});
var tdtImga = Leaflet.tileLayer.chinaProvider("TianDiTu.Satellite.Annotion", {
  maxZoom: 18,
  minZoom: 5,
});

var gdNormal = Leaflet.layerGroup([gaodeNormal]);
var gdImage = Leaflet.layerGroup([gaodeImgm, gaodeImga]);
var osmNormalMap = Leaflet.layerGroup([osmNormal]);
var tdtNormal = Leaflet.layerGroup([tdtNormal, tdtNormala]);
var tdtNormalImg = Leaflet.layerGroup([tdtImgm, tdtImga]);

const initMap = (layers?: Leaflet.Layer[]) => {
  // 地图范围限制
  var corner1 = Leaflet.latLng(-90, -180); //设置左上角经纬度
  var corner2 = Leaflet.latLng(90, 180); //设置右下点经纬度
  var bounds = Leaflet.latLngBounds(corner1, corner2); //构建视图限制范
  const render = Leaflet.canvas();
  map = new Leaflet.Map("map", {
    maxZoom: 18,
    minZoom: 5,
    center: coordTransform([104.04504, 30.540729]),
    zoom: 14,
    attributionControl: false, //去掉右下角logo
    layers: layers,
    maxBounds: bounds,
    renderer: render,
    crs: Leaflet.CRS.EPSG3857,
  });
  // Leaflet.control
  //   .layers(baseLayers, undefined, {
  //     collapsed: false,
  //   })
  //   .addTo(map);

  // 标记
  let markerIcon = Leaflet.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    iconSize: [20, 30],
  });
  let marker = Leaflet.marker(coordTransform([104.04504, 30.540729]), {
    icon: markerIcon,
  })
    .addTo(map)
    .bindPopup("<p>Hello world!<br />This is a nice popup.</p>")
    .openPopup();
  // 线段
  let line = Leaflet.polyline(
    [coordTransform([104.04504, 30.540729]), [27.595, 106.9]],
    {
      opacity: 1,
      color: "red",
      renderer: render,
    }
  ).addTo(map);
  // 圆形
  Leaflet.circle(coordTransform([104.04504, 30.540729]), {
    color: "black", //轨迹颜色
    fillColor: "pink", //默认和轨迹色一样
    fillOpacity: 0.3, //圆的填充色
    radius: 1 * 1000 * 3, //半径，单位为米
    dashArray: [4, 4],
    renderer: render,
  }).addTo(map);
  // 矩形
  let rectangle = Leaflet.rectangle(
    [coordTransform([104.04504, 30.540729]), [27.595, 106.9]],
    { color: "pink", renderer: render }
  ).addTo(map);
  // 多边形
  var polygon = Leaflet.polygon(
    [
      [41, -111.03],
      [45, -111.04],
      [45, -104.05],
      [41, -104.05],
    ],
    { color: "red" }
  ).addTo(map);
};

onMounted(() => {
  initMap([gdNormal]);
});
</script>

<style lang="scss" scoped>
.option {
  position: absolute;
  right: 10px;
  top: 10px;
  z-index: 999;
}
</style>
