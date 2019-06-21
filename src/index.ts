// Monitorado: index.ts

import {Counter, CounterOptions} from "./counter"
import {Output, OutputOptions} from "./output"

/** @hidden */
const _ = require("lodash")
/** @hidden */
const logger = require("anyhow")
/** @hidden */
const metrics = require("./metrics")
/** @hidden */
const jaul = require("jaul")
/** @hidden */
const moment = require("moment")
/** @hidden */
const setmeup = require("setmeup")
/** @hidden */
let settings

/** Monitorado's main class. */
class Monitorado {
    private static _instance: Monitorado = null
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /**
     * Default Monitorado constructor. This will load settings from current
     * environment and setup the necessary timers.
     */
    constructor() {
        if (!logger.isReady) {
            /* istanbul ignore next */
            logger.setup()
        }

        // Load default settings.
        setmeup.load(__dirname + "/../settings.default.json", {overwrite: false})

        // Expose settings.
        settings = setmeup.settings.monitorado
        this.settings = settings

        // Setup auto cleanup timer.
        this.cleanupTimer = setInterval(this.cleanup, settings.cleanupInterval * 60 * 1000)

        // Force get system info on init to properly count memory and load avg.
        this.systemInfo = jaul.system.getInfo()
    }

    // PROPERTIES
    // --------------------------------------------------------------------------

    /** Exposes the HTTP server. */
    httpServer = require("./httpserver")
    /** Percentile calculation helper. */
    percentile = require("./percentile")
    /** Auto cleanup timer. */
    cleanupTimer: any
    /** Exposes current system info. */
    systemInfo: any
    /** Exposes the settings from SetMeUp module. */
    settings: any

    // MAIN METHODS
    // --------------------------------------------------------------------------

    /**
     * Get the counters for the specified metric ID.
     * @param id ID of counters to be returned.
     * @returns Array of counters for the specified ID, or null if empty / invalid.
     */
    get(id: string): Counter[] {
        return metrics[id]
    }

    /**
     * Starts a counter for a specific metric.
     * @param id ID of the metric to be started.
     * @param options Optional metric options to set a tag and expiry interval.
     * @returns Returns the counter object.
     */
    start(id: string, options?: CounterOptions): Counter {
        logger.debug("Monitorado.start", options)

        // Set default options.
        if (!options) options = {}
        _.defaults(options, {expiresIn: 0})

        let obj = new Counter(id, options)

        // Create array of counters for the selected ID. Add metric to the beggining of the array.
        if (metrics[id] == null) {
            metrics[id] = []
        }

        metrics[id].unshift(obj)

        return obj
    }

    /**
     * Clean collected metrics by removing counters older than X minutes (defined on settings).
     * Please note that this runs on a schedule so you shouldn't need to call it manually.
     */
    cleanup = () => {
        logger.debug("Monitorado.cleanup")

        const now = moment().valueOf()
        let counter = 0
        let keyCounter = 0

        // Hold empty metric IDs.
        const emptyIds = []

        // Get unique counter IDs.
        let keys = _.keys(metrics)

        // Iterate metrics collection.
        try {
            for (let key of keys) {
                const obj = metrics[key]
                let i

                if (!obj || obj.length < 1) {
                    emptyIds.push(key)
                    i = -1
                } else {
                    i = obj.length - 1
                }

                counter = 0
                keyCounter++

                // Iterate requests for the current metrics, last to first.
                while (i >= 0) {
                    const diff = now - obj[i].startTime
                    const minutes = diff / 1000 / 60

                    // Remove if verified as old. Otherwise, force finish the iteration.
                    if (minutes > settings.expireAfter) {
                        obj.pop()
                        i--
                        counter++
                    } else {
                        i = -1
                    }
                }
            }
        } catch (ex) {
            /* istanbul ignore next */
            logger.error("Monitorado.cleanup", ex)
        }

        // Delete empty metrics, if enabled on settings.
        if (settings.cleanupEmpty && emptyIds.length > 0) {
            for (let key of emptyIds) {
                delete metrics[key]
            }
        }

        if (counter > 0 && keyCounter > 0) {
            return logger.info("Monitorado.cleanup", `Removed ${counter} counters from ${keyCounter} keys.`)
        }
    }

    /**
     * Calculate and returns the metrics output for the current counters.
     * @param options Optional output settings.
     * @returns The metrics represented as a JSON object.
     */
    output(options?: OutputOptions): Output {
        let output = new Output(options)
        return output.json
    }
}

// Exports...
export = Monitorado.Instance
