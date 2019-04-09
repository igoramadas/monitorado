# Monitorado

[![Build Status](https://img.shields.io/travis/igoramadas/monitorado.svg?style=flat-square)](https://travis-ci.org/igoramadas/monitorado)
[![Coverage Status](https://img.shields.io/coveralls/igoramadas/monitorado.svg?style=flat-square)](https://coveralls.io/github/igoramadas/monitorado?branch=master)

A simple but effective library to track app metrics.

## Basic usage

```javascript
const monitorado = require("monitorado")

try {
    let mt = monitorado.start("expensive-method")

    // End expensive-method metric.
    mt.end()

} catch (ex) {
    // End metric with error.
    mt.end(ex)
}

// Get metrics output.
let output = monitorado.output()
```

## Extra features

```javascript
for (let i = 0; i < 100; i++) {

    // Auto expire counter after 5 seconds.
    let expiringMt = monitorado.start("timeout-method", {expiresIn: 5000})
    await myApp.externalCall()

    // If externalCall takes more than 5 sec, calling .end() won't do anything.
    expiringMt.end()
}

// Create metric with a tag.
let anotherMt = monitorado.start("user-method", {tag: "Users"})
let result = await myApp.getUserStats()

// Add extra data to metric, for instance a user count.
anotherMt.setData("users", result.users)
anotherMt.end()

// Output metrics for timeout-method only, for the last 1, 2, and 5 minutes.
let timeoutOutput = monitorado.output({intervals: [1, 2, 5], keys: ["timeout-method"]})
```

## Built-in HTTP server

```javascript
try {
    // Set a custom port and base path.
    monitorado.settings.httpServer.port = 8080
    monitorado.settings.httpServer.path = "/metrics"

    // Or you can also manipulate settings directly via SetMeUp...
    const setmeup = require("setmeup")
    setmeup.load("settings.monitorado.json")

    // Start the built-in HTTP server
    monitorado.httpServer.start()
    // Calling http://your-host:8080/metrics will output the metrics.

    // You can also protect the endpoint with a token.
    monitorado.settings.httpServer.token = "my-custom-token"
    // Now you need to pass an Authorization: Bearer XXX header.
}

```

## API documentation

You can browse the full API documentation at https://monitorado.devv.com.
