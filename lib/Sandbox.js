const vm = require('vm');
const once = require('once');
const domain = require('domain');
const stackTrace = require('stack-trace');
const fs = require('fs');

const AsyncTimeout = require('./AsyncTimeout');
const PrefixLog = require('./PrefixLog');
const Request = require('./Request');
const Require = require('./Require');
const Response = require('./Response');
const errors = require('./errors');
const SandboxInternalException = require('./SandboxInternalException');

const systemConsole = console;

function encapsulateCode(sandbox, code) {
  const scriptArguments = Object.keys(sandbox.context).join(', ');

  return `((${scriptArguments}) => { 'use strict';
${code}
})(${scriptArguments});`;
}

function filterStackTrace(filename, e) {
  const lines = stackTrace.parse(e);

  return lines
    .filter(line => line.fileName === filename)
    .map((line) => {
      if (line.functionName) {
        return `at ${line.functionName} (${line.fileName}:${line.lineNumber})`;
      }
      return `at ${line.fileName}:${line.lineNumber}`;
    })
    .join('\n');
}

const defaultSyncTimeout = 100;
const defaultAsyncTimeout = 5000;
const codeFoot = (
  'if (main.constructor.name === \'AsyncFunction\') {' +
  'return main.call(null, Backstage.request, Backstage.response);' +
  '} else {' +
  'main.call(null, Backstage.request, Backstage.response);' +
  '}'
);

class Sandbox {
  constructor({ env, globalModules, asyncTimeout, syncTimeout, config }) {
    this.context = Object.assign({}, {
      Backstage: null,
      Buffer: null,
      console: null,
      exports: null,
      module: null,
      setTimeout: null,
      clearTimeout: null,
      require: null,
      relativeRequire: null,
    }, errors);
    this.env = env || {};
    this.globalModules = globalModules || [];
    this.loadedGlobalModules = this.globalModules.map(moduleName => require(moduleName)); // eslint-disable-line global-require, import/no-dynamic-require, max-len
    this.syncTimeout = syncTimeout || defaultSyncTimeout;
    this.asyncTimeout = asyncTimeout || defaultAsyncTimeout;
    this.config = config || {};
    this.activeTimers = []
  }

  createEmptyContext(backstageOptions, prefix = null, extraEnv = null, console = null, objsList={}) {
    const exports = {};

    this.context.Backstage = {
      modules: {},
      env: this.env,
      config: this.config,
    };

    if (extraEnv) {
      this.context.Backstage.env = Object.assign({}, this.env, extraEnv);
    }

    const sandboxRequire = new Require({
      modules: this.context.Backstage.modules,
      relativePath: '.',
      globalModules: this.globalModules,
    });

    if (console) {
      this.context.console = console;
    } else if (prefix) {
      this.context.console = new PrefixLog(prefix);
    } else {
      this.context.console = systemConsole;
    }

    this.context.Buffer = Buffer;
    this.context.setTimeout = (func, delay) => {
      const timeoutId = setTimeout(func, delay);
      objsList.timerList.push(timeoutId)
      return timeoutId
    }
    this.context.setInterval = (func, interval) => {
      const intervalId = setInterval(func, interval);
      objsList.intervalList.push(intervalId)
      return intervalId
    }
    this.context.clearTimeout = clearTimeout;
    this.context.exports = exports;
    this.context.module = { exports };
    this.context.require = sandboxRequire.require;
    this.context.relativeRequire = sandboxRequire.relativeRequire;

    if (backstageOptions) {
      for (const key of Object.keys(backstageOptions)) {
        this.context.Backstage[key] = backstageOptions[key];
      }
    }

    return vm.createContext(this.context);
  }

  testSyntaxError(filename, code, { prefix, console } = {}) {
    const text = encapsulateCode(this, code);

    try {
      const script = new vm.Script(text, { filename, displayErrors: false, lineOffset: -1 });
      let objsCounter = { intervalList: [], timerList: []}
      const context = this.createEmptyContext({}, prefix || filename, null, console, objsCounter);
      script.runInContext(context, { timeout: this.syncTimeout });
    } catch (e) {
      const error = e.toString();
      const stack = filterStackTrace(filename, e);

      return { error, stack };
    }

    return null;
  }

  compileCode(filename, code) {
    try{
      const text = encapsulateCode(this, code + codeFoot);
  
      return new vm.Script(text, {
        filename,
        displayErrors: true,
        timeout: this.syncTimeout,
      });
    }catch(e){
      throw new SandboxInternalException(e)
    }
  }

  hasPendingObjects(objsList) {
    return (objsList.timerList.length > 0) || (objsList.intervalList.length > 0);
  }

  finishPendingObjects(objsList) {
    if (!objsList) return;

    if (objsList.timerList) {
      objsList.timerList.forEach((timeoutId) => clearTimeout(timeoutId));
    }
    if (objsList.intervalList) {
      objsList.intervalList.forEach((intervalId) => clearInterval(intervalId));
    }
  }

  runScript(script, req, { prefix, env, console, span } = {}) {
    return new Promise((accept, reject) => {
      const asyncTimeout = new AsyncTimeout(this.asyncTimeout);

      asyncTimeout.add(() => {
        const functionTimeoutErr = new Error('Function timeout');
        functionTimeoutErr.statusCode = 408;
        reject(functionTimeoutErr);
      });

      const callback = once((err, value) => {
        asyncTimeout.clear();

        if (err) {
          reject(err);
        } else {
          accept(value);
        }
      });

      const sandboxReq = new Request(req);
      const sandboxRes = new Response({ callback });
      let objsList = { intervalList: [], timerList: []}
      const context = this.createEmptyContext({
        request: sandboxReq,
        response: sandboxRes,
        span,
      }, prefix, env, console, objsList);

      const vmDomain = domain.create();
      vmDomain.on('error', (err) => {
        this.finishPendingObjects(objsList)
        callback(err);
      });
      try{
        vmDomain.run(() => {
          const result = script.runInContext(context, {
            timeout: this.syncTimeout,
            displayErrors: false,
            lineOffset: -1,
          });
  
          if (result && result.constructor.name === 'Promise') {
            result
              .then((body) => {
                this.finishPendingObjects(objsList)
                sandboxRes.send(body);
              })
              .catch((err) => {
                callback(err);
              });
              return
          }
          this.finishPendingObjects(objsList)
        });
      }catch(e){
        throw new SandboxInternalException(e)
      }
    });
  }

  runLocalCode(filename, req, { console } = {}) {
    return new Promise((accept, reject) => {
      const code = fs.readFileSync(filename, 'utf8');
      const options = { prefix: filename, console };
      const invalid = this.testSyntaxError(filename, code, options);

      if (invalid) {
        reject(invalid);
        return;
      }

      const script = this.compileCode(filename, code);

      this.runScript(script, req, options).then((result) => {
        accept(result);
      }, (err) => {
        reject(err);
      });
    });
  }
}

module.exports = Sandbox;
