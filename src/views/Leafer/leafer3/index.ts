import { CesiumData } from "@/types/gis";
import { Leafer, Image, Line, Group, Rect, Text } from "leafer-ui";
import { ShallowRef } from "vue";
import WellImage from "@/assets/well.png";

const WELL_WIDTH = 30; //井的宽度
const SHOW_COUNT = 3; //显示的井的数量
const LEFT_GAP = 200;
const TOP_GAP = 200;
const RIGHT_GAP = 200;
const BOTTOM_GAP = 100;
const IMAGE_WIDTH = 100;
const WELL_GAP = 50;
const PIPE_WIDTH = 15;
let CANVAS_WIDTH = 0; //画布宽度 用来计算每个地层的宽度
let CANVAS_HEIGHT = 0; //画布高度 用来计算每个地层的高度
let hStep = 0; //每个单位的高度
let countWidth = 0;

/**
 * @description 获取所有数据中最长的井长度
 * @param {CesiumData[]} data
 * @return {*}
 */
const getMaxY = (data: CesiumData[]) => {
  let yMax = 0;
  data.forEach((item) => {
    yMax = Math.max(yMax, item.distance!);
  });
  return { y: yMax };
};

/**
 * @description 获取配置项，用来计算每个地层的宽高，等比展示
 * @param {(ShallowRef<Leafer | undefined>)} leafer
 * @param {ShallowRef<CesiumData[]>} data
 */
export const setConfig = (
  leafer: ShallowRef<Leafer | undefined>,
  data: CesiumData[]
) => {
  CANVAS_WIDTH = leafer.value?.width!;
  CANVAS_HEIGHT = leafer.value?.height!;
  const { y } = getMaxY(data);
  countWidth = (CANVAS_WIDTH - RIGHT_GAP - LEFT_GAP) / SHOW_COUNT;
  // 每个单位的高度
  hStep = Number(((CANVAS_HEIGHT - TOP_GAP - BOTTOM_GAP) / y).toFixed(2));
};

/**
 * @description 绘制井
 * @param {CesiumData} ele
 * @param {number} index
 * @return {*}
 */
export const drawWell = (ele: CesiumData, index: number, length: number) => {
  const sizeArr = handleInfoData(ele, index);
  // 画井轨迹
  const wellGroup = drawWellAsSize(sizeArr, ele.maxSize!, ele.minSize!);
  const imageGroup = new Group({
    x: LEFT_GAP + index * countWidth - IMAGE_WIDTH / 2,
    y: TOP_GAP - IMAGE_WIDTH,
  });
  // 画井图
  const image = new Image({
    url: WellImage,
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH,
    x: 0,
    y: 8,
  });
  // 画名字
  const name = new Text({
    text: ele.name,
    textAlign: "center",
    x: 0,
    y: -8,
    width: IMAGE_WIDTH,
    fill: "green",
  });
  imageGroup.add([image, name]);
  return { well: wellGroup, imageGroup };
};

export const drawBackground = () => {
  const group = new Group({
    x: 0,
    y: TOP_GAP,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT - TOP_GAP,
  });
  const rectArr = [];
  for (let i = 0; i < 10; i++) {
    const rect = new Rect({
      x: 0,
      y: ((CANVAS_HEIGHT - TOP_GAP) / 10) * i,
      width: CANVAS_WIDTH,
      height: (CANVAS_HEIGHT - TOP_GAP) / 10,
      fill: `#${i}b${i}04${i}`,
    });
    rectArr.push(rect);
  }
  group.add(rectArr);
  return group;
};

export const drawTopBackground = () => {
  const rect = new Rect({
    x: 0,
    y: 0,
    width: CANVAS_WIDTH,
    height: TOP_GAP,
    fill: {
      type: "linear",
      stops: ["#6BA37B", "#ffffff", "#789FF1"],
    },
  });
  return rect;
};

const drawWellAsSize = (data: any, maxSize: number, minSize: number) => {
  const group = new Group({
    x: 0,
    y: 0,
  });
  const wellWidthStep = WELL_WIDTH / minSize;
  const keys = Object.keys(data).sort((a, b) => Number(a) - Number(b));
  let lastWidth = wellWidthStep * Number(keys[0]);
  keys.forEach((key, index) => {
    // 先画灰的
    const well = new Line({
      points: data[key],
      strokeWidth: lastWidth,
      stroke: "#666",
      cornerRadius: lastWidth,
      strokeCap: "none",
      strokeJoin: "round",
    });
    group.add(well);
    lastWidth = lastWidth + PIPE_WIDTH;
  });
  lastWidth = wellWidthStep * Number(keys[0]);
  keys.forEach((key, index) => {
    // 在画白的 解决灰线问题
    const well = new Line({
      points: data[key],
      strokeWidth: lastWidth - PIPE_WIDTH,
      stroke: "#fff",
      cornerRadius: lastWidth - PIPE_WIDTH,
      strokeCap: "none",
      strokeJoin: "round",
    });
    group.add(well);
    lastWidth = lastWidth + PIPE_WIDTH;
  });
  return group;
};

/**
 * @description 收集处理每一段相同size的井数据
 * @param {CesiumData} ele
 * @param {number} index
 */
const handleInfoData = (ele: CesiumData, index: number) => {
  const { info } = ele;
  const wStep = (countWidth - WELL_GAP) / ele.length!;
  const sizeArr = {} as any;
  let size = info[0].size!;
  for (let i = 0; i < info.length; i++) {
    const element = info[i];
    if (size > element.size!) {
      sizeArr[element.size!] = [];
      sizeArr[element.size!].push(
        element.width! * wStep + LEFT_GAP + index * countWidth,
        element.height! * hStep + TOP_GAP
      );
    } else {
      const old = sizeArr[size];
      if (old) {
        sizeArr[size] = [
          ...old,
          element.width! * wStep + LEFT_GAP + index * countWidth,
          element.height! * hStep + TOP_GAP,
        ];
      } else {
        sizeArr[size] = [
          element.width! * wStep + LEFT_GAP + index * countWidth,
          element.height! * hStep + TOP_GAP,
        ];
      }
    }
  }
  let arr = [] as number[];
  for (const key in sizeArr) {
    sizeArr[key] = [...arr, ...sizeArr[key]];
    arr = sizeArr[key];
  }
  return sizeArr;
};
