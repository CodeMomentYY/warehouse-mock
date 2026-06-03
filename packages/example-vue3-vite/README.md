# example-vue3-vite

Warehouse Mock 的 **Vue3 + Vite** 示例项目，用于演示和验证 [`warehouse-mock-vite`](../mock-vite-plugin) 插件。

## 运行

```bash
# 在仓库根目录安装依赖后
cd packages/example-vue3-vite

# 普通模式（请求真实 API）
npm run dev

# Mock 模式
npm run mock
```

- 前端应用：`http://localhost:5173`
- 管理后台：`http://localhost:3100`
- 调试端点：`http://localhost:5173/__mock_list__`

## 关键文件

| 文件 | 说明 |
|---|---|
| `vite.config.js` | 插件接入示例（3 步配置） |
| `src/const/config.js` | 用 `import.meta.env.VITE_MOCK` 切换 API 地址 |
| `src/api/utils.js` | RPC 风格请求封装 |
| `warehouseMock/` | Mock 数据（接口目录 + 场景文件） |
