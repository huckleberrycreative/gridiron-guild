import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'lead'; text: string }
  | { kind: 'sub'; text: string }
  | { kind: 'list'; items: string[] };

interface Section {
  id: string;
  title: string;
  kicker?: string;
  blocks: Block[];
}

const p = (text: string): Block => ({ kind: 'p', text });
const lead = (text: string): Block => ({ kind: 'lead', text });
const sub = (text: string): Block => ({ kind: 'sub', text });
const list = (items: string[]): Block => ({ kind: 'list', items });

const preamble: Section = {
  id: 'preamble',
  title: 'Preamble',
  blocks: [
    lead(
      "We the People of the Men's League, in order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defense, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for our Fantasy League:"
    ),
  ],
};

const articleI: Section = {
  id: 'article-i',
  title: 'Article I',
  kicker: 'The Framework',
  blocks: [
    p(
      "Men's League was born out of the shared belief that traditional fantasy football formats were preventing our constituents from self-actualization. Breaking from the tyranny of the masses, we built a new league from the ground up with our own Bill of Rights:"
    ),
  ],
};

interface AmendmentEntry {
  ordinal: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  closing?: string[];
}

const billOfRights: AmendmentEntry[] = [
  {
    ordinal: '1st',
    title: 'The Free Market',
    paragraphs: [
      'The league is a free market. If something is not explicitly defined within this constitution, it is legal until challenged in a court of law governed by The Shield.',
    ],
  },
  {
    ordinal: '2nd',
    title: 'The Abolition of Head-to-Head',
    paragraphs: [
      'In a competition in which one cannot play defense, head-to-head scoring makes no sense, and must be abolished.',
    ],
  },
  {
    ordinal: '3rd',
    title: 'The Sanctity of the Regular Season',
    paragraphs: [
      'In order for our regular season to matter, the playoffs must never include more than fifty percent of teams.',
    ],
  },
  {
    ordinal: '4th',
    title: 'The Starting Lineup',
    paragraphs: [
      "Kickers and Defenses are second-class citizens and must be banished from our rosters. The Men's League nine man starting lineups must consist of one quarterback, two running backs, two wide receivers, three flex spots, and one offensive utility position.",
    ],
  },
  {
    ordinal: '5th',
    title: 'A Shared History',
    paragraphs: [
      'In order to build a shared history, our league must carry over from season to season. The best way to accomplish this is through a salary cap format.',
    ],
  },
  {
    ordinal: '6th',
    title: 'League Dues',
    paragraphs: [
      'Inflation is out of control in this country due to entitlements, endless wars, and general government incompetence. Because of that, league dues will go up by $25 every year, beginning with a $150 buy-in for the 2026 season.',
    ],
  },
  {
    ordinal: '7th',
    title: 'Proportional Payouts',
    paragraphs: [
      'In light of this unceasing inflationary nightmare, our league payouts must be written in a manner proportional to the pot.',
    ],
    bullets: [
      'League Champion: eighty percent of the total pot.',
      'Regular Season Champion: five percent of the total pot.',
      'Most weekly first place finishes: two percent of the total pot.',
      'Highest scoring team each week: one percent of the total pot, paid out in the form of "Coffee on the Shield" venmos.',
    ],
    closing: [
      'The tiebreaker for "Most First Place Finishes" is determined by adding up the collective margin of victories in the winning weeks for each team, and awarding the prize to the team with the highest point total.',
    ],
  },
  {
    ordinal: '8th',
    title: 'The League Year & The Fall Draft',
    paragraphs: [
      'The league year officially begins on August 1st of each calendar year. At 12:00am on this day, all normal league activities resume, which includes legal roster moves and trades.',
      "The Fall Draft must take place at the latest possible time before the NFL's opening game, with the understanding that the time must work for all league Governors. Governors who show a willful disinterest in moving their lives around to accommodate our draft will be subject to relegation at the Commish's discretion.",
      "The Fall Draft is an auction draft format, and each team begins the season with $1,000 in fall draft capital by default. This also serves as our league's de facto salary cap, as it relates to player salaries, keepers, and subsequent fall draft budgets.",
    ],
  },
  {
    ordinal: '9th',
    title: 'The Rookie Draft',
    paragraphs: [
      "Each year, within one week of the actual NFL Draft, Men's League comes together to host their annual Rookie Draft. This is a three-round, thirty pick draft where Governors draft the rights to incoming rookie players.",
      "The draft is ordered in the inverse of the prior season's finish, with the top five picks decided by a lottery, conducted minutes before the draft under supervision of the MLPA President.",
    ],
    bullets: [
      'Toilet Bowl 1st Place: fifty percent odds.',
      'Toilet Bowl 2nd Place: thirty percent odds.',
      'Toilet Bowl 3rd Place: ten percent odds.',
      'Toilet Bowl 4th Place: seven percent odds.',
      'Toilet Bowl 5th Place: three percent odds.',
    ],
  },
  {
    ordinal: '10th',
    title: 'Rookie Salaries',
    paragraphs: [
      'Each rookie is assigned a two-season salary associated with the round in which they were drafted:',
    ],
    bullets: [
      'First round picks carry a fifty dollar salary.',
      'Second round picks carry a twenty-five dollar salary.',
      'Third round picks carry a one dollar salary.',
    ],
    closing: [
      "These salaries kick in the following league year, effectively maintaining a rookie's salary for three seasons.",
    ],
  },
  {
    ordinal: '11th',
    title: 'The Draft Lottery',
    paragraphs: [
      "The draft is ordered in the inverse of the prior season's finish, with the top five picks decided by a lottery, conducted minutes before the draft under supervision of the MLPA President. This draft order is maintained across all three rounds.",
    ],
  },
  {
    ordinal: '12th',
    title: 'The Practice Squad',
    paragraphs: [
      "Each team has a practice squad consisting of three spots. Rookies on a teams' practice squad do not count toward a Governor's cap until they are activated into their lineup. Governors can keep rookies on their practice squad for two full seasons before they have to release them or activate them into their actual roster.",
      'Beginning in week three of the season, opposing teams can sign players off of anyone\u2019s practice squad under a restricted free agency bid. The original Governor can choose to match any offer, but is then forced to elevate that rookie to their active roster.',
      'In order to prevent defensive bids against the spirit of this amendment, any successful RFA bid requires the Governor to allocate the respective player and their salary to their roster on rookie draft day the following year. RFA-winning Governors can free themselves of this burden via trade, only when the trade partner agrees to assume the burden of roster allocation. Importantly, Governors do not actually have to keep a player acquired under this transaction, but they do have to allocate a roster spot and the associated capital as a dead cap hit.',
      "Governors who submit practice squad bids must bid at least one dollar above the player's salary, but there is no limit to the bid they make. The winning team MUST allocate that amount of their salary the next season to this player. Example: if Justin Jefferson were on a practice squad, but it became immediately clear he was a Top 5 WR, a team could bid $250 for him, and either the current Governor could match, in which case his salary would immediately convert to $203, the positional max, or they could let him walk, in which case the bidding team would be locked into keeping Justin Jefferson next year for at least $203.",
      'Because of this bidding mechanism, a team must allocate the salary they bid to their following year\u2019s roster, even if they choose to franchise tag this player. This is meant to prevent teams from bidding $900 and then franchise tagging as a loophole. It\u2019s also meant to settle any multi-bid issues, which would arise if the maximum bid was the positional max.',
    ],
  },
  {
    ordinal: '13th',
    title: 'The Last Place Penalty',
    paragraphs: [
      "The Governor who finishes in last place every season must affix eye-lashes to their car's headlights for the time period between the day after the Championship concludes to the Rookie Draft. For purposes of this punishment, last place means the fifth place finisher in the Men's League toilet bowl tournament.",
      "Governors are also automatically relegated from the league for a period of one year, unless they agree to pay double the league dues the following year. Repeat offenders must pay double their previous year's dues. Theoretically, a relegated team could pay a million dollar league due.",
    ],
  },
  {
    ordinal: '14th',
    title: 'Rivalry Week',
    paragraphs: [
      'The last week of the NFL season prior to byes starting, the league will play a Rivalry Week, in which we abandon our traditional scoring system, and revert back to a single head-to-head matchup against our bitter rivals. The winner of each Rivalry Week matchup will be awarded fifteen points, and the loser of each Rivalry Week matchup will be awarded zero points, and like it.',
    ],
  },
  {
    ordinal: '15th',
    title: 'The Team Captain',
    paragraphs: [
      'As a means of maximizing Governor strategy, each week during the regular season only, Governors will nominate a "Team Captain," whose points will be given a twenty-five percent multiplier at the end of the week. A player can only be team captain twice in the same season, and a team can only captain any quarterback once.',
    ],
  },
  {
    ordinal: '16th',
    title: 'Naming & Relocation',
    paragraphs: [
      'Governors must pick a permanent location for the first half of their team names. Governors may apply for relocation under two circumstances: they physically move, or they submit a proposal to the league and receive a seventy percent supermajority vote of approval. While mascot names can be up to two words, location names must remain two words or less.',
    ],
  },
  {
    ordinal: '17th',
    title: 'The Jailbird Penalty',
    paragraphs: [
      'Governors must pay a ten dollar fine to the Shield every time a player on their active roster is arrested. For enforcement purposes, the league considers a player arrested if they have a mugshot. All jailbird money is applied to operational costs related to running the league, which are substantial, and otherwise handled out of the immense benevolence of our Commish.',
    ],
  },
  {
    ordinal: '18th',
    title: 'The Discord Channel',
    paragraphs: [
      "Starting in 2024, to prevent a spamming of Governors' phones, and to promote a false sense of democracy, the MLPA President will be in charge of creating and managing a Discord channel for league conversations. This channel will consist of separate threads, including but not limited to: #general, #announcements, #trade-announcements, and #official-team-branding.",
    ],
  },
  {
    ordinal: '19th',
    title: 'Expansion',
    paragraphs: [
      "Occasionally, our league is required to explore expansion through the loss of an existing member, relegation, or potentially true expansion beyond ten teams. Our goal with expansion franchises is for those teams to finish fifth in their first season. We don't want to give them an undue advantage, we don't want to punish our beloved existing Governors and their long-term strategies, and we don't want to have our expansion teams start so far behind the eight-ball they're doomed for seasons to come.",
      'In order for our league to be at optimal health, we need ten invested Governors who think they have a chance at the ring. In order to achieve this, our expansion rules are as follows:',
    ],
    bullets: [
      'On Rookie Draft Day, our existing Governors submit their official rosters at five pm.',
      "The expansion franchise Governor is given $1,200 in initial salary cap, and is allowed to fill his roster with as many fall draft pool players as he'd like. The catch: he must take on their existing salaries if he brings them on. Ex: Mike Evans gets released by an existing team, and has a salary of $165. The Expansion Franchise Governor can add him to his roster, but for $165, and his overall salary cap will fall to $1,045.",
      'The Expansion Franchise Governor must review the Fall Draft pool from 5pm to 7pm of Rookie Draft Day. When the Rookie Draft begins, as part of our opening ceremony, we will turn the mic over to him and flip an hour glass. He has sixty seconds to name the players he wants. After that, his pre-rookie/fall draft roster is locked.',
      'When the rookie draft begins, the Expansion Franchise Governor will pick tenth in every round.',
      "The biggest criticism of this plan is that the fall draft could be diluted because of this. We debated this and ultimately decided this concern was both overstated and also the least bad option. There is no perfect solution here, but this one causes the least collateral damage. We also feel that our accelerated salary cap rules will continue making the fall draft pool interesting. Finally, we all accepted that the trade off of being in a perfect, year-round, 365 days, God's-gift-to-Fantasy league, is that the fall draft is perhaps a secondary event to our Rookie Draft Day.",
    ],
  },
];

