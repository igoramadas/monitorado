/**
 * Monitorado: Percentile
 */
/**
 * This is a helper class to calculate percentiles. Can also be used by external modules
 * by calling "monitorado.percentile.calculate(durations, percentile)."
 */
export declare class Percentile {
    /** Internal swap. */
    static swap(data: any, i: any, j: any): any;
    /** Internal partition. */
    static partition(data: any, start: any, end: any): any;
    /** Internal findK. */
    static findK(data: any, start: any, end: any, k: any): any;
    /**
     * Calculates a percentile out of the passed durations.
     * @param durations Array of durations as numbers.
     * @param percentile The percentile to be calculated.
     * @returns The result, having minimum of 0.
     */
    static calculate(durations: number[], percentile: number): number;
}
