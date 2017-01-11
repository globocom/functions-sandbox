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
  }

  generateRelativeRequire() {
    return (relativePath) => {
      const newRequire = (requireName) => {
        const normalizedLocalName = `./${path.normalize(`${relativePath}/${requireName}`)}`;
        let relativeModule = this.modules[normalizedLocalName];
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
      if (this.modules && this.modules[requireName] !== undefined) {
        requestedModule = this.modules[requireName]();
      } else if (this.globalModules.indexOf(requireName) !== -1) {
        requestedModule = this.requireFunction(requireName);
      } else {
        throw new Error(`Cannot find module '${requireName}'`);
      }
      return requestedModule;
    };
  }
}

module.exports = Require;
