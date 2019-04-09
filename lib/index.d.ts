import { Counter, CounterOptions } from "./counter";
import { Output, OutputOptions } from "./output";
/** Monitorado's main class. */
declare class Monitorado {
    private static _instance;
    /** @hidden */
    static readonly Instance: Monitorado;
    /**
     * Default Monitorado constructor. This will load settings from current
     * environment and setup the necessary timers.
     */
    constructor();
    /** Exposes the HTTP server. */
    httpServer: any;
    /** Percentile calculation helper. */
    percentile: any;
    /** Auto cleanup timer. */
    cleanupTimer: any;
    /** Exposes current system info. */
    systemInfo: any;
    /** Exposes the settings from SetMeUp module. */
    settings: any;
    /**
     * Get the counters for the specified metric ID.
     * @param id ID of counters to be returned.
     * @returns Array of counters for the specified ID, or null if empty / invalid.
     */
    get(id: string): Counter[];
    /**
     * Starts a counter for a specific metric.
     * @param id ID of the metric to be started.
     * @param options Optional metric options to set a tag and expiry interval.
     * @returns Returns the counter object.
     */
    start(id: string, options?: CounterOptions): Counter;
    /**
     * Clean collected metrics by removing counters older than X minutes (defined on settings).
     * Please note that this runs on a schedule so you shouldn't need to call it manually.
     */
    cleanup: () => any;
    /**
     * Calculate and returns the metrics output for the current counters.
     * @param options Optional output settings.
     * @returns The metrics represented as a JSON object.
     */
    output(options?: OutputOptions): Output;
}
declare const _default: Monitorado;
export = _default;
