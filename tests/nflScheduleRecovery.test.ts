import { expect, test } from 'bun:test';
import { recoverSchedule } from '../supabase/functions/nfl-schedule/recovery';

const snapshot = { events: [{ id: 'snapshot-game' }], asOf: '2026-10-17', source: 'ESPN' };
test('ESPN network failure returns the dated schedule backup instead of throwing', async () => {
  const result = await recoverSchedule(async () => { throw new Error('network failure'); }, snapshot);
  expect(result.events).toEqual(snapshot.events);
  expect(result.asOf).toBe('2026-10-17');
  expect(result.fallback).toBe(true);
});
test('empty ESPN response uses the last valid cache', async () => {
  const result = await recoverSchedule(async () => ({ events: [] }), snapshot, { events: [{ id: 'cached-game' }] });
  expect(result.events).toEqual([{ id: 'cached-game' }]);
  expect(result.fallback).toBe(true);
});
test('healthy ESPN response remains live', async () => {
  const result = await recoverSchedule(async () => ({ events: [{ id: 'live-game' }] }), snapshot);
  expect(result.events).toEqual([{ id: 'live-game' }]);
  expect(result.fallback).toBe(false);
});