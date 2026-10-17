import { bestLineup, weeklyLineup, type ScheduleContext } from './seasonSimulation';
import { assessRoster, type FinderTeam } from './tradeFinder';
import type { DynastyInput, calculateDynastyRanks } from './dynastyRanks';
import { buildRoastPlan, turnaroundHorizon, type RoastAsset } from './roastPlan';
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
export function buildTeamRoast(teamId: string, standings: TeamWithStandings[], power: PowerRankRow[], dynasty: DynastyTeam[], assets: DynastyInput[], salaries: {id:string;espnLineupSlot?:number|null;practiceSquad:boolean;franchiseTag?:boolean}[], schedule: ScheduleContext, weeksPlayed: number) {
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
  const leaderStanding=[...standings].sort((a,b)=>b.totalPoints-a.totalPoints)[0];
  const rawPayroll=assets.filter(a=>a.teamId===teamId).reduce((v,a)=>v+a.s27,0);
  const surplus=Math.max(0,rawPayroll-1000);
  const starters=bestLineup(current.roster.filter(p=>!p.out));
  const actualText=standingsRank<=2 ? 'You have earned a front-row seat, not a trophy. Stop treating a good start as proof that the roster is finished.' : standingsRank<=4 ? 'You are in the useful part of the table, but useful is not dominant. The teams above you do not owe you a collapse.' : standingsRank===5 ? 'Fifth is purgatory, not a victory lap. You are asking the playoff format to rescue a roster that has not separated itself.' : 'The table is not being unfair to you. You have not banked enough weekly points to make anyone fear this team.';
  const strengthVerdict=powerRank<standingsRank ? `Your #${powerRank} Power Rank is better than your standings position, so there is real roster strength to work with. Getting the lineup right matters more than complaining about the start.` : powerRank>standingsRank ? `Your #${powerRank} Power Rank trails your standings position. The banked points are real; pretending they fix the underlying lineup is not.` : 'Your Power Rank agrees with your place in the table. There is no hidden juggernaut waiting to be discovered in those numbers.';
  const currentText=`You sit #${standingsRank} with ${num(standing.totalPoints)} accumulated weekly points after ${weeksPlayed} weeks, ${num(Math.max(0,(leaderStanding?.totalPoints ?? standing.totalPoints)-standing.totalPoints))} behind the leader. ${actualText} ${strengthVerdict} Your strongest mandatory position is ${strongest.position}; ${weakest.position} is the soft spot, producing ${num(weakest.strength)} points per required starter against a league average of ${num(weakest.relative>0 ? weakest.strength/weakest.relative : 0)}. ${/brock party/i.test(standing.name) ? 'The displayed Power Rank includes the league’s −10 Hexed deduction; it does not reduce your actual scoring or title odds.' : ''}`;
  const dynastyText=`Your dynasty position is #${dynastyRank}, with a ${future.grade} grade and ${num(future.ppw)} projected points per week from the cap-compliant 2027 lineup. ${dynastyRank<=3 ? 'There is a real future here. That is an asset to protect, not permission to overpay for one shiny name.' : dynastyRank<=6 ? 'This is a middle-of-the-pack future, which is another way of saying the roster needs a direction. Collecting respectable players is not the same as building a champion.' : 'Waiting for next year is not a strategy when next year also grades this poorly. You need better assets, not a new calendar.'} ${surplus>0 ? `The uncapped 2027 payroll is $${num(rawPayroll)}, $${num(surplus)} over the cap. The dynasty model drops ${future.cut.map(p=>p.name).join(', ')} to fit. That lost production is the bill for your contracts—not free depth.` : `Your 2027 payroll is $${num(rawPayroll)} before model cuts, leaving $${num(1000-rawPayroll)} under the cap. ${1000-rawPayroll>200 ? 'Cap space only matters if you turn it into players who can start; unused money scores zero.' : 'The contract budget is manageable, but it is not unlimited ammunition.'}`} This is the same dynasty ranking model used on Power Ranks, not a promise about unknown 2027 matchups.`;
  const scenario=current.scenario;
  const finishPrediction=scenario?.finish ?? finish;
  const teamName=(id:string)=>power.find(r=>r.team.id===id)?.team.name ?? id;
  let forecastText='The simulation has not supplied a representative outcome yet; a detailed playoff prediction would be invented.';
  if(scenario) {
    const result=scenario.standings.find(r=>r.id===teamId);
    const above=scenario.standings[finishPrediction-2], below=scenario.standings[finishPrediction];
    const remaining=Array.from({length:Math.max(0,14-startWeek)},(_,i)=>({week:startWeek+i,score:scenario.weeks[teamId][startWeek+i]}));
    const worst=[...remaining].sort((a,b)=>a.score-b.score)[0],best=[...remaining].sort((a,b)=>b.score-a.score)[0];
    const lowLineup=worst ? weeklyLineup(current.roster,worst.week,startWeek,schedule) : [];
    const lowIds=new Set(lowLineup.map(p=>p.id));
    const absent=starters.filter(p=>!lowIds.has(p.id) && (p.out || weeklyLineup([p],worst?.week ?? startWeek,startWeek,schedule).length===0));
    forecastText=`My pick: ${standing.name} finishes #${finishPrediction} with ${num(result?.points ?? standing.totalPoints)} weekly standings points. This seed-and-playoff-exit combination occurred in ${num(scenario.frequency)}% of runs—the most common joint outcome for your team, not a majority guarantee. ${above ? `${teamName(above.id)} ends ${num(above.points-(result?.points ?? 0))} points ahead of you. ` : 'You finish on top of the regular-season table. '}${below ? `${teamName(below.id)} finishes directly behind you, ${num((result?.points ?? 0)-below.points)} points back. ` : 'You finish at the bottom of the table. '}${worst && best ? `The selected run’s low point is Week ${worst.week}: ${num(worst.score)} scoring points, compared with a Week ${best.week} high of ${num(best.score)}. ${absent.length ? `${absent.map(p=>p.name).join(', ')} is absent from the scheduled lineup that week because of saved availability or byes; random injuries and weekly variance also affect the simulated score.` : 'The low week is a simulated scoring slump, not evidence that you failed to start the right players.'} ` : ''}`;
    if(scenario.outcome==='miss') {
      const fifth=scenario.standings[4];
      forecastText+=`You miss the five-team playoff field${fifth ? `, ${num(fifth.points-(result?.points ?? 0))} standings points behind fifth-place ${teamName(fifth.id)}` : ''}. No semifinal miracle in this prediction: your meaningful season ends in Week 13. The final is ${scenario.finalists.map(p=>teamName(p.id)).join(' versus ')}, and ${teamName(scenario.winner)} wins the Shield.`;
    } else {
      const semi=scenario.semifinals.find(p=>p.id===teamId);
      const qualifiers=scenario.semifinals.slice(0,2);
      if(semi) forecastText+=`As seed #${finishPrediction}, your Weeks 14–15 scores of ${num(semi.week14)} and ${num(semi.week15)} become ${num(semi.score)} under the ${finishPrediction<=2 ? 'better-week protection' : finishPrediction<=4 ? 'two-week average' : 'worse-week penalty'}. The two highest semifinal scores advance—this is not a head-to-head bracket. `;
      if(scenario.outcome==='semifinal') forecastText+=`You are eliminated there: ${qualifiers.map(p=>`${teamName(p.id)} (${num(p.score)})`).join(' and ')} take the final spots${semi && qualifiers[1] ? `, leaving you ${num(qualifiers[1].score-semi.score)} points below the second qualifier` : ''}. ${teamName(scenario.winner)} wins the Shield in Weeks 16–17.`;
      else {
        const final=scenario.finalists.find(p=>p.id===teamId), rival=scenario.finalists.find(p=>p.id!==teamId);
        if(final && rival) forecastText+=`You reach the final against ${teamName(rival.id)}, score ${num(final.week16)} in Week 16 and ${num(final.week17)} in Week 17 (${num(final.score)} combined), and ${scenario.outcome==='champion' ? 'win the Shield' : 'finish runner-up'} by ${num(Math.abs(final.score-rival.score))} points. ${scenario.outcome==='champion' ? 'The hot finish is real in this run; it is not a guarantee of domination.' : `${teamName(rival.id)} takes the title with ${num(rival.score)} combined points.`}`;
      }
    }
    forecastText+=` Across all runs, your playoff chance is ${num(current.odds.top5)}%, top-two chance ${num(current.odds.top2)}%, and championship chance ${num(current.odds.champ)}%. These exact scores come from one representative simulation, not known future results.`;
  }
  const roastAssets:RoastAsset[]=assets.map(a=>{
    const player=power.flatMap(r=>r.roster).find(p=>p.id===a.id);
    const contract=salaries.find(p=>p.id===a.id);
    return {...a,...player, dynastyPpg:a.ppg, ppg:player?.basePpg ?? player?.ppg ?? a.ppg, basePpg:player?.basePpg ?? player?.ppg ?? a.ppg, projected:player?.projected ?? true,salary:a.s27,franchiseTag:contract?.franchiseTag ?? false,practiceSquad:contract?.practiceSquad ?? false};
  });
  const plan=buildRoastPlan(teamId,power,roastAssets,turnaroundHorizon(powerRank,current.odds.top5,weeksPlayed),schedule,weeksPlayed);
  return {name:standing.name,standingsRank,powerRank,dynastyRank,finish:finishPrediction,currentText,dynastyText,forecastText,steps:plan.steps,horizon:plan.horizon};
}
