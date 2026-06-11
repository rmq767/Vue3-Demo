import { ref, computed, type Ref } from "vue";
import type { FormInstance } from "element-plus";
import type { FilterItem } from "@/types/common";

export function useSearchFilter(
  filters: FilterItem[],
  onSearch?: (params: Record<string, any>) => void,
) {
  const formRef = ref<FormInstance>();
  const formData = ref<Record<string, any>>(
    Object.fromEntries(filters.map((f) => [f.prop, undefined])),
  );

  const queryParams = computed(() => {
    const params: Record<string, any> = {};
    for (const f of filters) {
      const val = formData.value[f.prop];
      if (val !== undefined && val !== null && val !== "") {
        if (f.type === "date-range" && Array.isArray(val)) {
          params[`${f.prop}_start`] = val[0];
          params[`${f.prop}_end`] = val[1];
        } else {
          params[f.prop] = val;
        }
      }
    }
    return params;
  });

  function handleSearch() {
    formRef.value?.validate((valid) => {
      if (valid) onSearch?.(queryParams.value);
    });
  }

  function handleReset() {
    formRef.value?.resetFields();
    onSearch?.(queryParams.value);
  }

  return { formRef, formData, filters, handleSearch, handleReset, queryParams };
}
