/**
 * API 配置文件 - Vue3 + Vite 版本
 *
 * 与 Vue2 版本的唯一区别：使用 import.meta.env.VITE_MOCK 判断 Mock 模式
 * （Vite 惯例），由 warehouse-mock-vite 插件自动注入。
 */

const config = {
  env: import.meta.env.MODE || 'dev',
};

// Mock 模式：使用本地 API 路径
if (import.meta.env.VITE_MOCK === 'true') {
  console.log('[Config] Mock 模式，API 指向本地');
  Object.assign(config, {
    API: '/mock-api',
  });
} else {
  // 非 Mock 模式：使用外部 API
  Object.assign(config, {
    API: 'https://dev-api.example.com/api',
  });
}

export default config;
