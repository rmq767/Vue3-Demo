import{d as l,l as u,c,o as d}from"./@vue-1pEateLc.js";const m={id:"cesiumContainer"},g={name:"Cesium"},f=l({...g,setup(h){let e;const o=async()=>{e=new Cesium.Viewer("cesiumContainer",{geocoder:!1,sceneModePicker:!1,baseLayerPicker:!1,navigationHelpButton:!1,homeButton:!1,animation:!1,fullscreenButton:!1,timeline:!1,requestRenderMode:!0,sceneMode:Cesium.SceneMode.SCENE3D,terrainProvider:await Cesium.createWorldTerrainAsync({requestVertexNormals:!0,requestWaterMask:!0})}),e.cesiumWidget.creditContainer.style.display="none",e.camera.setView({destination:new Cesium.Cartesian3(1332761,-4662399,4137888),orientation:{heading:Cesium.Math.toRadians(30),pitch:Cesium.Math.toRadians(-40),roll:Cesium.Math.toRadians(0)}});const t=await Cesium.Cesium3DTileset.fromIonAssetId(75343);e.scene.primitives.add(t);const s=new Cesium.Cesium3DTileStyle({color:{conditions:[["${Height}>=300","rgba(45,0,75,0.5)"],["${Height}>=200","rgb(102,71,151)"],["${Height}>=100","rgba(170,162,204,0.5)"],["${Height}>=50","rgb(224,226,238)"],["${Height}>=25","rgb(252,230,200)"],["${Height}>=10","rgba(248,176,87,0.5)"],["${Height}>=5","rgb(198,106,11)"],["true","rgb(127,59,8)"]]}});t.style=s;const a=await Cesium.GeoJsonDataSource.load("../../assets/geo/area.geojson");e.dataSources.add(a);let n=a.entities;for(let i=0;i<n.values.length;i++){const r=n.values[i];Cesium.defined(r.polygon)}};return u(()=>{o()}),(t,s)=>(d(),c("div",m))}});export{f as default};