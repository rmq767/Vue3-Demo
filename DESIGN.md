---
version: alpha
name: 川西气田 · 生产运行监控
description: 亮暗双主题的油气生产监控大屏设计系统。卫星影像退为底图，白色/墨色 HUD 与青蓝数据色，面向 1920×1080 等比大屏。
colors:
  app-bg: "#EEF2F4"
  surface: "#FFFFFF"
  surface-alt: "#F6F8FA"
  border: "#D9E1E6"
  border-strong: "#B9C7CF"
  text: "#18252D"
  text-secondary: "#4E606B"
  text-muted: "#788A94"
  primary: "#0B6E99"
  primary-hover: "#085A7D"
  success: "#2E7D32"
  warning: "#A96500"
  danger: "#B3261E"
  info: "#2F6FA8"
  oil: "#B7791F"
  gas: "#0E7490"
  water: "#386FA4"
  sulfur: "#A97B12"
  scene-bg: "#DCE7EC"
  scene-grid: "#B9C7CF"
typography:
  display-lg:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "0.02em"
  heading-lg:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
  heading-md:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
  kpi-lg:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif"
    fontSize: 30px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.01em"
  body-md:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0.01em"
  body-sm:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0.01em"
  caption:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.02em"
  label:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif"
    fontSize: 10px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.04em"
  button-md:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.02em"
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
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    padding: "{spacing.lg}"
  hud-panel-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.heading-md}"
    padding: "{spacing.sm} {spacing.lg}"
  kpi-value:
    textColor: "{colors.text}"
    typography: "{typography.kpi-lg}"
  kpi-value-warning:
    textColor: "{colors.warning}"
    typography: "{typography.kpi-lg}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    typography: "{typography.button-md}"
    rounded: "{rounded.xs}"
    height: 36px
    padding: "0 {spacing.lg}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "#FFFFFF"
    typography: "{typography.button-md}"
    rounded: "{rounded.xs}"
  button-ghost:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.xs}"
    height: 36px
  tag-normal:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    height: 20px
    padding: "0 {spacing.sm}"
  tag-warning:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.warning}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    height: 20px
  tag-critical:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.danger}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    height: 20px
  alarm-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    padding: "{spacing.md}"
  tour-dock:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    height: 72px
    padding: "{spacing.sm} {spacing.lg}"
  tooltip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    padding: "{spacing.sm} {spacing.md}"
  layer-chip:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    height: 26px
    padding: "0 {spacing.md}"
  detail-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    padding: "{spacing.lg}"
  status-bar:
    backgroundColor: "{colors.app-bg}"
    textColor: "{colors.text-muted}"
    typography: "{typography.caption}"
    height: 24px
---

# 川西气田 · 生产运行监控 — 大屏设计系统

## Overview

本设计系统只服务 `/GisPro`：以高德卫星影像为地理底图，Three.js 地面场景承载井、平台、站库、集输管网与区块边界。页面是**生产监控大屏**，不是科幻指挥舱：数据符号清晰、信息层级稳定、装饰性动效克制。

**主题**：默认亮色，右上角可切换到暗色；选择写入 `localStorage`（`gispro.theme`）。切主题同时重算 HUD CSS 变量、Three/Cesium 材质、底图参数与标记样式，不只是换面板颜色。

**数据边界**：固定种子演示数据（`data/chuanxi.ts`），按公开资料校准到示意经纬度（高德影像 GCJ-02）。页头、状态栏与标题区都标注“演示数据 / 非实时生产数据”，不暗示真实产量。

**来源与置信度**：项目没有 Figma、品牌 token 或 Storybook。`styles/tokens.ts` 是唯一代码事实源，本文是人类可读契约；两者冲突时以代码为准并同步修订本文。

## Colors

亮色是主基准；暗色不是简单反相，而是单独校准的一套场景色。

