<template>
  <div class="task-form">
    <h3 class="form-title">
      <el-icon><Document /></el-icon>
      演示表单
    </h3>
    <el-form :model="model" label-position="top" class="form-body">
      <el-form-item label="姓名">
        <el-input
          v-model="model.name"
          placeholder="请输入姓名"
          :class="{ 'field-highlight': highlightField === 'name' }"
        />
      </el-form-item>

      <el-form-item label="邮箱">
        <el-input
          v-model="model.email"
          placeholder="请输入邮箱"
          :class="{ 'field-highlight': highlightField === 'email' }"
        />
      </el-form-item>

      <el-form-item label="手机">
        <el-input
          v-model="model.phone"
          placeholder="请输入手机号"
          :class="{ 'field-highlight': highlightField === 'phone' }"
        />
      </el-form-item>

      <el-form-item label="主题">
        <el-select
          v-model="model.topic"
          placeholder="请选择主题"
          class="w-full"
          :class="{ 'field-highlight': highlightField === 'topic' }"
        >
          <el-option label="产品咨询" value="产品咨询" />
          <el-option label="技术支持" value="技术支持" />
          <el-option label="商务合作" value="商务合作" />
          <el-option label="投诉建议" value="投诉建议" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>

      <el-form-item label="留言">
        <el-input
          v-model="model.message"
          type="textarea"
          :rows="3"
          placeholder="请输入留言内容"
          :class="{ 'field-highlight': highlightField === 'message' }"
        />
      </el-form-item>

      <el-form-item>
        <el-checkbox
          v-model="model.agree"
          :class="{ 'field-highlight': highlightField === 'agree' }"
        >
          我已阅读并同意《用户协议》
        </el-checkbox>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts">
export default { name: "TaskForm" };
</script>
<script lang="ts" setup>
import { Document } from "@element-plus/icons-vue";
import type { TaskFormModel } from "./types";

defineProps<{
  model: TaskFormModel;
  highlightField?: string | null;
}>();
</script>

<style lang="scss" scoped>
.task-form {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  padding: 24px;

  .form-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 20px;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .form-body {
    :deep(.el-form-item) {
      margin-bottom: 16px;
    }

    :deep(.el-form-item__label) {
      font-size: 13px;
      color: #666;
      padding-bottom: 4px;
    }
  }

  .w-full {
    width: 100%;
  }
}

// 字段高亮动画
.field-highlight {
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner),
  :deep(.el-select .el-input__wrapper) {
    border-color: #1677ff !important;
    box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.15) !important;
    transition: all 0.3s ease;
  }

  &:deep(.el-checkbox) {
    .el-checkbox__inner {
      border-color: #1677ff !important;
      box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.15);
    }
  }
}

@keyframes highlight-pulse {
  0% {
    box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.3);
  }
  100% {
    box-shadow: 0 0 0 3px rgba(22, 119, 255, 0);
  }
}
</style>
