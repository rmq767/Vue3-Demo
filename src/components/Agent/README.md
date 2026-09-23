# Agent 任务执行 Demo — 实现文档

> 一个能**自主完成任务**（如自动填写表单）的前端 AI Agent，而非简单的智能对话。

---

## 一、项目概述

### 1.1 什么是"能完成任务的 Agent"

普通聊天（Chat）与智能体（Agent）的本质区别：

| 维度 | 普通 Chat | Agent |
|------|-----------|-------|
| 交互模式 | 一问一答 | 多轮自主循环 |
| 输出 | 只有文本 | 文本 + **动作（工具调用）** |
| 能力边界 | 只能"说" | 能"说"更能"做" |
| 终止条件 | 回答完即止 | 任务完成才止 |

本 Demo 的核心：让 LLM 从"只会建议你怎么填表单"变成"**直接帮你把表单填了**"。

### 1.2 核心范式：ReAct（Reasoning + Acting）

整个实现的思想内核，循环模式为：

```
Reasoning(思考) → Action(工具调用) → Observation(观察结果) → 再思考 → ... → Finish
```

对应代码为 `useAgent.ts` 中的 `while` 循环。

---

## 二、技术栈

| 层面 | 技术 | 作用 |
|------|------|------|
| 前端框架 | Vue 3 Composition API | `useAgent` 组合式函数封装状态与逻辑 |
| 响应式 | `reactive` / `ref` / `computed` / `watch` | 表单模型、步骤追踪、字段高亮 |
| 类型系统 | TypeScript | 工具/步骤/消息的强类型约束 |
| UI 组件 | Element Plus | `el-form` / `el-timeline` / `el-tag` |
| 流式通信 | `@microsoft/fetch-event-source` | SSE 接收 LLM 增量 token |
| 后端 | Node.js + Express | 独立 Agent 服务，代理 LLM API |
| LLM | DeepSeek | OpenAI 兼容流式接口 |

---

## 三、架构设计

### 3.1 目录结构

**前端**（页面入口 `src/views/Agent/`，其余代码在 `src/components/Agent/`）：

```
src/views/Agent/
└── index.vue           # 主页面（两栏布局）

src/components/Agent/
├── types.ts            # Agent 专用类型定义
├── tools.ts            # 工具注册表 + 执行器
├── prompts.ts          # System Prompt 构建
├── agentStream.ts      # Agent 专用 SSE 调用器
├── useAgent.ts         # Agent Loop 组合式函数（核心）
├── TaskForm.vue        # 演示表单组件
├── DocPanel.vue        # 文档编辑面板组件
├── docTools.ts         # 文档 Agent 工具
├── docPrompts.ts       # 文档 Agent System Prompt
└── AgentTrace.vue      # 执行轨迹时间线组件
```

**后端**（`d:\Projects\agent-server\`，独立于 node-server）：

```
agent-server/
├── index.js            # Express 入口，端口 3001
├── .env                # API Key + 端口配置
├── routes/
│   └── agent.js        # POST /api/agent/chat SSE 端点（无状态）
└── services/
    └── ai.js           # LLM 调用层（DeepSeek）+ Mock 降级
