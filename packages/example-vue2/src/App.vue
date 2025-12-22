<template>
  <div id="app">
    <h1>🎉 Warehouse Mock 示例</h1>
    <p class="subtitle">极简 Mock 插件，零业务代码侵入</p>
    
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
      <button @click="clearData" class="btn-clear">
        🗑️ 清除数据
      </button>
    </div>

    <div v-if="error" class="error">
      ❌ {{ error }}
    </div>

    <div v-if="userData" class="result">
      <h3>👤 用户信息 (user.account.getInfo)</h3>
      <div class="result-header">
        <span class="badge">RPC 风格</span>
        <span class="badge">GET /mock-api?user.account.getInfo</span>
      </div>
      <pre>{{ JSON.stringify(userData, null, 2) }}</pre>
    </div>

    <div v-if="pointData" class="result">
      <h3>💎 积分信息 (user.taurus.pointInfo)</h3>
      <div class="result-header">
        <span class="badge">RPC 风格</span>
        <span class="badge">GET /mock-api?user.taurus.pointInfo</span>
      </div>
      <pre>{{ JSON.stringify(pointData, null, 2) }}</pre>
    </div>

    <div class="features">
      <h3>✨ 插件特性</h3>
      <ul>
        <li>✅ <strong>零业务侵入</strong> - 只需修改配置文件</li>
        <li>✅ <strong>实时更新</strong> - 修改 Mock 数据后刷新即可</li>
        <li>✅ <strong>按需拦截</strong> - 只拦截配置了 Mock 文件的接口</li>
        <li>✅ <strong>RPC 风格支持</strong> - 完美支持 hellobike 等 RPC 接口</li>
        <li>✅ <strong>代理模式</strong> - 未匹配请求可转发到真实 API</li>
        <li>✅ <strong>极简配置</strong> - vue.config.js 只需 3 行代码</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { getUserInfo, getPointInfo } from '@/api/utils';
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
        const response = await getPointInfo();
        this.pointData = response.data;
      } catch (err) {
        this.error = '获取积分信息失败: ' + err.message;
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    clearData() {
      this.userData = null;
      this.pointData = null;
      this.error = null;
    }
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #2c3e50;
}

h1 {
  font-size: 32px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 32px;
  font-size: 16px;
}

.info-box {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.info-box h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
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
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 13px;
}

.info-box a {
  color: white;
  text-decoration: underline;
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
  font-weight: 500;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

button:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.btn-clear {
  background: #95a5a6;
}

button.btn-clear:hover:not(:disabled) {
  background: #7f8c8d;
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
  color: #2c3e50;
  font-size: 16px;
}

.result-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  background: #e1e4e8;
  color: #586069;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
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
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.features {
  margin-top: 40px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e1e4e8;
}

.features h3 {
  margin-bottom: 16px;
  font-size: 18px;
}

.features ul {
  list-style: none;
  padding: 0;
}

.features li {
  padding: 8px 0;
  font-size: 14px;
  line-height: 1.6;
}

.features strong {
  color: #2c3e50;
}
</style>
