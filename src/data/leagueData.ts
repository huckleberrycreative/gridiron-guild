// Central data store for the fantasy football league
// Easy to update - just modify the arrays below

export interface Team {
  id: string;
  name: string;
  owner: string;
  totalPoints: number; // Accumulated ranking points (Standings Points For)
  pointsFor: number; // Total fantasy points scored
  wins: number;
  losses: number;
}

export interface Owner {
  id: string;
  name: string;
  teamName: string;
  yearsActive: number;
  totalWins: number;
  totalLosses: number;
  championships: number;
  playoffAppearances: number;
  playoffWins: number;
  playoffLosses: number;
  avgPointsPerYear: number;
  avgFinish: number;
  bestFinish: number;
  worstFinish: number;
}

export interface WeeklyStanding {
  week: number;
  rankings: { teamId: string; rank: number; points: number; weeklyPoints: number }[];
}

export interface PlayerSalary {
  id: string;
  firstName: string;
  lastName: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';
  fantasyTeam: string;
  franchiseTag: boolean;
  rookieDraftRound?: number;
  salary2026: number; // Base salary for 2026
}

export interface WeeklyRecap {
  id: string;
  season: number;
  week: number;
  title: string;
  lede: string; // The main opening paragraph
  goatOfWeek: { name: string; description: string }; // G.O.A.T. of the Week (best performance)
  goatLowercase: { name: string; description: string }; // goat of the Week (worst performance)
  tenThings: string[]; // 10 Things I Know, I Know
  date: string;
  featured?: boolean;
}

export interface Comment {
  id: string;
  teamName: string;
  comment: string;
  date: string;
  recapId: string;
}

export interface Matchup {
  id: string;
  week: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  completed: boolean;
}

// Ranking points by position (1st through 10th)
export const RANKING_POINTS: Record<number, number> = {
  1: 20,
  2: 18,
  3: 16,
  4: 14,
  5: 12,
  6: 5,
  7: 4,
  8: 3,
  9: 2,
  10: 1,
};

// Max positional values for salary calculations
export const MAX_POSITIONAL_VALUES: Record<string, { max: number; cap: number }> = {
  QB: { max: 200, cap: 180 },
  RB: { max: 285, cap: 257 },
  WR: { max: 225, cap: 203 },
  TE: { max: 185, cap: 167 },
};

// Salary calculation function based on league rules
export const calculateSalaryForYear = (
  baseSalary: number,
  year: number,
  position: string,
  franchiseTag: boolean
): number => {
  // Franchise tag: $100 for 4 seasons
  if (franchiseTag && year <= 4) {
    return 100;
  }

  if (year === 1) return baseSalary;
  
  const positionMax = MAX_POSITIONAL_VALUES[position];
  const year4PlusCap = positionMax ? positionMax.cap : baseSalary * 2;

  if (year === 2) {
    return Math.max(baseSalary * 1.2, 125);
  }
  if (year === 3) {
    const year2 = Math.max(baseSalary * 1.2, 125);
    return Math.max(year2 * 1.2, 150);
  }
  // Year 4+: 90% of max positional value
  return year4PlusCap;
};

// ========================================
// TEAMS DATA - 2025 SEASON CURRENT ROSTERS
// ========================================
export const teams: Team[] = [
  { id: '1', name: 'The Sylvan Park Forresters', owner: 'Ben Holcomb', totalPoints: 172, pointsFor: 1853, wins: 11, losses: 2 },
  { id: '2', name: 'The Franklin Fanatics', owner: 'Carlos Evans', totalPoints: 152, pointsFor: 1776, wins: 8, losses: 3 },
  { id: '3', name: 'The Nashville Kats', owner: 'Jackson Ferrell', totalPoints: 127, pointsFor: 1655, wins: 8, losses: 5 },
  { id: '4', name: 'The Abbattabad Geronimos', owner: 'Johnny Holcomb', totalPoints: 115, pointsFor: 1554, wins: 6, losses: 5 },
  { id: '5', name: 'The Queen City Harambes', owner: 'William Holcomb', totalPoints: 112, pointsFor: 1660, wins: 6, losses: 6 },
  { id: '6', name: 'The West NY Mary Washington Fire Ants', owner: 'Dino Nicandros', totalPoints: 104, pointsFor: 1622, wins: 5, losses: 6 },
  { id: '7', name: 'The Florida Area Ken Francis Experience', owner: 'James Holcomb', totalPoints: 81, pointsFor: 1486, wins: 3, losses: 9 },
  { id: '8', name: 'The Germantown Gamblers', owner: 'John Aicklen', totalPoints: 79, pointsFor: 1484, wins: 3, losses: 9 },
  { id: '9', name: 'The Chicago Dawgs', owner: 'Will Hobart', totalPoints: 76, pointsFor: 1451, wins: 3, losses: 7 },
  { id: '10', name: 'The Nepo Beach Guppies', owner: 'Blake Blacklidge', totalPoints: 0, pointsFor: 0, wins: 0, losses: 0 },
];