```

### 3.2 关键架构决策

#### 决策 1：工具调用协议用 Markdown 代码块（而非原生 Function Calling）

有两种让 LLM 调用工具的方式：

- **方案 A：OpenAI 原生 Function Calling** — 请求带 `tools` 字段，模型返回结构化 `tool_calls`。缺点：依赖后端和模型都支持该协议，流式解析复杂。
- **方案 B：Markdown 代码块约定（本项目采用）** — 让模型输出约定格式，前端用正则解析：

  ````
  ```tool_call
  {"name": "fill_field", "arguments": {"field": "name", "value": "张三"}}
  ```
  ````

  **优点**：对后端零要求，任何能流式输出文本的 LLM 都能用；与项目已有的 ` ```suggestions ``` ` 模式一脉相承，可移植性极强。

#### 决策 2：表单操作用响应式模型（而非真实 DOM）

| 方式 | 说明 | 取舍 |
|------|------|------|
| DOM 操作 | `querySelector` + 触发事件 | 脆弱、易误操作、依赖选择器 |
| **响应式模型** ✅ | 修改 Vue `reactive` 对象 | 安全、可预测、符合 Vue 范式 |

工具直接修改 `index.vue` 里的 `formModel`，Vue 响应式系统自动驱动视图更新——体现"**数据驱动 UI**"思想。

#### 决策 3：后端独立且无状态

现有 `node-server` 强耦合了 session 管理和聊天专用 system prompt。Agent 需要**无状态**、**纯净透传**的通道，故新建 `agent-server`（端口 3001），前端自行维护消息历史。

---

## 四、分层实现详解

### 4.1 后端层：agent-server

**路由 `routes/agent.js`** — 无状态 LLM 代理：

```javascript
// 前端自己维护消息历史，后端只做 LLM 代理
const apiMessages = messages.map((msg) => ({
  role: msg.role,
  content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
}));
const stream = streamChat(apiMessages, model || "");
// 逐 token 通过 SSE 转发给前端
for await (const token of stream) {
  res.write(`event: token\ndata: ${JSON.stringify({ token, messageId })}\n\n`);
}
```

**SSE（Server-Sent Events）协议要点**：
- 响应头 `Content-Type: text/event-stream`
- 数据格式 `event: xxx\ndata: {...}\n\n`（两个换行结束一条消息）
- 单向服务器推送，适合流式 token 场景

**服务 `services/ai.js`** — 用 Async Generator（异步生成器）处理流：

```javascript
async function* streamFromProvider(provider, messages) {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const delta = parsed.choices?.[0]?.delta?.content || "";
    if (delta) yield delta;   // 逐个 yield token
  }
}
```

> 异步生成器是处理"流式数据"的优雅方式，`for await...of` 消费，天然支持背压和中断。无 API Key 时自动降级为 `streamMock`。

### 4.2 类型层：types.ts

用**联合类型（Discriminated Union）** 定义执行步骤：

```typescript
export interface AgentStep {
  kind: 'thought' | 'tool_call' | 'tool_result' | 'final' | 'error';
  content: string;
  toolCall?: ToolCall;      // 类型收窄：不同 kind 携带不同数据
  toolResult?: ToolResult;
}
```

通过 `kind` 字段区分步骤类型，让 TS 做类型收窄，渲染时安全访问对应字段。

### 4.3 工具层：tools.ts

采用**注册表模式（Registry Pattern）**：

```typescript
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  fill_field: fillFieldTool,    // 填写单个字段
  read_form: readFormTool,      // 读取表单状态
  submit_form: submitFormTool,  // 模拟提交（含校验）
  reset_form: resetFormTool,    // 重置表单
  finish: finishTool,           // 特殊：终止信号
};
```

每个工具是"**Schema 描述 + execute 函数**"的统一结构：
- `parameters`：JSON Schema，供 LLM 理解如何调用
- `execute`：纯函数，接收 args 和 formModel，返回 ToolResult

**安全栅栏设计**（防御性编程）：

```typescript
const ALLOWED_FIELDS = ['name','email','phone','topic','message','agree'];
// 1. 字段白名单校验 —— 防止 LLM 操作未知字段
if (!ALLOWED_FIELDS.includes(field)) return { ok: false, message: `未知字段...` };
// 2. 长度截断 —— 防止超长输入
const strVal = String(value).slice(0, MAX_STRING_LENGTH);
// 3. 模糊匹配 —— 容错 LLM 输出（如"技术咨询"→"技术支持"）
const matched = TOPIC_OPTIONS.find(opt => opt.includes(strVal) || strVal.includes(opt));
```

> **关键思想**：工具执行失败不抛异常，而是返回 `{ok: false, message}`，把错误信息回灌给 LLM，让它**自我纠错**。这是 Agent 鲁棒性的核心。

### 4.4 提示词层：prompts.ts

运用 **Prompt Engineering** 技巧，动态生成 system prompt：

```typescript
// 把工具 Schema 自动拼进 prompt，避免手写不同步（单一数据源）
function formatToolSchemas(): string {
  return TOOL_SCHEMAS.map(tool => `### ${tool.name}\n${tool.description}\n参数:\n...`).join("\n\n");
}
```

包含的关键要素：
1. **角色定义**：明确"你是能操作表单的 Agent"
2. **工具清单**：从 tools.ts 自动生成
3. **输出格式约定**：严格规定 ` ```tool_call``` ` 格式
4. **规则约束**："每次只调一个工具"、"完成必须调 finish"
5. **Few-shot 示例**：给一个完整的"思考→调用→结果→完成"范例

> Few-shot（少样本示例）是引导 LLM 遵循复杂格式最有效的手段之一。

### 4.5 通信层：agentStream.ts

封装单轮 SSE 调用，**回调式 API + 幂等保护**：

```typescript
export function runAgentTurn(options: AgentTurnOptions): void {
  let done = false;   // 幂等标志：防止 onDone 被多次触发
  fetchEventSource(url, {
    onmessage(event) {
      if (done) return;
      if (event.event === "done") { done = true; onDone(fullText); return; }
      if (result.token) { fullText += result.token; onToken(result.token); }
    },
    onerror(err) {
      if (!done) { done = true; onError(err); }
      throw err;   // 抛出以阻止 fetch-event-source 自动重试
    },
  });
}
```

**两个易错点**：
- `done` 标志：SSE 可能发多个终止信号，用布尔量保证 `onDone` 只回调一次
- `onerror` 里 `throw`：`fetch-event-source` 默认会重连，抛错才能彻底停止

### 4.6 核心逻辑层：useAgent.ts（Agent Loop 大脑）

实现完整的 ReAct 循环：

```typescript
async function run(task: string): Promise<void> {
  const messages = [
    { role: "system", content: buildAgentSystemPrompt() },
    { role: "user", content: task },
  ];
  let iteration = 0;

  while (iteration < MAX_ITER && !aborted) {   // ① 循环上限防死循环
    iteration++;
    const response = await callLLM(messages);   // ② 调 LLM

    const thought = stripToolCallBlocks(response);      // ③ 分离思考文本
    const toolCalls = parseToolCalls(response);          // ④ 正则解析工具调用

    if (thought) pushStep({ kind: "thought", content: thought });
    messages.push({ role: "assistant", content: response });

    if (toolCalls.length === 0) { status.value = "done"; break; }  // ⑤ 无工具=结束

    const result = executeToolCall(toolCalls[0]);        // ⑥ 执行工具
    if (toolCall.name === "finish") { status.value = "done"; break; }  // ⑦ finish=终止

    // ⑧ 结果回灌（用 role:user + 前缀，最大兼容性）
    messages.push({
      role: "user",
      content: `[TOOL_RESULT] ${JSON.stringify({ ok: result.ok, message: result.message })}`,
    });
  }
}
```

**几个精妙的方法**：

1. **工具调用解析**（正则 + 容错）：
```typescript
const TOOL_CALL_REGEX = /```tool_call\s*\n([\s\S]*?)\n\s*```/g;
function parseToolCalls(text: string): ToolCall[] {
  // 每次 new RegExp 避免 lastIndex 状态污染（全局正则的坑）
  const regex = new RegExp(TOOL_CALL_REGEX.source, "g");
  while ((match = regex.exec(text)) !== null) {
    try { calls.push(JSON.parse(match[1])); } catch { /* 跳过坏 JSON */ }
  }
}
```

2. **多轮上下文累积**：每轮把 assistant 回复和 tool 结果都 push 进 `messages`，LLM 因此拥有完整记忆。

3. **中止机制（AbortController）**：`aborted` 标志 + `abortController.abort()` 双重保险，用户可随时停止。

4. **工具结果回灌用 `role: user`**：不用 OpenAI 的 `role: tool`，因为不确定后端支持度，`user` 角色兼容性最好。

### 4.7 视图层：三个 Vue 组件

**TaskForm.vue** — 纯受控组件，通过 `highlightField` prop 实现"被 Agent 操作时"的高亮反馈：

```vue
<el-input v-model="model.name" :class="{ 'field-highlight': highlightField === 'name' }" />
```

**AgentTrace.vue** — 用 `el-timeline` 可视化执行轨迹，不同 `kind` 映射不同图标颜色（💭思考 / 🔧调用 / ✅结果 / 🎉完成）。

**index.vue** — 用 `watch` 监听步骤变化触发字段高亮：

```typescript
watch(() => steps.value.length, () => {
  const lastStep = steps.value[steps.value.length - 1];
  if (lastStep?.kind === "tool_result" && lastStep.toolResult?.patch) {
    highlightField.value = Object.keys(lastStep.toolResult.patch)[0];
    setTimeout(() => highlightField.value = null, 1500);  // 1.5s 后消除
  }
});
```

---

## 五、数据流全景图

一次"帮我填姓名张三"的完整流转：

```
用户输入
  ↓ index.vue handleSend()
