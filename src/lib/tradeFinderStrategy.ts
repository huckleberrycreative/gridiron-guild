import { actualRosterForecast, simulateSeason, emptySchedule, type ScheduleContext } from './seasonSimulation';
import { matchesUpgradeTarget, rosterUtility, tradeImbalance, tradeValueUpgrade, type FinderPlayer, type FinderTeam, type TradeSuggestion } from './tradeFinder';

export type TradeStrategy = 'win-now' | 'rebuild' | 'balanced';
export type StrategyPlayer = FinderPlayer & { age?: number | null; futurePpg?: number; avgCost?: number };
export type StrategyTeam = FinderTeam & { accumulated?: number; roster: StrategyPlayer[] };
export type StrategicTrade = TradeSuggestion & {
  currentOddsGain: number; futureOddsGain: number; partnerCurrentOddsGain: number; partnerFutureOddsGain: number;
  ageGain: number; partnerAgeGain: number; futureSalarySaving: number; partnerFutureSalarySaving: number;
  partnerStrategy: TradeStrategy; strategyScore: number;
};
export const futurePlayer = (p: StrategyPlayer): StrategyPlayer => {
  const prime: Record<string, number> = { QB: 32, RB: 26, WR: 29, TE: 30 };
  const age = p.age == null ? null : p.age + 1;
  const decline = age == null ? 0 : Math.max(0, age - (prime[p.position] ?? 29)) * (p.position === 'RB' ? 0.07 : 0.04);
  const growth = age != null && age <= 24 ? 1.04 : 1;
  const ppg = (p.futurePpg ?? p.basePpg ?? p.ppg) * Math.max(0.55, growth - decline);
  return { ...p, ppg, basePpg: ppg, out: false, injuryStatus: 'healthy', weeksOut: 0, nflTeam: null, practiceSquad: false };
};
export const futureRoster = (r: StrategyPlayer[]) => r.map(futurePlayer);
const ageAverage = (r: StrategyPlayer[]) => {
  const known = r.filter(p => p.age != null);
  return known.length ? known.reduce((v, p) => v + (p.age ?? 0), 0) / known.length : null;
};
export const futureEfficiency = (before: StrategyPlayer[], after: StrategyPlayer[]) => {
  const beforeAge = ageAverage(before), afterAge = ageAverage(after);
  return {
    ageGain: beforeAge != null && afterAge != null ? beforeAge - afterAge : 0,
    salarySaving: before.reduce((v,p) => v + (p.avgCost ?? p.salary), 0) - after.reduce((v,p) => v + (p.avgCost ?? p.salary), 0),
  };
};
// Win Now never reads the salary/age objectives; Rebuild never reads this year's odds.
export const strategyScore = (strategy: TradeStrategy, nowGain: number, nextGain: number, ageGain: number, salarySaving: number) => {
  const future = nextGain + ageGain * 0.5 + salarySaving / 100;
  if (strategy === 'win-now') return nowGain;
  if (strategy === 'rebuild') return nextGain > 0 ? future : -Infinity;
  return nowGain >= 0 && nextGain >= 0 ? (nowGain + future) / 2 : -Infinity;
};
const exchange = (team: StrategyTeam, outgoing: StrategyPlayer[], incoming: StrategyPlayer[]): StrategyTeam => {
  const ids = new Set(outgoing.map(p => p.id));
  return { ...team, roster: [...team.roster.filter(p => !ids.has(p.id)), ...incoming.map(p => ({ ...p, practiceSquad: false }))] };
};
const packages = (r: StrategyPlayer[]) => {
  const pool = r.filter(p => !p.franchiseTag && p.value > 0);
  return [...pool.map(p => [p]), ...pool.flatMap((p,i) => pool.slice(i+1).map(q => [p,q]))];
};
const odds = (league: StrategyTeam[], startWeek: number, schedule: ScheduleContext, future: boolean) =>
  simulateSeason(league.map(t => actualRosterForecast(
    future ? futureRoster(t.roster) : t.roster.filter(p => !p.practiceSquad), t.id, future ? 0 : t.accumulated ?? 0,
  )), future ? 0 : startWeek - 1, future ? emptySchedule : schedule, 3000);