// ========================================
// WEEKLY STANDINGS - TRACK WEEKLY RANKINGS
// ========================================
export const weeklyStandings: WeeklyStanding[] = [
  {
    week: 13,
    rankings: [
      { teamId: '9', rank: 1, points: 22, weeklyPoints: 194.3 },
      { teamId: '8', rank: 2, points: 20, weeklyPoints: 166.6 },
      { teamId: '3', rank: 3, points: 18, weeklyPoints: 150.8 },
      { teamId: '10', rank: 4, points: 16, weeklyPoints: 143.0 },
      { teamId: '4', rank: 5, points: 14, weeklyPoints: 138.1 },
      { teamId: '2', rank: 6, points: 5, weeklyPoints: 137.1 },
      { teamId: '5', rank: 7, points: 4, weeklyPoints: 133.5 },
      { teamId: '7', rank: 8, points: 3, weeklyPoints: 102.4 },
      { teamId: '1', rank: 9, points: 2, weeklyPoints: 95.0 },
      { teamId: '6', rank: 10, points: 1, weeklyPoints: 91.0 },
    ],
  },
  {
    week: 12,
    rankings: [
      { teamId: '1', rank: 1, points: 22, weeklyPoints: 168.3 },
      { teamId: '3', rank: 2, points: 20, weeklyPoints: 146.6 },
      { teamId: '4', rank: 3, points: 18, weeklyPoints: 138.4 },
      { teamId: '5', rank: 4, points: 16, weeklyPoints: 132.5 },
      { teamId: '7', rank: 5, points: 14, weeklyPoints: 123.0 },
      { teamId: '9', rank: 6, points: 5, weeklyPoints: 119.4 },
      { teamId: '8', rank: 7, points: 4, weeklyPoints: 111.3 },
      { teamId: '2', rank: 8, points: 3, weeklyPoints: 110.8 },
      { teamId: '6', rank: 9, points: 2, weeklyPoints: 103.2 },
      { teamId: '10', rank: 10, points: 1, weeklyPoints: 99.2 },
    ],
  },
];

