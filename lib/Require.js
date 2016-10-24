const path = require('path');

const requireFunction = require;

class Require {

  constructor(module, relativePath, globalModules) {
    this.module = module;
    this.relativePath = relativePath;
    this.globalModules = globalModules;
  }

  generateRelativeRequire() {
    return (relativePath) => {
      const newRequire = (requireName) => {
        const normalizedLocalName = `./${path.normalize(`${relativePath}/${requireName}`)}`;
        let relativeModule = this.module[normalizedLocalName];
        if (relativeModule === undefined) {
          relativeModule = this.generateRequire()(requireName);
        } else {
          relativeModule = relativeModule();
        }
        return relativeModule;
      };
      return newRequire;
    };
  }

  generateRequire() {
    return (requireName) => {
      let requestedModule;
      if (this.module && this.module[requireName] !== undefined) {
        requestedModule = this.module[requireName]();
      } else if (this.globalModules.indexOf(requireName) !== -1) {
        requestedModule = requireFunction(requireName);
      } else {
        throw new Error(`Cannot find module '${requireName}'`);
      }
      return requestedModule;
    };
  }
}

module.exports = Require;
