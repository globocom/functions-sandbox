const expect = require('chai').expect;
const MemoryStream = require('../lib/MemoryStream');

describe('MemoryStream', () => {
  describe('#write', () => {
    it('should write into buffer array', () => {
      const stream = new MemoryStream();
      stream.write('testing');
      stream.write('foo');

      expect(stream.buffer).to.be.eql([
        'testing',
        'foo',
      ]);
      expect(stream.size).to.be.eql(10);
      expect(stream.truncated).to.be.false;
    });

    describe('when stream have a maxSize', () => {
      it('should limit the size of array buffer', () => {
        const stream = new MemoryStream(9);
        stream.write('testing');
        stream.write('foo');
        stream.write('bar');

        expect(stream.buffer).to.be.eql([
          'testing',
          'fo',
        ]);
        expect(stream.size).to.be.eql(9);
        expect(stream.truncated).to.be.true;
      });
    });
  });
});