// ========================================
// OWNER STATS - HISTORICAL DATA (ALL-TIME)
// ========================================
export const owners: Owner[] = [
  { id: '1', name: 'Ben Holcomb', teamName: 'The Sylvan Park Forresters', yearsActive: 9, totalWins: 92, totalLosses: 24, championships: 4, playoffAppearances: 8, playoffWins: 10, playoffLosses: 3, avgPointsPerYear: 1763, avgFinish: 1.78, bestFinish: 1, worstFinish: 4 },
  { id: '2', name: 'Dino Nicandros', teamName: 'The West NY Mary Washington Fire Ants', yearsActive: 9, totalWins: 53, totalLosses: 61, championships: 2, playoffAppearances: 4, playoffWins: 5, playoffLosses: 1, avgPointsPerYear: 1433, avgFinish: 3.33, bestFinish: 1, worstFinish: 9 },
  { id: '3', name: 'John Aicklen', teamName: 'The Germantown Gamblers', yearsActive: 9, totalWins: 61, totalLosses: 54, championships: 1, playoffAppearances: 5, playoffWins: 2, playoffLosses: 2, avgPointsPerYear: 1544, avgFinish: 3.33, bestFinish: 1, worstFinish: 9 },
  { id: '4', name: 'James Holcomb', teamName: 'The Florida Area Ken Francis Experience', yearsActive: 9, totalWins: 55, totalLosses: 60, championships: 1, playoffAppearances: 3, playoffWins: 2, playoffLosses: 3, avgPointsPerYear: 1480, avgFinish: 4.78, bestFinish: 1, worstFinish: 9 },
  { id: '5', name: 'Carlos Evans', teamName: 'The Franklin Fanatics', yearsActive: 9, totalWins: 67, totalLosses: 47, championships: 0, playoffAppearances: 6, playoffWins: 1, playoffLosses: 4, avgPointsPerYear: 1608, avgFinish: 5.50, bestFinish: 2, worstFinish: 10 },
  { id: '6', name: 'Will Hobart', teamName: 'The Chicago Dawgs', yearsActive: 8, totalWins: 41, totalLosses: 45, championships: 0, playoffAppearances: 1, playoffWins: 1, playoffLosses: 1, avgPointsPerYear: 1409, avgFinish: 8.25, bestFinish: 1, worstFinish: 10 },
  { id: '7', name: 'William Holcomb', teamName: 'The Queen City Harambes', yearsActive: 9, totalWins: 61, totalLosses: 54, championships: 0, playoffAppearances: 4, playoffWins: 0, playoffLosses: 4, avgPointsPerYear: 1363, avgFinish: 11.88, bestFinish: 3, worstFinish: 10 },
  { id: '8', name: 'Johnny Holcomb', teamName: 'The Abbattabad Geronimos', yearsActive: 9, totalWins: 56, totalLosses: 59, championships: 0, playoffAppearances: 3, playoffWins: 1, playoffLosses: 3, avgPointsPerYear: 1215, avgFinish: 14.50, bestFinish: 2, worstFinish: 11 },
  { id: '9', name: 'Blake Blacklidge', teamName: 'The Nepo Beach Guppies', yearsActive: 5, totalWins: 25, totalLosses: 39, championships: 0, playoffAppearances: 2, playoffWins: 0, playoffLosses: 2, avgPointsPerYear: 1425, avgFinish: 12.88, bestFinish: 3, worstFinish: 10 },
  { id: '10', name: 'Jackson Ferrell', teamName: 'The Nashville Kats', yearsActive: 5, totalWins: 35, totalLosses: 30, championships: 0, playoffAppearances: 2, playoffWins: 0, playoffLosses: 2, avgPointsPerYear: 1556, avgFinish: 14.88, bestFinish: 2, worstFinish: 10 },
];

