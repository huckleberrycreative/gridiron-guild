import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type Row = {
  rank: number;
  name: string;
  team: string;
  position: 'QB' | 'RB' | 'WR' | 'TE';
  age: string;
};

const positionColors: Record<string, string> = {
  QB: 'bg-red-100 text-red-700 border-red-200',
  RB: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  WR: 'bg-blue-100 text-blue-700 border-blue-200',
  TE: 'bg-amber-100 text-amber-700 border-amber-200',
};

const POSITION_BASE: Record<string, number> = { QB: 200, RB: 250, WR: 200, TE: 100 };
const POSITION_DROP: Record<string, number> = { QB: 0.75, RB: 0.5, WR: 0.75, TE: 0.5 };
const FILTERS = ['ALL', 'QB', 'RB', 'WR', 'TE'] as const;

// normalize names for matching against the rostered list
const normalize = (n: string) =>
  n.toLowerCase()
    .replace(/[.''`]/g, '')
    .replace(/\s+(jr|sr|ii|iii|iv|v)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

const parseCsv = (text: string): Row[] => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const out: Row[] = [];
  // simple CSV parse honoring quoted fields
  for (let i = 1; i < lines.length; i++) {
    const cells: string[] = [];
    let cur = '';
    let inQ = false;
    for (const ch of lines[i]) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) {
        cells.push(cur);
        cur = '';
      } else cur += ch;
    }
    cells.push(cur);
    const rank = parseInt(cells[0], 10);
    const name = cells[1]?.trim();
    const team = cells[2]?.trim();
    const posRaw = cells[3]?.trim() || '';
    const age = cells[4]?.trim() || '';
    const pos = posRaw.replace(/\d+$/, '') as Row['position'];
    if (!['QB', 'RB', 'WR', 'TE'].includes(pos)) continue;
    if (!name || isNaN(rank)) continue;
    out.push({ rank, name, team, position: pos, age });
  }
  return out;
};

const FallDraftPool2026 = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [rosteredSet, setRosteredSet] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [csvRes, dbRes, rookieRes] = await Promise.all([
        fetch('/data/fantasypros-2026-dynasty.csv'),
        supabase
          .from('player_salaries')
          .select('players(full_name)')
          .not('team_id', 'is', null),
        supabase
          .from('draft_picks')
          .select('rookie_pool(player_name)')
          .eq('draft_year', 2026)
          .not('selected_player_id', 'is', null),
      ]);
      const text = await csvRes.text();
      setRows(parseCsv(text));
      const rostered = new Set<string>();
      (dbRes.data ?? []).forEach((r: any) => {
        const fn = r?.players?.full_name;
        if (fn) rostered.add(normalize(fn));
      });
      (rookieRes.data ?? []).forEach((r: any) => {
        const pn = r?.rookie_pool?.player_name;
        if (pn) rostered.add(normalize(pn));
      });
      setRosteredSet(rostered);
      setLoading(false);
    })();
  }, []);

  const available = useMemo(
    () => rows.filter((r) => !rosteredSet.has(normalize(r.name))),
    [rows, rosteredSet]
  );

  // Cost: top 5 of position = base, then multiply by drop factor every 5 players.
  const withCost = useMemo(() => {
    const byPos: Record<string, Row[]> = { QB: [], RB: [], WR: [], TE: [] };
    available.forEach((r) => byPos[r.position].push(r));
    Object.values(byPos).forEach((list) => list.sort((a, b) => a.rank - b.rank));
    const costs = new Map<string, number>();
    (Object.keys(byPos) as Array<keyof typeof byPos>).forEach((pos) => {
      const base = POSITION_BASE[pos];
      const drop = POSITION_DROP[pos];
      byPos[pos].forEach((row, idx) => {
        const tier = Math.floor(idx / 5);
        const raw = base * Math.pow(drop, tier);
        const cost = Math.max(1, Math.round(raw));
        costs.set(`${row.position}-${row.rank}-${row.name}`, cost);
      });
    });
    return available.map((r) => ({
      ...r,
      cost: costs.get(`${r.position}-${r.rank}-${r.name}`) ?? 1,
    }));
  }, [available]);

  const filtered = useMemo(() => {
    const list = filter === 'ALL' ? withCost : withCost.filter((r) => r.position === filter);
    return [...list].sort((a, b) => a.rank - b.rank);
  }, [withCost, filter]);

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
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              2026 FALL DRAFT POOL
            </h1>
            <p className="text-muted-foreground">
              Every available player not currently on a 2026 roster, ranked by FantasyPros
              dynasty consensus with positional expected draft cost.
            </p>
          </motion.div>

          <div className="mb-6 flex flex-wrap gap-2">
            {FILTERS.map((p) => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-display font-semibold uppercase tracking-wider transition-all duration-200',
                  filter === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-x-auto rounded-lg border border-border bg-card shadow-md"
            >
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-display uppercase tracking-wider text-xs">Rank</th>
                    <th className="text-center px-3 py-3 font-display uppercase tracking-wider text-xs">Pos</th>
                    <th className="text-left px-4 py-3 font-display uppercase tracking-wider text-xs">Player</th>
                    <th className="text-left px-3 py-3 font-display uppercase tracking-wider text-xs">NFL Team</th>
                    <th className="text-center px-3 py-3 font-display uppercase tracking-wider text-xs">Age</th>
                    <th className="text-right px-4 py-3 font-display uppercase tracking-wider text-xs">Expected Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={`${r.rank}-${r.name}`}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-muted-foreground">{r.rank}</td>
                      <td className="text-center px-3 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center w-8 h-7 rounded text-[10px] font-display font-bold border',
                            positionColors[r.position]
                          )}
                        >
                          {r.position}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-3 py-3 text-muted-foreground">{r.team}</td>
                      <td className="text-center px-3 py-3 text-muted-foreground">{r.age}</td>
                      <td className="text-right px-4 py-3 font-mono font-semibold text-primary">
                        ${r.cost}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        No available players for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            Expected cost: Top 5 at each position start at the base (QB $200, RB $250, WR $200, TE $100).
            QB/WR drop 25% every 5 players; RB/TE drop 50% every 5 players.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default FallDraftPool2026;
