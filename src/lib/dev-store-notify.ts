/** Cross-module listener bus — subscriptions survive hot reload of individual stores. */

const channels = new Map<string, Set<() => void>>();

export function subscribeDevStore(channel: string, listener: () => void): () => void {
  let set = channels.get(channel);
  if (!set) {
    set = new Set();
    channels.set(channel, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
  };
}

export function notifyDevStore(channel: string): void {
  channels.get(channel)?.forEach((listener) => listener());
}

export function pingDevStoreAfterHotReload(channel: string): void {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return;
  queueMicrotask(() => notifyDevStore(channel));
}
