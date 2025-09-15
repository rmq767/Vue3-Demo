import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { json } from "@codemirror/lang-json";
import { basicSetup } from "codemirror";
import { onMounted, onUnmounted, Ref, ref, shallowRef, watch } from "vue";

export const useJsonSchema = () => {
  const jsonStr = ref(`{
    "type":"object",
    "properties":{
      "name":{
        "type":"string"
      },
      "age":{
        "type":"number",
        "exclusiveMinimum":0,
        "maximum":100
      },
      "tags":{
        "type":"array",
        "items":{
          "type":"string"
        },
        "uniqueItems":true,
        "minItems":1,
        "maxItems":10
      }
    },
    "required":["name","age"]
  }`);
  const jsonSchema = ref({});
  const view = shallowRef<EditorView>();
  const editorRef = ref<InstanceType<typeof HTMLDivElement>>();
  const extensions = [
    EditorView.lineWrapping, //换行
    basicSetup, //基础配置
    json(), //json语言支持
    listenerInput(jsonStr), //监听输入
  ];

  watch(
    () => jsonStr.value,
    (newVal, oldVal) => {
      jsonSchema.value = convertTemplateToJson(newVal);
    },
    {
      deep: true,
      immediate: true,
    }
  );

  // 转换函数
  function convertTemplateToJson(templateStr: string) {
    try {
      // 移除模板字符串的反引号
      let jsonStr = templateStr.trim();
      if (jsonStr.startsWith("`") && jsonStr.endsWith("`")) {
        jsonStr = jsonStr.substring(1, jsonStr.length - 1);
      }

      // 移除可能存在的${...}表达式
      jsonStr = jsonStr.replace(/\${(.*?)}/g, '"$1"');

      // 解析为JSON对象
      const jsonObj = JSON.parse(jsonStr);

      // 格式化JSON输出
      return jsonObj;
    } catch (error: any) {
      throw new Error(`转换失败: ${error.message}`);
    }
  }

  /**
   * @description 初始化编辑器
   */
  const init = () => {
    if (editorRef.value) {
      view.value = new EditorView({
        parent: editorRef.value,
        state: EditorState.create({
          doc: jsonStr.value,
          extensions: extensions,
        }),
      });
    }
  };
  /**
   * @description 销毁编辑器
   */
  const destroyed = () => {
    view.value?.destroy();
    view.value = undefined;
  };

  onMounted(() => {
    init();
  });

  onUnmounted(() => {
    destroyed();
  });

  return {
    jsonSchema,
    editorRef,
  };
};

export const useJsonString = () => {
  const jsonStr = ref(`{
    "name": "John",
    "age": 30
  }`);
  const view = shallowRef<EditorView>();
  const editorRef = ref<InstanceType<typeof HTMLDivElement>>();
  const extensions = [
    EditorView.lineWrapping, //换行
    basicSetup, //基础配置
    json(), //json语言支持
    listenerInput(jsonStr), // 监听输入
  ];

  /**
   * @description 初始化编辑器
   */
  const init = () => {
    if (editorRef.value) {
      view.value = new EditorView({
        parent: editorRef.value,
        state: EditorState.create({
          doc: jsonStr.value,
          extensions: extensions,
        }),
      });
    }
  };
  /**
   * @description 销毁编辑器
   */
  const destroyed = () => {
    view.value?.destroy();
    view.value = undefined;
  };

  onMounted(() => {
    init();
  });

  onUnmounted(() => {
    destroyed();
  });

  return {
    jsonStr,
    editorRef,
  };
};
/**
 * @description 监听输入事件
 * @param {Ref<string>} jsonStr
 * @return {*}
 */
function listenerInput(jsonStr: Ref<string>) {
  return EditorView.updateListener.of((update) => {
    // 监听输入事件
    if (update.docChanged) {
      const text = update.state.doc;
      jsonStr.value = text.toString();
    }
  });
}
