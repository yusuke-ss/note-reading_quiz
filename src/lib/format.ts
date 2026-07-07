// Formats a duration in milliseconds as "mm:ss" (zero-padded, minutes can
// exceed 60 -- e.g. a 61-minute run reads "61:01" rather than wrapping).
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(minutes)}:${pad(seconds)}`;
}
