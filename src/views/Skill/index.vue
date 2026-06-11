<template>
  <div class="skill-page">
    <!-- 筛选区 -->
    <SearchFilter
      :filters="filterConfig"
      :form-data="filterData"
      @search="handleSearch"
      @reset="handleReset"
    >
      <div>
        <el-button type="primary" @click="handleAdd">添加</el-button>
      </div>
    </SearchFilter>

    <!-- 表格区 -->
    <VxeTableCom
      ref="tableRef"
      :columns="columns"
      :data="tableData"
      :loading="loading"
    >
      <template #category="{ row }">
        <el-tag
          :type="
            row.category === '前端'
              ? 'primary'
              : row.category === '后端'
                ? 'success'
                : 'warning'
          "
          size="small"
        >
          {{ row.category }}
        </el-tag>
      </template>
      <template #status="{ row }">
        <el-tag
          v-if="row.spendTime != null"
          :type="
            row.spendTime <= 5
              ? 'success'
              : row.spendTime <= 15
                ? 'warning'
                : 'danger'
          "
          size="small"
        >
          {{
            row.spendTime <= 5 ? "熟练" : row.spendTime <= 15 ? "一般" : "生疏"
          }}
        </el-tag>
        <el-tag v-else type="info" size="small">未掌握</el-tag>
      </template>
      <template #action="{ row }">
        <el-button type="primary" link size="small" @click="handleView(row)"
          >查看</el-button
        >
        <el-button type="warning" link size="small" @click="handleEdit(row)"
          >编辑</el-button
        >
        <el-button type="danger" link size="small" @click="handleDelete(row)"
          >删除</el-button
        >
      </template>
    </VxeTableCom>

    <!-- 分页区 -->
    <Pagination
      v-model:page="pagination.pageNum"
      v-model:size="pagination.pageSize"
      :total="total"
      @pagination="handlePagination"
    />

    <!-- 表单弹窗 -->
    <SkillFormDialog
      v-model="dialogVisible"
      :mode="currentMode"
      :data="currentData"
      @submit="handleSubmit"
    />
  </div>
</template>

<script lang="ts">
export default { name: "Skill" };
</script>

<script lang="ts" setup>
import { ref, reactive, onMounted } from "vue";
import type { FilterItem, VxeColumn } from "@/types/common";
import { ElMessage, ElMessageBox } from "element-plus";
import SearchFilter from "@/components/SearchFilter/index.vue";
import VxeTableCom from "@/components/VxeTableCom/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import SkillFormDialog from "./components/SkillFormDialog.vue";
import type { SkillFormData } from "./components/SkillFormDialog.vue";

// ─── 模拟数据 ─────────────────────────────────────────────────
interface SkillItem {
  id: number;
  name: string;
  category: string;
  proficiency: number;
  spendTime: number | null;
  experience: string;
  createTime: string;
}

const mockData: SkillItem[] = [
  {
    id: 1,
    name: "Vue3",
    category: "前端",
    proficiency: 90,
    spendTime: 3,
    experience: "使用Vue3开发多个项目，熟悉Composition API",
    createTime: "2024-01-15",
  },
  {
    id: 2,
    name: "TypeScript",
    category: "前端",
    proficiency: 85,
    spendTime: 4,
    experience: "日常开发中熟练使用TypeScript",
    createTime: "2024-02-20",
  },
  {
    id: 3,
    name: "Node.js",
    category: "后端",
    proficiency: 70,
    spendTime: 8,
    experience: "能独立开发后端服务",
    createTime: "2024-03-10",
  },
  {
    id: 4,
    name: "Python",
    category: "后端",
    proficiency: 60,
    spendTime: 10,
    experience: "基础掌握，可用于脚本编写",
    createTime: "2024-04-05",
  },
  {
    id: 5,
    name: "Three.js",
    category: "前端",
    proficiency: 80,
    spendTime: 5,
    experience: "做过3D可视化项目",
    createTime: "2024-05-18",
  },
  {
    id: 6,
    name: "Cesium",
    category: "前端",
    proficiency: 75,
    spendTime: 6,
    experience: "GIS可视化开发",
    createTime: "2024-06-22",
  },
  {
    id: 7,
    name: "Java",
    category: "后端",
    proficiency: 50,
    spendTime: 12,
    experience: "有基础开发经验",
    createTime: "2024-07-30",
  },
  {
    id: 8,
    name: "CSS/SCSS",
    category: "前端",
    proficiency: 92,
    spendTime: 2,
    experience: "精通各种布局和动画",
    createTime: "2024-08-12",
  },
  {
    id: 9,
    name: "Docker",
    category: "运维",
    proficiency: 45,
    spendTime: 18,
    experience: "了解基本使用和部署",
    createTime: "2024-09-01",
  },
  {
    id: 10,
    name: "Webpack/Vite",
    category: "前端",
    proficiency: 78,
    spendTime: 5,
    experience: "能独立配置构建工具",
    createTime: "2024-10-15",
  },
];

