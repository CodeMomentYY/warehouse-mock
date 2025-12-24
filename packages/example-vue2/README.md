# Example Vue 2 - Warehouse Mock 示例项目

这是一个完整的 Vue 2 示例项目，展示了如何使用 `warehouse-mock-plugin` 进行接口 Mock。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动 Mock 模式

```bash
npm run mock
```

访问: http://localhost:8080

### 3. 查看可用 Mock 列表

访问: http://localhost:8080/__mock_list__

## 项目结构

```
example-vue2/
├── src/
│   ├── App.vue              # 示例界面
│   ├── api/
│   │   └── utils.js         # RPC 风格 API 封装
│   ├── const/
│   │   └── config.js        # API 配置（Mock 模式切换）
│   └── main.js
├── warehouseMock/           # Mock 数据目录
│   ├── demo.json
│   ├── user.account.getInfo.json
│   └── user.taurus.pointInfo.json
├── vue.config.js            # 插件配置
└── package.json
```

## Mock 数据示例

### user.account.getInfo.json

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "userId": 12345,
    "userName": "Mock 测试用户",
    "mobile": "138****8888",
    "avatar": "https://example.com/avatar.png",
    "level": 3,
    "createTime": "2023-01-01 00:00:00"
  }
}
```

### user.taurus.pointInfo.json

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "pointBalance": 5680,
    "totalEarned": 12500,
    "totalUsed": 6820,
    "expirePoints": 200,
    "expireDate": "2024-03-01"
  }
}
```

## 配置说明

### vue.config.js

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

### src/const/config.js

```javascript
const config = { env: process.env.VUE_APP_ENV || 'dev' };

// Mock 模式：使用本地 API 路径
if (process.env.VUE_APP_MOCK === 'true') {
  config.API = '/mock-api';
} else {
  // 真实环境
  config.API = 'https://dev-api.example.com';
}

export default config;
```

## API 调用示例

### src/api/utils.js

```javascript
import axios from 'axios';
import config from '@/const/config';

const Ax = axios.create({
  timeout: 15000,
  headers: { 'content-type': 'application/json' }
});

// RPC 风格请求封装
export const easyPost = (action, { api = config.API } = {}) => {
  return async (data = {}) => {
    const response = await Ax.post(`${api}?${action}`, {
      action,
      ...data
    });
    return response.data;
  };
};

// 导出具体接口
export const getUserInfo = easyPost('user.account.getInfo');
export const getPointInfo = easyPost('user.taurus.pointInfo');
```

## 使用说明

### 添加新的 Mock 接口

1. 在 `warehouseMock/` 目录下创建 JSON 文件
2. 文件名对应接口名，如 `user.account.profile.json`
3. 刷新浏览器即可生效

### 切换到真实 API

```bash
npm run serve  # 不使用 MOCK=true 环境变量
```

### 查看调试信息

打开浏览器控制台，可以看到：
- API 请求日志
- Mock 拦截日志
- 环境配置信息

## 常见问题

### Q: Mock 没有生效？

**检查：**
1. 确认运行了 `npm run mock` 而不是 `npm run serve`
2. 检查 Mock 文件名是否与接口名一致
3. 检查 JSON 文件格式是否正确

### Q: 如何只 Mock 部分接口？

只创建需要 Mock 的接口对应的 JSON 文件即可，其他接口会正常请求真实 API。

### Q: 如何修改 Mock 数据？

直接编辑 `warehouseMock/` 目录下的 JSON 文件，保存后刷新浏览器即可。

## License

MIT
