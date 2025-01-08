<template>
  <div>
    <div class="route-item" v-for="[key, value] in routePaths" :key="value">
      <el-descriptions direction="vertical" :title="key" :column="1" border>
        <el-descriptions-item
          v-for="item in value"
          :key="item"
          label="路由地址"
          label-width="120px"
          label-align="center"
          align="center"
        >
          <el-button type="primary" link @click="toPage(item)">{{
            item
          }}</el-button>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "Home" };
</script>
<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const routePaths = ref(new Map());
const router = useRouter();
const initRoute = () => {
  const componentArr = import.meta.glob("../views/**/*.vue");
  const keys = Object.keys(componentArr);
  const page = keys.filter((item) => {
    return !item.includes("components");
  });
  const routeArr = page.map((item) => {
    const path = item.replace("../views/", "/").replace(".vue", "");
    const routerPath = path.replace("./", "");
    const name = routerPath.split("/")[0];
    return {
      path: routerPath,
      name: name,
    };
  });
  routeArr.forEach((item) => {
    const old = routePaths.value.get(item.name);
    if (old) {
      routePaths.value.set(item.name, [...old, item.path]);
    } else {
      routePaths.value.set(item.name, [item.path]);
    }
  });
};
const toPage = (path: string) => {
  router.push(path);
};
onMounted(() => {
  initRoute();
});
</script>

<style lang="scss" scoped>
.route-item {
  margin-bottom: 20px;
}
</style>
