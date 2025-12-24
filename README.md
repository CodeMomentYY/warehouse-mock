# Warehouse Mock - 极简 Vue Mock 插件

<div align="center">

一个专为 **Vue CLI** 项目设计的 **Webpack Mock 插件**，零业务代码侵入，完美支持 RPC 风格接口。

[![npm version](https://img.shields.io/npm/v/warehouse-mock.svg)](https://www.npmjs.com/package/warehouse-mock)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[快速开始](#-快速开始) • [特性](#-核心特性) • [配置](#-配置选项) • [示例](#-示例项目)

</div>

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
| **Vue CLI 优化** | ✅ 自动适配 | ⚠️ | ❌ | ❌ |

---

## ✨ 核心特性

- 🚀 **极简配置** - vue.config.js 只需 3 行代码
- 🎯 **零业务侵入** - 无需修改接口调用代码
- 🔥 **RPC 风格原生支持** - 完美适配 App H5 等项目
- ⚡️ **实时热更新** - 修改 Mock 数据，刷新页面即可生效
- 🎨 **按需拦截** - 只拦截配置了 Mock 文件的接口
- 🌐 **代理模式** - 未匹配请求可转发到真实 API
- 🔧 **自动注入环境变量** - 无需手动配置 DefinePlugin
- 📦 **TypeScript 编写** - 类型安全，易于维护
- 🔌 **兼容性强** - 支持 Webpack 4/5，Vue CLI 3/4/5

---

## 📦 安装

```bash
npm install warehouse-mock --save-dev
```

---

## 🚀 快速开始

### 1️⃣ 配置 vue.config.js

只需 **3 行核心代码**：

```javascript
// vue.config.js
const WarehouseMockPlugin = require('warehouse-mock-plugin');

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

访问 http://localhost:8080 ，所有匹配的接口将使用本地 Mock 数据！

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

```javascript
new WarehouseMockPlugin({
  // Mock 数据目录，默认 'warehouseMock'
  mockPath: 'warehouseMock',
  
  // 需要拦截的 API 路径前缀，默认 ['/api', '/mock-api']
  apiPrefixes: ['/api', '/mock-api'],
  
  // 本地代理路径前缀，默认 '/mock-api'
  localApiPrefix: '/mock-api',
  
  // 是否启用，默认 true
  enabled: true,
  
  // 是否自动注入环境变量 VUE_APP_MOCK，默认 true
  injectEnv: true,
  
  // 响应延迟（毫秒），模拟网络延迟，默认 0
  delay: 300,
  
  // 代理配置：未匹配的请求转发到真实 API
  proxy: {
    target: 'https://dev-api.xxx.com',
    changeOrigin: true
  }
})
```

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

查看 `packages/example-vue2/` 获取完整示例：

```bash
# 克隆项目
git clone https://github.com/CodeMomentYY/warehouse-mock.git
cd warehouse-mock

# 安装依赖
npm install

# 进入示例项目
cd packages/example-vue2

# 启动 Mock 模式
npm run mock
```

---

## 🔥 使用场景

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

### Q4: 支持哪些 Vue CLI 版本？

支持 **Vue CLI 3.x、4.x、5.x**，对应 Webpack 4 和 Webpack 5。

### Q5: 如何禁用 Mock 模式？

运行普通命令即可：
```bash
npm run serve  # 不使用 MOCK=true
```

---

## 📋 项目结构

```
warehouse-mock/
├── packages/
│   ├── mock-webpack-plugin/    # 核心插件包
│   │   ├── src/
│   │   │   └── index.ts        # 插件源码
│   │   ├── dist/               # 编译后的文件
│   │   └── package.json
│   │
│   └── example-vue2/           # Vue 2 示例项目
│       ├── src/
│       │   ├── App.vue         # 示例界面
│       │   ├── api/utils.js    # RPC 风格 API
│       │   └── const/config.js # API 配置
│       ├── warehouseMock/      # Mock 数据
│       └── vue.config.js       # 插件配置
└── README.md
```

---

## 💻 本地开发

```bash
# 安装依赖
npm install

# 构建插件
npm run build --workspace=packages/mock-webpack-plugin

# 运行示例项目
cd packages/example-vue2
npm run mock
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
- [Webpack 插件开发](https://webpack.js.org/contribute/writing-a-plugin/)
- [示例项目](./packages/example-vue2/)

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！**

Made with ❤️ by [CodeMomentYY](https://github.com/CodeMomentYY)

</div>
