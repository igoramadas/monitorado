import {Counter} from "./counter"

// Monitorado: metrics.ts

/** @hidden */
const _ = require("lodash")
/** @hidden */
const fs = require("fs")
/** @hidden */
const logger = require("anyhow")
/** @hidden */
const setmeup = require("setmeup")
/** @hidden */
let settings

/** Metrics container. */
class Metrics {
    private static _instance: Metrics = null
    /** @hidden */
    static get Instance() {
        settings = setmeup.settings.monitorado
        return this._instance || (this._instance = new this())
    }

    /** Key pair list that holds the actual counters. */
    counters: any = {}

    /**
     * Get a full JSON representation of the current counters.
     * Please note that only finished counters will be exported!
     */
    toJSON(): any {
        let result = {} as any
        let keys = Object.keys(this.counters)

        for (let key of keys) {
            result[key] = []

            for (let counter of this.counters[key]) {
                if (counter.endTime) {
                    result[key].push(counter.toJSON())
                }
            }
        }

        return result
    }

    /**
     * Load counters from the specified filename or JSON object.
     * @param source Full path to the JSON file, or the JSON object itself.
     * @param avoidDuplicates Defaults to false, if true it won't load counters with matching id, startTime, endTime and tag.
     */
    loadFrom(source: string | any, avoidDuplicates?: boolean): void {
        try {
            if (typeof avoidDuplicates == "undefined") {
                avoidDuplicates = false
            }

            // If source is a string, consider it as the filename of the JSON file to be loaded.
            if (_.isString(source)) {
                source = fs.readFileSync(source, {encoding: "utf8"})
                source = JSON.parse(source)
            }
        } catch (ex) {
            logger.error("Metrics.loadFrom", "Can't parse input JSON", ex)
            throw ex
        }

        try {
            let keys = Object.keys(source)

            // Iterate counters to load each one, and check if current metric ID already exists.
            for (let key of keys) {
                let toAdd = []

                // Make sure we have a valid list for the counter ID.
                if (!this.counters[key]) {
                    this.counters[key] = []
                }

                for (let counter of source[key]) {
                    let existing = null

                    // Avoid loading duplicates?
                    if (avoidDuplicates) {
                        existing = _.find(this.counters[key], {id: counter.id, startTime: counter.startTime, endTime: counter.endTime})

                        if (existing && existing.tag && existing.tag.toString() != counter.tag.toString()) {
                            existing = null
                        }
                    }

                    if (existing == null) {
                        let counterObj = new Counter(counter.id)
                        counterObj.fromJSON(counter)
                        toAdd.push(counterObj)
                    }
                }

                // Add loaded counters to the corresponding list.
                for (let counter of toAdd) {
                    this.counters[key].push(counter)
                }
            }
        } catch (ex) {
            logger.error("Metrics.loadFrom", "Can't build metrics from loaded JSON", ex)
            throw ex
        }
    }

    /**
     * Save the counters to the specified JSON file.
     * @param destination Destination filename, if unspecified it will use the default from settings.
     */
    saveTo(destination?: string): void {
        if (!destination) {
            destination = settings.saveTo
        }

        try {
            fs.writeFileSync(destination, JSON.stringify(this.toJSON(), null, 2), {encoding: "utf8"})
        } catch (ex) {
            logger.error("Metrics.saveTo", destination, ex)
            throw ex
        }
    }
}

export = Metrics.Instance
