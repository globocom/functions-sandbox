class Request {
  constructor({ headers, query, body }) {
    this.headers = headers;
    this.query = query;
    this.body = body;
  }
}

module.exports = Request;