// ========================================
// PLAYER SALARIES - CONTRACT DATA
// ========================================
export const playerSalaries: PlayerSalary[] = [
  { id: '1', firstName: 'Josh', lastName: 'Allen', position: 'QB', fantasyTeam: 'Gridiron Giants', franchiseTag: false, rookieDraftRound: 1, salary2026: 125 },
  { id: '2', firstName: 'Patrick', lastName: 'Mahomes', position: 'QB', fantasyTeam: 'TD Titans', franchiseTag: true, rookieDraftRound: 1, salary2026: 135 },
  { id: '3', firstName: 'Lamar', lastName: 'Jackson', position: 'QB', fantasyTeam: 'Blitz Brigade', franchiseTag: false, rookieDraftRound: 1, salary2026: 110 },
  { id: '4', firstName: 'Christian', lastName: 'McCaffrey', position: 'RB', fantasyTeam: 'Gridiron Giants', franchiseTag: true, rookieDraftRound: 1, salary2026: 95 },
  { id: '5', firstName: 'Tyreek', lastName: 'Hill', position: 'WR', fantasyTeam: 'TD Titans', franchiseTag: false, rookieDraftRound: 2, salary2026: 85 },
  { id: '6', firstName: 'CeeDee', lastName: 'Lamb', position: 'WR', fantasyTeam: 'Pigskin Predators', franchiseTag: false, rookieDraftRound: 1, salary2026: 72 },
  { id: '7', firstName: 'Travis', lastName: 'Kelce', position: 'TE', fantasyTeam: 'End Zone Elite', franchiseTag: false, salary2026: 65 },
  { id: '8', firstName: 'Bijan', lastName: 'Robinson', position: 'RB', fantasyTeam: 'Blitz Brigade', franchiseTag: false, rookieDraftRound: 1, salary2026: 55 },
  { id: '9', firstName: 'A.J.', lastName: 'Brown', position: 'WR', fantasyTeam: 'Fantasy Phenoms', franchiseTag: false, rookieDraftRound: 2, salary2026: 78 },
  { id: '10', firstName: 'Davante', lastName: 'Adams', position: 'WR', fantasyTeam: 'Redzone Raiders', franchiseTag: false, salary2026: 82 },
  { id: '11', firstName: 'Derrick', lastName: 'Henry', position: 'RB', fantasyTeam: 'Turf Warriors', franchiseTag: false, salary2026: 68 },
  { id: '12', firstName: 'Justin', lastName: 'Jefferson', position: 'WR', fantasyTeam: 'Scramble Squad', franchiseTag: false, rookieDraftRound: 1, salary2026: 92 },
  { id: '13', firstName: 'Jalen', lastName: 'Hurts', position: 'QB', fantasyTeam: 'Pigskin Predators', franchiseTag: false, rookieDraftRound: 2, salary2026: 105 },
  { id: '14', firstName: 'Saquon', lastName: 'Barkley', position: 'RB', fantasyTeam: 'Draft Dodgers', franchiseTag: false, salary2026: 75 },
  { id: '15', firstName: 'George', lastName: 'Kittle', position: 'TE', fantasyTeam: 'TD Titans', franchiseTag: false, salary2026: 58 },
  { id: '16', firstName: "Ja'Marr", lastName: 'Chase', position: 'WR', fantasyTeam: 'Gridiron Giants', franchiseTag: false, rookieDraftRound: 1, salary2026: 88 },
  { id: '17', firstName: 'Nick', lastName: 'Chubb', position: 'RB', fantasyTeam: 'End Zone Elite', franchiseTag: false, salary2026: 62 },
  { id: '18', firstName: 'Stefon', lastName: 'Diggs', position: 'WR', fantasyTeam: 'Turf Warriors', franchiseTag: false, salary2026: 76 },
  { id: '19', firstName: 'Mark', lastName: 'Andrews', position: 'TE', fantasyTeam: 'Blitz Brigade', franchiseTag: false, salary2026: 52 },
  { id: '20', firstName: 'Joe', lastName: 'Burrow', position: 'QB', fantasyTeam: 'Scramble Squad', franchiseTag: false, rookieDraftRound: 1, salary2026: 98 },
];

// ========================================
// WEEKLY RECAPS - ADD NEW RECAPS HERE
// ========================================
export const weeklyRecaps: WeeklyRecap[] = [
  {
    id: '1',
    season: 2024,
    week: 12,
    title: 'Week 12: Giants Continue Their Dominance',
    lede: 'The Gridiron Giants are looking unstoppable as they cruise to their ninth win of the season. Mike Johnson\'s squad put up a league-high 156.8 points this week, led by Josh Allen\'s monster 34.2 point performance. Meanwhile, at the bottom of the standings, the Draft Dodgers continue to struggle, dropping their fourth straight. The tightest game of the week came down to Monday Night Football, where Fantasy Phenoms edged out Scramble Squad by just 2.3 points.',
    goatOfWeek: {
      name: 'Josh Allen',
      description: 'The Buffalo Bills quarterback was absolutely electric, throwing for 3 touchdowns and rushing for 2 more. His 34.2 fantasy points were the highest single-game performance of the season.'
    },
    goatLowercase: {
      name: 'Saquon Barkley',
      description: 'Just when Draft Dodgers needed him most, Barkley laid an absolute egg with 4.2 points on a whopping 14 carries. That\'s the kind of production that gets you relegated to the practice squad.'
    },
    tenThings: [
      'The Giants are now 9-3 and have locked up a playoff spot with two weeks remaining.',
      'TD Titans remain in hot pursuit, just 14 standings points behind the leader.',
      'The Blitz Brigade and Pigskin Predators are deadlocked for the 3rd seed.',
      'End Zone Elite has now lost 3 of their last 4 and is in danger of missing the playoffs.',
      'Fantasy Phenoms got their biggest win of the season at exactly the right time.',
      'Redzone Raiders are officially playing for draft position at this point.',
      'The waiver wire is barren—may the fantasy gods have mercy on your souls.',
      'Three teams are still alive for that final playoff spot. Chaos reigns.',
      'The schedule-makers did the Draft Dodgers no favors down the stretch.',
      'Thanksgiving week never disappoints when it comes to fantasy drama.'
    ],
    date: '2024-11-28',
    featured: true,
  },
  {
    id: '2',
    season: 2024,
    week: 11,
    title: 'Week 11: Upsets Shake Up the Standings',
    lede: 'What a wild week in the league! The Redzone Raiders finally snapped their losing streak with a surprising win over the then-hot Blitz Brigade. Jordan Lee\'s team showed signs of life when they needed it most. The Turf Warriors also pulled off an upset, taking down End Zone Elite in a game that went down to the final catch.',
    goatOfWeek: {
      name: 'Patrick Mahomes',
      description: 'Mahomes reminded everyone why he\'s the face of the franchise tag this week, dropping 32.8 points and singlehandedly keeping the Titans in the hunt.'
    },
    goatLowercase: {
      name: 'Justin Jefferson',
      description: 'A hamstring injury limited JJ to just 2.1 points, torpedoing the Scramble Squad\'s already slim playoff hopes.'
    },
    tenThings: [
      'The Redzone Raiders are ALIVE. Barely.',
      'Blitz Brigade needs to regroup after a tough loss.',
      'Turf Warriors showing heart in a lost season.',
      'End Zone Elite better figure it out fast.',
      'The playoff race is going down to the wire.',
      'Injuries are piling up at the worst time.',
      'Week 12 is a must-win for at least 4 teams.',
      'The trade deadline came and went with a whimper.',
      'Fantasy football is still the greatest game ever invented.',
      'Two weeks left in the regular season. Let\'s ride.'
    ],
    date: '2024-11-21',
    featured: false,
  },
];

