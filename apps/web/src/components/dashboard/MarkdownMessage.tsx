'use client';

import React from 'react';
import {
  Sparkles,
  Layers,
  FileCode2,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface MarkdownMessageProps {
  content: string;
}

interface InlineToken {
  type: 'citation' | 'bold-code' | 'bold' | 'code' | 'text';
  value: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  if (!content) return null;

  // 1. Normalize line endings, ensure headings have space, strip isolated horizontal rules
  const clean = content
    .replace(/\r\n/g, '\n')
    .replace(/^(#{2,3}\s+[^\n]+)\n([^\n#])/gm, '$1\n\n$2')
    .replace(/^\s*---\s*$/gm, '');

  // 2. Check if this is a structured architectural response
  const sectionRegex = /###\s+([^\n]+)\n+([\s\S]*?)(?=(?:###\s+|$))/g;
  const sections: { title: string; body: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(clean)) !== null) {
    sections.push({
      title: match[1].trim(),
      body: match[2].trim(),
    });
  }

  // If structured sections detected, render the specialized Executive Architectural Dossier
  if (sections.length >= 2) {
    return (
      <div className="space-y-4 font-sans text-xs sm:text-[13px] text-[#F3F7F5]">
        {sections.map((section, idx) => (
          <StructuredSectionCard key={idx} title={section.title} body={section.body} />
        ))}
      </div>
    );
  }

  // Fallback: render clean generic markdown blocks
  return <GenericMarkdownRenderer content={clean} />;
}

// ============================================================================
// Specialized Structured Section Cards
// ============================================================================

function StructuredSectionCard({ title, body }: { title: string; body: string }) {
  const cleanTitle = title.replace(/^[^\w\s]+/, '').trim();

  // 1. Executive Summary Card
  if (title.toLowerCase().includes('executive summary')) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[rgba(255,255,255,0.04)] to-white border border-[rgba(52,229,165,0.28)] p-4 sm:p-5 shadow-sleek-sm space-y-2.5">
        <div className="flex items-center gap-2 text-[#34E5A5] font-mono font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-[#34E5A5]" />
          <span>Executive Summary</span>
        </div>
        <div className="text-xs sm:text-sm leading-relaxed text-[#2A3B34]">
          {body.split(/\n\n+/).map((para, pIdx) => (
            <p key={pIdx} className="leading-relaxed">
              {renderFormattedInline(para)}
            </p>
          ))}
        </div>
      </div>
    );
  }

  // 2. Architecture & Implementation Details
  if (title.toLowerCase().includes('architecture')) {
    const items = body
      .split(/\n(?=[-*]\s+)/)
      .map((s) => s.trim())
      .filter(Boolean);

    return (
      <div className="rounded-2xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] p-4 sm:p-5 shadow-sleek-sm space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.09)]">
          <div className="flex items-center gap-2 text-[#F3F7F5] font-display font-bold text-sm sm:text-base">
            <Layers className="w-4 h-4 text-[#34E5A5]" />
            <span>Architecture & Implementation Details</span>
          </div>
          <span className="text-[11px] font-mono text-[#9AA7A1]">
            {items.length} {items.length === 1 ? 'mechanism' : 'mechanisms'}
          </span>
        </div>

        <div className="space-y-2.5">
          {items.map((it, idx) => {
            const itemMatch = it.match(/^[-*]\s+\*\*([^*]+)\*\*\s*:\s*([\s\S]*)$/);
            if (itemMatch) {
              const [, itemTitle, itemBody] = itemMatch;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.09)] space-y-1.5 transition-all hover:border-[rgba(52,229,165,0.28)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#126B50] shrink-0" />
                    <span className="font-bold text-[#F3F7F5] text-xs sm:text-[13px]">
                      {itemTitle}
                    </span>
                  </div>
                  <div className="pl-4 text-xs sm:text-[13px] leading-relaxed text-[#4A5952]">
                    {renderFormattedInline(itemBody)}
                  </div>
                </div>
              );
            }

            // Fallback line without strong title
            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.09)] text-xs sm:text-[13px] leading-relaxed text-[#4A5952]"
              >
                {renderFormattedInline(it.replace(/^[-*]\s+/, ''))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Key Components & Flow
  if (title.toLowerCase().includes('key components')) {
    const items = body
      .split(/\n(?=\d+\.\s+)/)
      .map((s) => s.trim())
      .filter(Boolean);

    return (
      <div className="rounded-2xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] p-4 sm:p-5 shadow-sleek-sm space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.09)]">
          <div className="flex items-center gap-2 text-[#F3F7F5] font-display font-bold text-sm sm:text-base">
            <Cpu className="w-4 h-4 text-[#34E5A5]" />
            <span>Key Components & Execution Flow</span>
          </div>
          <span className="text-[11px] font-mono text-[#9AA7A1]">
            {items.length} {items.length === 1 ? 'component' : 'components'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {items.map((it, idx) => {
            const itemMatch = it.match(/^\d+\.\s+\*\*`?([^`*]+)`?\*\*\s*:\s*([\s\S]*)$/);
            if (itemMatch) {
              const [, filePath, itemBody] = itemMatch;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.09)] space-y-2 hover:border-[rgba(52,229,165,0.28)] transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[rgba(52,229,165,0.10)] text-[#34E5A5] border border-[rgba(52,229,165,0.28)] font-bold text-[11px]">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#0A1115] border border-[rgba(255,255,255,0.09)] text-[#F3F7F5] font-bold text-xs flex items-center gap-1.5">
                        <FileCode2 className="w-3.5 h-3.5 text-[#34E5A5]" />
                        <span>{filePath}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-xs sm:text-[13px] leading-relaxed text-[#4A5952] pl-7">
                    {renderFormattedInline(itemBody)}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.09)] text-xs sm:text-[13px] leading-relaxed text-[#4A5952]"
              >
                {renderFormattedInline(it)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. Gaps, Caveats & Security Assessment
  if (title.toLowerCase().includes('gaps') || title.toLowerCase().includes('security')) {
    const items = body
      .split(/\n(?=[-*]\s+)/)
      .map((s) => s.trim())
      .filter(Boolean);

    return (
      <div className="rounded-2xl bg-[#FFFDF8] border border-[#FED7AA] p-4 sm:p-5 shadow-sleek-sm space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#FED7AA]/60">
          <div className="flex items-center gap-2 text-[#9A3412] font-display font-bold text-sm sm:text-base">
            <ShieldAlert className="w-4 h-4 text-[#EA580C]" />
            <span>Gaps, Caveats & Security Assessment</span>
          </div>
          <span className="text-[11px] font-mono text-[#9A3412] bg-[rgba(255,180,84,0.10)] border border-[rgba(255,180,84,0.32)] px-2 py-0.5 rounded-full font-bold">
            Audit Findings ({items.length})
          </span>
        </div>

        <div className="space-y-2.5">
          {items.map((it, idx) => {
            const itemMatch = it.match(/^[-*]\s+\*\*([^*]+)\*\*\s*:\s*([\s\S]*)$/);
            if (itemMatch) {
              const [, riskTitle, riskBody] = itemMatch;
              const isHighRisk =
                riskTitle.toLowerCase().includes('secret') ||
                riskTitle.toLowerCase().includes('hardcoded') ||
                riskTitle.toLowerCase().includes('vulnerability');

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#0A1115] border border-[#FED7AA] space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 ${
                          isHighRisk ? 'text-[#FF6B7A]' : 'text-[#FFB454]'
                        }`}
                      />
                      <span className="font-bold text-[#F3F7F5] text-xs sm:text-[13px]">
                        {riskTitle}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isHighRisk
                          ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]'
                          : 'bg-[rgba(255,180,84,0.10)] text-[#92400E] border border-[rgba(255,180,84,0.32)]'
                      }`}
                    >
                      {isHighRisk ? 'CRITICAL RISK' : 'GAP / LIMITATION'}
                    </span>
                  </div>
                  <div className="pl-6 text-xs sm:text-[13px] leading-relaxed text-[#B4C0BB]">
                    {renderFormattedInline(riskBody)}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#0A1115] border border-[#FED7AA] text-xs sm:text-[13px] leading-relaxed text-[#B4C0BB]"
              >
                {renderFormattedInline(it.replace(/^[-*]\s+/, ''))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 5. Generic Custom Section
  return (
    <div className="rounded-2xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] p-4 sm:p-5 shadow-sleek-sm space-y-3">
      <h3 className="text-sm sm:text-base font-bold text-[#F3F7F5] font-display pb-2 border-b border-[rgba(255,255,255,0.09)]">
        {cleanTitle}
      </h3>
      <div className="text-xs sm:text-[13px] leading-relaxed text-[#2A3B34]">
        {body.split(/\n\n+/).map((para, pIdx) => (
          <p key={pIdx} className="mb-2 leading-relaxed">
            {renderFormattedInline(para)}
          </p>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Generic Markdown Fallback Renderer
// ============================================================================

function GenericMarkdownRenderer({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-3.5 text-xs sm:text-[13px] leading-relaxed text-[#F3F7F5] font-sans">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();

        // 1. Heading 3: ### Heading
        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={bIdx}
              className="text-sm sm:text-base font-bold text-[#F3F7F5] font-display pt-2 pb-1 border-b border-[rgba(255,255,255,0.09)]"
            >
              {renderFormattedInline(trimmed.replace(/^###\s+/, ''))}
            </h3>
          );
        }

        // 2. Heading 2: ## Heading
        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={bIdx}
              className="text-base sm:text-lg font-bold text-[#F3F7F5] font-display pt-3 pb-1 border-b border-[rgba(255,255,255,0.09)]"
            >
              {renderFormattedInline(trimmed.replace(/^##\s+/, ''))}
            </h2>
          );
        }

        // 3. Bullet list: lines starting with "- " or "* "
        if (
          trimmed
            .split('\n')
            .every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '))
        ) {
          const items = trimmed.split('\n').map((l) => l.trim().replace(/^[-*]\s+/, ''));
          return (
            <ul key={bIdx} className="space-y-1.5 pl-1 my-2">
              {items.map((item, iIdx) => (
                <li
                  key={iIdx}
                  className="flex items-start gap-2 text-xs sm:text-[13px] text-[#2A3B34]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#126B50] mt-2 shrink-0" />
                  <div className="flex-1 leading-relaxed">{renderFormattedInline(item)}</div>
                </li>
              ))}
            </ul>
          );
        }

        // 4. Numbered list: lines starting with "1. ", "2. ", etc.
        if (trimmed.split('\n').every((line) => /^\d+\.\s+/.test(line.trim()))) {
          const items = trimmed.split('\n').map((l) => l.trim().replace(/^\d+\.\s+/, ''));
          return (
            <ol key={bIdx} className="space-y-2 pl-1 my-2">
              {items.map((item, iIdx) => (
                <li
                  key={iIdx}
                  className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[#2A3B34]"
                >
                  <span className="text-[11px] font-bold font-mono text-[#34E5A5] bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] rounded px-1.5 py-0.5 shrink-0">
                    {iIdx + 1}
                  </span>
                  <div className="flex-1 leading-relaxed">{renderFormattedInline(item)}</div>
                </li>
              ))}
            </ol>
          );
        }

        // 5. Code block
        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
          const lines = trimmed.split('\n');
          const codeContent = lines.slice(1, -1).join('\n');
          return (
            <div
              key={bIdx}
              className="my-2.5 rounded-xl bg-[#0C1411] text-[#E0ECE6] p-3.5 font-mono text-xs overflow-x-auto border border-[#21352D]"
            >
              <pre>
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }

        // 6. Horizontal Rule
        if (/^[-*_]{3,}$/.test(trimmed)) {
          return <hr key={bIdx} className="border-[rgba(255,255,255,0.09)] my-4" />;
        }

        // 7. Regular paragraph
        return (
          <p key={bIdx} className="leading-relaxed text-[#2A3B34]">
            {renderFormattedInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// ============================================================================
// High-Precision Inline Tokenizer & Renderer
// ============================================================================

/**
 * Tokenizes text and renders citations, bold code, bold text, and inline code
 * without breaking on nested asterisks and backticks.
 */
function renderFormattedInline(text: string): React.ReactNode {
  if (!text) return null;

  // Regex matches:
  // 1. Citations: [path/to/file.ext#L1-L25]
  // 2. Bold with backticks: **`code`**
  // 3. Bold text: **text**
  // 4. Inline code: `code`
  const tokenRegex =
    /(\[[a-zA-Z0-9_\-\.\/]+(?:#[a-zA-Z0-9_\-]+)?\]|\*\*`[^`]+`\*\*|\*\*[^*]+\*\*|`[^`]+`)/g;

  const rawParts = text.split(tokenRegex);
  const elements: React.ReactNode[] = [];

  rawParts.forEach((part, idx) => {
    if (!part) return;

    // A. Citation pill badge: [path/file.ext#L1-L20]
    if (part.startsWith('[') && part.endsWith(']')) {
      const citeText = part.slice(1, -1);
      elements.push(
        <span
          key={`cite-${idx}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[rgba(52,229,165,0.10)] text-[#34E5A5] font-mono text-[11px] font-bold border border-[rgba(52,229,165,0.28)] shadow-2xs mx-1 align-baseline hover:bg-[#D4ECE0] transition-colors cursor-pointer"
          title={`Source evidence: ${citeText}`}
        >
          <FileCode2 className="w-3 h-3 text-[#34E5A5] shrink-0" />
          <span>{citeText}</span>
        </span>
      );
      return;
    }

    // B. Bold code: **`code`**
    if (part.startsWith('**`') && part.endsWith('`**')) {
      const codeVal = part.slice(3, -3);
      elements.push(
        <span
          key={`boldcode-${idx}`}
          className="inline-flex items-center gap-1 bg-[rgba(52,229,165,0.10)] text-[#34E5A5] px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border border-[rgba(52,229,165,0.28)] mx-0.5"
        >
          <FileCode2 className="w-3 h-3 text-[#34E5A5] shrink-0" />
          <span>{codeVal}</span>
        </span>
      );
      return;
    }

    // C. Bold text: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      elements.push(
        <strong key={`bold-${idx}`} className="font-bold text-[#F3F7F5]">
          {part.slice(2, -2)}
        </strong>
      );
      return;
    }

    // D. Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      elements.push(
        <code
          key={`code-${idx}`}
          className="bg-[rgba(52,229,165,0.10)] text-[#34E5A5] px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border border-[rgba(52,229,165,0.28)] mx-0.5"
        >
          {part.slice(1, -1)}
        </code>
      );
      return;
    }

    // E. Regular text
    elements.push(part);
  });

  return elements;
}
