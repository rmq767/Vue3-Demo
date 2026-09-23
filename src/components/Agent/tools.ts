import type {
  ToolDefinition,
  ToolResult,
  TaskFormModel,
  ToolContext,
  AgentProfile,
} from "./types";
import { buildAgentSystemPrompt } from "./prompts";

// ════════════════════════════════════════════════════════════════
// 安全栅栏
// ════════════════════════════════════════════════════════════════

const ALLOWED_FIELDS: (keyof TaskFormModel)[] = [
  "name",
  "email",
  "phone",
  "topic",
  "message",
  "agree",
];

const MAX_STRING_LENGTH = 500;

const TOPIC_OPTIONS = ["产品咨询", "技术支持", "商务合作", "投诉建议", "其他"];

// ════════════════════════════════════════════════════════════════
// 工具定义
// ════════════════════════════════════════════════════════════════

const fillFieldTool: ToolDefinition = {
  name: "fill_field",
  description: "填写表单中的单个字段",
  parameters: {
    type: "object",
    properties: {
      field: {
        type: "string",
        description: `字段名，可选值: ${ALLOWED_FIELDS.join(", ")}`,
        enum: ALLOWED_FIELDS,
      },
      value: {
        type: "string | boolean",
        description: "要填入的值",
      },
    },
    required: ["field", "value"],
  },
  execute(args, ctx): ToolResult {
    const formModel = ctx.formModel!;
    const { field, value } = args;

    if (!ALLOWED_FIELDS.includes(field)) {
      return {
        ok: false,
        message: `未知字段 "${field}"，可用字段: ${ALLOWED_FIELDS.join(", ")}`,
      };
    }

    // 类型校验
    if (field === "agree") {
      const boolVal = value === true || value === "true" || value === "是";
      formModel.agree = boolVal;
      return {
        ok: true,
        message: `已设置 ${field} = ${boolVal}`,
        patch: { agree: boolVal },
      };
    }

    // 字符串字段
    const strVal = String(value).slice(0, MAX_STRING_LENGTH);

    // topic 字段做模糊匹配
    if (field === "topic") {
      const matched = TOPIC_OPTIONS.find(
        (opt) => opt.includes(strVal) || strVal.includes(opt),
      );
      const finalVal = matched || strVal;
      formModel.topic = finalVal;
      return {
        ok: true,
        message: `已设置 topic = "${finalVal}"`,
        patch: { topic: finalVal },
      };
    }

    (formModel as any)[field] = strVal;
    return {
      ok: true,
      message: `已设置 ${field} = "${strVal}"`,
      patch: { [field]: strVal } as Partial<TaskFormModel>,
    };
  },
};

const readFormTool: ToolDefinition = {
  name: "read_form",
  description: "读取当前表单所有字段的值",
  parameters: {
    type: "object",
    properties: {},
  },
  execute(_args, ctx): ToolResult {
    const formModel = ctx.formModel!;
    const snapshot = { ...formModel };
    return {
      ok: true,
      message: `当前表单状态: ${JSON.stringify(snapshot, null, 2)}`,
    };
  },
};

const submitFormTool: ToolDefinition = {
  name: "submit_form",
  description: "提交表单（模拟提交，不会真正发送请求）",
  parameters: {
    type: "object",
    properties: {},
  },
  execute(_args, ctx): ToolResult {
    const formModel = ctx.formModel!;
    // 简单校验
    const errors: string[] = [];
    if (!formModel.name.trim()) errors.push("姓名不能为空");
    if (!formModel.email.trim()) errors.push("邮箱不能为空");
    if (!formModel.agree) errors.push("需要勾选同意协议");

    if (errors.length > 0) {
      return {
        ok: false,
        message: `表单校验失败: ${errors.join("; ")}`,
      };
    }

    return {
      ok: true,
      message: "表单已成功提交（模拟）！",
    };
  },
};

const resetFormTool: ToolDefinition = {
  name: "reset_form",
  description: "重置表单为初始空状态",
  parameters: {
    type: "object",
    properties: {},
  },
  execute(_args, ctx): ToolResult {
    const formModel = ctx.formModel!;
    formModel.name = "";
    formModel.email = "";
    formModel.phone = "";
    formModel.topic = "";
    formModel.message = "";
    formModel.agree = false;
    return {
      ok: true,
      message: "表单已重置为空",
      patch: {
        name: "",
        email: "",
        phone: "",
        topic: "",
        message: "",
        agree: false,
      },
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

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  fill_field: fillFieldTool,
  read_form: readFormTool,
  submit_form: submitFormTool,
  reset_form: resetFormTool,
  finish: finishTool,
};

/** 所有工具的 JSON Schema 描述（用于拼入 system prompt） */
export const TOOL_SCHEMAS = Object.values(TOOL_REGISTRY).map((tool) => ({
  name: tool.name,
  description: tool.description,
  parameters: tool.parameters,
}));

/** 执行指定表单工具 */
export async function executeTool(
  name: string,
  args: Record<string, any>,
  ctx: ToolContext,
): Promise<ToolResult> {
  const tool = TOOL_REGISTRY[name];
  if (!tool) {
    return {
      ok: false,
      message: `未知工具 "${name}"，可用工具: ${Object.keys(TOOL_REGISTRY).join(", ")}`,
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

/** 创建「表单填写 Agent」的 Profile */
export function createFormAgentProfile(formModel: TaskFormModel): AgentProfile {
  return {
    mode: "form",
    buildSystemPrompt: buildAgentSystemPrompt,
    executeTool: (name, args) => executeTool(name, args, { formModel }),
  };
}
