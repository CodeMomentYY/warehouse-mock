# Warehouse Mock - 5 分钟快速上手

## 🎯 适用场景

如果你的项目是：
- ✅ Vue CLI 3/4/5 项目
- ✅ 使用 Webpack 4/5
- ✅ API 请求发往外部域名（如 hellobike）
- ✅ 使用 RPC 风格或 RESTful 风格接口

**那么这个插件非常适合你！**

---

## 📦 第一步：安装（30 秒）

```bash
npm install warehouse-mock-plugin --save-dev
```

---

## ⚙️ 第二步：配置（2 分钟）

### 1. 修改 `vue.config.js`

在你的项目根目录的 `vue.config.js` 中添加：

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

> 💡 **就这么简单！** 只需要 3 行核心代码。

### 2. 修改 `src/const/config.js`（或你的 API 配置文件）

```javascript
const config = { env: process.env.VUE_APP_ENV || 'dev' };

// ⭐ 添加这个判断
if (process.env.VUE_APP_MOCK === 'true') {
  config.API = '/mock-api';  // Mock 模式
} else {
  config.API = 'https://your-api.com';  // 真实 API
}

export default config;
```

### 3. 在 `package.json` 中添加脚本

```json
{
  "scripts": {
    "serve": "vue-cli-service serve",
    "mock": "MOCK=true vue-cli-service serve"
  }
}
```

---

## 📝 第三步：创建 Mock 数据（1 分钟）

在项目根目录创建 `warehouseMock` 文件夹：

```bash
mkdir warehouseMock
```

### RPC 风格接口示例

如果你的接口是 `GET /api?user.account.getInfo`，创建文件：

**`warehouseMock/user.account.getInfo.json`**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "userId": 12345,
    "userName": "Mock 用户",
    "mobile": "138****8888"
  }
}
```

### RESTful 风格接口示例

如果你的接口是 `GET /api/user/info`，创建文件：

**`warehouseMock/api_user_info.json`** （扁平化命名）

```json
{
  "code": 0,
  "data": {
    "userId": 12345,
    "userName": "Mock 用户"
  }
}
```

---

## 🚀 第四步：启动（10 秒）

```bash
npm run mock
```

访问 http://localhost:8080 ，你的接口已经使用 Mock 数据了！

---

## 🔍 验证是否生效

### 方法 1：查看控制台

启动后你会看到：

```
[WarehouseMock] 已注入环境变量: VUE_APP_MOCK=true
[WarehouseMock] 已加载 1 个 mock 文件
  → user.account.getInfo
[WarehouseMock] Mock 服务已启动
```

### 方法 2：查看浏览器控制台

```javascript
console.log('Mock 模式:', process.env.VUE_APP_MOCK);  // "true"
console.log('API 地址:', config.API);                 // "/mock-api"
```

### 方法 3：访问调试端点

打开浏览器访问: http://localhost:8080/__mock_list__

```json
{
  "mockList": ["user.account.getInfo"],
  "localApiPrefix": "/mock-api",
  "enabled": true
}
```

### 方法 4：直接访问 Mock 数据

访问: http://localhost:8080/mock-api?user.account.getInfo

---

## 📚 常用场景

### 场景 1：只 Mock 部分接口

**只创建需要 Mock 的接口对应的 JSON 文件即可！**

```
warehouseMock/
├── user.account.getInfo.json    ✅ 会被 Mock
└── user.taurus.pointInfo.json   ✅ 会被 Mock

