import express from 'express';
import cors from 'cors';
import path from 'path';
import chalk from 'chalk';
import { createMockRouter } from './routes/mock';

export interface AdminServerOptions {
  mockPath: string;  // warehouseMock 文件夹路径
  port?: number;      // 服务端口，默认 3100
}

export function createAdminServer(options: AdminServerOptions) {
  const { mockPath, port = 3100 } = options;
  
  const app = express();
  
  // 中间件
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  
  // API 路由
  app.use('/api/mock', createMockRouter(mockPath));
  
  // 静态文件服务（前端构建产物）
  // __dirname 在编译后是 dist 目录，所以 client 也在 dist/client
  const clientPath = path.join(__dirname, 'client');
  
  // 手动处理静态文件请求，确保 MIME 类型正确
  app.get('/assets/:file', (req, res) => {
    const filePath = path.join(clientPath, 'assets', req.params.file);
    
    // 根据文件扩展名设置 Content-Type
    if (req.params.file.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (req.params.file.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
    
    res.sendFile(filePath);
  });
  
  // 处理其他静态文件
  app.use(express.static(clientPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      }
    }
  }));
  
  // SPA fallback - 处理 HTML
  app.get('*', (req, res) => {
    // 避免 API 请求被 fallback
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(path.join(clientPath, 'index.html'));
  });
  
  // 启动服务
  const server = app.listen(port, () => {
    // const url = `http://localhost:${port}`;
    // console.log(chalk.cyan(`\n[WarehouseMock Admin] 管理后台已启动:`));
    // console.log(chalk.green(`  ➜  ${url}\n`));
  });
  
  return {
    server,
    url: `http://localhost:${port}`,
    close: () => server.close()
  };
}

export default createAdminServer;
