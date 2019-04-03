"use strict";
/*
 * Monitorado: Counter
 */
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("anyhow");
const moment = require("moment");
/**
 * Represents a single metric counter with time, duratiomn and additional info.
 */
class Counter {
    /** Default Counter constructor expects a mandatory ID, and optional 'tag' and 'expiresIn' options. */
    constructor(id, options) {
        this.id = id;
        this.startTime = moment().valueOf();
        // Append tag?
        if (options.tag) {
            this.tag = options.tag;
        }
        // Should the metric expire (value in milliseconds)?
        if (options.expiresIn > 0) {
            const expiryTimeout = () => {
                logger.debug("Monitorado.start", "Expired!", this);
                this.expired = true;
                return this.end();
            };
            this.timeout = setTimeout(expiryTimeout, options.expiresIn);
        }
    }
    /**
     * Ends the counter for the specified metric, with an optional error to be passed along.
     * @param error Optional error that ocurred while processing the metric.
     */
    end(error) {
        this.endTime = moment().valueOf();
        this.duration = this.endTime - this.startTime;
        // Only append error if there was one.
        if (error) {
            this.error = error;
        }
        // Clear the expiry timeout only if there's one.
        if (this.timeout) {
            clearTimeout(this.timeout);
            delete this.timeout;
        }
        logger.debug("Monitorado.end", this);
    }
    /**
     * Adds extra data / stats to the metric object.
     * @param key The data key or label.
     * @param value The data value.
     */
    setData(key, value) {
        if (!this.data) {
            this.data = {};
        }
        this.data[key] = value;
    }
}
exports.Counter = Counter;
