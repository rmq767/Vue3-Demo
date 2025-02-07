import {
  Decoration,
  DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import {
  autocompletion,
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { basicSetup } from "codemirror";
import { ref, shallowRef } from "vue";

/**
 * @description 插入tag
 */
const placeholderTagMatcher = new MatchDecorator({
  regexp: /\[\[(.+?)\]\]/g,
  decoration: (match) => {
    return Decoration.replace({ widget: new PlaceholderTag(match[1]) });
  },
});
// 定义一个 PlaceholderTag 类，继承自 WidgetType
class PlaceholderTag extends WidgetType {
  // 定义一个字符串类型的 id 属性，默认值为空字符串
  id: string = "";
  // 定义一个字符串类型的 text 属性，默认值为空字符串
  text: string = "";
  // 构造函数，接收一个字符串类型的 text 参数
  constructor(text: string) {
    // 调用父类的构造函数
    super();
    // 被替换的数据处理
    if (text) {
      const [id, ...texts] = text.split(".");
      if (id && texts.length) {
        this.text = texts.join(".");
        this.id = id;
        console.log(this.text, "id:", this.id);
      }
    }
  }
  eq(other: PlaceholderTag) {
    return this.text == other.text;
  }
  // 此处是我们的渲染方法
  toDOM() {
    let elt = document.createElement("span");
    if (!this.text) return elt;
    elt.className = "cm-tag";
    elt.textContent = this.text;
    return elt;
  }
  ignoreEvent() {
    return true;
  }
}
// 导出一个名为placeholders的常量，它是一个ViewPlugin实例，通过fromClass方法创建
const placeholderTag = ViewPlugin.fromClass(
  // 定义一个匿名类，该类继承自ViewPlugin的基类
  class {
    // 定义一个属性placeholders，用于存储装饰集
    placeholders: DecorationSet;
    // 构造函数，接收一个EditorView实例作为参数
    constructor(view: EditorView) {
      // 调用placeholderMatcher.createDeco方法，根据传入的view创建装饰集，并赋值给placeholders属性
      this.placeholders = placeholderTagMatcher.createDeco(view);
    }
    // update方法，用于在视图更新时更新装饰集
    update(update: ViewUpdate) {
      // 调用placeholderMatcher.updateDeco方法，根据传入的update和当前的placeholders更新装饰集，并重新赋值给placeholders属性
      this.placeholders = placeholderTagMatcher.updateDeco(
        update,
        this.placeholders
      );
    }
  },
  // 配置对象，用于定义插件的行为
  {
    // decorations属性，返回当前实例的placeholders属性，用于提供装饰集
    decorations: (v) => v.placeholders,
    // provide属性，返回一个函数，该函数返回一个EditorView.atomicRanges的提供者
    provide: (plugin) =>
      EditorView.atomicRanges.of((view) => {
        // 从view中获取当前插件的placeholders属性，如果不存在则返回Decoration.none
        return view.plugin(plugin)?.placeholders || Decoration.none;
      }),
  }
);
/**
 * @description 插入公式
 */
const placeholderFnMatcher = new MatchDecorator({
  regexp: /\{\{(.+?)\}\}/g,
  decoration: (match) => {
    return Decoration.replace({ widget: new PlaceholderFn(match[1]) });
  },
});
// 定义一个 PlaceholderFn 类，继承自 WidgetType
class PlaceholderFn extends WidgetType {
  // 定义一个字符串类型的 text 属性，默认值为空字符串
  text: string = "";
  // 构造函数，接收一个字符串类型的 text 参数
  constructor(text: string) {
    // 调用父类的构造函数
    super();
    // 被替换的数据处理
    if (text) {
      this.text = text;
    }
  }
  eq(other: PlaceholderFn) {
    return this.text == other.text;
  }
  // 此处是我们的渲染方法
  toDOM() {
    let elt = document.createElement("span");
    if (!this.text) return elt;
    elt.className = "cm-fn";
    elt.textContent = this.text;
    return elt;
  }
  ignoreEvent() {
    return true;
  }
}
// 导出一个名为placeholders的常量，它是一个ViewPlugin实例，通过fromClass方法创建
const placeholderFn = ViewPlugin.fromClass(
  // 定义一个匿名类，该类继承自ViewPlugin的基类
  class {
    // 定义一个属性placeholders，用于存储装饰集
    placeholders: DecorationSet;
    // 构造函数，接收一个EditorView实例作为参数
    constructor(view: EditorView) {
      // 调用placeholderMatcher.createDeco方法，根据传入的view创建装饰集，并赋值给placeholders属性
      this.placeholders = placeholderFnMatcher.createDeco(view);
    }
    // update方法，用于在视图更新时更新装饰集
    update(update: ViewUpdate) {
      // 调用placeholderMatcher.updateDeco方法，根据传入的update和当前的placeholders更新装饰集，并重新赋值给placeholders属性
      this.placeholders = placeholderFnMatcher.updateDeco(
        update,
        this.placeholders
      );
    }
  },
  // 配置对象，用于定义插件的行为
  {
    // decorations属性，返回当前实例的placeholders属性，用于提供装饰集
    decorations: (v) => v.placeholders,
    // provide属性，返回一个函数，该函数返回一个EditorView.atomicRanges的提供者
    provide: (plugin) =>
      EditorView.atomicRanges.of((view) => {
        // 从view中获取当前插件的placeholders属性，如果不存在则返回Decoration.none
        return view.plugin(plugin)?.placeholders || Decoration.none;
      }),
  }
);

// 背景样式
export const baseTheme = EditorView.baseTheme({
  ".cm-tag": {
    paddingLeft: "6px",
    paddingRight: "6px",
    paddingTop: "3px",
    paddingBottom: "3px",
    marginLeft: "3px",
    marginRight: "3px",
    backgroundColor: "#ffcdcc",
    borderRadius: "4px",
  },
  ".cm-fn": {
    color: "#01a252",
  },
});

/**
 * @description 补全提示
 */
const completions = [
  {
    label: "SUM",
    apply: insetCompletion,
  },
  {
    label: "IF",
    apply: insetCompletion,
  },
];
/**
 * @description 补全提示
 * @param {CompletionContext} context
 * @return {*}
 */
function myCompletions(context: CompletionContext) {
  // 匹配到以s或su或sum或i或if开头的单词
  let before = context.matchBefore(/[s](?:u(?:m)?)?|[i](?:f)?/gi);
  if (!context.explicit && !before) return null;
  return {
    from: before ? before.from : context.pos,
    options: completions,
  };
}

export const useCodemirror = () => {
  const code = ref("");
  const view = shallowRef<EditorView>();
  const editorRef = ref<InstanceType<typeof HTMLDivElement>>();
  const extensions = [
    placeholderTag,
    placeholderFn,
    baseTheme,
    EditorView.lineWrapping,
    basicSetup,
    javascript(),
    autocompletion({ override: [myCompletions] }),
  ];
  /**
   * @description 初始化编辑器
   */
  const init = () => {
    if (editorRef.value) {
      view.value = new EditorView({
        parent: editorRef.value,
        state: EditorState.create({
          doc: code.value,
          extensions: extensions,
        }),
      });
      setTimeout(() => {
        view.value?.focus();
      }, 0);
    }
  };
  /**
   * @description 销毁编辑器
   */
  const destroyed = () => {
    view.value?.destroy();
    view.value = undefined;
  };
  /**
   * @description 插入文本并设置光标位置
   */
  const insertText = (text: string, type: "fn" | "tag" = "tag") => {
    if (view.value) {
      let content = type === "tag" ? `[[${text}]]` : `{{${text}}}()`;
      const selection = view.value.state.selection;
      if (!selection.main.empty) {
        // 如果选中文本，则替换选中文本
        const from = selection.main.from;
        const to = selection.main.to;
        const anchor =
          type === "tag" ? from + content.length : from + content.length - 1;
        const transaction = view.value!.state.update({
          changes: { from, to, insert: content }, // 在当前光标位置插入标签
          selection: {
            anchor,
          }, // 指定新光标位置
        });
        view.value.dispatch(transaction);
      } else {
        // 如果没有选中文本，则插入标签
        const pos = selection.main.head;
        const anchor =
          type === "tag" ? pos + content.length : pos + content.length - 1;
        const transaction = view.value.state.update({
          changes: { from: pos, to: pos, insert: content }, // 在当前光标位置插入标签
          selection: {
            anchor: anchor,
          }, // 指定新光标位置
        });
        view.value.dispatch(transaction);
      }
      setTimeout(() => {
        view.value?.focus();
      }, 0);
    }
  };

  return {
    code,
    view,
    editorRef,
    init,
    destroyed,
    insertText,
  };
};

export const functionDescription = (key: string) => {
  const info = {
    SUM: {
      title: "求和",
      example: "SUM(数值1,数值2,...)",
      description: "SUM(数学成绩,语文成绩,英语成绩,...) = 各科总成绩",
    },
    AVERAGE: {
      title: "平均数",
      example: "AVERAGE(数值1,数值2,...)",
      description: "AVERAGE(数学成绩,语文成绩,英语成绩,...) = 平均成绩",
    },
    IF: {
      title: "条件判断",
      example: "IF(条件,真值,假值)",
      description: "IF(数学成绩>90,优秀,良好)",
    },
  };
  return info[key as keyof typeof info];
};

/**
 * @description 插入补全
 * @param {EditorView} view
 * @param {Completion} completion
 * @param {number} from
 * @param {number} to
 */
function insetCompletion(
  view: EditorView,
  completion: Completion,
  from: number,
  to: number
) {
  const content = `{{${completion.label}}}()`;
  const anchor = from + content.length - 1;
  const transaction = view.state.update({
    changes: { from, to, insert: content }, // 在当前光标位置插入标签
    selection: {
      anchor: anchor,
    }, // 指定新光标位置
  });
  view.dispatch(transaction);
}
