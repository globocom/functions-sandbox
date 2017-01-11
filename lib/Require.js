const path = require('path');


class Require {
  constructor({
    modules,
    relativePath,
    globalModules,
    requireFunction = null,
  }) {
    this.modules = modules;
    this.relativePath = relativePath;
    this.globalModules = globalModules;
    this.requireFunction = requireFunction || require;

    // auto bind to assign to others modules
    this.relativeRequire = this.relativeRequire.bind(this);
    this.require = this.require.bind(this);
  }

  relativeRequire(relativePath) {
    const newRequire = (requireName) => {
      const normalizedLocalName = `./${path.normalize(`${relativePath}/${requireName}`)}`;
      let relativeModule = this.modules[normalizedLocalName];
      if (relativeModule === undefined) {
        relativeModule = this.require(requireName);
      } else {
        relativeModule = relativeModule();
      }
      return relativeModule;
    };
    return newRequire;
  }

  require(moduleName) {
    let requestedModule;
    if (this.modules && this.modules[moduleName] !== undefined) {
      requestedModule = this.modules[moduleName]();
    } else if (this.globalModules.indexOf(moduleName) !== -1) {
      requestedModule = this.requireFunction(moduleName);
    } else {
      throw new Error(`Cannot find module '${moduleName}'`);
    }
    return requestedModule;
  }
}

module.exports = Require;
