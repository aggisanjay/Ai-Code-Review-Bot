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
    return <div className="p-8 text-center text-[#66736D] font-mono text-xs">No diff files to display.</div>;
  }

  // Filter findings for the active file
  const fileFindings = findings.filter((f) => {
    const matchesFile = f.filePath.endsWith(currentFile.path) || currentFile.path.endsWith(f.filePath);
    if (!matchesFile) return false;
    if (selectedSeverity !== 'ALL' && f.severity !== selectedSeverity) return false;
    return true;
  });

  return (
    <div className="rounded-2xl border border-[#E4EAE6] bg-white overflow-hidden shadow-sleek-md">
      {/* File Navigation & Severity Filter Toolbar */}
      <div className="bg-[#F7F9F8] border-b border-[#E4EAE6] px-5 py-3 flex flex-wrap items-center justify-between gap-3">
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
                    ? 'bg-white text-[#14211D] border-[#126B50] font-bold shadow-sleek-sm ring-1 ring-[#126B50]/20'
                    : 'bg-white/60 text-[#66736D] border-[#E4EAE6] hover:bg-white hover:text-[#14211D]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-[#126B50]" />
                <span>{file.path}</span>
                <span className="text-[10px] text-[#16835B] font-bold">+{file.additions}</span>
                <span className="text-[10px] text-[#C43D4B] font-bold">-{file.deletions}</span>
                {fileFindingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#FDE8E8] text-[#C43D4B] border border-[#F8B4B4] text-[10px] font-bold">
                    {fileFindingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-[#66736D] text-[11px] mr-1 font-semibold">Filter:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] transition-all border font-semibold ${
                selectedSeverity === sev
                  ? 'bg-[#EAF5EF] text-[#126B50] border-[#C7E4D6] shadow-sm'
                  : 'bg-transparent text-[#66736D] border-transparent hover:text-[#14211D]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Code Lines with Inline Finding Cards */}
      <div className="font-mono text-xs overflow-x-auto divide-y divide-[#E4EAE6]/50">
        {currentFile.lines.map((line, lineIndex) => {
          const matchingFindings = line.newLine
            ? fileFindings.filter((f) => f.startLine === line.newLine)
            : [];

          const isAdd = line.type === 'add';
          const isDel = line.type === 'delete';

          return (
            <React.Fragment key={lineIndex}>
              <div
                className={`flex items-stretch hover:bg-[#F7F9F8] transition-colors ${
                  isAdd
                    ? 'bg-emerald-50 text-[#126B50]'
                    : isDel
                    ? 'bg-rose-50 text-[#C43D4B]'
                    : 'text-[#14211D]'
                }`}
              >
                {/* Line Numbers Column */}
                <div className="w-10 shrink-0 select-none text-right pr-2 py-0.5 text-[#66736D] bg-[#F7F9F8] border-r border-[#E4EAE6] text-[11px]">
                  {line.oldLine || ''}
                </div>
                <div className="w-10 shrink-0 select-none text-right pr-2 py-0.5 text-[#66736D] bg-[#F7F9F8] border-r border-[#E4EAE6] text-[11px]">
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
                  className="p-5 my-3 mx-6 rounded-2xl border border-[#F8B4B4] bg-[#FFF8F8] shadow-sleek-md text-[#14211D]"
                >
                  <div className="flex items-start justify-between gap-4 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                          finding.severity === 'CRITICAL'
                            ? 'bg-[#FDE8E8] text-[#C43D4B] border border-[#F8B4B4]'
                            : 'bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A]'
                        }`}
                      >
                        [{finding.severity}] {finding.category}
                      </span>
                      <h4 className="font-bold text-[#14211D] text-xs font-display">{finding.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#66736D] font-mono">{finding.confidence}% confidence</span>
                      {onDismissFinding && !finding.dismissed && (
                        <button
                          onClick={() => onDismissFinding(finding.id, 'User marked as resolved/dismissed')}
                          className="px-2.5 py-0.5 rounded-lg bg-white text-[#66736D] hover:text-[#C43D4B] text-[11px] border border-[#E4EAE6] font-medium"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#66736D] mb-3.5 leading-relaxed">{finding.explanation}</p>

                  <div className="p-3 rounded-xl bg-white border border-[#E4EAE6] mb-3">
                    <span className="text-[10px] text-[#126B50] font-bold block mb-1 uppercase tracking-wider font-mono">
                      Remediation Guidance:
                    </span>
                    <p className="text-xs text-[#14211D]">{finding.remediation}</p>
                  </div>

                  {finding.suggestedPatch && (
                    <div className="mb-2.5">
                      <span className="text-[10px] text-[#126B50] font-bold block mb-1 uppercase tracking-wider font-mono">
                        Suggested Diff Patch:
                      </span>
                      <pre className="p-3 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] text-[#126B50] text-xs overflow-x-auto whitespace-pre font-mono">
                        {finding.suggestedPatch}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-[#66736D] pt-3 border-t border-[#E4EAE6] font-mono">
                    <span className="text-[#126B50] font-semibold">Published to GitHub Check Run & Conversation</span>
                    <div className="flex items-center gap-2">
                      <span>Helpful?</span>
                      <button className="p-1 rounded-md hover:bg-white text-[#66736D] hover:text-[#16835B]">
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 rounded-md hover:bg-white text-[#66736D] hover:text-[#C43D4B]">
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
