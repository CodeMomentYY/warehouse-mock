import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export interface MockEngineOptions {
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
    target: string; // 例如 'https://dev-api.example.com'
    changeOrigin?: boolean;
  };
  // 响应延迟（毫秒），模拟网络延迟，默认 0
  delay?: number;
  // 管理后台配置
  admin?: {
    enabled?: boolean; // 是否启用管理后台，默认 true
    port?: number;      // 管理后台端口，默认 3100
  };
}

type ResolvedOptions = Required<Omit<MockEngineOptions, 'proxy'>> & {
  proxy?: MockEngineOptions['proxy'];
};

/**
 * 框架无关的 Mock 核心引擎。
 *
 * 负责所有与构建工具无关的逻辑：请求匹配与拦截、多场景/延时/启用配置、
 * 代理转发、Mock 文件扫描以及管理后台启动。
 *
 * Webpack 插件与 Vite 插件均复用本引擎，自身只需处理「中间件挂载」与
 * 「环境变量注入」等框架相关的适配工作。
 */
export class MockEngine {
  private options: ResolvedOptions;
  private resolvedMockPath: string = '';
  public isEnabled: boolean = true;
  private adminServer: any = null;

  constructor(options: MockEngineOptions = {}) {
    // 默认配置
    this.options = {
      mockPath: options.mockPath || 'warehouseMock',
      apiPrefixes: options.apiPrefixes || ['/api', '/mock-api'],
      localApiPrefix: options.localApiPrefix || '/mock-api',
      enabled: options.enabled !== undefined ? options.enabled : true,
      proxy: options.proxy || undefined,
      delay: options.delay || 0,
      admin: {
        enabled: options.admin?.enabled !== undefined ? options.admin.enabled : true,
        port: options.admin?.port || 3100,
      },
    } as ResolvedOptions;

    // 判断是否启用（支持环境变量控制）
    if (process.env.MOCK === 'false' || process.env.VUE_APP_MOCK === 'false') {
      this.isEnabled = false;
    }
    if (this.options.enabled === false) {
      this.isEnabled = false;
    }
  }

  /**
   * 解析 mock 目录的绝对路径。
   * @param context 基准目录（Webpack 为 compiler.context，Vite 为 config.root）
   */
  resolveMockPath(context: string): string {
    this.resolvedMockPath = path.isAbsolute(this.options.mockPath)
      ? this.options.mockPath
      : path.resolve(context, this.options.mockPath);
    return this.resolvedMockPath;
  }

  getResolvedMockPath(): string {
    if (this.resolvedMockPath) {
      return this.resolvedMockPath;
    }
    return path.isAbsolute(this.options.mockPath)
      ? this.options.mockPath
      : path.resolve(process.cwd(), this.options.mockPath);
  }

  /**
   * 启动引擎：确保目录存在、打印加载信息、启动管理后台。
   * 需在 resolveMockPath 之后调用。
   */
  start() {
    const mockPath = this.getResolvedMockPath();
    this.ensureMockDirectory(mockPath);

    const mockFileList = this.getMockFileList();
    console.log(chalk.cyan(`[WarehouseMock] 已加载 ${mockFileList.length} 个 mock 文件`));
    if (mockFileList.length > 0) {
      console.log(chalk.gray(`  → ${mockFileList.join(', ')}`));
    }

    if (this.options.proxy) {
      console.log(chalk.cyan(`[WarehouseMock] 代理模式: 未匹配请求 → ${this.options.proxy.target}`));
    }

    // 启动管理后台
    if (this.options.admin && this.options.admin.enabled) {
      this.startAdminServer();
    }
  }

  /**
   * connect 风格中间件，供 Webpack devServer / Vite server 直接挂载。
   */
  middleware = (req: any, res: any, next: any) => {
    return this.handleRequest(req, res, next, this.getResolvedMockPath());
  };

