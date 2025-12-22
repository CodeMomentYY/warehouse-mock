# warehouse-mock-plugin

<div align="center">

极简 Vue Mock 插件，零业务代码侵入，完美支持 RPC 风格接口

[![npm version](https://img.shields.io/npm/v/warehouse-mock-plugin.svg)](https://www.npmjs.com/package/warehouse-mock-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

</div>

## 安装

```bash
npm install warehouse-mock-plugin --save-dev
```

## 快速开始

### 1. 配置 vue.config.js

```javascript
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

在项目根目录创建 `warehouseMock/` 文件夹，添加 JSON 文件：

```
warehouseMock/
├── user.account.getInfo.json
└── user.taurus.pointInfo.json
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
    target: 'https://fat-api.hellobike.com',
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

### RPC 风格 (推荐)

| 请求 URL | Mock 文件名 |
|---------|-----------|
| `GET /api?user.account.getInfo` | `user.account.getInfo.json` |
| `POST /mock-api?user.taurus.pointInfo` | `user.taurus.pointInfo.json` |

### RESTful 风格

| 请求 URL | Mock 文件名 |
|---------|-----------|
| `GET /api/user/info` | `api_user_info.json` (扁平化) |
| `GET /api/user/info` | `api/user/info.json` (嵌套) |

## 调试工具

### 查看可用 Mock 列表

访问: `http://localhost:8080/__mock_list__`

### 直接访问 Mock 数据

访问: `http://localhost:8080/mock-api?user.account.getInfo`

## 核心特性

- ✅ **极简配置** - vue.config.js 只需 3 行代码
- ✅ **零业务侵入** - 无需修改接口调用代码
- ✅ **RPC 风格支持** - 原生支持 RPC 接口
- ✅ **实时热更新** - 修改 Mock 数据，刷新即可
- ✅ **按需拦截** - 只拦截配置了 Mock 文件的接口
- ✅ **代理模式** - 未匹配请求转发到真实 API
- ✅ **自动注入环境变量** - 无需手动配置 DefinePlugin
- ✅ **兼容性强** - 支持 Webpack 4/5，Vue CLI 3/4/5

## License

MIT
