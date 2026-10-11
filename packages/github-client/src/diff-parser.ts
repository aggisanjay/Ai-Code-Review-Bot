export interface DiffLine {
  type: 'add' | 'delete' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface ParsedDiffFile {
  oldPath: string;
  newPath: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}

export function parseGitDiff(diffText: string): ParsedDiffFile[] {
  const files: ParsedDiffFile[] = [];
  if (!diffText || typeof diffText !== 'string') {
    return files;
  }

  const rawFiles = diffText.split(/^diff --git /m).filter(Boolean);

  for (const raw of rawFiles) {
    const lines = raw.split(/\r?\n/);
    if (lines.length === 0) continue;

    const headerLine = lines[0];
    const pathMatch = headerLine.match(/a\/(.+?)\s+b\/(.+)/);
    const oldPath = pathMatch ? pathMatch[1] : 'unknown';
    const newPath = pathMatch ? pathMatch[2] : 'unknown';

    let status: ParsedDiffFile['status'] = 'modified';
    if (raw.includes('new file mode')) status = 'added';
    if (raw.includes('deleted file mode')) status = 'deleted';
    if (raw.includes('similarity index')) status = 'renamed';

    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;
    let oldCurrentLine = 0;
    let newCurrentLine = 0;
    let additions = 0;
    let deletions = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Match hunk header: @@ -1,4 +1,6 @@
      const hunkMatch = line.match(/^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/);
      if (hunkMatch) {
        if (currentHunk) {
          hunks.push(currentHunk);
        }

        const oldStart = parseInt(hunkMatch[1], 10);
        const oldLinesCount = hunkMatch[2] ? parseInt(hunkMatch[2], 10) : 1;
        const newStart = parseInt(hunkMatch[3], 10);
        const newLinesCount = hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1;

        currentHunk = {
          header: line,
          oldStart,
          oldLines: oldLinesCount,
          newStart,
          newLines: newLinesCount,
          lines: [],
        };

        oldCurrentLine = oldStart;
        newCurrentLine = newStart;
        continue;
      }

      if (!currentHunk) continue;

      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentHunk.lines.push({
          type: 'add',
          content: line.substring(1),
          newLineNumber: newCurrentLine++,
        });
        additions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        currentHunk.lines.push({
          type: 'delete',
          content: line.substring(1),
          oldLineNumber: oldCurrentLine++,
        });
        deletions++;
      } else if (line.startsWith(' ') || line === '') {
        currentHunk.lines.push({
          type: 'context',
          content: line.startsWith(' ') ? line.substring(1) : line,
          oldLineNumber: oldCurrentLine++,
          newLineNumber: newCurrentLine++,
        });
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk);
    }

    files.push({
      oldPath,
      newPath,
      status,
      hunks,
      additions,
      deletions,
    });
  }

  return files;
}
