import { byeWeekFor } from './byeWeeks';

export type SimPlayer = {
  id: string; name: string; position: string; ppg: number; basePpg?: number;
  projected: boolean; injuryStatus?: string; weeksOut?: number; out?: boolean; nflTeam?: string | null;
};
export const STARTER_SLOTS = ['QB', 'RB', 'RB', 'WR', 'WR', 'FLEX', 'FLEX', 'FLEX', 'OP'];
export const bestLineup = (roster: SimPlayer[], excluded = new Set<string>()) => {
  const pool = roster.filter(p => !excluded.has(p.id)).sort((a, b) => b.ppg - a.ppg);
  const used = new Set<string>();
  return STARTER_SLOTS.flatMap(slot => {
    const p = pool.find(p => !used.has(p.id) && (slot === 'OP' || (slot === 'FLEX' ? ['RB', 'WR', 'TE'].includes(p.position) : slot === p.position)));
    if (!p) return [];
    used.add(p.id);
    return [p];
  });
};

export type ScheduleContext = {
  opponents: Record<string, Record<number, string>>;
  defense: Record<string, number>;
  completedGames: number;
};
export type SimTeam = { id: string; meanPpw: number; accumulated: number; roster?: SimPlayer[]; weeklySd?: number };
export type Odds = { top2: number; top4: number; top5: number; champ: number };
export const SIMS = 3000;
export const REG_SEASON_WEEKS = 13;
// Estimated NEW injury onsets per active week, not verified individual medical probabilities.
// Multi-week absences below make these different from a flat weekly inactive rate.
export const INJURY_ONSET: Record<string, number> = { QB: 0.025, RB: 0.05, WR: 0.035, TE: 0.035 };
export const emptySchedule: ScheduleContext = { opponents: {}, defense: {}, completedGames: 0 };
const sum = (list: SimPlayer[]) => list.reduce((s, p) => s + p.ppg, 0);
export const healthyRoster = (roster: SimPlayer[]) => roster.map(p => ({ ...p, ppg: p.basePpg ?? p.ppg }));
// Observed zeroes are real data, not a reason to substitute a preseason projection.
export const actualPlayerPpg = (actual: number | null | undefined, fallback: number) =>
  actual != null && Number.isFinite(actual) ? actual : fallback;
export const actualRosterForecast = (roster: SimPlayer[], id: string, accumulated: number): SimTeam => {
  const meanPpw = sum(bestLineup(healthyRoster(roster)));
  return { id, accumulated, roster, meanPpw, weeklySd: Math.max(24, meanPpw * 0.22) };
};
export const matchupMultiplier = (p: SimPlayer, week: number, schedule: ScheduleContext) => {
  const opponent = p.nflTeam ? schedule.opponents[p.nflTeam]?.[week] : undefined;
  return opponent ? schedule.defense[opponent] ?? 1 : 1;
};
export const weeklyLineup = (roster: SimPlayer[], week: number, startWeek: number, schedule = emptySchedule, excluded = new Set<string>()) => {
  const unavailable = new Set(excluded);
  for (const p of roster) {
    if (byeWeekFor(p.nflTeam) === week || ((p.out || ['out', 'ir'].includes(p.injuryStatus ?? '')) && week - startWeek < Math.max(1, p.weeksOut ?? 1))) unavailable.add(p.id);
  }
  return bestLineup(healthyRoster(roster).map(p => ({ ...p, ppg: p.ppg * matchupMultiplier(p, week, schedule) })), unavailable);
};
export const semifinalScore = (seed: number, a: number, b: number) => seed <= 2 ? Math.max(a, b) : seed <= 4 ? (a + b) / 2 : Math.min(a, b);
export const weeklyFinishPoints = (place: number) => [20, 18, 16, 14, 8, 4, 3, 2, 1, 0][place] ?? 0;

export function rosterRisks(roster: SimPlayer[], startWeek: number, schedule: ScheduleContext) {
  const healthy = healthyRoster(roster);
  const starters = bestLineup(healthy);
  const full = sum(starters);
  const losses = starters.map(p => ({ name: p.name, position: p.position, loss: Math.max(0, full - sum(bestLineup(healthy, new Set([p.id])))) }));
  const byes = Array.from({ length: Math.max(0, 14 - startWeek) }, (_, i) => {
    const week = startWeek + i;
    const exclusions = new Set(healthy.filter(p => byeWeekFor(p.nflTeam) === week).map(p => p.id));
    return { week, loss: Math.max(0, full - sum(bestLineup(healthy, exclusions))) };
  }).sort((a, b) => b.loss - a.loss);
  const playoff = [14, 15, 16, 17].map(week => {
    const neutral = sum(weeklyLineup(roster, week, startWeek));
    return sum(weeklyLineup(roster, week, startWeek, schedule)) - neutral;
  });
  return {
    largestLoss: losses.sort((a, b) => b.loss - a.loss)[0],
    injuryExposure: losses.reduce((v, p) => v + p.loss * (INJURY_ONSET[p.position] ?? 0.035) * 2, 0),
    worstBye: byes[0],
    week14Byes: starters.filter(p => byeWeekFor(p.nflTeam) === 14).map(p => p.name),
    playoffMatchupPpw: playoff.reduce((s, v) => s + v, 0) / 4,
  };
}

