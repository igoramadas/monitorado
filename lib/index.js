"use strict";
/*
 * Monitorado
 */
const counter_1 = require("./counter");
const output_1 = require("./output");
const _ = require("lodash");
const logger = require("anyhow");
const metrics = require("./metrics");
const jaul = require("jaul");
const moment = require("moment");
const setmeup = require("setmeup");
let settings;
/*
 * Monitorado's main class.
 */
class Monitorado {
    /**
     * Default Monitorado constructor. This will load settings from current
     * environment and setup the necessary timers.
     */
    constructor() {
        // PROPERTIES
        // --------------------------------------------------------------------------
        this.httpServer = require("./httpserver");
        /**
         * Clean collected metrics by removing data older than X minutes (defined on settings).
         * Please note that this runs on s schedule so you shouldn't need to call it manually, in most cases.
         */
        this.cleanup = () => {
            logger.debug("Monitorado.cleanup");
            const now = moment().valueOf();
            let counter = 0;
            let keyCounter = 0;
            // Hold empty metric IDs.
            const emptyIds = [];
            // Get unique counter IDs.
            let keys = _.keys(metrics);
            // Iterate metrics collection.
            try {
                for (let key of keys) {
                    const obj = metrics[key];
                    let i;
                    if (!obj || obj.length < 1) {
                        emptyIds.push(key);
                        i = -1;
                    }
                    else {
                        i = obj.length - 1;
                    }
                    counter = 0;
                    keyCounter++;
                    // Iterate requests for the current metrics, last to first.
                    while (i >= 0) {
                        const diff = now - obj[i].startTime;
                        const minutes = diff / 1000 / 60;
                        // Remove if verified as old. Otherwise, force finish the iteration.
                        if (minutes > settings.expireAfter || settings.expireAfter < 1) {
                            obj.pop();
                            i--;
                            counter++;
                        }
                        else {
                            i = -1;
                        }
                    }
                }
            }
            catch (ex) {
                console.error(ex);
                logger.error("Monitorado.cleanup", ex);
            }
            // Delete empty metrics if enabled on settings.
            if (settings.cleanupEmpty && emptyIds.length > 0) {
                for (let key of emptyIds) {
                    delete metrics[key];
                }
            }
            if (counter > 0 && keyCounter > 0) {
                return logger.info("Monitorado.cleanup", `Removed ${counter} counters from ${keyCounter} keys.`);
            }
        };
        setmeup.load();
        // Point directly to monitorado settings.
        settings = setmeup.settings.monitorado;
        // Setup auto cleanup timer.
        this.cleanupTimer = setInterval(this.cleanup, settings.cleanupInterval * 60 * 1000);
        // Force get system info on init to properly count memory and load avg.
        this.systemInfo = jaul.system.getInfo();
        // Init the HTTP server module if port and autoStart are set.
        if (settings.httpServer.port && settings.httpServer.autoStart) {
            this.httpServer.start();
        }
    }
    static get Instance() {
        return this._instance || (this._instance = new this());
    }
    // MAIN METHODS
    // --------------------------------------------------------------------------
    /**
     *
     * @param id ID of counters to be returned.
     * @returns Array of counters for the specified ID, or null if empty / invalid.
     */
    get(id) {
        return metrics[id];
    }
    /**
     * Starts the counter for a specific metric. The data is optional.
     * @param id ID of the metric to be started.
     * @param options Metric options to set a tag and expiry interval.
     * @returns Returns the metric object to be used later on `end`.
     */
    start(id, options) {
        logger.debug("Monitorado.start", options);
        // Set default options.
        if (!options)
            options = {};
        _.defaults(options, { expiresIn: 0 });
        let obj = new counter_1.Counter(id, options);
        // Create array of counters for the selected ID. Add metric to the beggining of the array.
        if (metrics[id] == null) {
            metrics[id] = [];
        }
        metrics[id].unshift(obj);
        return obj;
    }
    output(options) {
        let output = new output_1.Output(options);
        return output.json;
    }
}
Monitorado._instance = null;
module.exports = Monitorado.Instance;
