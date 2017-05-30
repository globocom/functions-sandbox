const { Console } = require('console');
const { Writable } = require('stream');

class PrefixStream extends Writable {
  constructor(prefix, buf) {
    super();
    this.prefix = prefix;
    this.buf = buf;
  }

  _write(chunk, encoding, done) {
    const chunks = chunk.toString().split('\n').filter(x => x.length > 0);
    for (const line of chunks) {
      this.buf.write(`${this.prefix} ${line}\n`);
    }
    done();
  }
}


class PrefixLog extends Console {
  constructor(name, stdout = null, stderr = null) {
    const infoLabel = name ? `info: [${name}]` : 'info:';
    const errorLabel = name ? `error: [${name}]` : 'error:';

    super(
      new PrefixStream(infoLabel, stdout || process.stdout),
      new PrefixStream(errorLabel, stderr || process.stderr)
    );
  }
}

module.exports = PrefixLog;
