export type SalaryAsset = {
  id: string; name: string; position: string; team: string; ft?: boolean;
  s27: number; s28: number; s29: number; ppg: number; actual: number | null;
  age: number | null; dynastyRank: number | null;
};
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
  return rows.map(salaryEfficiency).filter(r=>r.ppg>0)
    .sort((a,b)=>b.ppd-a.ppd || b.ppg-a.ppg || a.id.localeCompare(b.id))
    .map((r,i)=>({...r,rank:i+1}));
}