| Token | Light | Dark | Role |
|---|---|---|---|
| `app-bg` | #EEF2F4 | #101619 | 页面留白、状态栏 |
| `surface` | #FFFFFF | #1E2B32 | HUD 面板、卡片 |
| `surface-alt` | #F6F8FA | #26343C | 次级块、输入框、列表斑马 |
| `border` | #D9E1E6 | #2A3A43 | 常规分隔线 |
| `border-strong` | #B9C7CF | #3C515C | 强调边线、场景网格 |
| `text` | #18252D | #E6EEF2 | 主文字 |
| `text-secondary` | #4E606B | #A7B7C0 | 次级文字 |
| `text-muted` | #788A94 | #7C8E98 | 说明、单位、状态栏 |
| `primary` | #0B6E99 | #5FA8C9 | 交互、选中、主按钮 |
| `primary-hover` | #085A7D | #7CBEDC | 主按钮 hover |
| `success` | #2E7D32 | #63B98A | 正常、运行 |
| `warning` | #A96500 | #D6A24C | 预警、维护 |
| `danger` | #B3261E | #D97A70 | 告警、停输 |
| `info` | #2F6FA8 | #7FA6C8 | 辅助信息 |
| `oil` | #B7791F | #D6B05A | 原油 / 产量 |
| `gas` | #0E7490 | #6FC3D6 | 天然气、集气干线 |
| `water` | #386FA4 | #7FA6C8 | 采出水 |
| `sulfur` | #A97B12 | #D6B05A | 硫磺回收 |
| `scene-bg` | #DCE7EC | #0B1216 | 3D 天空 / 地面底色 |
| `scene-grid` | #B9C7CF | #2A3A43 | 场景网格 |

**场景专用色**（定义在 `SCENE_THEMES`，不暴露给 HUD）：

- 管线：亮色 `gas #0891B2` / `water #2563EB`；暗色 `gas #2DD4BF` / `water #60A5FA`。管线用不受光的 `MeshBasicMaterial`，颜色不随光照漂移。
- 管线描边：亮色近白 `#F4F8FA`（0.9），暗色近黑 `#02090C`（0.75），保证任何底图上都有分离边。
- 区块边界只画 10m 宽虚线，不做大面积填充，避免远景出现整块圆形色斑、压暗卫星影像。
- 井位状态色：正常用 `gas`，预警用 `pipeMaintenance`，停产用灰度 `pipeStopped`。

**规则**

- 卫星影像保留自然地表色，只做轻微明暗处理：亮色 brightness 1.12 / contrast 1.04 / saturation 0.72，暗色压暗到 0.82 / 0.35；不做灰阶化，避免“底图发灰、像一张假地图”。数据符号靠形状、白环和标签与底图区分。
- 同一语义只用一个色：天然气=青，采出水=蓝，硫磺=琥珀，告警=红。不要为了“丰富”给同一图层换色。
- 状态不能只靠颜色，必须带文字（运行正常 / 参数预警 / 停产）或形状（圆=井、方=站库）。

## Theme Behavior

| 项目 | 亮色 | 暗色 |
|---|---|---|
| 底图 | 高德卫星，保留自然地表色、轻微提亮 | 高德卫星，压低亮度、保留地表色相 |
| 场景天空 / 地面 | #D8E6EE / #DCE7EC | #0B1216 / #0B1216 |
| 标记外圈 | 白色环（0.96） | 近黑环（0.9） |
| 标记光晕 | 深墨 #0F2A35（0.9） | 近白 #F8FAFC（0.75） |
| 区块 / 管线 | 深青、蓝、琥珀 | 亮青、浅蓝、亮琥珀 |
| HUD | 白面板 + 深色文字 | 墨色面板 + 浅色文字 |

切换是整场景更新，不允许出现“面板已变、地图还是上一套配色”的中间态。

## Typography

- `{typography.display-lg}` 40 / 600：品牌区、空态大标题。
- `{typography.heading-lg}` 24 / 600：详情卡主名称。
- `{typography.heading-md}` 16 / 600：页面 / 面板标题（实际面板标题用 13px 600，见代码）。
- `{typography.kpi-lg}` 30 / 500：顶部 KPI 数字，`font-variant-numeric: tabular-nums`。
- `{typography.body-md}` 14：正文、详情行。
- `{typography.body-sm}` 12：列表、告警正文、表单。
- `{typography.caption}` 11：单位、时间、脚注。
- `{typography.label}` 10：坐标刻度、英文小标签，不全大写。
- `{typography.button-md}` 13 / 500：按钮。