// ========================================
// LETTERS TO THE EDITOR - COMMENTS
// ========================================
export const comments: Comment[] = [
  {
    id: '1',
    teamName: 'TD Titans',
    comment: 'The Giants got lucky. We\'re coming for that top spot next week!',
    date: '2024-11-28',
    recapId: '1',
  },
  {
    id: '2',
    teamName: 'Blitz Brigade',
    comment: 'My loss to the Raiders was a fluke. The Predators better watch their back.',
    date: '2024-11-22',
    recapId: '2',
  },
  {
    id: '3',
    teamName: 'Draft Dodgers',
    comment: 'At least we\'re getting good draft picks next year... right?',
    date: '2024-11-28',
    recapId: '1',
  },
];

// ========================================
// MATCHUPS - CURRENT & UPCOMING
// ========================================
export const matchups: Matchup[] = [];

// ========================================
// TEAM CAPTAINS - WEEKLY CAPTAIN PICKS
// ========================================
export interface TeamCaptainPick {
  id: string;
  fantasyTeam: string;
  week: number;
  season: number;
  captainName: string;
  submittedAt: string;
}

export const teamCaptainPicks: TeamCaptainPick[] = [
  // 2026 Season - Reset for new year
];

// ========================================
// PRACTICE SQUAD - ROSTER STASHES
// ========================================
export interface PracticeSquadPlayer {
  name: string;
  salary: number;
}

export interface PracticeSquadRoster {
  fantasyTeam: string;
  players: PracticeSquadPlayer[];
}

