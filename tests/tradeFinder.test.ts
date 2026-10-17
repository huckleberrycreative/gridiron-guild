import { describe, test, expect } from 'bun:test';
import { assessRoster, findTrades, isIdealTrade, tradeImbalance, tradeValueUpgrade, matchesUpgradeTarget, rosterUtility, type FinderPlayer, type FinderTeam } from '../src/lib/tradeFinder';
const p = (id: string, position: string, ppg: number, value = 50): FinderPlayer => ({ id, name: id, position, ppg, value, salary: 1, franchiseTag: false, projected: false });
const base = (prefix: string) => [p(prefix+'qb','QB',20), p(prefix+'rb1','RB',15), p(prefix+'rb2','RB',14), ...Array.from({length:6},(_,i)=>p(prefix+'wr'+i,'WR',12-i))];
describe('Trade Finder', () => {
  test('zero TEs is legal and never creates a standalone position or depth weakness', () => {
    const a: FinderTeam = {id:'a', name:'A', roster:base('a')};
    const b: FinderTeam = {id:'b', name:'B', roster:[...base('b'),p('eliteTE','TE',30)]};
    const report = assessRoster(a, [a,b], 6);
    expect(report.stats.map(s => s.position)).toEqual(['QB', 'RB', 'WR']);
    expect(report.weakest.position).not.toBe('TE');
    expect(report.leastDepth.position).not.toBe('TE');
    expect(rosterUtility(a.roster, 6).ros).toBe(106);
  });
  test('TEs provide FLEX output and interchangeable injury cover rather than required TE depth', () => {
    const roster = base('a');
    const withTE = [...roster, p('flexTE','TE',25)];
    const withWR = [...roster, p('flexWR','WR',25)];
    expect(rosterUtility(withTE, 6).ros).toBeGreaterThan(rosterUtility(roster, 6).ros);
    expect(rosterUtility(withTE, 6)).toEqual(rosterUtility(withWR, 6));
  });
  test('a +4% upgrade means receiving 104 Trade Value for 100 sent, not the reverse', () => {
    expect(tradeValueUpgrade(100, 104)).toBeCloseTo(4, 8);
    expect(matchesUpgradeTarget(100, 104, 4)).toBe(true);
    expect(matchesUpgradeTarget(104, 100, 4)).toBe(false);
    expect(matchesUpgradeTarget(100, 102, 4)).toBe(false);
  });
  test('settings span +1% through +5% and match within half a percentage point', () => {
    for (const target of [1, 2, 3, 4, 5]) {
      expect(matchesUpgradeTarget(100, 100 + target, target)).toBe(true);
      expect(matchesUpgradeTarget(100, 100 + target + 0.6, target)).toBe(false);
    }
    expect(matchesUpgradeTarget(100, 100, 0)).toBe(false);
    expect(matchesUpgradeTarget(100, 106, 6)).toBe(false);
  });
  test('targeted search only returns the requested value upgrade while both rosters improve', () => {
    const a: FinderTeam = {id:'a', name:'A', roster:[...base('a'),p('opQB','QB',21),p('spareQB','QB',19)]};
    const b: FinderTeam = {id:'b', name:'B', roster:[...base('b').map(p => ({...p, value:52, ppg:p.position==='WR' ? 22 : p.ppg})),p('spareWR','WR',18,52)]};
    const results = findTrades(a, [a,b], 6, undefined, 4);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.valueUpgrade).toBeCloseTo(4, 8);
      expect(r.gain).toBeGreaterThan(0);
      expect(r.partnerGain).toBeGreaterThan(0);
    }
    expect(findTrades(a, [a,b], 6, undefined, 1)).toEqual([]);
  });
  test('ideal balance is within 2 percent, not two value points', () => {
    expect(isIdealTrade(100,102)).toBe(true);
    expect(isIdealTrade(50,52)).toBe(false);
    expect(tradeImbalance(100,100)).toBe(0);
  });
  test('opposite QB and WR depth produces a beneficial balanced swap for both teams', () => {
    const a: FinderTeam = {id:'a', name:'A', roster:[...base('a'),p('opQB','QB',21),p('spareQB','QB',19)]};
    const b: FinderTeam = {id:'b', name:'B', roster:[...base('b').map(p => ({...p, ppg:p.position==='WR' ? 22 : p.ppg})),p('spareWR','WR',18)]};
    const results=findTrades(a,[a,b],6);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.gain).toBeGreaterThan(0);
      expect(r.partnerGain).toBeGreaterThan(0);
      expect(r.send.length).toBe(r.receive.length);
      expect(r.imbalance).toBeLessThanOrEqual(2);
    }
  });
  test('practice-slot-independent depth measures backup options outside the best nine', () => {
    const a={id:'a',name:'A',roster:base('a')};
    const report=assessRoster(a,[a],6);
    expect(report.stats.find(s=>s.position==='QB')?.backups).toBe(0);
    expect(report.stats.find(s=>s.position==='WR')?.backups).toBe(0);
  });
  test('Week 14 bye exposure identifies the lost starter and replacement gap', () => {
    const a={id:'a',name:'A',roster:[...base('a').slice(1),{...p('qb','QB',25),nflTeam:'DAL'}]};
    const bye=assessRoster(a,[a],6).byes.find(b=>b.week===14);
    expect(bye?.loss).toBe(25);
    expect(bye?.starters.map(p=>p.id)).toContain('qb');
  });
  test('unpaired franchise tags cannot be suggested', () => {
    const a={id:'a',name:'A',roster:base('a').map(p=>({...p,franchiseTag:true}))};
    expect(findTrades(a,[a,{id:'b',name:'B',roster:base('b')}],6)).toEqual([]);
  });
  test('no invented recommendations when no trade partner exists', () => {
    const a={id:'a',name:'A',roster:base('a')};
    expect(findTrades(a,[a],6)).toEqual([]);
    expect(rosterUtility(a.roster,6).ros).toBeGreaterThan(0);
  });
});