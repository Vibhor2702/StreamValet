class JobQueueService {
  constructor() {
    this.queue = [];
    this.running = false;
  }

  enqueue(fn) {
    this.queue.push(fn);
    this.runNext();
  }

  async runNext() {
    if (this.running) return;
    const job = this.queue.shift();
    if (!job) return;
    this.running = true;
    try {
      await job();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Job failed', err);
    } finally {
      this.running = false;
      if (this.queue.length) {
        setImmediate(() => this.runNext());
      }
    }
  }
}

module.exports = new JobQueueService();
