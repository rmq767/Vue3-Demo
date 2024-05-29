/**
 * @description  params表单参数
 */
export interface DatabaseManagementParamsForm {
    abbreviation: string;
    name: string;
    unit?: string;
    remark?: string;
    rangeMin: number | undefined;
    rangeMax: number | undefined;
    status?: boolean;
    id?: string;
}
