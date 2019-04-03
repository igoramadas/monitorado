/**
 * Monitorado: HTTP Server
 */

import {Output} from "./output"
import express = require("express")

const _ = require("lodash")
const logger = require("anyhow")
const setmeup = require("setmeup")
let settings

/**
 * This is a HTTP server helper that you can use to make the metrics
 * available to external resources. Please note that to use this
 * you need to require the "express" module on your package.json!
 */
class HttpServer {
    private static _instance: HttpServer = null
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /**
     * Returns a new fresh HTTP Server instance.
     */
    newInstance(): HttpServer {
        return new HttpServer()
    }

    /**
     * Default HTTP server constructor will set the default settings.
     */
    constructor() {
        settings = setmeup.settings.monitorado
    }

    // PROPERTIES
    // --------------------------------------------------------------------------

    /**
     * The HTTP server created using Express.
     */
    server: any

    expressApp: express.Application

    /*
     * Start the Express / HTTP server.
     */
    start(): boolean {
        if (this.server) {
            logger.debug("Monitorado.HttpServer.start", "Already started, abort")
            return false
        }
        if (!settings.httpServer.port || settings.httpServer.port < 0) {
            throw new Error("No port defined, please set the server port on the settings.")
        }

        this.expressApp = express()
        this.server = this.expressApp.listen(settings.httpServer.port)

        let indexRoute = (req, res) => {
            if (settings.httpServer.token && !this.validateToken(req)) {
                return res.status(401).json({error: "Access denied"})
            }

            let output = new Output()
            res.json(output.json)
        }
        this.expressApp.get(settings.httpServer.path, indexRoute)

        logger.info("Monitorado.HttpServer.start", settings.httpServer.port)
        return true
    }

    /*
     * Kill the Express / HTTP server.
     */
    kill(): boolean {
        if (!this.server) {
            logger.debug("Monitorado.HttpServer.kill")
            return false
        }

        this.server.close()
        this.server = null

        logger.info("Monitorado.HttpServer.kill")
        return true
    }

    /**
     * Check if a valid token was passed on to the request.
     * @param req Request object from client.
     */
    validateToken(req: express.Request) {
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
