const path = require('path');
const child_process = require('child_process');

const Sandbox = require("./Sandbox");

const tasks = {};
const childs = {};

const codeFileName = (namespace, codeId) => {
  return `${namespace}/${codeId}.js`;
}

const executeFunctionInSandbox = (id, data, callback) => {
  
  childs[id] = child_process.fork(path.resolve(__filename)); //require this file to execute process.on('message') below

  childs[id].send({ id, data });
  tasks[id] = callback;

  childs[id].on('message', (message) => {
    const result = message.data;
    tasks[message.id](result);
    delete tasks[id];
    delete childs[id];
  });
}

module.exports = {
  executeFunctionInSandbox,
}

process.on('message', async (message) => {
  try {
    const { id, namespace, functionName } = message;
    const { env, globalModules, asyncTimeout, syncTimeout, config, preCode, req, options } = message.data;
    const sandbox = new Sandbox({ env, globalModules, asyncTimeout, syncTimeout, config });
    const filename = codeFileName(namespace, functionName);
  
    const script = sandbox.compileCode(filename, preCode.code)
    const result = await sandbox.runScript(script, req, options);
    process.send({ id, data: result });
    process.exit(0);
  } catch (ex) {
    process.send({ id: message.id, data: { error: ex.message } });
    process.exit(1);
  }
})
