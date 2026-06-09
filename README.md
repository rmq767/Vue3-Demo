
# Vue3-Demo

> 基于 **Vue 3 + TypeScript + Vite** 的技术演示合集，涵盖三维地图、三维渲染、二维地图、动画、流程图、甘特图、规则引擎等多种前端技术。
>
> 路由根据 `views/` 目录结构**自动生成**，例如 `views/Cesium/bar/index.vue` 对应路由 `/Cesium/bar/index`

## 技术栈

| 类别 | 技术/库 | 版本 |
|:--|:--|:--|
| 框架 | Vue 3 + TypeScript | ^3.3.11 |
| 构建 | Vite 5 + UnoCSS | ^5.0.10 |
| UI | Element Plus | ^2.7.2 |
| 三维地图 | Cesium | ^1.132.0 |
| 三维绘图 | Three.js | ^0.161.0 |
| 二维地图 | Leaflet | ^1.9.4 |
| Canvas 2D | Leafer UI | ^1.0.10 |
| 动画 | GSAP + ScrollTrigger | ^3.12.5 |
| 流程图 | LogicFlow + 扩展 | ^2.0.6 |
| 甘特图 | dhtmlx-gantt | ^8.0.6 |
| 代码编辑器 | CodeMirror 6 | ^6.0.1 |
| 拖拽布局 | grid-layout-plus | ^1.0.5 |
| 图表 | ECharts | ^5.5.1 |
| 图可视化 | @antv/g6 | ^4.8.24 |
| 地理分析 | @turf/turf | ^7.1.0 |
| 坐标转换 | coordtransform | ^2.1.2 |
| 虚拟滚动 | vue-virtual-scroller | ^3.0.4 |
| Markdown | markdown-it + highlight.js | — |
| 流式请求 | @microsoft/fetch-event-source | — |
| 录音 | RecordRTC | ^5.6.2 |
| JSON Schema | AJV | ^8.17.1 |
| HTTP | Axios | ^1.7.9 |
| 日期 | dayjs | ^1.11.10 |
| 截图 | html2canvas | ^1.4.1 |
| 工具 | lodash / uuid / dompurify | — |

---

## 功能模块

### 🌍 Cesium 三维地图

| 路由 | 说明 |
|:--|:--|
| `/Cesium/index` | 基础 Cesium 场景 |
| `/Cesium/control` | 相机控制 |
| `/Cesium/getData` | 画点线面（在线标记） |
| `/Cesium/drawData` | 画点线面（在线渲染） |
| `/Cesium/bar/index` | 部分区域展示柱状图效果 |
| `/Cesium/czml/index` | CZML 轨迹跟踪 |
| `/Cesium/fly/index` | 飞行漫游 |
| `/Cesium/gpx/index` | GPX 轨迹展示 |

* [Vue3中使用cesium](https://blog.csdn.net/qq_44775782/article/details/138565105)
* [Cesium柱状图效果](https://blog.csdn.net/qq_44775782/article/details/151116045)
* [在线浏览](https://rmq767.github.io/Vue3-Demo/#/cesium/getData)

---

### 🎲 Three.js 三维渲染

| 路由 | 说明 |
|:--|:--|
| `/Three/demo` | Three.js 基础入门（场景、相机、几何体、GUI 控制） |
| `/Three/event` | 事件交互（Raycaster 射线点击、TWEEN 补间动画） |
| `/Three/texture` | 纹理贴图与材质（GLTF 加载、EXR 环境贴图、线框） |
| `/Three/spotlight` | 聚光灯与阴影效果 |
| `/Three/stratum` | 三维地层模型 + 深度坐标轴 + 井轨迹管道 |
| `/Three/well` | **复杂钻井场景**（多层地层、井轨迹生长动画、相机跟随、信息浮窗、地形起伏、裁剪、钻井装置） |

---

### 🗺️ Leaflet + Leafer 井轨迹展示

| 路由 | 说明 |
|:--|:--|
| `/Leafer/leafer1/index` | 直井 + 地层连接（切面图） |
| `/Leafer/leafer2/index` | 画单井轨迹 |
| `/Leafer/leafer3/index` | 选择井进行井轨迹展示 |
| `/Leaflet/index` | Leaflet 二维地图基础 |

* [Leaflet+Leafer实现地层、井轨迹的切面图展示](https://blog.csdn.net/qq_44775782/article/details/144561037)

---

### 📊 项目管理

| 路由 | 说明 |
|:--|:--|
| `/Gantt/index` | dhtmlx-gantt 甘特图（多层嵌套、进度条、实际工期、截图导出） |
| `/Logicflow/index` | LogicFlow 流程图（节点配置：动作设置、边界设置、审批设置、开始流程） |

* [Vue3实现LogicFlow流程图](https://blog.csdn.net/qq_44775782/article/details/143598096)

---

### 🎬 动画

| 路由 | 说明 |
|:--|:--|
| `/GSAP/index` | GSAP 基础动画（fromTo、时间线 Timeline、Stagger 网格动画） |
| `/GSAP/scroll` | ScrollTrigger 滚动驱动动画 |

---

### 📝 编辑器

| 路由 | 说明 |
|:--|:--|
| `/FnEditor/index` | contenteditable 实现插入标签的输入框 |
| `/RulesEditor/index` | **CodeMirror 6 公式编辑器** |
| `/JsonSchema/index` | JSON Schema 验证（CodeMirror 编辑器 + AJV） |

* [contenteditable实现插入标签的输入框功能](https://blog.csdn.net/qq_44775782/article/details/139302247)
* [Vue3+codemirror6实现公式编辑器](https://blog.csdn.net/qq_44775782/article/details/145489119)

---

### 🔗 规则引擎

| 路由 | 说明 |
|:--|:--|
| `/RuleLinkage/index` | **规则联动**：配置条件-动作规则，实时联动数据表（支持输入、数字、选择、日期等类型） |

---

### 🧩 布局 & UI

| 路由 | 说明 |
|:--|:--|
| `/DragLayout/index` | 拖拽网格布局（grid-layout-plus） |

---

### 💬 AI 对话

| 路由 | 说明 |
|:--|:--|
| `/SSE/chat` | **SSE 流式 AI 对话**（会话管理、虚拟滚动、流式输出） |

---

### 🎤 语音识别

| 路由 | 说明 |
|:--|:--|
| `/Voice/index` | **语音录制与识别**（录音、试听、下载 WAV、语音识别接口） |

---

## 开发 & 构建

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```
