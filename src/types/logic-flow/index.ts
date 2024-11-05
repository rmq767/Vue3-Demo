import LogicFlow from "@logicflow/core";

export interface ILogicFlowNodePanelItem {
  type: string;
  text: string;
}

export type nodeProperty = {
  labelColor: string;
  approveTypeLabel: string;
  approveType: string;
};

/**
 * @description 设置类型
 */
export type SettingType =
  | "all"
  | "launch"
  | "approver"
  | "link"
  | "review"
  | "startPolyline"
  | "polyline"
  | "dashedLine";

export interface MyLogicFlowPropertiesType extends LogicFlow.PropertiesType {
  initiator?: string[]; //发起者
  initiatorString?: string; //发起者string
  startMoreAction?: string[]; //发起流程的更多操作
  nodeName?: string; //节点名称
  reviewerSource?: string; //审核者来源
  reviewer?: string[]; //审核者
  reviewerString?: string; //审核者string
  auditMethod?: string; //多人审核方式
  pass?: boolean; //审核过流程
  baseAction?: string[]; //基础操作
  backAction?: string; //退回操作
  moreAction?: string[]; //更多操作

  useOther?: boolean; //是否使用其他
  condition?: string; //条件
  conditionName?: string; //条件名称
}
