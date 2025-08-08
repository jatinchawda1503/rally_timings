export function formatSeconds(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return r === 0 ? `${m}m` : `${m}m ${r}s`;
}


