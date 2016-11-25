[![Build Status](https://travis-ci.org/backstage/functions-sandbox.png?branch=master)](https://travis-ci.org/backstage/functions-sandbox)
[![Coverage Status](https://coveralls.io/repos/github/backstage/functions-sandbox/badge.svg?branch=master)](https://coveralls.io/github/backstage/functions-sandbox?branch=master)

# Backstage functions-sandbox

**functions-sandbox** is the engine behind [Backstage Functions](https://github.com/backstage/functions) and executes code in isolation (a sandbox). It could be used for both running code in production as well as testing the deployed functions (before they are deployed, hopefully).

## Example of usage

```javascript
const Sandbox = require('backstage-functions-sandbox');

const mySandbox = new Sandbox({
  env: {
     MY_VAR: 'TRUE', // environment variable will be available on Backstage.env.MY_VAR
  },
  globalModules: [ 'path' ], // put all available modules that will allow to import
  asyncTimeout: 10000,
  syncTimeout: 300,
});

const myCode = mySandbox.compileCode('test.js', `
  function main(req, res) {
    const result = req.body.x * req.body.y;
    const name = Backstage.env.MY_VAR;
    res.send({ name, result })
  }
`);

// express.Request compatible
const req = {
  headers: {},
  query: {},
  body: { x: 10, y: 10}
};

mySandbox.runScript(myCode, req).then(({status, body}) => {
  console.info('Result:', status, body);
}, (err) => {
  console.error('Error:', err);
});
```

## Configuration

| Name            | Description                                      | Example                               |
|:----------------|:-------------------------------------------------|:--------------------------------------|
| `env`           | Environment variables used by deployed functions | `{ MY_VAR: 'Some value' }`            |
| `syncTimeout`   | Timeout when executing synchronous functions     | `syncTimeout: 300`                    |
| `asyncTimeout`  | Timeout when executing asynchronous functions    | `asyncTimeout: 1000`                  |
| `globalModules` | Modules that will be available to all functions  | `globalModules: [ 'path/to/module' ]` |


## Objects

### req -> Request

| Property | Type     | Description                             |
|:---------|:---------|:----------------------------------------|
| headers  | property | HTTP Headers received from this request |
| query    | property | HTTP parsed querystring                 |
| body     | property | HTTP body decoded from json             |

### res -> Response

| Property                 | Type      | Description                                       |
|:-------------------------|:----------|:--------------------------------------------------|
| set(header, value)       | method    | set a HTTP Header value                           |
| status(statusCode)       | method    | change status code of this response, default: 200 |
| send(body)               | method    | finalize the response sending body to the client  |
| notModified()            | method    | finalize the response sending 304 without body    |
| badRequest(msg)          | method    | finalize the response sending 400 with error msg  |
| notFound(msg)            | method    | finalize the response sending 404 with error msg  |
| unprocessableEntity(msg) | method    | finalize the response sending 422 with error msg  |
| internalServerError(msg) | method    | finalize the response sending 500 with error msg  |
