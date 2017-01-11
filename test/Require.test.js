const expect = require('chai').expect;
const Require = require('../lib/Require');

const requireFunction = require;

describe('Require', () => {
  let sandboxRequire;

  describe('#require', () => {
    before(() => {
      const modules = {
        './module1': () => ({}),
        './mypackage/module2': () => ({}),
      };
      sandboxRequire = new Require({
        modules,
        relativePath: '.',
        globalModules: ['http'],
      });
    });

    describe('when we pass a valid module we want to require', () => {
      it('should returns the module insdie myModule is loaded', () => {
        expect(sandboxRequire.require('./module1')).to.be.eql({});
      });

      it('should returns an avaliable global module', () => {
        expect(sandboxRequire.require('http')).to.be.eql(requireFunction('http'));
      });
    });

    describe('when we pass an invalid module', () => {
      it('should throws an error if invokes a module that does not exist', () => {
        const fn = () => sandboxRequire.require('does-not-exist');
        expect(fn).to.throw(Error, /Cannot find module 'does-not-exist'/);
      });

      it('should throws an error when the module exists but is not accessible', () => {
        const fn = () => sandboxRequire.require('crypto');
        expect(fn).to.throw(Error, /Cannot find module 'crypto'/);
      });
    });
  });

  describe('#relativeRequire', () => {
    before(() => {
      const modules = {
        './module1': () => ({}),
        './mypackage2/module2': () => ({}),
        './mypackage3/module3': () => ({}),
      };
      sandboxRequire = new Require({
        modules,
        relativePath: '.',
        globalModules: ['http'],
      });
    });

    describe('when we pass a valid module we want to require', () => {
      it('should be able to call module2 inside mypackage', () => {
        const moduleRequire = sandboxRequire.relativeRequire('mypackage2');
        expect(moduleRequire('module2')).to.be.eql({});
      });

      it('should be able to call module1 by full path', () => {
        const moduleRequire = sandboxRequire.relativeRequire('mypackage2');
        expect(moduleRequire('./module1')).to.be.eql({});
      });

      it('should returns an avaliable global module', () => {
        const moduleRequire = sandboxRequire.relativeRequire('mypackage2');
        expect(moduleRequire('http')).to.be.eql(requireFunction('http'));
      });
    });

    describe('when we pass an invalid module', () => {
      it('should throws an error if invokes a module that does not exist', () => {
        const moduleRequire = sandboxRequire.relativeRequire('mypackage2');
        const fn = () => moduleRequire('does-not-exist');
        expect(fn).to.throw(Error, /Cannot find module 'does-not-exist'/);
      });

      it('should throws an error if invokes directly a module of another package', () => {
        const moduleRequire = sandboxRequire.relativeRequire('mypackage2');
        const fn = () => moduleRequire('module3');
        expect(fn).to.throw(Error, /Cannot find module 'module3'/);
      });

      it('should throws an error when the module exists but is not accessible', () => {
        const moduleRequire = sandboxRequire.relativeRequire('mypackage2');
        const fn = () => moduleRequire('crypto');
        expect(fn).to.throw(Error, /Cannot find module 'crypto'/);
      });
    });
  });
});
