# Example Vue2 - Warehouse Mock 示例项目

这是一个完整的 Vue 2 示例项目，展示了如何在类似 **AppPlatformH5** (hellobike) 的项目中接入 **warehouse-mock-plugin**。

## 📋 项目特点

- ✅ **RPC 风格接口**: 模拟 `https://fat-api.hellobike.com/api?user.account.getInfo` 格式
- ✅ **零业务代码侵入**: 只需修改配置文件，无需改动业务逻辑
- ✅ **环境切换**: 支持 Mock 模式和正常开发模式的无缝切换
- ✅ **实时更新**: 修改 Mock 数据后刷新页面即可看到效果

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动 Mock 模式

```bash
npm run mock
```

这会启动开发服务器并启用 Mock 功能，所有 API 请求将使用本地 Mock 数据。

访问: http://localhost:8080

### 3. 启动正常模式

```bash
npm run serve
```

这会启动开发服务器但不启用 Mock，API 请求将发往真实的外部服务器 (如果配置了的话)。

## 📁 项目结构

```
example-vue2/
├── src/
│   ├── api/
│   │   └── utils.js              # API 工具函数 (RPC 风格)
│   ├── const/
│   │   └── config.js             # API 配置 (根据 VUE_APP_MOCK 切换地址)
│   ├── App.vue                   # 主应用组件
│   └── main.js                   # 入口文件
├── warehouseMock/                # Mock 数据目录
│   ├── user.account.getInfo.json
│   ├── user.taurus.pointInfo.json
│   └── common.welfare.banner.query.json
├── vue.config.js                 # Vue CLI 配置 (核心)
└── package.json

```

## 🔧 核心配置说明

### 1. vue.config.js - 插件接入

```javascript
const WarehouseMockPlugin = require('warehouse-mock-plugin');
const webpack = require('webpack');
const path = require('path');

const isMock = process.env.MOCK === 'true';

const mockPlugin = new WarehouseMockPlugin({
  mockPath: path.resolve(__dirname, 'warehouseMock'),
  apiPrefixes: ['/api', '/mock-api'],
});

module.exports = {
  configureWebpack: config => {
    if (isMock) {
      // 1. 注入环境变量
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.VUE_APP_MOCK': JSON.stringify('true'),
        })
      );
      
      // 2. 添加 mock 插件
      config.plugins.push(mockPlugin);
    }
  },
  
  devServer: {
    // Vue CLI 5.x (Webpack 5) 使用 setupMiddlewares
    setupMiddlewares: (middlewares, devServer) => {
      if (isMock) {
        return mockPlugin.setupMiddlewares(middlewares, devServer);
      }
      return middlewares;
    }
  }
};
```

**注意**: 如果是 Vue CLI 3.x/4.x (Webpack 4)，使用 `before` 钩子：

```javascript
devServer: {
  before: isMock ? (app) => mockPlugin.runBefore(app) : undefined,
}
```

### 2. src/const/config.js - API 地址切换

```javascript
const config = {
  env: process.env.VUE_APP_ENV || 'dev',
};

// ⭐ Mock 模式优先判断（关键）
if (process.env.VUE_APP_MOCK === 'true') {
  Object.assign(config, {
    API: '/mock-api',              // 指向本地 mock 路径
    EBIKE_API: '/mock-api',
    BIKE_API: '/mock-api',
  });
} else if (config.env === 'dev' || config.env === 'fat') {
  // 开发/测试环境
  Object.assign(config, {
    API: 'https://fat-api.hellobike.com/api',
    EBIKE_API: 'https://fat-ebike.hellobike.com/api',
    BIKE_API: 'https://fat-bike.hellobike.com/api',
  });
}

export default config;
```

**🔑 关键点**: 
- 必须在 config.js 中判断 `process.env.VUE_APP_MOCK`
- Mock 模式下将 API 地址改为 `/mock-api`
- 这样请求才会经过 webpack dev server，被插件拦截

### 3. src/api/utils.js - RPC 风格 API 调用

```javascript
import axios from 'axios';
import config from '@/const/config';

const Ax = axios.create({
  timeout: 15000,
  headers: { 'content-type': 'application/json' },
});

export const easyPost = (action, { api = config.API } = {}) => {
  return async (data = {}) => {
    // RPC 风格：POST /mock-api?user.account.getInfo
    const response = await Ax.post(
      `${api}?${action}`,
      { action, ...data }
    );
    return response;
  };
};

// 导出具体的 API
export const getUserInfo = easyPost('user.account.getInfo');
export const getPointInfo = easyPost('user.taurus.pointInfo');
export const getWelfareBanner = easyPost('common.welfare.banner.query');
```