// ─── 筛选配置 ─────────────────────────────────────────────────
const filterConfig: FilterItem[] = [
  {
    type: "input",
    label: "技能名称",
    prop: "name",
    placeholder: "请输入技能名称",
  },
  {
    type: "select",
    label: "技能分类",
    prop: "category",
    options: [
      { label: "全部", value: "" },
      { label: "前端", value: "前端" },
      { label: "后端", value: "后端" },
      { label: "运维", value: "运维" },
    ],
  },
  {
    type: "select",
    label: "熟练程度",
    prop: "status",
    options: [
      { label: "全部", value: "" },
      { label: "熟练", value: "熟练" },
      { label: "一般", value: "一般" },
      { label: "生疏", value: "生疏" },
      { label: "未掌握", value: "未掌握" },
    ],
  },
];

const filterData = reactive<Record<string, any>>({
  name: undefined,
  category: undefined,
  status: undefined,
});

// ─── 表格列配置 ───────────────────────────────────────────────
const columns: VxeColumn[] = [
  { field: "name", title: "技能名称", width: 140, align: "center" },
  {
    field: "category",
    title: "技能分类",
    width: 120,
    align: "center",
    slot: true,
  },
  { field: "proficiency", title: "熟练度(%)", width: 120, align: "center" },
  { field: "spendTime", title: "掌握耗时(天)", width: 130, align: "center" },
  {
    field: "status",
    title: "掌握状态",
    width: 120,
    align: "center",
    slot: true,
  },
  { field: "experience", title: "经验描述", minWidth: 300, align: "left" },
  { field: "createTime", title: "创建时间", width: 130, align: "center" },
  {
    field: "action",
    title: "操作",
    width: 180,
    align: "center",
    fixed: "right",
    slot: true,
  },
];

// ─── 分页状态 ─────────────────────────────────────────────────
const pagination = reactive({
  pageNum: 1,
  pageSize: 5,
});

const total = ref(0);
const loading = ref(false);
const tableData = ref<SkillItem[]>([]);

// ─── 模拟数据加载 ────────────────────────────────────────────
function loadData() {
  loading.value = true;

  // 模拟异步请求
  setTimeout(() => {
    let filtered = [...mockData];

    // 按名称筛选
    if (filterData.name) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(filterData.name.toLowerCase()),
      );
    }

    // 按分类筛选
    if (filterData.category) {
      filtered = filtered.filter(
        (item) => item.category === filterData.category,
      );
    }

    // 按掌握状态筛选
    if (filterData.status) {
      filtered = filtered.filter((item) => {
        if (item.spendTime == null) return filterData.status === "未掌握";
        if (item.spendTime <= 5) return filterData.status === "熟练";
        if (item.spendTime <= 15) return filterData.status === "一般";
        return filterData.status === "生疏";
      });
    }

    total.value = filtered.length;

    // 分页
    const start = (pagination.pageNum - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    tableData.value = filtered.slice(start, end);

    loading.value = false;
  }, 300);
}

// ─── 事件处理 ─────────────────────────────────────────────────
function handleSearch() {
  pagination.pageNum = 1;
  loadData();
}

function handleReset() {
  filterData.name = undefined;
  filterData.category = undefined;
  filterData.status = undefined;
  pagination.pageNum = 1;
  loadData();
}

function handlePagination(val: { page: number; size: number }) {
  pagination.pageNum = val.page;
  pagination.pageSize = val.size;
  loadData();
}

// ─── 弹窗状态 ─────────────────────────────────────────────────
const dialogVisible = ref(false);
const currentMode = ref<"add" | "edit" | "view">("add");
const currentData = ref<Partial<SkillFormData>>();

// ─── 事件处理 ─────────────────────────────────────────────────
function handleAdd() {
  currentMode.value = "add";
  currentData.value = undefined;
  dialogVisible.value = true;
}

function handleView(row: SkillItem) {
  currentMode.value = "view";
  currentData.value = {
    id: row.id,
    name: row.name,
    category: row.category,
    proficiency: row.proficiency,
    spendTime: row.spendTime,
    experience: row.experience,
    createTime: row.createTime,
  };
  dialogVisible.value = true;
}

function handleEdit(row: SkillItem) {
  currentMode.value = "edit";
  currentData.value = {
    id: row.id,
    name: row.name,
    category: row.category,
    proficiency: row.proficiency,
    spendTime: row.spendTime,
    experience: row.experience,
    createTime: row.createTime,
  };
  dialogVisible.value = true;
}

function handleSubmit(formData: SkillFormData & { mode: string }) {
  if (formData.mode === "add") {
    mockData.unshift({
      id: Date.now(),
      name: formData.name,
      category: formData.category,
      proficiency: formData.proficiency,
      spendTime: formData.spendTime,
      experience: formData.experience,
      createTime: formData.createTime,
    });
    ElMessage.success("新增成功");
  } else if (formData.mode === "edit") {
    const idx = mockData.findIndex((item) => item.id === formData.id);
    if (idx !== -1) {
      const { mode, ...rest } = formData;
      mockData[idx] = { ...mockData[idx], ...rest } as SkillItem;
    }
    ElMessage.success("编辑成功");
  }
  dialogVisible.value = false;
  handlePagination({ page: pagination.pageNum, size: pagination.pageSize });
}

function handleDelete(row: SkillItem) {
  ElMessageBox.confirm(`确定要删除技能「${row.name}」吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      const idx = mockData.findIndex((item) => item.id === row.id);
      if (idx !== -1) {
        mockData.splice(idx, 1);
        loadData();
      }
      ElMessage.success("删除成功");
    })
    .catch(() => {});
}

// ─── 初始化 ───────────────────────────────────────────────────
onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.skill-page {
  padding: 16px;
}
</style>
