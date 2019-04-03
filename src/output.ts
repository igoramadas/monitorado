/*
 * Monitorado: Output
 */

import {Percentile} from "./percentile"

const _ = require("lodash")
const logger = require("anyhow")
const jaul = require("jaul")
const metrics = require("./metrics")
const moment = require("moment")
const setmeup = require("setmeup")
let settings

interface Summary {
    calls: number
    errors: number
    expired: number
    min: number
    max: number
    avg: number
    data?: any
}

interface Sample {
    startTime: number
    duration: number
    tag?: string
    data?: any
}

/** Options to be passed when generating a new output. */
export interface OutputOptions {
    aggregatedKeys?: any
    includeLastSamples?: number
    intervals?: number[]
    keys?: string[]
    percentiles?: number[]
    systemMetrics?: any
}

/*
 * Output class.
 */
export class Output {
    constructor(options?: OutputOptions) {
        settings = setmeup.settings.monitorado
        logger.debug("Metrado.output", options)

        // Set default options.
        if (!options) options = {}
        _.defaultsDeep(options, settings)

        // No keys passed? Use all.
        if (!options.keys) {
            options.keys = _.keys(metrics)
        }

        const result = {}

        // Add server info to the output?
        if (options.systemMetrics && options.systemMetrics.fields && options.systemMetrics.fields) {
            const serverInfo = jaul.system.getInfo({labels: options.systemMetrics.includeLabels})
            const serverKey = options.systemMetrics.key
            result[serverKey] = {}

            for (let f of options.systemMetrics.fields) {
                result[serverKey][f] = serverInfo[f]
            }
        }

        // For each passed metric key...
        for (let key of options.keys) {
            let obj = metrics[key]

            if (!obj) {
                logger.warn("Metrado.output", `No metrics for '${key}'`)
            } else {
                result[key] = {total_calls: obj.length}

                // Iterate intervals to get specific stats.
                for (let interval of options.intervals) {
                    result[key][`last_${interval}min`] = this.getSummary(options, obj, interval)
                }

                // Include last samples?
                if (options.includeLastSamples > 0) {
                    const samples = []
                    let s = 0

                    while (s < options.includeLastSamples) {
                        if (obj[s]) {
                            samples.push(this.getLastSamples(obj[s]))
                        }
                        s++
                    }

                    result[key].last_samples = samples
                }
            }
        }

        // Generate aggregated keys on the output?
        if (options.aggregatedKeys && options.aggregatedKeys) {
            for (let agKey in options.aggregatedKeys) {
                const subKeys = options.aggregatedKeys[agKey]
                let obj = []

                for (let key of subKeys) {
                    if (metrics[key]) {
                        obj = obj.concat(metrics[key])
                    } else {
                        logger.debug("Metrado.output", `Agreggated key ${agKey}`, `No metrics for '${key}'`)
                    }
                }

                result[agKey] = {
                    total_calls: obj.length
                }

                // Iterate intervals to get specific stats.
                for (let interval of options.intervals) {
                    result[agKey][`last_${interval}min`] = this.getSummary(options, obj, interval)
                }
            }
        }

        logger.debug("Metrado.output", result)

        this.result = result
    }

    // PROPERTIES
    // --------------------------------------------------------------------------

    private result: any

    get json() {
        return this.result
    }

    /*
     * Generate summary for the specified object and interval.
     */
    private getSummary(options: OutputOptions, obj, interval) {
        const now = moment().valueOf()
        const values = []
        let errorCount = 0
        let expiredCount = 0
        let i = 0

        // Consider we don't have extra data by default.
        let dataKeys = []

        // Iterate logged metrics, and get only if corresponding to the specified interval.
        while (i < obj.length) {
            const diff = now - obj[i].startTime
            const minutes = diff / 1000 / 60

            if (minutes <= interval) {
                values.push(obj[i])

                // Increment error and expired count.
                if (obj[i].error) {
                    errorCount++
                }
                if (obj[i].expired) {
                    expiredCount++
                }

                // Check if extra data was passed, if so, append to the dataKeys list.
                const objData = obj[i].data

                if (objData != null) {
                    dataKeys = _.concat(dataKeys, _.keys(objData))
                }

                i++
            } else {
                i = obj.length
            }
        }

        // Get relevant durations and data from collection.
        const durations = _.map(values, "duration")
        const data = _.map(values, "data")
        let avg = _.mean(durations)
        if (isNaN(avg)) {
            avg = 0
        }

        // Create a summary with the important stats for each metric.
        const result = {} as Summary
        result.calls = values.length
        result.errors = errorCount
        result.expired = expiredCount
        result.min = _.min(durations) || 0
        result.max = _.max(durations) || 0
        result.avg = avg || 0
        result.avg = Math.round(result.avg)

        // Calculate metrics for extra passed data.
        if (dataKeys.length > 0) {
            dataKeys = _.uniq(dataKeys)

            result.data = {}

            for (let key of Array.from(dataKeys)) {
                const value = _.map(data, key)

                result.data[key] = {
                    min: _.min(value),
                    max: _.max(value),
                    total: _.sum(value)
                }
            }
        }

        // Get percentiles based on settings.
        if (options.percentiles && options.percentiles.length > 0) {
            for (let percentile of options.percentiles) {
                result[`p${percentile}`] = Percentile.calculate(durations, percentile as number)
            }
        }

        return result
    }

    /*
     * Helper to get summary for last calls.
     */
    private getLastSamples(value) {
        if (value) {
            try {
                const result = {} as Sample

                result.startTime = value.startTime
                result.duration = value.duration

                // Append tag?
                if (typeof value.tag != "undefined") {
                    result.tag = value.tag
                }

                // Append data?
                if (typeof value.data != "undefined") {
                    result.data = value.data
                }

                return result
            } catch (ex) {
                logger.error("Metrado.getLast", `Start time ${value.startTime}`, ex)
            }
        }

        return {data: "Invalid metric"}
    }
}
