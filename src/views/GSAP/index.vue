<template>
  <div class="c1">
    <div class="box1 box"></div>
    <div class="box2 box"></div>
  </div>
  <div class="c2">
    <div class="box3 box"></div>
    <div class="box4 box"></div>
    <div class="box5 box"></div>
  </div>
  <div class="c3">
    <div class="box6 box"></div>
    <div class="box7 box"></div>
    <div class="box8 box"></div>
    <div class="box9 box"></div>
  </div>
  <div class="c4">
    <div class="box10 box"></div>
    <div class="bbox">
      <div class="box11 box"></div>
    </div>
  </div>
  <div class="c5">
    <div class="box12 box"></div>
    <div class="box13 box"></div>
    <div class="box14 box"></div>

    <div class="box15 box"></div>
    <div class="box16 box"></div>
    <div class="box17 box"></div>

    <div class="box18 box"></div>
    <div class="box19 box"></div>
    <div class="box20 box"></div>
  </div>
</template>

<script lang="ts">
export default { name: "GSAP" };
</script>
<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
// import { PixiPlugin } from "gsap/PixiPlugin";

gsap.registerPlugin(ScrollTrigger);

const c1 = () => {
  gsap.fromTo(
    ".box1",
    { x: 0 },
    { x: 500, repeat: 2, yoyo: true, duration: 2, delay: 1, ease: "none" }
  );
  gsap.fromTo(
    ".box2",
    { x: 0 },
    {
      x: () => window.innerWidth / 2,
      repeat: -1,
      yoyo: true,
      duration: 2,
      repeatDelay: 1,
      rotation: 90,
      ease: "bounce.out",
    }
  );
};

const c2 = () => {
  gsap.to(".c2 div", {
    y: -200,
    opacity: 0,
    stagger: 0.1,
    duration: 1,
    ease: "back.in",
  });
};

const c3 = () => {
  // 创建一个动画 timeline，重复 -1 次
  const t1 = gsap.timeline({
    repeat: -1,
    defaults: {
      duration: 1,
      ease: "power1.inOut",
    },
  });
  t1.to(".box6", { x: 200 });
  t1.fromTo(".box7", { x: 200 }, { x: 400 }, 2);
  t1.fromTo(".box8", { x: 400 }, { x: 600 }, "<3");
  t1.fromTo(".box9", { x: 600 }, { x: 800 }, "+=2");
};

const c4 = () => {
  gsap.to(".box10", {
    rotation: 360,
    scale: 1.5,
    backgroundColor: "green",
    scrollTrigger: {
      trigger: ".box10",
      scrub: true,
    },
  });
  gsap.to(".box11", {
    x: 1400,
    scrollTrigger: {
      trigger: ".bbox",
      scrub: 1,
      markers: true,
      start: "top center-=20%",
      end: "bottom center-=100px",
      pin: true,
    },
  });
};

const c5 = () => {
  gsap.to(".c5 .box", {
    duration: 1,
    scale: 0.1,
    y: 40,
    ease: "power1.inOut",
    repeat: -1,
    yoyo: true,
    stagger: {
      grid: [3, 3],
      from: "center", //从何处开始扩散延迟动画 center\end\edges\random\l1\[index]直接选取第index元素开始向外扩散交替
      axis: undefined, //动画轴，null(both)\x\y
      ease: "power2.in",
      amount: 0.5, //运行完成交替中的所有元素动画的所有总时间
    },
  });
};

onMounted(() => {
  c1();
  c2();
  c3();
  c4();
  c5();
});
onBeforeUnmount(() => {
  ScrollTrigger.killAll();
});
</script>

<style lang="scss" scoped>
.box {
  width: 100px;
  height: 100px;
  background-color: red;
}
.c2 {
  display: flex;
  justify-content: center;
  .box {
    margin: 20px;
  }
}
.c4 {
  .bbox {
    width: 100%;
    height: 50%;
    background-color: #ccc;
  }
  height: 100vh;
}
.c5 {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  width: 500px;
  margin: 0 auto;
  .box {
    margin: 20px;
  }
}
</style>
