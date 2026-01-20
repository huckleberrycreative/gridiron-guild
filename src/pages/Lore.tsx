import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Trophy, Target, Flame, Award, ArrowRightLeft, Check, X } from 'lucide-react';

interface Trade {
  date: string;
  team1: string;
  gave1: string[];
  team2: string;
  gave2: string[];
  impact: string;
}

interface PlayoffMatchup {
  round: string;
  team1: string;
  team1Seed: number;
  team1Score: number;
  team2: string;
  team2Seed: number;
  team2Score: number;
  winner: string;
}

interface PlayoffBracket {
  seeds: { seed: number; team: string; owner: string }[];
  semifinals: PlayoffMatchup[];
  finals: PlayoffMatchup;
  thirdPlace: PlayoffMatchup;
  consolation: { winner: string; loser: string };
}

interface SeasonLore {
  year: number;
  summary: string;
  champion: string;
  championTeam: string;
  runnerUp: string;
  runnerUpTeam: string;
  mvp: string;
  mvpStats: string;
  biggestStory: string;
  toiletBowl: string;
  notableEvents: string[];
  consequentialTrades: Trade[];
  playoffs: PlayoffBracket;
}

const seasonLore: SeasonLore[] = [
  {
    year: 2025,
    summary: "The 2025 season saw the Sylvan Park Forresters dominate the regular season with 172 points accumulated, but the playoffs told a different story. The Nashville Kats, seeded 4th, stormed through the bracket and claimed the championship in a thrilling upset over the top-seeded Forresters.",
    champion: "Jackson Ferrell",
    championTeam: "Nashville Kats",
    runnerUp: "Ben Holcomb",
    runnerUpTeam: "Sylvan Park Forresters",
    mvp: "TBD",
    mvpStats: "Season MVP to be determined",
    biggestStory: "Jackson Ferrell's Nashville Kats pulled off the ultimate underdog run, defeating the regular season champion in the finals.",
    toiletBowl: "Nepo Beach Guppies",
    notableEvents: [
      "Ben Holcomb's Forresters finished with the best regular season record (11-2)",
      "The Nashville Kats upset the #1 seed in the championship",
      "Carlos Evans' Franklin Fanatics claimed 3rd place with 285.3 points in the consolation",
      "5-team playoff format continued for the 9th season",
    ],
    consequentialTrades: [],
    playoffs: {
      seeds: [
        { seed: 1, team: "Sylvan Park Forresters", owner: "Ben Holcomb" },
        { seed: 2, team: "Franklin Fanatics", owner: "Carlos Evans" },
        { seed: 3, team: "Abbottabad Geronimos", owner: "John Holcomb" },
        { seed: 4, team: "Nashville Kats", owner: "Jackson Ferrell" },
        { seed: 5, team: "Queen City Harambes", owner: "Bill Holcomb" },
      ],
      semifinals: [
        { round: "Semifinal 1", team1: "Sylvan Park Forresters", team1Seed: 1, team1Score: 166.1, team2: "Nashville Kats", team2Seed: 4, team2Score: 145.3, winner: "Top 2 scores advance" },
        { round: "Semifinal 2", team1: "Franklin Fanatics", team1Seed: 2, team1Score: 129.4, team2: "Abbottabad Geronimos", team2Seed: 3, team2Score: 93.8, winner: "Top 2 scores advance" },
      ],
      finals: { round: "Championship", team1: "Sylvan Park Forresters", team1Seed: 1, team1Score: 263.9, team2: "Nashville Kats", team2Seed: 4, team2Score: 266.5, winner: "Nashville Kats" },
      thirdPlace: { round: "3rd Place", team1: "Franklin Fanatics", team1Seed: 2, team1Score: 285.3, team2: "Abbottabad Geronimos", team2Seed: 3, team2Score: 239.4, winner: "Franklin Fanatics" },
      consolation: { winner: "West NY Mary Washington Fire Ants", loser: "Nepo Beach Guppies" },
    },
  },
  {
    year: 2024,
    summary: "Ben Holcomb's Sylvan Park Forresters captured their 4th championship, defeating Carlos Evans' Franklin Fanatics in a hard-fought finals. Dino Nicandros secured 3rd place with an impressive consolation performance.",
    champion: "Ben Holcomb",
    championTeam: "Sylvan Park Forresters",
    runnerUp: "Carlos Evans",
    runnerUpTeam: "Franklin Fanatics",
    mvp: "TBD",
    mvpStats: "Season MVP statistics",
    biggestStory: "Ben's continued dominance added another championship to his legendary career.",
    toiletBowl: "TBD",
    notableEvents: [
      "Ben Holcomb won his 4th championship",
      "Close semifinals with all four top seeds advancing",
      "Bill Holcomb's 5th seed eliminated early",
    ],
    consequentialTrades: [],
    playoffs: {
      seeds: [
        { seed: 1, team: "Sylvan Park Forresters", owner: "Ben Holcomb" },
        { seed: 2, team: "West NY Mary Washington Fire Ants", owner: "Dino Nicandros" },
        { seed: 3, team: "Germantown Gamblers", owner: "John Aicklen" },
        { seed: 4, team: "Franklin Fanatics", owner: "Carlos Evans" },
        { seed: 5, team: "Queen City Harambes", owner: "Bill Holcomb" },
      ],
      semifinals: [
        { round: "Semifinal 1", team1: "Sylvan Park Forresters", team1Seed: 1, team1Score: 155.5, team2: "Franklin Fanatics", team2Seed: 4, team2Score: 158.4, winner: "Top 2 scores advance" },
        { round: "Semifinal 2", team1: "West NY Mary Washington Fire Ants", team1Seed: 2, team1Score: 126.7, team2: "Germantown Gamblers", team2Seed: 3, team2Score: 136.3, winner: "Top 2 scores advance" },
      ],
      finals: { round: "Championship", team1: "Franklin Fanatics", team1Seed: 4, team1Score: 234, team2: "Sylvan Park Forresters", team2Seed: 1, team2Score: 267.1, winner: "Sylvan Park Forresters" },
      thirdPlace: { round: "3rd Place", team1: "West NY Mary Washington Fire Ants", team1Seed: 2, team1Score: 281.2, team2: "Germantown Gamblers", team2Seed: 3, team2Score: 278.7, winner: "West NY Mary Washington Fire Ants" },
      consolation: { winner: "Queen City Harambes", loser: "TBD" },
    },
  },
  {
    year: 2023,
    summary: "Ben Holcomb's dynasty continued with his 3rd championship. Jackson Ferrell's Nashville Kats made a surprise run to the 3rd place game, showing the depth of competition in the league. John Aicklen's Germantown Gamblers fell just short in the finals.",
    champion: "Ben Holcomb",
    championTeam: "Sylvan Park Forresters",
    runnerUp: "John Aicklen",
    runnerUpTeam: "Germantown Gamblers",
    mvp: "TBD",
    mvpStats: "Season MVP statistics",
    biggestStory: "Ben's third title cemented his status as the league's greatest governor.",
    toiletBowl: "TBD",
    notableEvents: [
      "Ben won his 3rd championship in dominant fashion",
      "Jackson Ferrell finished 3rd with an impressive consolation run",
      "The league saw increased parity throughout the regular season",
    ],
    consequentialTrades: [],
    playoffs: {
      seeds: [
        { seed: 1, team: "Sylvan Park Forresters", owner: "Ben Holcomb" },
        { seed: 2, team: "Abbottabad Geronimos", owner: "John Holcomb" },
        { seed: 3, team: "Nashville Kats", owner: "Jackson Ferrell" },
        { seed: 4, team: "Germantown Gamblers", owner: "John Aicklen" },
        { seed: 5, team: "Miami Area Ken Francis Experience", owner: "James Holcomb" },
      ],
      semifinals: [
        { round: "Semifinal 1", team1: "Sylvan Park Forresters", team1Seed: 1, team1Score: 133.1, team2: "Germantown Gamblers", team2Seed: 4, team2Score: 121.9, winner: "Top 2 scores advance" },
        { round: "Semifinal 2", team1: "Abbottabad Geronimos", team1Seed: 2, team1Score: 117.6, team2: "Nashville Kats", team2Seed: 3, team2Score: 113.7, winner: "Top 2 scores advance" },
      ],
      finals: { round: "Championship", team1: "Sylvan Park Forresters", team1Seed: 1, team1Score: 259, team2: "Germantown Gamblers", team2Seed: 4, team2Score: 239.9, winner: "Sylvan Park Forresters" },
      thirdPlace: { round: "3rd Place", team1: "Nashville Kats", team1Seed: 3, team1Score: 329.1, team2: "Abbottabad Geronimos", team2Seed: 2, team2Score: 247.8, winner: "Nashville Kats" },
      consolation: { winner: "TBD", loser: "TBD" },
    },
  },
  {
    year: 2022,
    summary: "Ben Holcomb's Sylvan Park Forresters claimed another championship, defeating John Holcomb's Abbottabad Geronimos in the finals. The Holcomb family dominance was on full display with family members finishing 1st and 2nd.",
    champion: "Ben Holcomb",
    championTeam: "Sylvan Park Forresters",
    runnerUp: "John Holcomb",
    runnerUpTeam: "Abbottabad Geronimos",
    mvp: "TBD",
    mvpStats: "Season MVP statistics",
    biggestStory: "The Holcomb brothers faced off in the championship game.",
    toiletBowl: "TBD",
    notableEvents: [
      "John Holcomb's Geronimos went 13-0 in the regular season but lost in the finals",
      "Ben won despite being the #1 seed by only a narrow margin",
      "Family rivalry reached its peak with the Holcomb championship showdown",
    ],
    consequentialTrades: [],
    playoffs: {
      seeds: [
        { seed: 1, team: "Sylvan Park Forresters", owner: "Ben Holcomb" },
        { seed: 2, team: "Abbottabad Geronimos", owner: "John Holcomb" },
        { seed: 3, team: "Queen City Harambes", owner: "Bill Holcomb" },
        { seed: 4, team: "Germantown Gamblers", owner: "John Aicklen" },
        { seed: 5, team: "Miami Area Ken Francis Experience", owner: "James Holcomb" },
      ],
      semifinals: [
        { round: "Semifinal 1", team1: "Sylvan Park Forresters", team1Seed: 1, team1Score: 161.5, team2: "Germantown Gamblers", team2Seed: 4, team2Score: 121.3, winner: "Top 2 scores advance" },
        { round: "Semifinal 2", team1: "Abbottabad Geronimos", team1Seed: 2, team1Score: 143.8, team2: "Queen City Harambes", team2Seed: 3, team2Score: 121.9, winner: "Top 2 scores advance" },
      ],
      finals: { round: "Championship", team1: "Sylvan Park Forresters", team1Seed: 1, team1Score: 271.7, team2: "Abbottabad Geronimos", team2Seed: 2, team2Score: 221.2, winner: "Sylvan Park Forresters" },
      thirdPlace: { round: "3rd Place", team1: "Queen City Harambes", team1Seed: 3, team1Score: 242.1, team2: "Germantown Gamblers", team2Seed: 4, team2Score: 228.5, winner: "Queen City Harambes" },
      consolation: { winner: "TBD", loser: "TBD" },
    },
  },
  {
    year: 2021,
    summary: "Dino Nicandros captured his 2nd championship with the West NY Mary Washington Fire Ants, defeating Ben Holcomb in the finals. This broke Ben's attempt at a three-peat and established Dino as a legitimate contender for dynasty greatness.",
    champion: "Dino Nicandros",
    championTeam: "West NY Mary Washington Fire Ants",
    runnerUp: "Ben Holcomb",
    runnerUpTeam: "Sylvan Park Forresters",
    mvp: "TBD",
    mvpStats: "Season MVP statistics",
    biggestStory: "Dino denied Ben a three-peat with a dominant finals performance.",
    toiletBowl: "TBD",
    notableEvents: [
      "Dino's Fire Ants finished 11-2 in the regular season",
      "Ben Holcomb fell short in his bid for three consecutive championships",
      "Blake Blacklidge's team showed improvement reaching the playoffs",
    ],
    consequentialTrades: [],
    playoffs: {
      seeds: [
        { seed: 1, team: "West NY Mary Washington Fire Ants", owner: "Dino Nicandros" },
        { seed: 2, team: "Sylvan Park Forresters", owner: "Ben Holcomb" },
        { seed: 3, team: "Nepo Beach Guppies", owner: "Blake Blacklidge" },
        { seed: 4, team: "Franklin Fanatics", owner: "Carlos Evans" },
        { seed: 5, team: "TBD", owner: "TBD" },
      ],
      semifinals: [
        { round: "Semifinal 1", team1: "West NY Mary Washington Fire Ants", team1Seed: 1, team1Score: 153, team2: "Franklin Fanatics", team2Seed: 4, team2Score: 149, winner: "Top 2 scores advance" },
        { round: "Semifinal 2", team1: "Sylvan Park Forresters", team1Seed: 2, team1Score: 169, team2: "Nepo Beach Guppies", team2Seed: 3, team2Score: 111, winner: "Top 2 scores advance" },
      ],
      finals: { round: "Championship", team1: "West NY Mary Washington Fire Ants", team1Seed: 1, team1Score: 332, team2: "Sylvan Park Forresters", team2Seed: 2, team2Score: 257, winner: "West NY Mary Washington Fire Ants" },
      thirdPlace: { round: "3rd Place", team1: "Franklin Fanatics", team1Seed: 4, team1Score: 256.2, team2: "Nepo Beach Guppies", team2Seed: 3, team2Score: 198.4, winner: "Franklin Fanatics" },
      consolation: { winner: "TBD", loser: "TBD" },
    },
  },
  {
    year: 2020,
    summary: "James Holcomb's Miami Area Ken Francis Experience captured the championship in a COVID-shortened season. Dino Nicandros emerged as the unlikely finalist but couldn't overcome James in the finals.",
    champion: "James Holcomb",
    championTeam: "Miami Area Ken Francis Experience",
    runnerUp: "Dino Nicandros",
    runnerUpTeam: "West NY Mary Washington Fire Ants",
    mvp: "TBD",
    mvpStats: "Season MVP statistics",
    biggestStory: "James Holcomb's only championship came in a season unlike any other.",
    toiletBowl: "TBD",
    notableEvents: [
      "COVID-19 impacted the NFL and fantasy football significantly",
      "James Holcomb won his first and only championship to date",
      "Dino Nicandros reached his first finals appearance",
    ],
    consequentialTrades: [],
    playoffs: {
      seeds: [
        { seed: 1, team: "Miami Area Ken Francis Experience", owner: "James Holcomb" },
        { seed: 2, team: "Franklin Fanatics", owner: "Carlos Evans" },
        { seed: 3, team: "West NY Mary Washington Fire Ants", owner: "Dino Nicandros" },
        { seed: 4, team: "Germantown Gamblers", owner: "John Aicklen" },
        { seed: 5, team: "TBD", owner: "TBD" },
      ],
      semifinals: [
        { round: "Semifinal 1", team1: "Miami Area Ken Francis Experience", team1Seed: 1, team1Score: 228, team2: "Germantown Gamblers", team2Seed: 4, team2Score: 249, winner: "Top 2 scores advance" },
        { round: "Semifinal 2", team1: "West NY Mary Washington Fire Ants", team1Seed: 3, team1Score: 262, team2: "Franklin Fanatics", team2Seed: 2, team2Score: 250, winner: "Top 2 scores advance" },
      ],
      finals: { round: "Championship", team1: "West NY Mary Washington Fire Ants", team1Seed: 3, team1Score: 218, team2: "Germantown Gamblers", team2Seed: 4, team2Score: 217, winner: "West NY Mary Washington Fire Ants" },
      thirdPlace: { round: "3rd Place", team1: "Franklin Fanatics", team1Seed: 2, team1Score: 275.3, team2: "Miami Area Ken Francis Experience", team2Seed: 1, team2Score: 248.6, winner: "Franklin Fanatics" },
      consolation: { winner: "TBD", loser: "TBD" },
    },
  },
  {
    year: 2019,
    summary: "Ben Holcomb went undefeated in the regular season (13-0) but couldn't finish the job in the playoffs. James Holcomb's surprise finals appearance ended with a loss, but the experience would fuel his 2020 championship run.",
    champion: "Ben Holcomb",
    championTeam: "Sylvan Park Forresters",
    runnerUp: "James Holcomb",
    runnerUpTeam: "Miami Area Ken Francis Experience",
    mvp: "TBD",
    mvpStats: "Season MVP statistics",
    biggestStory: "Ben's perfect regular season translated to playoff success.",
    toiletBowl: "TBD",
    notableEvents: [
      "Ben Holcomb completed a perfect 13-0 regular season",
      "James Holcomb reached his first finals",
      "Family rivalries intensified with multiple Holcombs in contention",
    ],
    consequentialTrades: [],
    playoffs: {
      seeds: [
        { seed: 1, team: "Sylvan Park Forresters", owner: "Ben Holcomb" },
        { seed: 2, team: "TBD", owner: "TBD" },
        { seed: 3, team: "Franklin Fanatics", owner: "Carlos Evans" },
        { seed: 4, team: "Miami Area Ken Francis Experience", owner: "James Holcomb" },
        { seed: 5, team: "TBD", owner: "TBD" },
      ],
      semifinals: [
        { round: "Semifinal 1", team1: "Miami Area Ken Francis Experience", team1Seed: 4, team1Score: 280, team2: "Sylvan Park Forresters", team2Seed: 1, team2Score: 258, winner: "Top 2 scores advance" },
        { round: "Semifinal 2", team1: "Abbottabad Geronimos", team1Seed: 2, team1Score: 267, team2: "Franklin Fanatics", team2Seed: 3, team2Score: 253, winner: "Top 2 scores advance" },
      ],
      finals: { round: "Championship", team1: "Miami Area Ken Francis Experience", team1Seed: 4, team1Score: 215, team2: "Sylvan Park Forresters", team2Seed: 1, team2Score: 268.8, winner: "Sylvan Park Forresters" },
      thirdPlace: { round: "3rd Place", team1: "Abbottabad Geronimos", team1Seed: 2, team1Score: 211, team2: "Franklin Fanatics", team2Seed: 3, team2Score: 237.2, winner: "Franklin Fanatics" },
      consolation: { winner: "TBD", loser: "TBD" },
    },
  },
  {
    year: 2018,
    summary: "Ben Holcomb established his dynasty with a second consecutive championship, going 13-0 in the regular season. The Forresters dominated from start to finish, leaving no doubt about their supremacy.",
    champion: "Ben Holcomb",
    championTeam: "Sylvan Park Forresters",
    runnerUp: "Dino Nicandros",
    runnerUpTeam: "West NY Mary Washington Fire Ants",
    mvp: "TBD",
    mvpStats: "Season MVP statistics",
    biggestStory: "Ben's back-to-back championships announced a new dynasty.",
    toiletBowl: "TBD",
    notableEvents: [
      "Ben completed his second consecutive perfect regular season",
      "Dino Nicandros reached his first championship game",
      "The league saw increasing competitiveness overall",
    ],
    consequentialTrades: [],
    playoffs: {
      seeds: [
        { seed: 1, team: "Sylvan Park Forresters", owner: "Ben Holcomb" },
        { seed: 2, team: "Franklin Fanatics", owner: "Carlos Evans" },
        { seed: 3, team: "Chicago Dawgs", owner: "Will Hobart" },
        { seed: 4, team: "West NY Mary Washington Fire Ants", owner: "Dino Nicandros" },
        { seed: 5, team: "TBD", owner: "TBD" },
      ],
      semifinals: [
        { round: "Semifinal 1", team1: "Sylvan Park Forresters", team1Seed: 1, team1Score: 326, team2: "West NY Mary Washington Fire Ants", team2Seed: 4, team2Score: 264, winner: "Top 2 scores advance" },
        { round: "Semifinal 2", team1: "Franklin Fanatics", team1Seed: 2, team1Score: 245, team2: "Chicago Dawgs", team2Seed: 3, team2Score: 191, winner: "Top 2 scores advance" },
      ],
      finals: { round: "Championship", team1: "Sylvan Park Forresters", team1Seed: 1, team1Score: 370, team2: "West NY Mary Washington Fire Ants", team2Seed: 4, team2Score: 232, winner: "Sylvan Park Forresters" },
      thirdPlace: { round: "3rd Place", team1: "Franklin Fanatics", team1Seed: 2, team1Score: 267.4, team2: "Chicago Dawgs", team2Seed: 3, team2Score: 224.1, winner: "Franklin Fanatics" },
      consolation: { winner: "TBD", loser: "TBD" },
    },
  },
  {
    year: 2017,
    summary: "The inaugural season of Men's League saw John Aicklen's Germantown Gamblers claim the first-ever championship. Ben Holcomb finished 1st in the regular season but fell short in the playoffs, setting the stage for his future dominance.",
    champion: "John Aicklen",
    championTeam: "Germantown Gamblers",
    runnerUp: "Will Hobart",
    runnerUpTeam: "Chicago Dawgs",
    mvp: "TBD",
    mvpStats: "Season MVP statistics",
    biggestStory: "The league was founded and John Aicklen became the first champion.",
    toiletBowl: "TBD",
    notableEvents: [
      "The league was founded with 10 governors signing the original Constitution",
      "Ben Holcomb finished 1st in the regular season but lost in the playoffs",
      "John Aicklen claimed the inaugural championship trophy",
      "The foundation was laid for years of competitive fantasy football",
    ],
    consequentialTrades: [],
    playoffs: {
      seeds: [
        { seed: 1, team: "Sylvan Park Forresters", owner: "Ben Holcomb" },
        { seed: 2, team: "Germantown Gamblers", owner: "John Aicklen" },
        { seed: 3, team: "TBD", owner: "TBD" },
        { seed: 4, team: "Chicago Dawgs", owner: "Will Hobart" },
        { seed: 5, team: "TBD", owner: "TBD" },
      ],
      semifinals: [
        { round: "Semifinal 1", team1: "Sylvan Park Forresters", team1Seed: 1, team1Score: 216, team2: "Chicago Dawgs", team2Seed: 4, team2Score: 269, winner: "Top 2 scores advance" },
        { round: "Semifinal 2", team1: "Germantown Gamblers", team1Seed: 2, team1Score: 285, team2: "Queen City Harambes", team2Seed: 3, team2Score: 254, winner: "Top 2 scores advance" },
      ],
      finals: { round: "Championship", team1: "Germantown Gamblers", team1Seed: 2, team1Score: 232, team2: "Chicago Dawgs", team2Seed: 4, team2Score: 157, winner: "Germantown Gamblers" },
      thirdPlace: { round: "3rd Place", team1: "Sylvan Park Forresters", team1Seed: 1, team1Score: 263, team2: "Queen City Harambes", team2Seed: 3, team2Score: 241.5, winner: "Sylvan Park Forresters" },
      consolation: { winner: "TBD", loser: "TBD" },
    },
  },
];

