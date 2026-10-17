import { describe, test, expect } from 'bun:test';
import { assessRoster, findTrades, isIdealTrade, tradeImbalance, rosterUtility, type FinderPlayer, type FinderTeam } from '../src/lib/tradeFinder';
const p = (id: string, position: string, ppg: number, value = 50): FinderPlayer => ({ id, name: id, position, ppg, value, salary: 1, franchiseTag: false, projected: false });
const base = (prefix: string) => [p(prefix+'qb','QB',20), p(prefix+'rb1','RB',15), p(prefix+'rb2','RB',14), ...Array.from({length:6},(_,i)=>p(prefix+'wr'+i,'WR',12-i))];
describe('Trade Finder', () => {
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