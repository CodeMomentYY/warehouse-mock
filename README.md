# Warehouse Mock - 极简 Vue Mock 插件

<div align="center">

一个专为 **Vue** 项目设计的 **Mock 插件**，零业务代码侵入，完美支持 RPC 风格接口。
**同时支持 Webpack（Vue CLI）和 Vite（Vue 3）两套构建工具**，底层共享同一核心引擎。

[![npm version](https://img.shields.io/npm/v/warehouse-mock.svg)](https://www.npmjs.com/package/warehouse-mock)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[快速开始](#-快速开始) • [特性](#-核心特性) • [配置](#-配置选项) • [示例](#-示例项目)

</div>

---

## 📦 包一览

| 包 | npm 名 | 适用 | 说明 |
|----|--------|------|------|
| **Webpack 插件** | `warehouse-mock` | Vue CLI 3/4/5（Webpack 4/5） | 在 `vue.config.js` 中接入 |
| **Vite 插件** | `warehouse-mock-vite` | Vue 3 + Vite 3/4/5 | 直接加入 `plugins` 数组 |
| **核心引擎** | `warehouse-mock-core` | （内部依赖） | 框架无关的请求拦截/场景/代理逻辑 |
| **管理后台** | `warehouse-mock-admin` | （可选） | 可视化管理 Mock 数据 |

> 两个插件的 Mock 数据格式、多场景、延时、代理、管理后台**完全一致**，因为底层共用 `warehouse-mock-core`。差异仅在于接入方式和环境变量约定。

---

## 🎯 为什么选择 Warehouse Mock？

### 对比主流方案

| 特性 | Warehouse Mock | mock-webpack-plugin | json-server | vite-plugin-mock |
|------|----------------|---------------------|-------------|------------------|
| **零业务侵入** | ✅ 无需改接口代码 | ⚠️ 需要改造 | ❌ 独立服务 | ✅ |
| **RPC 风格支持** | ✅ 原生支持 | ❌ | ❌ | ⚠️ 需配置 |
| **极简配置** | ✅ 3 行代码 | ⚠️ 复杂 | ❌ | ✅ |
| **实时更新** | ✅ 刷新即可 | ✅ | ✅ | ✅ |
| **代理模式** | ✅ 内置 | ❌ | ❌ | ✅ |
| **Webpack 集成** | ✅ | ✅ | ❌ | ❌ (Vite 专用) |
| **Vite 集成** | ✅ (Vue 3) | ❌ | ❌ | ✅ |
| **Vue CLI 优化** | ✅ 自动适配 | ⚠️ | ❌ | ❌ |

---

## ✨ 核心特性

- 🚀 **极简配置** - Webpack 端 3 行代码，Vite 端加一个插件即可
- 🎯 **零业务侵入** - 无需修改接口调用代码
- 🔥 **RPC 风格原生支持** - 完美适配 App H5 等项目
- ⚡️ **实时热更新** - 修改 Mock 数据，刷新页面即可生效
- 🎨 **按需拦截** - 只拦截配置了 Mock 文件的接口
- 🌐 **代理模式** - 未匹配请求可转发到真实 API
- 🔧 **自动注入环境变量** - 无需手动配置 DefinePlugin
- 📦 **TypeScript 编写** - 类型安全，易于维护
- 🔌 **双构建工具** - 同时支持 Webpack 4/5（Vue CLI 3/4/5）与 Vite 3/4/5（Vue 3）

---

## 📦 安装

**Webpack（Vue CLI）项目：**
```bash
npm install warehouse-mock --save-dev
```

**Vite（Vue 3）项目：**
```bash
npm install warehouse-mock-vite --save-dev
```

---

## 🚀 快速开始（Webpack / Vue CLI）

> Vite 项目请直接看下方 [Vue 3 + Vite 快速开始](#-快速开始vue-3--vite)。

### 1️⃣ 配置 vue.config.js

只需 **3 行核心代码**：

```javascript
// vue.config.js
const WarehouseMockPlugin = require('warehouse-mock');

const isMock = process.env.MOCK === 'true';

module.exports = {
  configureWebpack: config => {
    if (isMock) {
      config.plugins.push(new WarehouseMockPlugin());
    }
  }
};
```

> 💡 **就这么简单！** 插件会自动处理：
> - ✅ 注入 `VUE_APP_MOCK` 环境变量
> - ✅ 配置 `devServer` 中间件（兼容 Webpack 4/5）
> - ✅ 创建 `warehouseMock` 目录

### 2️⃣ 切换 API 配置

在你的 `src/const/config.js` 中添加判断：

```javascript
const config = { env: process.env.VUE_APP_ENV || 'dev' };

// ⭐ Mock 模式优先判断（插件自动注入）
if (process.env.VUE_APP_MOCK === 'true') {
  config.API = '/mock-api';  // 指向本地
} else {
  config.API = 'https://dev-api.xxx.com/api';  // 真实 API
}

export default config;
```

### 3️⃣ 添加 Mock 脚本

在 `package.json` 中：

```json
{
  "scripts": {
    "mock": "MOCK=true vue-cli-service serve"
  }
}
```

### 4️⃣ 创建 Mock 数据

在项目根目录创建 `warehouseMock` 文件夹（或首次运行自动创建）：

```bash
warehouseMock/
├── user.account.getInfo.json
└── user.taurus.pointInfo.json
```

**user.account.getInfo.json**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "userId": 12345,
    "userName": "Mock 用户"
  }
}
```

### 5️⃣ 启动 Mock 模式

```bash
npm run mock
```

---

## ⚡ 快速开始（Vue 3 + Vite）

### 1️⃣ 配置 vite.config.js

```javascript
// vite.config.js
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

// ⭐ Vite 使用 import.meta.env（插件自动注入 VITE_MOCK）
if (import.meta.env.VITE_MOCK === 'true') {
  config.API = '/mock-api';  // 指向本地
} else {
  config.API = 'https://dev-api.xxx.com/api';  // 真实 API
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

### 4️⃣ 创建 Mock 数据 + 启动

Mock 数据格式与 Webpack 版完全一致（见下方 [Mock 数据文件命名规则](#-mock-数据文件命名规则)），然后：

```bash
npm run mock
```

> **Webpack 与 Vite 的唯一区别**：环境变量由 `process.env.VUE_APP_MOCK` 变为 `import.meta.env.VITE_MOCK`，接入方式由 `vue.config.js` 变为 `plugins` 数组。其余完全相同。

---

## 🎨 Mock 数据文件命名规则

### RPC 风格

| 请求 URL | Mock 文件名 |
|---------|-----------|
| `GET /api?user.account.getInfo` | `user.account.getInfo.json` |
| `POST /mock-api?user.taurus.pointInfo` | `user.taurus.pointInfo.json` |
| `GET /api?common.welfare.banner.query` | `common.welfare.banner.query.json` |

### RESTful 风格

| 请求 URL | Mock 文件名（二选一） |
|---------|---------------------|
| `GET /api/user/info` | `api_user_info.json` (扁平化) |
| `GET /api/user/info` | `api/user/info.json` (嵌套) |

---

## ⚙️ 配置选项

两个插件共享以下选项（Webpack 用 `new WarehouseMockPlugin({...})`，Vite 用 `warehouseMockVite({...})`）：

```javascript
{
  // Mock 数据目录，默认 'warehouseMock'
  mockPath: 'warehouseMock',
  
  // 需要拦截的 API 路径前缀，默认 ['/api', '/mock-api']
  apiPrefixes: ['/api', '/mock-api'],
  
  // 本地代理路径前缀，默认 '/mock-api'
  localApiPrefix: '/mock-api',
  
  // 是否启用，默认 true
  enabled: true,
  
  // 是否自动注入环境变量，默认 true
  injectEnv: true,
  
  // 响应延迟（毫秒），模拟网络延迟，默认 0
  delay: 300,
  
  // 代理配置：未匹配的请求转发到真实 API
  proxy: {
    target: 'https://dev-api.xxx.com',
    changeOrigin: true
  },

  // 管理后台配置
  admin: {
    enabled: true,
    port: 3100
  }
}
```

**Vite 插件专有选项：**

```javascript
warehouseMockVite({
  // 注入到 import.meta.env 的环境变量键名，默认 'VITE_MOCK'
  envKey: 'VITE_MOCK',
})
```

> Webpack 插件注入的是 `process.env.VUE_APP_MOCK`，键名固定。

---

## 🔍 调试工具

### 查看可用 Mock 列表

```json
{
  "mockList": [
    "user.account.getInfo",
    "user.taurus.pointInfo",
    "common.welfare.banner.query"
  ],
  "localApiPrefix": "/mock-api",
  "proxy": "https://dev-api.xxx.com",
  "enabled": true
}
```

---

## 📖 示例项目

仓库内含两个示例：

| 示例 | 构建工具 | 启动 |
|------|----------|------|
| `packages/example-vue2/` | Vue 2 + Vue CLI（Webpack） | `cd packages/example-vue2 && npm run mock` |
| `packages/example-vue3-vite/` | Vue 3 + Vite | `cd packages/example-vue3-vite && npm run mock` |

```bash
# 克隆项目
git clone https://github.com/CodeMomentYY/warehouse-mock.git
cd warehouse-mock

# 安装依赖
npm install

# 启动 Vue 2（Webpack）示例
cd packages/example-vue2
npm run mock

# 或启动 Vue 3（Vite）示例
cd packages/example-vue3-vite
npm run mock
```

---

## 🔥 使用场景（Webpack 示例，Vite 同理）

### 场景 1：外部 API 域名项目 (推荐)

适用于接口请求发往外部域名的项目：

```javascript
// vue.config.js
const WarehouseMockPlugin = require('warehouse-mock');

module.exports = {
  configureWebpack: config => {
    if (process.env.MOCK === 'true') {
      config.plugins.push(new WarehouseMockPlugin({
        apiPrefixes: ['/mock-api'],
        proxy: {
          target: 'https://dev-api.example.com',
          changeOrigin: true
        }
      }));
    }
  }
};
```

### 场景 2：本地开发 + 远程联调

使用代理模式，只 Mock 部分接口，其他接口转发到真实环境：

```javascript
new WarehouseMockPlugin({
  proxy: {
    target: 'https://dev-api.example.com'
  }
})
```

- 存在 Mock 文件的接口 → 返回 Mock 数据
- 不存在 Mock 文件的接口 → 转发到真实 API

---

## 💡 常见问题

### Q1: Mock 没有生效？

**检查清单：**
1. ✅ 确认运行了 `npm run mock` (不是 `npm run serve`)
2. ✅ 确认 `src/const/config.js` 中有 `VUE_APP_MOCK` 判断
3. ✅ 确认 Mock 文件名与接口名完全一致
4. ✅ 确认 Mock 文件是有效的 JSON 格式

### Q2: 修改 Mock 数据后需要重启服务吗？

**不需要！** 直接刷新浏览器页面即可看到最新数据。

### Q3: 可以只 Mock 部分接口吗？

**可以！** 只有在 `warehouseMock/` 目录下存在对应 JSON 文件的接口才会使用 Mock 数据。

### Q4: 支持哪些构建工具和 Vue 版本？

- **Webpack 端**（`warehouse-mock`）：Vue CLI 3.x / 4.x / 5.x，对应 Webpack 4 和 Webpack 5。
- **Vite 端**（`warehouse-mock-vite`）：Vite 3 / 4 / 5，Vue 3 项目。

### Q5: 如何禁用 Mock 模式？

运行普通命令即可：
```bash
npm run serve  # Vue CLI：不使用 MOCK=true
npm run dev    # Vite：不使用 MOCK=true
```

---

## 📋 项目结构

```
warehouse-mock/
├── packages/
│   ├── mock-core/              # 框架无关核心引擎（warehouse-mock-core）
│   ├── mock-webpack-plugin/    # Webpack 插件（warehouse-mock）
│   ├── mock-vite-plugin/       # Vite 插件（warehouse-mock-vite）
│   ├── mock-admin/             # 可视化管理后台（warehouse-mock-admin）
│   ├── example-vue2/           # Vue 2 + Webpack 示例
│   └── example-vue3-vite/      # Vue 3 + Vite 示例
└── README.md
```

---

## 💻 本地开发

```bash
# 安装依赖
npm install

# 构建核心引擎（其余插件依赖它，需先构建）
npm run build --workspace=packages/mock-core

# 构建插件
npm run build --workspace=packages/mock-webpack-plugin
npm run build --workspace=packages/mock-vite-plugin

# 运行示例项目（二选一）
cd packages/example-vue2 && npm run mock
cd packages/example-vue3-vite && npm run mock
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 License

MIT © [CodeMomentYY](https://github.com/CodeMomentYY)

---

## 🔗 相关资源

- [Vue CLI 文档](https://cli.vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
- [Webpack 插件开发](https://webpack.js.org/contribute/writing-a-plugin/)
- [Vite 插件 API](https://vitejs.dev/guide/api-plugin.html)
- [Vue 2 + Webpack 示例](./packages/example-vue2/)
- [Vue 3 + Vite 示例](./packages/example-vue3-vite/)

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！**

Made with ❤️ by [CodeMomentYY](https://github.com/CodeMomentYY)

</div>
