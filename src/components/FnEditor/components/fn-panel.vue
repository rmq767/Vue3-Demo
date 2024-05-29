<template>
  <div class="fn-panel">
    <el-collapse v-model="active">
      <el-collapse-item title="运算符" name="1">
        <div class="operation">
          <div
            v-for="item in state.operation"
            :key="item.value"
            :title="item.desc"
            :tabindex="-1"
            @click="getValue('operation', item)"
          >
            {{ item.value }}
          </div>
        </div>
      </el-collapse-item>
      <el-collapse-item title="函数" name="2">
        <div class="operation">
          <div
            v-for="item in state.fn"
            :key="item.value"
            :title="item.desc"
            @click="getValue('fn', item)"
            :tabindex="-1"
            v-html="item.value"
          ></div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script lang="ts">
export default { name: "FnPanel" };
</script>
<script lang="ts" setup>
import { ref, reactive } from "vue";

const active = ref(["1", "2"]);
const state = reactive({
  operation: [
    {
      label: "=",
      value: "=",
      key: "=",
      index: 1,
      desc: "等于",
    },
    {
      label: "+",
      value: "+",
      key: "+",
      index: 1,
      desc: "加",
    },
    {
      label: "-",
      value: "-",
      key: "-",
      index: 1,
      desc: "减",
    },
    {
      label: "*",
      value: "*",
      key: "*",
      index: 1,
      desc: "乘",
    },
    {
      label: "/",
      value: "/",
      key: "/",
      index: 1,
      desc: "除",
    },
    {
      label: "^",
      value: "^",
      key: "^",
      index: 1,
      desc: "幂",
    },
    {
      label: "(",
      value: "(",
      key: "(",
      index: 1,
      desc: "左括号",
    },
    {
      label: ")",
      value: ")",
      key: ")",
      index: 1,
      desc: "右括号",
    },
  ],
  fn: [
    {
      label: "exp()",
      value: "exp()",
      desc: "e为底的指数函数",
    },
    {
      label: "sqrt()",
      value: "sqrt()",
      desc: "平方根",
    },
    {
      label: "ln()",
      value: "ln()",
      desc: "e为底的对数",
    },
    {
      label: "log10()",
      value: "log10()",
      desc: "10为底的对数",
    },
    {
      label: "log2()",
      value: "log2()",
      desc: "2为底的对数",
    },
    {
      label: "abs()",
      value: "abs()",
      desc: "绝对值",
    },
    {
      label: "sin()",
      value: "sin()",
      desc: "正弦函数",
    },
    {
      label: "cos()",
      value: "cos()",
      desc: "余弦函数",
    },
    {
      label: "tan()",
      value: "tan()",
      desc: "正切函数",
    },
    {
      label: "asin()",
      value: "asin()",
      desc: "反正弦函数",
    },
    {
      label: "acos()",
      value: "acos()",
      desc: "反余弦函数",
    },
    {
      label: "atan()",
      value: "atan()",
      desc: "反正切函数",
    },
  ],
});

const emits = defineEmits(["getValue"]);

const getValue = (type: string, item: any) => {
  emits("getValue", { item, type });
};
</script>

<style lang="scss" scoped>
.operation {
  display: flex;
  flex-wrap: wrap;
  div {
    min-width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 1px solid #ccc;
    padding: 2px 10px;
    border-radius: 5px;
    margin-bottom: 10px;

    &:hover {
      background-color: #ccc;
      color: #fff;
      box-shadow: 0 0 10px #ccc;
      cursor: pointer;
      user-select: none;
    }
  }
  div + div {
    margin-left: 10px;
  }
}
</style>
