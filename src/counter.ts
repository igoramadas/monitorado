// Monitorado: counter.ts

/** @hidden */
const logger = require("anyhow")
/** @hidden */
const moment = require("moment")

/** Metric options when starting a new metric. */
export interface CounterOptions {
    /** metric should expire in these amount of milliseconds if not ended. */
    expiresIn?: number
    /** Custom tag or text to be associated with that particular metric. */
    tag?: string
}

/** Represents a single metric counter with time, duratiomn and additional info. */
export class Counter {
    /** Default Counter constructor expects a mandatory ID, and optional 'tag' and 'expiresIn' options. */
    constructor(id: string, options?: CounterOptions) {
        this.id = id
        this.startTime = moment().valueOf()

        // Append tag?
        if (options.tag) {
            this.tag = options.tag
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
    tag?: string
    /** Optional data for the counter. */
    data?: any
    /** Optional error object or string in case counter ended but there was an error. */
    error?: any
    /** Optional timer that will auto end the counter after the specified 'expiresIn'. */
    timeout?: any

    // METHODS
    // --------------------------------------------------------------------------

    /**
     * Ends the counter for the specified metric, with an optional error..
     * @param error Optional error that ocurred while processing the metric.
     */
    end(error?: any): void {
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
    setData(key: string, value: any): void {
        if (!this.data) {
            this.data = {}
        }

        this.data[key] = value
    }
}
