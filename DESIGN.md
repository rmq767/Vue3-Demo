---
version: alpha
name: Aurora Field
description: 智慧油田数字孪生大屏设计系统。深空底色、极光青主色、油藏橙强调、工业切角 HUD，面向 1920×1080 等比大屏。
colors:
  void: "#02060B"
  deep: "#04101A"
  elevated: "#071925"
  panel: "#06131F"
  hairline: "#12384A"
  primary: "#3DE1FF"
  primary-hover: "#7DEEFF"
  on-primary: "#031018"
  success: "#4AF2C8"
  warning: "#FFC857"
  danger: "#FF5D73"
  info: "#5B8CFF"
  violet: "#9B8CFF"
  oil: "#F5A524"
  gas: "#4AF2C8"
  water: "#5B8CFF"
  ink: "#E6F7FF"
  ink-secondary: "#9EB8C8"
  ink-muted: "#5F7B8C"
typography:
  display-lg:
    fontFamily: "Bahnschrift, 'DIN Alternate', 'Microsoft YaHei', sans-serif"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "0.02em"
  heading-lg:
    fontFamily: "Bahnschrift, 'DIN Alternate', 'Microsoft YaHei', sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.04em"
  heading-md:
    fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.06em"
  kpi-lg:
    fontFamily: "Bahnschrift, 'DIN Alternate', 'Segoe UI', sans-serif"
    fontSize: 30px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.02em"
  body-md:
    fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0.01em"
  body-sm:
    fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0.01em"
  caption:
    fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.04em"
  label:
    fontFamily: "Bahnschrift, 'Segoe UI', sans-serif"
    fontSize: 10px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.12em"
  button-md:
    fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.04em"
rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 8px
  full: 9999px
spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  section: 40px
components:
  hud-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    padding: "{spacing.lg}"
  hud-panel-header:
    backgroundColor: "{colors.elevated}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-md}"
    padding: "{spacing.sm} {spacing.lg}"
  kpi-value:
    textColor: "{colors.ink}"
    typography: "{typography.kpi-lg}"
  kpi-value-warning:
    textColor: "{colors.warning}"
    typography: "{typography.kpi-lg}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.xs}"
    height: 36px
    padding: "0 {spacing.lg}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.xs}"
  button-ghost:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.xs}"
    height: 36px
  tag-normal:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    height: 20px
    padding: "0 {spacing.sm}"
  tag-warning:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.warning}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    height: 20px
  tag-critical:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.danger}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    height: 20px
  alarm-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    padding: "{spacing.md}"
  tour-dock:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    height: 72px
    padding: "{spacing.sm} {spacing.lg}"
  tooltip:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    padding: "{spacing.sm} {spacing.md}"
  layer-chip:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    height: 26px
    padding: "0 {spacing.md}"
  detail-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    padding: "{spacing.lg}"
  status-bar:
    backgroundColor: "{colors.void}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption}"
    height: 24px
---

# Aurora Field — 极光油田智慧大屏设计系统

## Overview

Aurora Field 是 `/GisPro` 页面独有的设计系统，服务于“地面油田数字孪生 + 工业指挥中心”的大屏叙事。页面的视觉主角是 3D 场景，HUD 只占边缘，用深空底色、极光青、油藏橙和切角面板建立秩序感。

**来源与置信度**：项目此前没有 `DESIGN.md`、Figma Variables、Tailwind theme 或 Storybook。`src/style.scss` 只有基础 reset；`src/components/GisMap/styles/gis.scss` 是旧大屏的局部青/薄荷 token，已按用户要求**不复用**。本文件是为 `/GisPro` 新建的页面级契约，token 属于 design decision，不是从证据中反推的既有规范。

**适用范围**：仅 `/GisPro`。不修改 Element Plus 全局主题、旧 `/Gis` 页面或管理端组件。

## Colors

