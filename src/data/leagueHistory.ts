// Canonical league history (2017–2025) transcribed from the commissioner's Fantasy_Data.pdf.
// Records are raw inputs only; every derived stat lives in src/lib/leagueHistory.ts.

export interface Governor {
  slug: string;
  name: string;
  short: string;
  /** Current franchise name for active governors (matches the teams table). */
  currentTeam?: string;
}

export const GOVERNORS: Governor[] = [
  { slug: 'ben', name: 'Ben Holcomb', short: 'Ben', currentTeam: 'Sylvan Park Forresters' },
  { slug: 'carlos', name: 'Carlos Evans', short: 'Carlos', currentTeam: 'Franklin Fanatics' },
  { slug: 'dino', name: 'Dino Nicandros', short: 'Dino', currentTeam: 'West NY Mary Washington Fire Ants' },
  { slug: 'james', name: 'James Holcomb', short: 'James', currentTeam: 'Austin Area Brock Party' },
  { slug: 'william', name: 'Bill Holcomb', short: 'Bill', currentTeam: 'Queen City Harambes' },
  { slug: 'johnny', name: 'Johnny Holcomb', short: 'Johnny', currentTeam: 'American Lurkers' },
  { slug: 'aicklen', name: 'John Aicklen', short: 'Aicklen', currentTeam: 'San Diego Gamblers' },
  { slug: 'hobart', name: 'Will Hobart', short: 'Hobart', currentTeam: 'Chicago Dawgs' },
  { slug: 'blake', name: 'Blake Blacklidge', short: 'Blake', currentTeam: 'Nepo Beach Guppies' },
  { slug: 'jackson', name: 'Jackson Ferrell', short: 'Jackson', currentTeam: 'Nashville Kats' },
  { slug: 'brett', name: 'Brett Kohanowitch', short: 'Brett' },
  { slug: 'texas', name: 'Josh Johnson', short: 'Josh J.' },
  { slug: 'josh', name: 'Josh Alexander', short: 'Josh A.' },
  { slug: 'tyler', name: 'Tyler Nunn', short: 'Tyler' },
  { slug: 'kevin', name: 'Kevin Smith', short: 'Kevin' },
  { slug: 'weezy', name: 'J Weezy', short: 'Weezy' },
  { slug: 'matt', name: 'Matthew Beck', short: 'Matt' },
  { slug: 'davis', name: 'Davis Conway', short: 'Davis' },
  { slug: 'curtis', name: 'Curtis Monts', short: 'Curtis' },
];

export interface SeasonEntry {
  gov: string;
  team: string;
  wins: number;
  losses: number;
  /** Standings ("aggregate") points; null when the source sheet did not record them. */
  ap: number | null;
  pf: number;
  ties?: number;
}

export interface PlayoffEntry {
  seed: number;
  gov: string;
  /** Standings-adjusted Weeks 14–15 score. */
  semi: number;
  finalist: boolean;
  /** Weeks 16–17 total (championship or consolation game). */
  final?: number;
}

export interface SeasonHistory {
  year: number;
  weeks: number;
  entries: SeasonEntry[];
  playoffs: PlayoffEntry[];
  note?: string;
  /** Live season: no playoff results yet; excluded from finish and playoff career stats. */
  inProgress?: boolean;
}

const e = (gov: string, team: string, wins: number, losses: number, ap: number | null, pf: number): SeasonEntry => ({ gov, team, wins, losses, ap, pf });

