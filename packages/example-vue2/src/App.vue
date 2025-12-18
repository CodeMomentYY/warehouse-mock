<template>
  <div id="app">
    <h1>Warehouse Mock 示例</h1>
    <p class="subtitle">模拟 AppPlatformH5 的 RPC 风格接口</p>
    
    <div class="actions">
      <button @click="fetchUserInfo">获取用户信息</button>
      <button @click="fetchPointInfo">获取积分信息</button>
    </div>

    <div class="info-box">
      <h3>📝 当前配置</h3>
      <p><strong>Mock 模式:</strong> {{ isMockMode ? '✅ 已启用' : '❌ 未启用' }}</p>
      <p><strong>API 地址:</strong> {{ apiUrl }}</p>
      <p class="tip">💡 提示: 运行 <code>npm run mock</code> 启用 Mock 模式</p>
    </div>

    <div v-if="loading" class="loading">⏳ 加载中...</div>
    
    <div v-if="error" class="error">
      ❌ {{ error }}
    </div>

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

<script>
import { getUserInfo, getPointInfo, getWelfareBanner } from '@/api/utils';
import config from '@/const/config';

export default {
  name: 'App',
  data() {
    return {
      userData: null,
      pointData: null,
      loading: false,
      error: null
    };
  },
  computed: {
    isMockMode() {
      return process.env.VUE_APP_MOCK === 'true';
    },
    apiUrl() {
      return config.API;
    }
  },
  methods: {
    async fetchUserInfo() {
      try {
        this.loading = true;
        this.error = null;
        // 调用 RPC 风格接口: /mock-api?user.account.getInfo
        const response = await getUserInfo();
        this.userData = response.data;
      } catch (err) {
        this.error = '获取用户信息失败: ' + err.message;
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    async fetchPointInfo() {
      try {
        this.loading = true;
        this.error = null;
        // 调用 RPC 风格接口: /mock-api?user.taurus.pointInfo
        const response = await getPointInfo();
        this.pointData = response.data;
      } catch (err) {
        this.error = '获取积分信息失败: ' + err.message;
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
  }
}
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
}

h1 {
  color: #2c3e50;
  margin-bottom: 8px;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 24px;
}

.info-box {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.info-box h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
}

.info-box p {
  margin: 8px 0;
  font-size: 14px;
}

.info-box code {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.info-box .tip {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 13px;
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
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #2980b9;
}

.loading {
  color: #7f8c8d;
  padding: 20px;
}

.error {
  background: #fee;
  color: #c00;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.result {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.result h3 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 14px;
}

.result pre {
  margin: 0;
  background: #2c3e50;
  color: #ecf0f1;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 13px;
}
</style>
