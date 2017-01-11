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

function encapsulateCode(sandbox, code) {
  const scriptArguments = Object.keys(sandbox.context).join(', ');

  return `((${scriptArguments}) => {
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
const codeFoot = 'main.call(null, Backstage.request, Backstage.response);';
const functionTimeoutErr = new Error('Function timeout');
functionTimeoutErr.statusCode = 408;

class Sandbox {
  constructor({ env, globalModules, asyncTimeout, syncTimeout, config }) {
    this.context = {
      Backstage: null,
      Buffer: null,
      console: null,
      exports: null,
      module: null,
      setTimeout: null,
      require: null,
      relativeRequire: null,
    };
    this.env = env || {};
    this.globalModules = globalModules || [];
    this.loadedGlobalModules = this.globalModules.map(moduleName => require(moduleName)); // eslint-disable-line global-require, import/no-dynamic-require, max-len
    this.syncTimeout = syncTimeout || defaultSyncTimeout;
    this.asyncTimeout = asyncTimeout || defaultAsyncTimeout;
    this.config = config || {};
  }

  createEmptyContext(backstageOptions, prefix = null, extraEnv = null) {
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

    if (prefix) {
      this.context.console = new PrefixLog(prefix);
    } else {
      this.context.console = console;
    }

    this.context.Buffer = Buffer;
    this.context.setTimeout = setTimeout;
    this.context.exports = exports;
    this.context.module = { exports };
    this.context.require = sandboxRequire.generateRequire();
    this.context.relativeRequire = sandboxRequire.generateRelativeRequire();

    if (backstageOptions) {
      for (const key of Object.keys(backstageOptions)) {
        this.context.Backstage[key] = backstageOptions[key];
      }
    }

    return vm.createContext(this.context);
  }

  testSyntaxError(filename, code, { prefix } = {}) {
    const text = encapsulateCode(this, code);

    try {
      const script = new vm.Script(text, { filename, displayErrors: false, lineOffset: -1 });
      const context = this.createEmptyContext({}, prefix || filename);
      script.runInContext(context, { timeout: this.syncTimeout });
    } catch (e) {
      const error = e.toString();
      const stack = filterStackTrace(filename, e);

      return { error, stack };
    }

    return null;
  }

  compileCode(filename, code) {
    const text = encapsulateCode(this, code + codeFoot);

    return new vm.Script(text, {
      filename,
      displayErrors: true,
      timeout: this.syncTimeout,
    });
  }

  runScript(script, req, { prefix, env } = {}) {
    return new Promise((accept, reject) => {
      const asyncTimeout = new AsyncTimeout(this.asyncTimeout);

      asyncTimeout.add(() => {
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
      const context = this.createEmptyContext({
        request: sandboxReq,
        response: sandboxRes,
      }, prefix, env);

      const vmDomain = domain.create();
      vmDomain.on('error', (err) => {
        callback(err);
      });

      vmDomain.run(() => {
        script.runInContext(context, {
          timeout: this.syncTimeout,
          displayErrors: false,
          lineOffset: -1,
        });
      });
    });
  }

  runLocalCode(filename, req) {
    return new Promise((accept, reject) => {
      const code = fs.readFileSync(filename, 'utf8');
      const options = { prefix: filename };
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
