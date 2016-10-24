const expect = require('chai').expect;
const Sandbox = require('../lib/Sandbox');

describe('Sandbox', () => {
  let testSandbox;

  before(() => {
    testSandbox = new Sandbox({
      env: {
        MY_GLOBALVAR: 'test',
      },
      asyncTimeout: 100,
    });
  });

  describe('#createEmptyContext()', () => {
    let context;
    before(() => {
      const backstageOptions = { pluggedAction: true };
      context = testSandbox.createEmptyContext(backstageOptions);
    });

    it('should return context with Backstage modules', () => {
      expect(context.Backstage.modules).to.eql({});
    });

    it('should return context with console', () => {
      expect(context.console).to.exist;
    });

    it('should return context with exports', () => {
      expect(context.exports).to.eql({});
    });

    it('should return context with module', () => {
      expect(context.module).to.eql({ exports: {} });
    });

    it('should return context with setTimeout', () => {
      expect(context.setTimeout).to.equal(setTimeout);
    });

    it('should return context with Buffer', () => {
      expect(context.Buffer).to.equal(Buffer);
    });

    it('should allow to extends Backstage object', () => {
      expect(context.Backstage.pluggedAction).to.be.true;
    });

    it('should return context with require', () => {
      expect(context.require).to.exist;
    });

    it('should return context with relativeRequire', () => {
      expect(context.relativeRequire).to.exist;
    });
  });

  describe('#testSyntaxError()', () => {
    describe('when code is correct', () => {
      it('should not return any error', () => {
        const code = 'function main() {}';
        const result = testSandbox.testSyntaxError('test.js', code);

        expect(result).to.be.null;
      });
    });

    describe('when code has any SyntaxError', () => {
      it('should raise an error', () => {
        const code = 'var a = [};';
        const result = testSandbox.testSyntaxError('test.js', code);

        expect(result.error).to.be.eql('SyntaxError: Unexpected token }');
        expect(result.stack).to.be.eql('');
      });
    });
  });

  describe('#compileCode() and #runScript()', () => {
    describe('when code has a const variable', () => {
      it('should allow to compile two times', (done) => {
        const filename = 'test.js';

        const code1 = 'const a = 10; function main(req, res){ res.send(a); }';
        const code2 = 'const a = 20; function main(req, res){ res.send(a); }';

        const script1 = testSandbox.compileCode(filename, code1);
        const script2 = testSandbox.compileCode(filename, code2);

        Promise
          .all([
            testSandbox.runScript(script1, {}),
            testSandbox.runScript(script2, {}),
          ])
          .then(([res1, res2]) => {
            expect(res1.body).to.be.eql(10);
            expect(res2.body).to.be.eql(20);
            done();
          }, (error) => {
            done(error);
          });
      });
    });

    describe('when code has an error in main function', () => {
      it('should resolve promise as rejected', (done) => {
        const filename = 'test.js';
        const code = 'function main(req, res){ throw new Error(\'An error\'); }';
        const script = testSandbox.compileCode(filename, code);

        testSandbox
          .runScript(script, {})
          .then(() => {
            done(new Error('It is expected an error'));
          }, (error) => {
            expect(error.message).to.be.eql('An error');
            done();
          });
      });
    });

    describe('when code has an error in anonymous function', () => {
      it('should resolve promise as rejected', (done) => {
        const filename = 'test.js';
        const code = `
          function main(req, res) {
            setTimeout(() => {
              throw new Error('An error');
            }, 10);
          }
        `;
        const script = testSandbox.compileCode(filename, code);

        testSandbox
          .runScript(script, {})
          .then(() => {
            done(new Error('It is expected an error'));
          }, (error) => {
            expect(error.message).to.be.eql('An error');
            done();
          });
      });
    });

    describe('when code has a timeout problem', () => {
      it('should resolve promise as rejected', (done) => {
        const filename = 'test.js';
        const code = 'function main(req, res) {}';
        const script = testSandbox.compileCode(filename, code);

        testSandbox
          .runScript(script, {})
          .then(() => {
            done(new Error('It is expected an error'));
          }, (error) => {
            expect(error.message).to.be.eql('Function timeout');
            done();
          });
      });
    });
  });
});
