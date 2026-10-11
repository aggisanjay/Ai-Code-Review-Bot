'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle,
  FileCode,
  X,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Check,
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
    return <div className="p-8 text-center text-zinc-500 font-mono text-xs">No diff files to display.</div>;
  }

  // Filter findings for the active file
  const fileFindings = findings.filter((f) => {
    const matchesFile = f.filePath.endsWith(currentFile.path) || currentFile.path.endsWith(f.filePath);
    if (!matchesFile) return false;
    if (selectedSeverity !== 'ALL' && f.severity !== selectedSeverity) return false;
    return true;
  });

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#08090C] overflow-hidden shadow-2xl">
      {/* File Navigation & Severity Filter Toolbar */}
      <div className="bg-[#0B0D12] border-b border-white/[0.08] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* File Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5">
          {files.map((file, idx) => {
            const isSelected = idx === activeFileIndex;
            const fileFindingCount = findings.filter(
              (f) => f.filePath.endsWith(file.path) || file.path.endsWith(f.filePath)
            ).length;

            return (
              <button
                key={file.path}
                onClick={() => setActiveFileIndex(idx)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-[#151924] text-white border-blue-500/40 shadow-sm'
                    : 'bg-zinc-900/40 text-zinc-400 border-white/[0.05] hover:bg-zinc-900/80 hover:text-zinc-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium">{file.path}</span>
                <span className="text-[10px] text-emerald-400">+{file.additions}</span>
                <span className="text-[10px] text-rose-400">-{file.deletions}</span>
                {fileFindingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-bold">
                    {fileFindingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-1 text-xs font-mono">
          <span className="text-zinc-500 text-[11px] mr-1">Filter:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2 py-0.5 rounded text-[11px] transition-all border ${
                selectedSeverity === sev
                  ? 'bg-zinc-800 text-white border-white/[0.15] font-semibold'
                  : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Code Lines with Inline Finding Cards */}
      <div className="font-mono text-xs overflow-x-auto divide-y divide-white/[0.02]">
        {currentFile.lines.map((line, lineIndex) => {
          const matchingFindings = line.newLine
            ? fileFindings.filter((f) => f.startLine === line.newLine)
            : [];

          const isAdd = line.type === 'add';
          const isDel = line.type === 'delete';

          return (
            <React.Fragment key={lineIndex}>
              <div
                className={`flex items-stretch hover:bg-white/[0.02] transition-colors ${
                  isAdd
                    ? 'bg-emerald-500/10 text-emerald-200'
                    : isDel
                    ? 'bg-rose-500/10 text-rose-200'
                    : 'text-zinc-400'
                }`}
              >
                {/* Line Numbers Column */}
                <div className="w-10 shrink-0 select-none text-right pr-2 py-0.5 text-zinc-600 bg-[#07080A] border-r border-white/[0.05] text-[11px]">
                  {line.oldLine || ''}
                </div>
                <div className="w-10 shrink-0 select-none text-right pr-2 py-0.5 text-zinc-600 bg-[#07080A] border-r border-white/[0.05] text-[11px]">
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
                  className="p-4 my-2 mx-6 rounded-lg border border-rose-500/30 bg-[#0D0F16] shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          finding.severity === 'CRITICAL'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                        }`}
                      >
                        [{finding.severity}] {finding.category}
                      </span>
                      <h4 className="font-semibold text-zinc-200 text-xs">{finding.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-mono">{finding.confidence}% confidence</span>
                      {onDismissFinding && !finding.dismissed && (
                        <button
                          onClick={() => onDismissFinding(finding.id, 'User marked as resolved/dismissed')}
                          className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white text-[11px] border border-white/[0.08]"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{finding.explanation}</p>

                  <div className="p-2.5 rounded-md bg-[#0A0C10] border border-white/[0.06] mb-3">
                    <span className="text-[10px] text-emerald-400 font-bold block mb-1 uppercase tracking-wider font-mono">
                      Remediation Guidance:
                    </span>
                    <p className="text-xs text-zinc-300">{finding.remediation}</p>
                  </div>

                  {finding.suggestedPatch && (
                    <div className="mb-2">
                      <span className="text-[10px] text-blue-400 font-bold block mb-1 uppercase tracking-wider font-mono">
                        Suggested Diff Patch:
                      </span>
                      <pre className="p-2.5 rounded-md bg-[#08090C] border border-white/[0.08] text-emerald-300 text-xs overflow-x-auto whitespace-pre font-mono">
                        {finding.suggestedPatch}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-white/[0.06] font-mono">
                    <span className="text-blue-400">Published to GitHub Check Run & Conversation</span>
                    <div className="flex items-center gap-2">
                      <span>Helpful?</span>
                      <button className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400">
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400">
                        <ThumbsDown className="w-3 h-3" />
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
