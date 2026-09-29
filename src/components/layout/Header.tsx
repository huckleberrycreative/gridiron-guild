import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import logoImage from '@/assets/logo.png';
import espnLogo from '@/assets/espn-logo.png';

function EspnRefreshButton({
  className,
  onDone,
}: {
  className?: string;
  onDone?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const refresh = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<any>('espn-sync', { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: 'Rosters refreshed',
        description: `${data?.teamsSynced ?? 0} teams updated from ESPN.`,
      });
      ['player-salaries', 'injury-rows', 'weekly-scores', 'teams', 'standings','active-season-standings'].forEach((k) =>
        queryClient.invalidateQueries({ queryKey: [k] })
      );
    } catch (e: any) {
      toast({
        title: 'Refresh failed',
        description: e.message ?? 'Could not reach ESPN.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      onDone?.();
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className={className}>
      <img src={espnLogo} alt="ESPN" loading="lazy" width={816} height={816} className="h-4 w-4 mr-2 object-contain" />
      {loading ? 'Refreshing...' : 'Refresh from ESPN'}
      <RefreshCw className={cn('h-3.5 w-3.5 ml-2', loading && 'animate-spin')} />
    </Button>
  );
}

interface NavItem {
  href?: string;
  label: string;
  children?: { href: string; label: string; description?: string }[];
}

const navLinks: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/season-2026', label: '2026 Season' },
  { href: '/power-ranks', label: 'Power Ranks' },
  { href: '/constitution', label: 'Constitution' },
  {
    label: 'Dynasty Information',
    children: [
      { href: '/rookie-draft', label: 'Rookie Draft', description: 'Annual rookie selection board' },
      { href: '/official-rosters-2026', label: 'Official 2026 Rosters', description: 'Locked-in rosters and fall draft capital' },
      { href: '/salaries', label: 'Player Salaries', description: 'Contract values and salary progression' },
      { href: '/team-captains', label: 'Team Captains', description: 'Weekly captain selections' },
      { href: '/practice-squad', label: 'Practice Squad', description: 'Roster management' },
      { href: '/coaching-carousel', label: 'Coaching Carousel', description: 'Head coach histories' },
      { href: '/lottery', label: 'Lottery', description: 'Ping pong ball draft lottery simulator' },
      { href: '/trade-analyzer', label: 'Trade Analyzer', description: 'Grade any trade for both sides' },
    ],
  },
  {
    label: 'About',
    children: [
      { href: '/season-2025', label: '2025 Season', description: 'Last season recap, standings, and playoffs' },
      { href: '/meet-the-league', label: 'Meet the League', description: 'Governor profiles and stats' },
      { href: '/rivalry-week', label: 'Rivalry Week', description: 'Historic matchup rivalries' },
      { href: '/lore', label: 'Lore', description: 'Season-by-season history' },
      { href: '/historic-analytics', label: 'Historic Analytics', description: 'All-time statistics' },
      { href: '/pantheon', label: 'The Pantheon', description: 'Hall of Fame' },
      { href: '/manifesto', label: 'The Manifesto', description: 'Origin story and rules' },
      { href: '/recaps', label: 'Historic Recaps', description: 'Weekly recap archive' },
    ],
  },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileSection, setExpandedMobileSection] = useState<string | null>(null);
  const location = useLocation();

  const isActiveLink = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={logoImage} 
              alt="Men's League" 
              className="h-10 md:h-14 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navLinks.map((link) => (
                <NavigationMenuItem key={link.label}>
                  {link.children ? (
                    <>
                      <NavigationMenuTrigger className="bg-transparent hover:bg-secondary">
                        {link.label}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-1 p-2 bg-card border border-border shadow-lg rounded-lg">
                          {link.children.map((child) => (
                            <li key={child.href}>
                              <NavigationMenuLink asChild>
                                <Link
                                  to={child.href}
                                  className={cn(
                                    'block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary',
                                    isActiveLink(child.href) && 'bg-secondary'
                                  )}
                                >
                                  <div className="text-sm font-medium leading-none mb-1">
                                    {child.label}
                                  </div>
                                  {child.description && (
                                    <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                      {child.description}
                                    </p>
                                  )}
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <Link
                      to={link.href!}
                      className={cn(
                        'px-4 py-2 rounded-md font-medium text-sm transition-all duration-200',
                        isActiveLink(link.href!)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      )}
                    >
                      {link.label}
                    </Link>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="accent" size="sm" asChild>
              <Link to="/standings">View Standings</Link>
            </Button>
            <EspnRefreshButton />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border bg-card"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <div key={link.label}>
                  {link.children ? (
                    <>
                      <button
                        onClick={() =>
                          setExpandedMobileSection(
                            expandedMobileSection === link.label ? null : link.label
                          )
                        }
                        className="w-full flex items-center justify-between px-4 py-3 rounded-md font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
                      >
                        {link.label}
                        <ChevronDown
                          size={18}
                          className={cn(
                            'transition-transform',
                            expandedMobileSection === link.label && 'rotate-180'
                          )}
                        />
                      </button>
                      <AnimatePresence>
                        {expandedMobileSection === link.label && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-4 overflow-hidden"
                          >
                            {link.children.map((child) => (
                              <Link
                                key={child.href}
                                to={child.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                  'block px-4 py-2 rounded-md text-sm transition-all duration-200',
                                  isActiveLink(child.href)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                )}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      to={link.href!}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'block px-4 py-3 rounded-md font-medium transition-all duration-200',
                        isActiveLink(link.href!)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      )}
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}
              <Button variant="accent" className="mt-2" asChild>
                <Link to="/standings" onClick={() => setMobileMenuOpen(false)}>
                  View Standings
                </Link>
              </Button>
              <EspnRefreshButton className="w-full" onDone={() => setMobileMenuOpen(false)} />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
