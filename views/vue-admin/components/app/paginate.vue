<script setup lang="ts">
import { computed } from "vue";
const { page, totalRecords, totalPages } = defineProps<{
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  (e: "run-page", page: number): void;
}>();

const items = computed(() => {
  const pages = [];

  if (page > 1) {
    pages.push({
      type: "prev",
      page: page - 1,
    });
  }

  let beginBack = page - 2;
  let endBack = page - 1;
  let beginForward = page + 1;
  let endForward = page + 2;

  if (beginBack <= 0) {
    endForward = endForward + Math.abs(beginBack - 1);
    beginBack = 1;
  }

  if (endForward > totalPages) {
    beginBack = beginBack - (endForward - totalPages);
    endForward = totalPages;
  }

  if (page - beginBack > 1 && beginBack > 0) {
    const _beginBack = page - 10;

    if (_beginBack > 0) {
      pages.push({
        type: "more",
        page: _beginBack,
      });
    }
  }

  // Generate before page
  if (beginBack > 0) {
    for (let i = beginBack; i <= endBack; i++) {
      pages.push({
        type: "page",
        page: i,
      });
    }
  }

  pages.push({
    type: "page",
    page: page,
  });

  // Generate after page
  for (let i = beginForward; i <= endForward; i++) {
    pages.push({
      type: "page",
      page: i,
    });
  }

  if (endForward < totalPages) {
    const _endForward = page + 10;

    if (_endForward <= totalPages) {
      pages.push({
        type: "more",
        page: _endForward,
      });
    }
  }

  if (endForward < totalPages) {
    pages.push({
      type: "next",
      page: page + 1,
    });
  }

  return pages;
});

const handlePageClick = (pageNumber: number) => {
  emit("run-page", pageNumber);
};
</script>

<template>
  <div class="admin-paginate">
    <div class="info">
      <span>Trang {{ page }}/{{ totalPages }}</span>
      <span>({{ totalRecords }} bản ghi)</span>
    </div>
    <template v-if="totalPages > 1">
      <div
        v-for="item in items"
        :class="['item', `-${item.type}`, { '-active': page === item.page }]"
        @click="handlePageClick(item.page)"
      >
        <span v-if="item.type === 'page'">{{ item.page }}</span>
        <span v-else-if="item.type === 'more'">...</span>
        <fa-icon
          v-else-if="item.type === 'prev'"
          icon="chevron-left"
          style="font-size: 20px"
        />
        <fa-icon
          v-else-if="item.type === 'next'"
          icon="chevron-right"
          style="font-size: 20px"
        />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.admin-paginate {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: $space-sm;
  padding: $space-sm;
  > .item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    width: 32px;
    cursor: pointer;
    padding: $space-xs $space-sm;
    border-radius: $radius-sm;
    border: 1px solid $color-border;
    &:hover {
      background: $color-bg-subtle;
    }
    &.-active {
      background: $color-primary;
      color: $white;
    }
    &.-prev {
      background: $color-bg-subtle;
    }
    &.-next {
      background: $color-bg-subtle;
    }
  }
  > .info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-sm;
    padding: $space-xs $space-sm;
  }
}
</style>
