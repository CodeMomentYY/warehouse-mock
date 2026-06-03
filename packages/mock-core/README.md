# warehouse-mock-core

Warehouse Mock 的**框架无关核心引擎**。封装所有与构建工具无关的逻辑，供 [`warehouse-mock`](../mock-webpack-plugin)（Webpack 插件）与 [`warehouse-mock-vite`](../mock-vite-plugin)（Vite 插件）复用。

> 一般情况下你不需要直接安装本包，它会作为上述插件的依赖被自动安装。

---

## 🎯 职责

`MockEngine` 类负责：

- **请求拦截与匹配**：RPC 风格 query string → 扁平化命名 → 嵌套目录，多级回退
- **多场景 / 延时 / 启用配置**：读取 `.config.json`，按 `activeScene` 返回数据
- **代理转发**：未匹配请求转发到真实 API
- **Mock 文件扫描**：`getMockFileList()` 与 `/__mock_list__` 端点
- **管理后台启动**：动态加载 `warehouse-mock-admin`

它对外暴露一个标准的 connect 风格中间件 `engine.middleware`，因此任何能挂载 `(req, res, next)` 中间件的 Dev Server 都能集成。

---

## 🔌 给适配层（插件作者）的用法

```typescript
import { MockEngine } from 'warehouse-mock-core';

const engine = new MockEngine(options);

// 1. 基于构建工具的项目根目录解析 mock 目录
engine.resolveMockPath(projectRoot);

// 2. 启动：确保目录、打印加载信息、启动管理后台
engine.start();

// 3. 将中间件挂载到 Dev Server
server.middlewares.use(engine.middleware);

// 4. 关闭时清理管理后台
engine.closeAdmin();
```

Webpack 与 Vite 插件就是在此基础上，各自补充「中间件挂载方式」和「环境变量注入方式」两块框架相关逻辑。

---

## 📄 License

MIT © CodeMomentYY