const articleII: Section = {
  id: 'article-ii',
  title: 'Article II',
  kicker: 'Scoring',
  blocks: [
    p('The language herein is meant to clarify the scoring system for individual players, as well as our weekly standings and playoffs.'),
    sub('Individual Scoring'),
    p(
      "Men's League is a one-half PPR fantasy football league. Passing yards are 0.04 points per, rushing yards are 0.1 points per, and receiving yards are 0.1 points per. All TDs are worth six points, save for passing TDs, which are worth four. Turnovers are worth negative two points. Two point conversions are worth two points. All points are rounded to the nearest tens decimal."
    ),
    sub('Weekly Standings'),
    p(
      'With the abolition of head-to-head, our league operates off a weekly standings competition where every Governor competes against the other nine members in our league. We effectively award two wins and two losses per week, one in the form of finishing in the top fifty percentile, and the other in the form of graduated points based on exact finishing position.'
    ),
    list([
      '1st: twenty points',
      '2nd: eighteen points',
      '3rd: sixteen points',
      '4th: fourteen points',
      '5th: twelve points',
      '6th: five points',
      '7th: four points',
      '8th: three points',
      '9th: two points',
      '10th: one point',
    ]),
    p(
      'The first place finisher each week will receive an extra aggregate point for every twenty points they score above and beyond the second highest scorer that week.'
    ),
    sub('The Playoffs'),
    p(
      "In an eighteen week NFL season, Men's League has a thirteen week regular season and a four week playoff, with week eighteen ignored for our league's purposes. The top five teams advance to our real playoff, and the bottom five teams advance to our Toilet Bowl Tournament, competing for the highest lottery odds for the top pick in our Rookie Draft."
    ),
    p(
      'In both brackets, the number one and number two seed get to choose the highest of their weekly scores from Weeks Fourteen and Fifteen. The number three and number four seed must average their weekly scores from Weeks Fourteen and Fifteen. And the number five seed must choose their lowest weekly score from Weeks Fourteen and Fifteen.'
    ),
    p(
      'Our championship in both brackets becomes a traditional, two-week head-to-head matchup. The consolation games in each bracket are a menage-a-trois between the remaining teams, with Rookie Draft seeding determined by the order of their final scores.'
    ),
  ],
};

