export function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

export function formatTimecode(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const f = Math.floor((ms % 1000) / (1000 / 24));
  return `${pad2(m)}:${pad2(s)}:${pad2(f)}`;
}

export function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

export function totalDuration(shots: { durationMs: number }[]) {
  return shots.reduce((sum, shot) => sum + shot.durationMs, 0);
}
