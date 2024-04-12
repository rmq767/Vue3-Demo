<template>
  <div class="container">
    <canvas id="myCanvas" ref="canvasEl"></canvas>
  </div>
</template>

<script lang="ts">
export default { name: "Paper" };
</script>
<script lang="ts" setup>
import * as Paper from "paper";
import { onMounted, reactive } from "vue";
import Demo1 from "../../assets/demo1.jpg";
import { CanvasHandle, ItemHandle, usePaper } from "./";

let direction = "right";
const config = reactive({
  zoom: true,
  canvasHandle: "select" as CanvasHandle,
  itemHandle: ["select", "drag"] as ItemHandle,
  tooltips: () => {
    return "123";
  },
});
const { canvasEl, cursor, registerMouseEvent } = usePaper(config);

const drawAnimate = () => {
  const node = new Paper.Path.Circle({
    center: [200, 100],
    radius: 50,
  });
  node.strokeColor = new Paper.Color("black");
  node.fillColor = new Paper.Color("white");
  node.onFrame = () => {
    const maxWidth = document.body.clientWidth;
    if (direction === "right") {
      if (node.bounds.right >= maxWidth) {
        direction = "left";
      }
    } else {
      if (node.bounds.left <= 0) {
        direction = "right";
      }
    }
    if (direction === "right") {
      node.bounds.x += 5;
    } else {
      node.bounds.x -= 5;
    }
  };
};

const drawCircle = () => {
  const circle = new Paper.Path.Circle({
    center: [200, 100], //中心点
    radius: 50, //半径
    fillColor: new Paper.Color("red"), //填充颜色
    strokeColor: new Paper.Color("black"), //边框颜色
    cursor: "pointer",
  });
  circle.strokeWidth = 2;

  const pathData = "M 50 100 L 100 0 L 0 0 Z";
  const path = new Paper.Path(pathData);
  path.strokeColor = new Paper.Color("black");
  path.fillColor = new Paper.Color("green");
  path.strokeWidth = 2;
  path.strokeWidth = 2;
  path.position.set(400, 100);
};

const drawPointAndLine = () => {
  const point = new Paper.Point(500, 100); //点位置
  const path = new Paper.Path(); //需要path才能画出来
  // point.selected = true; //选中样式
  path.add(point); // 将点添加到路径中
  const copyPoint = point.clone(); // 克隆点
  copyPoint.set(600, 100); // 设置克隆点的位置
  path.add(copyPoint); // 将克隆点添加到路径中 2个点形成一条线
  path.strokeColor = new Paper.Color("black"); // 设置路径的边框颜色
  path.strokeWidth = 4;
};

const drawRectangle = () => {
  // 方式一
  const rect1 = new Paper.Path.Rectangle({
    center: [200, 400], //中心点
    size: [50, 100], //边长
    radius: [5, 5], //圆角
    fillColor: "orange",
    strokeColor: "black",
    strokeWidth: 4,
    rotation: 45, //旋转角度
  });
  // 方式二
  const topLeft = new Paper.Point(200, 20); //坐上角位置
  const rectSize = new Paper.Size(200, 200); //大小
  const rect2 = new Paper.Rectangle(topLeft, rectSize); //通过坐上角和大小创建矩形 还可以通过坐上角和右下角创建矩形等
  const radius = new Paper.Size(30, 30); //圆角
  const path = new Paper.Path.Rectangle(rect2, radius); //将矩形通过path画出来
  path.fillColor = new Paper.Color("blue");
  path.position.set({
    x: 300,
    y: 300,
  });
};

const drawImg = () => {
  const img = new Paper.Raster(Demo1);
  const rect2 = new Paper.Rectangle(img.bounds.topLeft, img.bounds.size); //通过坐上角和大小创建矩形 还可以通过坐上角和右下角创建矩形等
  const path = new Paper.Path.Rectangle(rect2);
  path.strokeColor = new Paper.Color("transparent");
  path.strokeWidth = 4;
  img.position.set(700, 600);
  img.scale(0.2);
  // addSelect(img);
};

