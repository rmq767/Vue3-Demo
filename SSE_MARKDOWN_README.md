# SSE组件Markdown渲染功能说明

## 已完成的修改

1. **修改了 `src/views/SSE/index.vue` 文件**：
   - 添加了 `marked` 和 `DOMPurify` 库的导入
   - 创建了 `renderMarkdown` 函数，用于将Markdown文本转换为安全的HTML
   - 修改了模板部分，使AI消息（role为'assistant'）使用Markdown渲染，而用户消息保持原样
   - 添加了丰富的Markdown样式，包括标题、段落、列表、代码块、引用块、链接、表格和图片的样式

2. **更新了 `package.json` 文件**：
   - 添加了 `marked` 和 `dompurify` 依赖包

## 需要完成的步骤

请运行以下命令安装必要的依赖包：

```bash
pnpm install
```

或者如果您使用的是npm：

```bash
npm install
```

## 功能说明

1. **Markdown渲染**：
   - 使用 `marked` 库解析Markdown文本
   - 使用 `DOMPurify` 清理HTML，防止XSS攻击
   - 仅对AI消息（role为'assistant'）进行Markdown渲染，用户消息保持原样

2. **Markdown样式支持**：
   - 标题（h1-h6）
   - 段落
   - 列表（有序和无序）
   - 代码块和行内代码
   - 引用块
   - 链接
   - 表格
   - 图片

3. **样式特点**：
   - 代码块有深色背景
   - 引用块有左侧边框高亮
   - 链接使用主题色
   - 表格有清晰的边框和表头样式
   - 所有样式与现有主题保持一致

## 使用方法

无需额外配置，后端发送的消息将自动被渲染为Markdown格式。例如：

```javascript
// 后端可以发送这样的消息
{
  "text": "# 标题\n\n这是一段**加粗**的文字。\n\n- 列表项1\n- 列表项2"
}
```

前端将自动渲染为格式化的Markdown内容。
