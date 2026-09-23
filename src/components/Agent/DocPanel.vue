<template>
  <div class="doc-panel">
    <h3 class="panel-title">
      <el-icon><EditPen /></el-icon>
      文档工作区
    </h3>

    <!-- 空状态 -->
    <div v-if="!model.content && !model.title" class="doc-empty">
      <el-icon :size="40" color="#d9d9d9"><Document /></el-icon>
      <p>让右侧 Agent 生成文档，内容会实时显示在这里</p>
    </div>

    <template v-else>
      <!-- 元信息 -->
      <div class="doc-meta">
        <div class="meta-row">
          <span class="label">标题</span>
          <span class="value">{{ model.title || "—" }}</span>
        </div>
        <div class="meta-row">
          <span class="label">文件名</span>
          <span class="value">{{ model.filename || "—" }}</span>
        </div>
        <div v-if="model.savedPath" class="meta-row">
          <span class="label">已保存</span>
          <el-tag type="success" size="small" class="path-tag">
            {{ model.savedPath }}
          </el-tag>
        </div>
        <div v-else-if="model.saving" class="meta-row">
          <span class="label">状态</span>
          <el-tag type="primary" size="small">正在写入桌面…</el-tag>
        </div>
      </div>

      <!-- Markdown 预览 -->
      <div class="doc-preview" v-html="renderedHtml"></div>
    </template>
  </div>
</template>

<script lang="ts">
export default { name: "DocPanel" };
</script>
<script lang="ts" setup>
import { computed } from "vue";
import { Document, EditPen } from "@element-plus/icons-vue";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import type { DocModel } from "./types";

const props = defineProps<{
  model: DocModel;
}>();

const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

const renderedHtml = computed(() => {
  if (!props.model.content) return "";
  return DOMPurify.sanitize(md.render(props.model.content));
});
</script>

<style lang="scss" scoped>
.doc-panel {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;

  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 16px;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
  }
}

.doc-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #999;

  p {
    margin: 0;
    font-size: 13px;
    text-align: center;
  }
}

.doc-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px dashed #e8e8e8;

  .meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;

    .label {
      flex-shrink: 0;
      width: 44px;
      color: #999;
    }

    .value {
      color: #1a1a1a;
      font-weight: 500;
      word-break: break-all;
    }

    .path-tag {
      max-width: 100%;
      white-space: normal;
      word-break: break-all;
      line-height: 1.4;
    }
  }
}

.doc-preview {
  flex: 1;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.7;
  color: #333;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: #e0e0e0;
    border-radius: 3px;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: 16px 0 8px;
    font-weight: 600;
    color: #1a1a1a;
  }
  :deep(h1) {
    font-size: 20px;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 6px;
  }
  :deep(h2) {
    font-size: 17px;
  }
  :deep(h3) {
    font-size: 15px;
  }
  :deep(p) {
    margin: 8px 0;
  }
  :deep(ul),
  :deep(ol) {
    padding-left: 22px;
    margin: 8px 0;
  }
  :deep(code) {
    background: #f5f5f5;
    padding: 1px 5px;
    border-radius: 3px;
    font-family: "JetBrains Mono", monospace;
    font-size: 12px;
  }
  :deep(pre) {
    background: #f7f8fa;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
  }
  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;

    th,
    td {
      border: 1px solid #e8e8e8;
      padding: 6px 10px;
      text-align: left;
      font-size: 13px;
    }
    th {
      background: #fafbfc;
      font-weight: 600;
    }
  }
  :deep(blockquote) {
    margin: 8px 0;
    padding: 4px 12px;
    border-left: 3px solid #d9d9d9;
    color: #888;
  }
}
</style>
