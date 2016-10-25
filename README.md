[![Build Status](https://travis-ci.org/backstage/functions-sandbox.png?branch=master)](https://travis-ci.org/backstage/functions-sandbox)
[![Coverage Status](https://coveralls.io/repos/github/backstage/functions-sandbox/badge.svg?branch=master)](https://coveralls.io/github/backstage/functions-sandbox?branch=master)

# Backstage functions-sandbox
Open source sandbox used in [Backstage functions](https://github.com/backstage/functions)

# Example of usage

```javascript
const Sandbox = require('backstage-functions-sandbox');

const mySandbox = new Sandbox({
  env: {
     MY_VAR: 'TRUE', // enviroment variable will be available on Backstage.env.MY_VAR
  },
  globalModules: [ 'path' ], // put all available modules that will allowed to import
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

// loopback.Request compatible
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
