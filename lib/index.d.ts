import { Counter, CounterOptions } from "./counter";
import { Output, OutputOptions } from "./output";
declare class Monitorado {
    private static _instance;
    static readonly Instance: Monitorado;
    /**
     * Default Monitorado constructor. This will load settings from current
     * environment and setup the necessary timers.
     */
    constructor();
    httpServer: any;
    cleanupTimer: any;
    systemInfo: any;
    /**
     *
     * @param id ID of counters to be returned.
     * @returns Array of counters for the specified ID, or null if empty / invalid.
     */
    get(id: string): Counter[];
    /**
     * Starts the counter for a specific metric. The data is optional.
     * @param id ID of the metric to be started.
     * @param options Metric options to set a tag and expiry interval.
     * @returns Returns the metric object to be used later on `end`.
     */
    start(id: string, options?: CounterOptions): Counter;
    /**
     * Clean collected metrics by removing data older than X minutes (defined on settings).
     * Please note that this runs on s schedule so you shouldn't need to call it manually, in most cases.
     */
    cleanup: () => any;
    output(options?: OutputOptions): Output;
}
declare const _default: Monitorado;
export = _default;