export function findStrategicTrades(team: StrategyTeam, league: StrategyTeam[], startWeek: number, schedule: ScheduleContext, target: number, ids: ReadonlySet<string>, strategy: TradeStrategy): StrategicTrade[] {
  const own = packages(team.roster.filter(p => ids.has(p.id)));
  if (!own.length) return [];
  const before = rosterUtility(team.roster, startWeek, schedule);
  const futureBefore = rosterUtility(futureRoster(team.roster), 1);
  const candidates: (TradeSuggestion & { after: StrategyTeam; partnerAfter: StrategyTeam; proxy: number })[] = [];
  for (const partner of league.filter(t => t.id !== team.id)) {
    const partnerBefore = rosterUtility(partner.roster, startWeek, schedule);
    const partnerFutureBefore = rosterUtility(futureRoster(partner.roster), 1);
    const partnerPackages = packages(partner.roster);
    for (const send of own) for (const receive of partnerPackages) {
      if (send.length !== receive.length) continue;
      const valueSent = send.reduce((v,p) => v+p.value,0), valueReceived = receive.reduce((v,p) => v+p.value,0);
      if (!matchesUpgradeTarget(valueSent, valueReceived, target)) continue;
      const afterTeam = exchange(team, send, receive), afterPartner = exchange(partner, receive, send);
      const after = rosterUtility(afterTeam.roster, startWeek, schedule), partnerAfter = rosterUtility(afterPartner.roster, startWeek, schedule);
      const futureAfter = rosterUtility(futureRoster(afterTeam.roster), 1), partnerFutureAfter = rosterUtility(futureRoster(afterPartner.roster), 1);
      const now = after.utility - before.utility, next = futureAfter.utility - futureBefore.utility;
      const partnerNow = partnerAfter.utility - partnerBefore.utility, partnerNext = partnerFutureAfter.utility - partnerFutureBefore.utility;
      const efficiency = futureEfficiency(team.roster, afterTeam.roster);
      const proxy = strategy === 'win-now' ? now : strategy === 'rebuild' ? next + efficiency.ageGain * 0.5 + efficiency.salarySaving / 100 : (now + next + efficiency.ageGain * 0.5 + efficiency.salarySaving / 100) / 2;
      // Shortlist by the selected horizon, allowing partners to benefit on the opposite horizon.
      if (proxy <= 0.01 || (strategy === 'rebuild' && next <= 0) || (strategy === 'balanced' && (now < 0 || next < 0)) || Math.max(partnerNow, partnerNext) <= 0.01) continue;
      candidates.push({ partner, send, receive, valueSent, valueReceived, valueUpgrade: tradeValueUpgrade(valueSent,valueReceived), imbalance: tradeImbalance(valueSent,valueReceived), gain: now, partnerGain: partnerNow, rosGain: after.ros-before.ros, partnerRosGain: partnerAfter.ros-partnerBefore.ros, depthGain: after.depth-before.depth, partnerDepthGain: partnerAfter.depth-partnerBefore.depth, salaryChange: after.salary-before.salary, partnerSalaryChange: partnerAfter.salary-partnerBefore.salary, after: afterTeam, partnerAfter: afterPartner, proxy });
    }
  }
  candidates.sort((a,b) => b.proxy-a.proxy);
  // Expensive, paired season simulations run only on a diverse shortlist, off the UI thread.
  const shortlist = candidates.filter((c,i) => candidates.slice(0,i).filter(p => p.partner.id === c.partner.id).length < 3).slice(0,18);
  if (!shortlist.length) return [];
  const currentBase = odds(league,startWeek,schedule,false), futureBase = odds(league,startWeek,schedule,true);
  const results: StrategicTrade[] = [];
  for (const c of shortlist) {
    const changed = league.map(t => t.id === team.id ? c.after : t.id === c.partner.id ? c.partnerAfter : t);
    const current = odds(changed,startWeek,schedule,false), future = odds(changed,startWeek,schedule,true);
    const currentOddsGain = (current[team.id]?.champ ?? 0) - (currentBase[team.id]?.champ ?? 0);
    const futureOddsGain = (future[team.id]?.champ ?? 0) - (futureBase[team.id]?.champ ?? 0);
    const partnerCurrentOddsGain = (current[c.partner.id]?.champ ?? 0) - (currentBase[c.partner.id]?.champ ?? 0);
    const partnerFutureOddsGain = (future[c.partner.id]?.champ ?? 0) - (futureBase[c.partner.id]?.champ ?? 0);
    const ownEfficiency = futureEfficiency(team.roster,c.after.roster);
    const partnerEfficiency = futureEfficiency(c.partner.roster,c.partnerAfter.roster);
    const ownScore = strategyScore(strategy,currentOddsGain,futureOddsGain,ownEfficiency.ageGain,ownEfficiency.salarySaving);
    const partnerOptions = (['win-now','rebuild','balanced'] as TradeStrategy[]).map(mode => ({ mode, score: strategyScore(mode,partnerCurrentOddsGain,partnerFutureOddsGain,partnerEfficiency.ageGain,partnerEfficiency.salarySaving) })).sort((a,b) => b.score-a.score);
    const partnerBest = partnerOptions[0];
    if (ownScore <= 0.1 || !partnerBest || partnerBest.score <= 0.1) continue;
    results.push({ ...c, currentOddsGain, futureOddsGain, partnerCurrentOddsGain, partnerFutureOddsGain, ageGain: ownEfficiency.ageGain, partnerAgeGain: partnerEfficiency.ageGain, futureSalarySaving: ownEfficiency.salarySaving, partnerFutureSalarySaving: partnerEfficiency.salarySaving, partnerStrategy: partnerBest.mode, strategyScore: ownScore });
  }
  results.sort((a,b) => b.strategyScore-a.strategyScore);
  const selected: StrategicTrade[] = [];
  for (const r of results) {
    if (selected.filter(t => t.partner.id === r.partner.id).length >= 2) continue;
    if (selected.some(t => t.partner.id === r.partner.id && t.send.some(p => r.send.some(q => q.id === p.id)) && t.receive.some(p => r.receive.some(q => q.id === p.id)))) continue;
    selected.push(r);
    if (selected.length === 5) break;
  }
  return selected;
}