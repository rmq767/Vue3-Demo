// 导入router所需的方法
import { createRouter, createWebHashHistory } from "vue-router";
// 导入路由页面的配置
import routes from "./routes";

// 路由参数配置
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 始终滚动到顶部
    return { top: 0 };
  },
});

// 全局前置守卫，这里可以加入用户登录判断
router.beforeEach((to, from, next) => {
  // 继续前进 next()
  // 返回 false 以取消导航
  next();
});

// // 全局后置钩子，这里可以加入改变页面标题等操作
router.afterEach((to, from) => {
  // const title = to.meta.title;
  // if (title) {
  //   window.document.title = title;
  // }
});

// 导出默认值
export default router;
