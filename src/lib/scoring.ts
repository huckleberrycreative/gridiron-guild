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

// Winning a week by more than 20 points earns a +1 standings-point bonus.
export const BLOWOUT_MARGIN = 20;
export const BLOWOUT_BONUS = 1;

/** Standings points for a team's weekly finish, honoring rivalry weeks and the
 * blowout bonus. `margin` is the winner's scoring margin over 2nd place. */
export const weeklyPoints = (
  week: number,
  teamId: string,
  place: number,
  fieldSize: number,
  margin = 0,
) => {
  const rivalry = RIVALRY_WEEKS[week];
  if (rivalry) return rivalry.includes(teamId) ? RIVALRY_WIN_POINTS : 0;
  const base = pointsForFinish(place, fieldSize);
  return place === 0 && margin > BLOWOUT_MARGIN ? base + BLOWOUT_BONUS : base;
};
