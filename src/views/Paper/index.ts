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
    tooltips: "我是提示",
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
    paperInstance.value.view.onMouseDown = (event: paper.MouseEvent) => {
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
        }
        if (selectionGroup.value && ele === view) {
          selectionGroup.value[0].remove();
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
        // 处理选中组
        const chooseItems = paperInstance.value.project.getItems({
          match: (item: paper.Item) => {
            const { topLeft, bottomRight } = item.bounds;
            if (
              topLeft.x > selection.value!.bounds.topLeft.x &&
              topLeft.y > selection.value!.bounds.topLeft.y &&
              bottomRight.x < selection.value!.bounds.bottomRight.x &&
              bottomRight.y < selection.value!.bounds.bottomRight.y
            ) {
              return item;
            }
          },
        });
        // 将框出来的item 组成一个组 组进行缩放拖拽
        const g = new Paper.Group([...chooseItems]);
        selectionGroup.value = addSelect(g);
        paperInstance.value.project?.activeLayer.addChild(
          selectionGroup.value![1]
        ); //提高层级

        selection.value!.remove();
        selection.value = undefined;
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
    // 将矩形和四个角添加到组中
    const g1 = new Paper.Group([
      rect,
      topLeftRect,
      topRightRect,
      bottomLeftRect,
      bottomRightRect,
    ]);
    // 将选择框和当前元素添加到组中，目的是统一选择框和当前元素的拖拽缩放等
    const g2 = new Paper.Group([item, g1]);
    // 配置了drag才开启
    if (config.itemHandle?.includes("drag")) {
      g2.onMouseDrag = (e: paper.MouseEvent) => {
        e.stopPropagation();
        g2.position.set(
          item.position.x + e.delta.x,
          item.position.y + e.delta.y
        );
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

      topLeftRect.bounds.x += e.delta.x;
      topLeftRect.bounds.y += e.delta.y;
      topRightRect.bounds.y += e.delta.y;
      bottomLeftRect.bounds.x += e.delta.x;
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

      topRightRect.bounds.x += e.delta.x;
      topRightRect.bounds.y += e.delta.y;
      topLeftRect.bounds.y += e.delta.y;
      bottomRightRect.bounds.x += e.delta.x;
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

      bottomLeftRect.bounds.x += e.delta.x;
      bottomLeftRect.bounds.y += e.delta.y;
      topLeftRect.bounds.x += e.delta.x;
      bottomRightRect.bounds.y += e.delta.y;
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

      bottomRightRect.bounds.x += e.delta.x;
      bottomRightRect.bounds.y += e.delta.y;
      topRightRect.bounds.x += e.delta.x;
      bottomLeftRect.bounds.y += e.delta.y;
    };
    [topLeftRect, topRightRect, bottomLeftRect, bottomRightRect].forEach(
      (item) => {
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
          }
        };
      }
    );

    return [g1, g2];
  };

  const registerMouseEvent = () => {
    const children = paperInstance.value.project.activeLayer.children;
    // 单个item的事件
    children?.forEach((item: any) => {
      // 每个item添加按下鼠标事件
      item.onMouseDown = (event: paper.MouseEvent) => {
        // 处理点击单个选中
        if (config.itemHandle?.includes("select")) {
          if (map.has(event.target)) {
            // 点击相同item，移除之前的，新添加一个
            selectionGroup.value = map.get(event.target);
            selectionGroup.value![0].remove();
            map.delete(event.target);
            selectionGroup.value = addSelect(event.target);
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
                selectionGroup.value = addSelect(event.target);
                map.set(event.target, selectionGroup.value);
              }
            } else {
              selectionGroup.value = addSelect(event.target);
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
      // 每个item添加鼠标拖动事件
      item.onMouseDrag = (event: paper.MouseEvent) => {
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
      item.onMouseEnter = (e: paper.MouseEvent) => {
        cursor.value = "pointer";
      };
      item.onMouseLeave = () => {
        cursor.value = "defatul";
        let tootipsEl = document.querySelector(".tootips") as HTMLElement;
        tootipsEl.style.display = "none";
      };
      item.onMouseMove = (event: paper.MouseEvent) => {
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
    });
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
    registerMouseEvent,
  };
};
