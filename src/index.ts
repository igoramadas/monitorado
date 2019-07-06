// Monitorado: index.ts

import {Counter, CounterOptions} from "./counter"
import {Output, OutputOptions} from "./output"

/** @hidden */
const _ = require("lodash")
/** @hidden */
const logger = require("anyhow")
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

        // Make sure we have at least 1 interval defined.
        /* istanbul ignore next */
        if (!settings.intervals || settings.intervals.length == 0) {
            logger.warn("Monitorado", "No intervals defined on the settings, are you doing this on purpose?")
        } else if (settings.expireAfter > 0) {
            const max = _.max(settings.intervals)

            // Make sure the expireAfter is at least the same as the highest defined interval.
            if (settings.expireAfter < max) {
                logger.warn("Monitorado", `Force setting the expireAfter from ${settings.expireAfter} to ${max} to match the highest interval.`)
                settings.expireAfter = max
            }
        }
    }

    // PROPERTIES
    // --------------------------------------------------------------------------

    /** The metrics store. */
    metrics = require("./metrics")
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
        return this.metrics.counters[id]
    }

    /**
     * Starts a counter for a specific metric.
     * @param id ID of the metric to be started.
     * @param options Optional metric options to set a tag and expiry interval.
     * @returns Returns the counter object.
     */
    start(id: string, options?: CounterOptions): Counter {
        logger.debug("Monitorado.start", options)

        // If options passed as string, treat as the tag.
        if (_.isString(options)) {
            options = {tag: options as string}
        }

        // Set default options.
        if (!options) options = {}
        _.defaults(options, {expiresIn: 0})

        let obj = new Counter(id)
        obj.start(options)

        // Create array of counters for the selected ID. Add metric to the beggining of the array.
        if (this.metrics.counters[id] == null) {
            this.metrics.counters[id] = []
        }

        this.metrics.counters[id].unshift(obj)

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
        let keys = _.keys(this.metrics.counters)

        // Iterate metrics collection.
        try {
            for (let key of keys) {
                const obj = this.metrics.counters[key]
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
                        /* istanbul ignore next */
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
                delete this.metrics.counters[key]
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
