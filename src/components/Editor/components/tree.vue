<template>
  <el-tree style="max-width: 600px" :data="props.data" v-bind="$attrs">
    <template #default="{ node, data }">
      <div class="tree-node" @mouseenter="handleMouseEnter(data)">
        <span>{{ data.label }}</span>
        <span class="desc" v-if="data.desc">{{ data.desc }}</span>
      </div>
    </template>
  </el-tree>
</template>

<script lang="ts">
export default { name: "Tree" };
</script>
<script lang="ts" setup>
import { Tree } from "@/types/common";

const props = withDefaults(defineProps<{ data: Tree[] }>(), {
  data: () => [],
});
const emit = defineEmits(["mouseenter"]);
const handleMouseEnter = (data: Tree) => {
  emit("mouseenter", data);
};
</script>

<style lang="scss" scoped>
.tree-node {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .desc {
    font-size: 12px;
    color: #999;
    margin-right: 20px;
  }
}
</style>
