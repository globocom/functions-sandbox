/* eslint class-methods-use-this: [
     'error', { "exceptMethods": ['statusCode']
   }]
*/

class NotModified extends Error {
  get statusCode() {
    return 304;
  }
}

class BadRequest extends Error {
  get statusCode() {
    return 400;
  }
}

class NotFound extends Error {
  get statusCode() {
    return 404;
  }
}

class UnprocessableEntity extends Error {
  get statusCode() {
    return 422;
  }
}

class InternalServerError extends Error {
  get statusCode() {
    return 500;
  }
}

module.exports = {
  NotModified,
  BadRequest,
  NotFound,
  UnprocessableEntity,
  InternalServerError,
};
