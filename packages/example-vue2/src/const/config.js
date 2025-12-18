/**
 * API 配置文件 - 模拟 AppPlatformH5 的 src/const/config.js
 */

const config = {
  env: process.env.VUE_APP_ENV || 'dev',
};

// Mock 模式：使用本地 API 路径
if (process.env.VUE_APP_MOCK === 'true') {
  console.log('[Config] Mock 模式，API 指向本地');
  Object.assign(config, {
    API: '/mock-api',
    EBIKE_API: '/mock-api',
    BIKE_API: '/mock-api',
  });
} else if (config.env === 'dev' || config.env === 'fat') {
  // 开发/测试环境：使用外部 API
  Object.assign(config, {
    API: 'https://fat-api.hellobike.com/api',
    EBIKE_API: 'https://fat-ebike.hellobike.com/api',
    BIKE_API: 'https://fat-bike.hellobike.com/api',
  });
} else if (config.env === 'pro') {
  // 生产环境
  Object.assign(config, {
    API: 'https://api.hellobike.com/api',
    EBIKE_API: 'https://ebike.hellobike.com/api',
    BIKE_API: 'https://bike.hellobike.com/api',
  });
}

export default config;

