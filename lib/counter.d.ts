/**
 * Metric options when starting a new metric.
 */
export interface CounterOptions {
    /** metric should expire in these amount of milliseconds if not ended. */
    expiresIn?: number;
    /** Custom tag or text to be associated with that particular metric. */
    tag?: string;
}
/**
 * Represents a single metric counter with time, duratiomn and additional info.
 */
export declare class Counter {
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
    tag?: string;
    /** Optional data for the counter. */
    data?: any;
    /** Optional error object or string in case counter ended but there was an error. */
    error?: any;
    /** Optional timer that will auto end the counter after the specified 'expiresIn'. */
    timeout?: any;
    /** Default Counter constructor expects a mandatory ID, and optional 'tag' and 'expiresIn' options. */
    constructor(id: string, options?: CounterOptions);
    /**
     * Ends the counter for the specified metric, with an optional error to be passed along.
     * @param error Optional error that ocurred while processing the metric.
     */
    end(error?: any): void;
    /**
     * Adds extra data / stats to the metric object.
     * @param key The data key or label.
     * @param value The data value.
     */
    setData(key: string, value: any): void;
}
