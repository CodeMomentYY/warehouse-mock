import { Compiler } from 'webpack';
interface MockPluginOptions {
    mockPath?: string;
    apiPrefixes?: string[];
    localApiPrefix?: string;
    enabled?: boolean;
    proxy?: {
        target: string;
        changeOrigin?: boolean;
    };
    injectEnv?: boolean;
    delay?: number;
    admin?: {
        enabled?: boolean;
        port?: number;
    };
}
declare class WarehouseMockPlugin {
    private options;
    private resolvedMockPath;
    private isEnabled;
    private adminServer;
    constructor(options?: MockPluginOptions);
    /**
     * 实时扫描 mock 目录，获取所有 mock 文件名列表
     */
    getMockFileList(): string[];
    /**
     * 获取本地代理路径前缀
     */
    getLocalApiPrefix(): string;
    apply(compiler: Compiler): void;
    /**
     * 启动管理后台服务
     */
    private startAdminServer;
    /**
     * 自动注入环境变量 VUE_APP_MOCK
     */
    private injectEnvironmentVariable;
    /**
     * 公共方法：设置中间件 (Webpack 5 / Vue CLI 5+)
     */
    setupMiddlewares(middlewares: any[], devServer: any, originalSetupMiddlewares?: Function): any;
    /**
     * 公共方法：设置中间件 (Webpack 4 / Vue CLI 3-4)
     */
    runBefore(app: any, server?: any, compiler?: any, originalBefore?: Function): void;
    private getResolvedMockPath;
    private ensureMockDirectory;
    private createDemoFile;
    private readInterfaceConfig;
    private handleRequest;
    /**
     * 代理请求到真实 API（改进版）
     */
    private proxyRequest;
}
export = WarehouseMockPlugin;
