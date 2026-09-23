<template>
  <div class="agent-trace">
    <div class="trace-header">
      <h3>
        <el-icon><Monitor /></el-icon>
        执行轨迹
      </h3>
      <el-tag v-if="isRunning" type="primary" size="small" effect="dark">
        <span class="running-dot"></span>
        运行中
      </el-tag>
      <el-tag v-else-if="steps.length" :type="statusType" size="small">
        {{ statusText }}
      </el-tag>
    </div>

    <div class="trace-body" ref="traceBodyRef">
      <template v-if="steps.length === 0 && !isRunning">
        <div class="empty-state">
          <el-icon :size="40" color="#d9d9d9"><Promotion /></el-icon>
          <p>输入任务描述，Agent 将自动执行</p>
          <div class="example-tasks">
            <span class="example-label">试试：</span>
            <el-tag
              v-for="example in examples"
              :key="example"
              class="example-tag"
              effect="plain"
              @click="$emit('useExample', example)"
            >
              {{ example }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-timeline v-else>
        <el-timeline-item
          v-for="step in steps"
          :key="step.id"
          :type="getStepType(step.kind)"
          :icon="getStepIcon(step.kind)"
          :timestamp="formatTime(step.timestamp)"
          placement="top"
        >
          <div :class="['step-card', step.kind]">
            <div class="step-content">{{ step.content }}</div>
            <div
              v-if="step.toolCall && step.kind === 'tool_call'"
              class="step-detail"
            >
              <code>{{ step.toolCall.name }}</code>
              <pre>{{ JSON.stringify(step.toolCall.arguments, null, 2) }}</pre>
            </div>
            <div
              v-if="step.toolResult && step.kind === 'tool_result'"
              class="step-detail"
            >
              <el-tag
                :type="step.toolResult.ok ? 'success' : 'danger'"
                size="small"
              >
                {{ step.toolResult.ok ? "成功" : "失败" }}
              </el-tag>
            </div>
          </div>
        </el-timeline-item>

        <!-- 运行中的加载指示 -->
        <el-timeline-item v-if="isRunning" type="primary" :hollow="true">
          <div class="step-card thinking">
            <div class="loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "AgentTrace" };
</script>
<script lang="ts" setup>
import { computed, ref, watch, nextTick } from "vue";
import { Monitor, Promotion } from "@element-plus/icons-vue";
import type { AgentStep, AgentStatus, StepKind } from "./types";

const props = defineProps<{
  steps: AgentStep[];
  isRunning: boolean;
  status: AgentStatus;
  examples?: string[];
}>();

defineEmits<{
  useExample: [text: string];
}>();

const traceBodyRef = ref<HTMLElement>();

const examples = computed(
  () =>
    props.examples ?? [
      "帮我填写表单：姓名张三，邮箱 zhangsan@example.com",
      "填写表单，姓名李明，手机13800138000，主题技术支持，勾选同意",
      "重置表单",
    ],
);

// ─── 计算属性 ───────────────────────────────────

const statusType = computed(() => {
  switch (props.status) {
    case "done":
      return "success";
    case "error":
      return "danger";
    case "aborted":
      return "warning";
    default:
      return "info";
  }
});

const statusText = computed(() => {
  switch (props.status) {
    case "done":
      return "已完成";
    case "error":
      return "出错";
    case "aborted":
      return "已中止";
    default:
      return "空闲";
  }
});

// ─── 方法 ───────────────────────────────────────

function getStepType(kind: StepKind) {
  switch (kind) {
    case "thought":
      return "info";
    case "tool_call":
      return "primary";
    case "tool_result":
      return "success";
    case "error":
      return "danger";
    case "final":
      return "warning";
    default:
      return "info";
  }
}

function getStepIcon(kind: StepKind) {
  switch (kind) {
    case "thought":
      return "💭";
    case "tool_call":
      return "🔧";
    case "tool_result":
      return "✅";
    case "error":
      return "❌";
    case "final":
      return "🎉";
    default:
      return undefined;
  }
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

// ─── 自动滚动到底部 ─────────────────────────────

watch(
  () => props.steps.length,
  async () => {
    await nextTick();
    if (traceBodyRef.value) {
      traceBodyRef.value.scrollTop = traceBodyRef.value.scrollHeight;
    }
  },
);
</script>

<style lang="scss" scoped>
.agent-trace {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .trace-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;

    h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #1a1a1a;
    }
  }

  .trace-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;

    &::-webkit-scrollbar {
      width: 5px;
    }
    &::-webkit-scrollbar-thumb {
      background: #e0e0e0;
      border-radius: 3px;
    }
  }
}

// ─── 空状态 ─────────────────────────────────────

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: #999;

  p {
    margin: 0;
    font-size: 14px;
  }

  .example-tasks {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: center;
    max-width: 360px;
    margin-top: 8px;

    .example-label {
      font-size: 12px;
      color: #bbb;
    }

    .example-tag {
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;

      &:hover {
        color: #1677ff;
        border-color: #1677ff;
        background: #e6f4ff;
      }
    }
  }
}

// ─── 步骤卡片 ───────────────────────────────────

.step-card {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;

  &.thought {
    background: #fafafa;
    color: #555;
  }

  &.tool_call {
    background: #e6f4ff;
    border: 1px solid #bae0ff;
    color: #0958d9;
  }

  &.tool_result {
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    color: #389e0d;
  }

  &.error {
    background: #fff2f0;
    border: 1px solid #ffccc7;
    color: #cf1322;
  }

  &.final {
    background: #fffbe6;
    border: 1px solid #ffe58f;
    color: #d48806;
    font-weight: 500;
  }

  .step-content {
    word-break: break-word;
    white-space: pre-wrap;
  }

  .step-detail {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed rgba(0, 0, 0, 0.08);

    code {
      font-size: 12px;
      background: rgba(0, 0, 0, 0.04);
      padding: 1px 5px;
      border-radius: 3px;
      font-family: "JetBrains Mono", monospace;
    }

    pre {
      margin: 4px 0 0;
      font-size: 11px;
      background: rgba(0, 0, 0, 0.03);
      padding: 6px 8px;
      border-radius: 4px;
      overflow-x: auto;
      font-family: "JetBrains Mono", monospace;
    }
  }
}

// ─── 加载动画 ───────────────────────────────────

.loading-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;

  span {
    width: 6px;
    height: 6px;
    background: #1677ff;
    border-radius: 50%;
    animation: dot-bounce 1.4s ease-in-out infinite;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes dot-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

// ─── 运行中标签动画 ─────────────────────────────

.running-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 50%;
  margin-right: 4px;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
