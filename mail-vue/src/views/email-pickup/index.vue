<template>
  <div class="pickup-page">
    <div class="pickup-header">
      <div>
        <h2>{{ t('mailPickup') }}</h2>
        <p>{{ t('mailPickupDesc') }}</p>
      </div>
    </div>

    <div class="pickup-panel">
      <div class="panel-title panel-title-inline">
        <span>{{ t('apiKey') }}</span>
        <el-button size="small" @click="generateApiKey">{{ t('generateApiKey') }}</el-button>
      </div>
      <p class="api-key-desc">{{ t('pickupApiKeyDesc') }}</p>
      <div class="api-key-actions">
        <el-input v-model="apiKeyForm.apiKey" :placeholder="t('apiKey')" show-password clearable />
        <el-button type="primary" :loading="apiKeyLoading" @click="saveApiKey">{{ t('saveApiKey') }}</el-button>
        <el-button :disabled="!apiKeyForm.apiKey" @click="copyText(apiKeyForm.apiKey)">{{ t('copy') }}</el-button>
        <el-button :loading="apiKeyLoading" @click="clearApiKey">{{ t('clearApiKey') }}</el-button>
      </div>
    </div>

    <div class="pickup-panel">
      <el-form label-position="top" class="form-grid">
        <el-form-item :label="t('domain')">
          <el-select v-model="form.domain" :placeholder="t('select')" class="full-width">
            <el-option
                v-for="domain in domainList"
                :key="domain"
                :label="domain"
                :value="domain"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('toEmail')">
          <el-input v-model="form.email" :placeholder="t('toEmail')" clearable>
            <template #append>
              <el-button @click="generateEmail">{{ t('generate') }}</el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item :label="t('sendEmailAddress')">
          <el-input v-model="form.sendEmail" :placeholder="t('optional')" clearable />
        </el-form-item>

        <el-form-item :label="t('mailCount')">
          <el-input-number v-model="form.n" :min="1" :max="50" class="full-width" />
        </el-form-item>
      </el-form>

      <div class="actions">
        <el-button type="primary" :loading="messagesLoading" @click="fetchMessages">
          {{ t('fetchMessages') }}
        </el-button>
        <el-button :loading="codeLoading" @click="fetchCode">
          {{ t('fetchLatestCode') }}
        </el-button>
        <el-button :disabled="!form.email" @click="copyText(form.email)">
          {{ t('copyEmail') }}
        </el-button>
      </div>
    </div>

    <div class="result-layout">
      <div class="code-panel">
        <div class="panel-title">{{ t('latestCode') }}</div>
        <div class="code-value" :class="codeResult.code ? '' : 'empty-code'">
          {{ codeResult.code || t('noCodeFound') }}
        </div>
        <div v-if="codeResult.emailId" class="code-meta">
          <span>#{{ codeResult.emailId }}</span>
          <span>{{ codeResult.sendEmail }}</span>
          <span>{{ codeResult.createTime }}</span>
        </div>
        <el-button class="copy-code" :disabled="!codeResult.code" @click="copyText(codeResult.code)">
          {{ t('copyCode') }}
        </el-button>
      </div>

      <div class="messages-panel">
        <div class="panel-title">{{ t('pickupMessages') }}</div>
        <el-table
            :data="messages"
            height="100%"
            :empty-text="messagesLoading ? '' : t('noMessagesFound')"
            v-loading="messagesLoading"
            element-loading-background="transparent"
            @row-click="openMessage"
        >
          <el-table-column prop="emailId" label="ID" width="85" />
          <el-table-column prop="sendEmail" :label="t('sendEmailAddress')" min-width="190" show-overflow-tooltip />
          <el-table-column prop="subject" :label="t('subject')" min-width="220" show-overflow-tooltip />
          <el-table-column prop="code" :label="t('code')" width="110" show-overflow-tooltip />
          <el-table-column prop="createTime" :label="t('date')" width="170" show-overflow-tooltip />
        </el-table>
      </div>
    </div>

    <el-dialog v-model="messageDialog" :title="currentMessage.subject || t('noSubject')" width="680">
      <div class="message-detail">
        <div><span>{{ t('from') }}:</span> {{ currentMessage.sendEmail }}</div>
        <div><span>{{ t('recipient') }}:</span> {{ currentMessage.toEmail }}</div>
        <div><span>{{ t('date') }}:</span> {{ currentMessage.createTime }}</div>
        <div v-if="currentMessage.code"><span>{{ t('code') }}:</span> {{ currentMessage.code }}</div>
      </div>
      <pre class="message-text">{{ currentMessage.text || currentMessage.content || '' }}</pre>
    </el-dialog>
  </div>
</template>

<script setup>
import {computed, onMounted, reactive, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useSettingStore} from '@/store/setting.js';
import {
  allEmailLatestCode,
  allEmailMessages,
  allEmailPickupApiKey,
  allEmailPickupSetApiKey
} from '@/request/all-email-pickup.js';

