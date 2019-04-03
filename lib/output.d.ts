/** Options to be passed when generating a new output. */
export interface OutputOptions {
    aggregatedKeys?: any;
    includeLastSamples?: number;
    intervals?: number[];
    keys?: string[];
    percentiles?: number[];
    systemMetrics?: any;
}
export declare class Output {
    constructor(options?: OutputOptions);
    private result;
    readonly json: any;
    private getSummary;
    private getLastSamples;
}
