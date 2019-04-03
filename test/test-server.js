// TEST: HTTP SERVER

let chai = require("chai")
let getPort = require("get-port")
let mocha = require("mocha")
let describe = mocha.describe
let before = mocha.before
let it = mocha.it

chai.should()

describe("Metrics Main Tests", function() {
    let monitorado = null
    let setmeup = null
    let supertest = null

    before(async function() {
        let port = await getPort(8000)
        let logger = require("anyhow")
        logger.setup("none")

        monitorado = require("../lib/index")
        setmeup = require("setmeup")
        settings = setmeup.settings.monitorado
        settings.httpServer.port = port
    })

    it("Start the dedicated HTTP server", function(done) {
        let started = monitorado.httpServer.start()
        supertest = require("supertest").agent(monitorado.httpServer.expressApp)

        if (!started) {
            done("Error starting the Metrics HTTP server.")
        } else {
            done()
        }
    })

    it("Output via dedicated HTTP server", function(done) {
        let cb = () => supertest.get("/").expect("Content-Type", /json/).expect(200, done)
        setTimeout(cb, 500)

    })

    it("Kill the dedicated HTTP server", function(done) {
        let killed = monitorado.httpServer.kill()

        if (!killed) {
            done("HTTP server was not running therefore was not killed.")
        } else {
            done()
        }
    })
})
