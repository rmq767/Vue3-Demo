import { CesiumData } from "@/types/gis";
import { Leafer, Rect, Polygon } from "leafer-ui";
import { Ref, ShallowRef } from "vue";

const WELL_WIDTH = 20; //井的宽度
let CANVAS_WIDTH = 0; //画布宽度 用来计算每个地层的宽度
let CANVAS_HEIGHT = 0; //画布高度 用来计算每个地层的高度
let wStep = 0; //每个单位的宽度
let hStep = 0; //每个单位的高度
let gap = 0.2; //间隔 用于隐藏高度之间的空白

/**
 * @description 获取所有数据中最长的井长度
 * @param {CesiumData[]} data
 * @return {*}
 */
const getHLength = (data: CesiumData[]) => {
  let max = 0;
  data.forEach((item) => {
    max = Math.max(max, item.length!);
  });
  return max;
};

/**
 * @description 获取配置项，用来计算每个地层的宽高，等比展示
 * @param {(ShallowRef<Leafer | undefined>)} leafer
 * @param {ShallowRef<CesiumData[]>} data
 */
export const setConfig = (
  leafer: ShallowRef<Leafer | undefined>,
  data: ShallowRef<CesiumData[]>,
  lineLength: Ref<number>
) => {
  CANVAS_WIDTH = leafer.value?.width!;
  CANVAS_HEIGHT = leafer.value?.height!;
  // 宽度
  const wLength = Number(lineLength.value.toFixed(4));
  // 除去开始结束地层和每个井之后 每个单位的宽度
  wStep = Number(
    ((CANVAS_WIDTH - WELL_WIDTH * data.value.length) / wLength).toFixed(2)
  );
  // 高度
  const hLength = getHLength(data.value);
  // 每个单位的高度
  hStep = Number((CANVAS_HEIGHT / hLength).toFixed(4));
};

/**
 * @description 绘制井
 * @param {CesiumData} ele
 * @param {number} index
 * @return {*}
 */
export const drawWell = (ele: CesiumData, index: number) => {
  const { distance, length } = ele;
  const rect = new Rect({
    x: distance! * wStep + WELL_WIDTH * index, //开始地层+每个井的宽度+每个井的间隔
    y: 0,
    width: WELL_WIDTH,
    height: length! * hStep,
    fill: "#90caf9",
  });
  return rect;
};

/**
 * @description 绘制左边地层
 * @param {CesiumData} ele
 * @return {*}
 */
export const drawLeft = (ele: CesiumData) => {
  const { info, distance } = ele;
  const polygonArr = [];
  for (let i = 0; i < info.length; i++) {
    const element = info[i];
    const polygon = new Polygon({
      fill: `#${i}b${i}04${i}`,
      points: [
        0,
        element.start * hStep - gap,
        distance! * wStep,
        element.start * hStep - gap,
        distance! * wStep,
        element.end * hStep + gap,
        0,
        element.end * hStep + gap,
      ],
    });
    polygonArr.push(polygon);
  }
  return polygonArr;
};

/**
 * @description 绘制右边地层
 * @param {CesiumData} ele
 * @param {number} index
 * @return {*}
 */
export const drawRight = (ele: CesiumData, index: number) => {
  const { distance, info, length } = ele;
  const polygonArr = [];
  for (let i = 0; i < info.length; i++) {
    const element = info[i];
    const polygon = new Polygon({
      fill: `#${i}b${i}04${i}`,
      points: [
        distance! * wStep + WELL_WIDTH * (index + 1),
        element.start * hStep - gap,
        CANVAS_WIDTH,
        element.start * hStep - gap,
        CANVAS_WIDTH,
        element.end * hStep + gap,
        distance! * wStep + WELL_WIDTH * (index + 1),
        element.end * hStep + gap,
      ],
    });
    polygonArr.push(polygon);
  }
  return polygonArr;
};

/**
 * @description 绘制连接地层
 * @param {CesiumData} previous
 * @param {number} preIndex
 * @param {CesiumData} current
 * @param {number} index
 */
