<template>
  <div class="container">
    <div class="page1 page">
      <span class="h1"></span>
    </div>
    <div class="page2 page">
      <div class="box1 box"></div>
      <div class="box2 box"></div>
      <div class="box3 box"></div>
      <div class="box4 box"></div>
    </div>
    <div class="page3 page">
      <div class="content">
        <div class="main"></div>
        <div class="tips1 tips"></div>
        <div class="tips2 tips"></div>
        <div class="tips3 tips"></div>
        <div class="tips4 tips"></div>
        <div class="tips5 tips"></div>
      </div>
    </div>
    <div class="page4 page">
      <div class="text">
        <h2>TITLE</h2>
        <p>
          This page provides a comprehensive view of the GSAP ecosystem,
          outlining which features are part of GSAP's core, which files are
          hosted on the public CDN, and which are exclusively accessible to Club
          GSAP members. The Core contains everything you need to create
          blazingly fast, responsive animations for all browsers. Additional
          capabilities, like Dragging, Scroll Animation or Morphing are tucked
          away in plugins. This allows the core to remain relatively small and
          lets you add features only when you need them. Most usage is covered
          under our no-charge license, but you will need a commercial license in
          projects that you sell to multiple end users. More information on
          licensing here
        </p>
      </div>
      <img src="../../assets/demo1.jpg" alt="" />
    </div>
    <div class="page5 page">
      <div class="box1"></div>
      <div class="box2"></div>
      <div class="box3"></div>
      <div class="box4"></div>
    </div>
    <div class="page6 page">
      <div class="box1">我曾难自拔于世界之大</div>
      <div class="box2">也沉溺于其中梦话</div>
      <div class="box3">不得真假 不做挣扎 不惧笑话</div>
      <div class="box4">我曾将青春翻涌成她</div>
      <div class="box5">也曾指尖弹出盛夏</div>
      <div class="box6">心之所动 且就随缘去吧</div>
    </div>
    <div class="page7 page">
      <div class="airplane"></div>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "Scroll" };
</script>
<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
gsap.registerPlugin(ScrollTrigger, TextPlugin, MotionPathPlugin);

let tl = gsap.timeline();

const scroll = () => {
  tl.to(".page1 .h1", {
    duration: 5,
    y: 200,
    opacity: 0,
    scrollTrigger: {
      trigger: ".page1",
      start: "top top",
      end: "+=30%",
      scrub: true,
      pin: true,
      // markers: true,
    },
  });
  tl.to(".page2 div", {
    duration: 4,
    x: (index, el, list) => {
      return -(
        window.innerWidth / 2 -
        200 -
        index * (window.innerWidth / list.length)
      );
    },
    y: (index, el, list) => {
      return -200;
    },
    delay: (index, el, list) => {
      return index * 3;
    },
    backgroundColor: (index, el, list) => {
      return `hsl(${(index * 360) / list.length}, 100%, 50%)`;
    },
    scrollTrigger: {
      trigger: ".page2",
      start: "top top",
      end: "+=60%",
      scrub: 1,
      pin: true,
      // markers: true,
    },
  });
  tl.from(".page3 .tips", {
    duration: 3,
    delay: (index, el, list) => {
      return index * 4;
    },
    x: (index, el, list) => {
      if (index <= 2) {
        return "-10%";
      } else {
        return "10%";
      }
    },
    opacity: 0,
    scrollTrigger: {
      trigger: ".page3",
      start: "top top",
      end: "+=100%",
      scrub: 1,
      pin: true,
      // markers: true,
    },
  });
  tl.from(".page4 img", {
    duration: 3,
    clipPath: "inset(30% 30%)",
    filter: "blur(10px)",
    scrollTrigger: {
      trigger: ".page4",
      start: "top top",
      end: "+=50%",
      scrub: 1,
      pin: true,
      // markers: true,
    },
  }).from(".page4 .text", {
    duration: 3,
    color: "#000",
    scrollTrigger: {
      trigger: ".page4",
      start: "top top",
      end: "+=50%",
      scrub: 1,
    },
  });
  tl.to(".page5 div", {
    duration: 4,
    xPercent: -400, //横向滚动
    scrollTrigger: {
      trigger: ".page5",
      start: "top top",
      end: "+=50%",
      scrub: 1,
      pin: true,
      // markers: true,
    },
  });
  tl.from(".page6 div", {
    duration: 5,
    y: (index, el, list) => {
      return "-100%";
    },
    stagger: 2,
    keyframes: {
      "0%": { color: "#4c4c4c" },
      "20%": { color: "#aaa" },
      "40%": { color: "#ffffff" },
      "60%": { color: "#ffffff" },
      "80%": { color: "#aaa" },
      "100%": { color: "#4c4c4c" },
    },
    scrollTrigger: {
      trigger: ".page6",
      start: "top top",
      end: "+=100%",
      scrub: 1,
      pin: true,
      // markers: true,
    },
  });
  // 定义路径点
  const path = [
    { x: 0, y: 0 },
    { x: 200, y: 100 },
    { x: 400, y: 500 },
    { x: 600, y: 150 },
    { x: 800, y: 0 },
    { x: 1000, y: 200 },
    { x: 1200, y: 600 },
    { x: 1400, y: 50 },
    { x: 1600, y: 300 },
  ];
  tl.to(".page7 div", {
    duration: 4,
    ease: "power1.inOut",
    motionPath: {
      path: path,
      autoRotate: true, // 自动旋转以跟随路径方向
      alignOrigin: [0.5, 0.5], // 旋转中心
    },
    scrollTrigger: {
      trigger: ".page7", // 触发动画的容器
      start: "top top", // 动画开始的位置
      end: "+=50%", // 动画结束的位置
      scrub: 1, // 动画与滚动关联的程度（1 表示完全同步）
      pin: true,
      // markers: true, // 调试时显示标记（可选）
    },
  });
};

