<script setup lang="ts">
import ButtonApp from "@fe-admin/components/app/button.vue";

import { usePageInfo } from "@fe-admin/composables/page";

const { pageInfo } = usePageInfo();
</script>

<template>
  <div class="header-default">
    <div class="info">
      <h3 class="title">{{ pageInfo.title }}</h3>
      <div class="breadcrumb">
        <template
          v-for="(crumb, index) in pageInfo.breadcrumbs"
          :key="`${crumb.label}-${index}`"
        >
          <RouterLink v-if="crumb.to" :to="crumb.to" class="crumb-link">
            <fa-icon v-if="index === 0" icon="home" class="icon" />
            <span>{{ crumb.label }}</span>
          </RouterLink>
          <span v-else class="crumb-current">
            <fa-icon v-if="index === 0" icon="home" />
            <span>{{ crumb.label }}</span>
          </span>
          <fa-icon
            v-if="index < pageInfo.breadcrumbs.length - 1"
            icon="chevron-right"
            class="crumb-sep"
          />
        </template>
      </div>
    </div>
    <div class="actions">
      <ButtonApp
        icon="bell"
        color="primary"
        variant="filled"
        radius="full"
        :badge="10"
      />
      <ButtonApp
        icon="message"
        color="primary"
        variant="filled"
        radius="full"
        :badge="10"
      />
      <ButtonApp icon="user" color="primary" variant="filled" radius="full" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.header-default {
  position: sticky;
  top: 0;
  z-index: $z-index-header;
  width: 100%;
  display: flex;
  gap: $space;
  padding: $space;
  box-shadow: 0 1px 3px #00000014;
  background-color: $white;
  > .info {
    display: flex;
    flex-direction: column;
    gap: $space-sm;
  }
  > .info > .title {
    font-size: $font-size-xl;
    font-weight: 600;
    color: $black;
  }
  > .info > .breadcrumb {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $space-sm;
    font-size: $font-size-sm;
  }
}

.crumb-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: material-color(blue, 700);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
  > .icon {
    font-size: $font-size-sm;
  }
}

.crumb-current {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: material-color(grey, 700);
}

.crumb-sep {
  color: material-color(grey, 500);
  font-size: $font-size-xs;
}

.header-default > .actions {
  flex-grow: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: $space;
}
</style>
