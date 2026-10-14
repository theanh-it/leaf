<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { HTTPError } from "ky";

import ButtonApp from "@fe-admin/components/app/button.vue";
import { backupsApi } from "@fe-admin/apis/backups";
import { API_ERROR_MESSAGE } from "@fe-admin/constants/api-message";
import { useValidate } from "@fe-admin/composables/validate";
import { customRule, requiredRule } from "@fe-admin/helpers/validate-rule";
import type { RestoreJob, RestorePhase } from "@fe-admin/types/backup";
import type { ResponseApi } from "@fe-admin/types/api";

const open = defineModel<boolean>({ default: false });
const emit = defineEmits<{ restored: [] }>();
const panel = ref<HTMLElement | null>(null);
const form = ref({ database: null as File | null, files: null as File | null });
const job = ref<RestoreJob | null>(null);
const uploading = ref(false);
const message = ref("");
const connectionMessage = ref("");
const busy = computed(() => uploading.value || job.value?.status === "running");
const successful = computed(() => job.value?.status === "success");
const rules = computed(() => ({
  database: {
    ...requiredRule("backup database"),
    ...customRule(
      (file: File | null) =>
        !file || (file.size > 0 && file.name.toLowerCase().endsWith(".dump")),
      "Chọn file database .dump không rỗng."
    ),
  },
  files: {
    ...requiredRule("backup files"),
    ...customRule(
      (file: File | null) =>
        !file || (file.size > 0 && file.name.toLowerCase().endsWith(".tar.gz")),
      "Chọn file backup files .tar.gz không rỗng."
    ),
  },
}));
const { v$, errors, setApiErrors } = useValidate(form, rules);
const phaseLabels: Record<RestorePhase, string> = {
  preparing: "Đang lưu file backup trên máy chủ…",
  validating: "Đang kiểm tra database và giải nén files…",
  files: "Đang thay thế thư mục files…",
  database: "Đang khôi phục database…",
  completed: "Khôi phục hoàn tất.",
};
const progressLabel = computed(() =>
  uploading.value
    ? "Đang tải 2 file lên máy chủ…"
    : job.value
      ? phaseLabels[job.value.phase]
      : ""
);

let pollTimer: ReturnType<typeof setTimeout> | undefined;
let disposed = false;
let previousFocus: HTMLElement | null = null;

const selectFile = (event: Event, kind: "database" | "files") => {
  const input = event.target as HTMLInputElement;
  form.value[kind] = input.files?.[0] ?? null;
  setApiErrors({});
  message.value = "";
};

const handleRestore = async () => {
  if (busy.value) return;
  setApiErrors({});
  if (
    !(await v$.value.$validate()) ||
    !form.value.database ||
    !form.value.files
  )
    return;

  uploading.value = true;
  const requestId = crypto.randomUUID();
  job.value = { id: requestId, status: "running", phase: "preparing" };
  message.value = "";

  try {
    const response = await backupsApi.restore(
      form.value.database,
      form.value.files,
      requestId
    );
    job.value = response.result;
    schedulePoll();
  } catch (error) {
    if (error instanceof HTTPError) {
      job.value = null;
      const response = await error.response
        .json<ResponseApi<Record<string, string>>>()
        .catch(() => null);
      if (response?.result) setApiErrors(response.result);
      message.value =
        API_ERROR_MESSAGE[response?.message ?? ""] ??
        "Không thể tải backup lên máy chủ.";
    } else {
      message.value =
        "Mất kết nối khi gửi backup. Đang kiểm tra xem máy chủ đã bắt đầu khôi phục chưa…";
    }
    // Không gửi lại POST: máy chủ có thể đã nhận đủ file trước khi mất kết nối.
    await readStatus(error instanceof HTTPError);
  } finally {
    uploading.value = false;
  }
};

const schedulePoll = () => {
  if (disposed) return;
  clearTimeout(pollTimer);
  pollTimer = setTimeout(() => {
    void readStatus();
  }, 1500);
};

const readStatus = async (discover = false) => {
  try {
    const response = await backupsApi.restoreStatus();
    if (disposed) return;
    connectionMessage.value = "";
    const latest = response.result;
    if (discover && latest?.status !== "running") return;
    if (!latest || (!discover && job.value && latest.id !== job.value.id)) {
      message.value =
        "Không tìm thấy tiến trình khôi phục. Máy chủ có thể đã khởi động lại; hãy kiểm tra dữ liệu trước khi thử lại.";
      if (job.value) job.value = { ...job.value, status: "error" };
      return;
    }
    const wasRunning = job.value?.status === "running";
    job.value = latest;
    open.value = true;
    message.value = latest.errorCode
      ? (API_ERROR_MESSAGE[latest.errorCode] ?? "Khôi phục không thành công.")
      : "";
    if (latest.status === "running") schedulePoll();
    if (latest.status === "success" && wasRunning) emit("restored");
  } catch {
    if (disposed) return;
    if (job.value?.status === "running") {
      connectionMessage.value =
        "Mất kết nối theo dõi. Máy chủ có thể vẫn đang khôi phục; đang kết nối lại…";
      schedulePoll();
    }
  }
};

const close = () => {
  if (!busy.value) open.value = false;
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
  }
  if (event.key !== "Tab" || !panel.value) return;
  const focusable = Array.from(
    panel.value.querySelectorAll<HTMLElement>(
      "button:not(:disabled), input:not(:disabled), [tabindex='0']"
    )
  );
  const first = focusable[0] ?? panel.value;
  const last = focusable[focusable.length - 1] ?? panel.value;
  if (
    event.shiftKey &&
    (document.activeElement === first || document.activeElement === panel.value)
  ) {
    event.preventDefault();
    last.focus();
  } else if (
    !event.shiftKey &&
    (document.activeElement === last || document.activeElement === panel.value)
  ) {
    event.preventDefault();
    first.focus();
  }
};

