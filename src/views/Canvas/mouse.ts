import { onMounted, onUnmounted, ref } from "vue";

export const useMouseAnimate = () => {
  const canvasRef = ref<HTMLCanvasElement>();
  const ctx = ref<CanvasRenderingContext2D | null>(null);
  let balls: Array<{
    x: number;
    y: number;
    opacity: number;
    raduis: number;
    randomColor1: number;
    randomColor2: number;
    randomColor3: number;
  }> = [];

  /**
   * @description 初始化canvas
   */
  const initCanvas = () => {
    const canvasEl = document.createElement("canvas");
    canvasRef.value = canvasEl;
    document.body.appendChild(canvasRef.value!);
    canvasEl.style.position = "fixed";
    canvasEl.style.top = "0";
    canvasEl.style.left = "0";
    canvasEl.style.zIndex = "9999";
    canvasEl.style.pointerEvents = "none";
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
    ctx.value = canvasEl.getContext("2d");
    if (!ctx) return;
    window.addEventListener("mousemove", initBall, true);
    requestAnimationFrame(animte);
  };
  let count = 0;
  const initBall = (event: MouseEvent) => {
    count++;
    // 避免创建太多小球
    if (count >= 3) {
      const x = event.clientX;
      const y = event.clientY;
      const random = (Math.random() + 1) * 6; //随机球的半径
      const randomColor1 = Math.floor(Math.random() * 255); //随机球的颜色
      const randomColor2 = Math.floor(Math.random() * 255); //随机球的颜色
      const randomColor3 = Math.floor(Math.random() * 255); //随机球的颜色
      balls.push({
        x,
        y,
        opacity: 1,
        raduis: random,
        randomColor1,
        randomColor2,
        randomColor3,
      });
      count = 0;
    }
  };

  const animte = () => {
    // 每一帧 将所有小球重新画出来
    ctx.value!.clearRect(0, 0, canvasRef.value!.width, canvasRef.value!.height);
    balls.forEach((ball) => {
      // 小球透明度递减
      ball.opacity -= 0.01;
      // y轴递减
      ball.y += 0.5;
      ctx.value!.beginPath();
      ctx.value!.arc(ball.x, ball.y, ball.raduis, 0, Math.PI * 2);
      ctx.value!.fillStyle = `rgba(${ball.randomColor1},${ball.randomColor2},${ball.randomColor3},${ball.opacity})`;
      ctx.value!.fill();
      // 透明度为0删除
      if (ball.opacity <= 0) {
        balls.shift();
      }
    });
    requestAnimationFrame(animte);
  };
  onMounted(() => {
    initCanvas();
  });
  onUnmounted(() => {
    window.removeEventListener("mousemove", initBall, true);
  });
};
