import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { owners, Owner } from '@/data/leagueData';
import { SortableTable, Column } from '@/components/SortableTable';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trophy, Crown, Award, Zap, TrendingUp, Target, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

// Season standings data
interface SeasonStanding {
  rank: number;
  team: string;
  owner: string;
  wins: number;
  losses: number;
  pointsFor: number;
  result: string;
}

// Championship leaders data
interface ChampionshipLeader {
  rank: number;
  owner: string;
  team: string;
  titles: number;
  years: string;
}

// MVP history data
interface MVPRecord {
  season: number;
  player: string;
  position: string;
  owner: string;
  keyStats: string;
}

// League records data
interface LeagueRecord {
  category: string;
  record: string;
  holder: string;
  season: number;
}

// Season-by-season standings
const seasonStandings: Record<number, SeasonStanding[]> = {
  2024: [
    { rank: 1, team: 'The Sylvan Park Forresters', owner: 'Ben Holcomb', wins: 8, losses: 5, pointsFor: 1696, result: 'Champion' },
    { rank: 2, team: 'The West NY Mary Washington Fire Ants', owner: 'Dino Nicandros', wins: 8, losses: 5, pointsFor: 1676, result: 'Runner-Up' },
    { rank: 3, team: 'The Franklin Fanatics', owner: 'Carlos Evans', wins: 7, losses: 6, pointsFor: 1640, result: '3rd Place' },
    { rank: 4, team: 'The Queen City Harambes', owner: 'William Holcomb', wins: 8, losses: 5, pointsFor: 1633, result: 'Semifinalist' },
    { rank: 5, team: 'The Germantown Gamblers', owner: 'John Aicklen', wins: 6, losses: 7, pointsFor: 1618, result: 'Purgatory' },
    { rank: 6, team: 'The Nepo Beach Guppies', owner: 'Blake Blacklidge', wins: 6, losses: 7, pointsFor: 1567, result: 'Consolation' },
    { rank: 7, team: 'The Nashville Kats', owner: 'Jackson Ferrell', wins: 7, losses: 6, pointsFor: 1535, result: 'Consolation' },
    { rank: 8, team: 'The Florida Area Ken Francis Experience', owner: 'James Holcomb', wins: 5, losses: 8, pointsFor: 1575, result: 'Consolation' },
    { rank: 9, team: 'The Chicago Dawgs', owner: 'Will Hobart', wins: 6, losses: 7, pointsFor: 1635, result: 'Consolation' },
    { rank: 10, team: 'The Abbattabad Geronimos', owner: 'Johnny Holcomb', wins: 5, losses: 8, pointsFor: 1522, result: 'Toilet Bowl' },
  ],
  2023: [
    { rank: 1, team: 'The Sylvan Park Forresters', owner: 'Ben Holcomb', wins: 10, losses: 3, pointsFor: 1889.4, result: 'Champion' },
    { rank: 2, team: 'The Germantown Gamblers', owner: 'John Aicklen', wins: 7, losses: 6, pointsFor: 1738.8, result: 'Runner-Up' },
    { rank: 3, team: 'The Nashville Kats', owner: 'Jackson Ferrell', wins: 9, losses: 4, pointsFor: 1687.2, result: '3rd Place' },
    { rank: 4, team: 'The Florida Area Ken Francis Experience', owner: 'James Holcomb', wins: 7, losses: 6, pointsFor: 1569.6, result: 'Semifinalist' },
    { rank: 5, team: 'The Abbattabad Geronimos', owner: 'Johnny Holcomb', wins: 10, losses: 3, pointsFor: 1681.1, result: 'Purgatory' },
    { rank: 6, team: 'The Chicago Dawgs', owner: 'Will Hobart', wins: 6, losses: 7, pointsFor: 1652.1, result: 'Consolation' },
    { rank: 7, team: 'The Queen City Harambes', owner: 'William Holcomb', wins: 6, losses: 7, pointsFor: 1531.6, result: 'Consolation' },
    { rank: 8, team: 'The Nepo Beach Guppies', owner: 'Blake Blacklidge', wins: 1, losses: 12, pointsFor: 1225.9, result: 'Consolation' },
    { rank: 9, team: 'The West NY Mary Washington Fire Ants', owner: 'Dino Nicandros', wins: 3, losses: 10, pointsFor: 1278.6, result: 'Toilet Bowl' },
    { rank: 10, team: 'The Franklin Fanatics', owner: 'Carlos Evans', wins: 6, losses: 7, pointsFor: 1471.5, result: 'Toilet Bowl' },
  ],
  2022: [
    { rank: 1, team: 'Wrong for the Right Reasons', owner: 'Ben Holcomb', wins: 12, losses: 1, pointsFor: 1770, result: 'Champion' },
    { rank: 2, team: "What's in the Baggy?", owner: 'Johnny Holcomb', wins: 13, losses: 0, pointsFor: 1843, result: 'Runner-Up' },
    { rank: 3, team: 'Oaky Afterbirth', owner: 'William Holcomb', wins: 11, losses: 2, pointsFor: 1731, result: '3rd Place' },
    { rank: 4, team: 'You like that?', owner: 'James Holcomb', wins: 5, losses: 8, pointsFor: 1594, result: 'Semifinalist' },
    { rank: 5, team: 'Trust the Process', owner: 'John Aicklen', wins: 8, losses: 5, pointsFor: 1699, result: 'Purgatory' },
    { rank: 6, team: 'Roman Country, Let\'s Wipe', owner: 'Jackson Ferrell', wins: 6, losses: 7, pointsFor: 1457, result: 'Consolation' },
    { rank: 7, team: 'Splash of Oat Milk', owner: 'Will Hobart', wins: 5, losses: 8, pointsFor: 1320, result: 'Consolation' },
    { rank: 8, team: 'Not Dead Last', owner: 'Carlos Evans', wins: 0, losses: 13, pointsFor: 1081, result: 'Consolation' },
    { rank: 9, team: 'Me-NAJEE-trois', owner: 'Blake Blacklidge', wins: 3, losses: 10, pointsFor: 1306, result: 'Toilet Bowl' },
    { rank: 10, team: 'Mary Washington Fire Ants', owner: 'Dino Nicandros', wins: 2, losses: 11, pointsFor: 1264, result: 'Toilet Bowl' },
  ],
  2021: [
    { rank: 1, team: 'Mary Washington Fire Ants', owner: 'Dino Nicandros', wins: 11, losses: 2, pointsFor: 1822, result: 'Champion' },
    { rank: 2, team: 'Wrong for the Right Reasons', owner: 'Ben Holcomb', wins: 10, losses: 3, pointsFor: 1774, result: 'Runner-Up' },
    { rank: 3, team: 'TERRYfied? Team TAYLORmade', owner: 'Blake Blacklidge', wins: 9, losses: 4, pointsFor: 1632, result: '3rd Place' },
    { rank: 4, team: '.8 Destiny Boulevard', owner: 'Carlos Evans', wins: 8, losses: 5, pointsFor: 1643, result: 'Semifinalist' },
    { rank: 5, team: 'The Ghost Ship', owner: 'Brett Kohanowitch', wins: 7, losses: 6, pointsFor: 1450, result: 'Purgatory' },
    { rank: 6, team: 'Roman Wipes', owner: 'Jackson Ferrell', wins: 5, losses: 8, pointsFor: 1543, result: 'Consolation' },
    { rank: 7, team: 'Lamar you kidding me?', owner: 'James Holcomb', wins: 6, losses: 7, pointsFor: 1532, result: 'Consolation' },
    { rank: 8, team: 'Oaky Afterbirth', owner: 'William Holcomb', wins: 4, losses: 9, pointsFor: 1417, result: 'Consolation' },
    { rank: 9, team: 'Trust the Process', owner: 'John Aicklen', wins: 3, losses: 10, pointsFor: 1361, result: 'Toilet Bowl' },
    { rank: 10, team: 'Gas Station Stick \'Em Up', owner: 'Davis Conway', wins: 1, losses: 12, pointsFor: 1299, result: 'Toilet Bowl' },
    { rank: 11, team: 'Joever The Rhine', owner: 'Johnny Holcomb', wins: 1, losses: 12, pointsFor: 1254, result: 'Toilet Bowl' },
  ],
  2020: [
    { rank: 1, team: 'Mary Washington Fire Ants', owner: 'Dino Nicandros', wins: 6, losses: 6, pointsFor: 1389, result: 'Champion' },
    { rank: 2, team: 'Thank You Dak', owner: 'Carlos Evans', wins: 8, losses: 4, pointsFor: 1365, result: 'Runner-Up' },
    { rank: 3, team: 'Stay Work', owner: 'John Aicklen', wins: 8, losses: 4, pointsFor: 1379, result: '3rd Place' },
    { rank: 4, team: 'Asterisk Year (COVID)', owner: 'James Holcomb', wins: 11, losses: 1, pointsFor: 1564, result: 'Semifinalist' },
    { rank: 5, team: 'Did my QB Test Negative?', owner: 'Blake Blacklidge', wins: 6, losses: 6, pointsFor: 1218, result: 'Purgatory' },
    { rank: 6, team: 'Joever the Rhine', owner: 'Johnny Holcomb', wins: 6, losses: 6, pointsFor: 1186, result: 'Consolation' },
    { rank: 7, team: 'Lord of the Kohans', owner: 'Brett Kohanowitch', wins: 5, losses: 7, pointsFor: 1238, result: 'Consolation' },
    { rank: 8, team: "Kevin Smith's Team", owner: 'Kevin Smith', wins: 4, losses: 8, pointsFor: 1117, result: 'Consolation' },
    { rank: 9, team: 'The Little Tank that Could', owner: 'Ben Holcomb', wins: 4, losses: 8, pointsFor: 1219, result: 'Toilet Bowl' },
    { rank: 10, team: 'STOP THE COUNT', owner: 'William Holcomb', wins: 2, losses: 10, pointsFor: 1087, result: 'Toilet Bowl' },
  ],
  2019: [
    { rank: 1, team: 'Reign of Terror', owner: 'Ben Holcomb', wins: 13, losses: 0, pointsFor: 1864, result: 'Champion' },
    { rank: 2, team: 'Tyler Nunn\'s Team', owner: 'Tyler Nunn', wins: 11, losses: 2, pointsFor: 1637, result: 'Runner-Up' },
    { rank: 3, team: 'The Goofballs', owner: 'Carlos Evans', wins: 10, losses: 3, pointsFor: 1660, result: '3rd Place' },
    { rank: 4, team: 'The Jimmy G Experience', owner: 'James Holcomb', wins: 11, losses: 2, pointsFor: 1617, result: 'Semifinalist' },
    { rank: 5, team: 'Texas Team', owner: 'Texas', wins: 10, losses: 3, pointsFor: 1577, result: 'Purgatory' },
    { rank: 6, team: 'Guys Being Dudes', owner: 'William Holcomb', wins: 9, losses: 4, pointsFor: 1446, result: 'Consolation' },
    { rank: 7, team: 'Josh Alexander\'s Team', owner: 'Josh Alexander', wins: 7, losses: 6, pointsFor: 1448, result: 'Consolation' },
    { rank: 8, team: 'Mary Washington Fire Ants', owner: 'Dino Nicandros', wins: 5, losses: 8, pointsFor: 1273, result: 'Consolation' },
    { rank: 9, team: 'MC Rove', owner: 'John Aicklen', wins: 4, losses: 9, pointsFor: 1287, result: 'Toilet Bowl' },
    { rank: 10, team: 'Baker Baker Touchdown Maker', owner: 'Johnny Holcomb', wins: 4, losses: 9, pointsFor: 1186, result: 'Toilet Bowl' },
    { rank: 11, team: 'Kevin\'s Team', owner: 'Kevin Smith', wins: 3, losses: 10, pointsFor: 1331, result: 'Toilet Bowl' },
    { rank: 12, team: 'Archie\'s Audibles', owner: 'Will Hobart', wins: 3, losses: 10, pointsFor: 1172, result: 'Toilet Bowl' },
    { rank: 13, team: 'Lord of the Kohans', owner: 'Brett Kohanowitch', wins: 1, losses: 12, pointsFor: 1031, result: 'Toilet Bowl' },
    { rank: 14, team: 'Weezy - The Story Continues', owner: 'J Weezy', wins: 0, losses: 13, pointsFor: 862, result: 'Toilet Bowl' },
  ],
  2018: [
    { rank: 1, team: 'Reign of Terror', owner: 'Ben Holcomb', wins: 13, losses: 0, pointsFor: 2176, result: 'Champion' },
    { rank: 2, team: 'The Goofballs', owner: 'Carlos Evans', wins: 11, losses: 2, pointsFor: 1921, result: 'Runner-Up' },
    { rank: 3, team: 'Guys Being Dudes', owner: 'William Holcomb', wins: 12, losses: 1, pointsFor: 1807, result: '3rd Place' },
    { rank: 4, team: 'MC Rove', owner: 'John Aicklen', wins: 11, losses: 2, pointsFor: 1694, result: 'Semifinalist' },
    { rank: 5, team: 'Mary Washington Fire Ants', owner: 'Dino Nicandros', wins: 11, losses: 2, pointsFor: 1699, result: 'Purgatory' },
    { rank: 6, team: 'Archie\'s Audibles', owner: 'Will Hobart', wins: 6, losses: 7, pointsFor: 1480, result: 'Consolation' },
    { rank: 7, team: 'Baker Baker Touchdown Maker', owner: 'Johnny Holcomb', wins: 6, losses: 7, pointsFor: 1360, result: 'Consolation' },
    { rank: 8, team: 'The Jimmy G Experience', owner: 'James Holcomb', wins: 5, losses: 8, pointsFor: 1412, result: 'Consolation' },
    { rank: 9, team: 'Josh Alexander\'s Team', owner: 'Josh Alexander', wins: 5, losses: 8, pointsFor: 1370, result: 'Toilet Bowl' },
    { rank: 10, team: 'Lord of the Kohans', owner: 'Brett Kohanowitch', wins: 5, losses: 8, pointsFor: 1356, result: 'Toilet Bowl' },
    { rank: 11, team: 'Weezy - The Story Continues', owner: 'J Weezy', wins: 3, losses: 10, pointsFor: 1302, result: 'Toilet Bowl' },
    { rank: 12, team: 'FitzMagic Baby', owner: 'Kevin Smith', wins: 1, losses: 12, pointsFor: 1174, result: 'Toilet Bowl' },
    { rank: 13, team: 'Rebuilding Project', owner: 'Matthew Beck', wins: 1, losses: 12, pointsFor: 1182, result: 'Toilet Bowl' },
    { rank: 14, team: 'Triple-Net Triple-Threat', owner: 'Texas', wins: 1, losses: 12, pointsFor: 865, result: 'Toilet Bowl' },
  ],
  2017: [
    { rank: 1, team: 'MC Rove', owner: 'John Aicklen', wins: 11, losses: 2, pointsFor: 1575, result: 'Champion' },
    { rank: 2, team: 'Team Hubris', owner: 'Will Hobart', wins: 12, losses: 1, pointsFor: 1574, result: 'Runner-Up' },
    { rank: 3, team: 'I Will Never Win a Ring', owner: 'Ben Holcomb', wins: 11, losses: 2, pointsFor: 1719, result: '3rd Place' },
    { rank: 4, team: 'Jones\' Street Boys', owner: 'Texas', wins: 10, losses: 3, pointsFor: 1521, result: 'Semifinalist' },
    { rank: 5, team: 'Team Evans', owner: 'Carlos Evans', wins: 9, losses: 4, pointsFor: 1451, result: 'Purgatory' },
    { rank: 6, team: 'Conscientious Objectives', owner: 'Matthew Beck', wins: 7, losses: 6, pointsFor: 1326, result: 'Consolation' },
    { rank: 7, team: '2016 Champ', owner: 'Davis Conway', wins: 7, losses: 6, pointsFor: 1386, result: 'Consolation' },
    { rank: 8, team: 'Weezy - The Story Continues', owner: 'J Weezy', wins: 6, losses: 7, pointsFor: 1226, result: 'Consolation' },
    { rank: 9, team: 'You Winston, You Lose Some', owner: 'Curtis Monts', wins: 5, losses: 8, pointsFor: 1178, result: 'Toilet Bowl' },
    { rank: 10, team: 'Mary Washington Fire Ants', owner: 'Dino Nicandros', wins: 2, losses: 11, pointsFor: 980, result: 'Toilet Bowl' },
    { rank: 11, team: 'The Jimmy G Experience', owner: 'James Holcomb', wins: 2, losses: 11, pointsFor: 980, result: 'Toilet Bowl' },
    { rank: 12, team: 'Trust the Process', owner: 'William Holcomb', wins: 3, losses: 10, pointsFor: 1056, result: 'Toilet Bowl' },
    { rank: 13, team: 'Pretzel Day Pirates', owner: 'Josh Alexander', wins: 0, losses: 13, pointsFor: 927, result: 'Toilet Bowl' },
    { rank: 14, team: 'The Scranton Stranglers', owner: 'Johnny Holcomb', wins: 5, losses: 8, pointsFor: 1091, result: 'Toilet Bowl' },
  ],
};

