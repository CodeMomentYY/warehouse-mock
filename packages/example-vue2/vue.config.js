/**
 * Vue Config - 模拟 AppPlatformH5 的配置方式
 * 
 * 这个配置演示了如何在类似 hellobike 项目中接入 mock 插件：
 * 1. 使用 DefinePlugin 注入 VUE_APP_MOCK 环境变量
 * 2. 根据 Vue CLI 版本使用对应的中间件钩子
 */

const path = require('path');
const webpack = require('webpack');
const WarehouseMockPlugin = require('warehouse-mock-plugin');

// ============ Mock 模式判断 ============
const isMock = process.env.MOCK === 'true';

// ============ Mock 插件初始化 ============
const mockPlugin = new WarehouseMockPlugin({
  mockPath: path.resolve(__dirname, 'warehouseMock'),
  apiPrefixes: ['/api', '/mock-api'],
});

module.exports = {
  configureWebpack: config => {
    if (isMock) {
      console.log('Mock mode enabled');
      
      // 1. 注入环境变量，让 src/const/config.js 能识别 mock 模式
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

/**
 * 注意：如果是 Vue CLI 3.x 项目，请使用 before 钩子：
 * 
 * devServer: {
 *   before: isMock ? (app) => mockPlugin.runBefore(app) : undefined,
 * }
 */
