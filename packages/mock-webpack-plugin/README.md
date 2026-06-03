# warehouse-mock

<div align="center">

极简 Vue Mock 插件（**Webpack / Vue CLI** 版），零业务代码侵入，完美支持 RPC 风格接口

[![npm version](https://img.shields.io/npm/v/warehouse-mock.svg)](https://www.npmjs.com/package/warehouse-mock)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

</div>

> 本包是 Warehouse Mock 的 **Webpack 适配**，核心逻辑由 [`warehouse-mock-core`](https://www.npmjs.com/package/warehouse-mock-core) 提供（会作为依赖自动安装）。
> Vue 3 + Vite 项目请使用 [`warehouse-mock-vite`](https://www.npmjs.com/package/warehouse-mock-vite)，二者数据格式与功能完全一致。

## 安装

```bash
npm install warehouse-mock --save-dev
```

## 快速开始

### 1. 配置 vue.config.js

**Vue CLI 5（Webpack 5）：**

```javascript
const WarehouseMockPlugin = require('warehouse-mock');

const isMock = process.env.MOCK === 'true';
const mockPlugin = isMock ? new WarehouseMockPlugin() : null;

module.exports = {
  configureWebpack: config => {
    if (isMock && mockPlugin) {
      config.plugins.push(mockPlugin);
    }
  },
  devServer: {
    // Webpack 5 通过 setupMiddlewares 挂载拦截中间件
    setupMiddlewares: (middlewares, devServer) => {
      if (isMock && mockPlugin) {
        return mockPlugin.setupMiddlewares(middlewares, devServer);
      }
      return middlewares;
    }
  }
};
```

**Vue CLI 3-4（Webpack 4）：** 用 `before` 钩子挂载，并手动注入环境变量：

```javascript
const WarehouseMockPlugin = require('warehouse-mock');
const webpack = require('webpack');

const isMock = process.env.MOCK === 'true';
const mockPlugin = isMock ? new WarehouseMockPlugin() : null;

module.exports = {
  configureWebpack: config => {
    if (isMock && mockPlugin) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.VUE_APP_MOCK': JSON.stringify('true'),
        })
      );
      config.plugins.push(mockPlugin);
    }
  },
  devServer: {
    before: isMock && mockPlugin ? app => mockPlugin.runBefore(app) : undefined,
  }
};
```

### 2. 添加 Mock 脚本

```json
{
  "scripts": {
    "mock": "MOCK=true vue-cli-service serve"
  }
}
```

### 3. 配置 API 切换

在 `src/const/config.js` 中：

```javascript
if (process.env.VUE_APP_MOCK === 'true') {
  config.API = '/mock-api';
} else {
  config.API = 'https://your-api.com';
}
```

### 4. 创建 Mock 数据

在项目根目录创建 `warehouseMock/` 文件夹，每个接口对应一个目录（详见下方 [Mock 文件命名规则](#mock-文件命名规则)）：

```
warehouseMock/
├── user.account.getInfo/
│   ├── .config.json
│   └── default.json
└── user.taurus.pointInfo/
    ├── .config.json
    └── default.json
```

### 5. 启动

```bash
npm run mock
```

## 配置选项

```typescript
interface MockPluginOptions {
  // Mock 数据目录，默认 'warehouseMock'
  mockPath?: string;
  
  // 需要拦截的 API 路径前缀，默认 ['/api', '/mock-api']
  apiPrefixes?: string[];
  
  // 本地代理路径前缀，默认 '/mock-api'
  localApiPrefix?: string;
  
  // 是否启用，默认 true
  enabled?: boolean;
  
  // 是否自动注入环境变量 VUE_APP_MOCK，默认 true
  injectEnv?: boolean;
  
  // 响应延迟（毫秒），模拟网络延迟，默认 0
  delay?: number;
  
  // 代理配置：未匹配的请求转发到真实 API
  proxy?: {
    target: string;
    changeOrigin?: boolean;
  };

  // 管理后台配置
  admin?: {
    enabled?: boolean;  // 是否启用，默认 true
    port?: number;      // 端口，默认 3100
  };
}
```

## 使用示例

### 基础配置

```javascript
new WarehouseMockPlugin({
  mockPath: 'warehouseMock',
  apiPrefixes: ['/api', '/mock-api']
})
```

### 代理模式

未匹配的请求转发到真实 API：

```javascript
new WarehouseMockPlugin({
  proxy: {
    target: 'https://dev-api.xxxx.com',
    changeOrigin: true
  }
})
```

### 模拟网络延迟

```javascript
new WarehouseMockPlugin({
  delay: 500  // 500ms 延迟
})
```

## Mock 文件命名规则

接口名对应 `warehouseMock/` 下的一个**目录**（推荐，支持多场景），目录内含 `.config.json` 配置和若干场景文件：

```
warehouseMock/
└── user.account.getInfo/        # 接口目录（接口名）
    ├── .config.json             # { name, delay, enabled, activeScene }
    ├── default.json             # 默认场景数据
    └── success.json             # 其他场景数据
```

`.config.json`：

```json
{
  "name": "user.account.getInfo",
  "delay": 0,
  "enabled": true,
  "activeScene": "default"
}
```

> 也兼容旧的单文件格式 `warehouseMock/user.account.getInfo.json`。

### 接口名与请求 URL 的对应

**RPC 风格 (推荐)**

| 请求 URL | 接口目录 |
|---------|-----------|
| `GET /api?user.account.getInfo` | `warehouseMock/user.account.getInfo/` |
| `POST /mock-api?user.taurus.pointInfo` | `warehouseMock/user.taurus.pointInfo/` |

**RESTful 风格**

| 请求 URL | 接口目录 / 文件 |
|---------|-----------|
| `GET /api/user/info` | `warehouseMock/api_user_info/`（扁平化） |
| `GET /api/user/info` | `warehouseMock/api/user/info.json`（嵌套） |

## 调试工具

### 查看可用 Mock 列表

访问: `http://localhost:8080/__mock_list__`

### 直接访问 Mock 数据

访问: `http://localhost:8080/mock-api?user.account.getInfo`

## 核心特性

- ✅ **极简配置** - vue.config.js 几行代码即可接入
- ✅ **零业务侵入** - 无需修改接口调用代码
- ✅ **RPC 风格支持** - 原生支持 RPC 接口
- ✅ **多场景** - 每个接口可配置多个场景，一键切换
- ✅ **实时热更新** - 修改 Mock 数据，刷新即可
- ✅ **按需拦截** - 只拦截配置了 Mock 文件的接口
- ✅ **代理模式** - 未匹配请求转发到真实 API
- ✅ **自动注入环境变量** - 无需手动配置 DefinePlugin
- ✅ **可视化管理后台** - 内置 Web 界面管理 Mock（可选）
- ✅ **兼容性强** - 支持 Webpack 4/5，Vue CLI 3/4/5

## 相关包

- [`warehouse-mock-vite`](https://www.npmjs.com/package/warehouse-mock-vite) - Vue 3 + Vite 版本
- [`warehouse-mock-core`](https://www.npmjs.com/package/warehouse-mock-core) - 框架无关核心引擎
- [`warehouse-mock-admin`](https://www.npmjs.com/package/warehouse-mock-admin) - 可视化管理后台

## License

MIT
