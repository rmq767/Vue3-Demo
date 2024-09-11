<template>
  <div class="left">
    <div class="left-list">
      <div
        class="left-item"
        v-for="item in state.coms"
        :key="item.id"
        draggable="true"
        unselectable="on"
        @drag="drag"
        @dragend="(e) => dragEnd(item, e)"
      >
        <img :src="item.img" :alt="item.name" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "Left" };
</script>
<script lang="ts" setup>
import { reactive } from "vue";

const emit = defineEmits(["drag", "dragEnd"]);

const state = reactive({
  coms: [
    {
      id: 1,
      name: "折线图",
      type: "line1",
      img: "https://echarts.apache.org/examples/data/thumb/line-simple.webp?_v_=1724900876815",
    },
    {
      id: 2,
      name: "柱状图",
      type: "bar1",
      img: "https://echarts.apache.org/examples/data/thumb/bar-simple.webp?_v_=1724900876815",
    },
    {
      id: 3,
      name: "饼图",
      type: "pie1",
      img: "https://echarts.apache.org/examples/data/thumb/pie-simple.webp?_v_=1724900876815",
    },
  ],
});

const drag = (e: DragEvent) => {
  emit("drag", e);
};
const dragEnd = (item: any, e: DragEvent) => {
  emit("dragEnd", item, e);
};
</script>

<style lang="scss" scoped>
.left {
  .left-list {
    display: flex;
    flex-wrap: wrap;
    .left-item {
      width: 180px;
      height: 140px;
      background-color: #fff;
      margin: 10px;
      cursor: move;
      img {
        width: 100%;
        object-fit: cover;
      }
    }
  }
}
</style>
