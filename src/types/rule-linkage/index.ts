import { Option } from "../common";

export type RuleLinkageType = "input" | "select" | "date" | "number";

export interface RuleLinkageTableDataParams {
  id: number;
  name: string;
  type: RuleLinkageType;
  value: any;
  options: Option[] | null;
}

export interface RuleLinkageConditions {
  id: string;
  symbol: string;
  value: string;
  type: RuleLinkageType | string;
  options: Option[] | null;
}

export interface RuleLinkageActions {
  id: string;
  value: string;
  type: RuleLinkageType | string;
  options: Option[] | null;
}
