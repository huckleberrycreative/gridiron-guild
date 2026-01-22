import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import '@fontsource/pinyon-script';

interface Amendment {
  id: string;
  title: string;
  content: string[];
}

const amendments: Amendment[] = [
  {
    id: 'preamble',
    title: 'Preamble',
    content: [
      'We the People of the Men\'s League, in order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defense, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for our Fantasy League:',
    ],
  },
  {
    id: 'article-i',
    title: 'Article I: The Framework',
    content: [
      'Men\'s League was born out of the shared belief that traditional fantasy football formats were preventing our constituents from self-actualization. Breaking from the tyranny of the masses, we built a new league from the ground up with our own Bill of Rights:',
      '1. The league is a FREE MARKET. If something is not explicitly defined, it is legal.',
      '2. In a game where one cannot play defense, head-to-head scoring makes no sense, and must be ABOLISHED.',
      '3. In order for our regular season to matter, the playoffs must never include more than 50% of teams.',
      '4. Kickers and Defenses are second-class citizens and must be banished from our rosters. Our 9-man starting lineups will consist of 1 QB, 2 RBs, 2 WRs, 3 Flex Spots, and 1 Offensive Utility Position.',
      '5. In order to build a shared history, our league must carry over from season to season. The best way to accomplish this is through a SALARY CAP FORMAT.',
      '6. Our annual league dues are $100, creating a pot of $1,000. Each season, this pot is distributed in the following manner:',
      '• League Champion: $800',
      '• Regular Season Champion: $50',
      '• Governor with Most Weekly 1st Place Finishes: $20',
      '• The Highest Scorer Each Week: $10 (Except for Rivalry Week)',
    ],
  },
  {
    id: 'article-ii',
    title: 'Article II: Scoring',
    content: [
      'Section 1. Weekly Scoring',
      '• ½ PPR',
      '• 0.1 points per rushing & receiving yard',
      '• 0.04 points per passing yard',
      '• All points are rounded to the nearest tens decimal (IE 0.1)',
      'Section 2. Weekly Standings',
      'With the abolition of H2H, our league operates off a weekly standings competition where every Governor competes against the other 9 members in our league.',
      'Section 3. Scheduling & Playoffs',
      '• In an 18-week NFL season, Men\'s League has a 13-week regular season and a 4-week playoffs, with Week 18 dedicated to the Pro Bowl.',
      '• Wild Card: In Weeks 14-15, Teams 1,2,3,4,5 compete, with the top two teams advancing to the league championship in weeks 16-17. The #1-2 seeds get to pick their highest scoring week from Weeks 14 and 15. The #3-4 seeds must average their two weeks together. And the #5 seed must use their lowest score from Weeks 14-15. This format is used in both the REAL playoffs and the NIT.',
      '• Our championship is a true two-week H2H.',
      '• To preserve the integrity of our league, the waiver wire CLOSES at the start of Wild Card weekend (Week 14).',
      '• THE NIT (Amendment #2021-02): Teams 6-10 in the league will play in a mirrored playoff for rookie draft order.',
    ],
  },
  {
    id: 'article-iii',
    title: 'Article III: Salary Cap Format',
    content: [
      'Section 1. Rosters & Budgets',
      '• Every team begins each season with a $1,000 salary cap.',
      '• Every year on the day of the Rookie Draft, Governors must submit rosters that adhere to one of the following criteria:',
      '  - Any (6) players regardless of their salaries',
      '  - Any (9) players so long as the total budget is equal to or less than $600 (Amendment #2024-05)',
      '• Should a Governor submit a roster that exceeds the salary cap, they must pay a 50% luxury tax in the form of additional league dues (Ex: $100 → $150). Repeat offenders will pay the luxury tax according to their previous year\'s dues (Ex: $150 → $225).',
      'Section 2. Salaries',
      '• League salaries are determined by the price a player is acquired for in each season\'s fall draft.',
      '• If a player is acquired off of waivers, their salary defaults to $1.',
      '• Player salaries are on a graduated scale:',
      '  - Year 1: Original Value',
      '  - Year 2: The Greater of 1.2x or $125',
      '  - Year 3: The Greater of 1.2x or $150',
      '  - Year 4+: 90% of Max Positional Value',
      '• The Max Positional Values are:',
      '  - QB: $200 (Max: $180)',
      '  - RB: $285 (Max: $257)',
      '  - WR: $225 (Max: $203)',
      '  - TE: $185 (Max: $167)',
      'Section 3. The Franchise Tag',
      '• There will officially be (2) Franchise Tag slots for each team. They do not have to be used every year, but should a team choose to enact their franchise tag, they can sign a player to a (4) year contract worth $100/yr. The cost of this benefit is a penalty for trading a Franchised player before their contract runs up:',
      '  - Year 1: Cap Hit of 150% of Max Positional Value',
      '  - Year 2: Cap Hit of 75% of Max Positional Value',
      '  - Year 3: Cap Hit of 50% of Max Positional Value',
      '  - Year 4: Cap Hit of 25% of Max Positional Value',
      '• Should a franchised player experience a severe injury (season ending-worse) or fall into criminal trouble (Deshaun Watson, etc.), owners can release them at ½ the cost of their trade value (150% – 75%, etc.) depending on the year.',
      '• Owners must designate their Franchise Tag players the day of the Rookie Draft.',
      'Section 4. Waivers',
      '• Each player gets $1,000 at the beginning to the year to bid on free agents.',
      '• After the initial waiver period every week (one day), all free agents are first-come-first-serve.',
      '• A team CAN trade their waiver money to another team.',
    ],
  },
  {
    id: 'article-iv',
    title: 'Article IV: The Drafts',
    content: [
      'Section 1. The Fall Draft',
      '• Each year, on August 1, the season officially begins.',
      '• The Fall Draft is an auction format.',
      '• Each team has a $1,000 in Fall Draft budget by default. This budget is affected by their chosen roster construction each season.',
      'Section 2. The Rookie Draft',
      '• Each year, days after the actual NFL Draft, Men\'s League conducts a 3-round rookie draft in a standard format. Order will be decided by a draft lottery live on Zoom, minutes before the draft (for ultimate drama).',
      '• NIT Winner: 50% Odds',
      '• NIT Runner Up: 30% Odds',
      '• NIT 3rd Place: 10% Odds',
      '• NIT 4th Place: 7% Odds',
      '• NIT 5th Place: 3% Odds',
      '• Playoff 5th Place',
      '• Playoff 4th Place',
      '• Playoff 3rd Place',
      '• League Runner-up',
      '• League Champion',
      '• Rookie Salaries:',
      '  - 1st Round Pick: $50',
      '  - 2nd Round Pick: $25',
      '  - 3rd Round Pick: $1',
      '• Rookie Draft Trading (Amendment #2023-1): On one day a year, Governors have the right to trade capital to move up or down in the rookie draft. While there is a legally tampering period, all trades must be processed between 12:01am - 6:59p CST on the day of the Rookie Draft. Because the Rookie Draft Lottery begins at 7pm, all trades before this will be for the rights to a Governor\'s rookie draft odds.',
      '• Importantly, Governors have the right to trade their unused auction draft capital (salary money) to other Governors as collateral in any Rookie Draft trades.',
    ],
  },
];