export const drawLink = (
  previous: CesiumData,
  preIndex: number,
  current: CesiumData,
  index: number
) => {
  const { distance: preDistance, length: preLength, info: preInfo } = previous;
  const { distance: curDistance, length: curLength, info: curInfo } = current;
  // 开始x位置
  const x = preDistance! * wStep + WELL_WIDTH * (preIndex + 1);
  // 地层宽度
  const w = curDistance! * wStep + WELL_WIDTH * (index + 1) - x - WELL_WIDTH;
  const polygonArr = [];
  for (let i = 0; i < preInfo.length; i++) {
    const element = preInfo[i];
    for (let j = 0; j < curInfo.length; j++) {
      const element2 = curInfo[j];
      if (element.type === element2.type) {
        const polygon = new Polygon({
          fill: `#${i}b${i}04${i}`,
          points: [
            x,
            element.start * hStep - gap,
            x + w,
            element2.start * hStep - gap,
            x + w,
            element2.end * hStep + gap,
            x,
            element.end * hStep + gap,
          ],
        });
        polygonArr.push(polygon);
      }
      continue;
    }
  }
  // 没有连接地层展示斑马线
  const bg = new Polygon({
    fill: {
      type: "linear",
      from: "top-left",
      to: "bottom-right",
      stops: [
        { offset: 0, color: "#fff" },
        { offset: 0.03, color: "#fff" },
        { offset: 0.03, color: "#000" },
        { offset: 0.04, color: "#000" },
        { offset: 0.04, color: "#fff" },
        { offset: 0.07, color: "#fff" },
        { offset: 0.07, color: "#000" },
        { offset: 0.08, color: "#000" },
        { offset: 0.08, color: "#fff" },
        { offset: 0.11, color: "#fff" },
        { offset: 0.11, color: "#000" },
        { offset: 0.12, color: "#000" },
        { offset: 0.12, color: "#fff" },
        { offset: 0.15, color: "#fff" },
        { offset: 0.15, color: "#000" },
        { offset: 0.16, color: "#000" },
        { offset: 0.16, color: "#fff" },
        { offset: 0.19, color: "#fff" },
        { offset: 0.19, color: "#000" },
        { offset: 0.2, color: "#000" },
        { offset: 0.2, color: "#fff" },
        { offset: 0.23, color: "#fff" },
        { offset: 0.23, color: "#000" },
        { offset: 0.24, color: "#000" },
        { offset: 0.24, color: "#fff" },
        { offset: 0.27, color: "#fff" },
        { offset: 0.27, color: "#000" },
        { offset: 0.28, color: "#000" },
        { offset: 0.28, color: "#fff" },
        { offset: 0.31, color: "#fff" },
        { offset: 0.31, color: "#000" },
        { offset: 0.32, color: "#000" },
        { offset: 0.32, color: "#fff" },
        { offset: 0.35, color: "#fff" },
        { offset: 0.35, color: "#000" },
        { offset: 0.36, color: "#000" },
        { offset: 0.36, color: "#fff" },
        { offset: 0.39, color: "#fff" },
        { offset: 0.39, color: "#000" },
        { offset: 0.4, color: "#000" },
        { offset: 0.4, color: "#fff" },
        { offset: 0.43, color: "#fff" },
        { offset: 0.43, color: "#000" },
        { offset: 0.44, color: "#000" },
        { offset: 0.44, color: "#fff" },
        { offset: 0.47, color: "#fff" },
        { offset: 0.47, color: "#000" },
        { offset: 0.48, color: "#000" },
        { offset: 0.48, color: "#fff" },
        { offset: 0.51, color: "#fff" },
        { offset: 0.51, color: "#000" },
        { offset: 0.52, color: "#000" },
        { offset: 0.52, color: "#fff" },
        { offset: 0.55, color: "#fff" },
        { offset: 0.55, color: "#000" },
        { offset: 0.56, color: "#000" },
        { offset: 0.56, color: "#fff" },
        { offset: 0.59, color: "#fff" },
        { offset: 0.59, color: "#000" },
        { offset: 0.6, color: "#000" },
        { offset: 0.6, color: "#fff" },
        { offset: 0.63, color: "#fff" },
        { offset: 0.63, color: "#000" },
        { offset: 0.64, color: "#000" },
        { offset: 0.64, color: "#fff" },
        { offset: 0.67, color: "#fff" },
        { offset: 0.67, color: "#000" },
        { offset: 0.68, color: "#000" },
        { offset: 0.68, color: "#fff" },
        { offset: 0.71, color: "#fff" },
        { offset: 0.71, color: "#000" },
        { offset: 0.72, color: "#000" },
        { offset: 0.72, color: "#fff" },
        { offset: 0.75, color: "#fff" },
        { offset: 0.75, color: "#000" },
        { offset: 0.76, color: "#000" },
        { offset: 0.76, color: "#fff" },
        { offset: 0.79, color: "#fff" },
        { offset: 0.79, color: "#000" },
        { offset: 0.8, color: "#000" },
        { offset: 0.8, color: "#fff" },
        { offset: 0.83, color: "#fff" },
        { offset: 0.83, color: "#000" },
        { offset: 0.84, color: "#000" },
        { offset: 0.84, color: "#fff" },
        { offset: 0.87, color: "#fff" },
        { offset: 0.87, color: "#000" },
        { offset: 0.88, color: "#000" },
        { offset: 0.88, color: "#fff" },
        { offset: 0.91, color: "#fff" },
        { offset: 0.91, color: "#000" },
        { offset: 0.92, color: "#000" },
        { offset: 0.92, color: "#fff" },
        { offset: 0.95, color: "#fff" },
        { offset: 0.95, color: "#000" },
        { offset: 0.96, color: "#000" },
        { offset: 0.96, color: "#fff" },
        { offset: 0.99, color: "#fff" },
        { offset: 1, color: "#fff" },
      ],
    },
    points: [
      x,
      preInfo[0].start * hStep,
      x + w,
      curInfo[0].start * hStep,
      x + w,
      curInfo[curInfo.length - 1].end * hStep,
      x,
      preInfo[preInfo.length - 1].end * hStep,
    ],
  });
  return {
    bg,
    polygonArr,
  };
};
