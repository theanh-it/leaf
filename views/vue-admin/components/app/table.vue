<script setup lang="ts">
defineProps<{
  headers?: string[];
  rows: any[];
  height?: string;
  hiddenBorder?: boolean;
  hiddenRadius?: boolean;
}>();
</script>

<template>
  <div
    class="admin-table"
    :class="{
      '-hidden-border': hiddenBorder,
      '-hidden-radius': hiddenRadius,
      '-height': height,
    }"
    :style="{ height: height }"
  >
    <table class="table">
      <thead v-if="headers">
        <tr>
          <th v-for="value in headers" :key="value">
            <div class="col -th">{{ value }}</div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="index">
          <slot name="row" :row="row" :index="index" />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.admin-table {
  width: 100%;
  background: $white;
  overflow: hidden;
  overflow-x: auto;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  &.-hidden-border {
    border: none;
  }
  &.-hidden-radius {
    border-radius: 0;
  }
  &.-height {
    height: v-bind(height);
    overflow: auto;
  }
  > .table {
    width: 100%;
    min-width: max-content;
    border-collapse: collapse;
    font-size: $font-size-md;
  }
}

tr:nth-child(2n) {
  background: #f9fafb;
}

tr:nth-child(2n + 1) {
  background: #fff;
}

th {
  font-weight: 600;
  color: #6b7280;
  background: #f9fafb;
  font-size: 12px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  padding: $space-md $space-md;
  border-bottom: 1px solid $color-border;
  text-align: left;
}

tr:last-child :deep(td) {
  border-bottom: none;
}
</style>
