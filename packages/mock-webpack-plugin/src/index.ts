import { Compiler } from 'webpack';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

interface MockPluginOptions {
  // mock 数据目录路径，默认 'warehouseMock'
  mockPath?: string;
  // 需要拦截的 API 路径前缀，默认 ['/api', '/mock-api']
  apiPrefixes?: string[];
  // 本地代理路径前缀，默认 '/mock-api'
  localApiPrefix?: string;
  // 是否启用，默认 true（建议通过环境变量控制）
  enabled?: boolean;
  // 代理配置：未匹配的请求转发到真实 API
  proxy?: {
    target: string; // 例如 'https://fat-api.hellobike.com'
    changeOrigin?: boolean;
  };
  // 是否自动注入环境变量 VUE_APP_MOCK，默认 true
  injectEnv?: boolean;
  // 响应延迟（毫秒），模拟网络延迟，默认 0
  delay?: number;
}

class WarehouseMockPlugin {
  private options: Required<MockPluginOptions>;
  private resolvedMockPath: string = '';
  private isEnabled: boolean = true;

  constructor(options: MockPluginOptions = {}) {
    // 默认配置
    this.options = {
      mockPath: options.mockPath || 'warehouseMock',
      apiPrefixes: options.apiPrefixes || ['/api', '/mock-api'],
      localApiPrefix: options.localApiPrefix || '/mock-api',
      enabled: options.enabled !== undefined ? options.enabled : true,
      proxy: options.proxy || undefined,
      injectEnv: options.injectEnv !== undefined ? options.injectEnv : true,
      delay: options.delay || 0,
    } as Required<MockPluginOptions>;

    // 判断是否启用（支持环境变量控制）
    if (process.env.MOCK === 'false' || process.env.VUE_APP_MOCK === 'false') {
      this.isEnabled = false;
    }
    if (this.options.enabled === false) {
      this.isEnabled = false;
    }
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
    // 如果未启用，直接返回
    if (!this.isEnabled) {
      console.log(chalk.yellow('[WarehouseMock] Mock 模式未启用'));
      return;
    }

    this.resolvedMockPath = path.resolve(compiler.context, this.options.mockPath);
    
    // 自动注入环境变量 VUE_APP_MOCK
    if (this.options.injectEnv) {
      this.injectEnvironmentVariable(compiler);
    }

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
    console.log(chalk.cyan(`[WarehouseMock] 已加载 ${mockFileList.length} 个 mock 文件`));
    if (mockFileList.length > 0) {
      console.log(chalk.gray(`  → ${mockFileList.join(', ')}`));
    }
    
    if (this.options.proxy) {
      console.log(chalk.cyan(`[WarehouseMock] 代理模式: 未匹配请求 → ${this.options.proxy.target}`));
    }

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
        proxy: this.options.proxy?.target || null,
        enabled: this.isEnabled,
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
      console.log(chalk.green(`[WarehouseMock] ✓ 拦截: ${req.url || url}`));
      console.log(chalk.gray(`  → 返回: ${path.basename(filePath)}`));
      
      // 模拟网络延迟
      const respond = () => {
        try {
          const data = fs.readFileSync(filePath, 'utf-8');
          try {
            const jsonData = JSON.parse(data);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('X-Mock-By', 'WarehouseMock');
            res.end(JSON.stringify(jsonData));
          } catch (jsonErr) {
            console.warn(chalk.yellow(`[WarehouseMock] 无效的 JSON 文件: ${filePath}`));
            res.setHeader('Content-Type', 'text/plain');
            res.end(data);
          }
        } catch (e) {
          console.error(chalk.red(`[WarehouseMock] 读取 Mock 文件失败: ${e}`));
          res.statusCode = 500;
          res.end('Mock Read Error');
        }
      };

      if (this.options.delay > 0) {
        setTimeout(respond, this.options.delay);
      } else {
        respond();
      }
      return;
    }

    // 未匹配到 Mock 文件
    if (this.options.proxy) {
      // 如果配置了代理，转发到真实 API
      console.log(chalk.gray(`[WarehouseMock] ⊳ 代理: ${req.url || url} → ${this.options.proxy.target}`));
      this.proxyRequest(req, res, next);
    } else {
      // 未配置代理，直接放行
      next();
    }
  }

  /**
   * 代理请求到真实 API（改进版）
   */
  private proxyRequest(req: any, res: any, next: any) {
    if (!this.options.proxy) {
      return next();
    }

    try {
      const http = require('http');
      const https = require('https');
      const url = require('url');
      
      // 构建完整的目标 URL
      // 将 /mock-api?xxx 转换为 真实API/api?xxx
      const targetUrl = this.options.proxy.target + req.url.replace('/mock-api', '/api');
      const parsedUrl = url.parse(targetUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const lib = isHttps ? https : http;

      // 清理请求头
      const headers = { ...req.headers };
      delete headers.host;
      headers.host = parsedUrl.hostname;
      
      // 创建代理请求
      const proxyReq = lib.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path,
        method: req.method,
        headers: headers,
        timeout: 30000,  // 30秒超时
      }, (proxyRes: any) => {
        // 转发响应头
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        // 转发响应体
        proxyRes.pipe(res);
      });

      // 错误处理
      proxyReq.on('error', (err: Error) => {
        console.error(chalk.red(`[WarehouseMock] 代理请求失败: ${err.message}`));
        console.error(chalk.red(`  目标地址: ${targetUrl}`));
        
        // 返回友好的错误信息
        if (!res.headersSent) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            code: -1,
            msg: `代理请求失败: ${err.message}`,
            error: 'PROXY_ERROR'
          }));
        }
      });

      // 超时处理
      proxyReq.on('timeout', () => {
        proxyReq.destroy();
        if (!res.headersSent) {
          res.statusCode = 504;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            code: -1,
            msg: '代理请求超时',
            error: 'PROXY_TIMEOUT'
          }));
        }
      });

      // 转发请求体
      if (req.method === 'POST' || req.method === 'PUT') {
        // 处理 POST/PUT 请求的 body
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          if (body) {
            proxyReq.write(body);
          }
          proxyReq.end();
        });
      } else {
        proxyReq.end();
      }
    } catch (err) {
      console.error(chalk.red(`[WarehouseMock] 代理配置错误: ${err}`));
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          code: -1,
          msg: `代理配置错误: ${err}`,
          error: 'PROXY_CONFIG_ERROR'
        }));
      }
    }
  }
}

export = WarehouseMockPlugin;
