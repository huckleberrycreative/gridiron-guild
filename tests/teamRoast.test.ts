import { test, expect } from 'bun:test';
import { calculateDynastyRanks } from '../src/lib/dynastyRanks';
import { buildTeamRoast, displayedPowerRanks, projectedFinish } from '../src/lib/teamRoast';
import { emptySchedule, rosterRisks } from '../src/lib/seasonSimulation';
import type { PowerRankRow } from '../src/hooks/usePowerRanks';
import type { TeamWithStandings } from '../src/hooks/useLeagueData';
const standings: TeamWithStandings[]=Array.from({length:10},(_,i)=>({id:`t${i}`,name:i===0?'Austin Area Brock Party':`Team ${i}`,owner:'',rank:i+1,totalPoints:60-i*3,pointsFor:600,avgPPW:120,wins:0,losses:0,ties:0}));
const assets=standings.flatMap((t,i)=>['QB','RB','RB','WR','WR','WR','WR','WR','WR'].map((position,j)=>({id:`${t.id}p${j}`,name:`Player ${i}-${j}`,position,ppg:20-i,s27:10,value:70-i,teamId:t.id,team:t.name,age:24})));
const rows: PowerRankRow[]=standings.map((team,i)=>{const roster=assets.filter(a=>a.teamId===team.id).map(a=>({...a,projected:false})); return {team,roster,starters:roster,injured:[],starterPpw:180-i*9,score:90-i*2,retained:0.8,replacementPpg:15,benchCount:0,odds:{top2:30,top4:50,top5:60,champ:10},weeksPlayed:5,startN:0.5,depthN:0.5,standN:0.5,risks:rosterRisks(roster,6,emptySchedule)};});
test('dynasty rankings are reproducible across reports and table calls',()=>{
  expect(calculateDynastyRanks(assets)).toEqual(calculateDynastyRanks(assets));
});
test('written assessment uses standings and shared dynasty ranking and contains five steps',()=>{
  const dynasty=calculateDynastyRanks(assets);
  const report=buildTeamRoast('t0',standings,rows,dynasty,assets,[],emptySchedule,5);
  expect(report?.standingsRank).toBe(1);
  expect(report?.dynastyRank).toBe(dynasty.findIndex(t=>t.id==='t0')+1);
  expect(report?.steps.length).toBe(5);
});
test('season displayed ranks apply Brock deduction without changing simulation scores',()=>{
  const ranks=displayedPowerRanks(rows);
  expect(ranks.find(r=>r.team.id==='t0')?.displayScore).toBe(80);
  expect(rows[0].score).toBe(90);
  expect(ranks[0].team.id).toBe('t1');
});
test('finished regular season preserves earned standings regardless of lineup strength',()=>{
  const result=projectedFinish(rows.map(r=>({...r,starterPpw:0})),14,emptySchedule);
  expect(result[0]).toEqual({id:'t0',points:60});
  expect(result[9]).toEqual({id:'t9',points:33});
});
test('missing roster or dynasty evidence returns no invented report',()=>{
  expect(buildTeamRoast('missing',standings,rows,calculateDynastyRanks(assets),assets,[],emptySchedule,5)).toBeNull();
});