// Amendment data - styled as sticky notes
const constitutionalAmendments = [
  {
    number: '1st',
    title: 'The Practice Squad',
    color: 'bg-yellow-200',
    rotation: '-rotate-2',
    content: [
      'Each team has a practice squad consisting of (3) spots. Rookies on a teams\' practice squad do not count toward a Governor\'s cap until they are activated into their lineup.',
      'Governors can keep rookies on their practice squad for 2 FULL SEASONS before they have to release them or activate them into their actual roster.',
      'Beginning in Week 3 of the season, opposing teams can sign players off of anyone\'s practice squad for 1.5x their rookie pay scale. This will be treated as RFA. Owners can choose to match + activate their rookie.',
    ],
  },
  {
    number: '2nd',
    title: 'Last Place Penalty',
    color: 'bg-pink-200',
    rotation: 'rotate-1',
    content: [
      'The Governor who finishes in 10th place every season must affix eye-lashes to their car\'s headlights for the time period between the day after the Championship concludes to the Rookie Draft.',
      'Governors are also automatically relegated from the league for a period of one year, UNLESS they agree to pay 2x the league dues the following year. Repeat offenders must pay 2x their previous year\'s dues.',
    ],
  },
  {
    number: '3rd',
    title: 'Rivalry Week',
    color: 'bg-blue-200',
    rotation: '-rotate-1',
    content: [
      'The last week of the NFL season prior to byes starting, the league will play a RIVALRY WEEK, in which we abandon our traditional scoring system, and revert back to a single H2H matchup against your bitter rival.',
      'The winner of each Rivalry Week matchup will be awarded 15 points, and the loser of each Rivalry Week matchup will be awarded 0 points (and like it).',
    ],
  },
  {
    number: '4th',
    title: 'Location Naming Conventions',
    color: 'bg-green-200',
    rotation: 'rotate-2',
    content: [
      'Governors must pick a permanent location for the first half of their team names.',
      'Governors may apply for relocation under two circumstances: (1) They physically move. (2) They submit a proposal to the league and receive a 7/10 supermajority vote of approval.',
      'While mascot names can be (2) words, location names must remain (2) words or less.',
    ],
  },
  {
    number: '5th',
    title: 'The "Team Captain"',
    color: 'bg-orange-200',
    rotation: '-rotate-2',
    content: [
      'As a means of maximizing Governor strategy, each week during the regular season, Governors will nominate a non-QB "Team Captain," whose points will be given a 1.25x multiplier at the end of the week. A player can only be team captain twice in the same season.',
    ],
  },
  {
    number: '6th',
    title: 'The Jailbird Penalty',
    color: 'bg-purple-200',
    rotation: 'rotate-1',
    content: [
      'Governors must pay a $10 fine to the League Offices every time a player on their active roster is arrested. For enforcement purposes, the league considers a player arrested if they have a mugshot.',
      'All jailbird money is applied to operational costs related to the Rookie & Fall drafts.',
    ],
  },
  {
    number: '7th',
    title: 'Adjustment to League Dues',
    color: 'bg-amber-200',
    rotation: '-rotate-1',
    content: [
      'Starting in 2025, league dues will increase by an inflation-adjusted $25 per season:',
      '2025: $125 | 2026: $150 | Etc.',
    ],
  },
  {
    number: '8th',
    title: 'The Pro Bowl',
    color: 'bg-cyan-200',
    rotation: 'rotate-2',
    content: [
      'Starting with the 2024 season, Week 18 will now become the Men\'s League Pro Bowl. From the pool of active Week 18 players, our Governors will use Mensleague.com to collectively vote for that season\'s Pro Bowlers: 2 players from each roster that were the MOST VALUABLE asset. This does not mean highest scorer by default, but can mean someone who outperformed their ADP the most.',
      'The Pro Bowl is Nashville vs. The World format, with the teams broken up in the following way:',
      '• Nashville: Jackson, Ben, William, Johnny, Aicklen',
      '• The World: James, Dino, Blake, Hobart, Carlos',
      'NOTE: Carlos was selected for Team World to make it an even 5-5 split. We made this decision because he lives in Franklin, and because he serves in our Armed Forces, so is the most well-traveled of any Governor.',
      'The losing team will contribute the money for the rookie and fall draft drinks & food.',
    ],
  },
  {
    number: '9th',
    title: 'MFL HONORS',
    color: 'bg-rose-200',
    rotation: '-rotate-2',
    content: [
      'Starting in 2024, MFL Honors will take place at that nice, weird back room behind the velvet curtain at Sports & Social at the Green Hills Mall. This will be a chance for us to watch the Men\'s League Pro Bowl together, and officially hand out various awards TBD. Winners will be selected by anonymous league vote on mensleague.com',
    ],
  },
  {
    number: '10th',
    title: 'Discord Channel',
    color: 'bg-lime-200',
    rotation: 'rotate-1',
    content: [
      'Starting in 2024, to prevent a spamming of Governors\' phones, and to promote a false sense of democracy, the NFLPA will be in charge of creating and managing a Discord channel for league conversations. This channel will consist of (3) separate threads:',
      '• #GuysBeingDudes: just general banter',
      '• #FromtheDeskoftheCommish: important league announcements',
      '• #Transactions: trade announcements',
    ],
  },
];

