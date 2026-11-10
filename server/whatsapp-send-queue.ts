const DEFAULT_MIN_GAP_MS = 3_000;

export class SerializedSendQueue {
  private tail: Promise<void> = Promise.resolve();
  private lastCompletedAt = 0;

  constructor(private readonly minimumGapMs = DEFAULT_MIN_GAP_MS) {}

  enqueue<T>(send: () => Promise<T>): Promise<T> {
    const result = this.tail.then(async () => {
      const waitMs = this.minimumGapMs - (Date.now() - this.lastCompletedAt);
      if (this.lastCompletedAt && waitMs > 0) {
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }

      try {
        return await send();
      } finally {
        this.lastCompletedAt = Date.now();
      }
    });

    this.tail = result.then(() => undefined, () => undefined);
    return result;
  }
}

const whatsappSendQueue = new SerializedSendQueue();

export function enqueueWhatsAppSend<T>(send: () => Promise<T>): Promise<T> {
  return whatsappSendQueue.enqueue(send);
}