const page1 = () => {
  gsap.to(".h1", {
    duration: 2,
    text: {
      value: "hello world",
      padSpace: true,
      delimiter: "",
    },
  });
};

onMounted(() => {
  scroll();
  page1();
});
onBeforeUnmount(() => {
  ScrollTrigger.killAll();
});
</script>

<style lang="scss" scoped>
.container {
  overflow-x: hidden;
}
.page {
  width: 100%;
  min-height: 100vh;
}
.page1 {
  background-color: #1f1f1f;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 50px;
}
.page2 {
  background-color: #2f2f2f;
  color: #fff;
  position: relative;
  .box {
    width: 20%;
    height: 300px;
    background-color: #fff;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
.page3 {
  background-color: #474747;
  display: flex;
  justify-content: center;
  align-items: center;
  .content {
    width: 400px;
    height: 600px;
    position: relative;
    .main {
      width: 100%;
      height: 100%;
      background-color: #fff;
    }
    .tips1 {
      position: absolute;
      top: 0;
      left: -220px;
      width: 200px;
      height: 60px;
      background-color: #aaa;
    }
    .tips2 {
      position: absolute;
      top: 120px;
      left: -420px;
      width: 400px;
      height: 300px;
      background-color: #999;
    }
    .tips3 {
      position: absolute;
      bottom: 0;
      left: -200px;
      width: 180px;
      height: 100px;
      background-color: #888;
    }
    .tips4 {
      position: absolute;
      top: 0;
      right: -400px;
      width: 380px;
      height: 200px;
      background-color: #777;
    }
    .tips5 {
      position: absolute;
      bottom: 0;
      right: -300px;
      width: 280px;
      height: 300px;
      background-color: #666;
    }
  }
}
.page4 {
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  img {
    width: 100%;
    // clip-path: inset(30% 30%);
  }
  .text {
    position: absolute;
    color: #fff;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 30px;
    width: 1200px;
    z-index: 2;
    p {
      font-size: 16px;
    }
  }
}
.page5 {
  background-color: #353535;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  div {
    flex-shrink: 0;
    width: 600px;
    height: 400px;
    background-color: #868686;
    transform: translateX(120%);
    margin-right: 150px;
  }
}
.page6 {
  background-color: #3f3f3f;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #4c4c4c;
  font-size: 24px;
  div {
    margin-bottom: 20px;
  }
}
.page7 {
  background-color: #5f5f5f;
  position: relative;
  div {
    position: absolute;
    top: 0;
    left: 0;
    width: 50px;
    height: 50px;
    background-color: #fff;
  }
}
</style>
