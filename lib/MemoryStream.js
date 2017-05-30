const { Writable } = require('stream');

class MemoryStream extends Writable {
  constructor() {
    super();
    this.buffer = [];
  }

  _write(chunk, encoding, done) {
    this.buffer.push(chunk.toString());
    done();
  }
}

module.exports = MemoryStream;
