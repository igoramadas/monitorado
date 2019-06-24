// Monitorado: metrics.ts

/** Metrics container. */
class Metrics {
    private static _instance: Metrics = null
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this())
    }
}

export = Metrics.Instance
