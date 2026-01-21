import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { SortableTable, Column } from '@/components/SortableTable';
import { teamCaptainPicks, TeamCaptainPick, teams } from '@/data/leagueData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send, Crown, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const TeamCaptains = () => {
  const [localPicks, setLocalPicks] = useState<TeamCaptainPick[]>(teamCaptainPicks);
  const [newPick, setNewPick] = useState({
    fantasyTeam: '',
    week: '',
    captainName: '',
  });
  const [weekFilter, setWeekFilter] = useState<string>('all');

  // Get unique weeks from picks
  const weeks = [...new Set(localPicks.map((p) => p.week))].sort((a, b) => b - a);

  // Filter picks by week
  const filteredPicks = weekFilter === 'all'
    ? localPicks
    : localPicks.filter((p) => p.week === parseInt(weekFilter));

  // Sort by week (descending) then by team name
  const sortedPicks = [...filteredPicks].sort((a, b) => {
    if (a.week !== b.week) return b.week - a.week;
    return a.fantasyTeam.localeCompare(b.fantasyTeam);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPick.fantasyTeam && newPick.week && newPick.captainName.trim()) {
      const pick: TeamCaptainPick = {
        id: Date.now().toString(),
        fantasyTeam: newPick.fantasyTeam,
        week: parseInt(newPick.week),
        season: 2026,
        captainName: newPick.captainName,
        submittedAt: new Date().toISOString().split('T')[0],
      };
      setLocalPicks([pick, ...localPicks]);
      setNewPick({ fantasyTeam: '', week: '', captainName: '' });
    }
  };

  const columns: Column<TeamCaptainPick>[] = [
    {
      key: 'week',
      label: 'Week',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className="inline-flex items-center justify-center w-8 h-8 bg-primary/10 text-primary font-display font-bold text-sm rounded-full">
          {value as number}
        </span>
      ),
    },
    {
      key: 'fantasyTeam',
      label: 'Fantasy Team',
      sortable: true,
      render: (value) => <span className="font-semibold">{value as string}</span>,
    },
    {
      key: 'captainName',
      label: 'Team Captain',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Crown size={14} className="text-gold" />
          <span className="font-medium text-accent">{value as string}</span>
        </div>
      ),
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value as string).toLocaleDateString()}
        </span>
      ),
    },
  ];

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
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">TEAM CAPTAINS</h1>
            <p className="text-muted-foreground">
              Submit your weekly captain selection and view all captain picks.
            </p>
          </motion.div>

          {/* Submission Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <Crown size={20} className="text-gold" />
                Submit Captain Pick
              </h2>
              <form onSubmit={handleSubmit} className="grid sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fantasy Team *</label>
                  <Select
                    value={newPick.fantasyTeam}
                    onValueChange={(value) => setNewPick({ ...newPick, fantasyTeam: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.name}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Week *</label>
                  <Select
                    value={newPick.week}
                    onValueChange={(value) => setNewPick({ ...newPick, week: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select week" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 14 }, (_, i) => i + 1).map((week) => (
                        <SelectItem key={week} value={week.toString()}>
                          Week {week}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Team Captain *</label>
                  <Input
                    value={newPick.captainName}
                    onChange={(e) => setNewPick({ ...newPick, captainName: e.target.value })}
                    placeholder="Player name"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" variant="accent" className="w-full gap-2">
                    <Send size={16} />
                    Submit
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Week Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filter by week:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setWeekFilter('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-display font-semibold transition-all duration-200',
                    weekFilter === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  All Weeks
                </button>
                {weeks.map((week) => (
                  <button
                    key={week}
                    onClick={() => setWeekFilter(week.toString())}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-display font-semibold transition-all duration-200',
                      weekFilter === week.toString()
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    Week {week}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Captain Picks Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <SortableTable
              data={sortedPicks}
              columns={columns}
              defaultSortKey="week"
              className="shadow-md"
            />
          </motion.div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-gold" />
              <span>Team Captain receives 1.5x points</span>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default TeamCaptains;
