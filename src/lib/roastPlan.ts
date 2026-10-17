import { bestLineup, healthyRoster, rosterRisks, type ScheduleContext } from './seasonSimulation';
import { dynastyRosterStrength, type DynastyInput } from './dynastyRanks';
import { tradeImbalance, rosterUtility, type FinderPlayer, type FinderTeam } from './tradeFinder';
import type { PowerRankRow } from '../hooks/usePowerRanks';

export type RoastHorizon = 'current' | 'dynasty';
export const turnaroundHorizon = (rank: number, playoffOdds: number, weeksPlayed: number): RoastHorizon =>
  rank >= 8 || playoffOdds < 35 || weeksPlayed >= 13 && playoffOdds === 0 ? 'dynasty' : 'current';
export type RoastAsset = DynastyInput & FinderPlayer & { dynastyPpg?: number };
export type PlanTrade = {
  partner: string; partnerId: string; send: RoastAsset[]; receive: RoastAsset[];
  gain: number; partnerNow: number; partnerFuture: number; nowGain: number;
  payrollAfter: number; valueGap: number; lineupGain: number; partnerLineupGain: number;
};
const names = (players: {name:string}[]) => players.map(p=>p.name).join(' + ');
const n = (v:number) => v.toFixed(1);
const active = (players: RoastAsset[]) => players.filter(p=>!p.practiceSquad);
const lineup = (players: RoastAsset[]) => bestLineup(healthyRoster(active(players))).reduce((s,p)=>s+p.ppg,0);
const currentStrength = (players: RoastAsset[], start: number, schedule: ScheduleContext) => rosterUtility(players,start,schedule).utility;
const futureAssets = (players: RoastAsset[]) => players.map(p=>({...p,ppg:p.dynastyPpg ?? p.ppg}));
const futureStrength = (players: RoastAsset[]) => dynastyRosterStrength(futureAssets(players)).strength;
const packages = (players: RoastAsset[]) => {
  // Keep search bounded; include surplus/cheap youth as well as headline assets.
  const eligible = players.filter(p=>p.value>0 && !p.franchiseTag);
  const pool = [...eligible].sort((a,b)=>b.value-a.value).slice(0,8);
  for (const p of [...eligible].sort((a,b)=>b.ppg/Math.max(1,b.s27)-a.ppg/Math.max(1,a.s27)).slice(0,4)) if (!pool.some(q=>q.id===p.id)) pool.push(p);
  return [...pool.map(p=>[p]), ...pool.flatMap((p,i)=>pool.slice(i+1).map(q=>[p,q]))];
};
const exchanged = (players: RoastAsset[], send: RoastAsset[], receive: RoastAsset[]) => {
  const ids=new Set(send.map(p=>p.id));
  return [...players.filter(p=>!ids.has(p.id)),...receive.map(p=>({...p,practiceSquad:false}))];
};