export const practiceSquadRosters: PracticeSquadRoster[] = [
  { fantasyTeam: 'The Sylvan Park Forresters', players: [{ name: 'Tank Bigsby', salary: 12 }, { name: 'Jaylen Warren', salary: 8 }, { name: 'Rashee Rice', salary: 15 }] },
  { fantasyTeam: 'The Franklin Fanatics', players: [{ name: 'Zay Flowers', salary: 18 }, { name: 'Trey Benson', salary: 5 }, { name: 'Luke Musgrave', salary: 3 }] },
  { fantasyTeam: 'The Nashville Kats', players: [{ name: 'Keon Coleman', salary: 8 }, { name: 'Ray Davis', salary: 4 }, { name: 'Brock Bowers', salary: 22 }] },
  { fantasyTeam: 'The Abbattabad Geronimos', players: [{ name: 'Malik Nabers', salary: 25 }, { name: 'Jayden Reed', salary: 14 }, { name: 'Tyjae Spears', salary: 10 }] },
  { fantasyTeam: 'The Queen City Harambes', players: [{ name: 'Marvin Harrison Jr.', salary: 35 }, { name: 'Rome Odunze', salary: 20 }, { name: 'Blake Corum', salary: 6 }] },
  { fantasyTeam: 'The West NY Mary Washington Fire Ants', players: [{ name: 'Adonai Mitchell', salary: 12 }, { name: 'Dalton Kincaid', salary: 18 }, { name: 'Javonte Williams', salary: 8 }] },
  { fantasyTeam: 'The Florida Area Ken Francis Experience', players: [{ name: 'Brian Thomas Jr.', salary: 22 }, { name: 'Xavier Worthy', salary: 16 }, { name: 'Jonathon Brooks', salary: 14 }] },
  { fantasyTeam: 'The Germantown Gamblers', players: [{ name: 'Ladd McConkey', salary: 12 }, { name: 'Jaxon Smith-Njigba', salary: 24 }, { name: 'Jaleel McLaughlin', salary: 2 }] },
  { fantasyTeam: 'The Chicago Dawgs', players: [{ name: 'Xavier Legette', salary: 10 }, { name: 'Troy Franklin', salary: 5 }, { name: 'Cade Otton', salary: 4 }] },
  { fantasyTeam: 'The Nepo Beach Guppies', players: [{ name: 'Quentin Johnston', salary: 18 }, { name: 'Jaylen Wright', salary: 8 }, { name: 'Isaiah Likely', salary: 6 }] },
];

// ========================================
// COACHING CAROUSEL - HEAD COACH HISTORY
// ========================================
export interface Coach {
  name: string;
  imageUrl?: string;
  yearsActive: string;
  wins: number;
  losses: number;
  playoffWins: number;
  playoffLosses: number;
  championships: number;
  isCurrent: boolean;
}

export interface TeamCoachHistory {
  teamName: string;
  coaches: Coach[];
}

export const coachingHistory: TeamCoachHistory[] = [
  { teamName: 'The Sylvan Park Forresters', coaches: [{ name: 'Ben Holcomb', yearsActive: '2017-Present', wins: 92, losses: 24, playoffWins: 10, playoffLosses: 3, championships: 4, isCurrent: true }] },
  { teamName: 'The West NY Mary Washington Fire Ants', coaches: [{ name: 'Dino Nicandros', yearsActive: '2017-Present', wins: 53, losses: 61, playoffWins: 5, playoffLosses: 1, championships: 2, isCurrent: true }] },
  { teamName: 'The Germantown Gamblers', coaches: [{ name: 'John Aicklen', yearsActive: '2017-Present', wins: 61, losses: 54, playoffWins: 2, playoffLosses: 2, championships: 1, isCurrent: true }] },
  { teamName: 'The Florida Area Ken Francis Experience', coaches: [{ name: 'James Holcomb', yearsActive: '2017-Present', wins: 55, losses: 60, playoffWins: 2, playoffLosses: 3, championships: 1, isCurrent: true }] },
  { teamName: 'The Franklin Fanatics', coaches: [{ name: 'Carlos Evans', yearsActive: '2017-Present', wins: 67, losses: 47, playoffWins: 1, playoffLosses: 4, championships: 0, isCurrent: true }] },
  { teamName: 'The Chicago Dawgs', coaches: [{ name: 'Will Hobart', yearsActive: '2017-Present', wins: 41, losses: 45, playoffWins: 1, playoffLosses: 1, championships: 0, isCurrent: true }] },
  { teamName: 'The Queen City Harambes', coaches: [{ name: 'William Holcomb', yearsActive: '2017-Present', wins: 61, losses: 54, playoffWins: 0, playoffLosses: 4, championships: 0, isCurrent: true }] },
  { teamName: 'The Abbattabad Geronimos', coaches: [{ name: 'Johnny Holcomb', yearsActive: '2017-Present', wins: 56, losses: 59, playoffWins: 1, playoffLosses: 3, championships: 0, isCurrent: true }] },
  { teamName: 'The Nepo Beach Guppies', coaches: [{ name: 'Blake Blacklidge', yearsActive: '2020-Present', wins: 25, losses: 39, playoffWins: 0, playoffLosses: 2, championships: 0, isCurrent: true }] },
  { teamName: 'The Nashville Kats', coaches: [{ name: 'Jackson Ferrell', yearsActive: '2021-Present', wins: 35, losses: 30, playoffWins: 0, playoffLosses: 2, championships: 0, isCurrent: true }] },
];

