<template>
  <div class="drag-layout">
    <div class="left-container">
      <Left @drag="drag" @dragEnd="dragEnd" />
    </div>
    <div ref="wrapper" class="main-container">
      <GridLayout
        ref="gridLayout"
        v-model:layout="layout"
        :col-num="8"
        :row-height="100"
        :is-bounded="true"
        :auto-size="true"
      >
        <GridItem
          v-for="item in layout"
          :key="item.i"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :i="item.i"
          @resized="resized"
        >
          <component
            v-if="charts.get(item.i)"
            :is="charts.get(item.i).chart"
            :key="item.i"
            :index="item.i"
            :style="{
              width: charts.get(item.i).width,
              height: charts.get(item.i).height,
            }"
            ref="chartRef"
          ></component>
        </GridItem>
      </GridLayout>
    </div>
    <div class="right-container"></div>
  </div>
</template>

<script lang="ts">
export default { name: "DragLayout" };
</script>
<script lang="ts" setup>
import { computed, nextTick, reactive, ref, shallowRef } from "vue";
import Left from "./components/left.vue";
import { GridLayout, GridItem, LayoutItemRequired } from "grid-layout-plus";
import { useDragOver } from "./";
import LineChart from "./components/line-chart.vue";
import BarChart from "./components/bar-chart.vue";
import PieChart from "./components/pie-chart.vue";

const layout = ref<Array<LayoutItemRequired>>([]);
const wrapper = ref<HTMLElement>();
const gridLayout = shallowRef<InstanceType<typeof GridLayout>>();
const { position } = useDragOver();
const charts = shallowRef(new Map());
const chartRef = ref<Array<InstanceType<typeof LineChart>>>();

const dropId = "drop";
const dragItem = {
  x: -1,
  y: -1,
  w: 2,
  h: 2,
  i: "",
} as LayoutItemRequired;

/**
 * @description 拖拽时展示位置
 */
// 定义一个名为drag的函数
const drag = () => {
  // 获取父元素的矩形位置
  const parentRect = wrapper.value?.getBoundingClientRect();

  // 如果没有父元素的矩形位置或者没有gridLayout.value，则直接返回
  if (!parentRect || !gridLayout.value) return;

  // 判断鼠标是否在grid中
  const mouseInGrid =
    position.value.x > parentRect.left &&
    position.value.x < parentRect.right &&
    position.value.y > parentRect.top &&
    position.value.y < parentRect.bottom;

  // 如果鼠标在grid中，且没有找到layout.value中i为dropId的元素，则将其添加到layout.value中
  if (mouseInGrid && !layout.value.find((item) => item.i === dropId)) {
    layout.value.push({
      x: (layout.value.length * 2) % 12,
      y: layout.value.length + 12, // puts it at the bottom
      w: 2,
      h: 2,
      i: dropId,
    });
  }

  // 获取layout.value中i为dropId的元素的索引
  const index = layout.value.findIndex((item) => item.i === dropId);

  // 如果索引不为-1，则获取gridLayout.value中dropId的元素
  if (index !== -1) {
    const item = gridLayout.value.getItem(dropId);

    // 如果没有找到gridLayout.value中dropId的元素，则直接返回
    if (!item) return;

    // 尝试将gridLayout.value中dropId的元素的display设置为none
    try {
      item.wrapper.style.display = "none";
    } catch (e) {}

    // 将gridLayout.value中dropId的元素的top和left设置为position.value.y和position.value.x
    Object.assign(item.state, {
      top: position.value.y - parentRect.top,
      left: position.value.x - parentRect.left,
    });
    // 计算gridLayout.value中dropId的元素的新位置
    const newPos = item.calcXY(
      position.value.y - parentRect.top,
      position.value.x - parentRect.left
    );

    // 如果鼠标在grid中，则触发gridLayout.value的dragstart事件
    if (mouseInGrid) {
      gridLayout.value.dragEvent(
        "dragstart",
        dropId,
        newPos.x,
        newPos.y,
        dragItem.h,
        dragItem.w
      );
      // 将dragItem的i、x和y设置为index、layout.value[index].x和layout.value[index].y
      dragItem.i = String(index);
      dragItem.x = layout.value[index].x;
      dragItem.y = layout.value[index].y;
    } else {
      // 如果鼠标不在grid中，则触发gridLayout.value的dragend事件
      gridLayout.value.dragEvent(
        "dragend",
        dropId,
        newPos.x,
        newPos.y,
        dragItem.h,
        dragItem.w
      );
      // 从layout.value中移除i为dropId的元素
      layout.value = layout.value.filter((item) => item.i !== dropId);
    }
  }
};
/**
 * @description 拖拽结束 添加layout和chart组件
 */
