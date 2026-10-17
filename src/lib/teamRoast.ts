import { bestLineup, weeklyLineup, type ScheduleContext } from './seasonSimulation';
import { assessRoster, type FinderTeam } from './tradeFinder';
import type { DynastyInput, calculateDynastyRanks } from './dynastyRanks';
import type { PowerRankRow } from '../hooks/usePowerRanks';
import type { TeamWithStandings } from '../hooks/useLeagueData';

type DynastyTeam = ReturnType<typeof calculateDynastyRanks>[number];
export const displayedPowerRanks = (rows: PowerRankRow[]) => rows.map(row => ({ ...row, displayScore: row.score - (/brock party/i.test(row.team.name) ? 10 : 0) }))
  .sort((a,b) => b.displayScore-a.displayScore || b.starterPpw-a.starterPpw);
const num = (n: number) => n.toFixed(1);
const total = (r: {ppg:number}[]) => r.reduce((v,p) => v+p.ppg,0);
export function projectedFinish(rows: PowerRankRow[], startWeek: number, schedule: ScheduleContext) {
  const scale = [20,18,16,14,8,4,3,2,1,0];
  return rows.map(row => {
    let points = row.team.totalPoints;
    for(let week=startWeek; week<=13; week++) {
      const score = total(weeklyLineup(row.roster,week,startWeek,schedule));
      const expectedPlace = rows.filter(r=>r.team.id!==row.team.id).reduce((v,r) => {
        const other = total(weeklyLineup(r.roster,week,startWeek,schedule));
        const spread = Math.sqrt((row.weeklySd ?? 24)**2+(r.weeklySd ?? 24)**2);
        return v+1/(1+Math.exp((score-other)/(spread*0.6)));
      },0);
      const floor=Math.min(9,Math.floor(expectedPlace));
      points += (scale[floor] ?? 0) + ((scale[Math.min(9,floor+1)] ?? 0)-(scale[floor] ?? 0))*(expectedPlace-floor);
    }
    return {id:row.team.id,points};
  }).sort((a,b)=>b.points-a.points);
}
export function buildTeamRoast(teamId: string, standings: TeamWithStandings[], power: PowerRankRow[], dynasty: DynastyTeam[], assets: DynastyInput[], salaries: {id:string;espnLineupSlot?:number|null;practiceSquad:boolean}[], schedule: ScheduleContext, weeksPlayed: number) {
  const ranks = displayedPowerRanks(power);
  const current = ranks.find(t=>t.team.id===teamId);
  const standing = standings.find(t=>t.id===teamId);
  const future = dynasty.find(t=>t.id===teamId);
  if (!current || !standing || !future) return null;
  const powerRank = ranks.indexOf(current)+1, dynastyRank=dynasty.indexOf(future)+1;
  const standingsRank = [...standings].sort((a,b)=>b.totalPoints-a.totalPoints || b.pointsFor-a.pointsFor).findIndex(t=>t.id===teamId)+1;
  const startWeek=Math.min(18,weeksPlayed+1);
  const forecast=projectedFinish(power,startWeek,schedule);
  const finish=forecast.findIndex(t=>t.id===teamId)+1;
  const league: FinderTeam[]=power.map(r=>({id:r.team.id,name:r.team.name,roster:r.roster.map(p=>({...p,value:assets.find(a=>a.id===p.id)?.value ?? 0,salary:assets.find(a=>a.id===p.id)?.s27 ?? 1,franchiseTag:false}))}));
  const own=league.find(t=>t.id===teamId);
  if(!own) return null;
  const assessment=assessRoster(own,league,startWeek);
  const weakest=assessment.weakest, strongest=assessment.strongest;
  const leader=ranks[0];
  const leaderStanding=[...standings].sort((a,b)=>b.totalPoints-a.totalPoints)[0];
  const rawPayroll=assets.filter(a=>a.teamId===teamId).reduce((v,a)=>v+a.s27,0);
  const surplus=Math.max(0,rawPayroll-1000);
  const starters=bestLineup(current.roster.filter(p=>!p.out));
  const lockedIds=new Set(salaries.filter(p=>!p.practiceSquad && p.espnLineupSlot!=null && ![20,21].includes(p.espnLineupSlot)).map(p=>p.id));
  const benchStarter=starters.filter(p=>!lockedIds.has(p.id)).sort((a,b)=>b.ppg-a.ppg)[0];
  const currentStarter=current.roster.filter(p=>lockedIds.has(p.id) && !starters.some(s=>s.id===p.id)).sort((a,b)=>a.ppg-b.ppg)[0];
  const partners=league.filter(t=>t.id!==teamId).map(t=>({team:t,report:assessRoster(t,league,startWeek)}));
  const partner=partners.filter(t=>t.report.strongest.position===weakest.position).sort((a,b)=>b.report.strongest.strength-a.report.strongest.strength)[0];
  const target=partner?.team.roster.filter(p=>p.position===weakest.position && !p.out).sort((a,b)=>b.ppg-a.ppg)[1] ?? partner?.report.strongest.players[0];
  const risk=current.risks?.largestLoss;
  const bye=assessment.byes.sort((a,b)=>b.loss-a.loss)[0];
  const actualText=standingsRank<=2 ? 'You have earned a front-row seat, not a trophy. Stop treating a good start as proof that the roster is finished.' : standingsRank<=4 ? 'You are in the useful part of the table, but useful is not dominant. The teams above you do not owe you a collapse.' : standingsRank===5 ? 'Fifth is purgatory, not a victory lap. You are asking the playoff format to rescue a roster that has not separated itself.' : 'The table is not being unfair to you. You have not banked enough weekly points to make anyone fear this team.';
  const strengthVerdict=powerRank<standingsRank ? `Your #${powerRank} Power Rank is better than your standings position, so there is real roster strength to work with. Getting the lineup right matters more than complaining about the start.` : powerRank>standingsRank ? `Your #${powerRank} Power Rank trails your standings position. The banked points are real; pretending they fix the underlying lineup is not.` : 'Your Power Rank agrees with your place in the table. There is no hidden juggernaut waiting to be discovered in those numbers.';
  const currentText=`You sit #${standingsRank} with ${num(standing.totalPoints)} accumulated weekly points after ${weeksPlayed} weeks, ${num(Math.max(0,(leaderStanding?.totalPoints ?? standing.totalPoints)-standing.totalPoints))} behind the leader. ${actualText} ${strengthVerdict} Your strongest mandatory position is ${strongest.position}; ${weakest.position} is the soft spot, producing ${num(weakest.strength)} points per required starter against a league average of ${num(weakest.relative>0 ? weakest.strength/weakest.relative : 0)}. ${/brock party/i.test(standing.name) ? 'The displayed Power Rank includes the league’s −10 Hexed deduction; it does not reduce your actual scoring or title odds.' : ''}`;
  const dynastyText=`Your dynasty position is #${dynastyRank}, with a ${future.grade} grade and ${num(future.ppw)} projected points per week from the cap-compliant 2027 lineup. ${dynastyRank<=3 ? 'There is a real future here. That is an asset to protect, not permission to overpay for one shiny name.' : dynastyRank<=6 ? 'This is a middle-of-the-pack future, which is another way of saying the roster needs a direction. Collecting respectable players is not the same as building a champion.' : 'Waiting for next year is not a strategy when next year also grades this poorly. You need better assets, not a new calendar.'} ${surplus>0 ? `The uncapped 2027 payroll is $${num(rawPayroll)}, $${num(surplus)} over the cap. The dynasty model drops ${future.cut.map(p=>p.name).join(', ')} to fit. That lost production is the bill for your contracts—not free depth.` : `Your 2027 payroll is $${num(rawPayroll)} before model cuts, leaving $${num(1000-rawPayroll)} under the cap. ${1000-rawPayroll>200 ? 'Cap space only matters if you turn it into players who can start; unused money scores zero.' : 'The contract budget is manageable, but it is not unlimited ammunition.'}`} This is the same dynasty ranking model used on Power Ranks, not a promise about unknown 2027 matchups.`;
  const forecastText=`The central regular-season estimate puts you #${finish} at Week 13, not a guaranteed finish. Your playoff chance is ${num(current.odds.top5)}%, your top-two chance is ${num(current.odds.top2)}%, and your title chance is ${num(current.odds.champ)}%. ${current.odds.top5<35 ? 'The most likely broad outcome is missing the playoffs. You need to change the inputs; optimism does not move the odds.' : current.odds.top5<70 ? 'A playoff fight is the honest prediction. Plan for the bubble, not a coronation.' : 'A playoff berth is the likelier outcome. Winning the Shield is a different and much harder question.'} ${current.odds.champ<10 ? 'You are an outsider for the title, even if the right hot streak could change everything.' : 'You have a legitimate title path, but fantasy volatility leaves plenty of room for an early exit.'} ${bye && bye.loss>0 ? `Week ${bye.week} removes ${num(bye.loss)} points from your full-strength lineup before replacements; ${bye.starters.map(p=>p.name).join(', ') || 'your depth'} is the exposure.` : 'No remaining saved bye week creates a modeled starting-lineup scoring loss.'} ${risk ? `Losing ${risk.name} costs about ${num(risk.loss)} points even after the lineup is rebuilt. That is the injury scenario to prepare for.` : ''}`;
  const steps=[
    {title:'Stop leaving points on the bench',body:benchStarter && currentStarter ? `Start by comparing ${benchStarter.name} (${num(benchStarter.ppg)} actual points per week) with ${currentStarter.name} (${num(currentStarter.ppg)}) in the saved lineup. Move toward the highest-scoring legal combination when healthy and available. Do not confuse a familiar name with the strongest weekly option.` : `Your strongest healthy starting lineup totals ${num(current.starterPpw)} points per week. ${benchStarter ? `${benchStarter.name} belongs in the weekly lineup discussion; the saved ESPN slots are incomplete or do not currently include that player.` : 'The saved starters already align with the strongest healthy combination.'} Check injuries and byes before locking it; reputation is not a scoring category.`},
    {title:`Fix ${weakest.position}, not your favorite player`,body:`${weakest.position} is the weakest mandatory position relative to this league; ${strongest.position} is your strongest. ${partner && target ? `Open a conversation with ${partner.team.name} about ${target.name}, using genuine surplus from your stronger positions rather than creating a new hole.` : `Shop genuine ${strongest.position} surplus for a ${weakest.position} upgrade, and use Trade Finder to locate an actual fit.`} Require a better starting lineup or meaningful replacement protection; no proposed player is guaranteed to be available at a fair price.`},
    {title:'Insure the point of failure',body:`${risk ? `${risk.name} is your largest single-player scoring exposure, with a ${num(risk.loss)}-point replacement gap. Add an eligible backup or trade for more usable cover there.` : `Your thinnest mandatory position is ${assessment.leastDepth.position}; add a usable replacement, not just another roster name.`} ${bye && bye.loss>0 ? `Have coverage in place before Week ${bye.week}, when your saved byes cost ${num(bye.loss)} lineup points. A stacked bye is a foreseeable problem, not bad luck.` : 'Avoid stacking future byes when choosing that insurance.'} TE is optional FLEX output—not a separate depth requirement.`},
    {title:surplus>0 ? 'Pay the contract bill before it arrives' : 'Make the next dollar earn its place',body:surplus>0 ? `Address the $${num(surplus)} 2027 overage now. ${future.cut.length ? `Review ${future.cut.map(p=>p.name).join(', ')} first: those are the model’s least efficient contracts, not automatic real-world cut instructions.` : ''} Seek cheaper useful scoring before selling productive youth just to preserve expensive veterans. Compare 2027–2029 costs; historical salaries do not solve tomorrow’s budget.` : `You have $${num(Math.max(0,1000-rawPayroll))} of 2027 room. Spend it on lineup upgrades or young, affordable scoring—not redundant depth. Keep productive Practice Squad prospects in the future plan and compare 2027–2029 contract paths before committing.`},
    {title:powerRank===1 ? 'Defend number one—do not get cute' : 'Close the gap to number one',body:leader ? `${leader.team.name} sets the current benchmark: a ${num(leader.displayScore)} displayed grade and ${num(leader.starterPpw)} starter points per week. Your grade is ${num(current.displayScore)}, a ${num(Math.max(0,leader.displayScore-current.displayScore))}-point gap. ${weeksPlayed>0 ? 'Bank top weekly finishes: earned standings increasingly drive the grade, so trades alone cannot erase already-lost points.' : 'With no earned standings yet, improve actual lineup output, injury resilience and bench Trade Value.'} Recheck Power Ranks after every roster move and scoring update; stop when another move weakens one of those inputs. ${powerRank===1 ? 'Being first makes restraint a strategy.' : 'This is a route toward #1, not a five-move guarantee.'}` : 'Recheck the league benchmark after scoring and roster updates; no ranking can be guaranteed.'},
  ];
  return {name:standing.name,standingsRank,powerRank,dynastyRank,finish,currentText,dynastyText,forecastText,steps};
}