// ========================================
// 2025 SEASON DATA - UPDATE SCORES HERE
// ========================================
export interface WeeklyScores {
  [teamId: string]: number;
}

export interface WeekData {
  week: number;
  scores: WeeklyScores;
  completed: boolean;
}

export interface PlayoffMatchup {
  team1Id: string | null;
  team2Id: string | null;
  team1Score?: number;
  team2Score?: number;
  winnerId?: string | null;
  completed: boolean;
}

export interface PlayoffRound {
  name: string;
  weeks: string;
  matchups: {
    championship: PlayoffMatchup[];
    consolation: PlayoffMatchup[];
    toiletBowl?: PlayoffMatchup[];
  };
}

// 13-week regular season - UPDATE WEEKLY SCORES HERE
// Team IDs: 1=Ben, 2=Carlos, 3=Jackson, 4=Johnny, 5=William, 6=Dino, 7=James, 8=Aicklen, 9=Hobart, 10=Blake
export const season2025Weeks: WeekData[] = [
  {
    week: 1,
    completed: true,
    scores: {
      '1': 124.83, '2': 74.61, '3': 100.17, '4': 136.17, '5': 101.43,
      '6': 116.56, '7': 68.96, '8': 124.83, '9': 126.99, '10': 78.38,
    },
  },
  {
    week: 2,
    completed: true,
    scores: {
      '1': 185.1, '2': 125.06, '3': 158.32, '4': 109.88, '5': 134.62,
      '6': 99.14, '7': 136.62, '8': 124.06, '9': 119.21, '10': 84.27,
    },
  },
  {
    week: 3,
    completed: true,
    scores: {
      '1': 163.17, '2': 119.77, '3': 89.37, '4': 127.33, '5': 122.64,
      '6': 133.91, '7': 124.64, '8': 181.16, '9': 119.37, '10': 75.79,
    },
  },
  {
    week: 4,
    completed: true,
    scores: {
      '1': 218.2, '2': 125.7, '3': 135.3, '4': 75.5, '5': 113.8,
      '6': 69.5, '7': 148.5, '8': 115.2, '9': 112.3, '10': 103.3,
    },
  },
  {
    week: 5,
    completed: true,
    scores: {
      '1': 86.5, '2': 144.5, '3': 102.9, '4': 152.0, '5': 148.1,
      '6': 84.3, '7': 110.3, '8': 199.7, '9': 106.8, '10': 75.6,
    },
  },
  {
    week: 6,
    completed: true,
    scores: {
      '1': 118.0, '2': 131.6, '3': 153.5, '4': 121.4, '5': 114.6,
      '6': 80.4, '7': 107.5, '8': 139.2, '9': 100.0, '10': 66.7,
    },
  },
  {
    week: 7,
    completed: true,
    scores: {
      '1': 144.7, '2': 125.6, '3': 121.1, '4': 155.6, '5': 75.4,
      '6': 89.6, '7': 189.7, '8': 115.0, '9': 113.0, '10': 102.3,
    },
  },
  {
    week: 8,
    completed: true,
    scores: {
      '1': 159.4, '2': 78.4, '3': 135.2, '4': 115.4, '5': 139.0,
      '6': 97.3, '7': 107.8, '8': 148.5, '9': 139.9, '10': 113.7,
    },
  },
  {
    week: 9,
    completed: true,
    scores: {
      '1': 105.2, '2': 92.2, '3': 126.3, '4': 125.7, '5': 99.04,
      '6': 59.8, '7': 146.2, '8': 99.6, '9': 112.3, '10': 105.9,
    },
  },
  {
    week: 10,
    completed: true,
    scores: {
      '1': 164.7, '2': 108.1, '3': 118.7, '4': 129.6, '5': 102.7,
      '6': 144.6, '7': 111.9, '8': 124.7, '9': 133.9, '10': 90.0,
    },
  },
  {
    week: 11,
    completed: true,
    scores: {
      '1': 156.3, '2': 98.1, '3': 148.9, '4': 156.0, '5': 114.3,
      '6': 109.3, '7': 92.1, '8': 88.9, '9': 154.6, '10': 87.8,
    },
  },
  {
    week: 12,
    completed: true,
    scores: {
      '1': 168.3, '2': 110.8, '3': 146.6, '4': 138.4, '5': 132.5,
      '6': 103.2, '7': 123.0, '8': 111.3, '9': 119.4, '10': 99.2,
    },
  },
  {
    week: 13,
    completed: true,
    scores: {
      '1': 95.0, '2': 137.1, '3': 150.8, '4': 138.1, '5': 133.51,
      '6': 91.0, '7': 102.4, '8': 166.6, '9': 194.3, '10': 143.0,
    },
  },
];

