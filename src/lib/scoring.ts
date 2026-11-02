// Pure weekly-finish scoring rules shared by public standings, the season
// grid, and the admin standings view. No imports from the supabase client so
// the module stays unit-testable.

// Points awarded by weekly finish: 1st = 20 ... 10th = 0
export const WEEKLY_FINISH_POINTS = [20, 18, 16, 14, 8, 4, 3, 2, 1, 0];

// Missing projection rows must never change the league's scoring scale.
export const pointsForFinish = (place: number, _fieldSize: number) =>
  WEEKLY_FINISH_POINTS[place] ?? 0;

// Rivalry weeks are head-to-head: winners get +15 standings points, losers 0.
export const RIVALRY_WIN_POINTS = 15;
export const RIVALRY_WEEKS: Record<number, string[]> = {
  4: [
    '11111111-0001-0001-0001-000000000006', // Fire Ants
    '11111111-0001-0001-0001-000000000002', // Fanatics
    '11111111-0001-0001-0001-000000000007', // Brock Party
    '11111111-0001-0001-0001-000000000003', // Kats
  ],
};

/** Standings points for a team's weekly finish, honoring rivalry weeks. */
export const weeklyPoints = (week: number, teamId: string, place: number, fieldSize: number) => {
  const rivalry = RIVALRY_WEEKS[week];
  if (rivalry) return rivalry.includes(teamId) ? RIVALRY_WIN_POINTS : 0;
  return pointsForFinish(place, fieldSize);
};
