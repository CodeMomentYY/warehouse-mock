"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockRouter = createMockRouter;
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function createMockRouter(mockPath) {
    const router = express_1.default.Router();
    // 确保目录存在
    const ensureMockPath = () => {
        if (!fs_1.default.existsSync(mockPath)) {
            fs_1.default.mkdirSync(mockPath, { recursive: true });
        }
    };
    // 读取接口配置
    const readInterfaceConfig = (apiName) => {
        const configPath = path_1.default.join(mockPath, apiName, '.config.json');
        if (fs_1.default.existsSync(configPath)) {
            try {
                return JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
            }
            catch (e) {
                return null;
            }
        }
        return null;
    };
    // 写入接口配置
    const writeInterfaceConfig = (apiName, config) => {
        const dirPath = path_1.default.join(mockPath, apiName);
        if (!fs_1.default.existsSync(dirPath)) {
            fs_1.default.mkdirSync(dirPath, { recursive: true });
        }
        const configPath = path_1.default.join(dirPath, '.config.json');
        fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    };
    // GET /api/mock/list - 获取所有 Mock 接口列表
    router.get('/list', (req, res) => {
        try {
            ensureMockPath();
            const items = fs_1.default.readdirSync(mockPath);
            const mockList = [];
            items.forEach(item => {
                const itemPath = path_1.default.join(mockPath, item);
                const stat = fs_1.default.statSync(itemPath);
                // 只处理目录
                if (stat.isDirectory()) {
                    // 读取接口配置
                    const config = readInterfaceConfig(item);
                    // 读取场景列表
                    const files = fs_1.default.readdirSync(itemPath)
                        .filter(f => f.endsWith('.json') && f !== '.config.json');
                    const scenes = files.map(f => f.replace('.json', ''));
                    if (scenes.length > 0 || config) {
                        mockList.push({
                            name: item,
                            delay: config?.delay || 0,
                            enabled: config?.enabled !== false,
                            activeScene: config?.activeScene || 'default',
                            scenes,
                            updatedAt: stat.mtime.toISOString()
                        });
                    }
                }
            });
            res.json({
                success: true,
                data: mockList
            });
        }
        catch (error) {
            res.json({
                success: false,
                message: error.message
            });
        }
    });
    // POST /api/mock/interface/create - 创建接口
    router.post('/interface/create', (req, res) => {
        try {
            const { name, delay = 0, enabled = true } = req.body;
            if (!name) {
                res.json({ success: false, message: '接口名称不能为空' });
                return;
            }
            const dirPath = path_1.default.join(mockPath, name);
            if (fs_1.default.existsSync(dirPath)) {
                res.json({ success: false, message: '接口已存在' });
                return;
            }
            // 创建目录和配置文件
            fs_1.default.mkdirSync(dirPath, { recursive: true });
            writeInterfaceConfig(name, {
                name,
                delay,
                enabled,
                activeScene: 'default'
            });
            res.json({
                success: true,
                message: '接口创建成功'
            });
        }
        catch (error) {
            res.json({
                success: false,
                message: error.message
            });
        }
    });
    // GET /api/mock/interface/config/:apiName - 获取接口配置
    router.get('/interface/config/:apiName', (req, res) => {
        try {
            const { apiName } = req.params;
            const config = readInterfaceConfig(apiName);
            if (!config) {
                res.json({ success: false, message: '接口不存在' });
                return;
            }
            res.json({
                success: true,
                data: config
            });
        }
        catch (error) {
            res.json({
                success: false,
                message: error.message
            });
        }
    });
    // PUT /api/mock/interface/update - 更新接口配置
    router.put('/interface/update', (req, res) => {
        try {
            const { oldName, newName, delay, enabled } = req.body;
            if (!oldName) {
                res.json({ success: false, message: '原接口名称不能为空' });
                return;
            }
            const oldDirPath = path_1.default.join(mockPath, oldName);
            if (!fs_1.default.existsSync(oldDirPath)) {
                res.json({ success: false, message: '接口不存在' });
                return;
            }
            const config = readInterfaceConfig(oldName);
            if (!config) {
                res.json({ success: false, message: '接口配置不存在' });
                return;
            }
            // 如果修改了名称，需要重命名目录
            if (newName && newName !== oldName) {
                const newDirPath = path_1.default.join(mockPath, newName);
                if (fs_1.default.existsSync(newDirPath)) {
                    res.json({ success: false, message: '新接口名称已存在' });
                    return;
                }
                // 重命名目录
                fs_1.default.renameSync(oldDirPath, newDirPath);
                // 更新配置中的 name
                config.name = newName;
            }
            // 更新配置
            const newConfig = {
                ...config,
                name: newName || oldName,
                delay: delay !== undefined ? delay : config.delay,
                enabled: enabled !== undefined ? enabled : config.enabled
            };
            writeInterfaceConfig(newName || oldName, newConfig);
            res.json({
                success: true,
                message: '接口配置更新成功'
            });
        }
        catch (error) {
            res.json({
                success: false,
                message: error.message
            });
        }
    });
    // DELETE /api/mock/interface/delete/:apiName - 删除接口
    router.delete('/interface/delete/:apiName', (req, res) => {
        try {
            const { apiName } = req.params;
            const dirPath = path_1.default.join(mockPath, apiName);
            if (!fs_1.default.existsSync(dirPath)) {
                res.json({ success: false, message: '接口不存在' });
                return;
            }
            // 删除整个目录
            fs_1.default.rmSync(dirPath, { recursive: true, force: true });
            res.json({
                success: true,
                message: '接口删除成功'
            });
        }
        catch (error) {
            res.json({
                success: false,
                message: error.message
            });
        }
    });
    // POST /api/mock/scene/create - 创建场景
    router.post('/scene/create', (req, res) => {
        try {
            const { apiName, sceneName, data } = req.body;
            if (!apiName || !sceneName) {
                res.json({ success: false, message: '接口名称和场景名称不能为空' });
                return;
            }
            const dirPath = path_1.default.join(mockPath, apiName);
            if (!fs_1.default.existsSync(dirPath)) {
                res.json({ success: false, message: '接口不存在，请先创建接口' });
                return;
            }
            const scenePath = path_1.default.join(dirPath, `${sceneName}.json`);
            if (fs_1.default.existsSync(scenePath)) {
                res.json({ success: false, message: '场景已存在' });
                return;
            }
            // 写入场景数据
            const sceneData = data || { code: 0, msg: 'success', data: {} };
            fs_1.default.writeFileSync(scenePath, JSON.stringify(sceneData, null, 2), 'utf-8');
            // 如果是第一个场景，设置为激活场景
            const config = readInterfaceConfig(apiName);
            if (config && !config.activeScene) {
                config.activeScene = sceneName;
                writeInterfaceConfig(apiName, config);
            }
            res.json({
                success: true,
                message: '场景创建成功'
            });
        }
        catch (error) {
            res.json({
                success: false,
                message: error.message
            });
        }
    });
    // GET /api/mock/scene/detail/:apiName/:sceneName - 获取场景详情
    router.get('/scene/detail/:apiName/:sceneName', (req, res) => {
        try {
            const { apiName, sceneName } = req.params;
            const scenePath = path_1.default.join(mockPath, apiName, `${sceneName}.json`);
            if (!fs_1.default.existsSync(scenePath)) {
                res.json({ success: false, message: '场景不存在' });
                return;
            }
            const content = fs_1.default.readFileSync(scenePath, 'utf-8');
            res.json({
                success: true,
                data: {
                    apiName,
                    sceneName,
                    content
                }
            });
        }
        catch (error) {
            res.json({
                success: false,
                message: error.message
            });
        }
    });
    // PUT /api/mock/scene/update - 更新场景数据
    router.put('/scene/update', (req, res) => {
        try {
            const { apiName, oldSceneName, newSceneName, data } = req.body;
            if (!apiName || !oldSceneName || !data) {
                res.json({ success: false, message: '参数不完整' });
                return;
            }
            const oldScenePath = path_1.default.join(mockPath, apiName, `${oldSceneName}.json`);
            if (!fs_1.default.existsSync(oldScenePath)) {
                res.json({ success: false, message: '场景不存在' });
                return;
            }
            // 如果修改了场景名称，需要重命名文件
            if (newSceneName && newSceneName !== oldSceneName) {
                const newScenePath = path_1.default.join(mockPath, apiName, `${newSceneName}.json`);
                if (fs_1.default.existsSync(newScenePath)) {
                    res.json({ success: false, message: '新场景名称已存在' });
                    return;
                }
                // 写入新文件
                fs_1.default.writeFileSync(newScenePath, data, 'utf-8');
                // 删除旧文件
                fs_1.default.unlinkSync(oldScenePath);
                // 如果修改的是当前激活场景，需要更新配置
                const config = readInterfaceConfig(apiName);
                if (config && config.activeScene === oldSceneName) {
                    config.activeScene = newSceneName;
                    writeInterfaceConfig(apiName, config);
                }
            }
            else {
                // 只更新数据，不修改场景名称
                fs_1.default.writeFileSync(oldScenePath, data, 'utf-8');
            }
            res.json({
                success: true,
                message: '场景数据更新成功'
            });
        }
        catch (error) {
            res.json({
                success: false,
                message: error.message
            });
        }
    });
    // DELETE /api/mock/scene/delete/:apiName/:sceneName - 删除场景
    router.delete('/scene/delete/:apiName/:sceneName', (req, res) => {
        try {
            const { apiName, sceneName } = req.params;
            const scenePath = path_1.default.join(mockPath, apiName, `${sceneName}.json`);
            if (!fs_1.default.existsSync(scenePath)) {
                res.json({ success: false, message: '场景不存在' });
                return;
            }
            // 检查是否是唯一场景
            const dirPath = path_1.default.join(mockPath, apiName);
            const scenes = fs_1.default.readdirSync(dirPath)
                .filter(f => f.endsWith('.json') && f !== '.config.json');
            if (scenes.length === 1) {
                res.json({ success: false, message: '不能删除唯一的场景' });
                return;
            }
            // 删除场景文件
            fs_1.default.unlinkSync(scenePath);
            // 如果删除的是激活场景，切换到第一个场景
            const config = readInterfaceConfig(apiName);
            if (config && config.activeScene === sceneName) {
                const remainingScenes = fs_1.default.readdirSync(dirPath)
                    .filter(f => f.endsWith('.json') && f !== '.config.json')
                    .map(f => f.replace('.json', ''));
                if (remainingScenes.length > 0) {
                    config.activeScene = remainingScenes[0];
                    writeInterfaceConfig(apiName, config);
                }
            }
            res.json({
                success: true,
                message: '场景删除成功'
            });
        }
        catch (error) {
            res.json({
                success: false,
                message: error.message
            });
        }
    });
    // POST /api/mock/scene/activate - 激活场景
    router.post('/scene/activate', (req, res) => {
        try {
            const { apiName, sceneName } = req.body;
            if (!apiName || !sceneName) {
                res.json({ success: false, message: '参数不完整' });
                return;
            }
            const config = readInterfaceConfig(apiName);
            if (!config) {
                res.json({ success: false, message: '接口不存在' });
                return;
            }
            const scenePath = path_1.default.join(mockPath, apiName, `${sceneName}.json`);
            if (!fs_1.default.existsSync(scenePath)) {
                res.json({ success: false, message: '场景不存在' });
                return;
            }
            // 更新激活场景
            config.activeScene = sceneName;
            writeInterfaceConfig(apiName, config);
            res.json({
                success: true,
                message: '场景激活成功'
            });
        }
        catch (error) {
            res.json({
                success: false,
                message: error.message
            });
        }
    });
    return router;
}
