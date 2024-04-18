import { nextTick, onMounted, onUnmounted, ref, toRaw, watch } from "vue";
import * as Paper from "paper";
export type CanvasHandle = "select" | "drag" | "none";
export type ItemHandle = CanvasHandle[] | CanvasHandle;
export interface PaperConfig {
  zoom: boolean;
  canvasHandle: CanvasHandle;
  itemHandle: ItemHandle;
  tooltips: string | (() => string);
}

export const usePaper = (config: PaperConfig) => {
  const defaultConfig: PaperConfig = {
    zoom: true,
    canvasHandle: "drag",
    itemHandle: "none",
    tooltips: "",
  };
  config = { ...defaultConfig, ...config };

  const paperInstance = ref<paper.PaperScope>(new Paper.PaperScope());
  const canvasEl = ref<HTMLCanvasElement>();
  const zoom = ref(1);
  const selection = ref<paper.Path.Rectangle>();
  const selectionGroup = ref<paper.Item[]>();
  const cursor = ref("default");

  const downPoint = {
    x: 0,
    y: 0,
  };
  const map = new WeakMap();

  watch(
    () => selectionGroup.value,
    (newValue, oldValue) => {
      if (oldValue) {
        oldValue[0].remove();
      }
    }
  );

  const mouseWheel = (e: any) => {
    if (config.zoom) {
      e.preventDefault();
      paperInstance.value.view.zoom =
        paperInstance.value.view.zoom * (1 + e.wheelDelta / 1000);
      zoom.value = paperInstance.value.view.zoom;
    }
  };

  /**
   * @description 处理canvas拖拽选中
   */
  const canvasHandleFn = () => {
    // 鼠标按下操作
    paperInstance.value.view.onMouseDown = (event: paper.MouseEvent | any) => {
      const ele = event.target as unknown as paper.View;
      const view = toRaw(paperInstance.value.view);
      // 开启拖拽画布
      if (config.canvasHandle === "drag") {
        /**
         * @description 拖画布
         */
        const mouseMove = (e: any) => {
          const translateX = e.x - downPoint.x;
          const translateY = e.y - downPoint.y;
          paperInstance.value.view.translate({
            x: translateX / zoom.value,
            y: translateY / zoom.value,
          });
          downPoint.x = e.x;
          downPoint.y = e.y;
        };
        /**
         * @description 取消监听
         */
        const cancelMove = () => {
          canvasEl.value?.removeEventListener("mousemove", mouseMove);
          canvasEl.value?.removeEventListener("mouseup", cancelMove);
        };
        if (ele === view) {
          //只有拖canvas才能拖动
          downPoint.x = event.event.pageX;
          downPoint.y = event.event.pageY;
          zoom.value = paperInstance.value.view.zoom;
          canvasEl.value?.addEventListener("mousemove", mouseMove);
          canvasEl.value?.addEventListener("mouseup", cancelMove);
        }
      }

      //框选 鼠标按下给出框选左上角位置
      if (config.canvasHandle === "select") {
        if (ele === view) {
          selection.value = new Paper.Path.Rectangle(
            event.point,
            new Paper.Size(1, 1)
          );
          selection.value.strokeWidth = 1;
          selection.value.strokeColor = new Paper.Color(0, 0, 0, 0.5);
          selection.value.style.dashArray = [4, 4];
          selection.value.name = "selection";
        }
        if (selectionGroup.value && ele === view) {
          // 处理选中组
          const children = selectionGroup.value[2].removeChildren();
          children?.forEach((item) => {
            item.addTo(paperInstance.value.project);
          });
          selectionGroup.value = undefined;
        }
      }
    };
    paperInstance.value.view.onMouseDrag = (e: paper.MouseEvent) => {
      if (selection.value) {
        selection.value.bounds.width += e.delta.x;
        selection.value.bounds.height += e.delta.y;
      }
    };
    paperInstance.value.view.onMouseUp = (e: paper.MouseEvent) => {
      if (selection.value) {
        let childrens: paper.Item[] = [];
        // 处理选中组
        const chooseItems = paperInstance.value.project.getItems({
          match: (item: paper.Item) => {
            if (!item.parent) {
              // 圈住的是空白
              return;
            }
            let topLeft, bottomRight: paper.Point;
            if (paperInstance.value.project.activeLayer === item.parent) {
              // 圈住的是单个元素
              topLeft = item.bounds.topLeft;
              bottomRight = item.bounds.bottomRight;
            } else {
              // 圈住的是组
              topLeft = item.parent.bounds.topLeft;
              bottomRight = item.parent.bounds.bottomRight;
            }
            if (
              topLeft.x > selection.value!.bounds.topLeft.x &&
              topLeft.y > selection.value!.bounds.topLeft.y &&
              bottomRight.x < selection.value!.bounds.bottomRight.x &&
              bottomRight.y < selection.value!.bounds.bottomRight.y
            ) {
              // 处理选中组
              if (item instanceof Paper.Group) {
                childrens.push(...item.children);
                return item;
              } else {
                if (!childrens.includes(item)) {
                  return item;
                }
              }
            }
          },
        });
        if (chooseItems.length) {
          // 将框出来的item 组成一个组 组进行缩放拖拽
          const g = new Paper.Group([...chooseItems]);
          g.name = "group";
          selectionGroup.value = addSelect(g);
          paperInstance.value.project?.activeLayer.addChild(
            selectionGroup.value![1]
          ); //提高层级
        }
        if (selection.value) {
          selection.value!.remove();
          selection.value = undefined;
        }
        downPoint.x = 0;
        downPoint.y = 0;
      }
    };
  };

  /**
   * @description 添加选择框 并注册事件
   */
  const addSelect = (item: paper.Item) => {
    const rect = new Paper.Path.Rectangle({
      center: item.bounds.center, //中心点
      size: item.bounds.size, //边长
      strokeColor: new Paper.Color("blue"),
      strokeWidth: 1,
    });
    const topLeftRect = new Paper.Path.Rectangle({
      center: item.bounds.topLeft, //中心点
      size: [10, 10], //边长
      fillColor: new Paper.Color("#fff"),
      strokeColor: new Paper.Color("blue"),
      strokeWidth: 1,
      name: "topLeftRect",
    });
    const topRightRect = new Paper.Path.Rectangle({
      center: item.bounds.topRight, //中心点
      size: [10, 10], //边长
      fillColor: new Paper.Color("#fff"),
      strokeColor: new Paper.Color("blue"),
      strokeWidth: 1,
      name: "topRightRect",
    });
    const bottomLeftRect = new Paper.Path.Rectangle({
      center: item.bounds.bottomLeft, //中心点
      size: [10, 10], //边长
      fillColor: new Paper.Color("#fff"),
      strokeColor: new Paper.Color("blue"),
      strokeWidth: 1,
      name: "bottomLeftRect",
    });
    const bottomRightRect = new Paper.Path.Rectangle({
      center: item.bounds.bottomRight, //中心点
      size: [10, 10], //边长
      fillColor: new Paper.Color("#fff"),
      strokeColor: new Paper.Color("blue"),
      strokeWidth: 1,
      name: "bottomRightRect",
    });
    const topCenterRect = new Paper.Path.Rectangle({
      center: item.bounds.topCenter, //中心点
      size: [10, 10], //边长
      fillColor: new Paper.Color("#fff"),
      strokeColor: new Paper.Color("blue"),
      strokeWidth: 1,
      name: "topCenterRect",
    });
    const leftCenterRect = new Paper.Path.Rectangle({
      center: item.bounds.leftCenter, //中心点
      size: [10, 10], //边长
      fillColor: new Paper.Color("#fff"),
      strokeColor: new Paper.Color("blue"),
      strokeWidth: 1,
      name: "leftCenterRect",
    });
    const rightCenterRect = new Paper.Path.Rectangle({
      center: item.bounds.rightCenter, //中心点
      size: [10, 10], //边长
      fillColor: new Paper.Color("#fff"),
      strokeColor: new Paper.Color("blue"),
      strokeWidth: 1,
      name: "rightCenterRect",
    });
    const bottomCenterRect = new Paper.Path.Rectangle({
      center: item.bounds.bottomCenter, //中心点
      size: [10, 10], //边长
      fillColor: new Paper.Color("#fff"),
      strokeColor: new Paper.Color("blue"),
      strokeWidth: 1,
      name: "bottomCenterRect",
    });
    // const rotateCenterRect = new Paper.Path.Rectangle({
    //   center: [item.bounds.topCenter.x, item.bounds.topCenter.y - 50], //中心点
    //   size: [10, 10], //边长
    //   fillColor: new Paper.Color("#fff"),
    //   strokeColor: new Paper.Color("blue"),
    //   strokeWidth: 1,
    //   name: "rotateCenterRect",
    // });
    // const rotateLine = new Paper.Path.Line({
    //   from: [item.bounds.topCenter.x, item.bounds.topCenter.y - 5],
    //   to: [item.bounds.topCenter.x, item.bounds.topCenter.y - 50],
    //   strokeColor: new Paper.Color("blue"),
    //   strokeWidth: 1,
    //   name: "rotateLine",
    // });
    // 将矩形和四个角添加到组中
    const g1 = new Paper.Group([
      rect,
      topLeftRect,
      topRightRect,
      bottomLeftRect,
      bottomRightRect,
      topCenterRect,
      leftCenterRect,
      rightCenterRect,
      bottomCenterRect,
      // rotateLine,
      // rotateCenterRect,
    ]);
    // 将选择框和当前元素添加到组中，目的是统一选择框和当前元素的拖拽缩放等
    const g2 = new Paper.Group([item, g1]);
    // 配置了drag才开启
    if (config.itemHandle?.includes("drag")) {
      g2.onMouseDrag = (e: paper.MouseEvent) => {
        e.stopPropagation();
        item.position.set(
          item.position.x + e.delta.x,
          item.position.y + e.delta.y
        );
        g1.position.set(g1.position.x + e.delta.x, g1.position.y + e.delta.y);
      };
    }
    topLeftRect.onMouseDrag = (e: paper.MouseEvent) => {
      e.stopPropagation();
      if (
        item.bounds.size.height - e.delta.y <= 20 ||
        item.bounds.size.width - e.delta.x <= 20
      ) {
        return;
      }
      item.bounds.center.y += e.delta.y;
      item.bounds.center.x += e.delta.x;
      item.bounds.size.height -= e.delta.y;
      item.bounds.size.width -= e.delta.x;

      rect.bounds.center.y += e.delta.y;
      rect.bounds.center.x += e.delta.x;
      rect.bounds.size.height -= e.delta.y;
      rect.bounds.size.width -= e.delta.x;

      // 左上 xy
      topLeftRect.bounds.x += e.delta.x;
      topLeftRect.bounds.y += e.delta.y;
      // 右上 y
      topRightRect.bounds.y += e.delta.y;
      // 左下 x
      bottomLeftRect.bounds.x += e.delta.x;
      // 上中 xy
      topCenterRect.bounds.y += e.delta.y;
      topCenterRect.bounds.x += e.delta.x / 2;
      // 左中 xy
      leftCenterRect.bounds.y += e.delta.y / 2;
      leftCenterRect.bounds.x += e.delta.x;
      // 右中 y
      rightCenterRect.bounds.y += e.delta.y / 2;
      // 下中 x
      bottomCenterRect.bounds.x += e.delta.x / 2;
      // 旋转
      // rotateLine.bounds.x += e.delta.x / 2;
      // rotateLine.bounds.y += e.delta.y;
      // rotateCenterRect.bounds.x += e.delta.x / 2;
      // rotateCenterRect.bounds.y += e.delta.y;
    };
    topRightRect.onMouseDrag = (e: paper.MouseEvent) => {
      e.stopPropagation();
      if (
        item.bounds.size.height - e.delta.y <= 20 ||
        item.bounds.size.width + e.delta.x <= 20
      ) {
        return;
      }
      item.bounds.center.y += e.delta.y;
      item.bounds.size.height -= e.delta.y;
      item.bounds.size.width += e.delta.x;

      rect.bounds.center.y += e.delta.y;
      rect.bounds.size.height -= e.delta.y;
      rect.bounds.size.width += e.delta.x;

      // 右上 xy
      topRightRect.bounds.x += e.delta.x;
      topRightRect.bounds.y += e.delta.y;
      // 左上 y
      topLeftRect.bounds.y += e.delta.y;
      // 右下 x
      bottomRightRect.bounds.x += e.delta.x;
      // 上中 xy
      topCenterRect.bounds.y += e.delta.y;
      topCenterRect.bounds.x += e.delta.x / 2;
      // 左中 y
      leftCenterRect.bounds.y += e.delta.y / 2;
      // 右中 xy
      rightCenterRect.bounds.y += e.delta.y / 2;
      rightCenterRect.bounds.x += e.delta.x;
      // 下中 x
      bottomCenterRect.bounds.x += e.delta.x / 2;
      // 旋转
      // rotateLine.bounds.x += e.delta.x / 2;
      // rotateLine.bounds.y += e.delta.y;
      // rotateCenterRect.bounds.x += e.delta.x / 2;
      // rotateCenterRect.bounds.y += e.delta.y;
    };
    bottomLeftRect.onMouseDrag = (e: paper.MouseEvent) => {
      e.stopPropagation();
      if (
        item.bounds.size.height + e.delta.y <= 20 ||
        item.bounds.size.width - e.delta.x <= 20
      ) {
        return;
      }
      item.bounds.center.x += e.delta.x;
      item.bounds.size.height += e.delta.y;
      item.bounds.size.width -= e.delta.x;

      rect.bounds.center.x += e.delta.x;
      rect.bounds.size.height += e.delta.y;
      rect.bounds.size.width -= e.delta.x;

      // 左下 xy
      bottomLeftRect.bounds.x += e.delta.x;
      bottomLeftRect.bounds.y += e.delta.y;
      // 坐上 x
      topLeftRect.bounds.x += e.delta.x;
      // 右下 y
      bottomRightRect.bounds.y += e.delta.y;
      // 上中 x
      topCenterRect.bounds.x += e.delta.x / 2;
      // 左中 xy
      leftCenterRect.bounds.y += e.delta.y / 2;
      leftCenterRect.bounds.x += e.delta.x;
      // 右中 y
      rightCenterRect.bounds.y += e.delta.y / 2;
      // 下中 xy
      bottomCenterRect.bounds.y += e.delta.y;
      bottomCenterRect.bounds.x += e.delta.x / 2;
      // 旋转
      // rotateLine.bounds.x += e.delta.x / 2;
      // rotateCenterRect.bounds.x += e.delta.x / 2;
    };
    bottomRightRect.onMouseDrag = (e: paper.MouseEvent) => {
      e.stopPropagation();
      if (
        item.bounds.size.height + e.delta.y <= 20 ||
        item.bounds.size.width + e.delta.x <= 20
      ) {
        return;
      }
      item.bounds.size.height += e.delta.y;
      item.bounds.size.width += e.delta.x;

      rect.bounds.size.height += e.delta.y;
      rect.bounds.size.width += e.delta.x;

      // 右下
      bottomRightRect.bounds.x += e.delta.x;
      bottomRightRect.bounds.y += e.delta.y;
      // 右上 x
      topRightRect.bounds.x += e.delta.x;
      // 左下 y
      bottomLeftRect.bounds.y += e.delta.y;
      // 上中 x
      topCenterRect.bounds.x += e.delta.x / 2;
      // 左中 y
      leftCenterRect.bounds.y += e.delta.y / 2;
      // 右中 xy
      rightCenterRect.bounds.y += e.delta.y / 2;
      rightCenterRect.bounds.x += e.delta.x;
      // 下中 xy
      bottomCenterRect.bounds.y += e.delta.y;
      bottomCenterRect.bounds.x += e.delta.x / 2;
      // 旋转
      // rotateLine.bounds.x += e.delta.x / 2;
      // rotateCenterRect.bounds.x += e.delta.x / 2;
    };
    topCenterRect.onMouseDrag = (e: paper.MouseEvent) => {
      e.stopPropagation();
      if (item.bounds.size.height - e.delta.y <= 20) {
        return;
      }
      item.bounds.center.y += e.delta.y;
      item.bounds.size.height -= e.delta.y;

      rect.bounds.center.y += e.delta.y;
      rect.bounds.size.height -= e.delta.y;

      // 左上 y
      topLeftRect.bounds.y += e.delta.y;
      // 右上 y
      topRightRect.bounds.y += e.delta.y;
      // 上中 y
      topCenterRect.bounds.y += e.delta.y;
      // 左中 y
      leftCenterRect.bounds.y += e.delta.y / 2;
      // 右中 y
      rightCenterRect.bounds.y += e.delta.y / 2;
      // 旋转
      // rotateLine.bounds.y += e.delta.y;
      // rotateCenterRect.bounds.y += e.delta.y;
    };
    leftCenterRect.onMouseDrag = (e: paper.MouseEvent) => {
      e.stopPropagation();
      if (item.bounds.size.width - e.delta.x <= 20) {
        return;
      }
      item.bounds.center.x += e.delta.x;
      item.bounds.size.width -= e.delta.x;

      rect.bounds.center.x += e.delta.x;
      rect.bounds.size.width -= e.delta.x;

      // 左上 x
      topLeftRect.bounds.x += e.delta.x;
      // 左下 x
      bottomLeftRect.bounds.x += e.delta.x;
      // 左中 x
      leftCenterRect.bounds.x += e.delta.x;
      // 上中 x
      topCenterRect.bounds.x += e.delta.x / 2;
      // 下中 x
      bottomCenterRect.bounds.x += e.delta.x / 2;
      // 旋转
      // rotateLine.bounds.x += e.delta.x / 2;
      // rotateCenterRect.bounds.x += e.delta.x / 2;
    };
    bottomCenterRect.onMouseDrag = (e: paper.MouseEvent) => {
      e.stopPropagation();
      if (item.bounds.size.height + e.delta.y <= 20) {
        return;
      }
      item.bounds.size.height += e.delta.y;

      rect.bounds.size.height += e.delta.y;

      // 左下 y
      bottomLeftRect.bounds.y += e.delta.y;
      // 右下 y
      bottomRightRect.bounds.y += e.delta.y;
      // 下中 y
      bottomCenterRect.bounds.y += e.delta.y;
      // 左中 y
      leftCenterRect.bounds.y += e.delta.y / 2;
      // 右中 y
      rightCenterRect.bounds.y += e.delta.y / 2;
    };
    rightCenterRect.onMouseDrag = (e: paper.MouseEvent) => {
      e.stopPropagation();
      if (item.bounds.size.width + e.delta.x <= 20) {
        return;
      }
      item.bounds.size.width += e.delta.x;

      rect.bounds.size.width += e.delta.x;

      // 右上 x
      topRightRect.bounds.x += e.delta.x;
      // 右下 x
      bottomRightRect.bounds.x += e.delta.x;
      // 右中 x
      rightCenterRect.bounds.x += e.delta.x;
      // 上中 x
      topCenterRect.bounds.x += e.delta.x / 2;
      // 下中 x
      bottomCenterRect.bounds.x += e.delta.x / 2;
      // 旋转
      // rotateLine.bounds.x += e.delta.x / 2;
      // rotateCenterRect.bounds.x += e.delta.x / 2;
    };
    // let lastAngle = 0;
    // rotateCenterRect.onMouseDrag = (e: paper.MouseEvent) => {
    //   e.stopPropagation();
    //   const start = item.bounds.center;
    //   const end1 = e.point;
    //   const end2 = item.bounds.topCenter;
    //   const angle = getAngle(end1.x, end1.y, end2.x, end2.y, start.x, start.y);
    //   item.rotate(-(angle - lastAngle), start);
    //   g1.rotate(-(angle - lastAngle), start);
    //   lastAngle = angle;
    // };
    [
      topLeftRect,
      topRightRect,
      bottomLeftRect,
      bottomRightRect,
      topCenterRect,
      leftCenterRect,
      rightCenterRect,
      bottomCenterRect,
      // rotateCenterRect,
    ].forEach((item) => {
      item.onMouseLeave = (e: paper.MouseEvent) => {
        e.stopPropagation();
        cursor.value = "default";
      };
      item.onMouseEnter = (e: paper.MouseEvent) => {
        e.stopPropagation();
        switch (e.target.name) {
          case "topLeftRect":
            cursor.value = "nw-resize";
            break;
          case "topRightRect":
            cursor.value = "ne-resize";
            break;
          case "bottomLeftRect":
            cursor.value = "sw-resize";
            break;
          case "bottomRightRect":
            cursor.value = "se-resize";
            break;
          case "topCenterRect":
            cursor.value = "n-resize";
            break;
          case "leftCenterRect":
            cursor.value = "w-resize";
            break;
          case "rightCenterRect":
            cursor.value = "e-resize";
            break;
          case "bottomCenterRect":
            cursor.value = "s-resize";
            break;
          // case "rotateCenterRect":
          //   cursor.value = "all-scroll";
          //   break;
        }
      };
    });

    return [g1, g2, item];
  };

  // function getAngle(
  //   x1: number,
  //   y1: number,
  //   x2: number,
  //   y2: number,
  //   cx: number,
  //   cy: number
  // ) {
  //   //2个点之间的角度获取
  //   let c1 = (Math.atan2(y1 - cy, x1 - cx) * 180) / Math.PI;
  //   let c2 = (Math.atan2(y2 - cy, x2 - cx) * 180) / Math.PI;
  //   let angle;
  //   c1 = c1 <= -90 ? 360 + c1 : c1;
  //   c2 = c2 <= -90 ? 360 + c2 : c2;

  //   //夹角获取
  //   angle = Math.floor(c2 - c1);
  //   angle = angle < 0 ? angle + 360 : angle;
  //   return angle;
  // }

  const registerMouseEvent = () => {
    const children = paperInstance.value.project.activeLayer.children;
    // 单个item的事件
    children?.forEach((item: any) => {
      // 每个item添加按下鼠标事件
      item.onMouseDown = registerMouseDown;
      // 每个item添加鼠标拖动事件
      item.onMouseDrag = (event: paper.MouseEvent | any) => {
        registerMouseDrag(event, item);
      };
      item.onMouseEnter = registerMouseEnter;
      item.onMouseLeave = registerMouseLeave;
      item.onMouseMove = registerMouseMove;
    });
  };

  const registerMouseDown = (event: paper.MouseEvent) => {
    // 处理点击单个选中
    if (config.itemHandle?.includes("select")) {
      if (map.has(event.target)) {
        // 点击相同item，移除之前的，新添加一个
        selectionGroup.value = map.get(event.target);
        selectionGroup.value![0].remove();
        map.delete(event.target);
        selectionGroup.value = addSelect(new Paper.Group(event.target));
      } else {
        if (selectionGroup.value) {
          // 获取选中组
          const current = selectionGroup.value[1].getItems({
            match: (item: paper.Item) => {
              if (item === event.target) {
                return item;
              }
            },
          });
          // 没有组 添加单个item的选中
          if (!current.length) {
            selectionGroup.value = addSelect(new Paper.Group(event.target));
            map.set(event.target, selectionGroup.value);
          }
        } else {
          selectionGroup.value = addSelect(new Paper.Group(event.target));
        }
      }
      paperInstance.value.project.activeLayer.addChild(
        selectionGroup.value![1]
      ); //提高层级

      // // 下载
      // const download = paperInstance.value.project.getItem({
      //   name: "download",
      // });
      // if (download!.name === event.target.name) {
      //   screenShot();
      // }
    } else if (
      config.itemHandle === "drag" ||
      (config.itemHandle && config.itemHandle[0] === "drag")
    ) {
      paperInstance.value.project.activeLayer.addChild(event.target);
    }
  };
  const registerMouseDrag = (
    event: paper.MouseEvent | any,
    item: paper.Item
  ) => {
    // 只有拖拽 单独开启
    if (
      config.itemHandle === "drag" ||
      (config.itemHandle && config.itemHandle[0] === "drag")
    ) {
      item.position.set(
        item.position.x + event.delta.x,
        item.position.y + event.delta.y
      );
    }
    initTooltips(event);
  };
  const registerMouseEnter = () => {
    cursor.value = "pointer";
  };
  const registerMouseLeave = () => {
    cursor.value = "defatul";
    let tootipsEl = document.querySelector(".tootips") as HTMLElement;
    if (tootipsEl && config.tooltips) {
      tootipsEl.style.display = "none";
    }
  };
  const registerMouseMove = (event: paper.MouseEvent | any) => {
    initTooltips(event);
  };
  const registerItemMouseEvent = (item: paper.Item) => {
    // 每个item添加按下鼠标事件
    item.onMouseDown = registerMouseDown;
    // 每个item添加鼠标拖动事件
    item.onMouseDrag = (event: paper.MouseEvent | any) => {
      registerMouseDrag(event, item);
    };
    item.onMouseEnter = registerMouseEnter;
    item.onMouseLeave = registerMouseLeave;
    item.onMouseMove = registerMouseMove;
  };
  const initTooltips = (event: any) => {
    if (!config.tooltips) {
      return;
    }
    let tootipsEl = document.querySelector(".tootips") as HTMLElement;
    if (!tootipsEl) {
      tootipsEl = document.createElement("div");
      document.body.appendChild(tootipsEl);
      tootipsEl.innerHTML =
        typeof config.tooltips === "string"
          ? config.tooltips
          : config.tooltips();
      tootipsEl.className = "tootips";
      tootipsEl.style.position = "absolute";
      tootipsEl.style.left = event.event.offsetX + 10 + "px";
      tootipsEl.style.top = event.event.offsetY + 10 + "px";
      tootipsEl.style.color = "#999";
    } else {
      tootipsEl.style.display = "block";
      tootipsEl.style.left = event.event.offsetX + 10 + "px";
      tootipsEl.style.top = event.event.offsetY + 10 + "px";
    }
  };
  // const screenShot = () => {
  //   // 获取svg元素，将整个canvas导出为svg
  //   const flash = paperInstance.value.project.exportSVG();
  //   // 将SVG元素转换为字符串
  //   var serializer = new XMLSerializer();
  //   var xmlString = serializer.serializeToString(flash as SVGAElement);
  //   // 创建一个Blob对象
  //   var blob = new Blob([xmlString], { type: "image/svg+xml;charset=utf-8" });
  //   // 创建一个指向该Blob的URL
  //   var url = URL.createObjectURL(blob);
  //   // 创建一个a标签
  //   var a = document.createElement("a");
  //   a.href = url;
  //   a.download = "my-svg-file.svg";
  //   // 将a标签添加到文档中，触发点击事件，然后将其从文档中删除
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  // };

  onMounted(() => {
    paperInstance.value.setup(canvasEl.value!);
    canvasEl.value?.addEventListener("wheel", mouseWheel);
    nextTick(() => {
      canvasHandleFn();
      registerMouseEvent();
    });
  });

  onUnmounted(() => {
    paperInstance.value.project.clear();
    canvasEl.value?.removeEventListener("wheel", mouseWheel);
  });

  return {
    paperInstance,
    canvasEl,
    zoom,
    cursor,
    selectionGroup,
    addSelect,
    registerItemMouseEvent,
  };
};
