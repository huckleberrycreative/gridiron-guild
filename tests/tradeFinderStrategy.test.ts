import { describe, expect, test } from 'bun:test';
import { futurePlayer, futureEfficiency, futureRoster, strategyScore, findStrategicTrades, type StrategyPlayer, type StrategyTeam } from '../src/lib/tradeFinderStrategy';
import { emptySchedule } from '../src/lib/seasonSimulation';
const player = (id: string, position: string, ppg: number, age: number, value = 50): StrategyPlayer => ({id,name:id,position,ppg,basePpg:ppg,futurePpg:ppg,age,value,salary:1,avgCost:1,franchiseTag:false,projected:false});
const base = (prefix: string) => [player(prefix+'qb','QB',20,28),player(prefix+'r1','RB',15,24),player(prefix+'r2','RB',14,24),...Array.from({length:6},(_,i)=>player(prefix+'w'+i,'WR',12-i,26))];
describe('Trade Finder strategies', () => {
  test('Win Now scores exclusively current championship improvement regardless of salary and age', () => {
    expect(strategyScore('win-now',3,-12,-9,-900)).toBe(3);
    expect(strategyScore('win-now',3,12,9,900)).toBe(3);
    expect(strategyScore('win-now',0,12,9,900)).toBe(0);
  });
  test('Rebuild ignores current scoring and title odds losses', () => {
    expect(strategyScore('rebuild',-20,4,2,100)).toBe(6);
    expect(strategyScore('rebuild',20,4,2,100)).toBe(6);
    expect(strategyScore('rebuild',20,0,2,100)).toBe(-Infinity);
  });
  test('Rebuild rewards younger, cheaper rosters alongside next-season championship gains', () => {
    expect(strategyScore('rebuild',0,4,2,100)).toBeGreaterThan(strategyScore('rebuild',0,4,0,0));
    expect(futureEfficiency([player('old','RB',20,30)],[{...player('young','RB',20,23),avgCost:100}])).toEqual({ageGain:7,salarySaving:-99});
  });
  test('Thread the Needle combines both horizons and excludes current or future title losses', () => {
    expect(strategyScore('balanced',2,4,2,100)).toBe(4);
    expect(strategyScore('balanced',-1,10,2,100)).toBe(-Infinity);
    expect(strategyScore('balanced',3,-1,2,100)).toBe(-Infinity);
  });
  test('future player forecasts clear current injuries and do not reuse the unknown future NFL schedule', () => {
    const p=futurePlayer({...player('rb','RB',20,23),nflTeam:'DAL',out:true,injuryStatus:'ir',weeksOut:5});
    expect(p.ppg).toBeCloseTo(20.8,8);
    expect(p.out).toBe(false);
    expect(p.nflTeam).toBeNull();
    expect(p.weeksOut).toBe(0);
    expect(futurePlayer(player('aging','RB',20,30)).ppg).toBeCloseTo(13,8);
  });
  test('Practice Squad players remain future promotion options', () => {
    expect(futureRoster([{...player('rookie','WR',10,22),practiceSquad:true}])[0]?.practiceSquad).toBe(false);
  });
  test('Rebuild search accepts a current-year loss for a next-season title improvement', () => {
    const a: StrategyTeam = {id:'a',name:'A',roster:[...base('a'),{...player('veteran','WR',30,31),futurePpg:8}]};
    const b: StrategyTeam = {id:'b',name:'B',roster:[...base('b'),{...player('young','WR',8,22,52),futurePpg:30}]};
    const evaluateOdds = (league: StrategyTeam[], _week: number, _schedule: typeof emptySchedule, future: boolean) => {
      const traded = league.find(t => t.id === 'a')?.roster.some(p => p.id === 'young') ?? false;
      return {
        a:{top2:0,top4:0,top5:0,champ:traded ? future ? 14 : 5 : 10},
        b:{top2:0,top4:0,top5:0,champ:traded ? future ? 5 : 14 : 10},
      };
    };
    const trades = findStrategicTrades(a,[a,b],6,emptySchedule,4,new Set(['veteran']),'rebuild',evaluateOdds);
    expect(trades.length).toBe(1);
    expect(trades[0]?.rosGain).toBeLessThan(0);
    expect(trades[0]?.currentOddsGain).toBe(-5);
    expect(trades[0]?.futureOddsGain).toBe(4);
    expect(trades[0]?.partnerStrategy).toBe('win-now');
  });
  test('strategic search preserves protected outgoing players and requested +4% Trade Value filter', () => {
    const a: StrategyTeam={id:'a',name:'A',roster:[...base('a').map(p => p.position === 'QB' ? {...p,ppg:27,basePpg:27,futurePpg:27} : p),player('op','QB',26,28),player('spare','QB',25,28)]};
    const b: StrategyTeam={id:'b',name:'B',roster:[...base('b').map(p=>({...p,value:52,ppg:p.position==='WR'?22:p.ppg,basePpg:p.position==='WR'?22:p.ppg,futurePpg:p.position==='WR'?22:p.ppg})),player('spareWR','WR',18,24,52)]};
    const evaluateOdds = (league: StrategyTeam[], _week: number, _schedule: typeof emptySchedule, future: boolean) => {
      const traded = league.find(t => t.id === 'b')?.roster.some(p => p.id === 'spare') ?? false;
      return {
        a: {top2:0,top4:0,top5:0,champ:traded ? future ? 9 : 12 : 10},
        b: {top2:0,top4:0,top5:0,champ:traded ? future ? 12 : 8 : 10},
      };
    };
    const found=findStrategicTrades(a,[a,b],6,emptySchedule,4,new Set(['spare']),'win-now',evaluateOdds);
    expect(found.length).toBeGreaterThan(0);
    for(const trade of found){
      expect(trade.send.map(p=>p.id)).toEqual(['spare']);
      expect(trade.valueUpgrade).toBeCloseTo(4,8);
      expect(trade.currentOddsGain).toBeGreaterThan(0);
      expect(trade.strategyScore).toBe(trade.currentOddsGain);
      expect(trade.partnerStrategy).toBe('rebuild');
      expect(trade.futureOddsGain).toBe(-1);
    }
    expect(findStrategicTrades(a,[a,b],6,emptySchedule,4,new Set(),'rebuild')).toEqual([]);
  });
});