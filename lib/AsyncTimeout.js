class AsyncTimeout {
  constructor(timeout) {
    this.timeout = timeout;
    this.timeouts = [];
  }

  add(fn) {
    const timeoutID = setTimeout(fn, this.timeout);

    this.timeouts.push(timeoutID);

    return this;
  }

  clear() {
    for (const timeoutID of this.timeouts) {
      clearTimeout(timeoutID);
    }
    this.timeouts = [];
    return this;
  }
}

module.exports = AsyncTimeout;
