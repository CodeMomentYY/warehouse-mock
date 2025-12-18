"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
class WarehouseMockPlugin {
    constructor(options) {
        this.resolvedMockPath = '';
        this.options = Object.assign({ apiPrefixes: ['/api', '/mock-api'], localApiPrefix: '/mock-api' }, options);
    }
    /**
     * 实时扫描 mock 目录，获取所有 mock 文件名列表
     */
    getMockFileList() {
        const mockPath = this.getResolvedMockPath();
        const fileList = [];
        if (fs_1.default.existsSync(mockPath)) {
            const files = fs_1.default.readdirSync(mockPath);
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
    getLocalApiPrefix() {
        return this.options.localApiPrefix || '/mock-api';
    }
    apply(compiler) {
        this.resolvedMockPath = path_1.default.resolve(compiler.context, this.options.mockPath);
        // 确保 mock 目录存在
        if (!fs_1.default.existsSync(this.resolvedMockPath)) {
            try {
                fs_1.default.mkdirSync(this.resolvedMockPath, { recursive: true });
                console.log(chalk_1.default.green(`[WarehouseMock] Mock 目录已创建: ${this.resolvedMockPath}`));
                this.createDemoFile(this.resolvedMockPath);
            }
            catch (err) {
                console.error(chalk_1.default.red(`[WarehouseMock] 创建 Mock 目录失败: ${err}`));
            }
        }
        const mockFileList = this.getMockFileList();
        console.log(chalk_1.default.cyan(`[WarehouseMock] 已加载 ${mockFileList.length} 个 mock 文件: ${mockFileList.join(', ')}`));
        const devServerOptions = compiler.options.devServer || {};
        const originalSetupMiddlewares = devServerOptions.setupMiddlewares;
        if (!compiler.options.devServer) {
            compiler.options.devServer = {};
        }
        // 适用于 Webpack 5 (setupMiddlewares)
        compiler.options.devServer.setupMiddlewares = (middlewares, devServer) => {
            return this.setupMiddlewares(middlewares, devServer, originalSetupMiddlewares);
        };
        // 适用于 Webpack 4 (before)
        const originalBefore = devServerOptions.before;
        compiler.options.devServer.before = (app, server, compilerArg) => {
            this.runBefore(app, server, compilerArg, originalBefore);
        };
    }
    /**
     * 公共方法：设置中间件 (Webpack 5 / Vue CLI 5+)
     */
    setupMiddlewares(middlewares, devServer, originalSetupMiddlewares) {
        console.log(chalk_1.default.cyan('[WarehouseMock] Mock 服务已启动'));
        const mockPath = this.getResolvedMockPath();
        this.ensureMockDirectory(mockPath);
        middlewares.unshift({
            name: 'warehouse-mock',
            middleware: (req, res, next) => this.handleRequest(req, res, next, mockPath),
        });
        if (originalSetupMiddlewares) {
            return originalSetupMiddlewares(middlewares, devServer);
        }
        return middlewares;
    }
    /**
     * 公共方法：设置中间件 (Webpack 4 / Vue CLI 3-4)
     */
    runBefore(app, server, compiler, originalBefore) {
        console.log(chalk_1.default.cyan('[WarehouseMock] Mock 服务已启动 (before hook)'));
        const mockPath = this.getResolvedMockPath();
        this.ensureMockDirectory(mockPath);
        app.use((req, res, next) => this.handleRequest(req, res, next, mockPath));
        if (originalBefore) {
            originalBefore(app, server, compiler);
        }
    }
    getResolvedMockPath() {
        if (this.resolvedMockPath) {
            return this.resolvedMockPath;
        }
        return path_1.default.isAbsolute(this.options.mockPath)
            ? this.options.mockPath
            : path_1.default.resolve(process.cwd(), this.options.mockPath);
    }
    ensureMockDirectory(mockPath) {
        if (!fs_1.default.existsSync(mockPath)) {
            try {
                fs_1.default.mkdirSync(mockPath, { recursive: true });
                console.log(chalk_1.default.green(`[WarehouseMock] Mock 目录已创建: ${mockPath}`));
                this.createDemoFile(mockPath);
            }
            catch (err) {
                console.error(chalk_1.default.red(`[WarehouseMock] 创建 Mock 目录失败: ${err}`));
            }
        }
    }
    createDemoFile(mockPath) {
        const demoFilePath = path_1.default.join(mockPath, 'demo.json');
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
            fs_1.default.writeFileSync(demoFilePath, JSON.stringify(demoContent, null, 2));
            console.log(chalk_1.default.green(`[WarehouseMock] 已创建示例 Mock 文件: ${demoFilePath}`));
        }
        catch (e) {
            console.error(chalk_1.default.yellow(`[WarehouseMock] 创建示例文件失败: ${e}`));
        }
    }
    handleRequest(req, res, next, mockPath) {
        var _a, _b;
        const url = req.path || ((_a = req.url) === null || _a === void 0 ? void 0 : _a.split('?')[0]);
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
        const isApiRequest = (_b = apiPrefixes === null || apiPrefixes === void 0 ? void 0 : apiPrefixes.some((prefix) => url.startsWith(prefix))) !== null && _b !== void 0 ? _b : true;
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
                    const queryFilePath = path_1.default.join(mockPath, `${key}.json`);
                    if (fs_1.default.existsSync(queryFilePath) && fs_1.default.statSync(queryFilePath).isFile()) {
                        filePath = queryFilePath;
                        matchedName = key;
                        matched = true;
                        break;
                    }
                    // 也尝试匹配 value (例如 method=user.taurus.pointInfo)
                    const value = params.get(key);
                    if (value) {
                        const valueFilePath = path_1.default.join(mockPath, `${value}.json`);
                        if (fs_1.default.existsSync(valueFilePath) && fs_1.default.statSync(valueFilePath).isFile()) {
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
            const flatFilePath = path_1.default.join(mockPath, `${flatName}.json`);
            if (fs_1.default.existsSync(flatFilePath) && fs_1.default.statSync(flatFilePath).isFile()) {
                filePath = flatFilePath;
                matchedName = flatName;
                matched = true;
            }
        }
        // 3. 尝试嵌套目录结构匹配 (向后兼容)
        if (!matched) {
            const nestedFilePath = path_1.default.join(mockPath, url + '.json');
            if (fs_1.default.existsSync(nestedFilePath) && fs_1.default.statSync(nestedFilePath).isFile()) {
                filePath = nestedFilePath;
                matchedName = url;
                matched = true;
            }
            else {
                const indexFilePath = path_1.default.join(mockPath, url, 'index.json');
                if (fs_1.default.existsSync(indexFilePath) && fs_1.default.statSync(indexFilePath).isFile()) {
                    filePath = indexFilePath;
                    matchedName = url + '/index';
                    matched = true;
                }
            }
        }
        if (matched) {
            console.log(chalk_1.default.green(`[WarehouseMock] 拦截: ${matchedName} -> ${path_1.default.basename(filePath)}`));
            try {
                const data = fs_1.default.readFileSync(filePath, 'utf-8');
                try {
                    const jsonData = JSON.parse(data);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(jsonData));
                }
                catch (jsonErr) {
                    console.warn(chalk_1.default.yellow(`[WarehouseMock] 无效的 JSON 文件: ${filePath}`));
                    res.setHeader('Content-Type', 'text/plain');
                    res.end(data);
                }
                return;
            }
            catch (e) {
                console.error(chalk_1.default.red(`[WarehouseMock] 读取 Mock 文件失败: ${e}`));
                res.statusCode = 500;
                res.end('Mock Read Error');
                return;
            }
        }
        next();
    }
}
module.exports = WarehouseMockPlugin;