defineOptions({
  name: 'email-pickup'
})

const {t} = useI18n();
const settingStore = useSettingStore();
const domainList = computed(() => settingStore.domainList || []);
const messages = ref([]);
const messagesLoading = ref(false);
const codeLoading = ref(false);
const apiKeyLoading = ref(false);
const messageDialog = ref(false);
const currentMessage = ref({});
const codeResult = reactive({
  code: '',
  emailId: '',
  sendEmail: '',
  createTime: ''
});

const form = reactive({
  domain: domainList.value[0] || '',
  email: '',
  sendEmail: '',
  n: 1
});

const apiKeyForm = reactive({
  apiKey: ''
});

onMounted(() => {
  loadApiKey();
});

watch(domainList, (list) => {
  if (!form.domain && list.length > 0) {
    form.domain = list[0];
  }
});

function generateEmail() {
  if (!form.domain) {
    ElMessage({
      message: t('domainDesc'),
      type: 'warning',
      plain: true
    });
    return;
  }

  form.email = randomPrefix(12) + form.domain;
}

function randomPrefix(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => chars[byte % chars.length]).join('');
}

function randomToken(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => chars[byte % chars.length]).join('');
}

async function loadApiKey() {
  const data = await allEmailPickupApiKey();
  apiKeyForm.apiKey = data?.apiKey || '';
}

function generateApiKey() {
  apiKeyForm.apiKey = randomToken(32);
}

async function saveApiKey() {
  apiKeyLoading.value = true;
  try {
    const data = await allEmailPickupSetApiKey(apiKeyForm.apiKey);
    apiKeyForm.apiKey = data?.apiKey || '';
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true
    });
  } finally {
    apiKeyLoading.value = false;
  }
}

async function clearApiKey() {
  apiKeyLoading.value = true;
  try {
    await allEmailPickupSetApiKey('');
    apiKeyForm.apiKey = '';
    ElMessage({
      message: t('clearSuccess'),
      type: 'success',
      plain: true
    });
  } finally {
    apiKeyLoading.value = false;
  }
}

function checkEmail() {
  if (!form.email) {
    ElMessage({
      message: t('emptyEmailMsg'),
      type: 'warning',
      plain: true
    });
    return false;
  }

  return true;
}

async function fetchMessages() {
  if (!checkEmail()) return;

  messagesLoading.value = true;
  try {
    messages.value = await allEmailMessages(form.email, form.n, form.sendEmail || undefined);
  } finally {
    messagesLoading.value = false;
  }
}

async function fetchCode() {
  if (!checkEmail()) return;

  codeLoading.value = true;
  try {
    const data = await allEmailLatestCode(form.email, form.sendEmail || undefined);
    codeResult.code = data?.code || '';
    codeResult.emailId = data?.emailId || '';
    codeResult.sendEmail = data?.sendEmail || '';
    codeResult.createTime = data?.createTime || '';
  } finally {
    codeLoading.value = false;
  }
}

function openMessage(row) {
  currentMessage.value = row;
  messageDialog.value = true;
}

async function copyText(text) {
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    ElMessage({
      message: t('copySuccessMsg'),
      type: 'success',
      plain: true
    });
  } catch (e) {
    ElMessage({
      message: t('copyFailMsg'),
      type: 'error',
      plain: true
    });
  }
}
</script>

<style scoped lang="scss">
.pickup-page {
  height: 100%;
  overflow: auto;
  padding: 20px;
  box-sizing: border-box;
  background: var(--el-bg-color);
}

.pickup-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;

  h2 {
    margin: 0;
    font-size: 20px;
    line-height: 28px;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 4px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 20px;
  }
}

.pickup-panel,
.code-panel,
.messages-panel {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.pickup-panel {
  padding: 16px;
  margin-bottom: 16px;
}

.panel-title-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 0 12px;
  border-bottom: 0;
}

.api-key-desc {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 20px;
}

.api-key-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  gap: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.full-width {
  width: 100%;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.result-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 16px;
  min-height: 430px;
}

.panel-title {
  padding: 12px 14px;
  border-bottom: 1px solid var(--el-border-color);
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.code-panel {
  min-height: 220px;
}

.code-value {
  padding: 28px 14px 10px;
  font-size: 30px;
  font-weight: 700;
  line-height: 38px;
  color: var(--el-color-primary);
  word-break: break-all;
}

.empty-code {
  font-size: 14px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.code-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 14px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.copy-code {
  margin: 16px 14px;
}

.messages-panel {
  min-width: 0;
}

.message-detail {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--el-text-color-regular);

  span {
    color: var(--el-text-color-secondary);
  }
}

.message-text {
  max-height: 360px;
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

@media (max-width: 1024px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .result-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .pickup-page {
    padding: 12px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    .el-button {
      width: 100%;
      margin-left: 0;
    }
  }

  .api-key-actions {
    grid-template-columns: 1fr;
  }
}
</style>
