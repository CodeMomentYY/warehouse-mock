import { Compiler } from 'webpack';
interface MockPluginOptions {
    mockPath: string;
    apiPrefixes?: string[];
    localApiPrefix?: string;
}
declare class WarehouseMockPlugin {
    private options;
    private resolvedMockPath;
    constructor(options: MockPluginOptions);
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
    private handleRequest;
    /**
     * 生成运行时拦截脚本
     * 自动拦截 fetch/XMLHttpRequest，无需修改业务代码
     */
    private generateRuntimeScript;
}
export = WarehouseMockPlugin;
