import { bestLineup, healthyRoster, weeklyLineup, type SimPlayer, type ScheduleContext, emptySchedule } from './seasonSimulation';
import { byeWeekFor } from './byeWeeks';

export type FinderPlayer = SimPlayer & { value: number; salary: number; franchiseTag: boolean };
export type FinderTeam = { id: string; name: string; roster: FinderPlayer[] };
const total = (r: SimPlayer[]) => r.reduce((s, p) => s + p.ppg, 0);
export const tradeImbalance = (a: number, b: number) => a + b > 0 ? Math.abs(a - b) / ((a + b) / 2) * 100 : Infinity;
export const isIdealTrade = (a: number, b: number) => tradeImbalance(a, b) <= 2;
const positions = ['QB', 'RB', 'WR', 'TE'];
const required: Record<string, number> = { QB: 1, RB: 2, WR: 2, TE: 1 };

export function assessRoster(team: FinderTeam, league: FinderTeam[], startWeek: number) {
  const available = (r: FinderPlayer[]) => r.filter(p => !p.out).sort((a, b) => b.ppg - a.ppg);
  const stats = positions.map(position => {
    const players = available(team.roster).filter(p => p.position === position);
    const n = required[position];
    const strength = total(players.slice(0, n)) / n;
    const leagueStrength = league.map(t => total(available(t.roster).filter(p => p.position === position).slice(0, n)) / n);
    const average = leagueStrength.reduce((s, v) => s + v, 0) / Math.max(1, leagueStrength.length);
    const starters = bestLineup(available(team.roster));
    const starterIds = new Set(starters.map(p => p.id));
    const backups = players.filter(p => !starterIds.has(p.id));
    return { position, strength, relative: average > 0 ? strength / average : 0, depth: total(backups), backups: backups.length, players };
  });
  const byStrength = [...stats].sort((a, b) => a.relative - b.relative);
  const byDepth = [...stats].sort((a, b) => a.depth - b.depth || a.backups - b.backups);
  const healthy = healthyRoster(team.roster);
  const full = total(bestLineup(healthy));
  const byes = Array.from({ length: Math.max(0, 15 - startWeek) }, (_, i) => {
    const week = startWeek + i;
    const onBye = team.roster.filter(p => byeWeekFor(p.nflTeam) === week);
    const starterIds = new Set(bestLineup(healthy).map(p => p.id));
    const loss = full - total(bestLineup(healthy, new Set(onBye.map(p => p.id))));
    return { week, players: onBye, starters: onBye.filter(p => starterIds.has(p.id)), loss };
  }).filter(b => b.players.length > 0);
  return { stats, weakest: byStrength[0], strongest: byStrength[byStrength.length - 1], leastDepth: byDepth[0], mostDepth: byDepth[byDepth.length - 1], byes };
}

export function rosterUtility(roster: FinderPlayer[], startWeek: number, schedule: ScheduleContext = emptySchedule) {
  const weeks = Array.from({ length: Math.max(1, 18 - startWeek) }, (_, i) => Math.min(17, startWeek + i));
  const ros = weeks.reduce((s, w) => s + total(weeklyLineup(roster, w, startWeek, schedule)), 0) / weeks.length;
  const healthy = healthyRoster(roster);
  const starters = bestLineup(healthy);
  const depth = starters.length ? starters.reduce((s, p) => s + total(bestLineup(healthy, new Set([p.id]))), 0) / starters.length : 0;
  return { ros, depth, utility: ros + depth * 0.25, salary: roster.reduce((s, p) => s + p.salary, 0) };
}
export type TradeSuggestion = {
  partner: FinderTeam; send: FinderPlayer[]; receive: FinderPlayer[]; imbalance: number;
  valueSent: number; valueReceived: number; gain: number; partnerGain: number;
  rosGain: number; partnerRosGain: number; depthGain: number; partnerDepthGain: number;
  salaryChange: number; partnerSalaryChange: number;
};
const packages = (roster: FinderPlayer[]) => {
  // Equal-size exchanges avoid forced roster cuts; unpaired franchise tags are never proposed.
  const pool = roster.filter(p => !p.franchiseTag && p.value > 0);
  return [...pool.map(p => [p]), ...pool.flatMap((p, i) => pool.slice(i + 1).map(q => [p, q]))];
};
export function findTrades(team: FinderTeam, league: FinderTeam[], startWeek: number, schedule: ScheduleContext = emptySchedule): TradeSuggestion[] {
  const own = packages(team.roster);
  const before = rosterUtility(team.roster, startWeek, schedule);
  const results: TradeSuggestion[] = [];
  for (const partner of league.filter(t => t.id !== team.id && t.roster.length)) {
    const partnerBefore = rosterUtility(partner.roster, startWeek, schedule);
    const partnerPackages = packages(partner.roster);
    const candidates = own.flatMap(send => {
      const valueSent = send.reduce((s, p) => s + p.value, 0);
      return partnerPackages.filter(receive => receive.length === send.length).flatMap(receive => {
        const valueReceived = receive.reduce((s, p) => s + p.value, 0);
        const imbalance = tradeImbalance(valueSent, valueReceived);
        const sentPos = send.map(p => p.position).sort().join(',');
        const receivedPos = receive.map(p => p.position).sort().join(',');
        return imbalance <= 10 && sentPos !== receivedPos ? [{ send, receive, valueSent, valueReceived, imbalance }] : [];
      });
    }).sort((a, b) => a.imbalance - b.imbalance).slice(0, 450);
    for (const c of candidates) {
      const sendIds = new Set(c.send.map(p => p.id));
      const receiveIds = new Set(c.receive.map(p => p.id));
      const after = rosterUtility([...team.roster.filter(p => !sendIds.has(p.id)), ...c.receive], startWeek, schedule);
      const partnerAfter = rosterUtility([...partner.roster.filter(p => !receiveIds.has(p.id)), ...c.send], startWeek, schedule);
      const gain = after.utility - before.utility;
      const partnerGain = partnerAfter.utility - partnerBefore.utility;
      // Neither side can lose scheduled scoring; improvements may be scoring, injury cover, or both.
      if (gain <= 0.1 || partnerGain <= 0.1 || after.ros < before.ros - 0.01 || partnerAfter.ros < partnerBefore.ros - 0.01) continue;
      results.push({ ...c, partner, gain, partnerGain, rosGain: after.ros - before.ros, partnerRosGain: partnerAfter.ros - partnerBefore.ros, depthGain: after.depth - before.depth, partnerDepthGain: partnerAfter.depth - partnerBefore.depth, salaryChange: after.salary - before.salary, partnerSalaryChange: partnerAfter.salary - partnerBefore.salary });
    }
  }
  results.sort((a, b) => Number(b.imbalance <= 2) - Number(a.imbalance <= 2) || Math.min(b.gain, b.partnerGain) - Math.min(a.gain, a.partnerGain) || a.imbalance - b.imbalance);
  const chosen: TradeSuggestion[] = [];
  const perPartner = new Map<string, number>();
  for (const r of results) {
    if ((perPartner.get(r.partner.id) ?? 0) >= 2) continue;
    if (chosen.some(c => c.partner.id === r.partner.id && c.send.some(p => r.send.some(q => p.id === q.id)) && c.receive.some(p => r.receive.some(q => p.id === q.id)))) continue;
    chosen.push(r); perPartner.set(r.partner.id, (perPartner.get(r.partner.id) ?? 0) + 1);
    if (chosen.length === 5) break;
  }
  return chosen;
}