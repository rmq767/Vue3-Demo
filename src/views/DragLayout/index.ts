import { onBeforeUnmount, onMounted, ref } from "vue";

export const useDragOver = () => {
  const position = ref({ x: 0, y: 0 });

  const syncMousePosition = (event: MouseEvent) => {
    position.value = { x: event.clientX, y: event.clientY };
  };

  onMounted(() => {
    document.addEventListener("dragover", syncMousePosition);
  });

  onBeforeUnmount(() => {
    document.removeEventListener("dragover", syncMousePosition);
  });

  return {
    position,
  };
};
