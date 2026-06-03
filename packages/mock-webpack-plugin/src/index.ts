import { Compiler } from 'webpack';
import chalk from 'chalk';
import { MockEngine, MockEngineOptions } from 'warehouse-mock-core';

interface MockPluginOptions extends MockEngineOptions {
  // 是否自动注入环境变量 VUE_APP_MOCK，默认 true
  injectEnv?: boolean;
}

class WarehouseMockPlugin {
  private engine: MockEngine;
  private injectEnv: boolean;
  private isEnabled: boolean;

  constructor(options: MockPluginOptions = {}) {
    this.injectEnv = options.injectEnv !== undefined ? options.injectEnv : true;
    this.engine = new MockEngine(options);
    this.isEnabled = this.engine.isEnabled;
  }

  /**
   * 实时扫描 mock 目录，获取所有 mock 文件名列表
   */
  getMockFileList(): string[] {
    return this.engine.getMockFileList();
  }

  /**
   * 获取本地代理路径前缀
   */
  getLocalApiPrefix(): string {
    return this.engine.getLocalApiPrefix();
  }

  apply(compiler: Compiler) {
    // 如果未启用，直接返回
    if (!this.isEnabled) {
      console.log(chalk.yellow('[WarehouseMock] Mock 模式未启用'));
      return;
    }

    // 解析 mock 目录（基于 webpack 上下文）
    this.engine.resolveMockPath(compiler.context);

    // 自动注入环境变量 VUE_APP_MOCK
    if (this.injectEnv) {
      this.injectEnvironmentVariable(compiler);
    }

    // 启动引擎：确保目录、打印加载信息、启动管理后台
    this.engine.start();

    // 注意：devServer 的配置需要在 vue.config.js 中手动配置
    // 对于 Webpack 5 使用 setupMiddlewares
    // 对于 Webpack 4 使用 before
  }

  /**
   * 自动注入环境变量 VUE_APP_MOCK
   */
  private injectEnvironmentVariable(compiler: Compiler) {
    try {
      // 使用 compiler 的 webpack 实例
      const { webpack } = compiler;
      if (webpack && webpack.DefinePlugin) {
        const definePlugin = new webpack.DefinePlugin({
          'process.env.VUE_APP_MOCK': JSON.stringify('true'),
        });

        if (!compiler.options.plugins) {
          compiler.options.plugins = [];
        }
        compiler.options.plugins.push(definePlugin);
        console.log(chalk.gray('[WarehouseMock] 已注入环境变量: VUE_APP_MOCK=true'));
      } else {
        // 备用方案：直接require webpack
        const webpackModule = require('webpack');
        const definePlugin = new webpackModule.DefinePlugin({
          'process.env.VUE_APP_MOCK': JSON.stringify('true'),
        });

        if (!compiler.options.plugins) {
          compiler.options.plugins = [];
        }
        compiler.options.plugins.push(definePlugin);
        console.log(chalk.gray('[WarehouseMock] 已注入环境变量: VUE_APP_MOCK=true'));
      }
    } catch (err) {
      console.error(chalk.red(`[WarehouseMock] 注入环境变量失败: ${err}`));
      console.log(chalk.yellow('[WarehouseMock] 请在 vue.config.js 中手动配置 DefinePlugin'));
    }
  }

  /**
   * 公共方法：设置中间件 (Webpack 5 / Vue CLI 5+)
   */
  setupMiddlewares(middlewares: any[], devServer: any, originalSetupMiddlewares?: Function) {
    console.log(chalk.cyan('[WarehouseMock] Mock 服务已启动'));

    this.engine.ensureMockDirectory();

    middlewares.unshift({
      name: 'warehouse-mock',
      middleware: this.engine.middleware,
    });

    if (originalSetupMiddlewares) {
      return originalSetupMiddlewares(middlewares, devServer);
    }
    return middlewares;
  }

  /**
   * 公共方法：设置中间件 (Webpack 4 / Vue CLI 3-4)
   */
  runBefore(app: any, server?: any, compiler?: any, originalBefore?: Function) {
    console.log(chalk.cyan('[WarehouseMock] Mock 服务已启动 (before hook)'));

    this.engine.ensureMockDirectory();

    app.use(this.engine.middleware);

    if (originalBefore) {
      originalBefore(app, server, compiler);
    }
  }
}

export = WarehouseMockPlugin;