// Signature styles for each governor - unique variations
const governorSignatures = [
  { name: 'Ben Holcomb', size: 'text-3xl', slant: 'skew-x-3', weight: 'font-normal' },
  { name: 'Dino Nicandros', size: 'text-2xl', slant: '-skew-x-2', weight: 'font-normal' },
  { name: 'Jackson Ferrell', size: 'text-4xl', slant: 'skew-x-6', weight: 'font-normal' },
  { name: 'Bill Holcomb', size: 'text-2xl', slant: 'skew-x-0', weight: 'font-normal' },
  { name: 'Johnny Holcomb', size: 'text-3xl', slant: '-skew-x-6', weight: 'font-normal' },
  { name: 'James Holcomb', size: 'text-2xl', slant: 'skew-x-2', weight: 'font-normal' },
  { name: 'Carlos Evans', size: 'text-4xl', slant: '-skew-x-3', weight: 'font-normal' },
  { name: 'Blake Blacklidge', size: 'text-2xl', slant: 'skew-x-1', weight: 'font-normal' },
  { name: 'Will Hobart', size: 'text-3xl', slant: '-skew-x-1', weight: 'font-normal' },
  { name: 'John Aicklen', size: 'text-2xl', slant: 'skew-x-4', weight: 'font-normal' },
];

