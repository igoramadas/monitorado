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
    let port = null

    before(async function() {
        port = await getPort(8000)

        let logger = require("anyhow")
        logger.setup("none")

        monitorado = require("../lib/index")
        setmeup = require("setmeup")
        settings = setmeup.settings.monitorado
    })

    it("Try starting the server without a valid port", function(done) {
        try {
            monitorado.httpServer.start()
            done("No port specified should throw an exception.")
        } catch (ex) {
            done()
        }
    })

    it("Start the dedicated HTTP server twice", function() {
        settings.httpServer.port = port

        monitorado.httpServer.start()
        monitorado.httpServer.start()

        supertest = require("supertest").agent(monitorado.httpServer.expressApp)
    })

    it("Try starting after server has already started", function() {

    })

    it("Output via dedicated HTTP server", function(done) {
        let cb = () => supertest.get("/").expect("Content-Type", /json/).expect(200, done)
        setTimeout(cb, 500)
    })

    it("Require a token to output data", function(done) {
        settings.httpServer.token = "abc"

        let deniedCb = (err, res) => {
            if (err) {
                done(err)
            }
        }
        let validCb = (err, res) => {
            if (err) {
                done(err)
            } else {
                done()
            }
        }

        supertest.get("/").expect(403).end(deniedCb)
        supertest.get("/").set("Authorization", "Bearer: abc").expect("Content-Type", /json/).expect(200).end(validCb)
    })

    it("Kill the dedicated HTTP server twice", function() {
        monitorado.httpServer.kill()
        monitorado.httpServer.kill()
    })
})
