import express = require("express");
/**
 * This is a HTTP server helper that you can use to make the metrics
 * available to external resources. Please note that to use this
 * you need to require the "express" module on your package.json!
 */
declare class HttpServer {
    private static _instance;
    /** @hidden */
    static readonly Instance: HttpServer;
    /** The HTTP server created using Express. */
    server: any;
    /** The Express application, in case you want to add extra routes or middlewares. */
    expressApp: express.Application;
    /** Create the Express application and starts a HTTP server to output metrics. */
    start(): void;
    /** Close the HTTP server and kill the Express app. */
    kill(): void;
    /**
     * Check if a valid token was passed via the Authorization header.
     * @param req Request object from client.
     * @returns True if passed token is valid, otherwise false.
     */
    validateToken(req: express.Request): boolean;
}
declare const _default: HttpServer;
export = _default;
