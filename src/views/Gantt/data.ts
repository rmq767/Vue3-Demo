import { gantt } from "dhtmlx-gantt"; // 引入模块
import { ref } from "vue";
import dayjs from "dayjs";

export const data = [
  {
    id: 1,
    text: "Task #1",
    keyNode: "关键节点文本说明2",
    signee: "张三三",
    start_date: "2024-01-17",
    end__date: "2024-02-10",
    real_end_date: "2024-02-17",
    progress: 0.3,
    parent: 0,
    open: true,
  },
  {
    id: 2,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 20,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 21,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 22,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 23,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 24,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 25,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 26,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 27,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 28,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 29,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 201,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 202,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 203,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 204,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 205,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 206,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },

  {
    id: 207,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 208,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 209,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 2001,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 20002,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 2003,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 2004,
    text: "Task #1-1",
    keyNode: "关键节点文本说明3",
    signee: "张三三1",
    start_date: "2024-02-17",
    end_date: "2024-03-27",
    // duration: 2,
    progress: 0.6,
    parent: 1,
  },
  {
    id: 3,
    text: "Task #2",
    keyNode: "关键节点文本说明3",
    signee: "张三四",
    start_date: "2024-03-20",
    duration: 3,
    progress: 1,
    parent: 0,
    open: true,
  },
  {
    id: 4,
    text: "Task #2-1",
    keyNode: "关键节点文本说明3",
    signee: "张三四1",
    start_date: "2024-10-20",
    duration: 2,
    progress: 0.4,
    parent: 3,
  },
];
export const data1 = [
  {
    id: 1,
    text: "Task #1",
    keyNode: "关键节点文本说明2",
    signee: "张三三",
    start_date: "2024-01-17",
    planned_start: "2024-01-17",
    end_date: "2024-02-10",
    planned_end: "2024-02-17",
    progress: 0.3,
    parent: 0,
    open: true,
  },
];

export const useGantt = () => {
  const ganttRef = ref();
  gantt.config.date_format = "%Y/%m/%d"; //整体格式
  gantt.config.duration_unit = "month"; //工期计算的基本单位
  gantt.config.scale_unit = "month"; //列间隔
  gantt.config.date_scale = "%Y/%m/%d"; //设置x轴的日期格式
  gantt.config.step = 1; //间隔
  gantt.i18n.setLocale("cn"); //中文
  gantt.config.autosize = true; //自适应尺寸
  gantt.config.autofit = true; // 表格列宽自适应
  gantt.config.open_tree_initially = true; // 默认是否展开树结构
  //只读模式
  gantt.config.readonly = true;
  // 显示网格
  gantt.config.show_grid = true;
  //更改树状的图标
  gantt.templates.grid_open = (item: any) => {
    return (
      "<div data-icon='" +
      (item.$open ? "close" : "open") +
      "' class='gantt_tree_icon gantt_" +
      (item.$open ? "close" : "open") +
      "'></div>"
    );
  };
  //更改父项图标
  gantt.templates.grid_folder = (item: any) => {
    return "";
  };
  //更改子项图标
  gantt.templates.grid_file = (item: any) => {
    return "";
  };
  // timeLine 文字
  gantt.templates.task_text = function (start, end, task) {
    if (task.real_end_date) {
      var sizes = gantt.getTaskPosition(
        task,
        task.start_date,
        new Date(dayjs(task.real_end_date).format("YYYY-MM-DD 12:00:00"))
      );
      return `<div class="real-task" style="position:absolute;left:0px;top:0px;width:${sizes.width}px;height:100%"></div>`;
    }
    return "";
  };
  // 指定工单栏已完成部分的文本
  gantt.templates.progress_text = function (start, end, task) {
    const level = task.$level; //层级
    console.log(task.$level);
    if (task.progress) {
      return `<div style="text-align:right;color:#000;background-color:${adjustColor(
        "#04aac1",
        level * 20,
        0.8
      )}">${Math.round(task.progress * 100)}%</div>`;
    }
    return "";
  };
  // 列配置
  gantt.config.columns = [
    {
      name: "keyNode",
      resize: true,
      label: "关键节点",
      width: 200,
      align: "center",
      tree: true,
    },
    {
      name: "signee",
      resize: true,
      label: "签收人",
      width: 70,
      align: "center",
    },
  ];
  // 开启marker插件
  gantt.plugins({ marker: true, tooltip: true });
  const today = new Date(dayjs(new Date()).format("YYYY-MM-DD 12:00:00"));
  const dateToStr = gantt.date.date_to_str(gantt.config.task_date);
  // 添加固定时间线
  gantt.addMarker({
    start_date: today,
    css: "today",
    text: "今日:" + dayjs(new Date()).format("YYYY-MM-DD"),
    title: "Today: " + dateToStr(today),
  });
  // 提示框内容
  gantt.templates.tooltip_text = function (start, end, task) {
    return (
      (task.keyNode ? `<b>关键节点:${task.keyNode}</b><br/>` : "") +
      (task.signee ? `<b>签收人:${task.signee}</b>` : "")
    );
  };

  const init = (data: any[]) => {
    gantt.init(ganttRef.value);
    gantt.parse(data);
  };

  return {
    init,
    ganttRef,
  };
};

function adjustColor(color, depth, alpha) {
  // 判断颜色格式
  let isRgb = color.length === 3 || color.length === 4;
  let isHex = /^#[0-9a-fA-F]{6}$/.test(color);

  if (!isRgb && !isHex) {
    throw new Error(
      "Invalid color format. Accepted formats: RGB (e.g., [255, 0, 0]) or Hex (e.g., #ff0000)"
    );
  }

  // 将RGB或十六进制颜色转为RGBA格式
  let rgbaColor;
  if (isRgb) {
    rgbaColor = [...color, alpha];
  } else if (isHex) {
    let rgbColor = hexToRgb(color);
    rgbaColor = [...rgbColor, alpha];
  }

  // 根据深浅值调整RGBA值
  rgbaColor = adjustColorValue(rgbaColor, depth);

  return `rgba(${rgbaColor[0]},${rgbaColor[1]},${rgbaColor[2]},${rgbaColor[3]})`;
}

// 十六进制转RGB
function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

// 调整颜色深浅值和透明度
function adjustColorValue(rgba, depth) {
  return [
    Math.round(rgba[0] + depth) > 255 ? 255 : Math.round(rgba[0] + depth),
    Math.round(rgba[1] + depth) > 255 ? 255 : Math.round(rgba[1] + depth),
    Math.round(rgba[2] + depth) > 255 ? 255 : Math.round(rgba[2] + depth),
    rgba[3], // 保持透明度不变
  ];
}
