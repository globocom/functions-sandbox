[![Build Status](https://travis-ci.org/backstage/functions-sandbox.png?branch=master)](https://travis-ci.org/backstage/functions-sandbox)
[![Coverage Status](https://coveralls.io/repos/github/backstage/functions-sandbox/badge.svg?branch=master)](https://coveralls.io/github/backstage/functions-sandbox?branch=master)

# Backstage functions-sandbox

Backstage Functions is an Open Source serverless framework. Behind the courtains, it uses **functions-sandbox**.

**functions-sandbox** is the engine behind [Backstage Functions](https://github.com/backstage/functions) and executes code in isolation (a sandbox). It could be used for both run code in production as well as test the deployed functions (before they are deployed, hopefully).

## Example of usage

```javascript
const Sandbox = require('backstage-functions-sandbox');

const mySandbox = new Sandbox({
  env: {
     MY_VAR: 'TRUE', // enviroment variable will be available on Backstage.env.MY_VAR
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
`)

// express.Request compatible
const req = {
  headers: {},
  query: {},
  body: { x: 10, y: 10}
}

mySandbox.runScript(myCode, req).then(({status, body}) => {
  console.info('Result:', status, body);
}, (err) => {
  console.error('Error:', err);
});
```
