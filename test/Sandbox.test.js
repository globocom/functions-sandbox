const expect = require('chai').expect;

const Sandbox = require('../lib/Sandbox');
const PrefixLog = require('../lib/PrefixLog');

const MemoryStream = require('../lib/MemoryStream');

describe('Sandbox', () => {
  let testSandbox;

  before(() => {
    testSandbox = new Sandbox({
      env: {
        MY_GLOBALVAR: 'test',
      },
      globalModules: [
        'fs',
      ],
      asyncTimeout: 100,
      config: {
        test: 'test',
      },
    });
  });

  it('should assure the globalModules were required', () => {
    expect(testSandbox.loadedGlobalModules[0]).to.have.property('readFile');
  });

  describe('#createEmptyContext()', () => {
    let context;
    const backstageOptions = { pluggedAction: true };
    const prefix = null;
    const extraEnv = { CUSTOM_VAR: 'foo' };

    before(() => {
      context = testSandbox.createEmptyContext(backstageOptions, prefix, extraEnv);
    });

    it('should return context with Backstage modules', () => {
      expect(context.Backstage.modules).to.eql({});
    });

    it('should return context with Backstage env', () => {
      expect(context.Backstage.env.MY_GLOBALVAR).to.eql('test');
    });

    it('should return custom context', () => {
      expect(context.Backstage.env.CUSTOM_VAR).to.eql('foo');
    });

    it('should return context with Backstage config', () => {
      expect(context.Backstage.config.test).to.eql('test');
    });

    it('should return context with console', () => {
      expect(context.console).to.be.eql(console);
    });

    it('should return context with exports', () => {
      expect(context.exports).to.eql({});
    });

    it('should return context with module', () => {
      expect(context.module).to.eql({ exports: {} });
    });

    it('should return context with setTimeout', () => {
      expect(context.setTimeout).to.exist;
    });

    it('should return context with clearTimeout', () => {
      expect(context.clearTimeout).to.equal(clearTimeout);
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

    describe('when attach a module', () => {
      before(() => {
        context.Backstage.modules['./foo'] = () => 10;
        context.Backstage.modules['./foo/bar'] = () => 20;
      });

      it('should allow import absolute modules', () => {
        expect(context.require('./foo')).to.be.eql(10);
      });

      it('should allow import relative modules', () => {
        const relativeRequire = context.relativeRequire('foo');
        expect(relativeRequire('./bar')).to.be.eql(20);
      });
    });

    describe('when attach a different console', () => {
      const differentConsole = {
        info: () => {},
        error: () => {},
      };

      before(() => {
        context = testSandbox.createEmptyContext(
          backstageOptions, prefix, extraEnv, differentConsole);
      });

      it('should attach the related console', () => {
        expect(context.console).to.be.eql(differentConsole);
      });
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

        expect(result.error).to.be.eql('SyntaxError: Unexpected token \'}\'');
        expect(result.stack).to.be.eql('');
      });
    });

    describe('when code has a RuntimeError', () => {
      it('should raise an error', () => {
        const code = `
             function calculateBar() {
                throw new Error('Runtime Error');
             }
             calculateBar();
             function main() {}
        `;
        const result = testSandbox.testSyntaxError('test.js', code);

        expect(result.error).to.be.eql('Error: Runtime Error');
        expect(result.stack).to.be.eql('at calculateBar (test.js:3)\n' +
                                       'at test.js:5\n' +
                                       'at test.js:8');
      });
    });
  });

  describe('#compileCode() and #runScript()', () => {
    describe('when code has a const variable', () => {
      it('should allow to compile two times', (done) => {
        const filename = 'test.js';

        const env1 = { RESULT: 5 };
        const env2 = { RESULT: 40 };
        const code1 = `function main(req, res){
          console.info(Backstage.span.operationName);
          res.send(Backstage.env.RESULT * 2);
        }`;
        const code2 = `function main(req, res){
          console.error(Backstage.span.operationName);
          res.send(Backstage.env.RESULT / 2);
        }`;

        const script1 = testSandbox.compileCode(filename, code1);
        const script2 = testSandbox.compileCode(filename, code2);

        const stream = new MemoryStream();
        const attachConsole = new PrefixLog(null, stream, stream);

        // span1 and span2 are mocks from opentracing spans
        const span1 = { operationName: 'Hey' };
        const span2 = { operationName: 'Joe' };

        Promise
          .all([
            testSandbox.runScript(script1, {}, { env: env1, console: attachConsole, span: span1 }),
            testSandbox.runScript(script2, {}, { env: env2, console: attachConsole, span: span2 }),
          ])
          .then(([res1, res2]) => {
            expect(res1.body).to.be.eql(10);
            expect(res2.body).to.be.eql(20);
            expect(stream.buffer).to.be.eql([
              'info: Hey\n',
              'error: Joe\n',
            ]);
            done();
          })
          .catch((error) => {
            done(error);
          });
      });
    });

    describe('when code has a new async/await syntax', () => {
      describe('when return a value', () => {
        it('should result in a value', async () => {
          const filename = 'test.js';
          const code = 'async function main(req){ return {a: 1}; }';
          const script = testSandbox.compileCode(filename, code);

          const result = await testSandbox.runScript(script, {});
          expect(result.status).to.be.eql(200);
          expect(result.body).to.be.eql({ a: 1 });
        });
      });

      describe('when throw an exception', () => {
        it('should result in a value', async () => {
          const filename = 'test.js';
          const code = `async function main(req, res){
              res.set("test", "ok");
              throw new UnprocessableEntity("testing");
          }`;
          const script = testSandbox.compileCode(filename, code);

          try {
            await testSandbox.runScript(script, {});
            throw new Error('Not raised an exception');
          } catch (err) {
            expect(err.message).to.be.eql('testing');
            expect(err.statusCode).to.be.eql(422);
          }
        });
      });

      describe('when throw a not modified exception', () => {
        it('should result in a value', async () => {
          const filename = 'test.js';
          const code = 'async function main(req, res){ throw new NotModified(); }';
          const script = testSandbox.compileCode(filename, code);

          try {
            await testSandbox.runScript(script, {});
            throw new Error('Not raised an exception');
          } catch (err) {
            expect(err.message).to.be.eql('');
            expect(err.statusCode).to.be.eql(304);
          }
        });
      });
    });

    describe('when code return with new async/await syntax', () => {
      it('should run', async () => {
        const filename = 'test.js';
        const code = 'async function main(req){ return {a: 1}; }';
        const script = testSandbox.compileCode(filename, code);

        const result = await testSandbox.runScript(script, {});
        expect(result.body).to.be.eql({ a: 1 });
      });
    });

    describe('when code return without new async/await syntax', () => {
      it('should run', async () => {
        const filename = 'test.js';
        const code = 'function main(req, res){ res.send({ a: 1 }); return \'ok\'; }';
        const script = testSandbox.compileCode(filename, code);

        const result = await testSandbox.runScript(script, {});
        expect(result.body).to.be.eql({ a: 1 });
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
          })
          .catch(err => done(err));
      });
    });

    describe('when code has an not declared variable', () => {
      it('should resolve promise as rejected by "strict mode"', (done) => {
        const filename = 'test.js';
        const code = `
          function main(req, res) {
             foo = 'bar';
          }
        `;
        const script = testSandbox.compileCode(filename, code);

        testSandbox
          .runScript(script, {})
          .then(() => {
            done(new Error('It is expected an error'));
          }, (error) => {
            expect(error.message).to.be.eql('foo is not defined');
            done();
          })
          .catch(err => done(err));
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
          })
          .catch(err => done(err));
      });
    });
  });

  describe('#runLocalCode()', () => {
    describe('when code is correct', () => {
      it('should not return any error', (done) => {
        const filename = './test/support/valid.js';
        const req = {};

        testSandbox
          .runLocalCode(filename, req)
          .then((result) => {
            expect(result.body).to.be.eql(11);
            expect(result.status).to.be.eql(200);
            done();
          }).catch(err => done(err));
      });
    });

    describe('when code is incorrect', () => {
      it('should return any error', (done) => {
        const filename = './test/support/invalid.js';
        const req = {};

        testSandbox
          .runLocalCode(filename, req)
          .catch((err) => {
            expect(err.message).to.be.eql('b is not defined');
            done();
          }).catch(err => done(err));
      });
    });

    describe('options', () => {
      it('should allow pass a console instance', (done) => {
        const filename = './test/support/valid.js';
        const req = {};

        const mockedConsole = {
          error: () => {},
          log: () => {},
          info: () => {},
          warn: () => {},
        };

        const testSyntaxErrorCalls = [];
        testSandbox.testSyntaxError = (...args) => {
          testSyntaxErrorCalls.push(args);
        };

        const runScriptCalls = [];
        testSandbox.runScript = (...args) => {
          runScriptCalls.push(args);
          return Promise.resolve();
        };

        testSandbox
          .runLocalCode(filename, req, { console: mockedConsole })
          .then(() => {
            expect(testSyntaxErrorCalls[0][2].console).to.eql(mockedConsole);
            expect(runScriptCalls[0][2].console).to.eql(mockedConsole);
            done();
          }).catch(err => done(err));
      });
    });
  });
});