| Token | Value | Role |
|---|---|---|
| `{colors.void}` | #02060B | 页面最深底色、状态栏 |
| `{colors.deep}` | #04101A | 面板底、按钮底 |
| `{colors.elevated}` | #071925 | 面板标题、浮层 |
| `{colors.panel}` | #06131F | HUD 面板基色；实现中用 78% 不透明度 + 12px 模糊 |
| `{colors.hairline}` | #12384A | 结构线、坐标网格 |
| `{colors.primary}` | #3DE1FF | 主交互、气体、选中、科技能量 |
| `{colors.primary-hover}` | #7DEEFF | 主按钮 hover |
| `{colors.on-primary}` | #031018 | 青色实底上的文字 |
| `{colors.success}` | #4AF2C8 | 正常、在线、天然气 |
| `{colors.warning}` | #FFC857 | 预警、阈值前态 |
| `{colors.danger}` | #FF5D73 | 危急、停输、告警 |
| `{colors.info}` | #5B8CFF | 采出水、辅助数据 |
| `{colors.violet}` | #9B8CFF | 深层油藏、非常规 |
| `{colors.oil}` | #F5A524 | 原油、产量、热 |
| `{colors.ink}` | #E6F7FF | 主文字 |
| `{colors.ink-secondary}` | #9EB8C8 | 次级文字、标签 |
| `{colors.ink-muted}` | #5F7B8C | 辅助说明、状态栏 |

**使用规则**

- 主色只给“交互 / 选中 / 气体 / 能量流”；油藏橙只给“原油 / 产量 / 热”；危急珊瑚只给 critical，不大面积铺底。
- 发光只出现在能量流、选中、告警、火炬和边缘高光；不要让所有边框都发光。
- 面板底色为 `{colors.panel}` + 78% alpha，边框为 `{colors.primary}` 的 16% alpha，结构线用 `{colors.hairline}`。实现中的透明度写在 `## Elevation & Depth`，不放进 frontmatter。

## Typography

- `{typography.display-lg}`：开场标题、品牌大标题；40px / 600 / 1.05 / 0.02em。
- `{typography.heading-lg}`：核心模块标题、详情卡名称；24px / 600 / 1.2 / 0.04em。
- `{typography.heading-md}`：面板标题；16px / 600 / 1.3 / 0.06em。
- `{typography.kpi-lg}`：KPI 数字；30px / 500 / 1.0，配合 `font-variant-numeric: tabular-nums`。
- `{typography.body-md}`：正文与详情；14px / 400 / 1.55。
- `{typography.body-sm}`：面板列表、告警正文；12px / 400 / 1.45。
- `{typography.caption}`：单位、时间、脚注；11px / 400 / 1.4。
- `{typography.label}`：英文小标签、坐标刻度；10px / 500 / 0.12em，全大写。
- `{typography.button-md}`：按钮；13px / 500 / 1.2。

**规则**：数字优先 Bahnschrift / DIN Alternate，中文回退 Microsoft YaHei；所有数字使用 tabular-nums；正文不小于 11px，关键数字不靠字重堆叠，而靠字号与留白。

## Layout

- 设计画布 1920×1080，`transform: translate(-50%,-50%) scale(min(vw/1920, vh/1080))` 居中。
- 外边距 24px；Header 88px；左栏 344px；右栏 384px；底部 TourBar 72px；StatusBar 24px。
- 中心 3D 安全区约 `x=388..1492, y=108..928`，不放任何常驻面板。
- 左栏：搜索 → 图层/图例 → 生产态势；右栏：告警 → 选中详情。
- 底部中央：巡演坞；底部通栏：坐标、相机高度、底图来源、演示数据标识。

## Elevation & Depth

- 面板：`linear-gradient(180deg, rgba(6,22,34,.86), rgba(4,16,26,.72))` + `backdrop-filter: blur(12px)` + 1px 边线 `rgba(61,225,255,.16)`。
- 浮层/Tooltip：`rgba(3,15,25,.96)`，1px `{colors.primary}` 46% 边线，阴影 `0 12px 32px rgba(0,0,0,.42)`。
- 切角面板使用双层 `clip-path`：外层做 1px 边线，内层内缩 1px 做底色；切角 8px。
- 场景与 HUD 之间用一层极轻的暗角 + 透明度 ≤0.04 的扫描线；不使用大面积高斯模糊覆盖 3D。井轨迹模式关闭扫描线，避免地层柱出现横纹/闪烁；油藏层带用平面叠加，不用贴地层的透明盒体。
- 发光层与实体层分离：实体层保留 PBR；发光层用独立半分辨率画布 + bloom，再以 screen 混合叠回，避免整屏泛白。

## Shapes

- 圆角只用 `{rounded.xs}`（2px）和 `{rounded.sm}`（4px）；HUD 面板以切角为主，不用 16px 大圆角。
- 按钮 2px 圆角；标签 2px；状态点用 `{rounded.full}`。
- 图标线性 1.5px；状态环、扫描环、管线用圆形/弧形语言，和地质剖面的直线形成对比。
- 禁止在 HUD 中使用厚度超过 1px 的霓虹描边；发光效果只在 3D 和少量关键边线。

## Components

### HUD panel

