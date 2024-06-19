<template>
  <div class="inner">
    <div class="outer" @mousedown="moveCamera('top')" @mouseup="clear">
      <el-icon>
        <CaretTop />
      </el-icon>
    </div>
    <div class="outer" @mousedown="moveCamera('right')" @mouseup="clear">
      <el-icon>
        <BottomRight />
      </el-icon>
    </div>
    <div class="outer" @mousedown="moveCamera('bottom')" @mouseup="clear">
      <el-icon>
        <CaretBottom />
      </el-icon>
    </div>
    <div class="outer" @mousedown="moveCamera('left')" @mouseup="clear">
      <el-icon>
        <BottomLeft />
      </el-icon>
    </div>
    <div class="inner-circle"></div>
  </div>
</template>

<script lang="ts" setup name="CameraControl">
import {
  CaretTop,
  CaretBottom,
  BottomRight,
  BottomLeft,
} from "@element-plus/icons-vue";
const emits = defineEmits(["moveCamera", "mouse-down", "mouse-up"]);
let timer: any = null; // 定义一个定时器变量
const moveCamera = (type: string) => {
  // 实现相机移动的逻辑
  emits("mouse-down");
  timer = setInterval(() => {
    emits("moveCamera", type); // 每100毫秒触发一次相机移动事件，实现连续移动的效果。
  }, 10);
};
const clear = () => {
  clearInterval(timer); // 清除定时器，停止连续移动。
  emits("mouse-up"); // 触发鼠标松开事件，停止移动。
};
</script>

<style lang="scss" scoped>
.inner {
  width: 20px; /* 设置外层div的宽度 */
  height: 20px; /* 设置外层div的高度 */
  border-radius: 50%;
  background-color: #fff;
  .outer {
    cursor: pointer;
    color: #fff;
    &:hover {
      color: var(--el-color-primary);
    }
    &:nth-of-type(1) {
      position: absolute;
      transform: translateY(-80%) rotateZ(45deg); /* 设置外层div的旋转角度 */
      background-color: rgba(27, 27, 27, 0.8);
      width: 100%;
      height: 100%;
      clip-path: circle(100% at 100% 100%);
      .el-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        font-size: 16px;
        transform: translate(-50%, -50%) rotateZ(-45deg);
      }
    }
    &:nth-of-type(2) {
      position: absolute;
      transform: translateX(80%) rotateZ(45deg); /* 设置外层div的旋转角度 */
      background-color: rgba(27, 27, 27, 0.8);
      width: 100%;
      height: 100%;
      clip-path: circle(100% at 0% 100%);
      .el-icon,
      .right {
        position: absolute;
        top: 50%;
        left: 50%;
        font-size: 16px;
        transform: translate(-50%, -50%) rotateZ(-135deg);
      }
    }
    &:nth-of-type(3) {
      position: absolute;
      transform: translateY(80%) rotateZ(45deg); /* 设置外层div的旋转角度 */
      background-color: rgba(27, 27, 27, 0.8);
      width: 100%;
      height: 100%;
      clip-path: circle(100% at 0% 0%);
      .el-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        font-size: 16px;
        transform: translate(-50%, -50%) rotateZ(-45deg);
      }
    }
    &:nth-of-type(4) {
      position: absolute;
      transform: translateX(-80%) rotateZ(45deg); /* 设置外层div的旋转角度 */
      background-color: rgba(27, 27, 27, 0.8);
      width: 100%;
      height: 100%;
      clip-path: circle(100% at 100% 0%);
      .el-icon,
      .left {
        position: absolute;
        top: 50%;
        left: 50%;
        font-size: 16px;
        transform: translate(-50%, -50%) rotateZ(-135deg);
      }
    }
  }
  .inner-circle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%); /* 设置内层div的位置 */
    width: 100%; /* 设置内层div的宽度 */
    height: 100%; /* 设置内层div的高度 */
    background-color: rgba(27, 27, 27, 0.8); /* 设置内层div的背景颜色 */
    border-radius: 50%;
    z-index: 2; /* 设置内层div的层级 */
  }
}
</style>
