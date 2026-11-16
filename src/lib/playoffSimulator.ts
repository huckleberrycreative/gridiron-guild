import { byeWeekFor } from './byeWeeks';
import { INJURY_ONSET, matchupMultiplier, bestLineup, healthyRoster, type SimPlayer, type ScheduleContext } from './seasonSimulation';

export const PLAYOFF_WEEKS = [14, 15, 16, 17] as const;
export type PlayoffTeam = { id: string; name: string; roster: SimPlayer[] };
export type PlayerWeek = { id: string; name: string; position: string; points: number };
export type TeamWeek = { week: number; score: number; starters: PlayerWeek[]; byes: string[]; injured: string[] };
export type PlayoffEntry = {
  seed: number; team: PlayoffTeam; weeks: Record<number, TeamWeek>;
  semiScore: number; semiRule: 'best' | 'average' | 'lowest';
  advanced: boolean; finalScore: number | null; champion: boolean; summary: string;
};
export type PlayoffResult = { entries: PlayoffEntry[]; championId: string; runnerUpId: string };

export const semiRuleFor = (seed: number): PlayoffEntry['semiRule'] => seed <= 2 ? 'best' : seed <= 4 ? 'average' : 'lowest';

export const rngFor = (key: string) => {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
};
const gaussian = (rnd: () => number) => Math.sqrt(-2 * Math.log(Math.max(1e-9, rnd()))) * Math.cos(2 * Math.PI * rnd());
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Simulate one team's Weeks 14-17: byes, current injuries, new injuries, matchups and boom/bust player scoring. */
export function simulateTeamWeeks(team: PlayoffTeam, schedule: ScheduleContext, rnd: () => number): Record<number, TeamWeek> {
  const roster = healthyRoster(team.roster);
  const injuredUntil = new Map<string, number>();
  for (const p of team.roster) if (p.out || ['out', 'ir'].includes(p.injuryStatus ?? '')) injuredUntil.set(p.id, 14 + Math.max(1, p.weeksOut ?? 1));
  const form = gaussian(rnd) * 0.05; // team-wide hot/cold streak for the playoff run
  const out: Record<number, TeamWeek> = {};
  for (const week of PLAYOFF_WEEKS) {
    const byes = roster.filter(p => byeWeekFor(p.nflTeam) === week);
    const injured = roster.filter(p => (injuredUntil.get(p.id) ?? 0) > week);
    const excluded = new Set([...byes, ...injured].map(p => p.id));
    const lineup = bestLineup(roster.map(p => ({ ...p, ppg: p.ppg * matchupMultiplier(p, week, schedule) })), excluded);
    const starters = lineup.map(p => {
      let points = Math.max(0, p.ppg * (1 + form) * Math.exp(gaussian(rnd) * 0.42 - 0.088));
      if (rnd() < (INJURY_ONSET[p.position] ?? 0.035)) { // in-game injury: partial score, then out 1-3 weeks
        points *= rnd() * 0.5;
        injuredUntil.set(p.id, week + 1 + Math.floor(rnd() * 3));
      }
      return { id: p.id, name: p.name, position: p.position, points: r1(points) };
    });
    out[week] = { week, score: r1(starters.reduce((s, p) => s + p.points, 0)), starters, byes: byes.map(p => p.name), injured: injured.map(p => p.name) };
  }
  return out;
}

const fmt = (n: number) => n.toFixed(1);
const topOf = (w: TeamWeek) => [...w.starters].sort((a, b) => b.points - a.points)[0];
const dudOf = (w: TeamWeek) => [...w.starters].sort((a, b) => (a.points / 1) - (b.points / 1))[0];

