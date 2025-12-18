import { Compiler } from 'webpack';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

interface MockPluginOptions {
  // mock 数据目录路径
  mockPath: string;
  // 需要拦截的 API 路径前缀，默认 ['/api', '/mock-api']
  apiPrefixes?: string[];
  // 本地代理路径前缀，默认 '/mock-api'
  localApiPrefix?: string;
}

class WarehouseMockPlugin {
  private options: MockPluginOptions;
  private resolvedMockPath: string = '';

  constructor(options: MockPluginOptions) {
    this.options = {
      apiPrefixes: ['/api', '/mock-api'],
      localApiPrefix: '/mock-api',
      ...options,
    };
  }

  /**
   * 实时扫描 mock 目录，获取所有 mock 文件名列表
   */
  getMockFileList(): string[] {
    const mockPath = this.getResolvedMockPath();
    const fileList: string[] = [];

    if (fs.existsSync(mockPath)) {
      const files = fs.readdirSync(mockPath);
      files.forEach((file) => {
        if (file.endsWith('.json')) {
          fileList.push(file.replace(/\.json$/, ''));
        }
      });
    }

    return fileList;
  }

  /**
   * 获取本地代理路径前缀
   */
  getLocalApiPrefix(): string {
    return this.options.localApiPrefix || '/mock-api';
  }

  apply(compiler: Compiler) {
    this.resolvedMockPath = path.resolve(compiler.context, this.options.mockPath);
    
    // 确保 mock 目录存在
    if (!fs.existsSync(this.resolvedMockPath)) {
      try {
        fs.mkdirSync(this.resolvedMockPath, { recursive: true });
        console.log(chalk.green(`[WarehouseMock] Mock 目录已创建: ${this.resolvedMockPath}`));
        this.createDemoFile(this.resolvedMockPath);
      } catch (err) {
        console.error(chalk.red(`[WarehouseMock] 创建 Mock 目录失败: ${err}`));
      }
    }

    const mockFileList = this.getMockFileList();
    console.log(chalk.cyan(`[WarehouseMock] 已加载 ${mockFileList.length} 个 mock 文件: ${mockFileList.join(', ')}`));

    const devServerOptions = compiler.options.devServer || {};
    const originalSetupMiddlewares = devServerOptions.setupMiddlewares;
    
    if (!compiler.options.devServer) {
      compiler.options.devServer = {};
    }

    // 适用于 Webpack 5 (setupMiddlewares)
    compiler.options.devServer.setupMiddlewares = (middlewares: any[], devServer: any) => {
      return this.setupMiddlewares(middlewares, devServer, originalSetupMiddlewares);
    };

    // 适用于 Webpack 4 (before)
    const originalBefore = devServerOptions.before;
    compiler.options.devServer.before = (app: any, server: any, compilerArg: any) => {
      this.runBefore(app, server, compilerArg, originalBefore);
    };
  }