const articleIII: Section = {
  id: 'article-iii',
  title: 'Article III',
  kicker: 'Rosters & Salary Cap',
  blocks: [
    p('The language herein is meant to clarify the exact roster machinations of our league, as well as the salary cap system that governs it.'),
    sub('Rosters'),
    p(
      'Active rosters consist of fifteen spots, nine starters and six bench players, with two additional IR spots available to players OUT or worse. Rosters with active players in their IR slots at the time of said player(s) kickoff each week, are deemed null & void and will result in an immediate last place finish that week.'
    ),
    p(
      "Each week, Governors designate a sub, meant to help prevent unjust scoring dips from in-game injuries. If a starting player is injured in the first half and does not play a single snap in the second half, then the Commish will adjust their roster to add their designated sub. This is an automated process, and can be done post-facto once the dust settles."
    ),
    p(
      "Importantly, while a team must have a legal starting lineup positionally at the time of a week's kickoff, their designated sub is their sub. In other words, if for some reason they only had two active RBs, and one got injured, the league would allow a designated sub WR to take that spot, even though it violates the official lineup rules. Furthermore, there is a Gentleman's agreement within the league that a team's highest scoring bench QB would be subbed in should one of a team's starting QBs go down."
    ),
    p(
      "Because this is all automated, the tie always goes to the team who experienced an injured player. If Team A designates a random TE as their sub, but their QB gets injured, and the random TE scores 25 points while Team A's QB3 scores 8, the Shield will sub in the designated sub, as they result in more points. Similarly, if the designated sub scores less than the injured player, no substitution will take place. This rule is in effect to eliminate the randomness of injuries on scoring."
    ),
    sub('Salaries'),
    p(
      "Every team begins each season with a thousand dollar salary cap. A player's salary is determined by the price they were acquired for in a rookie or fall draft. If a player is acquired off of waivers during the regular season, their salary defaults to one dollar. Player salaries progress on a graduated scale:"
    ),
    list([
      'Year 1: Original Value',
      'Year 2: The greater of 1.2x or $125',
      'Year 3: The greater of 1.2x or $150',
      'Year 4+: 90% of Max Positional Value',
    ]),
    p('For purposes of the fourth year above, the Max Positional Values are:'),
    list([
      'QB: $180 (Max: $200)',
      'RB: $257 (Max: $285)',
      'WR: $203 (Max: $225)',
      'TE: $167 (Max: $185)',
    ]),
    sub('Salary Cap'),
    p(
      'Every year on the day of the Rookie Draft, Governors must submit rosters that adhere to one of the following criteria: any six players regardless of their salaries, or any nine players so long as the total budget is equal to or less than six hundred dollars.'
    ),
    p(
      "Should a Governor submit a six-player roster that exceeds the salary cap, they must pay a fifty percent luxury tax in the form of additional league dues. Repeat offenders will pay the luxury tax according to their previous year's dues. Luxury tax offenders will be given nine dollars for their fall draft budget, the minimum allowable amount to fill their roster."
    ),
    sub('The Franchise Tag'),
    p(
      'Each team has two franchise tag slots available on their roster at any one time. They do not have to be used every year, but should a team choose to enact their franchise tag, they can sign a player to a four year contract worth one hundred dollars a season. The cost of this benefit is a penalty for trading a Franchised player before their contract runs up:'
    ),
    list([
      'Year 1: Cap Hit of 150% of Max Positional Value',
      'Year 2: Cap Hit of 75% of Max Positional Value',
      'Year 3: Cap Hit of 50% of Max Positional Value',
      'Year 4: Cap Hit of 25% of Max Positional Value',
    ]),
    p(
      'Should a franchised player experience a severe injury (season ending or worse) or fall into criminal trouble (Deshaun Watson, etc.), owners can release them at half the cost of their trade value (150% to 75%, etc.) depending on the year.'
    ),
    p('Owners must designate Franchise Tag players the day of the Rookie Draft.'),
  ],
};

