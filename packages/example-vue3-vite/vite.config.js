/**
 * Vite Config - Warehouse Mock Vite 插件配置示例
 *
 * 极简配置，只需要 3 步：
 * 1. 引入插件
 * 2. 判断是否启用 Mock 模式
 * 3. 添加到 plugins
 *
 * 插件会自动：
 * - 注入 import.meta.env.VITE_MOCK 环境变量
 * - 挂载 Dev Server 中间件拦截请求
 * - 启动可视化管理后台（默认端口 3100）
 */
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { warehouseMockVite } from 'warehouse-mock-vite';

// 是否启用 Mock 模式（通过环境变量控制）
const isMock = process.env.MOCK === 'true';

export default defineConfig({
  plugins: [
    vue(),
    // 仅在 Mock 模式下启用
    ...(isMock
      ? [
          warehouseMockVite({
            // 可选配置项（都有默认值）
            // mockPath: 'warehouseMock',          // Mock 数据目录
            // apiPrefixes: ['/api', '/mock-api'], // 拦截的 API 前缀
            // localApiPrefix: '/mock-api',        // 本地 API 前缀
            // envKey: 'VITE_MOCK',                // 注入的环境变量键名
            // delay: 0,                           // 全局响应延迟（毫秒）
            // admin: { enabled: true, port: 3100 },

            // 代理模式（可选）：未匹配的请求转发到真实 API
            // proxy: {
            //   target: 'https://dev-api.example.com',
            //   changeOrigin: true,
            // },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
});