useAgent.run("帮我填姓名张三")
  ↓ 组装 messages（system prompt + user task）
agentStream.runAgentTurn()  →  POST localhost:3001/api/agent/chat
  ↓ SSE
agent-server routes/agent.js  →  services/ai.js streamChat()
  ↓ OpenAI 兼容流式
DeepSeek LLM
  ↓ 逐 token 返回 "好的...\n```tool_call\n{...fill_field...}\n```"
前端 onToken 累积 → onDone(fullText)
  ↓ parseToolCalls() 解析出 fill_field
executeTool("fill_field", {field:"name",value:"张三"}, formModel)
  ↓ 修改 formModel.name = "张三"
Vue 响应式 → TaskForm 视图更新 + 高亮动画
  ↓ pushStep 记录轨迹 → AgentTrace 显示
结果回灌 messages → 进入下一轮循环
  ↓ LLM 判断任务完成 → 调用 finish
status = "done"，循环结束
```

---

## 六、快速开始

### 6.1 启动后端

```powershell
cd d:\Projects\agent-server
npm install      # 首次需安装依赖
npm run dev      # 启动（端口 3001）
```

### 6.2 启动前端

```powershell
cd d:\Projects\demo
pnpm dev         # 启动（端口 5178）
```

### 6.3 访问

浏览器打开 `http://localhost:5178/Agent/index`，在输入框输入任务，例如：

