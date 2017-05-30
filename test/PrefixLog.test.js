const expect = require('chai').expect;
const PrefixLog = require('../lib/PrefixLog');
const MemoryStream = require('../lib/MemoryStream');

describe('PrefixLog', () => {
  let log;
  let stdOutStream;
  let stdErrStream;

  beforeEach(() => {
    stdOutStream = new MemoryStream();
    stdErrStream = new MemoryStream();

    log = new PrefixLog('test', stdOutStream, stdErrStream);
  });

  it('info', () => {
    log.info('is info', '123');
    expect(stdOutStream.buffer).to.be.eql(['info: [test] is info 123\n']);
  });

  it('log', () => {
    log.log('is log', '321');
    expect(stdOutStream.buffer).to.be.eql(['info: [test] is log 321\n']);
  });

  it('error', () => {
    log.error('is error', 'details:');
    log.error(new Error().stack);
    expect(stdErrStream.buffer[0]).to.be.eql('error: [test] is error details:\n');
    expect(stdErrStream.buffer.length).to.be.above(5);
    for (const line of stdErrStream.buffer) {
      expect(line.indexOf('error: [test]')).to.be.eql(0);
    }
  });

  it('warn', () => {
    log.warn('is warn', 'details:');
    expect(stdErrStream.buffer).to.be.eql(['error: [test] is warn details:\n']);
  });

  describe('when ommit the name of prefix', () => {
    it('should attach just the level of error', () => {
      const stream = new MemoryStream();
      log = new PrefixLog(null, stream, stream);

      log.info('is info');
      log.error('is error');

      expect(stream.buffer).to.be.eql([
        'info: is info\n',
        'error: is error\n',
      ]);
    });
  });
});
