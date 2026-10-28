
# Vue3-Demo

> 基于 **Vue 3 + TypeScript + Vite** 的技术演示合集，涵盖三维地图、三维渲染、二维地图、动画、流程图等多种前端技术。
>
> 路由根据 `views/` 目录结构**自动生成**，例如 `views/Cesium/Gis/index.vue` 对应路由 `/Cesium/Gis/index`

## 技术栈

| 类别 | 技术/库 | 版本 |
|:--|:--|:--|
| 框架 | Vue 3 + TypeScript | ^3.3.11 |
| 构建 | Vite 5 + UnoCSS | ^5.0.10 |
| UI | Element Plus | ^2.7.2 |
| 三维地图 | Cesium | ^1.132.0 |
| 三维绘图 | Three.js | ^0.161.0 |
| 二维地图 | Leaflet | ^1.9.4 |
| Canvas 2D | Leafer UI | ^2.3.2 |
| 动画 | GSAP + ScrollTrigger | ^3.12.5 |
| 流程图 | LogicFlow + 扩展 | ^2.0.6 |
| 代码编辑器 | CodeMirror 6 | ^6.0.1 |
| 拖拽布局 | gridstack.js | 14.0.0 |
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

### 智慧气田三维 GIS

| 路由 | 说明 |
|:--|:--|
| `/Cesium/Gis/index` | 深色科技风气田 GIS：区块 / 井 / 平台 / 管道图层，搜索定位、点击详情、井轨迹地下透视、距离测量、二三维切换、双底图与实时告警模拟 |

- 页面位于 `src/views/Cesium/Gis/index.vue`，数据与子组件位于 `src/components/GisMap`，作为 Cesium 综合演示页。
- 底图为高德矢量（暗化）与卫星影像，可随时切换；井轨迹、实时模拟均为演示能力，后续可在数据层替换为真实接口。

### 极光油田数字孪生大屏

| 路由 | 说明 |
|:--|:--|
| `/GisPro` | 极光油田（虚构演示）数字孪生大屏：Cesium 地形底座 + Three 地面油田，区块 / 井 / 站 / 管线图层，单击聚焦、双击进入单井井轨迹，支持搜索、详情、5 章巡演（含井轨迹）与告警演练 |

- 页面位于 `src/views/GisPro.vue`，引擎、场景、面板与设计 token 在 `src/components/GisPro`；主场景为地面 GIS，井轨迹以独立地层柱展示。
- 数据为固定种子 mock（`src/components/GisPro/data/field.ts`）：5 区块 / 42 口井 / 8 座站库 / 12 条管线。
- 在线影像不可用时自动使用本地烘焙地形底图，状态栏标注 `LOCAL`；`?debug=1` 显示 FPS、draw calls 与标签数。

---

### 🌍 Cesium 三维地图

| 路由 | 说明 |
|:--|:--|
| `/Cesium/getData` | 画点线面（在线标记） |
| `/Cesium/drawData` | 画点线面（在线渲染） |
| `/Cesium/Gis/index` | 气田三维 GIS 综合演示（图层、搜索、测量、井轨迹、二三维切换） |

