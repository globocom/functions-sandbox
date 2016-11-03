const expect = require('chai').expect;
const Response = require('../lib/Response');

describe('Response', () => {
  describe('create a response successfully', () => {
    let res;
    let codeResponse;

    before((done) => {
      const callback = (err, responseData) => {
        codeResponse = responseData;
        done();
      };
      res = new Response({ callback });
      res.send({ result: 'ok' });
    });

    it('should sends the response with default status of 200', () => {
      expect(codeResponse.body).to.be.eql({ result: 'ok' });
      expect(codeResponse.status).to.be.eql(200);
    });

    it('should sends an empty header object when none is defined', () => {
      expect(codeResponse.headers).to.be.eql({});
    });
  });

  describe('create a response with created status code (201)', () => {
    let res;
    let codeResponse;

    before((done) => {
      const callback = (err, responseData) => {
        codeResponse = responseData;
        done();
      };
      res = new Response({ callback });
      res.status(201).send({ content: { name: 'foobar' } });
    });

    it('should sends the response with status of 201', () => {
      expect(codeResponse.body).to.be.eql({ content: { name: 'foobar' } });
      expect(codeResponse.status).to.be.eql(201);
    });
  });

  describe('create a response with not-modified status code (304)', () => {
    let res;
    let codeResponse;

    before((done) => {
      const callback = (err, responseData) => {
        codeResponse = responseData;
        done();
      };
      res = new Response({ callback });
      res.notModified();
    });

    it('should sends the response with status of 304', () => {
      expect(codeResponse.body).to.be.null;
      expect(codeResponse.status).to.be.eql(304);
    });
  });

  describe('create a response with bad request status code (400)', () => {
    let res;
    let codeResponse;

    before((done) => {
      const callback = (err, responseData) => {
        codeResponse = responseData;
        done();
      };
      res = new Response({ callback });
      res.badRequestError('Its an error');
    });

    it('should sends the response with status of 304', () => {
      expect(codeResponse.body).to.be.eql({ error: 'Its an error' });
      expect(codeResponse.status).to.be.eql(400);
    });
  });

  describe('create a response with not found status code (404)', () => {
    let res;
    let codeResponse;

    before((done) => {
      const callback = (err, responseData) => {
        codeResponse = responseData;
        done();
      };
      res = new Response({ callback });
      res.notFoundError('My resource not is found');
    });

    it('should sends the response with status of 404', () => {
      expect(codeResponse.body).to.be.eql({ error: 'My resource not is found' });
      expect(codeResponse.status).to.be.eql(404);
    });
  });

  describe('create a response with validation error status code (422)', () => {
    let res;
    let codeResponse;

    before((done) => {
      const callback = (err, responseData) => {
        codeResponse = responseData;
        done();
      };
      res = new Response({ callback });
      res.validationError('Field a is wrong');
    });

    it('should sends the response with status of 422', () => {
      expect(codeResponse.body).to.be.eql({ error: 'Field a is wrong' });
      expect(codeResponse.status).to.be.eql(422);
    });
  });

  describe('create a response with internal server error status code (500)', () => {
    let res;
    let codeResponse;

    before((done) => {
      const callback = (err, responseData) => {
        codeResponse = responseData;
        done();
      };
      res = new Response({ callback });
      res.internalServerError('Server crashed');
    });

    it('should sends the response with status of 500', () => {
      expect(codeResponse.body).to.be.eql({ error: 'Server crashed' });
      expect(codeResponse.status).to.be.eql(500);
    });
  });

  describe('set headers to be send as response', () => {
    let res;
    let codeResponse;

    before((done) => {
      const callback = (err, responseData) => {
        codeResponse = responseData;
        done();
      };
      res = new Response({ callback });
      res.set('X-FOO', 'bar');
      res.send({ result: 'ok' });
    });

    it('should sends the response with default status of 200', () => {
      expect(codeResponse.body).to.be.eql({ result: 'ok' });
      expect(codeResponse.status).to.be.eql(200);
    });

    it('should sends the response with the correct header set', () => {
      expect(codeResponse.headers['X-FOO']).to.be.eql('bar');
    });
  });

  describe('chain headers to send as response', () => {
    let res;
    let codeResponse;

    before((done) => {
      const callback = (err, responseData) => {
        codeResponse = responseData;
        done();
      };
      res = new Response({ callback });
      res.set('X-FOO', 'bar').set('X-BAR', 'baz');
      res.send({ result: 'ok' });
    });

    it('should sends the response with default status of 200', () => {
      expect(codeResponse.body).to.be.eql({ result: 'ok' });
      expect(codeResponse.status).to.be.eql(200);
    });

    it('should sends the response with the correct header set', () => {
      expect(codeResponse.headers['X-FOO']).to.be.eql('bar');
      expect(codeResponse.headers['X-BAR']).to.be.eql('baz');
    });
  });
});
