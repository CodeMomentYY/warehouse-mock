# warehouse-mock

一个专为 Vue 2 项目设计的 Webpack 插件，支持 RPC 风格接口 mock，零业务代码侵入，实时更新。

[![npm version](https://img.shields.io/npm/v/warehouse-mock.svg)](https://www.npmjs.com/package/warehouse-mock)
[![license](https://img.shields.io/npm/l/warehouse-mock.svg)](https://github.com/CodeMomentYY/warehouse-mock/blob/main/LICENSE)

## ✨ 特性

- ✅ **RPC 风格接口支持**: 完美支持 `/api?user.account.getInfo` 格式
- ✅ **零业务代码侵入**: 只需修改配置文件，无需改动业务逻辑
- ✅ **实时更新**: 修改 Mock 数据后刷新页面即可，无需重启服务
- ✅ **按需 Mock**: 只拦截配置了 Mock 数据的接口，其他接口不受影响
- ✅ **TypeScript 编写**: 类型安全，易于维护
- ✅ **兼容性强**: 支持 Webpack 4/5，Vue CLI 3/4/5

## 📦 安装

```bash
npm install warehouse-mock --save-dev
```

## 🚀 快速开始

### 1. 配置 vue.config.js

```javascript
const WarehouseMockPlugin = require('warehouse-mock');
const webpack = require('webpack');
const path = require('path');

const isMock = process.env.MOCK === 'true';
const mockPlugin = isMock ? new WarehouseMockPlugin({
  mockPath: path.resolve(__dirname, 'warehouseMock'),
}) : null;

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
    // Vue CLI 5.x (Webpack 5)
    setupMiddlewares: (middlewares, devServer) => {
      if (isMock && mockPlugin) {
        return mockPlugin.setupMiddlewares(middlewares, devServer);
      }
      return middlewares;
    },
    
    // Vue CLI 3.x/4.x (Webpack 4) 使用这个：
    // before: isMock && mockPlugin ? (app) => mockPlugin.runBefore(app) : undefined,
  }
};
```

### 2. 修改 API 配置

在 `src/const/config.js` 中添加 Mock 模式判断：

```javascript
const config = { env: process.env.VUE_APP_ENV || 'dev' };

// Mock 模式优先判断
if (process.env.VUE_APP_MOCK === 'true') {
  Object.assign(config, {
    API: '/mock-api',
  });
} else if (config.env === 'dev') {
  Object.assign(config, {
    API: 'https://fat-api.hellobike.com/api',
  });
}

export default config;
```

### 3. 添加 Mock 脚本

在 `package.json` 中：

```json
{
  "scripts": {
    "mock": "MOCK=true vue-cli-service serve"
  }
}
```

### 4. 创建 Mock 数据

创建 `warehouseMock` 目录并添加 Mock 数据文件：

**warehouseMock/user.account.getInfo.json**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "userId": 12345,
    "userName": "Mock 测试用户"
  }
}
```

### 5. 启动

```bash
npm run mock
```

## ⚙️ 配置选项

```typescript
new WarehouseMockPlugin({
  // 必填：Mock 数据存放目录
  mockPath: string;
  
  // 可选：需要拦截的 API 路径前缀，默认 ['/api', '/mock-api']
  apiPrefixes?: string[];
  
  // 可选：本地 API 路径前缀，默认 '/mock-api'
  localApiPrefix?: string;
})
```

## 📝 Mock 文件命名规则

### RPC 风格（推荐）

| 请求 URL | Mock 文件名 |
|---------|-----------|
| `/api?user.account.getInfo` | `user.account.getInfo.json` |
| `/api?user.taurus.pointInfo` | `user.taurus.pointInfo.json` |
| `/api?common.welfare.banner.query` | `common.welfare.banner.query.json` |

### RESTful 风格

| 请求 URL | Mock 文件名（二选一） |
|---------|---------------------|
| `/api/user/info` | `api_user_info.json` (扁平化) |
| `/api/user/info` | `api/user/info.json` (嵌套) |

## 🔍 调试工具

### 查看可用 Mock 列表

访问: `http://localhost:8080/__mock_list__`

### 直接访问 Mock 数据

访问: `http://localhost:8080/mock-api?user.account.getInfo`

## 💡 为什么选择 warehouse-mock？

### 适用场景

- ✅ 后端接口未就绪，需要前端先行开发
- ✅ 后端接口不稳定，需要本地 Mock 数据测试
- ✅ 需要模拟特殊场景（错误、超时、边界数据等）
- ✅ 使用 RPC 风格接口的项目（如 hellobike）

### 对比其他方案

| 方案 | warehouse-mock | Mock.js | json-server |
|-----|---------------|---------|-------------|
| 零代码侵入 | ✅ | ❌ 需修改业务代码 | ❌ 需单独启动服务 |
| RPC 支持 | ✅ | ❌ | ❌ |
| 实时更新 | ✅ | ❌ | ✅ |
| TypeScript | ✅ | ❌ | ❌ |
| Webpack 集成 | ✅ | ❌ | ❌ |

## 📚 完整示例

查看完整的示例项目：[example-vue2](https://github.com/CodeMomentYY/warehouse-mock/tree/main/packages/example-vue2)

## ❓ 常见问题

**Q: Mock 没有生效？**

确保在 `src/const/config.js` 中添加了 Mock 模式判断，将 API 地址改为 `/mock-api`。

**Q: 修改 Mock 数据后需要重启服务吗？**

不需要！直接刷新浏览器页面即可。

**Q: 可以只 Mock 部分接口吗？**

可以！只有存在对应 JSON 文件的接口才会使用 Mock 数据。

## 📄 许可证

MIT © CodeMomentYY

## 🔗 相关链接

- [GitHub 仓库](https://github.com/CodeMomentYY/warehouse-mock)
- [问题反馈](https://github.com/CodeMomentYY/warehouse-mock/issues)
- [更新日志](https://github.com/CodeMomentYY/warehouse-mock/releases)

