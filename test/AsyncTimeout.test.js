const expect = require('chai').expect;
const AsyncTimeout = require('../lib/AsyncTimeout');


describe('AsyncTimeout', () => {
  let asyncTimeout;

  before(() => {
    asyncTimeout = new AsyncTimeout(10);
  });

  describe('#add', () => {
    it('should add a new timeout', () => {
      const timeouts = asyncTimeout
              .clear()
              .add(() => {})
              .timeouts;
      expect(timeouts.length).to.be.eql(1);
    });

    describe('when timeout', () => {
      it('should call function', (done) => {
        asyncTimeout
          .clear()
          .add(() => {
            done();
          });
      });
    });
  });

  describe('#clear', () => {
    it('should clear timeouts', () => {
      const timeouts = asyncTimeout
              .clear()
              .add(() => {})
              .clear()
              .timeouts;
      expect(timeouts.length).to.be.eql(0);
    });
  });
});
