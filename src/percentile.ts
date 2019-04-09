// Monitorado: percentile.ts

/**
 * This is a helper class to calculate percentiles. Can also be used by external modules
 * by calling "monitorado.percentile.calculate(durations, percentile)."
 */
export class Percentile {
    /** Internal swap. */
    static swap(data, i, j) {
        if (i == j) {
            return
        }

        const tmp = data[j]
        data[j] = data[i]
        return (data[i] = tmp)
    }

    /** Internal partition. */
    static partition(data, start, end) {
        let i = start + 1
        let j = start

        while (i < end) {
            if (data[i] < data[start]) {
                this.swap(data, i, ++j)
            }
            i++
        }

        this.swap(data, start, j)

        return j
    }

    /** Internal findK. */
    static findK(data, start, end, k) {
        while (start < end) {
            const pos = this.partition(data, start, end)

            if (pos == k) {
                return data[k]
            }
            if (pos > k) {
                end = pos
            } else {
                start = pos + 1
            }
        }

        return null
    }

    /**
     * Calculates a percentile out of the passed durations.
     * @param durations Array of durations as numbers.
     * @param percentile The percentile to be calculated.
     * @returns The result, having minimum of 0.
     */
    static calculate(durations: number[], percentile: number): number {
        let result = this.findK(durations.concat(), 0, durations.length, Math.ceil((durations.length * percentile) / 100) - 1)

        if (result == null || result < 0) {
            result = 0
        }

        return result
    }
}
