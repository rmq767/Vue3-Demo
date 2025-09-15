<template>
  <div class="json-schema">
    <div class="content">
      <div class="left">
        <div class="editor" ref="editorRef"></div>
      </div>
      <div class="right">
        <div class="editor" ref="editorRef2"></div>
      </div>
    </div>
    <div>
      <el-button @click="validateJsonSchema">验证</el-button>
      <div class="message">
        {{ state.message }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "JsonSchema" };
</script>
<script lang="ts" setup>
import { reactive } from "vue";
import Ajv from "ajv";
import { useJsonSchema, useJsonString } from "./index";

const state = reactive({
  message: "",
});
const { jsonSchema, editorRef } = useJsonSchema();
const { jsonStr, editorRef: editorRef2 } = useJsonString();

function validateJsonSchema() {
  const ajv = new Ajv();
  const validate = ajv.compile(jsonSchema.value);
  if (jsonStr.value) {
    try {
      const j = JSON.parse(jsonStr.value);
      const valid = validate(j);
      if (!valid) {
        console.log(validate.errors);
        const message = validate.errors!.map((item: any) => {
          return `${item.instancePath} -- ${item.message}`;
        });
        state.message = message.join("\n");
      } else {
        state.message = "验证通过";
      }
    } catch (e) {
      state.message = String(e);
    }
  }
}
</script>

<style lang="scss" scoped>
.content {
  display: flex;
  .left {
    flex: 1;
    height: 70vh;
  }
  .right {
    flex: 1;
    height: 70vh;
  }
  .editor {
    height: 100%;
    overflow: auto;
  }
}
.message {
  margin-top: 10px;
  color: red;
  white-space: pre-wrap;
}
</style>
