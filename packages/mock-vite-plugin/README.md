# warehouse-mock-vite

Warehouse Mock 的 **Vite 插件**，专为 **Vue3 + Vite** 项目设计。与 Webpack 版本共享同一套核心引擎（[`warehouse-mock-core`](../mock-core)），提供完全一致的 Mock 能力：

- 🚀 极简配置，仅需把插件加入 `plugins`
- 🎯 零业务侵入，RPC 风格接口原生支持
- 🔥 多场景 / 接口级延时 / 启用开关（与 Webpack 版数据格式完全一致）
- 🌐 代理模式，未匹配请求转发到真实 API
- 🎨 内置可视化管理后台（默认端口 3100）
- 🔧 自动注入环境变量 `import.meta.env.VITE_MOCK`

---

## 📦 安装

```bash
npm install warehouse-mock-vite --save-dev
```

---

## 🚀 快速开始

### 1️⃣ 配置 vite.config.js / vite.config.ts

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { warehouseMockVite } from 'warehouse-mock-vite';

const isMock = process.env.MOCK === 'true';

export default defineConfig({
  plugins: [
    vue(),
    ...(isMock ? [warehouseMockVite()] : []),
  ],
});
```

### 2️⃣ 切换 API 配置

```javascript
// src/const/config.js
const config = {};

// ⭐ 插件自动注入 import.meta.env.VITE_MOCK
if (import.meta.env.VITE_MOCK === 'true') {
  config.API = '/mock-api';            // Mock 模式
} else {
  config.API = 'https://your-api.com'; // 真实 API
}

export default config;
```

### 3️⃣ 添加 Mock 脚本

```json
{
  "scripts": {
    "dev": "vite",
    "mock": "MOCK=true vite"
  }
}
```

### 4️⃣ 启动

```bash
npm run mock
```

- 前端应用：`http://localhost:5173`（你的 Vite 端口）
- 管理后台：`http://localhost:3100`
- 调试端点：`http://localhost:5173/__mock_list__`

---

## ⚙️ 配置选项

```javascript
warehouseMockVite({
  // Mock 数据目录，默认 'warehouseMock'
  mockPath: 'warehouseMock',

  // 需要拦截的 API 路径前缀，默认 ['/api', '/mock-api']
  apiPrefixes: ['/api', '/mock-api'],

  // 本地代理路径前缀，默认 '/mock-api'
  localApiPrefix: '/mock-api',

  // 是否启用，默认 true
  enabled: true,

  // 是否注入环境变量，默认 true
  injectEnv: true,

  // 注入到 import.meta.env 的键名，默认 'VITE_MOCK'
  envKey: 'VITE_MOCK',

  // 全局响应延迟（毫秒），默认 0
  delay: 0,

  // 代理配置：未匹配的请求转发到真实 API
  proxy: {
    target: 'https://dev-api.example.com',
    changeOrigin: true,
  },

  // 管理后台配置
  admin: {
    enabled: true,
    port: 3100,
  },
});
```

---

## 📁 Mock 数据格式

与 Webpack 版本完全一致，详见根目录 [README](../../README.md) 和核心包说明。

```
warehouseMock/
└── user.account.getInfo/
    ├── .config.json   # { name, delay, enabled, activeScene }
    └── default.json   # 场景数据
```

---

## 🔗 与 Webpack 版本的区别

| 项 | Webpack (`warehouse-mock`) | Vite (`warehouse-mock-vite`) |
|---|---|---|
| 挂载方式 | `vue.config.js` 中 `setupMiddlewares` / `before` | 直接加入 `plugins` |
| 环境变量 | `process.env.VUE_APP_MOCK` | `import.meta.env.VITE_MOCK` |
| 核心引擎 | `warehouse-mock-core` | `warehouse-mock-core`（共享） |

---

## 📄 License

MIT © CodeMomentYY