**规则**：全站使用系统中文字体（PingFang SC / Microsoft YaHei / Noto Sans SC），不再使用 Bahnschrift / DIN 等窄体数字字体。数字与中文同一字族，靠 `tabular-nums` 和字号建立层级。

## Layout

- 设计画布 1920×1080，`transform: translate(-50%,-50%) scale(min(vw/1920, vh/1080))` 居中；浏览器缩放用 `visualViewport` 重算。
- 外边距 24px；Header 88px；左栏 344px；右栏 384px；底部巡演坞 72px；状态栏 24px。
- 中心 3D 安全区约 `x=372..1512, y=78..940`：左栏（搜索 / 图层 / 生产态势）、右栏（告警 / 详情 / 气田概览）与巡演坞都不压在场景主体上。
- 左栏顺序：搜索 → 图层控制 + 图例 → 生产态势。右栏顺序：告警中心 → 选中详情（未选中时显示气田概览 / 空态）。
- 底部巡演坞：播放/暂停 + 5 个章节（全景 / 平台 / 井轨迹 / 管网 / 站库）+ 下一章；当前章节下划线，进度只填充当前章节。
- 状态栏通栏：左下坐标 + 演示数据，中右视高 / 图层数 / 底图来源。
- 沙盘交互：左键拖动平移（目标点可在 40km 内移动），右键或 Ctrl+左键拖动旋转 / 俯仰，滚轮缩放；单击选中，双击井进入井轨迹。场区俯仰限制 -85°~-14°；井轨迹模式放宽到 -88°~+65°，可仰视地层柱底。默认落在全景，不预选、不聚焦任何井或站库。

## Elevation & Depth

- HUD 面板：`surface` 86% → `deep` 74% 的纵向渐变 + 1px `line-soft`，`backdrop-filter: blur(12px)`，2px 圆角 + 12px 切角，阴影 `0 16px 46px rgba(0,0,0,.34)`。暗色下阴影几乎不可见，靠边框分层。
- 浮层 / 搜索下拉：`surface` 实底，`line-strong` 边框，阴影 `0 18px 38px rgba(0,0,0,.45)`。
- 场景与 HUD 之间没有扫描线、暗角或 bloom；地面场景不做全屏后处理（暗色曝光 1.16、亮色 1.0）。井轨迹模式用独立地层柱，不叠半透明盒体。
- 标记与标签永远在场景之上（`depthTest: false`），不受地形遮挡；这是为了可读性，不做“穿模”特效。

## Shapes

- HUD：2px 圆角 + 12px 切角（面板），2px 圆角（卡片 / 按钮）；不使用 16px 大圆角玻璃卡。
- 场景符号：井=圆形点，平台=聚合圆点，站库=方形点，区块=虚线圆环，管线=圆管。形状本身承担语义，不靠图例猜。
- 管线符号适度夸张：真实 DN300–450 在 10km 视距不足 1px，实现取半径 4.2m（气）/ 3.6m（水）+ 1.4m 描边；近景仍明显但不是“金属光缆”。
- 线条不使用霓虹外发光；选中用环形高亮，告警用 1.6s 低幅脉冲。

## Components

### HUD panel

`{components.hud-panel}`。标题栏 38px，左侧 3px 主色竖条 + 13px 600 标题，右侧计数 / 操作；内容区可滚动但不撑破固定栏宽。面板不嵌套面板；同一栏内最多 3 块。

### KPI

顶部 5 组指标（日产气、外输净化气、开井率、集输里程、活动告警）+ 时钟。数字 30px，单位 11px muted；异常值用 `warning` / `danger` 色并带文字标签，不允许只变色。数字变化不做持续跳动。

### Buttons

- 主按钮：`primary` 实底白字，高 36px，2px 圆角；hover 用 `primary-hover`。
- 次按钮：透明 / `surface-alt` 底 + `border` 边；hover 边线升 `border-strong`。
- 图标按钮 28–32px 方形，用于主题、全屏、折叠、定位。
- `focus-visible`：2px `primary` 外描边；disabled 32% 透明。

