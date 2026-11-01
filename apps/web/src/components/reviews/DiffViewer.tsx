'use client';

import React, { useState } from 'react';
import {
  FileCode,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { ReviewFinding } from '@reviewflow/shared';

interface DiffViewerProps {
  files: Array<{
    path: string;
    additions: number;
    deletions: number;
    lines: Array<{
      type: 'add' | 'delete' | 'context';
      oldLine?: number;
      newLine?: number;
      content: string;
    }>;
  }>;
  findings: ReviewFinding[];
  onDismissFinding?: (findingId: string, reason: string) => void;
}

export function DiffViewer({ files, findings, onDismissFinding }: DiffViewerProps) {
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const currentFile = files[activeFileIndex] || files[0];
  if (!currentFile) {
    return <div className="p-8 text-center text-[#9AA7A1] font-mono text-xs">No diff files to display.</div>;
  }

  // Filter findings for the active file
  const fileFindings = findings.filter((f) => {
    const matchesFile = f.filePath.endsWith(currentFile.path) || currentFile.path.endsWith(f.filePath);
    if (!matchesFile) return false;
    if (selectedSeverity !== 'ALL' && f.severity !== selectedSeverity) return false;
    return true;
  });

  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.09)] bg-[#0A1115] overflow-hidden shadow-sleek-md">
      {/* File Navigation & Severity Filter Toolbar */}
      <div className="bg-[#04070A] border-b border-[rgba(255,255,255,0.09)] px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* File Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-0.5">
          {files.map((file, idx) => {
            const isSelected = idx === activeFileIndex;
            const fileFindingCount = findings.filter(
              (f) => f.filePath.endsWith(file.path) || file.path.endsWith(f.filePath)
            ).length;

            return (
              <button
                key={file.path}
                onClick={() => setActiveFileIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-[#0A1115] text-[#F3F7F5] border-[rgba(52,229,165,0.45)] font-bold shadow-sleek-sm ring-1 ring-[rgba(52,229,165,0.45)]/20'
                    : 'bg-[#04070A]/60 text-[#9AA7A1] border-[rgba(255,255,255,0.09)] hover:bg-[#0A1115] hover:text-[#F3F7F5]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-[#34E5A5]" />
                <span>{file.path}</span>
                <span className="text-[10px] text-[#34E5A5] font-bold">+{file.additions}</span>
                <span className="text-[10px] text-[#FF6B7A] font-bold">-{file.deletions}</span>
                {fileFindingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[rgba(255,93,108,0.10)] text-[#FF6B7A] border border-[rgba(255,93,108,0.32)] text-[10px] font-bold">
                    {fileFindingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-[#9AA7A1] text-[11px] mr-1 font-semibold">Filter:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] transition-all border font-semibold ${
                selectedSeverity === sev
                  ? 'bg-[rgba(52,229,165,0.10)] text-[#34E5A5] border-[rgba(52,229,165,0.28)] shadow-sm'
                  : 'bg-transparent text-[#9AA7A1] border-transparent hover:text-[#F3F7F5]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Code Lines with Inline Finding Cards */}
      <div className="font-mono text-xs overflow-x-auto divide-y divide-[rgba(255,255,255,0.09)]/50">
        {currentFile.lines.map((line, lineIndex) => {
          const matchingFindings = line.newLine
            ? fileFindings.filter((f) => f.startLine === line.newLine)
            : [];

          const isAdd = line.type === 'add';
          const isDel = line.type === 'delete';

          return (
            <React.Fragment key={lineIndex}>
              <div
                className={`flex items-stretch hover:bg-[#04070A] transition-colors ${
                  isAdd
                    ? 'bg-emerald-50 text-[#34E5A5]'
                    : isDel
                    ? 'bg-rose-50 text-[#FF6B7A]'
                    : 'text-[#F3F7F5]'
                }`}
              >
                {/* Line Numbers Column */}
                <div className="w-10 shrink-0 select-none text-right pr-2 py-0.5 text-[#9AA7A1] bg-[#04070A] border-r border-[rgba(255,255,255,0.09)] text-[11px]">
                  {line.oldLine || ''}
                </div>
                <div className="w-10 shrink-0 select-none text-right pr-2 py-0.5 text-[#9AA7A1] bg-[#04070A] border-r border-[rgba(255,255,255,0.09)] text-[11px]">
                  {line.newLine || ''}
                </div>

                {/* Diff Prefix (+ / - / space) */}
                <div className="w-5 shrink-0 select-none text-center py-0.5 font-bold">
                  {isAdd ? '+' : isDel ? '-' : ' '}
                </div>

                {/* Code Line Content */}
                <div className="flex-1 py-0.5 pr-4 whitespace-pre font-mono text-[11px]">{line.content}</div>
              </div>

              {/* Inline Review Finding Callout Box */}
              {matchingFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="p-5 my-3 mx-6 rounded-2xl border border-[rgba(255,93,108,0.32)] bg-[#FFF8F8] shadow-sleek-md text-[#F3F7F5]"
                >
                  <div className="flex items-start justify-between gap-4 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                          finding.severity === 'CRITICAL'
                            ? 'bg-[rgba(255,93,108,0.10)] text-[#FF6B7A] border border-[rgba(255,93,108,0.32)]'
                            : 'bg-[rgba(255,180,84,0.10)] text-[#FFB454] border border-[rgba(255,180,84,0.32)]'
                        }`}
                      >
                        [{finding.severity}] {finding.category}
                      </span>
                      <h4 className="font-bold text-[#F3F7F5] text-xs font-display">{finding.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#9AA7A1] font-mono">{finding.confidence}% confidence</span>
                      {onDismissFinding && !finding.dismissed && (
                        <button
                          onClick={() => onDismissFinding(finding.id, 'User marked as resolved/dismissed')}
                          className="px-2.5 py-0.5 rounded-lg bg-[#0A1115] text-[#9AA7A1] hover:text-[#FF6B7A] text-[11px] border border-[rgba(255,255,255,0.09)] font-medium"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#9AA7A1] mb-3.5 leading-relaxed">{finding.explanation}</p>

                  <div className="p-3 rounded-xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] mb-3">
                    <span className="text-[10px] text-[#34E5A5] font-bold block mb-1 uppercase tracking-wider font-mono">
                      Remediation Guidance:
                    </span>
                    <p className="text-xs text-[#F3F7F5]">{finding.remediation}</p>
                  </div>

                  {finding.suggestedPatch && (
                    <div className="mb-2.5">
                      <span className="text-[10px] text-[#34E5A5] font-bold block mb-1 uppercase tracking-wider font-mono">
                        Suggested Diff Patch:
                      </span>
                      <pre className="p-3 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] text-[#34E5A5] text-xs overflow-x-auto whitespace-pre font-mono">
                        {finding.suggestedPatch}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-[#9AA7A1] pt-3 border-t border-[rgba(255,255,255,0.09)] font-mono">
                    <span className="text-[#34E5A5] font-semibold">Published to GitHub Check Run & Conversation</span>
                    <div className="flex items-center gap-2">
                      <span>Helpful?</span>
                      <button className="p-1 rounded-md hover:bg-[#0A1115] text-[#9AA7A1] hover:text-[#34E5A5]">
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 rounded-md hover:bg-[#0A1115] text-[#9AA7A1] hover:text-[#FF6B7A]">
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
