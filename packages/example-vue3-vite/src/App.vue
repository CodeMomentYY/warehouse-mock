<template>
  <div id="app">
    <h1>🎉 Warehouse Mock - Vue3 + Vite 示例</h1>
    <p class="subtitle">同一套核心引擎，Vite 插件零业务侵入</p>

    <div class="info-box">
      <h3>📝 当前配置</h3>
      <p><strong>Mock 模式:</strong> {{ isMockMode ? '✅ 已启用' : '❌ 未启用' }}</p>
      <p><strong>API 地址:</strong> <code>{{ apiUrl }}</code></p>
      <p class="tip">💡 运行 <code>npm run mock</code> 启用 Mock 模式</p>
      <p class="tip">🔍 访问 <a href="/__mock_list__" target="_blank">/__mock_list__</a> 查看可用接口</p>
    </div>

    <div class="actions">
      <button @click="fetchUserInfo" :disabled="loading">
        {{ loading ? '⏳ 加载中...' : '👤 获取用户信息' }}
      </button>
      <button @click="fetchPointInfo" :disabled="loading">
        {{ loading ? '⏳ 加载中...' : '💎 获取积分信息' }}
      </button>
    </div>

    <div v-if="error" class="error">❌ {{ error }}</div>

    <div v-if="userData" class="result">
      <h3>👤 用户信息 (user.account.getInfo)</h3>
      <pre>{{ JSON.stringify(userData, null, 2) }}</pre>
    </div>

    <div v-if="pointData" class="result">
      <h3>💎 积分信息 (user.taurus.pointInfo)</h3>
      <pre>{{ JSON.stringify(pointData, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getUserInfo, getPointInfo } from '@/api/utils';
import config from '@/const/config';

const userData = ref(null);
const pointData = ref(null);
const loading = ref(false);
const error = ref(null);

const isMockMode = computed(() => import.meta.env.VITE_MOCK === 'true');
const apiUrl = computed(() => config.API);

async function fetchUserInfo() {
  try {
    loading.value = true;
    error.value = null;
    const response = await getUserInfo();
    userData.value = response.data;
  } catch (err) {
    error.value = '获取用户信息失败: ' + err.message;
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function fetchPointInfo() {
  try {
    loading.value = true;
    error.value = null;
    const response = await getPointInfo();
    pointData.value = response.data;
  } catch (err) {
    error.value = '获取积分信息失败: ' + err.message;
    console.error(err);
  } finally {
    loading.value = false;
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #2c3e50;
}

h1 {
  font-size: 28px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 32px;
}

.info-box {
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.info-box h3 {
  margin: 0 0 16px 0;
}

.info-box p {
  margin: 10px 0;
  font-size: 14px;
  line-height: 1.6;
}

.info-box code {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.info-box a {
  color: white;
}

.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

button {
  padding: 12px 24px;
  font-size: 14px;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover:not(:disabled) {
  background: #369a6e;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  background: #fee;
  color: #c00;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 4px solid #c00;
}

.result {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #e1e4e8;
}

.result h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
}

.result pre {
  margin: 0;
  background: #2c3e50;
  color: #ecf0f1;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.5;
  font-family: 'Monaco', 'Menlo', monospace;
}
</style>
