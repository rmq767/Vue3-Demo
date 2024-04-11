import { createApp } from "vue";
import "./style.scss";
import App from "./App.vue";
import ElementPlus from "element-plus";
import router from "@/router";
import "virtual:uno.css";

const app = createApp(App);
app.use(ElementPlus, { size: "small", zIndex: 3000 }).use(router);

app.mount("#app");