const drawText = () => {
  const text = new Paper.PointText({
    position: [1600, 50], //文本位置
    fillColor: "black",
    justification: "center",
    fontSize: 20, //字体大小
    content: "下载",
    locked: false, //锁定
    name: "download",
    style: {
      cursor: "pointer",
    },
  });
};

const drawGroup = () => {
  const text = new Paper.PointText({
    position: [0, -50 - 10], //文本位置
    content: "圆",
    fillColor: "black",
    justification: "center",
    fontSize: 20, //字体大小
  });
  const circle = new Paper.Path.Circle({
    center: [0, 0], //中心点
    radius: 50, //半径
    fillColor: "red", //填充颜色
  });
  const group = new Paper.Group([text, circle]);
  // group.addChildren([text, circle]);
  group.position.set(1200, 800);
};

const drawCurve = () => {
  const group = new Paper.Group();
  const earth = new Paper.Path.Circle({
    center: [800, 200],
    radius: 50,
    fillColor: new Paper.Color("green"),
  });

  var firstPoint1 = calculatePointOnCircle(800, 200, 50, (Math.PI / 18) * 19);
  var secondPoint1 = calculatePointOnCircle(800, 200, 50, (Math.PI / 18) * 1);
  var handleOut1 = new Paper.Point(160, 60);
  var handleIn1 = new Paper.Point(-160, 20);
  var firstSegment = new Paper.Segment(firstPoint1, undefined, handleIn1);
  var secondSegment = new Paper.Segment(secondPoint1, handleOut1, undefined);
  const curve1 = new Paper.Path([firstSegment, secondSegment]);
  curve1.strokeColor = new Paper.Color("black");
  curve1.strokeWidth = 8;
  curve1.locked = true;
  curve1.selected = false;
  curve1.style.strokeCap = "round"; //圆角

  group.addChildren([earth, curve1]);
};

const drawAnimateLine = () => {
  const line = new Paper.Path.Line({
    from: [1200, 200],
    to: [1200, 600],
    strokeColor: new Paper.Color("red"),
    strokeWidth: 8,
  });
  line.style.dashArray = [10, 10];
  line.onFrame = () => {
    line.style.dashOffset -= 1;
    if (line.style.dashOffset <= 0) {
      line.style.dashOffset = 100;
    }
  };
};

const drawArc = () => {
  const group = new Paper.Group();
  const arc = new Paper.Path.Arc({
    from: [0, 50],
    through: [50, 0],
    to: [50, 100],
    strokeColor: "black",
    fillColor: "red",
    strokeWidth: 4,
  });

  const pathData = "M 50 50 L 50 101 L -1 50 Z";
  const path = new Paper.Path(pathData);
  path.fillColor = new Paper.Color("white");
  path.strokeWidth = 0;
  group.addChildren([arc, path]);
};

const calculatePointOnCircle = (
  centerX: number,
  centerY: number,
  radius: number,
  angle: number
) => {
  var x = centerX + radius * Math.cos(angle);
  var y = centerY + radius * Math.sin(angle);
  return new Paper.Point(x, y);
};

onMounted(() => {
  drawCircle();
  drawPointAndLine();
  drawRectangle();
  drawImg();
  drawText();
  drawGroup();
  drawAnimateLine();
  drawAnimate();
  drawArc();
  setTimeout(() => {
    drawCurve(); //注册事件之后画出来 不会响应事件
    // registerMouseEvent(); //需要重新注册一下事件
  }, 3000);
});
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  height: 100%;
  position: relative;
  #myCanvas {
    width: 100%;
    height: 100%;
    cursor: v-bind(cursor);
  }
  .control {
    div {
      position: absolute;
      width: 10px;
      height: 10px;
      background-color: #fff;
      border: 1px solid blue;
    }
    .top-left {
      cursor: nw-resize;
    }
    .top-right {
      cursor: ne-resize;
    }
    .bottom-left {
      cursor: sw-resize;
    }
    .bottom-right {
      cursor: se-resize;
    }
  }
}
</style>
