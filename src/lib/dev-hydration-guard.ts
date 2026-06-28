/** Dev-only: skip repeating full hydration when hot reload remounts the hydrator. */

let devHydrationCompleted = false;

export function shouldSkipDevRehydration(): boolean {
  return process.env.NODE_ENV === "development" && devHydrationCompleted;
}

export function markDevHydrationCompleted(): void {
  if (process.env.NODE_ENV === "development") {
    devHydrationCompleted = true;
  }
}