// Ornate decorative flourish SVG component
const Flourish = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 30" fill="currentColor">
    <path d="M100 15 C80 15 70 5 50 5 C30 5 20 15 0 15 M100 15 C120 15 130 5 150 5 C170 5 180 15 200 15" 
      stroke="currentColor" strokeWidth="1" fill="none" />
    <circle cx="100" cy="15" r="3" />
    <circle cx="50" cy="5" r="2" />
    <circle cx="150" cy="5" r="2" />
    <path d="M95 15 L85 10 M95 15 L85 20 M105 15 L115 10 M105 15 L115 20" 
      stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

// Corner ornament component
const CornerOrnament = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 60 60" fill="currentColor">
    <path d="M0 60 Q0 30 30 30 Q30 0 60 0" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M5 60 Q5 35 30 35 Q35 5 60 5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
    <circle cx="30" cy="30" r="3" />
    <circle cx="15" cy="45" r="2" opacity="0.7" />
    <circle cx="45" cy="15" r="2" opacity="0.7" />
  </svg>
);

// Thumbtack SVG component - more realistic
const Thumbtack = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 40" fill="currentColor">
    {/* Pin head - dome shape */}
    <ellipse cx="16" cy="8" rx="10" ry="6" fill="#991b1b" />
    <ellipse cx="16" cy="7" rx="8" ry="4" fill="#dc2626" />
    <ellipse cx="14" cy="5" rx="3" ry="1.5" fill="#fca5a5" opacity="0.6" />
    {/* Pin shaft */}
    <path d="M14 12 L16 38 L18 12 Z" fill="#71717a" />
    <path d="M15 12 L16 38 L16.5 12 Z" fill="#a1a1aa" />
  </svg>
);

