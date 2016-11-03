function emitError(response, statusCode, error) {
  response.status(statusCode).send({ error });
}

class Response {
  constructor({ callback }) {
    this.callback = callback;
    this.statusCode = 200;
    this.headers = {};
  }

  set(header, value) {
    this.headers[header] = value;
    return this;
  }

  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  }

  send(body) {
    const status = this.statusCode || 200;
    const headers = this.headers;
    this.callback(null, { status, body, headers });
  }

  notModified() {
    this.status(304).send(null);
  }

  badRequest(msg) {
    emitError(this, 400, msg);
  }

  notFound(msg) {
    emitError(this, 404, msg);
  }

  unprocessableEntity(msg) {
    emitError(this, 422, msg);
  }

  internalServerError(msg) {
    emitError(this, 500, msg);
  }
}

module.exports = Response;
