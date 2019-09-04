"use strict";
// Monitorado: output.ts
Object.defineProperty(exports, "__esModule", { value: true });
const percentile_1 = require("./percentile");
/** @hidden */
const _ = require("lodash");
/** @hidden */
const logger = require("anyhow");
/** @hidden */
const jaul = require("jaul");
/** @hidden */
const metrics = require("./metrics");
/** @hidden */
const moment = require("moment");
/** @hidden */
const setmeup = require("setmeup");
/** @hidden */
let settings;
/** Metrics output class. */
class Output {
    /** The default Output constructor with additional options. */
    constructor(options) {
        settings = setmeup.settings.monitorado;
        logger.debug("Monitorado.Output", options);
        // Set default options.
        if (!options)
            options = {};
        if (typeof options.systemMetrics == "undefined")
            options.systemMetrics = {};
        _.defaults(options, settings);
        _.defaults(options.systemMetrics, settings.systemMetrics);
        // Output all keys if none was defined.
        if (!options.keys || options.keys.length == 0) {
            options.keys = _.keys(metrics.counters);
        }
        const result = {};
        // Add server info to the output?
        if (options.systemMetrics && options.systemMetrics.fields && options.systemMetrics.fields) {
            const serverInfo = jaul.system.getInfo({ labels: options.systemMetrics.includeLabels });
            const serverKey = options.systemMetrics.key;
            result[serverKey] = {};
            for (let f of options.systemMetrics.fields) {
                result[serverKey][f] = serverInfo[f];
            }
        }
        // For each passed metric key...
        for (let key of options.keys) {
            let obj = metrics.counters[key];
            if (!obj) {
                logger.warn("Monitorado.Output", `No metrics for '${key}'`);
            }
            else {
                result[key] = { total_calls: obj.length };
                // Iterate intervals to get specific stats.
                for (let interval of options.intervals) {
                    result[key][`last_${interval}min`] = this.getSummary(options, obj, interval);
                }
                // Include last samples?
                if (options.includeLastSamples > 0) {
                    const samples = [];
                    let s = 0;
                    while (s < options.includeLastSamples) {
                        if (obj[s]) {
                            samples.push(this.getLastSamples(obj[s]));
                        }
                        s++;
                    }
                    result[key].last_samples = samples;
                }
            }
        }
        // Generate aggregated keys on the output?
        if (options.aggregatedKeys && options.aggregatedKeys) {
            for (let agKey in options.aggregatedKeys) {
                const subKeys = options.aggregatedKeys[agKey];
                let obj = [];
                for (let key of subKeys) {
                    if (metrics.counters[key]) {
                        obj = obj.concat(metrics.counters[key]);
                    }
                    else {
                        logger.warn("Monitorado.Output", `Agreggated key ${agKey}`, `No metrics for '${key}'`);
                    }
                }
                result[agKey] = {
                    total_calls: obj.length
                };
                // Iterate intervals to get specific stats.
                for (let interval of options.intervals) {
                    result[agKey][`last_${interval}min`] = this.getSummary(options, obj, interval);
                }
            }
        }
        logger.debug("Monitorado.Output", result);
        this.result = result;
    }
    /** Helper to get the [[result]] JSON. */
    get json() {
        return this.result;
    }
    /**
     * Generate summary for the specified object and interval.
     * @options Output options.
     * @counters Array of counters to get the summary for.
     * @interval Interval (in minutes) of the summary output.
     */
    getSummary(options, counters, interval) {
        const now = moment().valueOf();
        const values = [];
        let errorCount = 0;
        let expiredCount = 0;
        let i = 0;
        // Consider we don't have extra data by default.
        let dataKeys = [];
        // Iterate logged metrics, and get only if corresponding to the specified interval.
        while (i < counters.length) {
            const diff = now - counters[i].startTime;
            const minutes = diff / 1000 / 60;
            if (minutes <= interval) {
                if (counters[i].expired) {
                    expiredCount++;
                }
                else if (counters[i].endTime != null) {
                    values.push(counters[i]);
                }
                // Increment error count.
                if (counters[i].error) {
                    errorCount++;
                }
                // Check if extra data was passed, if so, append to the dataKeys list.
                const objData = counters[i].data;
                if (objData != null) {
                    dataKeys = _.concat(dataKeys, _.keys(objData));
                }
                i++;
            }
            else {
                /* istanbul ignore next */
                i = counters.length;
            }
        }
        // Get relevant durations and data from collection.
        const durations = _.map(values, "duration");
        const data = _.map(values, "data");
        let avg = _.mean(durations);
        if (isNaN(avg)) {
            avg = 0;
        }
        // Create a summary with the important stats for each metric.
        const result = {};
        result.calls = values.length;
        result.errors = errorCount;
        result.expired = expiredCount;
        result.min = _.min(durations) || 0;
        result.max = _.max(durations) || 0;
        result.avg = avg || 0;
        result.avg = Math.round(result.avg);
        // Calculate success rate based on total calls and errors / expired.
        if (result.calls == 0 || errorCount + expiredCount == 0) {
            result.successRate = 100;
        }
        else {
            result.successRate = 100 - ((errorCount + expiredCount) / values.length) * 100;
            result.successRate = Math.round(result.successRate);
        }
        // Calculate metrics for extra passed data.
        if (dataKeys.length > 0) {
            dataKeys = _.uniq(dataKeys);
            result.data = {};
            for (let key of Array.from(dataKeys)) {
                const value = _.map(data, key);
                result.data[key] = {
                    current: value[0],
                    min: _.min(value),
                    max: _.max(value),
                    total: _.sum(value)
                };
            }
        }
        // Get percentiles based on settings.
        if (options.percentiles && options.percentiles.length > 0) {
            for (let percentile of options.percentiles) {
                result[`p${percentile}`] = percentile_1.Percentile.calculate(durations, percentile);
            }
        }
        return result;
    }
    /**
     * Helper to get summary for last calls.
     * @counter The counter object.
     */
    getLastSamples(counter) {
        try {
            const result = {};
            result.startTime = counter.startTime;
            result.duration = counter.duration;
            // Append tag?
            if (typeof counter.tag != "undefined") {
                result.tag = counter.tag;
            }
            // Append data?
            if (typeof counter.data != "undefined") {
                result.data = counter.data;
            }
            return result;
        }
        catch (ex) {
            /* istanbul ignore next */
            logger.error("Monitorado.getLast", `Start time ${counter.startTime}`, ex);
        }
        /* istanbul ignore next */
        return { data: "Invalid metric" };
    }
}
exports.Output = Output;