  /**
   * 实时扫描 mock 目录，获取所有 mock 文件名列表
   * 支持两种格式：
   * 1. 旧格式：api.json
   * 2. 新格式：api/.config.json
   */
  getMockFileList(): string[] {
    const mockPath = this.getResolvedMockPath();
    const fileList: string[] = [];

    if (fs.existsSync(mockPath)) {
      const files = fs.readdirSync(mockPath);
      files.forEach((file) => {
        const filePath = path.join(mockPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          // 新格式：检查目录下是否有 .config.json
          const configPath = path.join(filePath, '.config.json');
          if (fs.existsSync(configPath)) {
            fileList.push(file);
          }
        } else if (file.endsWith('.json') && !file.startsWith('.')) {
          // 旧格式：直接是 .json 文件（排除 .config.json 等隐藏文件）
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

  /**
   * 关闭管理后台（供框架的关闭钩子调用）
   */
  closeAdmin() {
    if (this.adminServer && typeof this.adminServer.close === 'function') {
      try {
        this.adminServer.close();
      } catch (e) {
        // 忽略关闭异常
      }
      this.adminServer = null;
    }
  }

  /**
   * 启动管理后台服务
   */
  private startAdminServer() {
    try {
      // 动态导入管理后台服务
      let createAdminServer;
      try {
        // 尝试导入已安装的包
        createAdminServer = require('warehouse-mock-admin').createAdminServer;
      } catch (e) {
        // 如果找不到，尝试相对路径（开发环境）
        const adminPath = require('path').resolve(__dirname, '../../mock-admin/dist/server/index.js');
        createAdminServer = require(adminPath).createAdminServer;
      }

      if (!createAdminServer) {
        throw new Error('无法加载管理后台模块');
      }

      const adminResult = createAdminServer({
        mockPath: this.resolvedMockPath,
        port: this.options.admin?.port || 3100,
      });

      this.adminServer = adminResult;

      console.log(chalk.green(`\n╭────────────────────────────────────────────────────╮`));
      console.log(chalk.green(`│  🎨 Mock 数据管理后台已启动                          │`));
      console.log(chalk.green(`│                                                    │`));
      console.log(chalk.green(`│  ➜  访问地址: ${chalk.cyan(adminResult.url).padEnd(31)} │`));
      console.log(chalk.green(`│                                                    │`));
      console.log(chalk.green(`│  在浏览器中打开上面的地址来管理 Mock 数据            │`));
      console.log(chalk.green(`╰────────────────────────────────────────────────────╯\n`));
    } catch (err: any) {
      console.log(chalk.yellow('[WarehouseMock] 管理后台包未安装或加载失败，跳过启动'));
      console.log(chalk.gray('  提示：运行 npm install warehouse-mock-admin 来安装管理后台'));
      if (err.message && !err.message.includes('Cannot find module')) {
        console.log(chalk.gray(`  错误详情: ${err.message}`));
      }
    }
  }

  ensureMockDirectory(mockPath: string = this.getResolvedMockPath()) {
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

  // 读取接口配置
  private readInterfaceConfig(apiName: string, mockPath: string): any {
    const configPath = path.join(mockPath, apiName, '.config.json');
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
      } catch (e) {
        return null;
      }
    }
    return null;
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
    let interfaceConfig: any = null;

    // 1. 优先尝试 Query String 匹配 (RPC 风格接口，如 /api?user.taurus.pointInfo)
    if (req.url && req.url.includes('?')) {
      const queryPart = req.url.split('?')[1];
      if (queryPart) {
        const params = new URLSearchParams(queryPart);
        for (const key of params.keys()) {
          // 先尝试目录模式（优先，支持多场景）
          const dirPath = path.join(mockPath, key);
          if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            // 读取接口配置（新格式）
            const config = this.readInterfaceConfig(key, mockPath);

            if (config) {
              // 新格式：检查是否启用
              if (config.enabled === false) {
                console.log(chalk.yellow(`[WarehouseMock] ✗ 接口已禁用: ${key}`));
                break; // 接口被禁用，不拦截
              }

              // 根据 activeScene 读取场景文件
              const activeScene = config.activeScene || 'default';
              const sceneFilePath = path.join(dirPath, `${activeScene}.json`);

              if (fs.existsSync(sceneFilePath)) {
                filePath = sceneFilePath;
                matchedName = key;
                matched = true;
                interfaceConfig = config;
                break;
              }
            } else {
              // 旧格式：查找 mock: true 的文件（向后兼容）
              const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json') && f !== '.config.json');
              for (const file of files) {
                const fullPath = path.join(dirPath, file);
                try {
                  const content = fs.readFileSync(fullPath, 'utf-8');
                  const jsonData = JSON.parse(content);
                  if (jsonData.mock === true) {
                    filePath = fullPath;
                    matchedName = key;
                    matched = true;
                    break;
                  }
                } catch (e) {
                  // 文件解析失败，跳过
                }
              }
              if (matched) break;
            }
          }

          // 再尝试单文件模式（向后兼容）
          if (!matched) {
            const queryFilePath = path.join(mockPath, `${key}.json`);
            if (fs.existsSync(queryFilePath) && fs.statSync(queryFilePath).isFile()) {
              filePath = queryFilePath;
              matchedName = key;
              matched = true;
              break;
            }
          }

          // 也尝试匹配 value (例如 method=user.taurus.pointInfo)
          const value = params.get(key);
          if (value && !matched) {
            const valueDirPath = path.join(mockPath, value);
            if (fs.existsSync(valueDirPath) && fs.statSync(valueDirPath).isDirectory()) {
              // 读取接口配置（新格式）
              const config = this.readInterfaceConfig(value, mockPath);

              if (config) {
                // 新格式：检查是否启用
                if (config.enabled === false) {
                  console.log(chalk.yellow(`[WarehouseMock] ✗ 接口已禁用: ${value}`));
                  break;
                }

                // 根据 activeScene 读取场景文件
                const activeScene = config.activeScene || 'default';
                const sceneFilePath = path.join(valueDirPath, `${activeScene}.json`);

                if (fs.existsSync(sceneFilePath)) {
                  filePath = sceneFilePath;
                  matchedName = value;
                  matched = true;
                  interfaceConfig = config;
                  break;
                }
              } else {
                // 旧格式：查找 mock: true 的文件（向后兼容）
                const files = fs.readdirSync(valueDirPath).filter(f => f.endsWith('.json') && f !== '.config.json');
                for (const file of files) {
                  const fullPath = path.join(valueDirPath, file);
                  try {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const jsonData = JSON.parse(content);
                    if (jsonData.mock === true) {
                      filePath = fullPath;
                      matchedName = value;
                      matched = true;
                      break;
                    }
                  } catch (e) {
                    // 跳过
                  }
                }
                if (matched) break;
              }
            }

            if (!matched) {
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

      // 获取延时配置（优先使用接口级别的 delay）
      const delayTime = interfaceConfig?.delay !== undefined
        ? interfaceConfig.delay
        : this.options.delay || 0;

      // 获取场景名称
      const sceneName = interfaceConfig?.activeScene || path.basename(filePath, '.json');

      console.log(chalk.gray(`  → 场景: ${sceneName}`));
      if (delayTime > 0) {
        console.log(chalk.gray(`  → 延迟: ${delayTime}ms`));
      }

      // 模拟网络延迟
      const respond = () => {
        try {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          try {
            const jsonData = JSON.parse(fileContent);

            // 新格式：纯净的场景数据（不包含 mock、scene、delay 等元数据）
            // 旧格式：包含 mock、scene、delay、data 字段
            let responseData = jsonData;

            // 兼容旧格式
            if (jsonData.mock !== undefined && jsonData.data !== undefined) {
              responseData = jsonData.data;
            }

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('X-Mock-By', 'WarehouseMock');
            res.setHeader('X-Mock-Scene', sceneName);

            res.end(JSON.stringify(responseData));
          } catch (jsonErr) {
            console.warn(chalk.yellow(`[WarehouseMock] 无效的 JSON 文件: ${filePath}`));
            res.setHeader('Content-Type', 'text/plain');
            res.end(fileContent);
          }
        } catch (e) {
          console.error(chalk.red(`[WarehouseMock] 读取 Mock 文件失败: ${e}`));
          res.statusCode = 500;
          res.end('Mock Read Error');
        }
      };

      // 应用延迟
      if (delayTime > 0) {
        setTimeout(respond, delayTime);
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

export default MockEngine;
