import { GOVERNORS, SEASONS, HEARTBREAK, type SeasonHistory, type Governor } from '@/data/leagueHistory';
import { WEEKLY_SCORES } from '@/data/historyWeeklyScores';

export type PlayoffResult = 'Champion' | 'Runner-Up' | 'Semifinalist' | 'Purgatory' | 'Missed' | 'In Progress';
export type WeeklyMap = Record<number, Record<string, number[]>>;

export interface SeasonRow {
  year: number;
  gov: string;
  name: string;
  team: string;
  rank: number;
  fieldSize: number;
  inProgress: boolean;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  ap: number | null;
  pf: number;
  ppw: number;
  weeks: number[];
  highWeek: number | null;
  lowWeek: number | null;
  stdDev: number | null;
  seed: number | null;
  result: PlayoffResult;
  semi: number | null;
  final: number | null;
  heartbreak: number | null;
}

export interface CareerRow {
  slug: string;
  name: string;
  short: string;
  currentTeam?: string;
  active: boolean;
  seasons: number;
  firstYear: number;
  lastYear: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  ap: number;
  apPerSeason: number;
  pf: number;
  pfPerSeason: number;
  ppw: number;
  avgRank: number;
  bestRank: number;
  worstRank: number;
  playoffs: number;
  playoffPct: number;
  titles: number;
  finals: number;
  playoffWins: number;
  playoffLosses: number;
  playoffWinPct: number;
  highWeek: number | null;
  lowWeek: number | null;
  titleYears: number[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const govBySlug = new Map(GOVERNORS.map((g) => [g.slug, g]));
export const governor = (slug: string): Governor | undefined => govBySlug.get(slug);

function stdDev(xs: number[]): number | null {
  if (xs.length < 2) return null;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
}

/** Playoff teams take ranks 1..n by seed; everyone else follows by standings points, then wins, then PF. */
export function seasonRows(season: SeasonHistory, weekly: WeeklyMap = WEEKLY_SCORES): SeasonRow[] {
  const seeds = new Map(season.playoffs.map((p) => [p.gov, p]));
  const champion = season.playoffs.filter((p) => p.finalist).sort((a, b) => (b.final ?? 0) - (a.final ?? 0))[0]?.gov;
  const others = season.entries
    .filter((x) => !seeds.has(x.gov))
    .sort((a, b) => (b.ap ?? -1) - (a.ap ?? -1) || b.wins - a.wins || b.pf - a.pf);
  const ordered = [
    ...[...season.playoffs].sort((a, b) => a.seed - b.seed).map((p) => season.entries.find((x) => x.gov === p.gov)!),
    ...others,
  ];
  return ordered.map((x, i) => {
    const p = seeds.get(x.gov);
    const ties = x.ties ?? Math.max(0, season.weeks - x.wins - x.losses);
    const weeks = (weekly[season.year]?.[x.gov] ?? []).filter((n) => typeof n === 'number');
    let result: PlayoffResult = 'Missed';
    if (season.inProgress) result = 'In Progress';
    else if (p) {
      if (p.finalist) result = x.gov === champion ? 'Champion' : 'Runner-Up';
      else result = p.seed === 5 ? 'Purgatory' : 'Semifinalist';
    }
    const g = govBySlug.get(x.gov);
    return {
      year: season.year,
      gov: x.gov,
      name: g?.name ?? x.gov,
      team: x.team,
      rank: i + 1,
      fieldSize: season.entries.length,
      inProgress: Boolean(season.inProgress),
      wins: x.wins,
      losses: x.losses,
      ties,
      winPct: (x.wins + ties / 2) / Math.max(1, x.wins + x.losses + ties),
      ap: x.ap,
      pf: x.pf,
      ppw: round1(x.pf / Math.max(1, x.wins + x.losses + ties)),
      weeks,
      highWeek: weeks.length ? Math.max(...weeks) : null,
      lowWeek: weeks.length ? Math.min(...weeks) : null,
      stdDev: stdDev(weeks),
      seed: p?.seed ?? null,
      result,
      semi: p?.semi ?? null,
      final: p?.final ?? null,
      heartbreak: HEARTBREAK[season.year]?.[x.gov] ?? null,
    };
  });
}

export function careerRow(slug: string, rows: SeasonRow[]): CareerRow | null {
  const g = govBySlug.get(slug);
  const mine = rows.filter((r) => r.gov === slug);
  if (!g || !mine.length) return null;
  const sum = (f: (r: SeasonRow) => number) => mine.reduce((a, r) => a + f(r), 0);
  const games = sum((r) => r.wins + r.losses + r.ties);
  const knownAp = mine.filter((r) => r.ap !== null);
  const weeks = mine.flatMap((r) => r.weeks);
  const done = mine.filter((r) => !r.inProgress);
  const playoffRows = done.filter((r) => r.seed !== null);
  // Advancing from Weeks 14–15 is a win; elimination there is a loss; the final is one more W or L.
  let pw = 0, pl = 0;
  for (const r of playoffRows) {
    if (r.result === 'Champion') pw += 2;
    else if (r.result === 'Runner-Up') { pw += 1; pl += 1; }
    else pl += 1;
  }
  const wins = sum((r) => r.wins), losses = sum((r) => r.losses), ties = sum((r) => r.ties);
  return {
    slug,
    name: g.name,
    short: g.short,
    currentTeam: g.currentTeam,
    active: Boolean(g.currentTeam),
    seasons: mine.length,
    firstYear: Math.min(...mine.map((r) => r.year)),
    lastYear: Math.max(...mine.map((r) => r.year)),
    wins, losses, ties,
    winPct: games ? (wins + ties / 2) / games : 0,
    ap: knownAp.reduce((a, r) => a + (r.ap ?? 0), 0),
    apPerSeason: knownAp.length ? round1(knownAp.reduce((a, r) => a + (r.ap ?? 0), 0) / knownAp.length) : 0,
    pf: round1(sum((r) => r.pf)),
    pfPerSeason: round1(sum((r) => r.pf) / mine.length),
    ppw: games ? round1(sum((r) => r.pf) / games) : 0,
    avgRank: done.length ? round1(done.reduce((a, r) => a + r.rank, 0) / done.length) : 0,
    bestRank: done.length ? Math.min(...done.map((r) => r.rank)) : 0,
    worstRank: done.length ? Math.max(...done.map((r) => r.rank)) : 0,
    playoffs: playoffRows.length,
    playoffPct: done.length ? playoffRows.length / done.length : 0,
    titles: mine.filter((r) => r.result === 'Champion').length,
    finals: mine.filter((r) => r.result === 'Champion' || r.result === 'Runner-Up').length,
    playoffWins: pw,
    playoffLosses: pl,
    playoffWinPct: pw + pl ? pw / (pw + pl) : 0,
    highWeek: weeks.length ? Math.max(...weeks) : null,
    lowWeek: weeks.length ? Math.min(...weeks) : null,
    titleYears: mine.filter((r) => r.result === 'Champion').map((r) => r.year),
  };
}

export interface ChampionRow { year: number; champion: string; runnerUp: string; champScore: number; runnerScore: number; champTeam: string }
export interface WeekScore { year: number; week: number; gov: string; score: number }
export interface HeadToHead { opponent: string; wins: number; losses: number; ties: number }

export interface LeagueHistory {
  seasons: SeasonHistory[];
  rows: SeasonRow[];
  careers: CareerRow[];
  champions: ChampionRow[];
  weeks: WeekScore[];
  years: number[];
  weekly: WeeklyMap;
  liveYear: number | null;
  liveWeeks: number;
}

export function buildHistory(extraSeasons: SeasonHistory[] = [], extraWeekly: WeeklyMap = {}): LeagueHistory {
  const seasons = [...SEASONS, ...extraSeasons].sort((a, b) => a.year - b.year);
  const weekly: WeeklyMap = { ...WEEKLY_SCORES, ...extraWeekly };
  const rows = seasons.flatMap((s) => seasonRows(s, weekly));
  const careers = GOVERNORS.map((g) => careerRow(g.slug, rows)).filter((c): c is CareerRow => c !== null);
  const champions = seasons.filter((s) => !s.inProgress).map((s) => {
    const sr = rows.filter((r) => r.year === s.year);
    const c = sr.find((r) => r.result === 'Champion')!;
    const ru = sr.find((r) => r.result === 'Runner-Up')!;
    return { year: s.year, champion: c.gov, runnerUp: ru.gov, champScore: c.final ?? 0, runnerScore: ru.final ?? 0, champTeam: c.team };
  });
  const weeks = Object.entries(weekly).flatMap(([y, byGov]) =>
    Object.entries(byGov).flatMap(([gov, scores]) => scores.flatMap((score, i) => (typeof score === 'number' ? [{ year: Number(y), week: i + 1, gov, score }] : []))),
  );
  const live = seasons.find((s) => s.inProgress);
  return { seasons, rows, careers, champions, weeks, years: seasons.map((s) => s.year), weekly, liveYear: live?.year ?? null, liveWeeks: live?.weeks ?? 0 };
}

/** Same-week scoring comparison (who outscored whom) across seasons with weekly data. */
export function weeklyHeadToHead(slug: string, weekly: WeeklyMap): HeadToHead[] {
  const out = new Map<string, HeadToHead>();
  for (const byGov of Object.values(weekly)) {
    const mine = byGov[slug];
    if (!mine) continue;
    for (const [opp, theirs] of Object.entries(byGov)) {
      if (opp === slug) continue;
      const h = out.get(opp) ?? { opponent: opp, wins: 0, losses: 0, ties: 0 };
      mine.forEach((s, i) => {
        if (typeof s !== 'number' || typeof theirs[i] !== 'number') return;
        if (s > theirs[i]) h.wins++; else if (s < theirs[i]) h.losses++; else h.ties++;
      });
      out.set(opp, h);
    }
  }
  return [...out.values()];
}

export const STATIC_HISTORY = buildHistory();

export const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
