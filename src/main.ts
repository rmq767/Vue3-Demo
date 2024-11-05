import { createApp } from "vue";
import "./style.scss";
import App from "./App.vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import router from "@/router";
import "virtual:uno.css";
import "leaflet/dist/leaflet.css";
// 弹窗
import MyDialog from "@/components/Dialog/index.vue";

const app = createApp(App);

app.component("MyDialog", MyDialog);

app.use(ElementPlus, { size: "default", zIndex: 3000 }).use(router);

app.mount("#app");
