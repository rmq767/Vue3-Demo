<template>
  <div class="grid-container">
    <div>1</div>
    <div>2</div>
    <div>3</div>
    <div>4</div>
    <div>5</div>
    <div>6</div>
  </div>
</template>

<script lang="ts">
export default { name: "" };
</script>
<script lang="ts" setup></script>

<style lang="scss" scoped>
.grid-container {
  display: grid;
  gap: 10px;
  width: 100%;
  height: 100%;
  grid-template-rows: repeat(3, 1fr);
  grid-template-columns: repeat(4, 1fr);
  grid-template-areas:
    "first first three six"
    "first first four six"
    "second second four five";
  div {
    background-color: #ccc;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
  }
  > div:nth-child(1) {
    grid-area: first;
  }
  > div:nth-child(2) {
    grid-area: second;
  }
  > div:nth-child(3) {
    grid-area: three;
  }
  > div:nth-child(4) {
    grid-area: four;
  }
  > div:nth-child(5) {
    grid-area: five;
  }
  > div:nth-child(6) {
    grid-area: six;
  }
}
</style>