const articleIV: Section = {
  id: 'article-iv',
  title: 'Article IV',
  kicker: 'Transactions',
  blocks: [
    p('The language herein is meant to clarify the legally defined transactions available to Governors, and any relevant stipulations.'),
    sub('Waivers'),
    p(
      'Starting week one of each season, teams are given one thousand dollars of Free Agent Auction Budget (FAAB) from which to allocate however they choose. After the initial waiver period every week (one day), all free agents are awarded for free on a first-come-first-serve basis.'
    ),
    p(
      'Waivers are shut down at kickoff of Monday Night Football on Week Thirteen, the final week of our regular season. Teams must ride their roster throughout the playoffs, with no mercenary help on the way. Importantly, teams can activate practice squad members to their active rosters during the playoffs. But just as they cannot add players off of waivers during the playoffs, they also cannot add players to their practice squad.'
    ),
    p(
      'For purposes of salary manipulation, a team cannot reacquire a dropped member of their roster unless they first pass waivers. To be clear: this means a team cannot drop a player, immediately bid the highest amount, and reacquire them at a newly one dollar salary. They are allowed to drop any player at any time, and once all other teams have had a chance to bid on that player, without the dropping team bidding themselves, then they are free to be reacquired by any team.'
    ),
    p(
      'Starting August 1st, teams are once again allowed to drop players. If this is done prior to the fall draft, dropped players are added to the fall draft pool. A transaction of this manner will have no effect on fall draft budgets. It is simply a sunken cost for the dropping team.'
    ),
    sub('Trades'),
    p('Teams can officially trade from August 1st to 12pm CST on the Thursday of Week Twelve each season.'),
    p(
      'Trading then reopens for one day only, the day of our Rookie Draft, wherein Governors have the right to trade capital to move up or down in the rookie draft. While there is a legal tampering period, all trades must be processed between 12:01am and 11:59pm CST on the day of the Rookie Draft. Because the Rookie Draft Lottery begins at 7pm, all trades before this will be for the rights to a Governor\u2019s rookie draft odds.'
    ),
    p(
      "Governors have the right to trade their fall auction draft capital (salary money) to other Governors as collateral on the day of the Rookie Draft, and from August 1st until the start of the Fall Auction Draft. Once the fall draft concludes, salary budgets cannot be traded during the regular season, and until the following year's Rookie Draft day commences."
    ),
    p('From August 1st to the trade deadline, a team can trade their waiver money to another team.'),
    p('Practice Squad players are able to be traded during all normal trading windows.'),
    p(
      "Before rosters are finalized on the day of the rookie draft, all players on a team's roster are able to be traded, even the ones a team does not intend to keep. Importantly, any traded player must be a part of the receiving team's submitted salary cap roster."
    ),
  ],
};

