import LogicFlow, {
  BaseNodeModel,
  CircleNode,
  CircleNodeModel,
  PolylineEdge,
  PolylineEdgeModel,
  RectNode,
  RectNodeModel,
  h,
} from "@logicflow/core";
import { v4 as uuidv4 } from "uuid";
import { Ref, ShallowRef } from "vue";

/**
 * @description 注册节点
 * @export
 * @param {LogicFlow} lf
 * @return {*}
 */
export function registeNode(lf: ShallowRef<LogicFlow | undefined>) {
  /**
   * @description 自定义开始节点
   */
  class StartNode extends CircleNode {
    getShape() {
      const { x, y } = this.props.model;
      const style = this.props.model.getNodeStyle();
      return h("g", {}, [
        h("circle", {
          ...style,
          cx: x,
          cy: y,
          r: 30,
          stroke: "#000",
          fill: "#000",
        }),
      ]);
    }
    getText() {
      const { x, y, text } = this.props.model;
      return h(
        "text",
        {
          x: x,
          y: y,
          fill: "#fff",
          textAnchor: "middle",
          alignmentBaseline: "middle",
          style: { fontSize: 12 },
        },
        text.value
      );
    }
  }
  class StartNodeModel extends CircleNodeModel {
    setAttributes() {
      this.r = 30;
      this.isSelected = false;
    }
    getConnectedTargetRules() {
      const rules = super.getConnectedTargetRules();
      const geteWayOnlyAsTarget = {
        message: "开始节点只能连出，不能连入！",
        validate: (source?: BaseNodeModel, target?: BaseNodeModel) => {
          let isValid = true;
          if (target) {
            isValid = false;
          }
          return isValid;
        },
      };
      rules.push(geteWayOnlyAsTarget);
      return rules;
    }
    getConnectedSourceRules() {
      const rules = super.getConnectedSourceRules();
      const onlyOneOutEdge = {
        message: "开始节点只能连出一条线！",
        validate: (source?: BaseNodeModel, target?: BaseNodeModel) => {
          let isValid = true;
          if (source?.outgoing.edges.length) {
            isValid = false;
          }
          return isValid;
        },
      };
      rules.push(onlyOneOutEdge);
      return rules;
    }
    createId() {
      return uuidv4();
    }
  }
  lf.value?.register({
    type: "start",
    view: StartNode,
    model: StartNodeModel,
  });
  /**
   * @description 自定义发起节点
   */
  class LaunchNode extends RectNode {
    getShape() {
      const { x, y, width, height, radius } = this.props.model;
      const style = this.props.model.getNodeStyle();
      return h("g", {}, [
        h("rect", {
          ...style,
          x: x - width / 2,
          y: y - height / 2,
          rx: radius,
          ry: radius,
          width: 120,
          height: 50,
          stroke: "#000",
          fill: "#000",
        }),
      ]);
    }
    getText() {
      const { x, y, text, width, height } = this.props.model;
      return h(
        "foreignObject",
        {
          x: x - width / 2,
          y: y - height / 2,
          className: "foreign-object",
          style: {
            width: width,
            height: height,
          },
        },
        [
          h(
            "p",
            {
              style: {
                fontSize: 12,
                width: width,
                height: height,
                lineHeight: height + "px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: "center",
                padding: "0 8px",
                boxSizing: "border-box",
                margin: "0",
                color: "#fff",
              },
            },
            text.value
          ),
        ]
      );
    }
  }
  class LaunchModel extends RectNodeModel {
    setAttributes() {
      this.width = 120;
      this.height = 50;
      this.radius = 4;
      this.isSelected = false;
    }
    getConnectedSourceRules() {
      const rules = super.getConnectedSourceRules();
      const notAsTarget = {
        message: "不能连接自己",
        validate: (source?: BaseNodeModel, target?: BaseNodeModel) => {
          let isValid = true;
          if (source?.id === target?.id) {
            isValid = false;
          }
          return isValid;
        },
      };
      rules.push(notAsTarget);
      return rules;
    }
    createId() {
      return uuidv4();
    }
  }
  lf.value?.register({
    type: "launch",
    view: LaunchNode,
    model: LaunchModel,
  });
  /**
   * @description 自定义审批节点
   */
  class ApproverNode extends RectNode {
    getShape() {
      const { x, y, width, height, radius } = this.props.model;
      const style = this.props.model.getNodeStyle();
      return h("g", {}, [
        h("rect", {
          ...style,
          x: x - width / 2,
          y: y - height / 2,
          rx: radius,
          ry: radius,
          width: 120,
          height: 50,
          stroke: "#facd91",
          fill: "#facd91",
        }),
      ]);
    }
    getText() {
      const { x, y, text, width, height } = this.props.model;
      return h(
        "foreignObject",
        {
          x: x - width / 2,
          y: y - height / 2,
          className: "foreign-object",
          style: {
            width: width,
            height: height,
          },
        },
        [
          h(
            "p",
            {
              style: {
                fontSize: 12,
                width: width,
                height: height,
                lineHeight: height + "px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: "center",
                padding: "0 8px",
                boxSizing: "border-box",
                margin: "0",
              },
            },
            text.value
          ),
        ]
      );
    }
  }
  class ApproverModel extends RectNodeModel {
    setAttributes() {
      this.width = 120;
      this.height = 50;
      this.radius = 4;
      this.isSelected = false;
    }
    getConnectedSourceRules() {
      const rules = super.getConnectedSourceRules();
      const notAsTarget = {
        message: "不能连接自己",
        validate: (source?: BaseNodeModel, target?: BaseNodeModel) => {
          let isValid = true;
          if (source?.id === target?.id) {
            isValid = false;
          }
          return isValid;
        },
      };
      rules.push(notAsTarget);
      return rules;
    }
    createId() {
      return uuidv4();
    }
  }
  lf.value?.register({
    type: "approver",
    view: ApproverNode,
    model: ApproverModel,
  });
  /**
   * @description 自定义连接点节点
   */
  class LinkNode extends RectNode {
    getShape() {
      const { x, y, width, height, radius } = this.props.model;
      const style = this.props.model.getNodeStyle();
      return h("g", {}, [
        h("rect", {
          ...style,
          x: x - width / 2,
          y: y - height / 2,
          rx: radius,
          ry: radius,
          width: 120,
          height: 50,
          stroke: "#caf982",
          fill: "#caf982",
        }),
      ]);
    }
    getText() {
      const { x, y, text, width, height } = this.props.model;
      return h(
        "foreignObject",
        {
          x: x - width / 2,
          y: y - height / 2,
          className: "foreign-object",
          style: {
            width: width,
            height: height,
          },
        },
        [
          h(
            "p",
            {
              style: {
                fontSize: 12,
                width: width,
                height: height,
                lineHeight: height + "px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: "center",
                padding: "0 8px",
                boxSizing: "border-box",
                margin: "0",
              },
            },
            text.value
          ),
        ]
      );
    }
  }
  class LinkModel extends RectNodeModel {
    setAttributes() {
      this.width = 120;
      this.height = 50;
      this.radius = 4;
      this.isSelected = false;
    }
    getConnectedSourceRules() {
      const rules = super.getConnectedSourceRules();
      const notAsTarget = {
        message: "不能连接自己",
        validate: (source?: BaseNodeModel, target?: BaseNodeModel) => {
          let isValid = true;
          if (source?.id === target?.id) {
            isValid = false;
          }
          return isValid;
        },
      };
      rules.push(notAsTarget);
      return rules;
    }
    createId() {
      return uuidv4();
    }
  }
  lf.value?.register({
    type: "link",
    view: LinkNode,
    model: LinkModel,
  });
  /**
   * @description 自定义传阅节点
   */
  class ReviewNode extends RectNode {
    getShape() {
      const { x, y, width, height, radius } = this.props.model;
      const style = this.props.model.getNodeStyle();
      return h("g", {}, [
        h("rect", {
          ...style,
          x: x - width / 2,
          y: y - height / 2,
          rx: radius,
          ry: radius,
          width: 120,
          height: 50,
          stroke: "#81d3f8",
          fill: "#81d3f8",
        }),
      ]);
    }
    getText() {
      const { x, y, text, width, height } = this.props.model;
      return h(
        "foreignObject",
        {
          x: x - width / 2,
          y: y - height / 2,
          className: "foreign-object",
          style: {
            width: width,
            height: height,
          },
        },
        [
          h(
            "p",
            {
              style: {
                fontSize: 12,
                width: width,
                height: height,
                lineHeight: height + "px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: "center",
                padding: "0 8px",
                boxSizing: "border-box",
                margin: "0",
              },
            },
            text.value
          ),
        ]
      );
    }
  }
  class ReviewModel extends RectNodeModel {
    setAttributes() {
      this.width = 120;
      this.height = 50;
      this.radius = 4;
      this.isSelected = false;
    }
    getConnectedSourceRules() {
      const rules = super.getConnectedSourceRules();
      const notAsTarget = {
        message: "不能连接自己",
        validate: (source?: BaseNodeModel, target?: BaseNodeModel) => {
          let isValid = true;
          if (source?.id === target?.id) {
            isValid = false;
          }
          return isValid;
        },
      };
      rules.push(notAsTarget);
      return rules;
    }
    createId() {
      return uuidv4();
    }
  }
  lf.value?.register({
    type: "review",
    view: ReviewNode,
    model: ReviewModel,
  });
  // /**
  //  * @description 自定义判断节点
  //  */
  // class JugementNode extends PolygonNode {
  //   getShape() {
  //     const { x, y, width, height, points } = this.props.model;
  //     const style = this.props.model.getNodeStyle();
  //     return h(
  //       "g",
  //       {
  //         transform: `translate(${x - width / 2},${y - height / 2})`,
  //       },
  //       [
  //         h("polygon", {
  //           ...style,
  //           x: x - width / 2,
  //           y: y - height / 2,
  //           points: points
  //             .map((point) => {
  //               return `${point[0]}, ${point[1]}`;
  //             })
  //             .join(" "),
  //           stroke: "rgb(100, 149, 237)",
  //         }),
  //       ]
  //     );
  //   }
  // }
  // class JugementModel extends PolygonNodeModel {
  //   constructor(data: any, graphModel: GraphModel) {
  //     super(data, graphModel);
  //     this.graphModel = graphModel;
  //     this.points = [
  //       [35, 0],
  //       [70, 35],
  //       [35, 70],
  //       [0, 35],
  //     ];
  //   }
  //   // getConnectedSourceRules() {
  //   //   const rules = super.getConnectedSourceRules();
  //   //   const notAsTarget = {
  //   //     message: "判断节点最多只能有两个出边",
  //   //     validate: (sourceNode?: BaseNodeModel) => {
  //   //       const edges = this.graphModel.getNodeOutgoingEdge(sourceNode!.id);
  //   //       if (edges.length > 1) {
  //   //         return false;
  //   //       }
  //   //       return true;
  //   //     },
  //   //   };
  //   //   rules.push(notAsTarget);
  //   //   return rules;
  //   // }
  //   createId() {
  //     return uuidv4();
  //   }
  // }
  // lf.register({
  //   type: "jugement",
  //   view: JugementNode,
  //   model: JugementModel,
  // });
  /**
   * @description 结束节点
   */
  class FinishNode extends CircleNode {
    getShape() {
      const { x, y } = this.props.model;
      const style = this.props.model.getNodeStyle();
      return h("g", {}, [
        h("circle", {
          ...style,
          cx: x,
          cy: y,
          r: 30,
          stroke: "#000",
          fill: "#000",
        }),
      ]);
    }
    getText() {
      const { x, y, text } = this.props.model;
      return h(
        "text",
        {
          x: x,
          y: y,
          fill: "#fff",
          textAnchor: "middle",
          alignmentBaseline: "middle",
          style: { fontSize: 12 },
        },
        text.value
      );
    }
  }
  class FinishModel extends CircleNodeModel {
    setAttributes() {
      this.r = 30;
      this.isSelected = false;
    }
    getConnectedSourceRules() {
      const rules = super.getConnectedSourceRules();
      const notAsTarget = {
        message: "终止节点不能作为连线的起点",
        validate: () => false,
      };
      rules.push(notAsTarget);
      return rules;
    }
    createId() {
      return uuidv4();
    }
  }
  lf.value?.register({
    type: "end",
    view: FinishNode,
    model: FinishModel,
  });
  /**
   * @description 虚线
   */
  class DashedLineModel extends PolylineEdgeModel {
    getEdgeStyle() {
      const style = super.getEdgeStyle();
      style.stroke = "#000";
      style.strokeDasharray = "3 3";
      return style;
    }
  }
  lf.value?.register({
    type: "dashedLine",
    view: PolylineEdge,
    model: DashedLineModel,
  });
  /**
   * @description 开始的连线
   */
  class StartPolylineModel extends PolylineEdgeModel {
    setAttributes() {
      this.isSelected = false;
      this.isHitable = false;
    }
  }
  lf.value?.register({
    type: "startPolyline",
    view: PolylineEdge,
    model: StartPolylineModel,
  });
}