function summarize(e: PlayoffEntry, all: PlayoffEntry[], champ: PlayoffEntry, runnerUp: PlayoffEntry): string {
  const w14 = e.weeks[14], w15 = e.weeks[15], w16 = e.weeks[16], w17 = e.weeks[17];
  const name = e.team.name;
  const best = w14.score >= w15.score ? w14 : w15;
  const star = topOf(best);
  const rule = e.semiRule === 'best' ? `got to keep the better of ${fmt(w14.score)} and ${fmt(w15.score)}` : e.semiRule === 'average' ? `had to average ${fmt(w14.score)} and ${fmt(w15.score)}` : `was stuck with the worse of ${fmt(w14.score)} and ${fmt(w15.score)}`;
  const missing = [...new Set([...w14.byes, ...w15.byes, ...w14.injured, ...w15.injured])];
  const missLine = missing.length ? ` Playing without ${missing.slice(0, 2).join(' and ')} for part of the round didn't help.` : '';
  const cut = [...all].filter(x => x.advanced).sort((a, b) => a.semiScore - b.semiScore)[0];
  let s = `As the ${e.seed} seed, ${name} ${rule} for a ${fmt(e.semiScore)} semifinal score, led by ${star.name}'s ${fmt(star.points)} in Week ${best.week}.${missLine}`;
  if (!e.advanced) {
    const gap = cut.semiScore - e.semiScore;
    const dud = dudOf(w14.score <= w15.score ? w14 : w15);
    s += ` They missed the championship by ${fmt(gap)} points, and ${dud.name}'s ${fmt(dud.points)} in Week ${w14.score <= w15.score ? 14 : 15} is the number that will sting.`;
  } else {
    const opp = e === champ ? runnerUp : champ;
    const t16 = topOf(w16), t17 = topOf(w17);
    const margin = Math.abs((champ.finalScore ?? 0) - (runnerUp.finalScore ?? 0));
    s += e.champion
      ? ` In the title game they put up ${fmt(w16.score)} and ${fmt(w17.score)} to beat ${opp.team.name} by ${fmt(margin)}, with ${t16.name} (${fmt(t16.points)}) and ${t17.name} (${fmt(t17.points)}) carrying the two weeks.`
      : ` They reached the final but their ${fmt(w16.score)} and ${fmt(w17.score)} came up ${fmt(margin)} short of ${opp.team.name}, despite ${t16.points >= t17.points ? `${t16.name}'s ${fmt(t16.points)} in Week 16` : `${t17.name}'s ${fmt(t17.points)} in Week 17`}.`;
  }
  return s;
}

/** One Monte Carlo playoff run. Seeds 1-2 keep their best of Weeks 14/15, 3-4 average, 5 keeps the lowest; top two advance to a two-week (16+17) head-to-head final. */
export const toiletRuleFor = (seed: number): PlayoffEntry['semiRule'] => seed <= 7 ? 'best' : 'average';
const applyRule = (rule: PlayoffEntry['semiRule'], a: number, b: number) => rule === 'best' ? Math.max(a, b) : rule === 'average' ? (a + b) / 2 : Math.min(a, b);

export function simulatePlayoffs(seeded: PlayoffTeam[], schedule: ScheduleContext, seedKey: string, opts: { firstSeed?: number; ruleFor?: (seed: number) => PlayoffEntry['semiRule'] } = {}): PlayoffResult {
  const firstSeed = opts.firstSeed ?? 1, ruleFor = opts.ruleFor ?? semiRuleFor;
  const rnd = rngFor(seedKey);
  const entries: PlayoffEntry[] = seeded.map((team, i) => {
    const weeks = simulateTeamWeeks(team, schedule, rnd);
    const seed = firstSeed + i, rule = ruleFor(seed);
    return { seed, team, weeks, semiScore: r1(applyRule(rule, weeks[14].score, weeks[15].score)), semiRule: rule, advanced: false, finalScore: null, champion: false, summary: '' };
  });
  const finalists = [...entries].sort((a, b) => b.semiScore - a.semiScore || a.seed - b.seed).slice(0, 2);
  finalists.forEach(f => { f.advanced = true; f.finalScore = r1(f.weeks[16].score + f.weeks[17].score); });
  finalists.sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0) || a.seed - b.seed);
  const [champ, runnerUp] = finalists;
  champ.champion = true;
  entries.forEach(e => { e.summary = summarize(e, entries, champ, runnerUp); });
  return { entries, championId: champ.team.id, runnerUpId: runnerUp.team.id };
}
