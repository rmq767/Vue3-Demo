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
      <div class="text">TITLE</div>
      <img src="../../assets/demo1.jpg" alt="" />
    </div>
    <div class="page5 page">
      <div class="box1"></div>
      <div class="box2"></div>
      <div class="box3"></div>
      <div class="box4"></div>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "Scroll" };
</script>
<script lang="ts" setup>
import { onMounted } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
gsap.registerPlugin(ScrollTrigger, TextPlugin);

let tl = gsap.timeline();

const scroll = () => {
  tl.to(".page1 .h1", {
    duration: 5,
    y: 200,
    opacity: 0,
    scrollTrigger: {
      trigger: ".page1",
      start: "top top",
      end: "bottom-=10% center+=20%",
      scrub: true,
      pin: true,
    },
  });
  tl.to(".page2 div", {
    duration: 3,
    x: (index, el, list) => {
      return -(window.innerWidth / 2 - index * 200 - 200);
    },
    delay: (index, el, list) => {
      return index * 2;
    },
    scrollTrigger: {
      trigger: ".page2",
      start: "top top",
      end: "bottom-=10% center-=20%",
      scrub: 1,
      pin: true,
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
      end: "bottom+=50% center-=20%",
      scrub: 1,
      pin: true,
    },
  });
  tl.from(".page4 img", {
    duration: 3,
    clipPath: "inset(30% 30%)",
    filter: "blur(10px)",
    scrollTrigger: {
      trigger: ".page4",
      start: "top top",
      end: "bottom+=50% center-=20%",
      scrub: 1,
      pin: true,
    },
  });
  tl.to(".page5 div", {
    duration: 3,
    x: () => {
      return -window.innerWidth;
    },
    scrollTrigger: {
      trigger: ".page5",
      start: "top top",
      end: "bottom+=50% top+=20%",
      scrub: 1,
      pin: true,
      // markers: true,
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
    width: 100px;
    height: 100px;
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
    color: #000;
    top: 100px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 50px;
    z-index: 2;
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
</style>