// Playoff brackets - UPDATE MATCHUPS HERE
export const playoff2025Rounds: PlayoffRound[] = [
  {
    name: 'Semifinals',
    weeks: 'Week 14-15',
    matchups: {
      championship: [
        { team1Id: null, team2Id: null, completed: false }, // #1 vs #4
        { team1Id: null, team2Id: null, completed: false }, // #2 vs #3
      ],
      consolation: [
        { team1Id: null, team2Id: null, completed: false }, // #6 vs #7
        { team1Id: null, team2Id: null, completed: false }, // #8 vs #9
      ],
      toiletBowl: [
        { team1Id: null, team2Id: null, completed: false }, // #5 vs #10
      ],
    },
  },
  {
    name: 'Finals',
    weeks: 'Week 16-17',
    matchups: {
      championship: [
        { team1Id: null, team2Id: null, completed: false }, // Championship
        { team1Id: null, team2Id: null, completed: false }, // 3rd Place
      ],
      consolation: [
        { team1Id: null, team2Id: null, completed: false }, // 5th Place
        { team1Id: null, team2Id: null, completed: false }, // 7th Place
      ],
      toiletBowl: [
        { team1Id: null, team2Id: null, completed: false }, // 9th Place
      ],
    },
  },
];

// ========================================
// CALCULATION HELPERS - AUTO-GENERATED
// ========================================

// Calculate weekly rankings from scores
export const calculateWeeklyRankings = (scores: WeeklyScores) => {
  const teamsWithScores = Object.entries(scores)
    .map(([teamId, score]) => ({
      teamId,
      score,
      team: teams.find((t) => t.id === teamId),
    }))
    .sort((a, b) => b.score - a.score);

  return teamsWithScores.map((item, index) => ({
    ...item,
    rank: index + 1,
    rankingPoints: RANKING_POINTS[index + 1] || 0,
  }));
};

// Calculate cumulative standings through a given week
export const calculate2025Standings = (throughWeek?: number) => {
  const completedWeeks = season2025Weeks.filter(w => w.completed);
  const maxWeek = throughWeek ?? completedWeeks.length;
  
  const cumulativePoints: { [teamId: string]: number } = {};
  const cumulativeScores: { [teamId: string]: number } = {};

  teams.forEach((team) => {
    cumulativePoints[team.id] = 0;
    cumulativeScores[team.id] = 0;
  });

  season2025Weeks
    .filter((w) => w.completed && w.week <= maxWeek)
    .forEach((week) => {
      const rankings = calculateWeeklyRankings(week.scores);
      rankings.forEach((r) => {
        cumulativePoints[r.teamId] += r.rankingPoints;
        cumulativeScores[r.teamId] += r.score;
      });
    });

  const weeksPlayed = season2025Weeks.filter(w => w.completed && w.week <= maxWeek).length;

  return teams
    .map((team) => ({
      ...team,
      totalPoints: cumulativePoints[team.id],
      pointsFor: cumulativeScores[team.id],
      avgPPW: weeksPlayed > 0 ? cumulativeScores[team.id] / weeksPlayed : 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
};

// Get current completed week count
export const get2025CompletedWeeks = (): number => {
  return season2025Weeks.filter(w => w.completed).length;
};

// Helper function to get sorted standings by total points (legacy support)
export const getSortedStandings = (): Team[] => {
  return [...teams].sort((a, b) => b.totalPoints - a.totalPoints);
};

// Helper to calculate avg PPW (legacy support)
export const getAvgPPW = (team: Team, weeksPlayed: number = 12): number => {
  return team.pointsFor / weeksPlayed;
};