* [Vue3中使用cesium](https://blog.csdn.net/qq_44775782/article/details/138565105)
* [在线浏览](https://rmq767.github.io/Vue3-Demo/#/cesium/getData)

---

### 🎲 Three.js 三维渲染

| 路由 | 说明 |
|:--|:--|
| `/Three/geology` | **程序化地质体**：fBm 噪声地形 + 9 套岩心层组 + 井眼轨迹 + 可拖剖切面，配实时渲染指标 HUD |

- 页面位于 `src/views/Three/geology.vue`，引擎与内容拆在 `geology/core/`：`stage`（渲染循环、resize、DPR 封顶、后处理、统一回收）、`terrain`（高程场）、`geology`（层组 / 井眼 / 站库）、`picking`、`tokens`、`random`。
- 全部内容由代码生成，**不加载任何外部模型或贴图**；旧 demo 依赖的 185MB glTF / EXR 资源已随页面一并删除。地形高程是解析函数，台站落位、井口高程与拾取读数取到的永远是同一个值。
- 剖切用材质级 `clippingPlanes` 而非全局裁剪，井眼因此可以豁免——岩体被切开后仍能看到完整轨迹。射线不识别裁剪面，被切掉的部分照样能命中，所以拾取时按裁剪面过滤掉这类假命中。
- 默认按需出图：只有交互、动画和控件变更置脏后才 `render`，HUD 里「刷新」与「出图」两条计数会分叉，静止时出图归零。指标直读 `renderer.info`，并关掉 `autoReset`，否则后处理一帧内多次 render 只会统计到最后一个 pass。
- 交互：左键拖动旋转、滚轮缩放、单击选中（含 `InstancedMesh` 的 `instanceId`）、`F` 聚焦选中点、`Esc` 取消选中。
- 缩放是**自实现的阻尼 dolly**（`stage.ts` 里 `enableZoom = false` + `stepZoom`）：OrbitControls 的 `enableDamping` 只作用于旋转和平移，`handleMouseWheel` 会立刻 `update()` 把 `scale` 消费掉，原生滚轮是一格一跳。现在按帧收敛半径、并以光标射线上的点为锚位同步 `target`，距离钳制在 190–720 m（块体对角半径约 165 m，钻不进岩体也拉不到看不见）。
- 按需出图的置脏信号**必须听 `controls` 的 `change` 事件**，不能靠 `controls.update()` 的返回值：滚轮时 OrbitControls 内部已经 update 过一次，rAF 里再调就返回 `false`，那一帧不会重绘。
- 场景不加雾：块体对角半径约 165 m，任何按距离衰减的雾都会在拉远时把整块岩体洗成背景色，看起来像「缩放后模型消失」。

---

### 🗺️ Leaflet 二维 GIS

| 路由 | 说明 |
|:--|:--|
| `/Leaflet/index` | **极光油田二维 GIS**：4 套底图（GCJ02/WGS84 自动对齐）、区块 / 井 / 站库 / 管线图层、标签分级防碰撞、搜索、详情、双击井进入 2D 井轨迹剖面 |

- 页面位于 `src/views/Leaflet`，坐标、底图、图层与 HUD 逻辑拆在 `geo.ts`、`baseMaps.ts`、`fieldLayers.ts`、`useLeafletField.ts` 和 `components/`。
- 数据复用 `src/components/GisPro/data/field.ts` 的固定种子 mock，区块 / 井 / 站库 / 管线数量均从 field 推导，不写死文案。
- 底图包含高德矢量（暗化）、高德影像 + 注记、OSM、Esri World Imagery；高德为 GCJ02，OSM/Esri 为 WGS84，切换时覆盖物自动重投影并保持视野中心。天地图需自备 tk，未纳入首版。
- 交互：`/` 聚焦搜索、图层开关、标签按缩放分级、悬停提示、单击详情、双击井进入 2D 井轨迹 / 地层剖面、`Esc` 逐级退出。在线瓦片不可达时自动落本地网格底图，状态栏标注 `本地网格`。

---

### ✏️ Leafer Canvas 2D 井场组态

| 路由 | 说明 |
|:--|:--|
| `/Leafer/index` | **井场集输管网组态图**：设备/管线点选、拖拽重排与正交管线自动重连、鼠标中心缩放、参数编辑、流动动画与整图 PNG 导出 |

- 页面位于 `src/views/Leafer/index.vue`，绘制逻辑在 `theme / routing / scene / camera / interaction / export-png` 模块，仅使用 `leafer-ui`，不依赖 Leaflet/Cesium。
- 设备与管线为固定种子 mock（10 个设备 / 9 条管线），用于交互演示，非施工图。
- 键盘：`F` 适应画布、`+ / -` 缩放、`Esc` 取消选择；按住空格或拖拽空白处平移。

---

### 📊 项目管理

| 路由 | 说明 |
|:--|:--|
| `/Logicflow/index` | LogicFlow 流程图（节点配置：动作设置、边界设置、审批设置、开始流程） |

* [Vue3实现LogicFlow流程图](https://blog.csdn.net/qq_44775782/article/details/143598096)

---

### 🎬 动画

| 路由 | 说明 |
|:--|:--|
| `/GSAP/scroll-cinematic` | 电影感滚动叙事：星尘画布、固定光球、引力轨道、横向章节与圆形黎明揭示 |

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

### 🧩 布局 & UI

| 路由 | 说明 |
|:--|:--|
| `/DragLayout/index` | 拖拽网格布局（gridstack.js，支持持久化/属性面板） |

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