export const SEASONS: SeasonHistory[] = [
  {
    year: 2017, weeks: 13,
    entries: [
      e('ben', 'I Will Never Win a Ring', 11, 2, 287, 1719),
      e('aicklen', 'MC Rove', 11, 2, 256, 1575),
      e('hobart', 'Team Hubris', 12, 1, 248, 1574),
      e('texas', "Jones' Street Boys", 10, 3, 247, 1521),
      e('carlos', 'Team Evans', 9, 4, 216, 1451),
      e('davis', '2016 Champ', 7, 6, 208, 1385),
      e('matt', 'Conscientious Objectives', 7, 6, 169, 1326),
      e('weezy', 'Weezy - The Story Continues', 6, 7, 147, 1226),
      e('curtis', 'You Winston, You Lose Some', 5, 8, 135, 1178),
      e('johnny', 'The Scranton Stranglers', 5, 8, 121, 1091),
      e('william', 'Trust the Process', 3, 10, 99, 1056),
      e('dino', 'Mary Washington Fire Ants', 2, 11, 86, 980),
      e('james', 'The Jimmy G Experience', 2, 11, 76, 980),
      e('josh', 'Pretzel Day Pirates', 0, 13, 49, 917),
    ],
    playoffs: [
      { seed: 1, gov: 'ben', semi: 216, finalist: false, final: 263 },
      { seed: 2, gov: 'aicklen', semi: 285, finalist: true, final: 232 },
      { seed: 3, gov: 'texas', semi: 254, finalist: false },
      { seed: 4, gov: 'hobart', semi: 269, finalist: true, final: 157 },
    ],
  },
  {
    year: 2018, weeks: 13,
    entries: [
      e('ben', 'Reign of Terror', 13, 0, 330, 2176),
      e('carlos', 'The Goofballs', 11, 2, 280, 1921),
      e('william', 'Guys Being Dudes', 12, 1, 273, 1807),
      e('aicklen', 'MC Rove', 11, 2, 247, 1694),
      e('dino', 'Mary Washington Fire Ants', 11, 2, 243, 1699),
      e('hobart', "Archie's Audibles", 6, 7, 162, 1480),
      e('johnny', 'Baker Baker Touchdown Maker', 6, 7, 146, 1360),
      e('james', 'The Jimmy G Experience', 5, 8, 141, 1412),
      e('josh', 'DM Backup Team', 5, 8, 135, 1370),
      e('brett', 'Lord of the Kohans', 5, 8, 132, 1356),
      e('weezy', 'Weezy - The Story Continues', 3, 10, 100, 1302),
      e('matt', 'Rebuilding Project', 1, 12, 63, 1182),
      e('texas', 'Triple-Net Triple-Threat', 1, 12, 48, 865),
      e('kevin', 'FitzMagic Baby', 1, 12, null, 1174),
    ],
    playoffs: [
      { seed: 1, gov: 'ben', semi: 326, finalist: true, final: 370 },
      { seed: 2, gov: 'carlos', semi: 245, finalist: false },
      { seed: 3, gov: 'william', semi: 191, finalist: false },
      { seed: 4, gov: 'dino', semi: 264, finalist: true, final: 232 },
    ],
  },
  {
    year: 2019, weeks: 13,
    entries: [
      e('ben', 'Ben Has Left the Chat', 13, 0, 326, 1864),
      e('tyler', 'Rookie Mistake', 11, 2, 256, 1637),
      e('carlos', "Duke's Kaboom", 10, 3, 255, 1660),
      e('james', 'The Jimmy G Experience', 11, 2, 247, 1617),
      e('texas', 'Wedge with Walnuts', 10, 3, 226, 1577),
      e('william', 'Tan Everywhere Jan Everywhere', 9, 4, 200, 1446),
      e('josh', 'DM Backup Team', 7, 6, 187, 1448),
      e('dino', 'Mary Washington Fire Ants', 5, 8, 131, 1273),
      e('aicklen', 'Shazam Alan', 4, 9, 124, 1287),
      e('johnny', 'Danny Jones Locker', 4, 9, 122, 1186),
      e('hobart', 'Snake Bitten', 3, 10, 92, 1172),
      e('brett', 'Lord of the Kohans', 1, 12, 56, 1031),
      e('weezy', 'Weezy - The Story Continues', 0, 13, 27, 862),
      e('kevin', 'Fitzmagic Baby', 3, 10, null, 1331),
    ],
    playoffs: [
      { seed: 1, gov: 'james', semi: 280, finalist: true, final: 215 },
      { seed: 2, gov: 'ben', semi: 258, finalist: false, final: 268.8 },
      { seed: 3, gov: 'tyler', semi: 267, finalist: true, final: 211 },
      { seed: 4, gov: 'carlos', semi: 253, finalist: false, final: 237.2 },
    ],
  },
  {
    year: 2020, weeks: 12, note: 'COVID season — 12 regular-season weeks.',
    entries: [
      e('james', 'Asterisk Year (COVID)', 11, 1, 185, 1564),
      e('carlos', 'Thank You Dak', 8, 4, 144, 1365),
      e('dino', 'Mary Washington Fire Ants', 6, 6, 136, 1389),
      e('aicklen', 'Stay Work', 8, 4, 136, 1379),
      e('brett', 'Lord of the Kohans', 5, 7, 116, 1238),
      e('johnny', 'Joever the Rhine', 6, 6, 106, 1186),
      e('blake', 'Did my QB Test Negative?', 6, 6, 102, 1218),
      e('ben', 'The Little Tank that Could', 4, 8, 90, 1219),
      e('william', 'STOP THE COUNT', 2, 10, 59, 1087),
      e('kevin', "Kevin Smith's Team", 4, 8, null, 1117),
    ],
    playoffs: [
      { seed: 1, gov: 'james', semi: 228, finalist: false },
      { seed: 2, gov: 'dino', semi: 262, finalist: true, final: 218 },
      { seed: 3, gov: 'aicklen', semi: 249, finalist: false, final: 275.3 },
      { seed: 4, gov: 'carlos', semi: 250, finalist: true, final: 217 },
    ],
  },
  {
    year: 2021, weeks: 13,
    entries: [
      e('dino', 'Mary Washington Fire Ants', 11, 2, 219, 1822),
      e('ben', 'Wrong for the Right Reasons', 10, 3, 211, 1774),
      e('blake', 'TERRYfied? Team TAYLORmade', 9, 4, 178, 1632),
      e('carlos', '.8 Destiny Boulevard', 8, 5, 160, 1643),
      e('brett', 'The Ghost Ship', 7, 6, 154, 1450),
      e('jackson', 'Roman Wipes', 5, 8, 123, 1543),
      e('james', 'Lamar you kidding me?', 6, 7, 121, 1532),
      e('william', 'Oaky Afterbirth', 4, 9, 104, 1417),
      e('aicklen', 'Trust the Process', 3, 10, 89, 1361),
      e('davis', "Gas Station Stick 'Em Up", 1, 12, 57, 1299),
      e('johnny', 'Joever The Rhine', 1, 12, 52, 1254),
    ],
    playoffs: [
      { seed: 1, gov: 'dino', semi: 153, finalist: true, final: 332 },
      { seed: 2, gov: 'ben', semi: 169, finalist: true, final: 257 },
      { seed: 3, gov: 'carlos', semi: 149, finalist: false },
      { seed: 4, gov: 'blake', semi: 111, finalist: false },
      { seed: 5, gov: 'brett', semi: 125, finalist: false },
    ],
  },
  {
    year: 2022, weeks: 13,
    entries: [
      e('johnny', "What's in the Baggy?", 13, 0, 220, 1843),
      e('ben', 'Wrong for the Right Reasons', 12, 1, 191, 1770),
      e('william', 'Oaky Afterbirth', 11, 2, 181, 1731),
      e('aicklen', 'Trust the Process', 8, 5, 162, 1699),
      e('james', 'You like that?', 5, 8, 127, 1594),
      e('jackson', "Roman Country, Let's Wipe", 6, 7, 111, 1457),
      e('hobart', 'Splash of Oat Milk', 5, 8, 90, 1320),
      e('blake', 'Me-NAJEE-trois', 3, 10, 72, 1306),
      e('dino', 'Mary Washington Fire Ants', 2, 11, 57, 1264),
      e('carlos', 'Not Dead Last', 0, 13, 24, 1081),
    ],
    playoffs: [
      { seed: 1, gov: 'ben', semi: 161.5, finalist: true, final: 271.7 },
      { seed: 2, gov: 'johnny', semi: 143.8, finalist: true, final: 221.2 },
      { seed: 3, gov: 'william', semi: 121.9, finalist: false },
      { seed: 4, gov: 'aicklen', semi: 121.3, finalist: false },
      { seed: 5, gov: 'james', semi: 100.3, finalist: false },
    ],
  },
  {
    year: 2023, weeks: 13,
    entries: [
      e('ben', 'The Sylvan Park Forresters', 10, 3, 190, 1889.4),
      e('johnny', 'The American Lurkers', 10, 3, 170, 1681.1),
      e('jackson', 'The Nashville Kats', 9, 4, 158, 1687.2),
      e('aicklen', 'The Germantown Gamblers', 7, 6, 144, 1738.8),
      e('james', 'The Florida Area Ken Francis Experience', 7, 6, 127, 1569.6),
      e('hobart', 'The Chicago Dawgs', 6, 7, 125, 1652.1),
      e('william', 'The Queen City Harambes', 6, 7, 110, 1531.6),
      e('carlos', 'The Franklin Fanatics', 6, 7, 102, 1471.5),
      e('dino', 'The West NY Mary Washington Fire Ants', 3, 10, 65, 1278.6),
      e('blake', 'The Nepo Beach Guppies', 1, 12, 34, 1225.9),
    ],
    playoffs: [
      { seed: 1, gov: 'ben', semi: 133.1, finalist: true, final: 259 },
      { seed: 2, gov: 'johnny', semi: 117.6, finalist: false },
      { seed: 3, gov: 'jackson', semi: 113.7, finalist: false, final: 329.1 },
      { seed: 4, gov: 'aicklen', semi: 121.9, finalist: true, final: 239.9 },
      { seed: 5, gov: 'james', semi: 80.6, finalist: false },
    ],
  },
  {
    year: 2024, weeks: 13,
    entries: [
      e('ben', 'Sylvan Park Forresters', 7, 6, 150, 1686),
      e('dino', 'West NY Mary Washington Fire Ants', 8, 5, 139, 1676),
      e('william', 'Queen City Harambes', 5, 8, 139, 1633),
      e('aicklen', 'San Diego Gamblers', 7, 6, 125, 1618),
      e('carlos', 'Franklin Fanatics', 5, 8, 122, 1640),
      e('jackson', 'Nashville Kats', 7, 6, 118, 1535),
      e('hobart', 'Chicago Dawgs', 6, 7, 114, 1635),
      e('blake', 'Nepo Beach Guppies', 6, 7, 109, 1567),
      e('james', 'Austin Area Brock Party', 8, 5, 108, 1575),
      e('johnny', 'American Lurkers', 6, 7, 96, 1522),
    ],
    playoffs: [
      { seed: 1, gov: 'ben', semi: 155.5, finalist: true, final: 267.1 },
      { seed: 2, gov: 'dino', semi: 126.7, finalist: false, final: 281.2 },
      { seed: 3, gov: 'aicklen', semi: 136.3, finalist: false, final: 278.7 },
      { seed: 4, gov: 'carlos', semi: 158.4, finalist: true, final: 234 },
      { seed: 5, gov: 'william', semi: 81.7, finalist: false, final: 278.9 },
    ],
  },
  {
    year: 2025, weeks: 13, note: 'Weekly-finish scoring era: a 5th-place week counts as a tie.',
    entries: [
      e('ben', 'Sylvan Park Forresters', 11, 2, 172, 1853),
      e('carlos', 'Franklin Fanatics', 8, 3, 152, 1776),
      e('jackson', 'Nashville Kats', 8, 5, 127, 1655),
      e('johnny', 'American Lurkers', 6, 5, 115, 1554),
      e('william', 'Queen City Harambes', 6, 6, 112, 1660),
      e('dino', 'West NY Mary Washington Fire Ants', 5, 6, 104, 1622),
      e('james', 'Austin Area Brock Party', 3, 9, 81, 1486),
      e('aicklen', 'San Diego Gamblers', 3, 9, 79, 1484),
      e('hobart', 'Chicago Dawgs', 3, 7, 76, 1451),
      e('blake', 'Nepo Beach Guppies', 2, 9, 60, 1380),
    ],
    playoffs: [
      { seed: 1, gov: 'ben', semi: 166.1, finalist: true, final: 263.9 },
      { seed: 2, gov: 'carlos', semi: 129.4, finalist: false, final: 285.3 },
      { seed: 3, gov: 'johnny', semi: 93.8, finalist: false },
      { seed: 4, gov: 'jackson', semi: 145.3, finalist: true, final: 266.5 },
      { seed: 5, gov: 'william', semi: 72.9, finalist: false },
    ],
  },
];

/** "Heartbreak %" per season as recorded in the source sheet (2017–2021 only). */
export const HEARTBREAK: Record<number, Record<string, number>> = {
  2017: { dino: 8, ben: 8, carlos: 0, james: 0, william: 15, johnny: 23, aicklen: 8, weezy: 15, hobart: 8, josh: 23, texas: 15, matt: 23, davis: 15, curtis: 31 },
  2018: { dino: 8, ben: 0, carlos: 8, james: 31, william: 0, johnny: 0, aicklen: 0, brett: 23, weezy: 38, hobart: 31, josh: 15, texas: 8, matt: 23 },
  2019: { dino: 8, ben: 0, carlos: 8, james: 8, william: 23, johnny: 23, aicklen: 31, brett: 15, weezy: 0, hobart: 15, josh: 15, texas: 8, tyler: 15 },
  2020: { dino: 25, ben: 42, carlos: 25, james: 8, william: 25, johnny: 17, aicklen: 25, brett: 8, blake: 17 },
  2021: { dino: 9, ben: 9, carlos: 27, james: 27, william: 18, johnny: 36, aicklen: 27, brett: 9, blake: 9, davis: 9, jackson: 55 },
};
