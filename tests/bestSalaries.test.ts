import { test, expect } from 'bun:test';
import { rankBestSalaries, salaryEfficiency, type SalaryAsset } from '../src/lib/bestSalaries';
const player=(name:string,actual:number,age:number,s27:number,s28:number,s29:number): SalaryAsset => ({id:name,name,actual,age,s27,s28,s29,ppg:12,position:'RB',team:'Team',dynastyRank:20});
const kyren=player('Kyren Williams',19.16,26,190,228,257);
const cam=player('Cam Skattebo',9.26,24,25,125,150);
const chuba=player('Chuba Hubbard',18.5,27,31,125,150);
test('Kyren cost includes $190, $228 and $257, not historical salary',()=>{
  expect(salaryEfficiency(kyren).total).toBe(675);
});
test('cheap productive Skattebo and Hubbard beat expensive Williams on contract efficiency',()=>{
  expect(rankBestSalaries([kyren,cam,chuba]).map(r=>r.name)).toEqual(['Chuba Hubbard','Cam Skattebo','Kyren Williams']);
});
test('similar scoring and younger age cannot lose to a more expensive contract',()=>{
  expect(salaryEfficiency({...cam,actual:kyren.actual-4}).ppd).toBeGreaterThan(salaryEfficiency(kyren).ppd);
});
test('dynasty reputation does not affect a contract efficiency score',()=>{
  expect(salaryEfficiency({...cam,dynastyRank:400}).ppd).toBe(salaryEfficiency({...cam,dynastyRank:1}).ppd);
});
test('observed scoring beats the projected fallback and a recorded zero remains zero',()=>{
  expect(salaryEfficiency({...cam,ppg:100}).ppg).toBe(9.26);
  expect(salaryEfficiency({...cam,actual:0}).ppg).toBe(0);
  expect(salaryEfficiency({...cam,actual:null}).ppg).toBe(12);
});