其他接口                          ✅ 正常请求真实 API
```

### 场景 2：Mock + 真实 API 混用（代理模式）

```javascript
// vue.config.js
new WarehouseMockPlugin({
  proxy: {
    target: 'https://your-api.com',
    changeOrigin: true
  }
})
```

- 有 Mock 文件 → 返回 Mock 数据
- 无 Mock 文件 → 转发到真实 API

### 场景 3：模拟网络延迟

```javascript
new WarehouseMockPlugin({
  delay: 500  // 500ms 延迟
})
```

### 场景 4：切换回真实 API

```bash
npm run serve  # 不使用 MOCK=true
```

---

## 🎨 实时更新

修改 Mock 数据后，**无需重启服务**，只需：

1. 修改 `warehouseMock/*.json` 文件
2. 保存
3. 刷新浏览器页面 ✅

---

## ❓ 常见问题

### Q1: Mock 没有生效？

**检查清单：**
- [ ] 确认运行了 `npm run mock` 而不是 `npm run serve`
- [ ] 确认 `src/const/config.js` 中添加了 `VUE_APP_MOCK` 判断
- [ ] 确认 Mock 文件名与接口名完全一致
- [ ] 确认 JSON 格式正确（可以用 JSONLint 验证）

### Q2: 如何知道哪些接口被 Mock 了？

访问: http://localhost:8080/__mock_list__

或查看控制台启动日志。

### Q3: 可以 Mock POST 请求吗？

可以！插件不区分请求方法，只根据 URL 匹配。

### Q4: 如何添加新的 Mock 接口？

1. 在 `warehouseMock/` 目录创建对应的 JSON 文件
2. 刷新浏览器即可（无需重启服务）

### Q5: 支持动态数据吗？

当前版本支持静态 JSON。如需动态数据，可以考虑：
- 手动修改 JSON 文件
- 使用代理模式转发到真实 API
- 等待后续版本支持 Mock.js

---

## 🎯 完整示例

### 项目结构

```
my-vue-project/
├── src/
│   ├── api/
│   │   └── utils.js
│   ├── const/
│   │   └── config.js         # ⭐ 修改这里
│   └── main.js
├── warehouseMock/             # ⭐ 创建这个目录
│   ├── user.account.getInfo.json
│   └── user.taurus.pointInfo.json
├── vue.config.js              # ⭐ 修改这里
└── package.json               # ⭐ 添加脚本
```

### 完整的 vue.config.js

```javascript
const WarehouseMockPlugin = require('warehouse-mock-plugin');

const isMock = process.env.MOCK === 'true';

module.exports = {
  configureWebpack: config => {
    if (isMock) {
      config.plugins.push(new WarehouseMockPlugin({
        // 所有配置项都是可选的，有默认值
        // mockPath: 'warehouseMock',
        // apiPrefixes: ['/api', '/mock-api'],
        // localApiPrefix: '/mock-api',
        // delay: 0,
        // proxy: {
        //   target: 'https://your-api.com',
        //   changeOrigin: true
        // }
      }));
    }
  }
};
```

### 完整的 config.js

```javascript
const config = {
  env: process.env.VUE_APP_ENV || 'dev'
};

// Mock 模式判断（插件会自动注入 VUE_APP_MOCK）
if (process.env.VUE_APP_MOCK === 'true') {
  Object.assign(config, {
    API: '/mock-api',
    EBIKE_API: '/mock-api',
    BIKE_API: '/mock-api'
  });
  console.log('[Config] Mock 模式已启用');
} else if (config.env === 'dev') {
  Object.assign(config, {
    API: 'https://dev-api.example.com',
    EBIKE_API: 'https://dev-ebike.example.com',
    BIKE_API: 'https://dev-bike.example.com'
  });
} else if (config.env === 'prod') {
  Object.assign(config, {
    API: 'https://api.example.com',
    EBIKE_API: 'https://ebike.example.com',
    BIKE_API: 'https://bike.example.com'
  });
}

export default config;
```

---

## 🎉 完成！

你已经成功接入 Warehouse Mock 插件了！

**总耗时：不到 5 分钟**

**修改文件：3 个**

**新增代码：不到 10 行**

---

## 📖 进阶阅读

- [完整文档](./README.md)
- [配置选项详解](./packages/mock-webpack-plugin/README.md)
- [示例项目](./packages/example-vue2/README.md)
- [重构对比](./COMPARISON.md)

---

## 🤝 需要帮助？

- 查看 [常见问题](./README.md#-常见问题)
- 提交 [Issue](https://github.com/CodeMomentYY/warehouse-mock/issues)
- 查看 [示例项目](./packages/example-vue2/)

---

<div align="center">

**如果这个插件对你有帮助，请给个 ⭐️ Star！**

Made with ❤️ by [CodeMomentYY](https://github.com/CodeMomentYY)

</div>

