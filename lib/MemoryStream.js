const { Writable } = require('stream');

class MemoryStream extends Writable {
  constructor(maxSize = -1) {
    super();
    this.buffer = [];
    this.size = 0;
    this.maxSize = maxSize;
    this.truncated = false;
  }

  _write(chunk, encoding, done) {
    if (this.truncated) {
      done();
      return;
    }

    let strChunk = chunk.toString();

    if (this.maxSize > 0 && (this.size + strChunk.length) >= this.maxSize) {
      strChunk = strChunk.slice(0, this.maxSize - this.size);
      this.truncated = true;
    }

    this.size += strChunk.length;
    this.buffer.push(strChunk);
    done();
  }
}

module.exports = MemoryStream;
