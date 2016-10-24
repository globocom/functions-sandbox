const expect = require('chai').expect;
const Request = require('../lib/Request');

describe('Request', () => {
  let externalRequest;
  before(() => {
    externalRequest = {
      headers: {
        host: 'localhost:3000',
        accept: '*/*',
      },
      query: { q: 'john' },
      body: { name: 'John doe' },
    };
  });

  describe('when we need to create new request without data', () => {
    it('should copy data that matches only some parameters of the request', () => {
      const req = new Request(externalRequest);
      expect(req).to.have.all.keys('headers', 'query', 'body');
    });
  });
});