  /**
   * 公共方法：设置中间件 (Webpack 5 / Vue CLI 5+)
   */
  setupMiddlewares(middlewares: any[], devServer: any, originalSetupMiddlewares?: Function) {
    console.log(chalk.cyan('[WarehouseMock] Mock 服务已启动'));
    
    const mockPath = this.getResolvedMockPath();
    this.ensureMockDirectory(mockPath);

    middlewares.unshift({
      name: 'warehouse-mock',
      middleware: (req: any, res: any, next: any) => this.handleRequest(req, res, next, mockPath),
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
    
    const mockPath = this.getResolvedMockPath();
    this.ensureMockDirectory(mockPath);

    app.use((req: any, res: any, next: any) => this.handleRequest(req, res, next, mockPath));
    
    if (originalBefore) {
      originalBefore(app, server, compiler);
    }
  }

  private getResolvedMockPath(): string {
    if (this.resolvedMockPath) {
      return this.resolvedMockPath;
    }
    return path.isAbsolute(this.options.mockPath)
      ? this.options.mockPath
      : path.resolve(process.cwd(), this.options.mockPath);
  }

  private ensureMockDirectory(mockPath: string) {
    if (!fs.existsSync(mockPath)) {
      try {
        fs.mkdirSync(mockPath, { recursive: true });
        console.log(chalk.green(`[WarehouseMock] Mock 目录已创建: ${mockPath}`));
        this.createDemoFile(mockPath);
      } catch (err) {
        console.error(chalk.red(`[WarehouseMock] 创建 Mock 目录失败: ${err}`));
      }
    }
  }

  private createDemoFile(mockPath: string) {
    const demoFilePath = path.join(mockPath, 'demo.json');
    const demoContent = {
      code: 0,
      msg: 'success',
      data: {
        message: '这是自动生成的 demo 数据',
        id: 1,
        name: 'Demo User',
        description: 'Warehouse Mock 自动创建的示例文件',
      },
    };
    try {
      fs.writeFileSync(demoFilePath, JSON.stringify(demoContent, null, 2));
      console.log(chalk.green(`[WarehouseMock] 已创建示例 Mock 文件: ${demoFilePath}`));
    } catch (e) {
      console.error(chalk.yellow(`[WarehouseMock] 创建示例文件失败: ${e}`));
    }
  }

  private handleRequest(req: any, res: any, next: any, mockPath: string) {
    const url = req.path || req.url?.split('?')[0];

    if (!url) {
      return next();
    }

    // ============ 特殊端点：实时返回 mock 文件列表 ============
    if (url === '/__mock_list__') {
      const fileList = this.getMockFileList();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.end(JSON.stringify({
        mockList: fileList,
        localApiPrefix: this.getLocalApiPrefix(),
      }));
      return;
    }

    // 安全检查：防止目录遍历
    if (url.includes('..')) {
      return next();
    }

    // 检查是否在允许的 API 前缀范围内
    const { apiPrefixes } = this.options;
    const isApiRequest = apiPrefixes?.some((prefix) => url.startsWith(prefix)) ?? true;
    
    if (!isApiRequest) {
      return next();
    }

    let filePath = '';
    let matched = false;
    let matchedName = '';

    // 1. 优先尝试 Query String 匹配 (RPC 风格接口，如 /api?user.taurus.pointInfo)
    if (req.url && req.url.includes('?')) {
      const queryPart = req.url.split('?')[1];
      if (queryPart) {
        const params = new URLSearchParams(queryPart);
        for (const key of params.keys()) {
          // 尝试匹配 key.json (例如 user.taurus.pointInfo.json)
          const queryFilePath = path.join(mockPath, `${key}.json`);
          if (fs.existsSync(queryFilePath) && fs.statSync(queryFilePath).isFile()) {
            filePath = queryFilePath;
            matchedName = key;
            matched = true;
            break;
          }

          // 也尝试匹配 value (例如 method=user.taurus.pointInfo)
          const value = params.get(key);
          if (value) {
            const valueFilePath = path.join(mockPath, `${value}.json`);
            if (fs.existsSync(valueFilePath) && fs.statSync(valueFilePath).isFile()) {
              filePath = valueFilePath;
              matchedName = value;
              matched = true;
              break;
            }
          }
        }
      }
    }

    // 2. 尝试扁平化命名 (将路径中的 / 替换为 _)
    if (!matched) {
      const flatName = url.replace(/^\//, '').replace(/\//g, '_') || 'index';
      const flatFilePath = path.join(mockPath, `${flatName}.json`);

      if (fs.existsSync(flatFilePath) && fs.statSync(flatFilePath).isFile()) {
        filePath = flatFilePath;
        matchedName = flatName;
        matched = true;
      }
    }

    // 3. 尝试嵌套目录结构匹配 (向后兼容)
    if (!matched) {
      const nestedFilePath = path.join(mockPath, url + '.json');
      if (fs.existsSync(nestedFilePath) && fs.statSync(nestedFilePath).isFile()) {
        filePath = nestedFilePath;
        matchedName = url;
        matched = true;
      } else {
        const indexFilePath = path.join(mockPath, url, 'index.json');
        if (fs.existsSync(indexFilePath) && fs.statSync(indexFilePath).isFile()) {
          filePath = indexFilePath;
          matchedName = url + '/index';
          matched = true;
        }
      }
    }

    if (matched) {
      console.log(chalk.green(`[WarehouseMock] 拦截: ${matchedName} -> ${path.basename(filePath)}`));
      try {
        const data = fs.readFileSync(filePath, 'utf-8');
        try {
          const jsonData = JSON.parse(data);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(jsonData));
        } catch (jsonErr) {
          console.warn(chalk.yellow(`[WarehouseMock] 无效的 JSON 文件: ${filePath}`));
          res.setHeader('Content-Type', 'text/plain');
          res.end(data);
        }
        return;
      } catch (e) {
        console.error(chalk.red(`[WarehouseMock] 读取 Mock 文件失败: ${e}`));
        res.statusCode = 500;
        res.end('Mock Read Error');
        return;
      }
    }

    next();
  }
}

export = WarehouseMockPlugin;
