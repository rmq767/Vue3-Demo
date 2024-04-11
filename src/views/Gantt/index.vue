<template>
  <el-button type="primary" size="default" @click="shoot">截图</el-button>

  <div id="custom" ref="ganttRef" class="h-full w-full"></div>
</template>

<script lang="ts">
export default { name: "Gantt" };
</script>
<script lang="ts" setup>
import { gantt } from "dhtmlx-gantt"; // 引入模块
import "dhtmlx-gantt/codebase/dhtmlxgantt.css"; //皮肤
import { onMounted, reactive } from "vue";
import html2canvas from "html2canvas";
import { useGantt } from "./data";

const state = reactive({
  tasks: {
    data: [
      {
        id: 1,
        text: "Task #1",
        keyNode: "关键节点文本说明2",
        signee: "张三三",
        start_date: "2024-01-17",
        end_date: "2024-01-30",
        real_end_date: "2024-02-24",
        progress: 1,
        parent: 0,
        open: true,
      },
      {
        id: 2,
        text: "Task #2",
        keyNode: "关键节点文本说明2",
        signee: "张三三",
        start_date: "2024-01-17",
        end_date: "2024-01-30",
        real_end_date: "2024-01-24",
        progress: 1,
        parent: 0,
        open: true,
      },
      // {
      //   id: 3,
      //   text: "Task #3",
      //   keyNode: "关键节点文本说明2",
      //   signee: "张三三",
      //   start_date: "2024-01-17",
      //   end_date: "2024-01-30",
      //   // real_end_date: "2024-01-24",
      //   progress: 0.8,
      //   parent: 0,
      //   open: true,
      // },
      {
        id: 20,
        text: "Task #1-1",
        keyNode: "关键节点文本说明3",
        signee: "张三三1",
        start_date: "2024-02-17",
        end_date: "2024-02-27",
        // duration: 2,
        progress: 0.6,
        parent: 1,
      },
      {
        id: 21,
        text: "Task #1-1",
        keyNode: "关键节点文本说明3",
        signee: "张三三1",
        start_date: "2024-02-17",
        end_date: "2024-02-27",
        // duration: 2,
        progress: 0.6,
        parent: 1,
      },
      {
        id: 201,
        text: "Task #1-1",
        keyNode: "关键节点文本说明3",
        signee: "张三三1",
        start_date: "2024-02-17",
        end_date: "2024-02-27",
        // duration: 2,
        progress: 0.6,
        parent: 21,
      },
      {
        id: 2001,
        text: "Task #1-1",
        keyNode: "关键节点文本说明3",
        signee: "张三三1",
        start_date: "2024-02-17",
        end_date: "2024-02-27",
        // duration: 2,
        progress: 0.6,
        parent: 201,
      },
      {
        id: 20001,
        text: "Task #1-1",
        keyNode: "关键节点文本说明3",
        signee: "张三三1",
        start_date: "2024-02-17",
        end_date: "2024-02-27",
        // duration: 2,
        progress: 0.6,
        parent: 2001,
      },
      {
        id: 200001,
        text: "Task #1-1",
        keyNode: "关键节点文本说明3",
        signee: "张三三1",
        start_date: "2024-02-17",
        end_date: "2024-02-27",
        // duration: 2,
        progress: 0.6,
        parent: 20001,
      },
      {
        id: 2000001,
        text: "Task #1-1",
        keyNode: "关键节点文本说明3",
        signee: "张三三1",
        start_date: "2024-02-17",
        end_date: "2024-02-27",
        // duration: 2,
        progress: 0.6,
        // parent: 2,
      },
    ],
  },
});
const { init, ganttRef } = useGantt();
const shoot = () => {
  html2canvas(document.querySelector("#custom")!).then(function (canvas) {
    document.body.querySelector("#app")!.appendChild(canvas);
  });
};
onMounted(() => {
  init(state.tasks as any);
});
</script>

<style lang="scss" scoped>
:deep(.gantt_task_line) {
  background-color: #fff;
  border-radius: 4px;
  .gantt_task_content {
    color: #000;
    overflow: initial;
    z-index: 1;
  }
  .gantt_task_progress_wrapper {
    border-radius: 4px;
    z-index: 2;
    border: 1px solid #299cb4;
  }
}
:deep(.gantt_task_progress) {
  background-color: transparent;
}
:deep(.real-task) {
  border: 1px dashed #299cb4;
  border-radius: 4px;
  z-index: 3;
  background: url("../../assets/line.svg") repeat;
  background-size: auto;
  background-position: 50px 0px;
  opacity: 0.8;
}
:deep(.gantt_marker) {
  z-index: 99;
}
</style>