`{components.hud-panel}` + `{components.hud-panel-header}`。背景用 `{colors.panel}` 78% + 12px blur；边框 `{colors.primary}` 16%；切角 8px；内边距 `{spacing.lg}`。标题左侧 3px 青色竖条，右侧可放计数或操作。折叠状态只隐藏内容，保留标题与状态点。

### KPI

`{components.kpi-value}` 展示主数值，单位用 `{typography.caption}` + `{colors.ink-muted}`；标签用 `{typography.label}` + `{colors.ink-muted}`。预警时使用 `{components.kpi-value-warning}`，并加文字状态，不只依赖颜色。数字变化 600ms 内完成，不持续抖动。

### Buttons

- 主按钮 `{components.button-primary}`，hover 用 `{components.button-primary-hover}`；高 36px，水平内边距 `{spacing.lg}`。
- 次按钮 `{components.button-ghost}`：透明底、1px `{colors.line-soft}` 边、`{colors.ink-secondary}` 文字；hover 时边线升到 `{colors.line-strong}`、文字升到 `{colors.ink}`。
- Focus-visible：1px `{colors.primary}` 外描边，offset 2px；disabled 整体 32% 透明，不保留发光。

### Status tags

`{components.tag-normal}` / `{components.tag-warning}` / `{components.tag-critical}`。背景在 `{colors.deep}` 基础上叠 8% 状态色，1px 状态色 36% 边线；高 20px。必须同时有状态文字或图标，不能只靠颜色区分。offline 用 `{colors.ink-muted}`。

### Alarm card

`{components.alarm-card}`；左侧 2px 等级条，背景叠 6% 等级色；1.6s 呼吸点，频率不超过 3Hz。critical 只加一条屏幕边缘的红色暗角脉冲，不做全屏红闪。已确认（ack）状态降低饱和度并显示“已确认”。

### Tour dock

`{components.tour-dock}`；高 72px，居中；5 个章节节点（全景 / 井场 / 井轨迹 / 管网 / 站库）+ 进度线 + 播放/暂停。左侧按钮显示“播放 / 暂停”文字，右侧为“下一章”；进度线只在章节区域内、按章节均分并在章内连续填充，暂停时停住。当前章节用 `{colors.primary}`，已完成用 `{colors.ink-muted}`，未播放用 `{colors.hairline}`。井轨迹章节预览地层柱时保留巡演坞，不显示顶部井轨迹栏；开场期间显示“跳过开场”。

### Tooltip

`{components.tooltip}`；最大宽 252px，指针偏移 8px，120ms 延迟；1px `{colors.line-strong}`，背景 `rgba(3,15,25,.96)`；不接收指针事件。

### Layer chip

`{components.layer-chip}`；高 26px，左侧 8px 状态点，右侧计数；关闭时整体 42% 透明、去掉状态点发光。

### Detail card

`{components.detail-card}`；顶部名称 + 状态标签，中部 2×2 指标，底部操作（聚焦 / 井轨迹 / 关闭）；进入井轨迹后只保留“返回油田”。内部滚动，不撑破右栏。未选中时显示“选中井 / 站 / 管线查看详情”，不要弹全屏 Modal。

### Status bar

`{components.status-bar}`；高 24px；只放低优先级信息：坐标、相机高度、底图来源、图层数、演示数据。正文 `{colors.ink-muted}`，分隔符 `{colors.hairline}`。

### Scene labels

标签是 3D 场景的一部分，不是 HUD 面板：深色半透明胶囊、1px 状态色边、左侧 6px 状态点、名称 + 单指标；近景最多 12 个、远景 9 个，区块 / 选中 / 告警优先，其余按距离和碰撞避让；不做旋转动画。

## Motion

| 类型 | 时长 | 缓动 | 用途 |
|---|---:|---|---|
| 微交互 | 120–180ms | power1.out | hover / focus |
| 面板入场 | 240–320ms | power3.out | 左右栏、KPI |
| 详情抽屉 | 320ms | power3.inOut | 选中详情 |
| 镜头 | 600–1200ms | power2.inOut | 聚焦 / 告警 |
| 开场 | 8.5s | 分段 | 星空、俯冲、油田入画、HUD |
| 环境循环 | 4–12s | 线性/正弦 | 扫描环、管线流光 |
| 告警脉冲 | 1.6s | 正弦 | 告警点，≤3Hz |

同屏最多两个持续环境动画（扫描环 + 告警脉冲）。用户 pointerdown / wheel 时，镜头时间线在 1 帧内停止，保留当前视角。

