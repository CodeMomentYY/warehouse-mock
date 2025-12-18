# Warehouse Mock - 前端 Mock 工具

一个专为 Vue 2 项目设计的 Webpack 插件，支持 RPC 风格接口 mock，特别适合类似 hellobike 的项目。

## 📦 项目结构

这是一个基于 Lerna 的 monorepo 项目：

```
warehouse-mock/
├── packages/
│   ├── mock-webpack-plugin/    # Mock Webpack 插件 (核心)
│   └── example-vue2/            # Vue 2 示例项目 (完整用法)
├── lerna.json
└── package.json
```

## ✨ 特性

- ✅ **RPC 风格接口支持**: 完美支持 `/api?user.account.getInfo` 格式
- ✅ **零业务代码侵入**: 只需修改配置文件，无需改动业务逻辑
- ✅ **实时更新**: 修改 Mock 数据后刷新页面即可，无需重启服务
- ✅ **按需 Mock**: 只拦截配置了 Mock 数据的接口，其他接口不受影响
- ✅ **TypeScript 编写**: 类型安全，易于维护
- ✅ **兼容性强**: 支持 Webpack 4/5，Vue CLI 3/4/5

## 🚀 快速开始

### 1. 安装

在你的 Vue 项目中安装插件：

```bash
npm install warehouse-mock-plugin --save-dev
```

### 2. 配置 vue.config.js

```javascript
const WarehouseMockPlugin = require('warehouse-mock-plugin');
const webpack = require('webpack');
const path = require('path');

const isMock = process.env.MOCK === 'true';
const mockPlugin = isMock ? new WarehouseMockPlugin({
  mockPath: path.resolve(__dirname, 'warehouseMock'),
}) : null;

module.exports = {
  configureWebpack: config => {
    if (isMock && mockPlugin) {
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

### 3. 修改 API 配置文件

在你的 `src/const/config.js` 或类似的配置文件中：

```javascript
const config = { env: process.env.VUE_APP_ENV || 'dev' };

// ⭐ 关键：Mock 模式优先判断
if (process.env.VUE_APP_MOCK === 'true') {
  Object.assign(config, {
    API: '/mock-api',  // 指向本地 mock 路径
  });
} else if (config.env === 'dev') {
  Object.assign(config, {
    API: 'https://fat-api.hellobike.com/api',  // 真实 API
  });
}

export default config;
```

### 4. 添加 Mock 脚本

在 `package.json` 中添加：

```json
{
  "scripts": {
    "mock": "MOCK=true vue-cli-service serve"
  }
}
```

### 5. 创建 Mock 数据

在项目根目录创建 `warehouseMock` 文件夹，添加 Mock 数据文件：

```bash
warehouseMock/
├── user.account.getInfo.json
└── common.welfare.banner.query.json
```

**user.account.getInfo.json**:
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

### 6. 启动 Mock 模式

```bash
npm run mock
```

访问 http://localhost:8080，所有匹配的 API 将使用本地 Mock 数据。

## 📖 详细文档

### 插件文档
查看 [packages/mock-webpack-plugin/README.md](./packages/mock-webpack-plugin/README.md) 了解：
- 插件配置选项
- 支持的文件命名规则
- 高级用法

### 示例项目
查看 [packages/example-vue2/README.md](./packages/example-vue2/README.md) 了解：
- 完整的项目结构
- 调试技巧
- 常见问题解答

## 🎯 Mock 数据文件命名规则

### RPC 风格 (推荐)

适用于 hellobike 等使用 RPC 风格的项目：

| 请求 URL | Mock 文件名 |
|---------|-----------|
| `/api?user.account.getInfo` | `user.account.getInfo.json` |
| `/api?user.taurus.pointInfo` | `user.taurus.pointInfo.json` |
| `/api?common.welfare.banner.query` | `common.welfare.banner.query.json` |

### RESTful 风格

适用于传统 RESTful API 项目：

| 请求 URL | Mock 文件名（二选一） |
|---------|---------------------|
| `/api/user/info` | `api_user_info.json` (扁平化) |
| `/api/user/info` | `api/user/info.json` (嵌套) |

## 🔍 调试工具

### 查看可用 Mock 列表

访问: `http://localhost:8080/__mock_list__`

返回当前所有可用的 Mock 接口列表。

### 直接访问 Mock 数据

访问: `http://localhost:8080/mock-api?user.account.getInfo`

直接查看某个接口的 Mock 数据。

## 💻 开发

### 本地开发

```bash
# 安装依赖
npm install

# 构建插件
npm run build --workspace=packages/mock-webpack-plugin

# 运行示例项目
cd packages/example-vue2
npm run mock
```

### 发布

```bash
# 发布所有包
lerna publish
```

## 📋 项目规范

- **包管理**: npm
- **Monorepo 管理**: Lerna
- **语言**: TypeScript (插件), JavaScript (示例)
- **代码规范**: ESLint + Prettier

## ❓ 常见问题

### Q: Mock 没有生效？

确保在 `src/const/config.js` 中添加了 Mock 模式判断：

```javascript
if (process.env.VUE_APP_MOCK === 'true') {
  config.API = '/mock-api';
}
```

### Q: 修改 Mock 数据后需要重启服务吗？

不需要！直接刷新浏览器页面即可看到最新数据。

### Q: 可以只 Mock 部分接口吗？

可以！只有在 `warehouseMock/` 目录下存在对应 JSON 文件的接口才会使用 Mock 数据。

### Q: 支持哪些 Vue CLI 版本？

支持 Vue CLI 3.x、4.x、5.x，对应 Webpack 4 和 Webpack 5。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT

## 🔗 相关资源

- [Vue CLI 文档](https://cli.vuejs.org/)
- [Webpack 插件开发](https://webpack.js.org/contribute/writing-a-plugin/)
- [Lerna 文档](https://lerna.js.org/)

