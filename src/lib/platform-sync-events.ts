export const PLATFORM_SYNC_FAILED_EVENT = "uorpg-platform-sync-failed";
export const PLATFORM_SYNC_OK_EVENT = "uorpg-platform-sync-ok";

export function dispatchPlatformSyncFailed(message: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(PLATFORM_SYNC_FAILED_EVENT, { detail: message })
  );
}

export function dispatchPlatformSyncOk(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PLATFORM_SYNC_OK_EVENT));
}
