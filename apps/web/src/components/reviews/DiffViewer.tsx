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
  Zap,
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
    return <div className="p-8 text-center text-slate-500">No diff files to display.</div>;
  }

  // Filter findings for the active file
  const fileFindings = findings.filter((f) => {
    const matchesFile = f.filePath.endsWith(currentFile.path) || currentFile.path.endsWith(f.filePath);
    if (!matchesFile) return false;
    if (selectedSeverity !== 'ALL' && f.severity !== selectedSeverity) return false;
    return true;
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
      {/* File Navigation & Severity Filter Toolbar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* File Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {files.map((file, idx) => {
            const isSelected = idx === activeFileIndex;
            const fileFindingCount = findings.filter(
              (f) => f.filePath.endsWith(file.path) || file.path.endsWith(f.filePath)
            ).length;

            return (
              <button
                key={file.path}
                onClick={() => setActiveFileIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-slate-800 text-slate-100 border-indigo-500/50 shadow-sm'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800/80 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium">{file.path}</span>
                <span className="text-[10px] text-emerald-400">+{file.additions}</span>
                <span className="text-[10px] text-red-400">-{file.deletions}</span>
                {fileFindingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold">
                    {fileFindingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-400 text-[11px] mr-1">Filter:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2 py-0.5 rounded text-[11px] transition-all border ${
                selectedSeverity === sev
                  ? 'bg-slate-800 text-slate-100 border-indigo-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Code Lines with Inline Finding Cards */}
      <div className="font-mono text-xs overflow-x-auto divide-y divide-slate-900/60">
        {currentFile.lines.map((line, lineIndex) => {
          // Check if there are findings pinned to this new line
          const matchingFindings = line.newLine
            ? fileFindings.filter((f) => f.startLine === line.newLine)
            : [];

          const isAdd = line.type === 'add';
          const isDel = line.type === 'delete';

          return (
            <React.Fragment key={lineIndex}>
              <div
                className={`flex items-stretch hover:bg-slate-900/40 transition-colors ${
                  isAdd ? 'bg-emerald-950/15 text-emerald-200' : isDel ? 'bg-red-950/15 text-red-300' : 'text-slate-300'
                }`}
              >
                {/* Line Numbers Column */}
                <div className="w-12 shrink-0 select-none text-right pr-2 py-1 text-slate-400 bg-slate-950/80 border-r border-slate-900 text-[11px]">
                  {line.oldLine || ''}
                </div>
                <div className="w-12 shrink-0 select-none text-right pr-2 py-1 text-slate-400 bg-slate-950/80 border-r border-slate-900 text-[11px]">
                  {line.newLine || ''}
                </div>

                {/* Diff Prefix (+ / - / space) */}
                <div className="w-6 shrink-0 select-none text-center py-1 font-bold">
                  {isAdd ? '+' : isDel ? '-' : ' '}
                </div>

                {/* Code Line Content */}
                <div className="flex-1 py-1 pr-4 whitespace-pre font-mono">{line.content}</div>
              </div>

              {/* Inline Review Finding Callout Box */}
              {matchingFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="p-4 my-2 mx-6 rounded-xl border border-red-500/30 bg-slate-900/90 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                          finding.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        }`}
                      >
                        [{finding.severity}] {finding.category}
                      </span>
                      <h4 className="font-semibold text-slate-100 text-sm">{finding.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-mono">{finding.confidence}% confidence</span>
                      {onDismissFinding && !finding.dismissed && (
                        <button
                          onClick={() => onDismissFinding(finding.id, 'User marked as resolved/dismissed')}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-700"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">{finding.explanation}</p>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 mb-3">
                    <span className="text-[11px] text-emerald-400 font-bold block mb-1">
                      Actionable Remediation:
                    </span>
                    <p className="text-xs text-slate-300">{finding.remediation}</p>
                  </div>

                  {finding.suggestedPatch && (
                    <div className="mb-2">
                      <span className="text-[11px] text-indigo-400 font-bold block mb-1">
                        Suggested Diff Patch:
                      </span>
                      <pre className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs overflow-x-auto whitespace-pre">
                        {finding.suggestedPatch}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <span className="text-indigo-400">Published to GitHub PR Check & Inline Comment</span>
                    <div className="flex items-center gap-2">
                      <span>Was this helpful?</span>
                      <button className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400">
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400">
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
