"use strict";
// Monitorado: counter.ts
Object.defineProperty(exports, "__esModule", { value: true });
/** @hidden */
const _ = require("lodash");
/** @hidden */
const logger = require("anyhow");
/** @hidden */
const moment = require("moment");
/** List of counter properties that are relevant when exporting / importing. */
const relevantProps = ["id", "startTime", "endTime", "duration", "expired", "tag", "data", "error"];
/** Represents a single metric counter with time, duratiomn and additional info. */
class Counter {
    /** Default Counter constructor expects a mandatory ID, and optional 'tag' and 'expiresIn' options. */
    constructor(id) {
        this.id = id;
    }
    // METHODS
    // --------------------------------------------------------------------------
    /**
     * Start the counter with the specified options.
     * @param options Additional options (expiresIn, tag, etc.).
     */
    start(options) {
        this.startTime = moment().valueOf();
        // Append tag?
        if (options.tag) {
            if (_.isDate(options.tag)) {
                this.tag = options.tag.toString();
            }
            else if (!_.isObject(options.tag)) {
                this.tag = options.tag;
            }
            else {
                throw new Error("The tag should be a string, number, boolean or date.");
            }
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
     * Ends the counter for the specified metric, with an optional error..
     * @param error Optional error that ocurred while processing the metric.
     */
    end(error) {
        if (this.expired) {
            logger.warn("Monitorado.end", `Metric ${this.id} started at ${this.startTime} has expired`);
            return;
        }
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
    /**
     * Get a JSON export of the counter that can be used to persist its data.
     */
    toJSON() {
        let result = {};
        for (let p of relevantProps) {
            if (typeof this[p] != "undefined") {
                if (_.isObject(this[p])) {
                    result[p] = _.cloneDeep(this[p]);
                }
                else {
                    result[p] = this[p];
                }
            }
        }
        return result;
    }
    /**
     * Imports counter data from the specified JSON object.
     * @param data JSON object representing the data to be imported.
     */
    fromJSON(data) {
        for (let p of relevantProps) {
            this[p] = data[p];
        }
    }
}
exports.Counter = Counter;
