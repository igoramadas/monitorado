"use strict";
// Monitorado: metrics.ts
/** Metrics container. */
class Metrics {
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this());
    }
}
Metrics._instance = null;
module.exports = Metrics.Instance;
