export type SalaryAsset = {
  id: string; name: string; position: string; team: string; ft?: boolean;
  s27: number; s28: number; s29: number; ppg: number; actual: number | null;
  age: number | null; dynastyRank: number | null;
  contractKnown?: boolean;
};
export function forwardSalaryContract(position: string, year27: number, year28: number, year29: number) {
  if (!Number.isFinite(year27) || year27 <= 0) return null;
  const maximum: Record<string,number> = {QB:180,RB:257,WR:203,TE:167};
  const progress=(salary:number,floor:number)=>salary>=150 ? Math.round((maximum[position] ?? 203)*0.9) : Math.max(floor,Math.round(salary*1.2));
  const s28=year28>0 ? year28 : progress(year27,125);
  const s29=year29>0 ? year29 : progress(s28,s28===1 ? 125 : 150);
  return {s27:year27,s28,s29};
}
const PRIME: Record<string, number> = { QB: 32, RB: 26, WR: 29, TE: 30 };
export function salaryEfficiency(r: SalaryAsset) {
  const observed = r.actual != null && Number.isFinite(r.actual);
  const ppg = Math.max(0, observed ? r.actual ?? 0 : r.ppg);
  const pts = [1,2,3].reduce((sum,year) => {
    const pastPrime = r.age == null ? 0 : Math.max(0,r.age+year-(PRIME[r.position] ?? 29));
    const factor = Math.max(0.45,1-pastPrime*(r.position==='RB' ? 0.09 : 0.08));
    return sum+ppg*factor*17;
  },0);
  const total = r.s27+r.s28+r.s29;
  return {...r,total,pts,ppg,observed,ppd:total>0 ? pts/total*10 : 0,dynRank:r.dynastyRank,rank:0};
}
export function rankBestSalaries(rows: SalaryAsset[]) {
  return rows.filter(r=>r.contractKnown!==false).flatMap(r=>{
    const contract=forwardSalaryContract(r.position,r.s27,r.s28,r.s29);
    return contract ? [salaryEfficiency({...r,...contract})] : [];
  }).filter(r=>r.ppg>0)
    .sort((a,b)=>b.ppd-a.ppd || b.ppg-a.ppg || a.id.localeCompare(b.id))
    .map((r,i)=>({...r,rank:i+1}));
}