// Championship leaders - sorted by titles
const championshipLeaders: ChampionshipLeader[] = [
  { rank: 1, owner: 'Ben Holcomb', team: 'The Sylvan Park Forresters', titles: 4, years: '2018, 2019, 2022, 2023' },
  { rank: 2, owner: 'Dino Nicandros', team: 'The West NY Mary Washington Fire Ants', titles: 2, years: '2020, 2021' },
  { rank: 3, owner: 'John Aicklen', team: 'The Germantown Gamblers', titles: 1, years: '2017' },
  { rank: 4, owner: 'James Holcomb', team: 'The Florida Area Ken Francis Experience', titles: 1, years: '2024' },
];

// MVP history - TBD for actual data
const mvpHistory: MVPRecord[] = [
  { season: 2024, player: 'TBD', position: 'TBD', owner: 'James Holcomb', keyStats: 'Season MVP' },
  { season: 2023, player: 'TBD', position: 'TBD', owner: 'Ben Holcomb', keyStats: 'Season MVP' },
  { season: 2022, player: 'TBD', position: 'TBD', owner: 'Ben Holcomb', keyStats: 'Season MVP' },
  { season: 2021, player: 'TBD', position: 'TBD', owner: 'Dino Nicandros', keyStats: 'Season MVP' },
  { season: 2020, player: 'TBD', position: 'TBD', owner: 'Dino Nicandros', keyStats: 'Season MVP' },
  { season: 2019, player: 'TBD', position: 'TBD', owner: 'Ben Holcomb', keyStats: 'Season MVP' },
  { season: 2018, player: 'TBD', position: 'TBD', owner: 'Ben Holcomb', keyStats: 'Season MVP' },
  { season: 2017, player: 'TBD', position: 'TBD', owner: 'John Aicklen', keyStats: 'Season MVP' },
];