## Do's and Don'ts

**Do**

- 用写实 PBR 材质与克制的发光建立“工业数字孪生”的可信度。
- 保持中心油田留白；面板只占边缘。
- 所有数字 tabular；所有状态有文字/图标。
- 用 `{colors.oil}` 表示油、`{colors.success}` 表示气/正常、`{colors.danger}` 表示危急。
- 使用 `tokens.ts` 注入的 CSS 变量；新颜色先加 token，再加组件。

**Don't**

- 不要紫色渐变、16px 大圆角玻璃卡、满屏霓虹描边。
- 不要纯黑 #000 作为大屏底色；不要大面积高饱和红/橙铺底。
- 不要全屏红色告警闪烁；不要让告警脉冲超过 3Hz。
- 不要让扫描线盖住文字或超过 0.04 透明度。
- 不要在 `.vue` 里写裸 hex；不要直接改 Element Plus 全局变量。
- 不要用 CSS 假 3D 替代真实场景标签/拾取；不要给 Three/Cesium 对象套 Vue 深层响应式。

## Responsive Behavior

- 16:9：1920×1080 等比缩放，完整 HUD。
- 21:9 / 32:9：舞台按高度缩放居中，两侧用暗色“遥测翼”填充经纬刻度、图层状态、低频波形；不拉伸场景，不把 HUD 拉宽。
- 16:10：上下留暗色带，状态栏仍在画幅底部。
- <1440×810：隐藏左栏迷你图、次级图例，右栏告警优先；正文 +2px；不承诺完整操作。
- <900px 宽或竖屏：显示横屏提示，保留标题、告警和 3D 预览。
- 4K：HUD 矢量缩放清晰；3D 封顶 DPR 1.5，允许轻微软化换 55fps+。
- 浏览器缩放：使用 `visualViewport` / `innerWidth/innerHeight` 重新计算，不依赖 CSS `zoom`。

## Accessibility

- 正文对比度 ≥4.5:1，小号说明 ≥3:1。
- 状态不能只靠颜色：normal / warning / critical / offline 必须有文字或图标。
- 所有 HUD 按钮可 Tab 聚焦，`focus-visible` 可见。
- 告警使用 `role="status"` / `aria-live="polite"`，不要每秒重复播报。
- `prefers-reduced-motion`：关闭开场、巡演、扫描线、粒子位移；镜头瞬切；保留颜色变化。
- 快捷键：`Space` 播放/暂停巡演，`→` 下一章，`Esc` 关闭详情 / 退出巡演 / 返回油田，`L` 标签，`F` 全屏；交互式井轨迹模式只响应 `Esc` / `F`，巡演中的井轨迹章节仍可播放/切章；输入框聚焦时不拦截。

## Known Gaps

- **无 Figma / 既有 token 来源**：本系统为新建页面级契约，不是对既有设计系统的 capture；若后续有品牌规范，需要重新对齐颜色与字体。
- **标签遮挡**：v1 用“前半球 + 距离 + 选中/告警优先级”近似，不做逐帧 GPU 遮挡；远侧标签可能穿过地形，属已知差距。
- **4K 性能**：固定 1920 渲染 + DPR 1.5 上限，4K 非原生点对点；不承诺 4K 60fps。
- **底图**：在线影像不可用时回退到本地烘焙地形底图，状态栏显示 `LOCAL`；本地底图仅用于演示，不代表真实卫星影像。
- **无障碍完整度**：大屏场景本体不可键盘操作；搜索与告警提供键盘可达替代入口，3D 拾取仍需鼠标。
- **无 Storybook / design.qa**：本轮不引入组件故事与自动截图基线；先用 `/GisPro` 四态截图做人工验收。
- **动态数据**：全部为演示 Mock，不代表真实油田生产数据；页面标注“演示数据”。

## Drift Prevention

- `src/components/GisPro/styles/tokens.ts` 是唯一代码 token 源，运行时注入 CSS 变量；HUD、Three、ECharts、Cesium 都从这里取值。
- `DESIGN.md` 是唯一人类契约；新增/修改 token 必须同时更新两处。
- `.vue` 中禁止裸 hex；场景材质/Shader 的颜色也必须引用 `TOKENS.colors` 或 `fx/materials.ts` 中的派生常量。
- 视觉基线：`/GisPro` 的开场、总览、井轨迹、告警四态各留 1920×1080 截图；后续改动前后对比。
- 完成后用 `design-md-review` 校验本文件；等契约稳定再接 `design-qa` 的自动截图与 token/debt 扫描。
