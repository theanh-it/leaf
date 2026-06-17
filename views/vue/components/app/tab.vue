<script setup lang="ts">
import { ref, watch } from "vue";

const { tabs } = defineProps<{
  tabs: {
    icon?: string;
    label: string;
    key: string;
  }[];
}>();

const emit = defineEmits<{
  (e: "select", key: string): void;
}>();

const activeTab = defineModel<string>();

const viewTabs = ref<Record<string, boolean>>({});

watch(
  activeTab,
  (newVal) => {
    if (!newVal) return;

    viewTabs.value[newVal] = true;
  },
  { immediate: true }
);

const selectTab = (key: string) => {
  activeTab.value = key;
  emit("select", key);
};
</script>

<template>
  <div class="admin-tab">
    <div class="header">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="item"
        :class="{ '-active': activeTab === tab.key }"
        @click="selectTab(tab.key)"
      >
        <fa-icon v-if="tab.icon" :icon="tab.icon" />
        <span class="text">{{ tab.label }}</span>
      </div>
    </div>
    <div
      v-for="tab in tabs"
      :key="tab.key"
      :class="['content', { '-active': activeTab === tab.key }]"
    >
      <slot
        :name="tab.key"
        :isShow="viewTabs[tab.key]"
        :isActive="viewTabs[tab.key]"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: $radius-md;
  overflow: hidden;
  > .header {
    display: flex;
    flex-direction: row;
    gap: $spacing-sm;
    background: #eee;
    padding: $spacing-sm;
    padding-bottom: 0px;
  }
  > .header > .item {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md $spacing-lg;
    border-radius: $radius-md $radius-md 0 0;
    cursor: pointer;
    background: transparent;
    transition: all 0.2s ease-in-out;
    &.-active {
      background: $white;
      border-color: $color-border;
    }
  }
  > .content {
    flex-grow: 1;
    border: 1px solid $color-border;
    border-top: none;
    border-radius: 0 0 $radius-md $radius-md;
    // padding: $spacing-sm $spacing-sm;
    &.-active {
      display: block;
    }
    &:not(.-active) {
      display: none;
    }
  }
}
</style>