watch(open, async (value) => {
  if (value) {
    previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (!busy.value) {
      form.value = { database: null, files: null };
      job.value = null;
      message.value = "";
      connectionMessage.value = "";
      setApiErrors({});
      v$.value.$reset();
      void readStatus(true);
    }
    await nextTick();
    panel.value?.focus();
  } else {
    previousFocus?.focus();
  }
});

onMounted(() => {
  void readStatus(true);
});
onBeforeUnmount(() => {
  disposed = true;
  clearTimeout(pollTimer);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="restore-layer">
      <div class="restore-overlay" @click.self="close" @keydown="handleKeydown">
        <section
          ref="panel"
          class="restore-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Khôi phục backup"
          tabindex="-1"
          :aria-busy="busy"
        >
          <div class="header">
            <h2 class="title">Khôi phục backup</h2>
            <ButtonApp
              type="button"
              size="sm"
              icon="xmark"
              aria-label="Đóng modal"
              :disabled="busy"
              @click="close"
            />
          </div>
          <p class="warning">
            Database và files hiện tại sẽ được thay thế. Chọn hai file thuộc
            cùng lần backup và từ nguồn bạn tin cậy.
          </p>
          <form class="restore-form" @submit.prevent="handleRestore">
            <label class="field">
              <span class="label">Backup database (.dump)</span>
              <input
                class="input"
                type="file"
                accept=".dump"
                :disabled="busy || successful"
                @change="selectFile($event, 'database')"
              />
              <span v-if="errors.database" class="error">{{
                errors.database
              }}</span>
            </label>
            <label class="field">
              <span class="label">Backup files (.tar.gz)</span>
              <input
                class="input"
                type="file"
                accept=".tar.gz"
                :disabled="busy || successful"
                @change="selectFile($event, 'files')"
              />
              <span v-if="errors.files" class="error">{{ errors.files }}</span>
            </label>
            <div
              v-if="busy || successful"
              class="restore-progress"
              aria-live="polite"
            >
              <p class="label">{{ progressLabel }}</p>
              <progress
                class="bar"
                :value="successful ? 100 : undefined"
                max="100"
                aria-label="Tiến trình khôi phục"
              />
              <p v-if="busy" class="hint">
                Vui lòng chờ hoàn tất. Khi đã tiếp nhận file, máy chủ sẽ tiếp
                tục khôi phục nếu bạn rời trang.
              </p>
              <p v-if="successful" class="hint">
                Tài khoản và mật khẩu cũng được khôi phục theo bản backup. Bạn
                nên đăng nhập lại.
              </p>
            </div>
            <p v-if="connectionMessage" class="notice" role="status">
              {{ connectionMessage }}
            </p>
            <p v-if="message" class="error" role="alert">{{ message }}</p>
            <div class="footer">
              <ButtonApp
                type="button"
                label="Đóng"
                :disabled="busy"
                @click="close"
              />
              <ButtonApp
                v-if="!successful"
                type="submit"
                color="danger"
                icon="database"
                :label="busy ? 'Đang xử lý…' : 'Khôi phục và thay thế dữ liệu'"
                :disabled="busy"
              />
            </div>
          </form>
        </section>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.restore-layer {
  > .restore-overlay {
    position: fixed;
    inset: 0;
    z-index: $z-index-modal;
  }
}

.restore-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-md;
  background: $bg-modal;

  > .restore-dialog {
    width: min(100%, 560px);
    max-height: 90vh;
    overflow-y: auto;
  }
}

.restore-dialog {
  padding: $space;
  border-radius: $radius-lg;
  background: $white;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  outline: none;
  display: flex;
  flex-direction: column;
  gap: $space-md;

  > .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $space-sm;
  }

  > .header > .title {
    margin: 0;
    font-size: $font-size-xl;
  }

  > .warning {
    margin: 0;
    padding: $space-sm $space-md;
    border-radius: $radius-md;
    background: material-color(amber, 50);
    color: material-color(amber, 900);
    font-size: $font-size-md;
    line-height: 1.6;
  }
}

.restore-form {
  display: flex;
  flex-direction: column;
  gap: $space-md;

  > .field {
    display: flex;
    flex-direction: column;
    gap: $space-sm;
  }

  > .field > .label {
    font-weight: $font-weight-bold;
  }
  > .field > .input {
    padding: $space-sm;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    min-width: 0;
  }
  > .field > .error,
  > .error {
    color: $color-error;
    font-size: $font-size-sm;
  }
  > .notice {
    color: $color-warning-hover;
    font-size: $font-size-sm;
  }
  > .footer {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: $space-sm;
  }
  > .restore-progress > .bar {
    width: 100%;
    height: 12px;
  }
}

.restore-progress {
  display: flex;
  flex-direction: column;
  gap: $space-sm;
  padding: $space-md;
  border-radius: $radius-md;
  background: $color-bg-subtle;

  > .label {
    margin: 0;
    font-weight: $font-weight-bold;
    font-size: $font-size-md;
  }
  > .bar {
    accent-color: $color-primary;
  }
  > .hint {
    margin: 0;
    color: $color-text-muted;
    font-size: $font-size-sm;
    line-height: 1.6;
  }
}
</style>
