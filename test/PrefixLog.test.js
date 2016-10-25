const expect = require('chai').expect;

const PrefixLog = require('../lib/PrefixLog');


class FakeConsole {
  constructor() {
    this.buffer = [];
  }

  debug(...args) {
    this.write('debug:', ...args);
  }

  info(...args) {
    this.write('info:', ...args);
  }

  log(...args) {
    this.write('log:', ...args);
  }

  error(...args) {
    this.write('error:', ...args);
  }

  warn(...args) {
    this.write('warn:', ...args);
  }

  write(...args) {
    this.buffer.push(args.join(' '));
  }
}

describe('PrefixLog', () => {
  let log;
  let fakeConsole;

  beforeEach(() => {
    fakeConsole = new FakeConsole();
    log = new PrefixLog('test', fakeConsole);
  });

  it('info', () => {
    log.info('is info', '123');
    expect(fakeConsole.buffer).to.be.eql(['info: [test] is info 123']);
  });

  it('log', () => {
    log.log('is log', '321');
    expect(fakeConsole.buffer).to.be.eql(['info: [test] is log 321']);
  });

  it('error', () => {
    log.error('is error', 'details:');
    expect(fakeConsole.buffer).to.be.eql(['error: [test] is error details:']);
  });

  it('warn', () => {
    log.warn('is warn', 'details:');
    expect(fakeConsole.buffer).to.be.eql(['warn: [test] is warn details:']);
  });

  it('debug', () => {
    log.debug('is debug');
    expect(fakeConsole.buffer).to.be.eql(['debug: [test] is debug']);
  });
});
