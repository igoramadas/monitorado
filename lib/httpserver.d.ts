/**
 * Monitorado: HTTP Server
 */
import express = require("express");
/**
 * This is a HTTP server helper that you can use to make the metrics
 * available to external resources. Please note that to use this
 * you need to require the "express" module on your package.json!
 */
declare class HttpServer {
    private static _instance;
    static readonly Instance: HttpServer;
    /**
     * Returns a new fresh HTTP Server instance.
     */
    newInstance(): HttpServer;
    /**
     * Default HTTP server constructor will set the default settings.
     */
    constructor();
    /**
     * The HTTP server created using Express.
     */
    server: any;
    expressApp: express.Application;
    start(): boolean;
    kill(): boolean;
    /**
     * Check if a valid token was passed on to the request.
     * @param req Request object from client.
     */
    validateToken(req: express.Request): boolean;
}
declare const _default: HttpServer;
export = _default;