function dragEnd(chart: any) {
  // 获取父元素的位置信息
  const parentRect = wrapper.value?.getBoundingClientRect();

  // 如果没有父元素位置信息或者没有gridLayout，则直接返回
  if (!parentRect || !gridLayout.value) return;

  // 判断鼠标是否在grid内
  const mouseInGrid =
    position.value.x > parentRect.left &&
    position.value.x < parentRect.right &&
    position.value.y > parentRect.top &&
    position.value.y < parentRect.bottom;

  // 如果在grid内，则触发grid的dragend事件，并将layout中的当前项删除
  if (mouseInGrid) {
    gridLayout.value.dragEvent(
      "dragend",
      dropId,
      dragItem.x,
      dragItem.y,
      dragItem.h,
      dragItem.w
    );
    layout.value = layout.value.filter((item) => item.i !== dropId);
  } else {
    return;
  }

  // 获取grid中的当前项
  const item = gridLayout.value.getItem(dropId);

  // 将当前项添加到layout中
  layout.value.push({
    x: dragItem.x,
    y: dragItem.y,
    w: dragItem.w,
    h: dragItem.h,
    i: dragItem.i,
  });
  // 触发grid的dragend事件
  gridLayout.value.dragEvent(
    "dragend",
    dragItem.i,
    dragItem.x,
    dragItem.y,
    dragItem.h,
    dragItem.w
  );

  // 根据chart的id，将chart添加到charts中
  switch (chart.id) {
    case 1:
      charts.value.set(dragItem.i, {
        index: dragItem.i,
        chartId: chart.id,
        chart: LineChart,
        width: item.state.style.width,
        height: item.state.style.height,
      });
      break;
    case 2:
      charts.value.set(dragItem.i, {
        index: dragItem.i,
        chartId: chart.id,
        chart: BarChart,
        width: item.state.style.width,
        height: item.state.style.height,
      });
      break;
    case 3:
      charts.value.set(dragItem.i, {
        index: dragItem.i,
        chartId: chart.id,
        chart: PieChart,
        width: item.state.style.width,
        height: item.state.style.height,
      });
      break;
  }

  // 将当前项在grid中的样式设置为正常显示
  if (!item) return;
  try {
    item.wrapper.style.display = "";
  } catch (e) {}
}
/**
 * @description 改变item大小 重新渲染图表
 */
const resized = (
  i: number | string,
  newH: number,
  newW: number,
  newHPx: number,
  newWPx: number
) => {
  const chart = charts.value.get(i);
  chart.width = newWPx + "px";
  chart.height = newHPx + "px";
  nextTick(() => {
    if (chartRef.value) {
      const chartEl = chartRef.value[Number(i)];
      chartEl.resize();
    }
  });
};
</script>

<style lang="scss" scoped>
.drag-layout {
  display: flex;
  min-height: 100%;
  overflow-x: hidden;
  .left-container {
    background-color: #ccc;
    flex: 0 0 400px;
  }
  .main-container {
    flex: 1 1 auto;
    background-color: #eee;
    min-width: 900px;
  }
  .right-container {
    flex: 0 0 400px;
    background-color: #ccc;
  }
}
:deep(.vgl-item) {
  background-color: #fff;
}
:deep(.vgl-item--placeholder) {
  background-color: green;
  opacity: 0.3;
}
:deep(.vgl-layout::before) {
  position: absolute;
  width: calc(100% - 5px);
  height: calc(100% - 5px);
  margin: 5px;
  content: "";
  background-image: linear-gradient(to right, lightgrey 1px, transparent 1px),
    linear-gradient(to bottom, lightgrey 1px, transparent 1px);
  background-repeat: repeat;
  background-size: calc(calc(100% - 5px) / 12) 40px;
}
:deep(.vgl-layout) {
  min-height: 100%;
  // height: 900px;
}
</style>
