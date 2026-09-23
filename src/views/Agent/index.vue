<template>
  <div class="agent-page">
    <!-- 左栏：模式切换 + 演示面板 -->
    <aside class="left-panel">
      <div class="mode-switch">
        <el-radio-group v-model="mode" size="small" :disabled="isRunning">
          <el-radio-button value="form">表单 Agent</el-radio-button>
          <el-radio-button value="doc">文档 Agent</el-radio-button>
        </el-radio-group>
      </div>

      <TaskForm
        v-if="mode === 'form'"
        :model="formModel"
        :highlight-field="highlightField"
      />
      <DocPanel v-else :model="docModel" />
    </aside>

    <!-- 右栏：Agent 轨迹 + 输入 -->
    <main class="right-panel">
      <AgentTrace
        :steps="steps"
        :is-running="isRunning"
        :status="status"
        :examples="examples"
        @use-example="handleExample"
      />
      <div class="input-wrapper">
        <ChatInput
          :is-streaming="isRunning"
          @send="handleSend"
          @close="handleAbort"
        />
      </div>
    </main>
  </div>
</template>

<script lang="ts">
export default { name: "Agent" };
</script>
<script lang="ts" setup>
import { reactive, ref, computed, watch } from "vue";
import ChatInput from "@/components/Chat/ChatInput.vue";
import TaskForm from "@/components/Agent/TaskForm.vue";
import DocPanel from "@/components/Agent/DocPanel.vue";
import AgentTrace from "@/components/Agent/AgentTrace.vue";
import { useAgent } from "@/components/Agent/useAgent";
import { createFormAgentProfile } from "@/components/Agent/tools";
import { createDocAgentProfile } from "@/components/Agent/docTools";
import type { ContentBlock, TextContent } from "@/types/chat";
import type {
  TaskFormModel,
  DocModel,
  AgentMode,
} from "@/components/Agent/types";

// ─── 表单模型 ───────────────────────────────────

const mode = ref<AgentMode>("form");

const formModel = reactive<TaskFormModel>({
  name: "",
  email: "",
  phone: "",
  topic: "",
  message: "",
  agree: false,
});

const docModel = reactive<DocModel>({
  title: "",
  filename: "",
  content: "",
  savedPath: "",
  saving: false,
});

// ─── Agent ──────────────────────────────────────

const formProfile = createFormAgentProfile(formModel);
const docProfile = createDocAgentProfile(docModel);
const getProfile = () => (mode.value === "form" ? formProfile : docProfile);

const { steps, status, run, abort, reset } = useAgent(getProfile);

const isRunning = computed(
  () => status.value === "thinking" || status.value === "executing",
);

// 示例任务（按模式区分）
const FORM_EXAMPLES = [
  "帮我填写表单：姓名张三，邮箱 zhangsan@example.com",
  "填写表单，姓名李明，手机13800138000，主题技术支持，勾选同意",
  "重置表单",
];

const DOC_EXAMPLES = [
  "帮我生成一份本周工作总结，保存为 weekly-report.md",
  "生成一份 Vue3 项目 README 文档，保存到桌面",
  "写一份前端性能优化清单的 Markdown 文档",
];

const examples = computed(() =>
  mode.value === "form" ? FORM_EXAMPLES : DOC_EXAMPLES,
);

// 切换模式时清空上一次轨迹
watch(mode, () => {
  reset();
});

// ─── 字段高亮 ───────────────────────────────────

const highlightField = ref<string | null>(null);
let highlightTimer: ReturnType<typeof setTimeout> | null = null;

// 监听 steps 变化，当有 tool_result 带 patch 时高亮对应字段
watch(
  () => steps.value.length,
  () => {
    const lastStep = steps.value[steps.value.length - 1];
    if (lastStep?.kind === "tool_result" && lastStep.toolResult?.patch) {
      const fields = Object.keys(lastStep.toolResult.patch);
      if (fields.length > 0) {
        highlightField.value = fields[0];
        if (highlightTimer) clearTimeout(highlightTimer);
        highlightTimer = setTimeout(() => {
          highlightField.value = null;
        }, 1500);
      }
    }
  },
);

// ─── 事件处理 ───────────────────────────────────

function handleSend(blocks: ContentBlock[]) {
  // 从内容块中提取文本
  const textBlock = blocks.find((b) => b.type === "text") as
    | TextContent
    | undefined;
  const task = textBlock?.text?.trim();
  if (!task) return;

  run(task);
}

function handleAbort() {
  abort();
}

function handleExample(text: string) {
  run(text);
}
</script>

<style lang="scss" scoped>
.agent-page {
  display: grid;
  grid-template-columns: 400px 1fr;
  height: 100vh;
  background: #f5f7fa;
  overflow: hidden;
}

// ─── 左栏 ───────────────────────────────────────

.left-panel {
  padding: 24px;
  overflow-y: auto;
  border-right: 1px solid #e8e8e8;
  background: #fafbfc;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: #e0e0e0;
    border-radius: 3px;
  }
}

.mode-switch {
  flex-shrink: 0;

  :deep(.el-radio-group) {
    width: 100%;
    display: flex;
  }
  :deep(.el-radio-button) {
    flex: 1;
  }
  :deep(.el-radio-button__inner) {
    width: 100%;
  }
}

// ─── 右栏 ───────────────────────────────────────

.right-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
}

.input-wrapper {
  flex-shrink: 0;
  border-top: 1px solid #f0f0f0;
  background: #fff;

  // 隐藏 ChatInput 的附件按钮（Agent 不需要图片/文件上传）
  :deep(.toolbar-actions) {
    display: none;
  }

  // 调整 ChatInput 的边距适配 Agent 页面
  :deep(.chat-input-container) {
    margin: 0;
    padding: 12px 20px;
    border-top: none;
  }
}
</style>
