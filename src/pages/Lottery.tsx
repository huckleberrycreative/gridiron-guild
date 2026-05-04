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

// Ball ranges by seed (inclusive). Sums to 100.
const SEED_RANGES: { seed: number; start: number; end: number }[] = [
  { seed: 1, start: 1, end: 53 },
  { seed: 2, start: 54, end: 84 },
  { seed: 3, start: 85, end: 93 },
  { seed: 4, start: 94, end: 100 },
];
const SEED_ODDS = SEED_RANGES.map((r) => r.end - r.start + 1); // [53,31,9,7]

// Tailwind classes per seed for ball color
const SEED_COLOR: Record<number, { bg: string; ring: string; text: string }> = {
  1: { bg: 'bg-red-500', ring: 'ring-red-300', text: 'text-white' },
  2: { bg: 'bg-blue-500', ring: 'ring-blue-300', text: 'text-white' },
  3: { bg: 'bg-amber-400', ring: 'ring-amber-200', text: 'text-black' },
  4: { bg: 'bg-emerald-500', ring: 'ring-emerald-300', text: 'text-white' },
};

function ballSeed(num: number): number {
  for (const r of SEED_RANGES) if (num >= r.start && num <= r.end) return r.seed;
  return 1;
}

function pickWeightedOrder(slots: Slot[]): Slot[] {
  const remaining = slots.filter((s) => s.teamId);
  const order: Slot[] = [];
  while (remaining.length) {
    const total = remaining.reduce((sum, s) => sum + s.odds, 0);
    const r = Math.random() * total;
    let acc = 0;
    let idx = remaining.length - 1;
    for (let i = 0; i < remaining.length; i++) {
      acc += remaining[i].odds;
      if (r < acc) { idx = i; break; }
    }
    order.push(remaining[idx]);
    remaining.splice(idx, 1);
  }
  return order;
}

function randomBallForSeed(seed: number): number {
  const r = SEED_RANGES.find((x) => x.seed === seed)!;
  return r.start + Math.floor(Math.random() * (r.end - r.start + 1));
}

const DRAW_FLASH_MS = 2200;
const DRAW_HOLD_MS = 1400;
const DRAW_TOTAL = DRAW_FLASH_MS + DRAW_HOLD_MS;

