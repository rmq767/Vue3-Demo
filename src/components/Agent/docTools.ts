import type {
  ToolDefinition,
  ToolResult,
  ToolContext,
  DocModel,
  AgentProfile,
} from "./types";
import { buildDocSystemPrompt } from "./docPrompts";

// ════════════════════════════════════════════════════════════════
// 文档生成 Agent —— 工具集
// 与表单 Agent 不同：save_document 会调用后端接口，把 Markdown
// 真实写入运行 agent-server 那台机器的桌面。
// ════════════════════════════════════════════════════════════════

const API_BASE = "http://localhost:3001/api/agent";

/** 规范化文件名：去除路径分隔符与非法字符，确保以 .md 结尾 */
function normalizeFilename(raw: string): string {
  let name = String(raw)
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\.\.+/g, "_")
    .trim();
  if (!name) name = "document";
  if (!name.toLowerCase().endsWith(".md")) name += ".md";
  return name;
}

// ════════════════════════════════════════════════════════════════
// 工具定义
// ════════════════════════════════════════════════════════════════

const createDocumentTool: ToolDefinition = {
  name: "create_document",
  description: "创建或更新 Markdown 文档草稿（标题、文件名、正文），内容会实时显示在左侧预览区",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "文档标题",
      },
      filename: {
        type: "string",
        description: "保存到桌面的文件名，需以 .md 结尾，例如 weekly-report.md（可选，缺省时根据标题生成）",
      },
      content: {
        type: "string",
        description: "Markdown 格式的正文内容",
      },
    },
    required: ["title", "content"],
  },
  execute(args, ctx): ToolResult {
    const doc = ctx.docModel!;

    if (args.title != null) doc.title = String(args.title);
    if (args.content != null) doc.content = String(args.content);
    if (args.filename) {
      doc.filename = normalizeFilename(String(args.filename));
    } else if (!doc.filename) {
      doc.filename = normalizeFilename(`${doc.title || "document"}.md`);
    }

    if (!doc.content.trim()) {
      return { ok: false, message: "文档正文不能为空" };
    }

    // 每次生成新草稿时清空上一次的保存路径
    doc.savedPath = "";

    return {
      ok: true,
      message: `已生成文档草稿「${doc.title}」，共 ${doc.content.length} 个字符，文件名 ${doc.filename}`,
    };
  },
};

const saveDocumentTool: ToolDefinition = {
  name: "save_document",
  description: "将当前文档草稿保存到本机桌面（通过后端写入真实文件），返回保存的绝对路径",
  parameters: {
    type: "object",
    properties: {
      filename: {
        type: "string",
        description: "可选，覆盖保存的文件名（.md）",
      },
    },
  },
  async execute(args, ctx): Promise<ToolResult> {
    const doc = ctx.docModel!;

    if (!doc.content.trim()) {
      return {
        ok: false,
        message: "没有可保存的文档内容，请先调用 create_document 生成草稿",
      };
    }

    if (args.filename) doc.filename = normalizeFilename(String(args.filename));
    if (!doc.filename) doc.filename = normalizeFilename(`${doc.title || "document"}.md`);

    doc.saving = true;
    try {
      const resp = await fetch(`${API_BASE}/save-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: doc.filename,
          title: doc.title,
          content: doc.content,
        }),
      });
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data.ok) {
        return {
          ok: false,
          message: `保存失败: ${data.error || resp.statusText}`,
        };
      }

      doc.savedPath = data.path;
      return { ok: true, message: `已保存到桌面: ${data.path}` };
    } catch (err: any) {
      return {
        ok: false,
        message: `保存请求失败（请确认 agent-server 已启动）: ${err.message || String(err)}`,
      };
    } finally {
      doc.saving = false;
    }
  },
};

const readDocumentTool: ToolDefinition = {
  name: "read_document",
  description: "读取当前文档草稿的标题、文件名与正文",
  parameters: {
    type: "object",
    properties: {},
  },
  execute(_args, ctx): ToolResult {
    const doc = ctx.docModel!;
    if (!doc.content) {
      return { ok: true, message: "当前没有文档草稿" };
    }
    return {
      ok: true,
      message: `标题: ${doc.title}\n文件名: ${doc.filename}\n正文:\n${doc.content}`,
    };
  },
};

const finishTool: ToolDefinition = {
  name: "finish",
  description: "标记任务已完成，终止 Agent 执行循环",
  parameters: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "任务完成摘要",
      },
    },
    required: ["summary"],
  },
  execute(args): ToolResult {
    return {
      ok: true,
      message: args.summary || "任务已完成",
    };
  },
};

// ════════════════════════════════════════════════════════════════
// 工具注册表
// ════════════════════════════════════════════════════════════════

export const DOC_TOOL_REGISTRY: Record<string, ToolDefinition> = {
  create_document: createDocumentTool,
  save_document: saveDocumentTool,
  read_document: readDocumentTool,
  finish: finishTool,
};

/** 所有文档工具的 JSON Schema 描述（用于拼入 system prompt） */
export const DOC_TOOL_SCHEMAS = Object.values(DOC_TOOL_REGISTRY).map((tool) => ({
  name: tool.name,
  description: tool.description,
  parameters: tool.parameters,
}));

/** 执行指定文档工具 */
export async function executeDocTool(
  name: string,
  args: Record<string, any>,
  ctx: ToolContext,
): Promise<ToolResult> {
  const tool = DOC_TOOL_REGISTRY[name];
  if (!tool) {
    return {
      ok: false,
      message: `未知工具 "${name}"，可用工具: ${Object.keys(DOC_TOOL_REGISTRY).join(", ")}`,
    };
  }
  try {
    return await tool.execute(args, ctx);
  } catch (err: any) {
    return {
      ok: false,
      message: `工具执行异常: ${err.message || String(err)}`,
    };
  }
}

/** 创建「文档生成 Agent」的 Profile */
export function createDocAgentProfile(docModel: DocModel): AgentProfile {
  return {
    mode: "doc",
    buildSystemPrompt: buildDocSystemPrompt,
    executeTool: (name, args) => executeDocTool(name, args, { docModel }),
  };
}