export function buildRoastPlan(teamId: string, power: PowerRankRow[], assets: RoastAsset[], horizon: RoastHorizon, schedule: ScheduleContext, weeksPlayed: number) {
  const start=Math.min(17,weeksPlayed+1);
  const rosters=new Map(power.map(r=>[r.team.id,assets.filter(p=>p.teamId===r.team.id)]));
  const original=rosters.get(teamId) ?? [];
  const metric=(r:RoastAsset[])=>horizon==='dynasty' ? futureStrength(r) : currentStrength(r,start,schedule);
  const benchmark=[...power].sort((a,b)=>metric(rosters.get(b.team.id) ?? [])-metric(rosters.get(a.team.id) ?? []))[0];
  const benchmarkValue=metric(rosters.get(benchmark?.team.id ?? '') ?? []);
  const benchmarkLineup=lineup(rosters.get(benchmark?.team.id ?? '') ?? []);
  const before=metric(original);
  const used=new Set<string>();
  const trades:PlanTrade[]=[];
  for(let stage=0;stage<3;stage++) {
    const own=rosters.get(teamId) ?? [];
    const ownPackages=packages(own.filter(p=>!used.has(p.id)));
    const ownNow=currentStrength(own,start,schedule), ownFuture=futureStrength(own);
    let best:PlanTrade|null=null;
    for(const row of power.filter(r=>r.team.id!==teamId)) {
      const partner=rosters.get(row.team.id) ?? [];
      const partnerNow=currentStrength(partner,start,schedule),partnerFuture=futureStrength(partner);
      for(const send of ownPackages) for(const receive of packages(partner.filter(p=>!used.has(p.id)))) {
        if(send.length!==receive.length) continue;
        const valueGap=tradeImbalance(send.reduce((s,p)=>s+p.value,0),receive.reduce((s,p)=>s+p.value,0));
        if(valueGap>10) continue;
        const changed=exchanged(own,send,receive), other=exchanged(partner,receive,send);
        const nowGain=currentStrength(changed,start,schedule)-ownNow;
        const nextGain=futureStrength(changed)-ownFuture;
        const gain=horizon==='dynasty' ? nextGain : nowGain;
        if(gain<0.5 || horizon==='current' && lineup(changed)<lineup(own)) continue;
        const otherNow=currentStrength(other,start,schedule)-partnerNow;
        const otherFuture=futureStrength(other)-partnerFuture;
        // Never sell a win-win story on exchange value alone: partner must improve on a credible horizon.
        if(Math.max(otherNow,otherFuture)<0.5) continue;
        // A likely playoff team will not sacrifice this year's output just for a small future benefit.
        if(row.odds.top5>=65 && otherNow<0) continue;
        const nextPayroll=dynastyRosterStrength(futureAssets(changed)).payroll;
        if(!best || gain>best.gain || gain===best.gain && valueGap<best.valueGap) best={partner:row.team.name,partnerId:row.team.id,send,receive,gain,partnerNow:otherNow,partnerFuture:otherFuture,nowGain,payrollAfter:nextPayroll,valueGap,lineupGain:lineup(changed)-lineup(own),partnerLineupGain:lineup(other)-lineup(partner)};
      }
    }
    if(!best) break;
    trades.push(best);
    rosters.set(teamId,exchanged(own,best.send,best.receive));
    rosters.set(best.partnerId,exchanged(rosters.get(best.partnerId) ?? [],best.receive,best.send));
    for(const p of [...best.send,...best.receive]) used.add(p.id);
  }
  const afterRoster=rosters.get(teamId) ?? [];
  const future= dynastyRosterStrength(futureAssets(original));
  const core=[...original].filter(p=>!future.cut.some(c=>c.id===p.id)).sort((a,b)=>b.ppg/Math.max(1,b.s27)-a.ppg/Math.max(1,a.s27)).slice(0,3);
  const rank=power.find(r=>r.team.id===teamId);
  const risk=rosterRisks(active(original),start,schedule).largestLoss;
  const steps=[{title:horizon==='dynasty' ? 'Admit the target is 2027' : benchmark?.team.id===teamId ? 'Protect the lead without standing still' : `Build to catch ${benchmark?.team.name ?? 'the leader'}`,body:horizon==='dynasty'
    ? `At this season’s ${n(rank?.odds.top5 ?? 0)}% playoff chance, buying a short rental is the wrong fight. Aim at dynasty #1 instead. Build around ${core.length ? core.map(p=>`${p.name} ($${n(p.s27)} in 2027)`).join(', ') : 'affordable scoring once it becomes available'}; those are your strongest scoring-per-dollar foundations. ${benchmark?.team.name ?? 'The league leader'} is ${n(Math.max(0,benchmarkValue-before))} next-year strength points ahead, including cap room and retained asset value—not just name recognition.`
    : `The scoring-and-depth benchmark is ${benchmark?.team.name ?? 'the leader'}, whose full-strength lineup averages ${n(benchmarkLineup)} points against your ${n(lineup(original))}. ${risk ? `${risk.name} is the biggest single-player failure point: an absence removes ${n(risk.loss)} points after replacements.` : ''} The trades below are evaluated in order, using actual scoring, remaining byes and replacement production. ${benchmark?.team.id===teamId ? 'You already lead this strength measure: protect availability rather than trading simply to look busy.' : 'To take #1, close the production gap without hollowing out the replacements that keep your season alive.'}`}];
  for(let i=0;i<3;i++) {
    const trade=trades[i];
    if(trade) {
      steps.push({title:`${i===0 ? 'Open with' : 'Then approach'} ${trade.partner}`,body:`Offer ${names(trade.send)} for ${names(trade.receive)}. ${horizon==='dynasty'
        ? `The incoming contracts cost $${n(trade.receive.reduce((s,p)=>s+p.s27,0))} in 2027 versus $${n(trade.send.reduce((s,p)=>s+p.s27,0))} outgoing; the cap-compliant dynasty strength rises ${n(trade.gain)} points after age adjustments and necessary cuts.`
        : `You acquire ${trade.receive.map(p=>`${p.name} (${p.position}, ${n(p.ppg)} actual-average points per week)`).join(' and ')}, lifting full-strength starting output by ${n(trade.lineupGain)} points and remaining-season scoring-and-replacement strength by ${n(trade.gain)} after subtracting the players you lose.`} ${trade.partnerNow>=trade.partnerFuture ? `${trade.partner} receives ${trade.send.map(p=>`${p.name} (${p.position}, ${n(p.ppg)} points per week)`).join(' and ')}: its full-strength lineup gains ${n(trade.partnerLineupGain)} points and its scoring-and-depth strength improves ${n(trade.partnerNow)}.` : `${trade.partner} receives ${trade.send.map(p=>`${p.name} (age ${p.age ?? 'unknown'}, $${n(p.s27)} in 2027)`).join(' and ')} and gains ${n(trade.partnerFuture)} cap-compliant next-year strength points; that future return is its incentive.`} The exchange-value gap is ${n(trade.valueGap)}%. ${trade.valueGap>2 ? 'Above the ideal 2%, this needs negotiation—not a presumed yes.' : 'The value match stays within 2%.'} ${i>0 ? 'Make this move only after the preceding deal; its outgoing assets are still yours at that stage.' : 'Ask for this package, not an open-ended positional upgrade.'}`});
    } else {
      const roster=i===0 ? original : afterRoster;
      const futureState=dynastyRosterStrength(futureAssets(roster));
      const cut=futureState.cut[i-trades.length] ?? futureState.cut[0];
      const ownStarterIds=new Set(bestLineup(healthyRoster(active(roster))).map(p=>p.id));
      const surplus=roster.filter(p=>!ownStarterIds.has(p.id)).sort((a,b)=>b.value-a.value)[i-trades.length];
      const candidate=assets.filter(p=>p.teamId && p.teamId!==teamId && !used.has(p.id) && !p.franchiseTag && (horizon!=='dynasty' || p.age!=null && p.age<=26))
        .sort((a,b)=>horizon==='dynasty' ? b.ppg/Math.max(1,b.s27)-a.ppg/Math.max(1,a.s27) : b.ppg-a.ppg)[i-trades.length];
      steps.push({title:cut ? `Resolve ${cut.name}’s contract` : candidate ? `Price-check ${candidate.name}, without bluffing` : `Hold ${core[i-trades.length]?.name ?? 'your productive core'}`,body:cut
        ? `${cut.name} costs $${n(cut.s27)} in 2027 and is removed by the cap model. Approach ${power.find(r=>r.team.id===assets.find(p=>p.id===candidate?.id)?.teamId)?.team.name ?? 'potential buyers'} before committing to that bill; ${candidate ? `${candidate.name} is a concrete replacement target at $${n(candidate.s27)}, but` : ''} no mutually improving exchange within 10% value cleared the search. Do not call an expensive forced cut “depth.”`
        : candidate ? `${candidate.team} owns ${candidate.name}: ${n(candidate.ppg)} scoring points per week, $${n(candidate.s27)} in 2027${candidate.age!=null ? `, age ${candidate.age}` : ''}. ${surplus ? `${surplus.name} is your available non-starting asset to discuss` : 'You do not have an obvious surplus package to offer'}. No fair mutually beneficial package cleared the search, so this is a target to ask about—not an invented win-win trade. Refuse a price that removes more ${horizon==='dynasty' ? 'cap-compliant future strength' : 'usable starting production'} than it adds.`
        : `The search found no additional mutually beneficial deal within 10% exchange value. Retain ${names(core)} instead of paying for motion. Your path needs new affordable production, not a fifth fictional trade.`});
    }
  }
  const after=metric(afterRoster);
  const currentPoints=rank?.team.totalPoints ?? 0;
  const standingsLeader=[...power].sort((a,b)=>b.team.totalPoints-a.team.totalPoints)[0];
  steps.push({title:'Measure the remaining distance to #1',body:`If all ${trades.length} proposed ${trades.length===1 ? 'deal happens' : 'deals happen'}, ${horizon==='dynasty' ? 'your cap-compliant 2027 strength' : 'your remaining-season scoring-and-depth strength'} improves from ${n(before)} to ${n(after)}. Against the original ${benchmark?.team.name ?? 'leader'} benchmark, ${after>=benchmarkValue ? 'that closes the modeled strength gap' : `you still trail by ${n(benchmarkValue-after)} points`}. ${horizon==='current'
    ? `You also trail ${standingsLeader?.team.name ?? 'the standings leader'} by ${n(Math.max(0,(standingsLeader?.team.totalPoints ?? currentPoints)-currentPoints))} earned standings points. With ${Math.max(0,13-weeksPlayed)} regular-season weeks left, roster moves cannot erase that deficit by themselves; top weekly finishes must do the rest. The displayed grade also uses bench value and the league’s Hexed deduction.`
    : `The resulting 2027 cap-compliant payroll is $${n(dynastyRosterStrength(futureAssets(afterRoster)).payroll)}. Reaching dynasty #1 still requires beating rivals’ offseason improvements; these strength estimates use the same age, salary and cap rules as Dynasty Ranks, but are not a rerun of its championship odds.`} ${trades.length<3 ? 'There were not three credible deals to recommend; inventing them would make this plan less honest.' : 'The sequence spends each player only once and updates both rosters after every proposal.'}`});
  return { horizon, trades, steps, before, after, benchmarkValue };
}