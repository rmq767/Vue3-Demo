<template>
  <div class="desc">
    <h4 class="title">{{ props.title }}</h4>
    <p class="example">{{ props.example }}</p>
    <p class="description">{{ props.description }}</p>
  </div>
</template>

<script lang="ts">
export default { name: "Desc" };
</script>
<script lang="ts" setup>
const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  example: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
});
</script>

<style lang="scss" scoped>
.desc {
  padding: 0 20px;
  .example,
  .description {
    font-size: 12px;
  }
}
</style>
