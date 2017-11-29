class HTTPError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

function NotModified() {
  return new HTTPError('', 304);
}

function BadRequest(message) {
  return new HTTPError(message, 400);
}

function NotFound(message) {
  return new HTTPError(message, 404);
}

function UnprocessableEntity(message) {
  return new HTTPError(message, 422);
}

function InternalServerError(message) {
  return new HTTPError(message, 500);
}

module.exports = {
  NotModified,
  BadRequest,
  NotFound,
  UnprocessableEntity,
  InternalServerError,
};