const sections: Section[] = [preamble, articleI, articleII, articleIII, articleIV];

const governorSignatures = [
  { name: 'Ben Holcomb', size: 'text-3xl', slant: 'skew-x-3' },
  { name: 'Dino Nicandros', size: 'text-2xl', slant: '-skew-x-2' },
  { name: 'Jackson Ferrell', size: 'text-4xl', slant: 'skew-x-6' },
  { name: 'Bill Holcomb', size: 'text-2xl', slant: 'skew-x-0' },
  { name: 'Johnny Holcomb', size: 'text-3xl', slant: '-skew-x-6' },
  { name: 'James Holcomb', size: 'text-2xl', slant: 'skew-x-2' },
  { name: 'Carlos Evans', size: 'text-4xl', slant: '-skew-x-3' },
  { name: 'Blake Blacklidge', size: 'text-2xl', slant: 'skew-x-1' },
  { name: 'Will Hobart', size: 'text-3xl', slant: '-skew-x-1' },
  { name: 'John Aicklen', size: 'text-2xl', slant: 'skew-x-4' },
];

const Flourish = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 30" fill="currentColor" aria-hidden="true">
    <path
      d="M100 15 C80 15 70 5 50 5 C30 5 20 15 0 15 M100 15 C120 15 130 5 150 5 C170 5 180 15 200 15"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
    <circle cx="100" cy="15" r="3" />
    <circle cx="50" cy="5" r="2" />
    <circle cx="150" cy="5" r="2" />
    <path d="M95 15 L85 10 M95 15 L85 20 M105 15 L115 10 M105 15 L115 20" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

