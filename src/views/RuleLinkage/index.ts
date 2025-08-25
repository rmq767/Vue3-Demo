export class SafeComparator {
  /**
   * 严格等于（===）
   */
  static equal(a: any, b: any) {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return a === b;
  }

  /**
   * 严格不等于（!==）
   */
  static notEqual(a: any, b: any) {
    if (Number.isNaN(a) && Number.isNaN(b)) return false;
    return a !== b;
  }

  /**
   * 严格大于（>）仅对数字有效
   */
  static greaterThan(a: any, b: any) {
    if (typeof a !== "number" || typeof b !== "number") return false;
    return a > b;
  }

  /**
   * 严格小于（<）仅对数字有效
   */
  static lessThan(a: any, b: any) {
    if (typeof a !== "number" || typeof b !== "number") return false;
    return a < b;
  }

  /**
   * 严格大于等于（>=）仅对数字有效
   */
  static greaterOrEqual(a: any, b: any) {
    if (typeof a !== "number" || typeof b !== "number") return false;
    return a >= b;
  }

  /**
   * 严格小于等于（<=）仅对数字有效
   */
  static lessOrEqual(a: any, b: any) {
    if (typeof a !== "number" || typeof b !== "number") return false;
    return a <= b;
  }

  /**
   * 是否为 null 或 undefined
   */
  static isNil(value: any) {
    return value === null || value === undefined;
  }

  /**
   * 是否不为 null 且不为 undefined
   */
  static isNotNil(value: any) {
    return !this.isNil(value);
  }

  /**
   * 是否为空值（包括空字符串、空数组、空对象）
   */
  static isEmpty(value: any) {
    if (this.isNil(value)) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (value.constructor === Object && Object.keys(value).length === 0)
      return true;
    return false;
  }

  /**
   * 是否不为空值
   */
  static isNotEmpty(value: any) {
    return !this.isEmpty(value);
  }
}
