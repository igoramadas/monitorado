// Monitorado: httpserver.ts

import {Output} from "./output"
import _ = require("lodash")
import express = require("express")
import logger = require("anyhow")
import setmeup = require("setmeup")

let settings

/**
 * This is a HTTP server helper that you can use to make the metrics
 * available to external resources. Please note that to use this
 * you need to require the "express" module on your package.json!
 */
class HttpServer {
    private static _instance: HttpServer = null
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    // PROPERTIES
    // --------------------------------------------------------------------------

    /** The HTTP server created using Express. */
    server: any

    /** The Express application, in case you want to add extra routes or middlewares. */
    expressApp: express.Application

    // METHODS
    // --------------------------------------------------------------------------

    /** Create the Express application and starts a HTTP server to output metrics. */
    start = (): void => {
        settings = setmeup.settings.monitorado

        if (this.server) {
            logger.warn("Monitorado.HttpServer.start", "Already started")
            return
        }

        // Valid port is mandatory!
        if (!settings.httpServer.port || settings.httpServer.port < 0) {
            throw new Error("No port defined, please set the server port on the settings.")
        }

        this.expressApp = express()
        this.server = this.expressApp.listen(settings.httpServer.port)

        // Set default index route, with optional auth required.
        let indexRoute = (req, res) => {
            if (settings.httpServer.token && !this.validateToken(req)) {
                return res.status(403).json({error: "Access denied"})
            }

            let output = new Output()
            res.json(output.json)
        }

        this.expressApp.get(settings.httpServer.path, indexRoute)

        logger.info("Monitorado.HttpServer.start", settings.httpServer.port)
    }

    /** Close the HTTP server and kill the Express app. */
    kill = (): void => {
        if (!this.server) {
            logger.warn("Monitorado.HttpServer.kill", "Not running")
            return
        }

        this.server.close()
        this.server = null
        this.expressApp = null

        logger.info("Monitorado.HttpServer.kill")
    }

    /**
     * Check if a valid token was passed via the Authorization header.
     * @param req Request object from client.
     * @returns True if passed token is valid, otherwise false.
     */
    validateToken(req: express.Request): boolean {
        if (!req.headers || !req.headers.authorization) {
            return false
        }

        let bearer = req.headers.authorization.substring(7).trim()
        let tokens = _.isString(settings.httpServer.token) ? [settings.httpServer.token] : settings.httpServer.token

        return tokens.indexOf(bearer) >= 0
    }
}

// Exports...
export = HttpServer.Instance
