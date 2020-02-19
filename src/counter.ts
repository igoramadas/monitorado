// Monitorado: counter.ts

import _ = require("lodash")
import logger = require("anyhow")
import moment = require("moment")

/** List of counter properties that are relevant when exporting / importing. */
const relevantProps = ["id", "startTime", "endTime", "duration", "expired", "tag", "data", "error"]

/** Metric options when starting a new metric. */
export interface CounterOptions {
    /** metric should expire in these amount of milliseconds if not ended. */
    expiresIn?: number
    /** Custom tag or text to be associated with that particular metric. */
    tag?: string | number | boolean | Date
}

/** Represents a single metric counter with time, duratiomn and additional info. */
export class Counter {
    /** Default Counter constructor expects a mandatory ID, and optional 'tag' and 'expiresIn' options. */
    constructor(id: string) {
        this.id = id
    }

    // PROPERTIES
    // --------------------------------------------------------------------------

    /** Shared ID of this counter. */
    id: string
    /** The start time (unix timestamp ion milliseconds). */
    startTime: number
    /** The start time (unix timestamp ion milliseconds). */
    endTime?: number
    /** Total duration, only set after counter has ended. */
    duration?: number
    /** Optional, will be true if the counter has expired. */
    expired?: boolean
    /** Optional tag or label with extra information about the counter. */
    tag?: string | number | boolean | Date
    /** Optional data for the counter. */
    data?: any
    /** Optional error object or string in case counter ended but there was an error. */
    error?: any
    /** Optional timer that will auto end the counter after the specified 'expiresIn'. */
    timeout?: any

    // METHODS
    // --------------------------------------------------------------------------

    /**
     * Start the counter with the specified options.
     * @param options Additional options (expiresIn, tag, etc.).
     */
    start = (options?: CounterOptions): void => {
        this.startTime = moment().valueOf()

        // Append tag?
        if (options.tag) {
            if (_.isDate(options.tag)) {
                this.tag = options.tag.toString()
            } else if (!_.isObject(options.tag)) {
                this.tag = options.tag
            } else {
                throw new Error("The tag should be a string, number, boolean or date.")
            }
        }

        // Should the metric expire (value in milliseconds)?
        if (options.expiresIn > 0) {
            const expiryTimeout = () => {
                logger.debug("Monitorado.start", "Expired!", this)
                this.expired = true
                return this.end()
            }

            this.timeout = setTimeout(expiryTimeout, options.expiresIn)
        }
    }

    /**
     * Ends the counter for the specified metric, with an optional error..
     * @param error Optional error that ocurred while processing the metric.
     */
    end = (error?: any): void => {
        if (this.expired) {
            logger.warn("Monitorado.end", `Metric ${this.id} started at ${this.startTime} has expired`)
            return
        }

        this.endTime = moment().valueOf()
        this.duration = this.endTime - this.startTime

        // Only append error if there was one.
        if (error) {
            this.error = error
        }

        // Clear the expiry timeout only if there's one.
        if (this.timeout) {
            clearTimeout(this.timeout)
            delete this.timeout
        }

        logger.debug("Monitorado.end", this)
    }

    /**
     * Adds extra data / stats to the metric object.
     * @param key The data key or label.
     * @param value The data value.
     */
    setData = (key: string, value: any): void => {
        if (!this.data) {
            this.data = {}
        }

        this.data[key] = value
    }

    /**
     * Get a JSON export of the counter that can be used to persist its data.
     */
    toJSON = (): any => {
        let result = {} as any

        for (let p of relevantProps) {
            if (typeof this[p] != "undefined") {
                if (_.isObject(this[p])) {
                    result[p] = _.cloneDeep(this[p])
                } else {
                    result[p] = this[p]
                }
            }
        }

        return result
    }

    /**
     * Imports counter data from the specified JSON object.
     * @param data JSON object representing the data to be imported.
     */
    fromJSON = (data: any): void => {
        for (let p of relevantProps) {
            if (data[p] != null) {
                this[p] = data[p]
            }
        }
    }
}
