import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { ElMessage } from "element-plus";
interface customAxiosResponse extends AxiosResponse {
  code?: number | string;
  error?: string;
  path?: string;
}
// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 50 * 1000,
  headers: { "Content-Type": "application/json;charset=utf-8" },
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig<any>) => {
    if (!config.headers) {
      throw new Error(
        `Expected 'config' and 'config.headers' not to be undefined`
      );
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: customAxiosResponse) => {
    const { code, msg } = response.data;
    if (code === 0 || code == 200) {
      return response.data;
    } else {
      // 响应数据为二进制流处理(Excel导出)
      if (
        response.data instanceof ArrayBuffer ||
        response.data instanceof Blob
      ) {
        return response;
      }
      if (code === 2) {
        ElMessage({
          message: `${msg}` || "系统出错",
          type: "error",
        });
        return Promise.reject(new Error(msg || "Error"));
      } else if (code === 500) {
        ElMessage({
          message: msg || "服务器出错",
          type: "error",
        });
        return Promise.reject(new Error(msg || "Error"));
      } else if (code === 1001) {
        // 处理历史方案二级明细维护
        ElMessage({
          message: msg,
          type: "error",
        });
        return Promise.reject(response.data);
      }
      ElMessage({
        message: `error code: ${code}, error msg: ${msg}` || "系统出错",
        type: "error",
      });
      return Promise.reject(new Error(msg || "Error"));
    }
  },
  (errorRes) => {
    const { error } = errorRes;
    return Promise.reject(error || errorRes || "Error");
  }
);

// 导出 axios 实例
export default service;