// ============================================================
// BallArena — renders 100 balls. Starts as 10x10 grid, then on each
// draw the balls swirl around the center and the winning ball emerges.
// ============================================================
function BallArena({
  phase,
  drawIndex,
  lockedCount,
  currentDrawBall,
  winningBalls,
  ballToPick,
  lockedBalls,
}: {
  phase: 'setup' | 'drawing' | 'reveal';
  drawIndex: number;
  lockedCount: number;
  currentDrawBall: number | null;
  winningBalls: number[];
  ballToPick: Map<number, number>;
  lockedBalls: Set<number>;
}) {
  // Swirl targets are regenerated whenever a new draw begins so the motion
  // looks fresh each cycle. Each ball gets an angle, radius, and orbit speed.
  const swirl = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      angle: Math.random() * Math.PI * 2,
      radius: 18 + Math.random() * 28, // % of container
      speed: 0.7 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawIndex]);

  // Helper to get this ball's target position (percentages from top-left)
  const getTarget = (num: number) => {
    const i = num - 1;
    const row = Math.floor(i / 10);
    const col = i % 10;
    // Grid positions: 10x10, centered with 5%-95% range
    const gridX = 5 + (col * 90) / 9; // 5..95
    const gridY = 5 + (row * 90) / 9;

    const isWinning = ballToPick.has(num);
    const isCurrent = currentDrawBall === num;
    const isLocked = lockedBalls.has(num);

    // Phase: drawing, no draw yet -> grid
    if (phase === 'drawing' && drawIndex < 0) {
      return { x: gridX, y: gridY, scale: 1, opacity: 1, z: 0 };
    }

    // Phase: drawing, active draw window (not yet locked this cycle)
    if (phase === 'drawing' && drawIndex >= 0 && lockedCount <= drawIndex) {
      if (isCurrent) {
        // Winner emerges to center, large
        return { x: 50, y: 50, scale: 2.4, opacity: 1, z: 50 };
      }
      if (isLocked) {
        // Already-won balls park in a small row at the bottom
        const lockedIdx = Array.from(lockedBalls).indexOf(num);
        return {
          x: 20 + lockedIdx * 20,
          y: 95,
          scale: 0.85,
          opacity: 0.9,
          z: 5,
        };
      }
      // Everyone else swirls around the center
      const s = swirl[i];
      const t = (Date.now() / 1000) * s.speed; // not reactive; framer handles motion via keyframes below
      return {
        x: 50 + Math.cos(s.angle + s.phase + t) * s.radius,
        y: 50 + Math.sin(s.angle + s.phase + t) * s.radius * 0.85,
        scale: 0.9,
        opacity: 0.85,
        z: 1,
      };
    }

    // Phase: drawing, between draws (locked but not yet next draw)
    if (phase === 'drawing' && lockedCount > drawIndex) {
      if (isLocked) {
        const lockedIdx = Array.from(lockedBalls).indexOf(num);
        return { x: 20 + lockedIdx * 20, y: 95, scale: 0.85, opacity: 0.9, z: 5 };
      }
      return { x: gridX, y: gridY, scale: 1, opacity: 1, z: 0 };
    }

    // Phase: reveal
    if (phase === 'reveal') {
      if (isWinning) {
        const idx = ballToPick.get(num)! - 1; // 0..3
        return { x: 20 + idx * 20, y: 50, scale: 1.6, opacity: 1, z: 10 };
      }
      return { x: gridX, y: gridY, scale: 1, opacity: 0, z: 0 };
    }

    return { x: gridX, y: gridY, scale: 1, opacity: 1, z: 0 };
  };

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-card p-4 md:p-6 shadow-xl mb-8">
      <div className="relative w-full mx-auto" style={{ aspectRatio: '1 / 1', maxWidth: 640 }}>
        {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => {
          const seed = ballSeed(num);
          const c = SEED_COLOR[seed];
          const isCurrent = currentDrawBall === num && drawIndex >= 0 && lockedCount <= drawIndex;
          const isWinning = ballToPick.has(num);
          const showInReveal = phase === 'reveal' && isWinning;
          const target = getTarget(num);

          // Build animate prop. For swirling balls during active draw,
          // we generate a keyframe orbit so motion is continuous.
          const isSwirling =
            phase === 'drawing' &&
            drawIndex >= 0 &&
            lockedCount <= drawIndex &&
            !isCurrent &&
            !lockedBalls.has(num);

          let animate: any;
          let transition: any;
          if (isSwirling) {
            const s = swirl[num - 1];
            const steps = 24;
            const xs: number[] = [];
            const ys: number[] = [];
            for (let k = 0; k < steps; k++) {
              const t = (k / steps) * Math.PI * 2;
              xs.push(50 + Math.cos(s.angle + s.phase + t * s.speed) * s.radius);
              ys.push(50 + Math.sin(s.angle + s.phase + t * s.speed) * s.radius * 0.85);
            }
            animate = {
              left: xs.map((v) => `${v}%`),
              top: ys.map((v) => `${v}%`),
              scale: 0.9,
              opacity: 0.85,
            };
            transition = { duration: 2.2, ease: 'linear', repeat: Infinity };
          } else {
            animate = {
              left: `${target.x}%`,
              top: `${target.y}%`,
              scale: target.scale,
              opacity: target.opacity,
            };
            transition = { duration: isCurrent ? 1.2 : 0.7, ease: isCurrent ? 'easeOut' : 'easeInOut' };
          }

          return (
            <motion.div
              key={num}
              initial={false}
              animate={animate}
              transition={transition}
              style={{
                position: 'absolute',
                width: '8%',
                height: '8%',
                marginLeft: '-4%',
                marginTop: '-4%',
                zIndex: target.z,
              }}
              className={cn(
                'rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-md select-none',
                c.bg,
                c.text,
                isCurrent && 'ring-4 ring-gold shadow-2xl shadow-gold/60',
                (lockedBalls.has(num) || showInReveal) && 'ring-2 ring-gold',
              )}
            >
              {num}
              {showInReveal && (
                <span className="absolute -top-2 -right-2 bg-gold text-primary text-[10px] font-display font-extrabold rounded-full w-5 h-5 flex items-center justify-center shadow">
                  {ballToPick.get(num)}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


const Lottery = () => {
  const { data: teams = [] } = useTeams();
  const [slots, setSlots] = useState<Slot[]>(
    SEED_ODDS.map((odds, i) => ({ seed: i + 1, teamId: null, odds }))
  );
  const [phase, setPhase] = useState<'setup' | 'drawing' | 'reveal'>('setup');
  const [order, setOrder] = useState<Slot[]>([]);
  // Pick balls for each pick #1..#4 in DRAFT order (so order[0] is #1 pick).
  const [winningBalls, setWinningBalls] = useState<number[]>([]);
  // Index of the current draw being animated. Draws happen in REVERSE: #4 first, then #3, #2, #1.
  // drawIndex 0 = #4 pick, 1 = #3, 2 = #2, 3 = #1. -1 = none yet.
  const [drawIndex, setDrawIndex] = useState(-1);
  // Once a draw completes its hold, ball is "locked in". lockedCount = number completed (0..4)
  const [lockedCount, setLockedCount] = useState(0);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timersRef = useRef<number[]>([]);

  const allFilled = slots.every((s) => s.teamId);
  const usedTeamIds = useMemo(
    () => new Set(slots.map((s) => s.teamId).filter(Boolean) as string[]),
    [slots]
  );

  const updateSlot = (seed: number, teamId: string) => {
    setSlots((prev) => prev.map((s) => (s.seed === seed ? { ...s, teamId } : s)));
  };

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  const runLottery = () => {
    if (!allFilled) return;
    // Rigged order: #1 seed, then #4, then #2, then #3
    const bySeed = (n: number) => slots.find((s) => s.seed === n)!;
    const draftOrder = [bySeed(1), bySeed(4), bySeed(2), bySeed(3)];
    // Pick a representative ball for each pick from that team's seed range
    const balls = draftOrder.map((s) => randomBallForSeed(s.seed));
    setOrder(draftOrder);
    setWinningBalls(balls);
    setLockedCount(0);
    setDrawIndex(-1);
    setPhase('drawing');

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.7;
      audioRef.current.muted = muted;
      audioRef.current.play().catch(() => {});
    }

    // Sequence: 4 draws in reverse order (#4, #3, #2, #1)
    clearTimers();
    for (let i = 0; i < 4; i++) {
      const startAt = i * DRAW_TOTAL + 600;
      timersRef.current.push(
        window.setTimeout(() => setDrawIndex(i), startAt)
      );
      timersRef.current.push(
        window.setTimeout(() => setLockedCount(i + 1), startAt + DRAW_FLASH_MS)
      );
    }
    // After all 4 draws complete + brief pause -> reveal
    timersRef.current.push(
      window.setTimeout(() => setPhase('reveal'), 4 * DRAW_TOTAL + 1400)
    );
  };

  const reset = () => {
    clearTimers();
    setPhase('setup');
    setOrder([]);
    setWinningBalls([]);
    setDrawIndex(-1);
    setLockedCount(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => () => { clearTimers(); audioRef.current?.pause(); }, []);

  // Stop music when reveal phase ends
  useEffect(() => {
    if (phase === 'reveal' && audioRef.current) {
      window.setTimeout(() => audioRef.current?.pause(), 4000);
    }
  }, [phase]);

  const teamName = (id: string | null) =>
    teams.find((t) => t.id === id)?.name ?? '—';

  // Map ball# -> the pick (1..4) it represents, if locked / currently drawing
  const ballToPick = useMemo(() => {
    const m = new Map<number, number>();
    // winningBalls[0] = #1 pick, winningBalls[1] = #2, ...
    // draws happen in reverse: drawIndex 0 -> #4 (winningBalls[3]), 1 -> #3, 2 -> #2, 3 -> #1
    winningBalls.forEach((b, i) => m.set(b, i + 1));
    return m;
  }, [winningBalls]);

  // For a given drawIndex, which pick number is being drawn?
  const pickForDrawIndex = (i: number) => 4 - i;
  const currentDrawPick = drawIndex >= 0 ? pickForDrawIndex(drawIndex) : null;
  const currentDrawBall =
    currentDrawPick != null ? winningBalls[currentDrawPick - 1] : null;

  // Locked ball numbers (already revealed during animation)
  const lockedBalls = useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i < lockedCount; i++) {
      const pick = pickForDrawIndex(i);
      const b = winningBalls[pick - 1];
      if (b) set.add(b);
    }
    return set;
  }, [lockedCount, winningBalls]);

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight mb-2">
              The Lottery
            </h1>
            <p className="text-muted-foreground">
              100 ping pong balls. Four picks. One destiny.
            </p>
          </motion.div>

          <audio ref={audioRef} src="/audio/oh-fortuna.mp3" preload="auto" />

          {/* Slot selection */}
          {phase === 'setup' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {slots.map((slot) => {
                const range = SEED_RANGES.find((r) => r.seed === slot.seed)!;
                const c = SEED_COLOR[slot.seed];
                return (
                  <div
                    key={slot.seed}
                    className="p-5 rounded-lg border-2 border-border bg-card flex items-center gap-4"
                  >
                    <div className={cn('flex flex-col items-center justify-center w-16 h-16 rounded-full font-display font-extrabold shrink-0', c.bg, c.text)}>
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
                              disabled={usedTeamIds.has(t.id) && slot.teamId !== t.id}
                            >
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground mt-1.5 font-mono">
                        Balls {range.start}–{range.end}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Spin button */}
          {phase === 'setup' && (
            <div className="mb-8 flex flex-col items-center gap-3">
              <Button
                size="lg"
                disabled={!allFilled}
                onClick={runLottery}
                className="h-14 px-8 text-base md:text-lg font-display uppercase tracking-wider bg-primary hover:bg-primary/90 shadow-lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                May the Lottery Gods Shine Down On You
              </Button>
            </div>
          )}

          {phase !== 'setup' && (
            <div className="flex justify-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMuted((m) => !m)}
                className="text-muted-foreground"
              >
                {muted ? <VolumeX className="h-4 w-4 mr-1" /> : <Volume2 className="h-4 w-4 mr-1" />}
                {muted ? 'Unmute' : 'Mute'}
              </Button>
            </div>
          )}

          {/* Status banner during drawing */}
          {phase === 'drawing' && currentDrawPick != null && (
            <motion.div
              key={`status-${drawIndex}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Now drawing</div>
              <div className="font-display text-2xl md:text-3xl font-extrabold">
                Pick #{currentDrawPick}
              </div>
            </motion.div>
          )}

          {/* Ball arena: 10x10 grid -> swirl -> emerge */}
          {phase !== 'setup' && (
            <BallArena
              phase={phase}
              drawIndex={drawIndex}
              lockedCount={lockedCount}
              currentDrawBall={currentDrawBall}
              winningBalls={winningBalls}
              ballToPick={ballToPick}
              lockedBalls={lockedBalls}
            />
          )}

          {/* Reveal */}
          {phase === 'reveal' && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase text-center mb-2">
                Official Draft Order
              </h2>
              <AnimatePresence>
                {[1, 2, 3, 4].map((pickNum) => {
                  const team = order[pickNum - 1];
                  const isFirst = pickNum === 1;
                  const c = SEED_COLOR[team?.seed ?? 1];
                  return (
                    <motion.div
                      key={pickNum}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: pickNum * 0.15 }}
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
                          isFirst ? 'bg-gold text-primary' : 'bg-primary text-primary-foreground'
                        )}
                      >
                        {pickNum}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          Pick #{pickNum}
                        </div>
                        <div className={cn('font-display font-bold', isFirst ? 'text-2xl md:text-3xl' : 'text-xl')}>
                          {teamName(team?.teamId ?? null)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Entered as seed #{team?.seed} ({team?.odds}% odds) · Ball #{winningBalls[pickNum - 1]}
                        </div>
                      </div>
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md', c.bg, c.text)}>
                        {winningBalls[pickNum - 1]}
                      </div>
                      {isFirst && <Trophy className="h-10 w-10 text-gold animate-pulse" />}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="flex justify-center pt-6"
              >
                <Button variant="outline" onClick={reset}>
                  Run Another Lottery
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Lottery;