// League records - based on real data
const leagueRecords: LeagueRecord[] = [
  { category: 'Best Regular Season', record: '13-0', holder: 'Ben Holcomb', season: 2018 },
  { category: 'Best Regular Season', record: '13-0', holder: 'Ben Holcomb', season: 2019 },
  { category: 'Most Points (Season)', record: '2,176 pts', holder: 'Ben Holcomb', season: 2018 },
  { category: 'Most Championships', record: '4 titles', holder: 'Ben Holcomb', season: 2023 },
  { category: 'Best Win %', record: '79.3%', holder: 'Ben Holcomb', season: 2024 },
  { category: 'Most Playoff Appearances', record: '8 of 9 seasons', holder: 'Ben Holcomb', season: 2024 },
  { category: 'Best Playoff Win %', record: '77%', holder: 'Ben Holcomb', season: 2024 },
  { category: 'Worst Regular Season', record: '0-13', holder: 'Carlos Evans', season: 2022 },
];

const availableSeasons = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];

// Calculate Historical Dominance Index (HDi)
// HDi = (Championships * 40) + (Playoff Wins * 5) + (Win% * 30) + (Avg Finish Inverse * 25)
interface HDiEntry {
  rank: number;
  owner: string;
  team: string;
  hdi: number;
  championships: number;
  playoffWins: number;
  winPct: number;
  avgFinish: number;
}