```
帮我填写表单：姓名张三，邮箱 zhangsan@example.com，手机 13800138000，主题产品咨询，勾选同意
```

即可看到 Agent 自动逐步填写表单并展示执行轨迹。

### 6.4 配置 LLM

编辑 `agent-server/.env`：

```env
AI_PROVIDER=deepseek          # 默认 AI 提供商
DEEPSEEK_API_KEY=你的密钥
```

> 未配置 API Key 时，后端自动降级为 Mock 模式，Demo 仍可运行（不会崩溃）。

---

## 七、工程亮点与方法论

| 方法论 | 具体体现 |
|--------|----------|
| **关注点分离** | 类型/工具/提示词/通信/逻辑/视图 六层各司其职 |
| **零侵入原则** | Agent 全部代码独立在 `src/components/Agent/`（页面入口在 `src/views/Agent/index.vue`），不改任何现有文件 |
| **注册表模式** | 工具用 `TOOL_REGISTRY` 统一管理，新增工具只需注册 |
| **单一数据源** | 工具 Schema 既用于执行校验，又自动生成 prompt |
| **防御性编程** | 白名单、长度限制、JSON 容错、循环上限、错误回灌自纠 |
| **数据驱动 UI** | 操作响应式模型而非 DOM，Vue 自动同步视图 |
| **优雅降级** | 无 API Key 时后端自动切换 Mock 模式 |
| **协议解耦** | Markdown 代码块方案让 Agent 不依赖特定模型能力 |

---

## 八、风险与应对

| 风险 | 缓解措施 |
|------|----------|
| LLM 不按 ` ```tool_call``` ` 格式输出 | prompt 含 few-shot 示例；解析失败时错误回灌让模型自我修正 |
| Agent 死循环 | `MAX_ITER=8` 硬上限 + `finish` 工具作为显式终止信号 |
| 流式中途出现半截代码块 | 仅在 `onDone` 后解析工具调用，流式过程只展示思考文本 |
| 表单字段名不匹配 | 白名单校验 + 返回明确错误信息让 LLM 纠正 |
| 全局正则 `lastIndex` 污染 | 每次解析 `new RegExp(source, "g")` 重建实例 |

---

## 九、扩展方向

基于现有架构，可平滑演进：

1. **新增工具**：在 `tools.ts` 的 `TOOL_REGISTRY` 注册即可（如 `click_button`、`navigate`、`api_call`）。
2. **真实网页操作**：将工具从"操作响应式模型"升级为"操作 DOM / Playwright"。
3. **并行工具调用**：改造 Agent Loop 支持一次执行多个独立工具。
4. **原生 Function Calling**：若后端支持，可在 `agentStream.ts` 切换为 `tools` 参数协议。
5. **执行持久化**：将 `steps` 序列化存储，支持刷新后恢复轨迹。

---

**一句话概括**：本 Demo 用 **"Markdown 代码块工具协议 + ReAct 多轮循环 + Vue 响应式表单模型"** 三大支柱，在前端实现了一个不依赖原生 Function Calling、可自主完成表单填写任务的轻量级 Agent，后端用一个无状态的 Express SSE 代理支撑 LLM 流式调用。
