// 获取所有views下的.vue文件
const componentArr = import.meta.glob("../views/**/*.vue");
const keys = Object.keys(componentArr);
const routeArr = keys.map((item) => {
  const path = item.replace("../views/", "/").replace(".vue", "");
  return {
    path,
    component: componentArr[item],
  };
});

const routes = [
  {
    path: "/",
    redirect: "/home",
  },
  ...routeArr,
];
export default routes;