const CornerOrnament = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 60 60" fill="currentColor" aria-hidden="true">
    <path d="M0 60 Q0 30 30 30 Q30 0 60 0" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M5 60 Q5 35 30 35 Q35 5 60 5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
    <circle cx="30" cy="30" r="3" />
    <circle cx="15" cy="45" r="2" opacity="0.7" />
    <circle cx="45" cy="15" r="2" opacity="0.7" />
  </svg>
);

const Rule = () => (
  <div className="flex items-center justify-center gap-4 my-12">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-400 to-transparent" />
    <span className="text-neutral-400 text-xl">❧</span>
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-400 to-transparent" />
  </div>
);

const renderBlocks = (blocks: Block[]) =>
  blocks.map((block, i) => {
    if (block.kind === 'sub') {
      return (
        <h3
          key={i}
          className="font-serif text-center text-sm md:text-base uppercase tracking-[0.35em] text-neutral-700 pt-6"
        >
          {block.text}
        </h3>
      );
    }
    if (block.kind === 'list') {
      return (
        <ul key={i} className="mx-auto max-w-2xl space-y-2 border-y border-neutral-200 py-5">
          {block.items.map((item, j) => (
            <li key={j} className="font-serif text-base md:text-lg text-neutral-800 flex gap-3">
              <span className="text-neutral-400">✦</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <p
        key={i}
        className={cn(
          'font-serif text-black leading-loose text-justify',
          block.kind === 'lead'
            ? 'text-xl md:text-2xl italic first-letter:float-left first-letter:text-6xl first-letter:leading-[0.8] first-letter:pr-3 first-letter:font-bold'
            : 'text-lg md:text-xl'
        )}
      >
        {block.text}
      </p>
    );
  });

const Constitution = () => {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-neutral-50">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Table of Contents */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-neutral-100 border-2 border-neutral-300 overflow-hidden shadow-xl relative">
                  <CornerOrnament className="absolute top-0 left-0 w-8 h-8 text-neutral-400" />
                  <CornerOrnament className="absolute top-0 right-0 w-8 h-8 text-neutral-400 rotate-90" />
                  <div className="bg-neutral-200 p-4 border-b-2 border-neutral-300">
                    <h2 className="font-serif text-sm font-semibold text-neutral-800 uppercase tracking-[0.3em] text-center">
                      Table of Contents
                    </h2>
                  </div>
                  <ScrollArea className="h-[calc(100vh-220px)]">
                    <nav className="p-4 space-y-1">
                      {sections.map((section, index) => (
                        <button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm transition-all font-serif',
                            activeSection === section.id
                              ? 'bg-neutral-300 text-black border-l-2 border-neutral-600'
                              : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
                          )}
                        >
                          <span className="text-neutral-500 text-xs mr-2">{index === 0 ? '✦' : `${index}.`}</span>
                          {section.kicker ? `${section.title}: ${section.kicker}` : section.title}
                        </button>
                      ))}

                      <div className="my-4 border-t border-neutral-300 pt-4">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2 px-3">Bill of Rights</p>
                      </div>

                      {billOfRights.map((amendment) => (
                        <button
                          key={amendment.ordinal}
                          onClick={() => scrollToSection(`amendment-${amendment.ordinal}`)}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm transition-all font-serif',
                            activeSection === `amendment-${amendment.ordinal}`
                              ? 'bg-neutral-300 text-black border-l-2 border-neutral-600'
                              : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
                          )}
                        >
                          <span className="text-neutral-500 text-xs mr-2">{amendment.ordinal}</span>
                          {amendment.title}
                        </button>
                      ))}
                    </nav>
                  </ScrollArea>
                </div>
              </div>
            </div>

            {/* The Document */}
            <div className="lg:col-span-3">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="relative">
                  <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    }}
                  />

                  <div className="relative bg-white border-4 border-double border-neutral-400 p-8 md:p-12 lg:p-16 shadow-2xl">
                    <CornerOrnament className="absolute top-2 left-2 w-12 h-12 text-neutral-400" />
                    <CornerOrnament className="absolute top-2 right-2 w-12 h-12 text-neutral-400 rotate-90" />
                    <CornerOrnament className="absolute bottom-2 left-2 w-12 h-12 text-neutral-400 -rotate-90" />
                    <CornerOrnament className="absolute bottom-2 right-2 w-12 h-12 text-neutral-400 rotate-180" />

                    {/* Masthead */}
                    <header className="text-center mb-14">
                      <Flourish className="w-48 h-8 mx-auto mb-6 text-neutral-400" />
                      <h1 className="font-serif font-black text-4xl md:text-5xl lg:text-6xl mb-4 tracking-wide text-black uppercase">
                        The Men's League Constitution
                      </h1>
                      <p className="font-serif text-lg md:text-xl text-neutral-600 italic tracking-wider">
                        Preserved on the Thirteenth of August, Two Thousand Twenty-Six
                      </p>
                      <Flourish className="w-48 h-8 mx-auto mt-6 text-neutral-400 rotate-180" />
                      <p className="mt-6 font-serif text-sm text-neutral-500 tracking-[0.25em] uppercase">
                        ✦ Established Anno Domini MMXX ✦
                      </p>
                    </header>

                    <Rule />

                    {/* Preamble + Article I */}
                    <div className="space-y-16">
                      {[preamble, articleI].map((section) => (
                        <motion.article
                          key={section.id}
                          id={section.id}
                          initial={{ opacity: 0, y: 16 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-100px' }}
                          transition={{ duration: 0.45 }}
                          onViewportEnter={() => setActiveSection(section.id)}
                          className="scroll-mt-28"
                        >
                          <div className="text-center mb-8">
                            <h2 className="font-serif font-bold text-2xl md:text-3xl text-black tracking-[0.15em] uppercase">
                              {section.title}
                            </h2>
                            {section.kicker && (
                              <p className="font-serif italic text-lg text-neutral-600 mt-1">{section.kicker}</p>
                            )}
                            <div className="w-32 h-px bg-gradient-to-r from-transparent via-neutral-400 to-transparent mx-auto mt-4" />
                          </div>
                          <div className="space-y-6">{renderBlocks(section.blocks)}</div>
                        </motion.article>
                      ))}

                      {/* Bill of Rights */}
                      <div className="space-y-12">
                        {billOfRights.map((amendment) => (
                          <motion.section
                            key={amendment.ordinal}
                            id={`amendment-${amendment.ordinal}`}
                            initial={{ opacity: 0, y: 14 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.4 }}
                            onViewportEnter={() => setActiveSection(`amendment-${amendment.ordinal}`)}
                            className="scroll-mt-28"
                          >
                            <div className="text-center mb-5">
                              <p className="font-serif text-xs uppercase tracking-[0.4em] text-neutral-500">
                                {amendment.ordinal} Amendment
                              </p>
                              <h3 className="font-serif font-bold text-xl md:text-2xl text-black mt-1">
                                {amendment.title}
                              </h3>
                              <div className="w-16 h-px bg-neutral-400 mx-auto mt-3" />
                            </div>
                            <div className="space-y-5">
                              {amendment.paragraphs.map((text, i) => (
                                <p key={i} className="font-serif text-lg md:text-xl text-black leading-loose text-justify">
                                  {text}
                                </p>
                              ))}
                              {amendment.bullets && (
                                <ul className="mx-auto max-w-2xl space-y-2 border-y border-neutral-200 py-5">
                                  {amendment.bullets.map((item, i) => (
                                    <li key={i} className="font-serif text-base md:text-lg text-neutral-800 flex gap-3">
                                      <span className="text-neutral-400">✦</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {amendment.closing?.map((text, i) => (
                                <p key={i} className="font-serif text-lg md:text-xl text-black leading-loose text-justify">
                                  {text}
                                </p>
                              ))}
                            </div>
                          </motion.section>
                        ))}
                      </div>

                      {/* Remaining Articles */}
                      {[articleII, articleIII, articleIV].map((section) => (
                        <motion.article
                          key={section.id}
                          id={section.id}
                          initial={{ opacity: 0, y: 16 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-100px' }}
                          transition={{ duration: 0.45 }}
                          onViewportEnter={() => setActiveSection(section.id)}
                          className="scroll-mt-28"
                        >
                          <Rule />
                          <div className="text-center mb-8">
                            <h2 className="font-serif font-bold text-2xl md:text-3xl text-black tracking-[0.15em] uppercase">
                              {section.title}
                            </h2>
                            {section.kicker && (
                              <p className="font-serif italic text-lg text-neutral-600 mt-1">{section.kicker}</p>
                            )}
                            <div className="w-32 h-px bg-gradient-to-r from-transparent via-neutral-400 to-transparent mx-auto mt-4" />
                          </div>
                          <div className="space-y-6">{renderBlocks(section.blocks)}</div>
                        </motion.article>
                      ))}
                    </div>

                    {/* Ratification */}
                    <div className="mt-20 pt-12 border-t border-neutral-300 text-center">
                      <Flourish className="w-32 h-6 mx-auto mb-8 text-neutral-400" />
                      <p className="font-serif text-lg text-neutral-600 italic mb-6">
                        "In witness whereof, we have hereunto set our hands and seals"
                      </p>
                      <p className="font-serif text-neutral-500 tracking-wide">
                        Ratified in the Year of our Lord Two Thousand and Twenty,
                        <br />
                        by the unanimous consent of the founding Governors.
                      </p>

                      <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-10">
                        {governorSignatures.map((gov) => (
                          <div key={gov.name} className="text-center">
                            <p
                              className={`${gov.size} ${gov.slant} text-neutral-800 mb-1 transform`}
                              style={{ fontFamily: '"Pinyon Script", cursive' }}
                            >
                              {gov.name}
                            </p>
                            <div className="w-24 h-px bg-neutral-400 mx-auto" />
                          </div>
                        ))}
                      </div>

                      <div className="mt-12 inline-block">
                        <div className="w-24 h-24 rounded-full border-4 border-neutral-400 flex items-center justify-center relative">
                          <div className="absolute inset-2 rounded-full border-2 border-neutral-300" />
                          <div className="text-center">
                            <p className="font-serif text-xs text-neutral-500 tracking-widest">SEAL</p>
                            <p className="font-serif text-lg text-neutral-600 font-bold">ML</p>
                            <p className="font-serif text-xs text-neutral-500">2020</p>
                          </div>
                        </div>
                      </div>

                      <Flourish className="w-32 h-6 mx-auto mt-8 text-neutral-400 rotate-180" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Constitution;
