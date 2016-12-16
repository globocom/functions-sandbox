class Request {
  constructor({ method, headers, query, body }) {
    this.method = method;
    this.headers = headers;
    this.query = query;
    this.body = body;
  }
}

module.exports = Request;
