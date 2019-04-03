// TEST: MAIN

let chai = require("chai")
let mocha = require("mocha")
let describe = mocha.describe
let before = mocha.before
let it = mocha.it

chai.should()

describe("Metrics Main Tests", function() {
    let monitorado = null
    let setmeup = null
    let settings = null
    let totalCalls = 0

    before(function() {
        let logger = require("anyhow")
        logger.setup("none")

        monitorado = require("../lib/index")
        setmeup = require("setmeup")
        settings = setmeup.settings.monitorado
        settings.aggregatedKeys = {
            iteratorAgg: ["iteratorX", "iteratorZ"]
        }

    })

    it("Has settings defined", function(done) {
        if (settings) {
            done()
        } else {
            done("No settings defined.")
        }
    })

    it("Measure time to iterate randomly", function(done) {
        this.timeout(10000)

        let createIterator = function(id, i) {
            let mt = monitorado.start("iterator" + id)
            totalCalls++

            let cb = function() {
                mt.setData("counter", i)
                mt.end()

                if (id == "Z" && i == 9) {
                    done()
                }
            }

            let timeout = Math.floor(Math.random() * 300)
            setTimeout(cb, timeout)
        }

        for (let i = 0; i < 10; i++) {
            createIterator("X", i)
        }

        for (let i = 0; i < 10; i++) {
            createIterator("Z", i)
        }
    })

    it("Expire metrics", function(done) {
        monitorado.start("expiredCall", {
            expiresIn: 50
        })

        let callback = function() {
            let output = monitorado.output()
            let expired = output.expiredCall.last_1min.expired

            if (expired > 0) {
                done()
            } else {
                done("Output should have 1 expired metric for expiredCall, but has " + expired + ".")
            }
        }

        setTimeout(callback, 500)
    })

    it("Output has system metrics", function(done) {
        let output = monitorado.output()

        if (!output.system || !output.system.loadAvg || !output.system.memoryUsage) {
            done("Metrics output expects server's loadAvg and memoryUsage.")
        } else {
            done()
        }
    })

    it("Output all the metrics gathered on tests", function(done) {
        let output = monitorado.output()

        if (!output.iteratorX || !output.iteratorZ || output.iteratorX.total_calls + output.iteratorZ.total_calls != totalCalls) {
            done("Metrics output expects data for iteratorX, iteratorZ and total calls should be " + totalCalls + ".")
        } else {
            done()
        }
    })

    it("Output the metrics gathered on tests, but only for iteratorX", function(done) {
        let output = monitorado.output({
            keys: ["iteratorX"]
        })

        if (!output.iteratorX || output.iteratorZ) {
            done("Output should have 'iteratorX' metrics only.")
        } else {
            done()
        }
    })

    it("Output iteratorX has min / max data calculated", function(done) {
        let output = monitorado.output()

        if (!output.iteratorX.last_1min.data || !output.iteratorX.last_1min.data.counter) {
            done("Metrics output has no 'data.counter' property calculated")
            return
        }

        let min = output.iteratorX.last_1min.data.counter.min
        let max = output.iteratorX.last_1min.data.counter.max

        if (min != 0 || max != 9) {
            done("Metrics output expects .data.counter min = 0 and max = 9, but got min " + min + " and max " + max + ".")
        } else {
            done()
        }
    })

    it("Output has valid aggregated keys for iteratorX and iteratorZ", function(done) {
        let output = monitorado.output()

        let total = output.iteratorAgg.last_1min.calls
        let max = output.iteratorAgg.last_1min.max
        let totalX = output.iteratorX.last_1min.calls
        let maxX = output.iteratorX.last_1min.max
        let totalZ = output.iteratorZ.last_1min.calls
        let expectedTotal = totalX + totalZ

        if (total != expectedTotal) {
            done("Metrics aggregated iteratorAgg should have total calls " + expectedTotal + ", but got " + total + ".")
        } else if (maxX > max) {
            done("Metrics aggregated iteratorAgg should have max " + maxX + ", but got " + max + ".")
        } else {
            done()
        }
    })

    it("Metrics cleanup (expireAfter set to 0)", function(done) {
        settings.expireAfter = 0

        monitorado.cleanup()
        count = monitorado.get("iteratorX").length

        if (count > 0) {
            done("Iterator metrics should have 0 data, but has " + count + ".")
        } else {
            done()
        }
    })
})