/**
 * @description 注册键盘事件
 * @export
 * @param {(ShallowRef<LogicFlow | undefined>)} lf
 * @param {(Ref<LogicFlow.NodeData | LogicFlow.EdgeData | undefined>)} nodeData
 * @return {*}
 */
export function registerKeyboard(
  lf: ShallowRef<LogicFlow | undefined>,
  nodeData: Ref<LogicFlow.NodeData | LogicFlow.EdgeData | undefined>
) {
  let copyNodes = undefined as LogicFlow.NodeData[] | undefined;
  let TRANSLATION_DISTANCE = 40;
  let CHILDREN_TRANSLATION_DISTANCE = 40;
  const cv = [
    {
      keys: ["ctrl + c", "cmd + c"],
      callback: () => {
        copyNodes = lf.value?.getSelectElements().nodes;
      },
    },
    {
      keys: ["ctrl + v", "cmd + v"],
      callback: () => {
        const startOrEndNode = copyNodes?.find(
          (node) =>
            node.type === "start" ||
            node.type === "end" ||
            node.type === "launch"
        );
        if (startOrEndNode) {
          return true;
        }
        if (copyNodes) {
          lf.value?.clearSelectElements();
          copyNodes.forEach(function (node) {
            node.x += TRANSLATION_DISTANCE;
            node.y += TRANSLATION_DISTANCE;
            node.text!.x += TRANSLATION_DISTANCE;
            node.text!.y += TRANSLATION_DISTANCE;
            return node;
          });
          let addElements = lf.value?.addElements(
            { nodes: copyNodes, edges: [] },
            CHILDREN_TRANSLATION_DISTANCE
          );
          if (!addElements) return true;
          addElements.nodes.forEach(function (node) {
            nodeData.value = node.getData();
            return lf.value?.selectElementById(node.id, true);
          });
          CHILDREN_TRANSLATION_DISTANCE =
            CHILDREN_TRANSLATION_DISTANCE + TRANSLATION_DISTANCE;
        }
        return false;
      },
    },
    {
      keys: ["backspace"],
      callback: () => {
        const elements = lf.value?.getSelectElements(true);
        if (elements) {
          lf.value?.clearSelectElements();
          elements.edges.forEach(function (edge) {
            return edge.id && lf.value?.deleteEdge(edge.id);
          });
          elements.nodes.forEach(function (node) {
            if (
              node.type === "start" ||
              node.type === "end" ||
              node.type === "launch"
            ) {
              return true;
            }
            return node.id && lf.value?.deleteNode(node.id);
          });
          return false;
        }
      },
    },
  ];
  return cv;
}

/**
 * @description 流程类型
 */
export const flowAction = [
  {
    label: "新增",
    value: "add",
  },
  {
    label: "修改",
    value: "update",
  },
  {
    label: "删除",
    value: "delete",
  },
];

/**
 * @description 开始流程的更多操作
 */
export const startFlowMoreAction = [
  {
    label: "撤回",
    value: "back",
  },
  {
    label: "作废",
    value: "cancel",
  },
  {
    label: "后加签",
    value: "addSign",
  },
  {
    label: "传阅",
    value: "circulate",
  },
];
/**
 * @description 基本操作
 */
export const baseAction = [
  {
    label: "同意",
    value: "agree",
  },
  {
    label: "不同意",
    value: "reject",
  },
  {
    label: "退回",
    value: "back",
  },
];
/**
 * @description 审核的更多操作
 */
export const auditMoreAction = [
  {
    label: "撤回",
    value: "back",
  },
  {
    label: "转办",
    value: "transfer",
  },
  {
    label: "前加签",
    value: "frontAddSign",
  },
  {
    label: "后加签",
    value: "backAddSign",
  },
  {
    label: "传阅",
    value: "circulate",
  },
];
