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
      'We the Governors of Men\'s League, in Order to form a more perfect Fantasy Football Union, establish Justice in weekly matchups, ensure domestic Tranquility between competitors, provide for the common Defense against collusion, promote the general Welfare of fair play, and secure the Blessings of Liberty to ourselves and our Dynasty rosters, do ordain and establish this Constitution for Men\'s League Fantasy Football.',
    ],
  },
  {
    id: 'article-i',
    title: 'Article I: League Structure',
    content: [
      'Section 1. The League shall consist of ten (10) franchises, each led by a Governor who shall bear full responsibility for their roster decisions.',
      'Section 2. The regular season shall span fourteen (14) weeks, followed by a playoff period of three (3) weeks.',
      'Section 3. All Governors shall have one (1) vote in league matters. A simple majority shall decide routine affairs; constitutional amendments require a two-thirds (2/3) supermajority.',
    ],
  },
  {
    id: 'article-ii',
    title: 'Article II: Scoring',
    content: [
      'Section 1. Points shall be awarded based on statistical performance in sanctioned NFL games.',
      'Section 2. The standings shall be determined by aggregate weekly ranking points, not head-to-head record.',
      'Section 3. Weekly rankings: 1st place receives 20 points, 2nd receives 18, 3rd receives 16, 4th receives 14, 5th receives 12, 6th receives 5, 7th receives 4, 8th receives 3, 9th receives 2, 10th receives 1 point.',
    ],
  },
  {
    id: 'article-iii',
    title: 'Article III: Playoffs',
    content: [
      'Section 1. The top four (4) franchises by total standings points shall qualify for the Championship Playoff.',
      'Section 2. The fifth (5th) place franchise shall reside in Purgatory—neither rewarded nor condemned.',
      'Section 3. Franchises ranked sixth (6th) through tenth (10th) shall compete in the Toilet Bowl, Presented by Ruggables™.',
    ],
  },
  {
    id: 'article-iv',
    title: 'Article IV: Draft',
    content: [
      'Section 1. The Rookie Draft shall occur annually in the offseason, following the NFL Draft.',
      'Section 2. Draft order shall be determined by inverse order of final standings, with non-playoff teams receiving lottery consideration.',
      'Section 3. Each franchise shall receive three (3) draft picks per year, one in each round.',
    ],
  },
  {
    id: 'article-v',
    title: 'Article V: Salaries & Contracts',
    content: [
      'Section 1. Player salaries are determined by acquisition price in the annual fall draft.',
      'Section 2. Waiver wire acquisitions shall have a default salary of One Dollar ($1).',
      'Section 3. Salary escalation: Year 2 = Greater of 1.2× or $125; Year 3 = Greater of 1.2× or $150; Year 4+ = 90% of Maximum Positional Value.',
      'Section 4. Each franchise may apply the Franchise Tag to up to two (2) players, locking their salary at $100 for four (4) seasons.',
    ],
  },
  {
    id: 'article-vi',
    title: 'Article VI: Trades',
    content: [
      'Section 1. All trades must be submitted to the Commissioner for review.',
      'Section 2. The League reserves the right to veto trades deemed to constitute collusion or gross competitive imbalance.',
      'Section 3. The trade deadline shall fall on the Monday of Week 10 at 11:59 PM Eastern Time.',
    ],
  },
  {
    id: 'article-vii',
    title: 'Article VII: Conduct',
    content: [
      'Section 1. All Governors shall conduct themselves with honor, integrity, and a healthy sense of trash talk.',
      'Section 2. Failure to set a legal lineup shall result in public shaming and potential league sanctions.',
      'Section 3. Collusion in any form is a capital offense, punishable by immediate expulsion and eternal banishment from the Pantheon.',
    ],
  },
  {
    id: 'article-viii',
    title: 'Article VIII: Amendments',
    content: [
      'Section 1. Proposed amendments must be submitted in writing to the Commissioner.',
      'Section 2. A two-thirds (2/3) supermajority vote of all Governors is required for ratification.',
      'Section 3. Amendments take effect at the start of the following season unless otherwise specified.',
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
      'Each team has a practice squad consisting of (3) spots. Rookies on a team\'s practice squad do not count toward a Governor\'s cap until they are activated into their lineup.',
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
      'As a means of maximizing Governor strategy, each week during the regular season, Governors will nominate a non-QB "Team Captain," whose points will be given a 1.25x multiplier at the end of the week.',
      'A player can only be team captain twice in the same season.',
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
      'Starting with the 2024 season, Week 18 will now become the Men\'s League Pro Bowl. From the pool of active Week 18 players, our Governors will use Mensleague.com to collectively vote for that season\'s Pro Bowlers: 2 players from each roster that were the MOST VALUABLE asset.',
      'The Pro Bowl is Nashville vs. The World format: Nashville (Jackson, Ben, William, Johnny, Aicklen) vs. The World (James, Dino, Blake, Hobart, Carlos).',
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
      'Starting in 2024, MFL Honors will take place at that nice, weird back room behind the velvet curtain at Sports & Social at the Green Hills Mall.',
      'This will be a chance for us to watch the Men\'s League Pro Bowl together, and officially hand out various awards TBD. Winners will be selected by anonymous league vote on mensleague.com.',
    ],
  },
  {
    number: '10th',
    title: 'Discord Channel',
    color: 'bg-lime-200',
    rotation: 'rotate-1',
    content: [
      'Starting in 2024, to prevent a spamming of Governors\' phones, and to promote a false sense of democracy, the NFLPA will be in charge of creating and managing a Discord channel for league conversations.',
      'This channel will consist of (3) separate threads: #GuysBeingDudes (just general banter), #FromtheDeskoftheCommish (important league announcements), #Transactions (trade announcements).',
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

// Thumbtack SVG component
const Thumbtack = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <ellipse cx="12" cy="6" rx="6" ry="4" fill="#b91c1c" />
    <ellipse cx="12" cy="5" rx="4" ry="2.5" fill="#dc2626" />
    <rect x="11" y="8" width="2" height="10" fill="#6b7280" />
    <polygon points="10,18 14,18 12,24" fill="#4b5563" />
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
                        <h2 className="font-oldEnglish text-3xl md:text-4xl text-black tracking-wide mb-2">
                          Amendments
                        </h2>
                        <p className="font-serif text-neutral-500 italic text-sm">
                          (hastily tacked on by subsequent Governors)
                        </p>
                      </div>

                      <div className="space-y-8">
                        {constitutionalAmendments.map((amendment, index) => (
                          <motion.div
                            key={amendment.number}
                            id={`amendment-${amendment.number}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            onViewportEnter={() => setActiveSection(`amendment-${amendment.number}`)}
                            className={`relative ${amendment.rotation} transform hover:rotate-0 transition-transform duration-300 scroll-mt-28 max-w-2xl mx-auto`}
                          >
                            {/* Thumbtack */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                              <Thumbtack className="w-6 h-8 drop-shadow-md" />
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
