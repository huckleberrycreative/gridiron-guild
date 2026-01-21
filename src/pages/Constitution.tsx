import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
                        <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-8">
                          {[
                            { name: 'Ben Holcomb', style: 'italic tracking-wide', script: 'Ben Holcomb' },
                            { name: 'Dino Nicandros', style: 'tracking-widest font-light', script: 'Dino Nicandros' },
                            { name: 'Connor Miller', style: 'italic font-bold tracking-tight', script: 'Connor Miller' },
                            { name: 'Pierce Reynolds', style: 'tracking-wide font-medium', script: 'Pierce Reynolds' },
                            { name: 'Cameron Lee', style: 'italic font-light tracking-wider', script: 'Cameron Lee' },
                            { name: 'Peter Fazio', style: 'font-bold tracking-normal', script: 'Peter Fazio' },
                            { name: 'Dan Hare', style: 'italic tracking-widest font-medium', script: 'Dan Hare' },
                            { name: 'Bryce Fisher', style: 'tracking-tight italic', script: 'Bryce Fisher' },
                            { name: 'Colin Brophy', style: 'font-medium tracking-wide', script: 'Colin Brophy' },
                            { name: 'Wynn Wygal', style: 'italic font-bold tracking-wider', script: 'Wynn Wygal' },
                          ].map((governor, i) => (
                            <div key={i} className="text-center group">
                              <p 
                                className={`font-serif text-lg md:text-xl text-neutral-700 mb-1 transform -rotate-2 ${governor.style}`}
                                style={{ 
                                  fontFamily: 'Georgia, serif',
                                  textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.1)'
                                }}
                              >
                                {governor.script}
                              </p>
                              <div className="w-24 h-px bg-neutral-400 mx-auto mb-1" />
                              <p className="font-serif text-xs text-neutral-500">{governor.name}</p>
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
