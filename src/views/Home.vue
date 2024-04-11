<template>
  <div class="common-layout">
    <swiper
      :modules="modules"
      :slides-per-view="1"
      :space-between="20"
      @swiper="onSwiper"
      @slideChange="onSlideChange"
      navigation
      :scrollbar="{ draggable: true }"
      :thumbs="{ swiper: thumbsSwiper }"
    >
      <swiper-slide>Slide 1</swiper-slide>
      <swiper-slide>Slide 2</swiper-slide>
      <swiper-slide>Slide 3</swiper-slide>
      <swiper-slide>Slide 3</swiper-slide>
      <swiper-slide>Slide 3</swiper-slide>
      <swiper-slide>Slide 3</swiper-slide>
      ...
    </swiper>
  </div>
</template>

<script lang="ts">
export default { name: "" };
</script>
<script lang="ts" setup>
import { Swiper, SwiperSlide } from "swiper/vue";
import { Navigation, Scrollbar, Thumbs } from "swiper/modules";
import "swiper/scss";

const onSwiper = (swiper: any) => {
  console.log(swiper);
};
const onSlideChange = () => {
  console.log("slide change");
};
const modules = [Navigation, Thumbs, Scrollbar];
</script>

<style lang="scss" scoped>
.swiper-slide {
  background: sandybrown;
  height: 50vh;
}
</style>
