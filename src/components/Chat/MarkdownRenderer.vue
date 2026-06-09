<template>
  <div class="markdown-body" v-html="result"></div>
</template>

<script lang="ts">
export default { name: "MarkdownRender" };
</script>
<script lang="ts" setup>
import { computed } from "vue";
import markdownit from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/docco.css";

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
});
// Actual default values
const md = markdownit({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }

    return ""; // use external default escaping
  },
});
const result = computed(() => md.render(props.content));
</script>

<!-- scoped: 只影响组件自身结构 -->
<style lang="scss" scoped>
.markdown-body {
  width: 100%;
  min-width: 0;
}
</style>

<!-- 非 scoped: 穿透 v-html 渲染的内容 (代码块/表格等) -->
<style lang="scss">
$code-font: "SF Mono", "Fira Code", "Consolas", "Liberation Mono", monospace;

.markdown-body {
  // ── 通用 ──────────────────────────────────────
  p {
    margin: 4px 0;
    white-space: pre-wrap;
  }

  // ── 标题 ──────────────────────────────────────
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 14px 0 8px;
    font-weight: 600;
    line-height: 1.4;
  }
  h1 {
    font-size: 1.35em;
  }
  h2 {
    font-size: 1.2em;
  }
  h3 {
    font-size: 1.05em;
  }
  h4 {
    font-size: 1em;
  }

  // ── 列表 ──────────────────────────────────────
  ul,
  ol {
    padding-left: 20px;
    margin: 4px 0;
    li {
      margin: 2px 0;
    }
  }

  // ── 引用块 ──────────────────────────────────────
  blockquote {
    margin: 8px 0;
    padding: 6px 12px;
    border-left: 3px solid #1677ff;
    background: #f5f7ff;
    border-radius: 0 6px 6px 0;
    color: #555;
    p {
      margin: 2px 0;
    }
  }

  // ── 分割线 ──────────────────────────────────────
  hr {
    border: none;
    border-top: 1px solid #e0e0e0;
    margin: 12px 0;
  }

  // ── 内联代码 ──────────────────────────────────────
  :not(pre) > code {
    background: rgba(0, 0, 0, 0.06);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: $code-font;
    font-size: 0.88em;
    color: #d63384;
    word-break: break-word;
  }

  // ── 代码块 ──────────────────────────────────────
  pre {
    position: relative;
    overflow-x: auto;
    overflow-y: hidden;
    border-radius: 8px;
    padding: 14px 16px;
    margin: 8px 0;
    background: #ebebeb !important;
    font-size: 13px;
    line-height: 1.55;

    code {
      font-family: $code-font;
      background: none !important;
      padding: 0;
      color: #000;
      font-size: inherit;
      tab-size: 2;
    }

    // 滚动条
    &::-webkit-scrollbar {
      height: 6px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 3px;
    }
  }

  // ── 表格 ──────────────────────────────────────
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0;
    font-size: 13px;
    display: block;
    overflow-x: auto;

    th,
    td {
      border: 1px solid #d0d0d0;
      padding: 7px 12px;
      text-align: left;
      line-height: 1.5;
    }

    th {
      background: #f0f0f0;
      font-weight: 600;
    }

    tr:nth-child(even) td {
      background: #f8f8f8;
    }
  }

  // ── 图片 ──────────────────────────────────────
  img {
    max-width: 100%;
    border-radius: 6px;
    margin: 4px 0;
  }
}
</style>
