<template>
  <el-dialog v-model="visible" :title="title" width="600px" @close="reset">
    <el-form
      ref="formRef"
      :model="form"
      :rules="mode === 'view' ? {} : rules"
      label-width="100px"
    >
      <el-form-item label="技能名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入技能名称"
          :disabled="mode === 'view'"
        />
      </el-form-item>

      <el-form-item label="技能分类" prop="category">
        <el-select
          v-model="form.category"
          placeholder="请选择技能分类"
          :disabled="mode === 'view'"
        >
          <el-option label="前端" value="前端" />
          <el-option label="后端" value="后端" />
          <el-option label="运维" value="运维" />
        </el-select>
      </el-form-item>

      <el-form-item label="熟练度(%)" prop="proficiency">
        <el-input-number
          v-model="form.proficiency"
          :min="0"
          :max="100"
          :disabled="mode === 'view'"
        />
      </el-form-item>

      <el-form-item label="掌握耗时(天)" prop="spendTime">
        <el-input-number
          v-model="form.spendTime"
          :min="0"
          :max="999"
          :disabled="mode === 'view'"
        />
      </el-form-item>

      <el-form-item label="经验描述" prop="experience">
        <el-input
          v-model="form.experience"
          type="textarea"
          :rows="3"
          placeholder="请输入经验描述"
          :disabled="mode === 'view'"
        />
      </el-form-item>

      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="form.createTime"
          type="date"
          placeholder="请选择创建时间"
          value-format="YYYY-MM-DD"
          :disabled="mode === 'view'"
        />
      </el-form-item>
    </el-form>

    <template #footer v-if="mode !== 'view'">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit"
        >确定</el-button
      >
    </template>
    <template #footer v-else>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import type { FormInstance } from "element-plus";

export interface SkillFormData {
  id: number | null;
  name: string;
  category: string;
  proficiency: number;
  spendTime: number | null;
  experience: string;
  createTime: string;
}

const props = defineProps<{
  modelValue: boolean;
  mode?: "add" | "edit" | "view";
  data?: Partial<SkillFormData>;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [data: SkillFormData & { mode: string }];
}>();

const visible = ref(false);
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive<SkillFormData>({
  id: null,
  name: "",
  category: "",
  proficiency: 50,
  spendTime: null,
  experience: "",
  createTime: "",
});

const rules = {
  name: [{ required: true, message: "请输入技能名称", trigger: "blur" }],
  category: [{ required: true, message: "请选择技能分类", trigger: "change" }],
  proficiency: [{ required: true, message: "请输入熟练度", trigger: "blur" }],
  experience: [{ required: true, message: "请输入经验描述", trigger: "blur" }],
  createTime: [
    { required: true, message: "请选择创建时间", trigger: "change" },
  ],
};

const title = computed(() => {
  const titles = {
    add: "新增技能",
    edit: "编辑技能",
    view: "查看技能详情",
  };
  return titles[props.mode || "add"];
});

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val && props.data) {
      Object.assign(form, props.data);
    } else if (val) {
      reset();
    }
  },
);

watch(visible, (val) => emit("update:modelValue", val));

const reset = () => {
  formRef.value?.resetFields();
  form.id = null;
  form.name = "";
  form.category = "";
  form.proficiency = 50;
  form.spendTime = null;
  form.experience = "";
  form.createTime = "";
};

const submit = async () => {
  if (props.mode === "view") return;

  await formRef.value?.validate();
  loading.value = true;
  try {
    emit("submit", { ...form, mode: props.mode } as SkillFormData & {
      mode: string;
    });
  } finally {
    loading.value = false;
  }
};
</script>