## 📝 添加新的 Mock 接口

### 步骤 1: 创建 Mock 数据文件

在 `warehouseMock/` 目录下创建 JSON 文件，文件名为接口名称：

```bash
# 接口: common.welfare.banner.query
# 文件: warehouseMock/common.welfare.banner.query.json
```

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "welfareBannerDataVO": {
      "title": "福利横幅标题",
      "bannerDataList": [
        {
          "actId": "10001",
          "imgUrl": "https://example.com/banner.png",
          "linkUrl": "https://example.com/link"
        }
      ]
    }
  }
}
```

### 步骤 2: 在 utils.js 中添加 API 方法

```javascript
export const getWelfareBanner = easyPost('common.welfare.banner.query');
```

### 步骤 3: 在组件中调用

```javascript
import { getWelfareBanner } from '@/api/utils';

// 使用
const response = await getWelfareBanner();
console.log(response.data);
```

### 步骤 4: 刷新页面

修改 Mock 数据后，直接刷新浏览器即可看到最新数据，**无需重启** `npm run mock`。

## 🎯 Mock 数据文件命名规则

### RPC 风格 (推荐用于 hellobike 项目)

| 请求格式 | Mock 文件名 |
|---------|-----------|
| `/api?user.account.getInfo` | `user.account.getInfo.json` |
| `/api?user.taurus.pointInfo` | `user.taurus.pointInfo.json` |
| `/api?common.welfare.banner.query` | `common.welfare.banner.query.json` |

### RESTful 风格

| 请求格式 | Mock 文件名（二选一） |
|---------|---------------------|
| `/api/user/info` | `api_user_info.json` (扁平化) |
| `/api/user/info` | `api/user/info.json` (嵌套) |

## 🔍 调试技巧

### 1. 查看当前模式

在浏览器控制台运行：

```javascript
console.log('Mock 模式:', process.env.VUE_APP_MOCK);
console.log('API 地址:', config.API);
```

### 2. 查看可用的 Mock 列表

访问: http://localhost:8080/__mock_list__

返回:
```json
{
  "mockList": [
    "user.account.getInfo",
    "user.taurus.pointInfo",
    "common.welfare.banner.query"
  ],
  "localApiPrefix": "/mock-api"
}
```

### 3. 直接访问 Mock 数据

访问: http://localhost:8080/mock-api?user.account.getInfo

直接查看返回的 Mock 数据。

### 4. 查看请求日志

打开浏览器开发者工具 -> Network 标签，查看实际请求的 URL。

在 Mock 模式下，应该看到：
```
POST /mock-api?user.account.getInfo
```

在正常模式下，应该看到：
```
POST https://fat-api.hellobike.com/api?user.account.getInfo
```

## ❓ 常见问题

### Q1: Mock 没有生效，还是请求外部 API？

**原因**: `src/const/config.js` 中没有判断 `VUE_APP_MOCK`，API 地址仍然指向外部服务器。

**解决**: 确保在 config.js 最前面加上 Mock 模式判断：

```javascript
if (process.env.VUE_APP_MOCK === 'true') {
  Object.assign(config, {
    API: '/mock-api',
  });
}
```

### Q2: 修改 Mock 数据后没有更新？

**可能原因**:
1. 浏览器缓存了请求 → 强制刷新 (Ctrl+Shift+R)
2. Mock 文件名不匹配 → 检查文件名是否与接口名完全一致

### Q3: 报错 "Cannot find module 'warehouse-mock-plugin'"

**解决**: 在 monorepo 根目录运行：

```bash
npm install
lerna bootstrap
```

或者在 example-vue2 目录下运行：

```bash
npm install
```

### Q4: 想测试没有 Mock 的接口会怎样？

在 Mock 模式下，**没有 Mock 文件的接口会返回 404**（因为 API 地址指向 `/mock-api`，但没有对应的 Mock 数据）。

如果需要混合使用（部分接口用 Mock，部分接口用真实 API），需要在 utils.js 中单独为某些接口指定外部 API 地址。

## 📚 更多示例

查看 `src/App.vue` 获取完整的使用示例，包括：
- 错误处理
- 加载状态
- 结果展示

## 🔗 相关链接

- [warehouse-mock-plugin 文档](../mock-webpack-plugin/README.md)
- [项目整体说明](../../README.md)

## 💡 提示

这个示例项目完全模拟了 **AppPlatformH5** 的接入方式，可以直接将配置复制到你的项目中使用。

