"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminServer = createAdminServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const mock_1 = require("./routes/mock");
function createAdminServer(options) {
    const { mockPath, port = 3100 } = options;
    const app = (0, express_1.default)();
    // 中间件
    app.use((0, cors_1.default)());
    app.use(express_1.default.json({ limit: '10mb' }));
    // API 路由
    app.use('/api/mock', (0, mock_1.createMockRouter)(mockPath));
    // 静态文件服务（前端构建产物）
    // __dirname 在编译后是 dist 目录，所以 client 也在 dist/client
    const clientPath = path_1.default.join(__dirname, 'client');
    // 手动处理静态文件请求，确保 MIME 类型正确
    app.get('/assets/:file', (req, res) => {
        const filePath = path_1.default.join(clientPath, 'assets', req.params.file);
        // 根据文件扩展名设置 Content-Type
        if (req.params.file.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
        else if (req.params.file.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        }
        res.sendFile(filePath);
    });
    // 处理其他静态文件
    app.use(express_1.default.static(clientPath, {
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            }
            else if (filePath.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css; charset=utf-8');
            }
            else if (filePath.endsWith('.svg')) {
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
        res.sendFile(path_1.default.join(clientPath, 'index.html'));
    });
    // 启动服务
    const server = app.listen(port, () => {
        const url = `http://localhost:${port}`;
        console.log(chalk_1.default.cyan(`\n[WarehouseMock Admin] 管理后台已启动:`));
        console.log(chalk_1.default.green(`  ➜  ${url}\n`));
    });
    return {
        server,
        url: `http://localhost:${port}`,
        close: () => server.close()
    };
}
exports.default = createAdminServer;