### Status tags

运行正常 / 参数预警 / 维护 / 停产。背景为状态色 8–12% + 1px 状态色边，高 20px；必须带文字，不能只有色点。

### Alarm card

`{components.alarm-card}`。左侧 2px 等级条；提示为蓝灰、预警为琥珀；每条含时间、对象、指标文案与“确认 / 点击定位”操作。最多同屏 2 条，不自动轮播闪烁。告警点的场景脉冲 1.6s，幅度 ≤30%，不闪烁整屏。

### Tour dock

`{components.tour-dock}`。高 72px；左侧显示播放/暂停；中间 5 章：全景 / 平台 / 井轨迹 / 管网 / 站库；右侧“下一章”。点击章节立即切到该章并播放；暂停时点击章节同样可跳转。进度线只填充当前章节，暂停即停。井轨迹章节进入独立地下柱模式，保留巡演坞与 `Esc` 退出。

### Tooltip

最大宽 252px，指针偏移 8px，120ms 延迟；`surface` 实底 + `border-strong`；不接收指针事件。只用于补充信息，不承载操作。

### Layer chip

高 26px；左侧色点（仅在有语义时显示），右侧数量；关闭时整体 42% 透明。数量从 field 推导，不写死。

### Detail card

顶部名称 + 状态标签，下面 2×2 指标，再下面属性表；底部“聚焦目标 / 井轨迹 / 关闭”。未选中时右栏显示气田概览（储量、产量、气藏层位）与“点击沙盘中的井 / 站库 / 管线查看详情”。详情在右栏内滚动，不弹全屏 Modal。

### Status bar

高 24px；坐标（GCJ-02）、演示数据、视高、图层数（如 `5 / 5`）、底图来源。文字 `ink-muted`，分隔符 `hairline`。

### Scene labels

场景标签是三维场景的一部分，不是 HUD：

- 形态：白色（暗色为深色）小卡片 + 左侧语义色条 + 6px 色点 + 名称 + 单条指标；2px 圆角、无发光、无模糊。
- 位置：卡片浮在锚点上方（`translateY(calc(-50% - 9px))`），**不能盖住**锚点处的圆形 / 方形符号；标签多时靠碰撞避让，不靠缩小字号。
- 优先级：选中 > 区块 > 平台 > 告警 > 站库 > 管线 > 井。区块和平台是骨架，先占位。
- 数量：远景最多 14 个普通标签（管线 3），中景 9 个（管线 4），近景 12 个（管线 6）；区块 / 平台 / 选中 / 告警不占名额但同样避让。
- 视距：单井标签在 8km 以上收起（总览用平台聚合点）；管线标签 28km、站库 32km 为各自上限；区块 / 平台标签在屏幕内常显。
- 屏幕外或落到左 / 右栏、巡演坞下方的标签直接隐藏，不压着 HUD 显示。

### Scene symbol scale

- 井位：核心 10px + 隔离环 15px + 光晕 22px，固定屏幕尺寸；近景与井口模型同时存在，符号负责可读，模型负责体量。
- 平台聚合：核心 13px + 环 21px + 光晕 30px，仅远景显示；标“n 口井”。
- 站库：方形 10.5px + 环 16px + 光晕 23px，远景总览显示，近景由建筑 / 基座承接。
- 区块：无填充，10m 宽虚线边界；区块名尽量落在可视区内（东西两侧的区块标签向气田中心内收，但不越出区块圆）。

## Motion

| 类型 | 时长 | 缓动 | 用途 |
|---|---:|---|---|
| 微交互 | 140ms | power1.out | hover / focus |
| 面板入场 | 280ms | power3.out | 左右栏、KPI |
| 详情切换 | 320ms | ease | 详情内容替换 |
| 镜头 | 900–1200ms | power2.inOut | 聚焦 / 章节切换 |
| 告警脉冲 | 1600ms | 正弦 | 告警环，≤30% 幅度 |
| 巡演镜头 | 1.1–4.8s | power2.inOut | 章节内分镜 |

