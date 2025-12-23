export interface AdminServerOptions {
    mockPath: string;
    port?: number;
}
export declare function createAdminServer(options: AdminServerOptions): {
    server: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
    url: string;
    close: () => import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
};
export default createAdminServer;
