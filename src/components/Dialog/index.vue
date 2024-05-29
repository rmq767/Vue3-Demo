<template>
    <el-dialog v-model="visible" v-bind="$attrs" width="800px" center>
        <slot></slot>
        <template #footer>
            <slot name="footer">
                <div class="dialog-footer">
                    <el-button @click="cancel">取消</el-button>
                    <el-button type="primary" @click="submit">确认</el-button>
                </div>
            </slot>
        </template>
    </el-dialog>
</template>

<script lang="ts" setup name="Dialog">
import { computed } from 'vue';

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true,
    },
});
const emit = defineEmits(['update:modelValue', 'close', 'submit']);
const visible = computed({
    get: () => {
        return props.modelValue;
    },
    set: value => {
        emit('update:modelValue', value);
    },
});

const cancel = () => {
    emit('close');
};
const submit = () => {
    emit('submit');
};
</script>
