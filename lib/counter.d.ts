/** Metric options when starting a new metric. */
export interface CounterOptions {
    /** metric should expire in these amount of milliseconds if not ended. */
    expiresIn?: number;
    /** Custom tag or text to be associated with that particular metric. */
    tag?: string | number | boolean | Date;
}
/** Represents a single metric counter with time, duratiomn and additional info. */
export declare class Counter {
    /** Default Counter constructor expects a mandatory ID, and optional 'tag' and 'expiresIn' options. */
    constructor(id: string);
    /** Shared ID of this counter. */
    id: string;
    /** The start time (unix timestamp ion milliseconds). */
    startTime: number;
    /** The start time (unix timestamp ion milliseconds). */
    endTime?: number;
    /** Total duration, only set after counter has ended. */
    duration?: number;
    /** Optional, will be true if the counter has expired. */
    expired?: boolean;
    /** Optional tag or label with extra information about the counter. */
    tag?: string | number | boolean | Date;
    /** Optional data for the counter. */
    data?: any;
    /** Optional error object or string in case counter ended but there was an error. */
    error?: any;
    /** Optional timer that will auto end the counter after the specified 'expiresIn'. */
    timeout?: any;
    /**
     * Start the counter with the specified options.
     * @param options Additional options (expiresIn, tag, etc.).
     */
    start(options?: CounterOptions): void;
    /**
     * Ends the counter for the specified metric, with an optional error..
     * @param error Optional error that ocurred while processing the metric.
     */
    end(error?: any): void;
    /**
     * Adds extra data / stats to the metric object.
     * @param key The data key or label.
     * @param value The data value.
     */
    setData(key: string, value: any): void;
    /**
     * Get a JSON export of the counter that can be used to persist its data.
     */
    toJSON(): any;
    /**
     * Imports counter data from the specified JSON object.
     * @param data JSON object representing the data to be imported.
     */
    fromJSON(data: any): void;
}
