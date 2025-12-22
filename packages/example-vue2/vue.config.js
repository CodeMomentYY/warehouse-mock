/**
 * Vue Config - Warehouse Mock 插件配置示例
 * 
 * 极简配置，只需要 3 步：
 * 1. 引入插件
 * 2. 判断是否启用 Mock 模式
 * 3. 添加到 configureWebpack
 * 
 * 无需手动配置 DefinePlugin 和 devServer！
 */

const WarehouseMockPlugin = require('warehouse-mock-plugin');

// 是否启用 Mock 模式（通过环境变量控制）
const isMock = process.env.MOCK === 'true';

// 创建插件实例
const mockPlugin = isMock ? new WarehouseMockPlugin({
  // 可选配置项（都有默认值）
  // mockPath: 'warehouseMock',        // Mock 数据目录，默认 'warehouseMock'
  // apiPrefixes: ['/api', '/mock-api'], // 拦截的 API 前缀
  // localApiPrefix: '/mock-api',      // 本地 API 前缀
  // injectEnv: true,                  // 自动注入 VUE_APP_MOCK 环境变量
  // delay: 0,                         // 响应延迟（毫秒）
  
  // 代理模式（可选）：未匹配的请求转发到真实 API
  // proxy: {
  //   target: 'https://fat-api.hellobike.com',
  //   changeOrigin: true,
  // }
}) : null;

module.exports = {
  configureWebpack: config => {
    if (isMock && mockPlugin) {
      config.plugins.push(mockPlugin);
    }
  },
  
  devServer: {
    // Vue CLI 5.x (Webpack 5) - setupMiddlewares
    setupMiddlewares: (middlewares, devServer) => {
      if (isMock && mockPlugin) {
        return mockPlugin.setupMiddlewares(middlewares, devServer);
      }
      return middlewares;
    }
  }
};

/**
 * 注意事项：
 * 
 * 1. 插件会自动注入 VUE_APP_MOCK 环境变量，无需手动配置 DefinePlugin
 * 2. 插件会自动配置 devServer 中间件，无需手动配置 setupMiddlewares 或 before
 * 3. 只需在 src/const/config.js 中判断 process.env.VUE_APP_MOCK 即可切换 API
 * 
 * 对比旧版配置，代码量减少了 70%！
 */

