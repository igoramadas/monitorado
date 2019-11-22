/** Metrics container. */
declare class Metrics {
    private static _instance;
    /** @hidden */
    static get Instance(): Metrics;
    /** Key pair list that holds the actual counters. */
    counters: any;
    /**
     * Get a full JSON representation of the current counters.
     * Please note that only finished counters will be exported!
     */
    toJSON(): any;
    /**
     * Load counters from the specified filename or JSON object.
     * @param source Full path to the JSON file, or the JSON object itself. Defaults to the settings.saveTo value.
     * @param avoidDuplicates Defaults to false, if true it won't load counters with matching id, startTime, endTime and tag.
     */
    loadFrom(source?: string | any, avoidDuplicates?: boolean): void;
    /**
     * Save the counters to the specified JSON file.
     * @param destination Destination filename, if unspecified it will use the default from settings.
     */
    saveTo(destination?: string): void;
}
declare const _default: Metrics;
export = _default;