同屏最多一个持续环境动画（告警脉冲）；没有扫描环、流光、火炬、抽油机或自动演出。用户 pointerdown / wheel 时镜头动画在 1 帧内停止并保留当前视角。

## Do's and Don'ts

**Do**

- 先保证井位、站库、区块、管线在两种主题下都能一眼分辨，再谈氛围。
- 用形状 + 颜色 + 文字三重编码表达状态。
- 保留卫星影像的自然地表色，数据符号用白环、形状和标签建立层级。
- 所有数字从 field 推导，所有颜色从 `TOKENS` / `SCENE_THEMES` 取。
- 层叠顺序固定：Cesium < 地面场景 < 标记 < 标签 < HUD。

**Don't**

- 不要霓虹青、扫描线、发光边框、玻璃大圆角这类“AI 驾驶舱”装饰。
- 不要让标签盖住井位 / 站库符号，或用缩小字号硬塞标签。
- 不要用高饱和卫星原图当背景；也不要纯黑底图。
- 不要全屏红闪或超过 3Hz 的告警动画。
- 不要在 `.vue` 里写裸 hex；不要在 Three / Cesium 对象上套 Vue 深层响应式。
- 不要在前端兜底修改后端单位；单位以接口 / 数据源为准。

## Responsive Behavior

- 16:9：1920×1080 等比缩放，完整 HUD。
- 21:9 / 32:9：舞台按高度缩放居中，两侧用 `app-bg` 填充坐标刻度与低频占位，不拉伸场景。
- 16:10：上下留 `app-bg` 色带，状态栏仍在画幅底部。
- <1440×810：隐藏生产态势迷你图与次要点位，右栏告警优先；正文 +2px 但不改变字号层级。
- <900px 宽或竖屏：显示横屏提示，保留标题、告警与 3D 预览。
- 4K：HUD 矢量缩放清晰；3D / Cesium 封顶 DPR 1.5，允许轻微软化换帧率。

## Accessibility

- 正文对比度 ≥4.5:1，小号说明 ≥3:1；亮暗两套都要实测。
- 状态不能只靠颜色：必须同时有文字或形状。
- 所有 HUD 按钮可 Tab 聚焦，`focus-visible` 可见；场景标签可 Tab + Enter 激活。
- 告警使用 `role="status"` / `aria-live="polite"`，不每秒重复播报。
- `prefers-reduced-motion`：关闭巡演、告警脉冲与镜头缓动；保留颜色变化。
- 快捷键：`Space` 播放 / 暂停巡演，`→` 下一章，`Esc` 关闭详情 / 退出井轨迹，`L` 切换标签，`F` 全屏。
- 主题切换按钮有明确 `aria-label`（切换为亮色主题 / 切换为暗色主题），不依赖图标猜测。

## Known Gaps

- **底图**：在线影像不可用时回退到本地烘焙底图，状态栏标注 `LOCAL`；本地底图仅用于演示，不代表真实卫星影像。
- **遮挡**：场景标签用“前半球 + 距离 + 优先级 + 屏幕矩形避让”近似，不做逐帧 GPU 遮挡；山体背后的标签仍可能露出。
- **标签密度**：近景多个井距很近时（平台井距 100–200m），标签会按碰撞规则收起一部分，需要再放大才能看全。
- **实时性**：所有产量、压力、告警均为演示数据，不代表真实川西气田生产状态。
- **无 Storybook / 自动视觉基线**：本文件是人工验收契约，`/GisPro` 截图需手动对比。

## Drift Prevention

- `src/components/GisPro/styles/tokens.ts` 是唯一代码 token 源；HUD、Three、Cesium、ECharts 都从 `TOKENS` / `SCENE_THEMES` 取值。
- 新增颜色：先加 `LIGHT_COLORS` / `DARK_COLORS`（HUD），再加 `SCENE_THEMES`（场景），最后同步本文；不允许只改一处。
- 标记尺寸、标签预算、底图参数属于设计决策，改动必须同时更新本文与验收截图说明。
- 完成后检查 README 的页面对照表与数据数量，清理旧的“极光油田”“深空霓虹”“5 区块 / 42 井”等过期描述。
