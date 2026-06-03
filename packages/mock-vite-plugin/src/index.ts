import type { Plugin, ResolvedConfig } from 'vite';
import chalk from 'chalk';
import { MockEngine, MockEngineOptions } from 'warehouse-mock-core';

export interface ViteMockPluginOptions extends MockEngineOptions {
  // 是否自动注入 Mock 环境变量，默认 true
  injectEnv?: boolean;
  // 注入到 import.meta.env 上的环境变量键名，默认 'VITE_MOCK'
  // 业务侧据此切换 API 地址：if (import.meta.env.VITE_MOCK === 'true') ...
  envKey?: string;
}

/**
 * Warehouse Mock 的 Vite 插件。
 *
 * 与 Webpack 插件共享同一套核心引擎（warehouse-mock-core），仅负责 Vite 相关的适配：
 * 1. config()          —— 注入 import.meta.env.VITE_MOCK 环境变量
 * 2. configureServer() —— 将核心中间件挂载到 Vite Dev Server
 * 3. closeBundle()     —— 关闭管理后台
 */
export function warehouseMockVite(options: ViteMockPluginOptions = {}): Plugin {
  const injectEnv = options.injectEnv !== undefined ? options.injectEnv : true;
  const envKey = options.envKey || 'VITE_MOCK';

  const engine = new MockEngine(options);
  let started = false;

  return {
    name: 'warehouse-mock-vite',
    // 仅在开发阶段（serve）生效
    apply: 'serve',

    config() {
      if (!engine.isEnabled || !injectEnv) {
        return;
      }
      // 注入环境变量，供业务代码切换 API 地址
      return {
        define: {
          [`import.meta.env.${envKey}`]: JSON.stringify('true'),
        },
      };
    },

    configResolved(config: ResolvedConfig) {
      // 基于 Vite 项目根目录解析 mock 数据目录
      engine.resolveMockPath(config.root);
    },

    configureServer(server) {
      if (!engine.isEnabled) {
        console.log(chalk.yellow('[WarehouseMock] Mock 模式未启用'));
        return;
      }

      // 启动引擎：确保目录、打印加载信息、启动管理后台（仅启动一次）
      if (!started) {
        engine.start();
        started = true;
      }

      console.log(chalk.cyan('[WarehouseMock] Mock 服务已启动 (Vite)'));

      // 将核心中间件挂载到 Vite Dev Server
      server.middlewares.use(engine.middleware);
    },

    closeBundle() {
      engine.closeAdmin();
    },
  };
}

export default warehouseMockVite;
