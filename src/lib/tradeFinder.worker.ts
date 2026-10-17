import { findStrategicTrades, type StrategyTeam, type TradeStrategy } from './tradeFinderStrategy';
import type { ScheduleContext } from './seasonSimulation';

self.onmessage = (event: MessageEvent<{ team: StrategyTeam; league: StrategyTeam[]; startWeek: number; schedule: ScheduleContext; target: number; ids: string[]; strategy: TradeStrategy }>) => {
  try {
    const { team, league, startWeek, schedule, target, ids, strategy } = event.data;
    self.postMessage({ suggestions: findStrategicTrades(team, league, startWeek, schedule, target, new Set(ids), strategy) });
  } catch {
    self.postMessage({ error: 'Trade suggestions could not be calculated. Please submit again.' });
  }
};