import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTeams } from '@/hooks/usePlayerSalaries';
import { cn } from '@/lib/utils';
import { Sparkles, Trophy, Volume2, VolumeX } from 'lucide-react';

type Slot = { seed: number; teamId: string | null; odds: number };

const SEED_ODDS = [52, 31, 10, 7];
const BALL_COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-amber-400',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-orange-500',
];

function weightedShuffle(slots: Slot[]): Slot[] {
  // NBA-style weighted-without-replacement lottery.
  // For each pick, pick a team with probability proportional to its odds
  // among teams not yet selected. This guarantees the #1 pick matches the
  // exact stated odds (52/31/10/7).
  const remaining = slots.filter((s) => s.teamId);
  const order: Slot[] = [];
  while (remaining.length) {
    const total = remaining.reduce((sum, s) => sum + s.odds, 0);
    const r = Math.random() * total;
    let acc = 0;
    let idx = remaining.length - 1;
    for (let i = 0; i < remaining.length; i++) {
      acc += remaining[i].odds;
      if (r < acc) {
        idx = i;
        break;
      }
    }
    order.push(remaining[idx]);
    remaining.splice(idx, 1);
  }
  return order;
}

const Lottery = () => {
  const { data: teams = [] } = useTeams();
  const [slots, setSlots] = useState<Slot[]>(
    SEED_ODDS.map((odds, i) => ({ seed: i + 1, teamId: null, odds }))
  );
  const [phase, setPhase] = useState<'setup' | 'tumbling' | 'reveal'>('setup');
  const [result, setResult] = useState<Slot[]>([]);
  // Lowest pick number revealed so far. 5 = none, 4 = #4 shown, 1 = all shown.
  const [revealedFrom, setRevealedFrom] = useState(5);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const allFilled = slots.every((s) => s.teamId);
  const usedTeamIds = useMemo(
    () => new Set(slots.map((s) => s.teamId).filter(Boolean) as string[]),
    [slots]
  );

  const updateSlot = (seed: number, teamId: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.seed === seed ? { ...s, teamId } : s))
    );
  };

  const runLottery = () => {
    if (!allFilled) return;
    const order = weightedShuffle(slots);
    setResult(order);
    setRevealedFrom(5);
    setPhase('tumbling');

    // Start music
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.7;
      audioRef.current.muted = muted;
      audioRef.current.play().catch(() => {});
    }

    // Tumble for 5 seconds, then reveal #4 -> #3 -> #2 -> #1
    setTimeout(() => {
      setPhase('reveal');
      [4, 3, 2, 1].forEach((n, i) => {
        setTimeout(() => setRevealedFrom(n), i * 2200);
      });
    }, 5000);
  };

  const reset = () => {
    setPhase('setup');
    setResult([]);
    setRevealedFrom(5);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const teamName = (id: string | null) =>
    teams.find((t) => t.id === id)?.name ?? '—';

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight mb-2">
              The Lottery
            </h1>
            <p className="text-muted-foreground">
              Set the bottom four seeds, spin the balls, and let fate decide the
              top of the rookie draft.
            </p>
          </motion.div>

          {/* Big spin button */}
          <div className="mb-10 flex justify-center">
            <Button
              size="lg"
              disabled={!allFilled || phase !== 'setup'}
              onClick={runLottery}
              className={cn(
                'h-14 px-8 text-base md:text-lg font-display uppercase tracking-wider',
                'bg-primary hover:bg-primary/90 shadow-lg'
              )}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              May the Lottery Gods Shine Down On You
            </Button>
          </div>

          {/* Slot selection */}
          {phase === 'setup' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {slots.map((slot) => (
                <div
                  key={slot.seed}
                  className="p-5 rounded-lg border-2 border-border bg-card flex items-center gap-4"
                >
                  <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-display font-extrabold">
                    <span className="text-2xl leading-none">#{slot.seed}</span>
                    <span className="text-[10px] mt-0.5">{slot.odds}%</span>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={slot.teamId ?? undefined}
                      onValueChange={(v) => updateSlot(slot.seed, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select seed #${slot.seed} team`} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {teams.map((t) => (
                          <SelectItem
                            key={t.id}
                            value={t.id}
                            disabled={
                              usedTeamIds.has(t.id) && slot.teamId !== t.id
                            }
                          >
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tumbling animation */}
          {phase === 'tumbling' && (
            <div className="relative mx-auto w-full max-w-md aspect-square rounded-full border-4 border-primary/40 bg-gradient-to-br from-card to-muted overflow-hidden shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display uppercase tracking-widest text-muted-foreground/60 text-sm">
                  Tumbling…
                </span>
              </div>
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i / 24) * Math.PI * 2;
                const radius = 30 + Math.random() * 30;
                const num = (i % 14) + 1;
                return (
                  <motion.div
                    key={i}
                    className={cn(
                      'absolute top-1/2 left-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md',
                      BALL_COLORS[i % BALL_COLORS.length]
                    )}
                    initial={{ x: 0, y: 0 }}
                    animate={{
                      x: [
                        Math.cos(angle) * radius,
                        Math.cos(angle + 2) * (radius + 20),
                        Math.cos(angle + 4) * radius,
                        Math.cos(angle + 6) * (radius - 10),
                        Math.cos(angle + 8) * radius,
                      ].map((v) => v * 2),
                      y: [
                        Math.sin(angle) * radius,
                        Math.sin(angle + 2) * (radius + 20),
                        Math.sin(angle + 4) * radius,
                        Math.sin(angle + 6) * (radius - 10),
                        Math.sin(angle + 8) * radius,
                      ].map((v) => v * 2),
                      rotate: 360,
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.05,
                    }}
                    style={{ marginLeft: -20, marginTop: -20 }}
                  >
                    {num}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Reveal */}
          {phase === 'reveal' && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase text-center mb-6">
                Official Draft Order
              </h2>
              <AnimatePresence>
                {[4, 3, 2, 1].map((pickNum) => {
                  const visible = revealedCount >= pickNum;
                  if (!visible) return null;
                  const team = result[pickNum - 1];
                  const isFirst = pickNum === 1;
                  return (
                    <motion.div
                      key={pickNum}
                      initial={{ opacity: 0, scale: 0.85, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                      className={cn(
                        'p-6 rounded-lg border-2 flex items-center gap-5',
                        isFirst
                          ? 'border-gold bg-gradient-to-r from-gold/20 via-gold/10 to-transparent shadow-xl'
                          : 'border-border bg-card'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-center w-16 h-16 rounded-full font-display font-extrabold text-3xl shrink-0',
                          isFirst
                            ? 'bg-gold text-primary'
                            : 'bg-primary text-primary-foreground'
                        )}
                      >
                        {pickNum}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          Pick #{pickNum}
                        </div>
                        <div
                          className={cn(
                            'font-display font-bold',
                            isFirst ? 'text-2xl md:text-3xl' : 'text-xl'
                          )}
                        >
                          {teamName(team?.teamId ?? null)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Entered as seed #{team?.seed} ({team?.odds}% odds)
                        </div>
                      </div>
                      {isFirst && (
                        <Trophy className="h-10 w-10 text-gold animate-pulse" />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {revealedCount >= 4 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="flex justify-center pt-6"
                >
                  <Button variant="outline" onClick={reset}>
                    Run Another Lottery
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Lottery;