const rngFor = (key: string) => {
  let state = 2166136261;
  for (const c of key) state = Math.imul(state ^ c.charCodeAt(0), 16777619);
  return () => { state += 0x6D2B79F5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
};
const gaussian = (rnd: () => number) => Math.sqrt(-2 * Math.log(Math.max(1e-9, rnd()))) * Math.cos(2 * Math.PI * rnd());
// Student t with 5 degrees of freedom, scaled to unit variance: more genuine blowups/duds than a normal curve.
const heavyTail = (rnd: () => number) => {
  const z = gaussian(rnd);
  let chi = 0;
  for (let i = 0; i < 5; i++) chi += gaussian(rnd) ** 2;
  return z / Math.sqrt(Math.max(0.01, chi) / 3);
};
export const observedWeeklySd = (scores: number[]) => {
  if (scores.length < 2) return 24;
  const mean = scores.reduce((s, x) => s + x, 0) / scores.length;
  const variance = scores.reduce((s, x) => s + (x - mean) ** 2, 0) / (scores.length - 1);
  return Math.max(20, Math.min(38, Math.sqrt((variance * scores.length + 24 ** 2 * 8) / (scores.length + 8))));
};

export function simulateSeason(teams: SimTeam[], weeksPlayed: number, schedule = emptySchedule, simulations = SIMS): Record<string, Odds> {
  const counts = Object.fromEntries(teams.map(t => [t.id, { top2: 0, top4: 0, top5: 0, champ: 0 }]));
  if (teams.length < 2) return counts;
  const startWeek = Math.min(18, weeksPlayed + 1);
  // Cache full, persistent player-availability paths; each season samples one path per team.
  const paths = teams.map(t => Array.from({ length: 160 }, (_, path) => {
    const rnd = rngFor(`${t.id}:${path}`);
    const roster = t.roster ?? [];
    const until = new Map<string, number>();
    const healthyTotal = sum(bestLineup(healthyRoster(roster)));
    const calibration = roster.length ? Math.max(0.8, Math.min(1.2, t.meanPpw / Math.max(1, healthyTotal))) : 1;
    const talent = 1 + gaussian(rnd) * 0.07;
    const playoffForm = gaussian(rnd) * 9;
    return Array.from({ length: 18 }, (_, week) => {
      if (week < startWeek) return 0;
      const excluded = new Set<string>();
      for (const p of roster) {
        // Player-keyed draws keep unchanged players on the same injury path in before/after scenarios.
        const prng = rngFor(`${t.id}:${path}:${p.id}:${week}`);
        if ((until.get(p.id) ?? 0) > week) excluded.add(p.id);
        else if (byeWeekFor(p.nflTeam) !== week && prng() < (INJURY_ONSET[p.position] ?? 0.035)) {
          const duration = prng() < 0.65 ? 1 : prng() < 0.8 ? 2 : 4;
          until.set(p.id, week + duration); excluded.add(p.id);
        }
        if (p.injuryStatus === 'doubtful' && week === startWeek && prng() < 0.6) excluded.add(p.id);
      }
      const mean = roster.length ? sum(weeklyLineup(roster, week, startWeek, schedule, excluded)) * calibration : t.meanPpw;
      const noise = heavyTail(rnd) * (t.weeklySd ?? 24);
      return Math.max(0, mean * talent + noise + (week >= 14 ? playoffForm : 0));
    });
  }));
  const rnd = rngFor('league-season-2026');
  for (let sim = 0; sim < simulations; sim++) {
    const selected = paths.map(pool => pool[Math.floor(rnd() * pool.length)]);
    const totals = teams.map(t => t.accumulated);
    const pointsFor = teams.map(() => 0);
    for (let week = startWeek; week <= 13; week++) {
      selected.map((path, i) => ({ i, s: path[week] })).sort((a, b) => b.s - a.s).forEach((row, place) => {
        totals[row.i] += weeklyFinishPoints(place); pointsFor[row.i] += row.s;
      });
    }
    const order = teams.map((_, i) => i).sort((a, b) => totals[b] - totals[a] || pointsFor[b] - pointsFor[a]);
    order.forEach((i, seed) => { if (seed < 2) counts[teams[i].id].top2++; if (seed < 4) counts[teams[i].id].top4++; if (seed < 5) counts[teams[i].id].top5++; });
    const finalists = order.slice(0, 5).map((i, seed) => ({ i, s: semifinalScore(seed + 1, selected[i][14], selected[i][15]) })).sort((a, b) => b.s - a.s).slice(0, 2);
    finalists.sort((a, b) => selected[b.i][16] + selected[b.i][17] - selected[a.i][16] - selected[a.i][17]);
    const winner = finalists[0];
    if (winner) counts[teams[winner.i].id].champ++;
  }
  return Object.fromEntries(Object.entries(counts).map(([id, c]) => [id, Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v / simulations * 100])) as Odds]));
}