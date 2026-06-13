const ONLINE_WINDOW_MS = 5 * 60 * 1000;

const lastSeen = new Map<number, number>();

export function touchPresence(userId: number): void {
  lastSeen.set(userId, Date.now());
}

export function onlineCount(): number {
  const cutoff = Date.now() - ONLINE_WINDOW_MS;
  let count = 0;
  for (const [userId, seenAt] of lastSeen) {
    if (seenAt >= cutoff) {
      count++;
    } else {
      lastSeen.delete(userId);
    }
  }
  return count;
}
