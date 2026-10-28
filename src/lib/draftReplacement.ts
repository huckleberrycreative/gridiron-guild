import { STARTER_SLOTS } from './seasonSimulation';

export type ReplacementLevels = Record<string, number>;
export type DraftLineupPlayer = { id: string; name: string; position: string; ppg: number; replacement?: boolean };

/** Average the players around the shared chart's lower-quartile replacement tier. */
export function replacementLevels(players: { position: string; ppg: number; teamId?: string | null; practiceSquad?: boolean }[]): ReplacementLevels {
  return Object.fromEntries(['QB', 'RB', 'WR', 'TE'].map(position => {
    const values = players.filter(p => p.position === position && p.teamId && !p.practiceSquad && Number.isFinite(p.ppg) && p.ppg > 0)
      .map(p => p.ppg).sort((a, b) => a - b);
    if (!values.length) return [position, 5];
    const center = Math.floor(values.length * 0.25);
    const radius = Math.max(1, Math.floor(values.length * 0.05));
    const tier = values.slice(Math.max(0, center - radius), Math.min(values.length, center + radius + 1));
    return [position, tier.reduce((sum, value) => sum + value, 0) / tier.length];
  }));
}

/** Reserve scarce positions first; FLEX and OP get the strongest eligible replacement. */
export function completedDraftLineup(players: DraftLineupPlayer[], levels: ReplacementLevels) {
  const pool = [...players].sort((a, b) => b.ppg - a.ppg || a.id.localeCompare(b.id));
  const used = new Set<string>();
  return STARTER_SLOTS.map((slot, index) => {
    const positions = slot === 'OP' ? ['QB', 'RB', 'WR', 'TE'] : slot === 'FLEX' ? ['RB', 'WR', 'TE'] : [slot];
    const player = pool.find(p => !used.has(p.id) && positions.includes(p.position));
    if (player) { used.add(player.id); return { ...player, slot }; }
    const position = [...positions].sort((a, b) => (levels[b] ?? 5) - (levels[a] ?? 5))[0];
    return { id: `draft-replacement-${index}`, name: `Average ${position} draft replacement`, position, ppg: levels[position] ?? 5, replacement: true, slot };
  });
}