const Constitution = () => {
  const [activeSection, setActiveSection] = useState(amendments[0].id);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar - Table of Contents */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="sticky top-24"
              >
                <div className="bg-neutral-100 border-2 border-neutral-300 rounded-none overflow-hidden shadow-xl relative">
                  {/* Corner decorations */}
                  <CornerOrnament className="absolute top-0 left-0 w-8 h-8 text-neutral-400" />
                  <CornerOrnament className="absolute top-0 right-0 w-8 h-8 text-neutral-400 rotate-90" />
                  
                  <div className="bg-neutral-200 p-4 border-b-2 border-neutral-300">
                    <h2 className="font-serif text-sm font-semibold text-neutral-800 uppercase tracking-[0.3em] text-center">
                      Table of Contents
                    </h2>
                  </div>
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <nav className="p-4 space-y-1">
                      {amendments.map((amendment, index) => (
                        <button
                          key={amendment.id}
                          onClick={() => scrollToSection(amendment.id)}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-sm text-sm transition-all font-serif',
                            activeSection === amendment.id
                              ? 'bg-neutral-300 text-black border-l-2 border-neutral-600'
                              : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
                          )}
                        >
                          <span className="text-neutral-500 text-xs mr-2">
                            {index === 0 ? '✦' : `${index}.`}
                          </span>
                          {amendment.title}
                        </button>
                      ))}
                      
                      {/* Amendments divider */}
                      <div className="my-4 border-t border-neutral-300 pt-4">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2 px-3">Amendments</p>
                      </div>
                      
                      {constitutionalAmendments.map((amendment) => (
                        <button
                          key={`amend-${amendment.number}`}
                          onClick={() => scrollToSection(`amendment-${amendment.number}`)}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-sm text-sm transition-all font-serif',
                            activeSection === `amendment-${amendment.number}`
                              ? 'bg-neutral-300 text-black border-l-2 border-neutral-600'
                              : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
                          )}
                        >
                          <span className="text-neutral-500 text-xs mr-2">
                            {amendment.number}
                          </span>
                          {amendment.title}
                        </button>
                      ))}
                    </nav>
                  </ScrollArea>
                </div>
              </motion.div>
            </div>

            {/* Main Content - Parchment Style */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* The Document */}
                <div className="relative">
                  {/* Subtle texture background */}
                  <div 
                    className="absolute inset-0 rounded-sm opacity-[0.02]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                  />
                  
                  <div className="relative bg-white border-4 border-double border-neutral-400 p-8 md:p-12 lg:p-16 shadow-2xl">
                    {/* Corner ornaments */}
                    <CornerOrnament className="absolute top-2 left-2 w-12 h-12 text-neutral-400" />
                    <CornerOrnament className="absolute top-2 right-2 w-12 h-12 text-neutral-400 rotate-90" />
                    <CornerOrnament className="absolute bottom-2 left-2 w-12 h-12 text-neutral-400 -rotate-90" />
                    <CornerOrnament className="absolute bottom-2 right-2 w-12 h-12 text-neutral-400 rotate-180" />

                    {/* Header */}
                    <div className="text-center mb-16 relative">
                      <Flourish className="w-48 h-8 mx-auto mb-6 text-neutral-400" />
                      
                      <h1 className="font-oldEnglish text-4xl md:text-5xl lg:text-6xl mb-4 tracking-wide text-black">
                        The Constitution
                      </h1>
                      <p className="font-oldEnglish text-lg md:text-xl text-neutral-600 italic tracking-wider">
                        of Men's League Fantasy Football
                      </p>
                      
                      <Flourish className="w-48 h-8 mx-auto mt-6 text-neutral-400 rotate-180" />
                      
                      {/* Established date */}
                      <div className="mt-8 inline-block">
                        <p className="font-serif text-sm text-neutral-500 tracking-[0.2em] uppercase">
                          ✦ Established Anno Domini MMXX ✦
                        </p>
                      </div>
                    </div>

                    {/* Decorative line */}
                    <div className="flex items-center gap-4 mb-12">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-400 to-transparent" />
                      <div className="text-neutral-400 text-2xl">❧</div>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-400 to-transparent" />
                    </div>

                    {/* Articles */}
                    <div className="space-y-16">
                      {amendments.map((amendment, index) => (
                        <motion.article
                          key={amendment.id}
                          id={amendment.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-100px' }}
                          transition={{ duration: 0.5, delay: 0.05 * index }}
                          className="scroll-mt-28 relative"
                          onViewportEnter={() => setActiveSection(amendment.id)}
                        >
                          {/* Article header */}
                          <div className="text-center mb-8">
                            <div className="flex items-center justify-center gap-3 mb-4">
                              <span className="text-neutral-400">✦</span>
                              <span className="text-neutral-400">✦</span>
                              <span className="text-neutral-400">✦</span>
                            </div>
                            <h2 className="font-oldEnglish text-2xl md:text-3xl text-black tracking-wide">
                              {amendment.title}
                            </h2>
                            <div className="w-32 h-px bg-gradient-to-r from-transparent via-neutral-400 to-transparent mx-auto mt-4" />
                          </div>

                          {/* Article content */}
                          <div className="space-y-6">
                            {amendment.content.map((paragraph, pIndex) => {
                              // Get article number from title (e.g., "Article V" -> 5)
                              const articleMatch = amendment.title.match(/Article ([IVX]+)/);
                              const romanToArabic: Record<string, number> = {
                                'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
                                'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
                              };
                              const articleNum = articleMatch ? romanToArabic[articleMatch[1]] : null;
                              
                              // Bold "Section X." and convert to "Section {article}.{section}"
                              const sectionMatch = paragraph.match(/^Section (\d+)\./);
                              if (sectionMatch && articleNum) {
                                const sectionNum = sectionMatch[1];
                                return (
                                  <p
                                    key={pIndex}
                                    className="font-oldEnglish text-lg md:text-xl text-black leading-loose text-justify"
                                  >
                                    <span className="font-bold">Section {articleNum}.{sectionNum}.</span>
                                    {paragraph.slice(sectionMatch[0].length)}
                                  </p>
                                );
                              }
                              return (
                                <p
                                  key={pIndex}
                                  className="font-oldEnglish text-lg md:text-xl text-black leading-loose text-justify"
                                >
                                  {paragraph}
                                </p>
                              );
                            })}
                          </div>

                          {/* Section divider */}
                          {index < amendments.length - 1 && (
                            <div className="flex items-center justify-center gap-2 mt-12 text-neutral-300">
                              <span>—</span>
                              <span className="text-lg">❦</span>
                              <span>—</span>
                            </div>
                          )}
                        </motion.article>
                      ))}
                    </div>

                    {/* AMENDMENTS SECTION - Sticky Notes (above signatures) */}
                    <div id="amendments-section" className="mt-24 pt-12 border-t-4 border-dashed border-neutral-400 scroll-mt-28">
                      <div className="text-center mb-12">
                        <h2 className="font-oldEnglish text-3xl md:text-4xl text-black tracking-wide">
                          Amendments
                        </h2>
                      </div>

                      <div className="space-y-8">
                        {constitutionalAmendments.map((amendment, index) => (
                          <motion.div
                            key={amendment.number}
                            id={`amendment-${amendment.number}`}
                            initial={{ opacity: 0, y: 20, rotate: index % 2 === 0 ? 3 : -3 }}
                            whileInView={{ opacity: 1, y: 0, rotate: index % 2 === 0 ? 3 : -3 }}
                            whileHover={{ rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            onViewportEnter={() => setActiveSection(`amendment-${amendment.number}`)}
                            className="relative scroll-mt-28 max-w-2xl mx-auto"
                          >
                            {/* Thumbtack */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                              <Thumbtack className="w-8 h-10 drop-shadow-lg" />
                            </div>
                            
                            {/* Sticky Note */}
                            <div 
                              className={`${amendment.color} p-6 pt-8 shadow-lg relative`}
                              style={{
                                boxShadow: '2px 4px 8px rgba(0,0,0,0.2), inset 0 0 40px rgba(255,255,255,0.3)',
                              }}
                            >
                              {/* Folded corner effect */}
                              <div 
                                className="absolute bottom-0 right-0 w-8 h-8"
                                style={{
                                  background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)',
                                }}
                              />
                              
                              <h3 className="font-display text-lg font-bold text-neutral-800 mb-3">
                                {amendment.number} Amendment: {amendment.title}
                              </h3>
                              
                              <div className="space-y-2">
                                {amendment.content.map((paragraph, pIndex) => (
                                  <p key={pIndex} className="text-sm text-neutral-700 leading-relaxed">
                                    {paragraph}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Footer / Ratification */}
                    <div className="mt-20 pt-12 border-t border-neutral-300">
                      <div className="text-center">
                        <Flourish className="w-32 h-6 mx-auto mb-8 text-neutral-400" />
                        
                        <p className="font-serif text-lg text-neutral-600 italic mb-6">
                          "In witness whereof, we have hereunto set our hands and seals"
                        </p>
                        
                        <p className="font-serif text-neutral-500 tracking-wide">
                          Ratified in the Year of our Lord Two Thousand and Twenty,<br />
                          by the unanimous consent of the founding Governors.
                        </p>

                        {/* Signature area */}
                        <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-10">
                          {governorSignatures.map((gov, i) => (
                            <div key={i} className="text-center">
                              <p 
                                className={`${gov.size} ${gov.slant} ${gov.weight} text-neutral-800 mb-1 transform`}
                                style={{ 
                                  fontFamily: '"Pinyon Script", cursive',
                                }}
                              >
                                {gov.name}
                              </p>
                              <div className="w-24 h-px bg-neutral-400 mx-auto" />
                            </div>
                          ))}
                        </div>

                        {/* Seal */}
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
