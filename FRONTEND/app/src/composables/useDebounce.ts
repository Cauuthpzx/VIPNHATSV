import { ref, watch, type Ref } from "vue";

/**
 * Debounce a ref value — useful for search inputs.
 * Returns a new ref that only updates after `delay` ms of inactivity.
 */
export function useDebouncedRef<T>(source: Ref<T>, delay = 300): Ref<T> {
  const debounced = ref(source.value) as Ref<T>;
  let timer: ReturnType<typeof setTimeout>;

  watch(source, (val) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      debounced.value = val;
    }, delay);
  });

  return debounced;
}
