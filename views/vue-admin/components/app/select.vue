<script setup lang="ts">
import { computed, ref, watch } from "vue";
import slug from "slug";
import { uid } from "uid";

import AdminInput from "@fe-admin/components/app/input.vue";

import { useModal } from "@fe-admin/composables/modal";

const selectId = uid();

const {
  options,
  labelKey = "label",
  valueKey = "value",
  labelAll = "Tất cả",
  hiddenAll = false,
} = defineProps<{
  label?: string;
  placeholder?: string;
  error?: string;
  options: any[];
  labelKey?: string;
  valueKey?: string;
  labelAll?: string;
  hiddenAll?: boolean;
}>();

const emit = defineEmits<{
  change: [value: string];
}>();

const model = defineModel<any>({ default: "" });

const items = computed(() => {
  const results = options.map((option) => ({
    label: option[labelKey],
    value: option[valueKey],
    slug: slug(option[labelKey]),
  }));

  if (!hiddenAll) {
    results.unshift({
      label: labelAll,
      value: "",
      slug: "",
    });
  }

  return {
    list: results,
    map: results.reduce((acc: Record<string, any>, item: any) => {
      acc[item.value] = item;
      return acc;
    }, {}),
  };
});

const selectedItem = computed(() => {
  return items.value.map[model.value];
});

const { isOpenModal, toggleModal } = useModal();

const selectItem = (value: string) => {
  model.value = value;
  resetResultItems();
  emit("change", value);
};

const resultItems = ref<any[]>([]);
const resetResultItems = () => {
  resultItems.value = items.value.list;
};
const handleSearch = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const search = slug(target.value);

  if (!search) {
    resultItems.value = items.value.list;
    return;
  }

  resultItems.value = items.value.list.filter((item) =>
    item.slug.includes(search)
  );
};

watch(
  () => items.value.list,
  (newVal) => {
    resultItems.value = newVal;
  },
  {
    immediate: true,
    deep: true,
  }
);

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.closest(`#search-${selectId}`)) return;
  toggleModal();
};

watch(isOpenModal, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      window.addEventListener("click", handleClickOutside);
    }, 100);
  } else {
    window.removeEventListener("click", handleClickOutside);
  }
});
</script>

<template>
  <div class="admin-select">
    <label v-if="label" class="label">{{ label }}:</label>
    <div class="select">
      <div
        :class="['selected', { '-active': isOpenModal }]"
        @click="toggleModal"
      >
        <span class="label">{{ selectedItem?.label }}</span>
        <fa-icon
          :icon="['fas', isOpenModal ? 'close' : 'chevron-down']"
          class="icon"
        />
      </div>
      <div v-if="isOpenModal" class="option">
        <AdminInput
          :id="`search-${selectId}`"
          placeholder="Tìm kiếm..."
          class="search"
          @input="handleSearch"
        />
        <div class="block">
          <div
            v-for="item in resultItems"
            :key="item.value"
            class="item"
            :class="{ '-selected': model === item.value }"
            @click="selectItem(item.value)"
          >
            <span class="label">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
.admin-select {
  display: flex;
  flex-direction: column;
  gap: $space-sm;
  // vô hiệu hóa bôi đen text
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -o-user-select: none;
  > .label {
    font-size: $font-size-md;
    font-weight: $font-weight-bold;
    color: $color-text;
  }
  > .error {
    font-size: $font-size-sm;
    font-weight: $font-weight-default;
    color: $color-error;
  }
}

.admin-select > .select {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  > .selected {
    width: 100%;
    height: 39px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-xs;
    padding: $space-sm $space-md;
    border: 2px solid $color-border;
    border-radius: $radius-sm;
    font-size: $font-size-md;
    font-family: $font-family;
    cursor: pointer;
    &:hover {
      background: $color-bg-subtle;
    }
    &.-active {
      border-color: material-color(blue, 200);
    }
  }
  > .option {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    max-height: 200px;
    overflow-x: hidden;
    background: $white;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    overflow: hidden;
    z-index: $z-index-modal;
  }
  > .option > .block {
    width: 100%;
    max-height: 250px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  > .option > .block > .item {
    width: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: $space-md $space-md;
    border-bottom: 1px solid $color-border;
    &:hover {
      background: $color-bg-subtle;
    }
    &:last-child {
      border-bottom: none;
    }
    &.-selected {
      background: #44a4fc;
      color: $white;
    }
  }
  > .option > .search {
    width: 100%;
    border-bottom: 1px solid $color-border;
    :deep(.input) {
      border: none;
      border-radius: 0;
    }
  }
}
</style>
