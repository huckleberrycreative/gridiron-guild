export type SchedulePayload = { events: unknown[]; source?: string; asOf?: string; fallback?: boolean };

export async function recoverSchedule(
  loadLive: () => Promise<SchedulePayload>,
  snapshot: SchedulePayload,
  cached?: SchedulePayload,
): Promise<SchedulePayload> {
  try {
    const live = await loadLive();
    if (!Array.isArray(live.events) || !live.events.length) throw new Error('Empty NFL schedule');
    return { ...live, fallback: false };
  } catch {
    // A public upstream outage is recoverable, not an application runtime error.
    if (cached?.events.length) return { ...cached, fallback: true };
    return { ...snapshot, fallback: true };
  }
}