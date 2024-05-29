/**
 * @description  组合表单参数
 */
export interface DatabaseManagementFnForm {
    fn: string;
    fnName: string;
    correlation: string;
    remark?: string;
    id?: string;
    status: string;
    fnText?: string;
}

/**
 * @description 编辑函数回显参数
 */
export interface FnEditorData {
    fn: string;
    params: FnEditorParams[];
}
type FnEditorParams = {
    name: string;
    id: string;
    index: number;
};
