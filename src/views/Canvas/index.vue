<template>
  <canvas id="canvas"></canvas>
</template>

<script lang="ts">
export default { name: "Canvas" };
</script>
<script lang="ts" setup>
import { onMounted } from "vue";
import demo1 from "../../assets/demo1.jpg";

let canvasEl: HTMLCanvasElement, context: CanvasRenderingContext2D;
const initCanvas = () => {
  canvasEl = document.getElementById("canvas") as HTMLCanvasElement;
  context = canvasEl.getContext("2d")!;
  canvasEl.width = window.innerWidth;
  canvasEl.height = window.innerHeight;
};

const drawRect = () => {
  context.fillRect(100, 100, 100, 100);
  context.clearRect(120, 120, 60, 60);
  context.strokeRect(140, 140, 20, 20);
};

const drawLine = () => {
  context.beginPath();
  context.moveTo(200, 100);
  context.lineTo(300, 100);
  context.lineTo(250, 200);
  // context.fill(); // 当你调用 fill() 函数时，所有没有闭合的形状都会自动闭合，所以你不需要调用 closePath() 函数。但是调用 stroke() 时不会自动闭合。
  context.closePath(); //就是闭合路径 closePath(),不是必需的。这个方法会通过绘制一条从当前点到开始点的直线来闭合图形。如果图形是已经闭合了的，即当前点为开始点，该函数什么也不做。
  context.stroke(); //如果没有添加闭合路径closePath()到描边三角形函数中，则只绘制了两条线段，并不是一个完整的三角形。
};

const drawArc = () => {
  //arc(x, y, radius, startAngle, endAngle, anticlockwise) 画一个以（x,y）为圆心的以 radius 为半径的圆弧（圆），从 startAngle 开始到 endAngle 结束，按照 anticlockwise 给定的方向（默认为顺时针）来生成。
  context.beginPath();
  context.arc(350, 150, 50, 0, Math.PI, true);
  context.fill();
  context.closePath();
};

const drawQuadraticCurveTo = () => {
  //绘制二次贝塞尔曲线 quadraticCurveTo(cp1x, cp1y, x, y) 绘制二次贝塞尔曲线，cp1x,cp1y 为一个控制点，x,y 为结束点。
  context.beginPath();
  context.moveTo(400, 100);

  context.setLineDash([5, 5]);
  context.lineTo(500, 150);

  context.moveTo(480, 100);
  context.lineTo(500, 150);

  context.fillStyle = "red";
  context.fillRect(500, 150, 10, 10);
  context.closePath();
  context.stroke();

  context.beginPath();
  context.moveTo(400, 100);
  context.setLineDash([]);
  context.quadraticCurveTo(500, 150, 480, 100);
  context.stroke();
  context.closePath();
};

const drawBezierCurveTo = () => {
  //bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) 绘制三次贝塞尔曲线，cp1x,cp1y为控制点一，cp2x,cp2y为控制点二，x,y为结束点。
  context.beginPath();

  context.moveTo(500, 100);
  context.setLineDash([5, 5]);
  context.lineTo(540, 150);
  context.fillStyle = "red";
  context.fillRect(540, 150, 10, 10);
  context.stroke();
  context.closePath();

  context.beginPath();
  context.moveTo(600, 100);
  context.lineTo(580, 180);
  context.fillRect(580, 180, 10, 10);
  context.stroke();
  context.closePath();

  context.beginPath();
  context.moveTo(500, 100);
  context.setLineDash([]);
  context.bezierCurveTo(540, 150, 580, 180, 600, 100);
  context.stroke();
  context.closePath();
};

const drawLinearGradient = () => {
  //createLinearGradient(x1, y1, x2, y2) createLinearGradient 方法接受 4 个参数，表示渐变的起点 (x1,y1) 与终点 (x2,y2)。
  const linearGradient = context.createLinearGradient(0, 100, 0, 300);
  linearGradient.addColorStop(0, "red");
  linearGradient.addColorStop(0.5, "white");
  linearGradient.addColorStop(0.5, "blue");
  linearGradient.addColorStop(1, "white");
  context.fillStyle = linearGradient;
  context.fillRect(600, 100, 200, 200);
};

const drawRadialGradient = () => {
  //createRadialGradient(x1, y1, r1, x2, y2, r2) createRadialGradient 方法接受 6 个参数，前三个定义一个以 (x1,y1) 为原点，半径为 r1 的圆，后三个参数则定义另一个以 (x2,y2) 为原点，半径为 r2 的圆。
  const radialGradient = context.createRadialGradient(
    880,
    160,
    10,
    850,
    150,
    50
  );
  radialGradient.addColorStop(0, "#A7D30C");
  radialGradient.addColorStop(0.9, "#019F62");
  radialGradient.addColorStop(1, "rgba(1,159,98,0)");
  context.fillStyle = radialGradient;
  context.fillRect(800, 100, 100, 100);
};

const drawImgBg = () => {
  const img = new Image();
  img.src = demo1;
  img.onload = () => {
    const ptrn = context.createPattern(img, "repeat");
    if (ptrn) {
      img.width = 100;
      img.height = 100;
      img.style.objectFit = "cover";
      context.fillStyle = ptrn;
      context.fillRect(900, 100, 500, 500);
    }
  };
};

const drawText = () => {
  //fillText(text, x, y [, maxWidth])
  context.shadowOffsetX = 2;
  context.shadowOffsetY = 2;
  context.shadowBlur = 2;
  context.shadowColor = "rgba(0, 0, 0, 0.5)";

  context.font = "20px Times New Roman";
  context.fillStyle = "Black";
  context.fillText("Sample String", 100, 300);
};

onMounted(() => {
  initCanvas();
  drawRect();
  drawLine();
  drawArc();
  drawQuadraticCurveTo();
  drawBezierCurveTo();
  drawLinearGradient();
  drawRadialGradient();
  drawImgBg();
  drawText();
});
</script>

<style lang="scss" scoped>
// #canvas {
//   width: 100%;
//   height: 100%;
// }
</style>
