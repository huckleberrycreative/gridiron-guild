import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://mensleague.com';
const SITE_NAME = "Men's League";

interface RouteMeta {
  title: string;
  description: string;
}

const routeMeta: Record<string, RouteMeta> = {
  '/': {
    title: "Men's League — Dynasty Fantasy Football Standings and Recaps",
    description:
      "Weekly recaps, live standings, and dynasty roster news from the Men's League — a 10-team dynasty fantasy football league.",
  },
  '/standings': {
    title: "Standings — Men's League Fantasy Football",
    description:
      "Current Men's League standings with weekly points, playoff positioning, and each governor's season-long ranking.",
  },
  '/stats': {
    title: "League Stats — Men's League Fantasy Football",
    description: "Scoring trends, points for, and team-by-team statistics across the Men's League season.",
  },
  '/salaries': {
    title: "Player Salaries — Men's League Fantasy Football",
    description: "Dynasty contract values, franchise tags, and 2026-2029 salary progression for every rostered player.",
  },
  '/recaps': {
    title: "Weekly Recaps Archive — Men's League Fantasy Football",
    description: "The complete archive of Men's League weekly recaps, filterable by season.",
  },
  '/constitution': {
    title: "The Constitution — Men's League Fantasy Football",
    description: "The official Men's League constitution: scoring, roster rules, salary mechanics, and amendments.",
  },
  '/team-captains': {
    title: "Team Captains — Men's League Fantasy Football",
    description: "Weekly team captain selections and the bonus rules that govern them.",
  },
  '/practice-squad': {
    title: "Practice Squad — Men's League Fantasy Football",
    description: "Practice squad rosters, eligibility limits, and poaching rules for every Men's League team.",
  },
  '/coaching-carousel': {
    title: "Coaching Carousel — Men's League Fantasy Football",
    description: "Head coach histories, hirings, and firings across all ten Men's League franchises.",
  },
  '/meet-the-league': {
    title: "Meet the League — Men's League Fantasy Football",
    description: "Governor profiles, career records, and championship résumés for every Men's League owner.",
  },
  '/lore': {
    title: "League Lore — Men's League Fantasy Football",
    description: "Season-by-season Men's League history: champions, playoff brackets, and notable events.",
  },
  '/historic-analytics': {
    title: "Historic Analytics — Men's League Fantasy Football",
    description: "All-time Men's League statistics, governor records, and franchise performance trends.",
  },
  '/pantheon': {
    title: "The Pantheon — Men's League Fantasy Football",
    description: "The Men's League Hall of Fame honoring champions and all-time greats.",
  },
  '/manifesto': {
    title: "The Manifesto — Men's League Fantasy Football",
    description: "The origin story and founding principles of the Men's League dynasty fantasy football league.",
  },
  '/season-2025': {
    title: "2025 Season — Men's League Fantasy Football",
    description: "Final 2025 Men's League standings, playoff results, and season recap.",
  },
  '/season-2026': {
    title: "2026 Season — Men's League Fantasy Football",
    description: "Live 2026 Men's League rosters, fall draft budgets, and the countdown to the fall draft.",
  },
  '/rivalry-week': {
    title: "Rivalry Week — Men's League Fantasy Football",
    description: "Historic Men's League rivalries and current trophy ownership for every matchup.",
  },
  '/rookie-draft': {
    title: "Rookie Draft — Men's League Fantasy Football",
    description: "The three-round Men's League rookie draft board with live pick tracking.",
  },
  '/official-rosters-2026': {
    title: "Official 2026 Rosters — Men's League Fantasy Football",
    description: "Locked-in 2026 Men's League rosters, practice squads, salaries, and fall draft capital by team.",
  },
  '/fall-draft-pool-2026': {
    title: "2026 Fall Draft Pool — Men's League Fantasy Football",
    description: "Every available player in the 2026 Men's League fall draft with expected draft cost by position.",
  },
  '/lottery': {
    title: "Draft Lottery — Men's League Fantasy Football",
    description: "The Men's League ping pong ball draft lottery simulator with weighted odds.",
  },
};

const fallback: RouteMeta = {
  title: "Men's League — Dynasty Fantasy Football",
  description: "Standings, rosters, salaries, and weekly recaps from the Men's League dynasty fantasy football league.",
};

export function RouteSeo() {
  const { pathname } = useLocation();
  const meta = routeMeta[pathname] ?? fallback;
  const canonical = `${SITE_URL}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`;
  const noIndex = pathname.startsWith('/admin');

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
    </Helmet>
  );
}
