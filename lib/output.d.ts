/** Options to be passed when generating a new output. The defaults are defined on the settings.default.json file. */
export interface OutputOptions {
    /** List of aggregated keys. */
    aggregatedKeys?: any;
    /** Include the last X counter samples on the output. */
    includeLastSamples?: number;
    /** Array of intervals to calculate the summaries. */
    intervals?: number[];
    /** Array of metric keys to be available on the output. */
    keys?: string[];
    /** Array of percentiules to be calculated. */
    percentiles?: number[];
    /** Include system metrics on the output? */
    systemMetrics?: any;
}
/** Metrics output class. */
export declare class Output {
    /** The default Output constructor with additional options. */
    constructor(options?: OutputOptions);
    /** The actual output results will be saved on this variable. */
    private result;
    /** Helper to get the [[result]] JSON. */
    readonly json: any;
    /**
     * Generate summary for the specified object and interval.
     * @options Output options.
     * @counters Array of counters to get the summary for.
     * @interval Interval (in minutes) of the summary output.
     */
    private getSummary;
    /**
     * Helper to get summary for last calls.
     * @counter The counter object.
     * */
    private getLastSamples;
}
