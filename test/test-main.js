// TEST: MAIN

let _ = require("lodash")
let chai = require("chai")
let fs = require("fs")
let mocha = require("mocha")
let describe = mocha.describe
let before = mocha.before
let after = mocha.after
let it = mocha.it

chai.should()

describe("Metrics Main Tests", function() {
    let monitorado = null
    let setmeup = null
    let settings = null
    let destinationJson = `${__dirname}/metrics.json`
    let counterLastData

    before(function() {
        let logger = require("anyhow")
        logger.setup("none")
    })

    after(function() {
        if (fs.existsSync(destinationJson)) {
            fs.unlinkSync(destinationJson)
        }
    })

    it("Auto adjust expireAfter if less than highest interval", function(done) {
        setmeup = require("setmeup")

        if (!setmeup.settings.monitorado) {
            setmeup.settings.monitorado = {}
        }

        settings = setmeup.settings.monitorado
        settings.saveTo = destinationJson
        settings.expireAfter = 5

        monitorado = require("../lib/index")

        if (settings.expireAfter < _.max(settings.intervals)) {
            done("The expireAfter should be auto adjusted to the highest interval.")
        } else {
            done()
        }
    })

    it("Measure time to iterate randomly, passing data and tags", function(done) {
        this.timeout(8000)

        let delay = 100

        let createIteratorWithData = function(i) {
            let mt = monitorado.start("iteratorWithData")
            counterLastData = i

            let cb = function() {
                mt.setData("counter", i)
                mt.setData("counter2", i * 2)
                mt.end()
            }

            let timeout = Math.floor(Math.random() * 200)
            delay += timeout
            setTimeout(cb, timeout)
        }

        let createIteratorWithTag = function(i) {
            let tag = {
                tag: "counter" + i
            }
            let mt = monitorado.start("iteratorWithTag", tag)

            let cb = function() {
                mt.end()
            }

            let timeout = Math.floor(Math.random() * 200)
            delay += timeout
            setTimeout(cb, timeout)
        }

        for (let i = 0; i < 10; i++) {
            createIteratorWithData(i)
        }

        for (let i = 0; i < 10; i++) {
            createIteratorWithTag(i)
        }

        monitorado.start("iteratorWithTag", new Date())

        setTimeout(done, delay)
    })

    it("Add counter with error", function(done) {
        let mt = monitorado.start("withError")

        let cb = function() {
            mt.end("Some error")
            done()
        }

        let timeout = Math.floor(Math.random() * 1000)
        setTimeout(cb, timeout)
    })

    it("Auto expiring counters, using date as tag", function(done) {
        let mt = monitorado.start("expiredCall", {
            expiresIn: 50,
            tag: new Date()
        })

        let callback = function() {
            mt.end()

            let output = monitorado.output()
            let expired = output.expiredCall.last_1min.expired

            if (expired < 1) {
                done(`Output should have 1 expired metric for expiredCall, but has ${expired}.`)
            } else if (!mt.expired) {
                done("Counter should have expired = true.")
            } else {
                done()
            }
        }

        setTimeout(callback, 500)
    })

    it("Ending before counter auto expires", function(done) {
        let mt = monitorado.start("expiredCall", {
            expiresIn: 500
        })

        let callback = function() {
            mt.end()

            if (!mt.timeout) {
                done()
            } else {
                done("The counter's 'timeout' should have been deleted.")
            }
        }

        setTimeout(callback, 50)
    })

    it("Fails to add counter passing object as tag", function(done) {
        let objTag = {
            something: true,
            inner: {
                someDate: new Date()
            }
        }
        try {
            monitorado.start("shouldNotBreak", {
                tag: objTag
            })
            done("Passing object as tag should throw exception.")
        } catch (ex) {
            done()
        }
    })

    it("Output has the previously set counter with error", function(done) {
        let output = monitorado.output()

        if (!output.withError || output.withError.last_1min.errors != 1) {
            done("Metrics 'withError' output should have exactly 1 error.")
        } else {
            done()
        }
    })

    it("Output has a correct success rate", function(done) {
        let output = monitorado.output()

        if (output.withError.last_1min.successRate < 100) {
            done()
        } else {
            done("Metrics 'withError' success rate should be less than 100.")
        }
    })

    it("Output has system metrics", function(done) {
        let output = monitorado.output()

        if (!output.system || !output.system.loadAvg || !output.system.memoryUsage) {
            done("Metrics output expects server's loadAvg and memoryUsage.")
        } else {
            done()
        }
    })

    it("Output all the metrics gathered on previous tests", function(done) {
        let output = monitorado.output()

        if (!output.iteratorWithData || !output.iteratorWithTag || !output.withError) {
            done("Metrics output expects data for iteratorWithData, iteratorWithData and withError.")
        } else {
            done()
        }
    })

    it("Output the metrics gathered on tests, but only for iteratorWithData", function(done) {
        let output = monitorado.output({
            keys: ["iteratorWithData", "invalidKey"]
        })

        if (!output.iteratorWithData || output.iteratorWithTag) {
            done("Output should have 'iteratorWithData' metrics only.")
        } else {
            done()
        }
    })

    it("Output iteratorWithData has correct current / min / max data calculated", function(done) {
        let output = monitorado.output()

        if (!output.iteratorWithData.last_1min.data || !output.iteratorWithData.last_1min.data.counter) {
            done("Metrics output has no 'data.counter' property calculated")
            return
        }

        let current = output.iteratorWithData.last_1min.data.counter.current
        let min = output.iteratorWithData.last_1min.data.counter.min
        let max = output.iteratorWithData.last_1min.data.counter.max

        if (min != 0 || max != 9) {
            done(`Output expects .data.counter min = 0 and max = 9, but got min ${min} and max ${max}.`)
        } else if (counterLastData != current) {
            done(`Output .data.counter.current should be ${counterLastData}, but got ${current}`)
        } else {
            done()
        }
    })

    it("Output has valid aggregated keys for iteratorWithData and iteratorWithTag", function(done) {
        settings.aggregatedKeys = {
            iteratorAgg: ["iteratorWithData", "iteratorWithTag", "somethingInvalid"]
        }

        let output = monitorado.output()

        let total = output.iteratorAgg.last_1min.calls
        let max = output.iteratorAgg.last_1min.max
        let totalWithData = output.iteratorWithData.last_1min.calls
        let maxWithData = output.iteratorWithData.last_1min.max
        let totalWithTag = output.iteratorWithTag.last_1min.calls
        let expectedTotal = totalWithData + totalWithTag

        if (total != expectedTotal) {
            done(`Metrics aggregated iteratorAgg should have total calls ${expectedTotal}, but got ${total}.`)
        } else if (maxWithData > max) {
            done(`Metrics aggregated iteratorAgg should have max ${maxWithData}, but got ${max}.`)
        } else {
            done()
        }
    })

    it("Include last 3 samples on output", function(done) {
        let options = {
            includeLastSamples: 3
        }

        let output = monitorado.output(options)

        if (!output.iteratorWithData.last_samples || output.iteratorWithData.last_samples.length != 3) {
            done("Output should have last 3 samples for iteratorWithData.")
        } else {
            done()
        }
    })

    it("Hide system metrics from the output", function(done) {
        let options = {
            systemMetrics: false
        }

        let output = monitorado.output(options)

        if (output[settings.systemMetrics.key]) {
            done("System metrics should be hidden from the output.")
        } else {
            done()
        }
    })

    it("Output intervals should be respected if defined", function(done) {
        let options = {
            intervals: [33],
            systemMetrics: {
                fields: ["memoryUsage"]
            }
        }

        let output = monitorado.output(options)
        let intervalKeys = _.keys(output.iteratorWithData)

        if (!output.iteratorWithData.last_33min) {
            done(`Output does not have 33min interval (last_33min key)`)
        } else if (intervalKeys.length != 2) {
            done(`Output should have only 33min interval, but got ${intervalKeys.join()}`)
        } else if (output.system.loadAvg) {
            done("Output should only have memoryUsage on system, but got also loadAvg")
        } else {
            done()
        }
    })

    it("Exports correct JSON representation of counters.", function(done) {
        let counter = monitorado.get("iteratorWithData")[0]
        let cJson = counter.toJSON()
        let keys = Object.keys(cJson)

        for (let key of keys) {
            if (counter[key].toString() != cJson[key].toString()) {
                return done(`Property ${key} does not match: ${counter[key]} != ${cJson[key]}`)
            }
        }

        done()
    })

    it("Saves metrics to a JSON file", function(done) {
        monitorado.metrics.saveTo()

        let checkFile = function() {
            if (fs.existsSync(destinationJson)) {
                done()
            } else {
                done(`File ${destinationJson} does not exist.`)
            }
        }

        setTimeout(checkFile, 800)
    })

    it("Fails to save metrics to invalid path", function(done) {
        try {
            monitorado.metrics.saveTo(new Date())
            done("Should have failed to save to invalid file path.")
        } catch (ex) {
            done()
        }
    })

    it("Loads metrics from specified file, avoiding duplicates", function(done) {
        let countBefore = monitorado.get("iteratorWithData").length
        monitorado.metrics.loadFrom(destinationJson, true)
        let countAfter = monitorado.get("iteratorWithData").length

        if (countBefore == countAfter) {
            done()
        } else {
            done(`Count for iteratorWithData should be ${countBefore}, but got ${countAfter}.`)
        }
    })

    it("Loads metrics from default file on settings", function(done) {
        monitorado.metrics.loadFrom()
        done()
    })

    it("Metrics cleanup respects the expireAfter", function(done) {
        settings.expireAfter = 1000 * 60 * 60

        countBefore = monitorado.get("iteratorWithData").length
        monitorado.cleanup()
        countAfter = monitorado.get("iteratorWithData").length

        if (countBefore != countAfter) {
            done("Cleanup should not have remoed any counters.")
        } else {
            done()
        }
    })

    it("Metrics cleanup (expireAfter set to 0)", function(done) {
        settings.expireAfter = 0

        monitorado.cleanup()
        count = monitorado.get("iteratorWithData").length
        monitorado.cleanup()

        if (count > 0) {
            done("Iterator metrics should have 0 data, but has " + count + ".")
        } else {
            done()
        }
    })

    it("Loads metrics from a JSON object", function(done) {
        let data = JSON.parse(
            fs.readFileSync(destinationJson, {
                encoding: "utf8"
            })
        )

        monitorado.metrics.loadFrom(data)

        if (monitorado.get("iteratorWithData") && monitorado.get("iteratorWithData").length > 0) {
            done()
        } else {
            done("Did not load the counters from the specified JSON.")
        }
    })

    it("Fail to load metrics from invalid JSON", function(done) {
        try {
            monitorado.metrics.loadFrom("some-incorrect-file")
            returndone("Should have failed when loading from non existing file.")
        } catch (ex) {}

        try {
            let invalidObject = {
                stuff: true
            }
            monitorado.metrics.loadFrom(invalidObject)
            return done("Should have failed when loading from invalid object.")
        } catch (ex) {}

        done()
    })
})