const calculateHDi = (): HDiEntry[] => {
  const hdiData = owners.map(owner => {
    const totalGames = owner.totalWins + owner.totalLosses;
    const winPct = totalGames > 0 ? owner.totalWins / totalGames : 0;
    const avgFinishInverse = (11 - owner.avgFinish) / 10; // Invert so lower avg finish = higher score
    
    const hdi = (owner.championships * 40) + 
                (owner.playoffWins * 5) + 
                (winPct * 30) + 
                (avgFinishInverse * 25);
    
    return {
      owner: owner.name,
      team: owner.teamName,
      hdi: Math.round(hdi * 10) / 10,
      championships: owner.championships,
      playoffWins: owner.playoffWins,
      winPct: Math.round(winPct * 1000) / 10,
      avgFinish: owner.avgFinish,
    };
  }).sort((a, b) => b.hdi - a.hdi);

  return hdiData.map((entry, index) => ({ ...entry, rank: index + 1 }));
};

// Most Points For leaderboard (career total)
interface PointsForLeader {
  rank: number;
  owner: string;
  team: string;
  totalPoints: number;
  yearsActive: number;
  avgPerYear: number;
}

const calculatePointsForLeaders = (): PointsForLeader[] => {
  const pointsData = owners.map(owner => {
    const totalPoints = owner.avgPointsPerYear * owner.yearsActive;
    return {
      owner: owner.name,
      team: owner.teamName,
      totalPoints: Math.round(totalPoints * 10) / 10,
      yearsActive: owner.yearsActive,
      avgPerYear: owner.avgPointsPerYear,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  return pointsData.map((entry, index) => ({ ...entry, rank: index + 1 }));
};

const HistoricAnalytics = () => {
  const hdiLeaderboard = calculateHDi();
  const pointsForLeaderboard = calculatePointsForLeaders();

  // Owner Stats columns (from Stats page)
  const ownerColumns: Column<Owner & { record: number; winPct: number; playoffRecord: number }>[] = [
    {
      key: 'name',
      label: 'Owner',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-semibold">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.teamName}</p>
        </div>
      ),
    },
    {
      key: 'yearsActive',
      label: 'Years',
      sortable: true,
      align: 'center',
      render: (value) => <span className="font-mono">{value as number}</span>,
    },
    {
      key: 'record',
      label: 'W-L',
      sortable: true,
      align: 'center',
      render: (_, row) => (
        <span className="font-mono">
          <span className="text-win">{row.totalWins}</span>
          <span className="text-muted-foreground">-</span>
          <span className="text-loss">{row.totalLosses}</span>
        </span>
      ),
    },
    {
      key: 'winPct',
      label: 'Win %',
      sortable: true,
      align: 'center',
      render: (_, row) => {
        const total = row.totalWins + row.totalLosses;
        const pct = total > 0 ? (row.totalWins / total) * 100 : 0;
        return <span className="font-mono">{pct.toFixed(1)}%</span>;
      },
    },
    {
      key: 'championships',
      label: 'Champs',
      sortable: true,
      align: 'center',
      render: (value) => {
        const champs = value as number;
        return (
          <div className="flex items-center justify-center gap-1">
            {champs > 0 && <Trophy size={14} className="text-gold" />}
            <span className={cn('font-mono font-bold', champs > 0 && 'text-gold')}>
              {champs}
            </span>
          </div>
        );
      },
    },
    {
      key: 'playoffAppearances',
      label: 'Playoffs',
      sortable: true,
      align: 'center',
      render: (value) => {
        const apps = value as number;
        return (
          <div className="flex items-center justify-center gap-1">
            {apps > 0 && <Target size={14} className="text-accent" />}
            <span className="font-mono">{apps}</span>
          </div>
        );
      },
    },
    {
      key: 'playoffRecord',
      label: 'Playoff W-L',
      sortable: true,
      align: 'center',
      render: (_, row) => (
        <span className="font-mono">
          <span className="text-win">{row.playoffWins}</span>
          <span className="text-muted-foreground">-</span>
          <span className="text-loss">{row.playoffLosses}</span>
        </span>
      ),
    },
    {
      key: 'avgPointsPerYear',
      label: 'Avg Pts/Yr',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="font-mono">{(value as number).toFixed(1)}</span>
      ),
    },
    {
      key: 'avgFinish',
      label: 'Avg Finish',
      sortable: true,
      align: 'center',
      render: (value) => {
        const avg = value as number;
        return (
          <span className={cn(
            'font-mono font-semibold',
            avg <= 3 && 'text-win',
            avg >= 7 && 'text-loss'
          )}>
            {avg.toFixed(1)}
          </span>
        );
      },
    },
    {
      key: 'bestFinish',
      label: 'Best',
      sortable: true,
      align: 'center',
      render: (value) => {
        const best = value as number;
        return (
          <div className="flex items-center justify-center gap-1">
            {best === 1 && <Trophy size={12} className="text-gold" />}
            {best === 2 && <Medal size={12} className="text-muted-foreground" />}
            {best === 3 && <Medal size={12} className="text-amber-700" />}
            <span className={cn('font-mono', best <= 3 && 'text-gold')}>{best}</span>
          </div>
        );
      },
    },
    {
      key: 'worstFinish',
      label: 'Worst',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className="font-mono text-muted-foreground">{value as number}</span>
      ),
    },
  ];

  // Add computed fields for sorting
  const ownersWithComputed = owners.map((owner) => ({
    ...owner,
    record: owner.totalWins - owner.totalLosses,
    winPct: owner.totalWins + owner.totalLosses > 0 
      ? owner.totalWins / (owner.totalWins + owner.totalLosses) 
      : 0,
    playoffRecord: owner.playoffWins - owner.playoffLosses,
  }));

  const standingsColumns: Column<SeasonStanding>[] = [
    { 
      key: 'rank', 
      label: '#', 
      sortable: true, 
      align: 'center', 
      render: (v) => <span className="font-mono font-bold">{v as number}</span> 
    },
    { 
      key: 'team', 
      label: 'Team', 
      sortable: true, 
      render: (v) => <span className="font-semibold">{v as string}</span> 
    },
    { key: 'owner', label: 'Governor', sortable: true },
    { 
      key: 'wins', 
      label: 'W', 
      sortable: true, 
      align: 'center', 
      render: (v) => <span className="text-win font-semibold">{v as number}</span> 
    },
    { 
      key: 'losses', 
      label: 'L', 
      sortable: true, 
      align: 'center', 
      render: (v) => <span className="text-loss">{v as number}</span> 
    },
    { 
      key: 'pointsFor', 
      label: 'Points For', 
      sortable: true, 
      align: 'right', 
      render: (v) => <span className="font-mono">{(v as number).toFixed(1)}</span> 
    },
    { 
      key: 'result', 
      label: 'Result', 
      sortable: true, 
      render: (v) => {
        const result = v as string;
        return (
          <span className={cn(
            'font-semibold',
            result === 'Champion' && 'text-gold',
            result === 'Runner-Up' && 'text-accent',
            result === '3rd Place' && 'text-amber-600',
            result === 'Semifinalist' && 'text-blue-400',
            result === 'Purgatory' && 'text-yellow-500',
            result === 'Toilet Bowl' && 'text-muted-foreground'
          )}>
            {result}
          </span>
        );
      }
    },
  ];

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">HISTORIC ANALYTICS</h1>
            <p className="text-muted-foreground">
              The complete historical record of Men's League excellence.
            </p>
          </motion.div>

          {/* Section 1: Owner Stats Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="h-6 w-6 text-gold" />
              <h2 className="font-display text-2xl font-bold">All-Time Owner Stats</h2>
            </div>
            <SortableTable
              data={ownersWithComputed}
              columns={ownerColumns}
              defaultSortKey="championships"
              className="shadow-md"
            />
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-gold" />
                <span>Championship Winner</span>
              </div>
              <div className="flex items-center gap-2">
                <Target size={16} className="text-accent" />
                <span>Playoff Appearances</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-win">W</span>
                <span>Wins</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-loss">L</span>
                <span>Losses</span>
              </div>
            </div>
          </motion.div>

          {/* Section 2: Season-by-Season Standings (Accordions) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="h-6 w-6 text-accent" />
              <h2 className="font-display text-2xl font-bold">Season-by-Season Standings</h2>
            </div>
            <Accordion type="single" collapsible defaultValue="2024" className="space-y-2">
              {availableSeasons.map((season) => {
                const standings = seasonStandings[season] || [];
                return (
                  <AccordionItem key={season} value={season.toString()} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4">
                        <span className="font-display text-xl font-bold">{season}</span>
                        <span className="text-sm text-muted-foreground">
                          Champion: {standings.find(s => s.result === 'Champion')?.owner || 'N/A'}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {standings.length > 0 ? (
                        <SortableTable
                          data={standings}
                          columns={standingsColumns}
                          defaultSortKey="rank"
                          className="mt-4"
                        />
                      ) : (
                        <p className="text-muted-foreground py-4">No data available for this season.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <Target className="h-6 w-6 text-accent" />
              <h2 className="font-display text-2xl font-bold">Most Points For (Career)</h2>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-center font-semibold w-12">#</th>
                    <th className="px-4 py-3 text-left font-semibold">Governor</th>
                    <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Team</th>
                    <th className="px-4 py-3 text-center font-semibold">Years</th>
                    <th className="px-4 py-3 text-right font-semibold hidden sm:table-cell">Avg/Year</th>
                    <th className="px-4 py-3 text-right font-semibold">Total Points</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsForLeaderboard.map((entry, index) => (
                    <tr 
                      key={entry.owner} 
                      className={cn(
                        'border-t',
                        index % 2 === 0 && 'bg-muted/20',
                        index === 0 && 'bg-accent/10'
                      )}
                    >
                      <td className="px-4 py-3 text-center font-mono font-bold">{entry.rank}</td>
                      <td className="px-4 py-3 font-semibold">{entry.owner}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{entry.team}</td>
                      <td className="px-4 py-3 text-center">{entry.yearsActive}</td>
                      <td className="px-4 py-3 text-right font-mono hidden sm:table-cell">{entry.avgPerYear.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          "font-mono font-bold text-lg",
                          index === 0 && "text-accent",
                          index === 1 && "text-accent/80",
                          index === 2 && "text-accent/60"
                        )}>
                          {entry.totalPoints.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Section 4: Championship Leaders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <Crown className="h-6 w-6 text-gold" />
              <h2 className="font-display text-2xl font-bold">Championship Leaders</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {championshipLeaders.map((leader, index) => (
                <div
                  key={leader.owner}
                  className={cn(
                    'rounded-lg border p-6 text-center',
                    index === 0 && 'bg-gold/10 border-gold/30',
                    index === 1 && 'bg-muted/50 border-muted-foreground/30',
                    index === 2 && 'bg-amber-900/20 border-amber-700/30'
                  )}
                >
                  <div className="text-4xl font-bold mb-2">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                  </div>
                  <h3 className="font-display text-xl font-bold">{leader.owner}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{leader.team}</p>
                  <div className="text-3xl font-bold text-gold mb-1">{leader.titles}</div>
                  <p className="text-sm text-muted-foreground">
                    {leader.titles === 1 ? 'Championship' : 'Championships'}
                  </p>
                  <p className="text-xs text-accent mt-2">{leader.years}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Section 6: League Records */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <Zap className="h-6 w-6 text-yellow-500" />
              <h2 className="font-display text-2xl font-bold">League Records</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {leagueRecords.map((record) => (
                <div
                  key={record.category}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{record.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {record.holder} • {record.season}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-lg text-accent">{record.record}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Section 7: Year-by-Year W-L Records */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-6 w-6 text-accent" />
              <h2 className="font-display text-2xl font-bold">Year-by-Year W-L Records</h2>
            </div>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-center font-semibold">Year</th>
                    <th className="px-4 py-3 text-center font-semibold italic">Dino</th>
                    <th className="px-4 py-3 text-center font-semibold italic">Ben</th>
                    <th className="px-4 py-3 text-center font-semibold italic">Carlos</th>
                    <th className="px-4 py-3 text-center font-semibold italic">James</th>
                    <th className="px-4 py-3 text-center font-semibold italic">William</th>
                    <th className="px-4 py-3 text-center font-semibold italic">Johnny</th>
                    <th className="px-4 py-3 text-center font-semibold italic">Aicklen</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { year: 2017, records: ['2-11', '11-2', '9-4', '2-11', '3-10', '5-8', '11-2'] },
                    { year: 2018, records: ['11-2', '13-0', '11-2', '5-8', '12-1', '6-7', '11-2'] },
                    { year: 2019, records: ['5-8', '13-0', '10-3', '11-2', '9-4', '4-9', '4-9'] },
                    { year: 2020, records: ['6-6', '4-8', '8-4', '11-1', '2-10', '6-6', '8-4'] },
                    { year: 2021, records: ['11-2', '10-3', '8-5', '6-7', '4-9', '1-12', '3-10'] },
                    { year: 2022, records: ['2-11', '12-1', '0-13', '5-8', '11-2', '13-0', '8-5'] },
                    { year: 2023, records: ['3-10', '10-3', '6-7', '7-6', '6-7', '10-3', '7-6'] },
                    { year: 2024, records: ['8-5', '8-5', '7-6', '5-8', '8-5', '5-8', '6-7'] },
                    { year: 2025, records: ['5-6', '11-2', '8-3', '3-9', '6-6', '6-5', '3-9'] },
                  ].map((row, index) => (
                    <tr key={row.year} className={cn('border-t', index % 2 === 0 && 'bg-muted/20')}>
                      <td className="px-4 py-3 text-center font-bold">{row.year}</td>
                      {row.records.map((record, i) => (
                        <td key={i} className="px-4 py-3 text-center font-mono">{record}</td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t bg-primary/10 font-bold">
                    <td className="px-4 py-3 text-center">Overall W-L</td>
                    <td className="px-4 py-3 text-center font-mono">53-61</td>
                    <td className="px-4 py-3 text-center font-mono">92-24</td>
                    <td className="px-4 py-3 text-center font-mono">67-47</td>
                    <td className="px-4 py-3 text-center font-mono">55-60</td>
                    <td className="px-4 py-3 text-center font-mono">61-54</td>
                    <td className="px-4 py-3 text-center font-mono">56-59</td>
                    <td className="px-4 py-3 text-center font-mono">61-54</td>
                  </tr>
                  <tr className="border-t bg-accent/10 font-bold">
                    <td className="px-4 py-3 text-center">Winning %</td>
                    <td className="px-4 py-3 text-center font-mono">46.4%</td>
                    <td className="px-4 py-3 text-center font-mono text-gold">79.3%</td>
                    <td className="px-4 py-3 text-center font-mono">58.8%</td>
                    <td className="px-4 py-3 text-center font-mono">50.0%</td>
                    <td className="px-4 py-3 text-center font-mono">53.0%</td>
                    <td className="px-4 py-3 text-center font-mono">48.6%</td>
                    <td className="px-4 py-3 text-center font-mono">53.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Section 8: Leaderboard Tables Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mb-16"
          >
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Fantasy HDi */}
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-primary/20 px-4 py-3 text-center border-b">
                  <h3 className="font-display font-bold text-lg">FANTASY HDi</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-center font-semibold w-10">#</th>
                      <th className="px-3 py-2 text-left font-semibold">Governor</th>
                      <th className="px-3 py-2 text-right font-semibold">HDi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Dino', score: 55.45 },
                      { name: 'Ben', score: 55.10 },
                      { name: 'Aicklen', score: 43.88 },
                      { name: 'James', score: 42.62 },
                      { name: 'Carlos', score: 40.42 },
                      { name: 'Tyler', score: 40.04 },
                      { name: 'Blake', score: 35.22 },
                      { name: 'Hobart', score: 30.36 },
                      { name: 'Texas', score: 22.85 },
                      { name: 'William', score: 20.68 },
                      { name: 'Brett', score: 17.04 },
                      { name: 'Jackson', score: 15.65 },
                      { name: 'Curtis', score: 15.13 },
                      { name: 'Davis', score: 13.92 },
                      { name: 'Johnny', score: 13.56 },
                      { name: 'J. Alexander', score: 13.38 },
                      { name: 'Matt Beck', score: 13.15 },
                      { name: 'J Weezy', score: 10.48 },
                    ].map((entry, index) => (
                      <tr key={entry.name} className={cn('border-t', index % 2 === 0 && 'bg-muted/20')}>
                        <td className="px-3 py-2 text-center font-mono">{index + 1}</td>
                        <td className="px-3 py-2 font-semibold">{entry.name}</td>
                        <td className={cn(
                          "px-3 py-2 text-right font-mono font-bold",
                          index === 0 && "text-gold",
                          index === 1 && "text-accent",
                          index === 2 && "text-amber-600"
                        )}>{entry.score.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Average Points For */}
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-primary/20 px-4 py-3 text-center border-b">
                  <h3 className="font-display font-bold text-lg">Average Points For</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-center font-semibold w-10">#</th>
                      <th className="px-3 py-2 text-left font-semibold">Name</th>
                      <th className="px-3 py-2 text-right font-semibold">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Ben', score: 1750 },
                      { name: 'Tyler', score: 1637 },
                      { name: 'Carlos', score: 1608 },
                      { name: 'Jackson', score: 1543 },
                      { name: 'Aicklen', score: 1459 },
                      { name: 'Dino', score: 1433 },
                      { name: 'Blake', score: 1425 },
                      { name: 'James', score: 1421 },
                      { name: 'Hobart', score: 1409 },
                      { name: 'William', score: 1363 },
                      { name: 'Davis', score: 1342 },
                      { name: 'Texas', score: 1321 },
                      { name: 'Brett', score: 1269 },
                      { name: 'Matt Beck', score: 1254 },
                      { name: 'J. Alexander', score: 1245 },
                      { name: 'Johnny', score: 1215 },
                      { name: 'Curtis', score: 1178 },
                      { name: 'J Weezy', score: 1130 },
                    ].map((entry, index) => (
                      <tr key={entry.name} className={cn('border-t', index % 2 === 0 && 'bg-muted/20')}>
                        <td className="px-3 py-2 text-center font-mono">{index + 1}</td>
                        <td className="px-3 py-2 font-semibold">{entry.name}</td>
                        <td className={cn(
                          "px-3 py-2 text-right font-mono font-bold",
                          index === 0 && "text-gold",
                          index === 1 && "text-accent",
                          index === 2 && "text-amber-600"
                        )}>{entry.score.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Avg Aggregate Points Per Season */}
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-primary/20 px-4 py-3 text-center border-b">
                  <h3 className="font-display font-bold text-lg">Avg. Aggregate Points Per Season</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-center font-semibold w-10">#</th>
                      <th className="px-3 py-2 text-left font-semibold">Name</th>
                      <th className="px-3 py-2 text-right font-semibold">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Tyler', score: 256 },
                      { name: 'Ben', score: 249 },
                      { name: 'Carlos', score: 211 },
                      { name: 'Texas', score: 174 },
                      { name: 'Aicklen', score: 170 },
                      { name: 'Hobart', score: 167 },
                      { name: 'Dino', score: 163 },
                      { name: 'James', score: 154 },
                      { name: 'William', score: 147 },
                      { name: 'Blake', score: 140 },
                      { name: 'Curtis', score: 135 },
                      { name: 'Davis', score: 133 },
                      { name: 'J. Alexander', score: 124 },
                      { name: 'Jackson', score: 123 },
                      { name: 'Matt Beck', score: 116 },
                      { name: 'Brett', score: 115 },
                      { name: 'Johnny', score: 109 },
                      { name: 'J Weezy', score: 91 },
                    ].map((entry, index) => (
                      <tr key={entry.name} className={cn('border-t', index % 2 === 0 && 'bg-muted/20')}>
                        <td className="px-3 py-2 text-center font-mono">{index + 1}</td>
                        <td className="px-3 py-2 font-semibold">{entry.name}</td>
                        <td className={cn(
                          "px-3 py-2 text-right font-mono font-bold",
                          index === 0 && "text-gold",
                          index === 1 && "text-accent",
                          index === 2 && "text-amber-600"
                        )}>{entry.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default HistoricAnalytics;
