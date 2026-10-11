// Compare the same bounded preview rendered by the source panes. Matching lines
// retain their identity across insertions, rather than shifting every later row.
export function changedLines(content: string, other: string, limit = 240) {
  const lines = content.split("\n").slice(0, limit);
  const peers = other.split("\n").slice(0, limit);
  const matches = Array.from(
    { length: lines.length + 1 },
    () => new Uint16Array(peers.length + 1),
  );
  for (let i = lines.length - 1; i >= 0; i--) {
    for (let j = peers.length - 1; j >= 0; j--) {
      matches[i][j] =
        lines[i] === peers[j]
          ? 1 + matches[i + 1][j + 1]
          : Math.max(matches[i + 1][j], matches[i][j + 1]);
    }
  }
  const changed = new Set<number>();
  let i = 0;
  let j = 0;
  while (i < lines.length && j < peers.length) {
    if (lines[i] === peers[j]) {
      i++;
      j++;
    } else if (matches[i + 1][j] >= matches[i][j + 1]) {
      changed.add(i++);
    } else {
      j++;
    }
  }
  while (i < lines.length) changed.add(i++);
  return changed;
}
