function filterHeaders(headers) {
  const {
    'functions-omit-headers': omitHeaders,
  } = headers;

  if (!omitHeaders) {
    return headers;
  }

  const filteredHeaders = Object.assign({}, headers);

  omitHeaders
    .split(',')
    .map(s => s.trim())
    .forEach(x => delete filteredHeaders[x]);

  return filteredHeaders;
}


class Request {
  constructor({ method, headers, query, body }) {
    this.method = method;
    this.headers = filterHeaders(headers || {});
    this.query = query;
    this.body = body;
  }
}

module.exports = Request;
