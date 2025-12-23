# Warehouse Mock Admin

可视化 Mock 数据管理后台，配合 `warehouse-mock` 插件使用。

## 🎨 功能特性

- ✅ **可视化管理** - 通过 Web 界面管理 Mock 数据
- ✅ **实时编辑** - 使用 Monaco Editor 编辑 JSON 数据
- ✅ **即时生效** - 修改后无需重启服务
- ✅ **创建/编辑/删除** - 完整的 CRUD 操作
- ✅ **搜索过滤** - 快速找到需要的 Mock 数据
- ✅ **格式化/压缩** - JSON 格式化和压缩工具

## 📦 安装

```bash
npm install warehouse-mock-admin --save-dev
```

## 🚀 使用

### 自动集成（推荐）

如果你使用 `warehouse-mock` 插件，管理后台会自动启动：

```javascript
// vue.config.js
const WarehouseMockPlugin = require('warehouse-mock');

const isMock = process.env.MOCK === 'true';

module.exports = {
  configureWebpack: {
    plugins: [
      isMock && new WarehouseMockPlugin({
        mockPath: 'warehouseMock',
        // 管理后台配置（可选）
        admin: {
          enabled: true,  // 是否启用，默认 true
          port: 3100      // 端口号，默认 3100
        }
      })
    ].filter(Boolean)
  }
};
```

启动项目：

```bash
npm run mock
```

控制台会显示管理后台地址：

```
╭────────────────────────────────────────────────────╮
│  🎨 Mock 数据管理后台已启动                          │
│                                                    │
│  ➜  访问地址: http://localhost:3100                 │
│                                                    │
│  在浏览器中打开上面的地址来管理 Mock 数据            │
╰────────────────────────────────────────────────────╯
```

### 独立使用

也可以独立使用管理后台：

```javascript
const { createAdminServer } = require('warehouse-mock-admin');

const server = createAdminServer({
  mockPath: './warehouseMock',  // Mock 数据目录
  port: 3100                     // 端口号
});

// 停止服务
// server.close();
```

## 🎯 功能说明

### 1. Mock 列表

- 显示所有 Mock 数据文件
- 显示文件大小和更新时间
- 支持搜索过滤
- 点击查看详情

### 2. 创建 Mock

1. 点击右上角"新建 Mock"按钮
2. 输入接口名（RPC 格式），如：`user.account.getInfo`
3. 编辑 JSON 数据
4. 点击"保存"

### 3. 编辑 Mock

1. 在列表中选择一个 Mock 数据
2. 在编辑器中修改 JSON
3. 点击"保存"

### 4. 删除 Mock

1. 选择要删除的 Mock 数据
2. 点击"删除"按钮
3. 确认删除

### 5. 编辑器功能

- **Monaco Editor** - VS Code 同款编辑器
- **语法高亮** - JSON 语法高亮
- **格式化** - 一键格式化 JSON
- **压缩** - 一键压缩 JSON
- **预览** - 查看最终的 JSON 效果

## 📂 文件命名规则

Mock 文件命名遵循 RPC 接口命名：

| 接口名 | 文件名 |
|--------|--------|
| `user.account.getInfo` | `user.account.getInfo.json` |
| `order.list.query` | `order.list.query.json` |
| `common.welfare.banner.query` | `common.welfare.banner.query.json` |

## 🎨 界面预览

### 主界面

- **左侧** - Mock 数据列表
- **右侧** - 编辑器区域

### 编辑器

- **接口名输入框** - 输入 RPC 格式的接口名
- **编辑器选项卡**
  - 编辑器 - Monaco Editor
  - 预览 - 查看 JSON 效果
- **工具栏**
  - 格式化 - 格式化 JSON
  - 压缩 - 压缩 JSON
  - 保存 - 保存修改
  - 删除 - 删除 Mock 数据

## 🔧 API 接口

管理后台提供以下 API 接口：

### 获取 Mock 列表

```
GET /api/mock/list
```

### 获取 Mock 详情

```
GET /api/mock/detail/:apiName
```

### 创建 Mock

```
POST /api/mock/create
Body: { apiName: string, data: any }
```

### 更新 Mock

```
PUT /api/mock/update/:apiName
Body: { data: any, newApiName?: string }
```

### 删除 Mock

```
DELETE /api/mock/delete/:apiName
```

## 📝 开发

```bash
# 安装依赖
npm install

# 开发服务端
npm run dev:server

# 开发客户端
npm run dev:client

# 构建
npm run build
```

## 🤝 配合使用

推荐配合以下包使用：

- [warehouse-mock](https://www.npmjs.com/package/warehouse-mock) - Webpack Mock 插件

## 📄 License

MIT

## 👨‍💻 Author

CodeMomentYY

