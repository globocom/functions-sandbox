const expect = require('chai').expect;
const Request = require('../lib/Request');

describe('Request', () => {
  let externalRequest;
  before(() => {
    externalRequest = {
      method: 'PUT',
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
      expect(req).to.have.all.keys('headers', 'query', 'body', 'method');
      expect(req.method).to.be.eql('PUT');
      expect(req.query).to.be.eql({ q: 'john' });
      expect(req.body).to.be.eql({ name: 'John doe' });
      expect(req.headers).to.be.eql({ host: 'localhost:3000', accept: '*/*' });
    });
  });

  describe('when pass a `sandbox-omit-headers` header', () => {
    before(() => {
      externalRequest = {
        headers: {
          host: 'localhost:3000',
          accept: '*/*',
          authorization: 'xpto',
          'sandbox-omit-headers': 'authorization,host',
        },
      };
    });

    it('should skip related headers', () => {
      const req = new Request(externalRequest);
      expect(Object.keys(req.headers)).to.be.eql([
        'accept',
        'sandbox-omit-headers',
      ]);
    });
  });
});