const Lore = () => {
  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">THE LORE</h1>
            <p className="text-muted-foreground">
              A comprehensive history of Men's League, season by season.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {seasonLore.map((season, index) => (
                <AccordionItem
                  key={season.year}
                  value={`season-${season.year}`}
                  className="bg-card rounded-lg border border-border overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/5">
                    <div className="flex items-center gap-4 text-left">
                      <span className="font-display text-2xl font-bold text-accent">
                        {season.year}
                      </span>
                      <div>
                        <span className="font-semibold block">
                          Champion: {season.championTeam}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {season.champion} • MVP: {season.mvp}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-6 pt-4">
                      {/* Season Summary */}
                      <div>
                        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">
                          Season Summary
                        </h3>
                        <p className="text-foreground leading-relaxed">{season.summary}</p>
                      </div>

                      {/* Playoff Bracket */}
                      <div className="bg-gradient-to-br from-gold/20 to-gold/5 rounded-lg p-5 border border-gold/30">
                        <div className="flex items-center gap-2 mb-4">
                          <Trophy className="text-gold" size={20} />
                          <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                            Playoff Bracket
                          </h3>
                        </div>

                        {/* Seeding */}
                        <div className="mb-4">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Playoff Seeds</p>
                          <div className="flex flex-wrap gap-2">
                            {season.playoffs.seeds.map((s) => (
                              <div key={s.seed} className="flex items-center gap-1.5 bg-card/50 px-2 py-1 rounded text-xs">
                                <span className="font-bold text-accent">#{s.seed}</span>
                                <span className="font-semibold">{s.team}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bracket Matchups */}
                        <div className="space-y-3">
                          {/* Semifinals - Top 2 Scores Advance */}
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Semifinals · Top 2 Scores Advance</p>
                            {(() => {
                              // Collect all semifinal teams with their scores
                              const allSemifinalTeams = season.playoffs.seeds.map((s) => {
                                // Find this team's score from semifinals
                                let score = 0;
                                for (const game of season.playoffs.semifinals) {
                                  if (game.team1 === s.team) score = game.team1Score;
                                  if (game.team2 === s.team) score = game.team2Score;
                                }
                                return { ...s, score };
                              });
                              
                              // Sort by score descending to determine top 2
                              const sortedByScore = [...allSemifinalTeams].sort((a, b) => b.score - a.score);
                              const top2Teams = new Set(sortedByScore.slice(0, 2).map(t => t.team));
                              
                              return (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                  {allSemifinalTeams.map((team) => {
                                    const isAdvancing = top2Teams.has(team.team);
                                    return (
                                      <div 
                                        key={team.seed} 
                                        className={`rounded-lg border p-3 text-center transition-colors ${
                                          isAdvancing 
                                            ? 'bg-green-500/15 border-green-500/40' 
                                            : 'bg-red-500/10 border-red-500/30'
                                        }`}
                                      >
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                          {isAdvancing ? (
                                            <Check className="text-green-500" size={16} />
                                          ) : (
                                            <X className="text-red-400" size={16} />
                                          )}
                                          <span className="text-xs text-accent font-bold">#{team.seed}</span>
                                        </div>
                                        <p className={`text-xs font-semibold leading-tight mb-1 ${isAdvancing ? 'text-foreground' : 'text-muted-foreground'}`}>
                                          {team.team}
                                        </p>
                                        <p className={`font-mono text-sm font-bold ${isAdvancing ? 'text-green-600 dark:text-green-400' : 'text-red-500/80'}`}>
                                          {team.score.toFixed(1)}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Finals & 3rd Place */}
                          <div className="grid md:grid-cols-2 gap-3">
                            {/* Championship */}
                            <div>
                              <p className="text-xs text-gold uppercase tracking-wider mb-2 font-bold">Championship</p>
                              <div className="bg-gradient-to-r from-gold/20 to-gold/10 rounded border-2 border-gold/50 p-3">
                                <div className={`flex justify-between items-center text-sm mb-1 ${season.playoffs.finals.winner === season.playoffs.finals.team1 ? 'font-bold' : 'text-muted-foreground'}`}>
                                  <span className="flex items-center gap-1.5">
                                    <span className="text-xs text-gold">#{season.playoffs.finals.team1Seed}</span>
                                    {season.playoffs.finals.team1}
                                    {season.playoffs.finals.winner === season.playoffs.finals.team1 && <Trophy className="text-gold" size={14} />}
                                  </span>
                                  <span className="font-mono">{season.playoffs.finals.team1Score.toFixed(1)}</span>
                                </div>
                                <div className={`flex justify-between items-center text-sm ${season.playoffs.finals.winner === season.playoffs.finals.team2 ? 'font-bold' : 'text-muted-foreground'}`}>
                                  <span className="flex items-center gap-1.5">
                                    <span className="text-xs text-gold">#{season.playoffs.finals.team2Seed}</span>
                                    {season.playoffs.finals.team2}
                                    {season.playoffs.finals.winner === season.playoffs.finals.team2 && <Trophy className="text-gold" size={14} />}
                                  </span>
                                  <span className="font-mono">{season.playoffs.finals.team2Score.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>

                            {/* 3rd Place */}
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">3rd Place Game</p>
                              <div className="bg-card/60 rounded border border-border p-3">
                                <div className={`flex justify-between items-center text-sm mb-1 ${season.playoffs.thirdPlace.winner === season.playoffs.thirdPlace.team1 ? 'font-bold' : 'text-muted-foreground'}`}>
                                  <span className="flex items-center gap-1.5">
                                    <span className="text-xs text-accent">#{season.playoffs.thirdPlace.team1Seed}</span>
                                    {season.playoffs.thirdPlace.team1}
                                    {season.playoffs.thirdPlace.winner === season.playoffs.thirdPlace.team1 && <span className="text-green-500">✓</span>}
                                  </span>
                                  <span className="font-mono">{season.playoffs.thirdPlace.team1Score.toFixed(1)}</span>
                                </div>
                                <div className={`flex justify-between items-center text-sm ${season.playoffs.thirdPlace.winner === season.playoffs.thirdPlace.team2 ? 'font-bold' : 'text-muted-foreground'}`}>
                                  <span className="flex items-center gap-1.5">
                                    <span className="text-xs text-accent">#{season.playoffs.thirdPlace.team2Seed}</span>
                                    {season.playoffs.thirdPlace.team2}
                                    {season.playoffs.thirdPlace.winner === season.playoffs.thirdPlace.team2 && <span className="text-green-500">✓</span>}
                                  </span>
                                  <span className="font-mono">{season.playoffs.thirdPlace.team2Score.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Consolation */}
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Consolation Bracket</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span>
                                <span className="text-muted-foreground">Winner:</span>{" "}
                                <span className="font-semibold">{season.playoffs.consolation.winner}</span>
                              </span>
                              <span className="text-muted-foreground">|</span>
                              <span>
                                <span className="text-muted-foreground">Toilet Bowl:</span>{" "}
                                <span className="text-red-400">{season.playoffs.consolation.loser}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* MVP */}
                      <div className="bg-accent/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="text-accent" size={20} />
                          <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                            League MVP
                          </h3>
                        </div>
                        <p className="font-semibold text-lg mb-1">{season.mvp}</p>
                        <p className="text-sm text-muted-foreground">{season.mvpStats}</p>
                      </div>

                      {/* Biggest Story */}
                      <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-accent">
                        <div className="flex items-center gap-2 mb-2">
                          <Flame className="text-orange-500" size={18} />
                          <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                            The Biggest Story
                          </h3>
                        </div>
                        <p className="text-foreground">{season.biggestStory}</p>
                      </div>

                      {/* Most Consequential Trades */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowRightLeft className="text-accent" size={18} />
                          <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
                            Most Consequential Trades
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {season.consequentialTrades.map((trade, i) => (
                            <div key={i} className="bg-card/50 border border-border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
                                  {trade.date}
                                </span>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4 mb-3">
                                <div className="text-sm">
                                  <span className="font-semibold text-foreground">{trade.team1}</span>
                                  <span className="text-muted-foreground"> gave:</span>
                                  <ul className="mt-1 space-y-0.5">
                                    {trade.gave1.map((item, j) => (
                                      <li key={j} className="text-red-400 text-xs flex items-center gap-1">
                                        <span>−</span> {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="text-sm">
                                  <span className="font-semibold text-foreground">{trade.team2}</span>
                                  <span className="text-muted-foreground"> gave:</span>
                                  <ul className="mt-1 space-y-0.5">
                                    {trade.gave2.map((item, j) => (
                                      <li key={j} className="text-green-500 text-xs flex items-center gap-1">
                                        <span>+</span> {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
                                {trade.impact}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notable Events */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="text-primary" size={18} />
                          <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
                            Notable Events
                          </h3>
                        </div>
                        <ul className="space-y-2">
                          {season.notableEvents.map((event, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-accent mt-1">•</span>
                              <span>{event}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Lore;
