'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  Zap,
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
  ChevronDown,
  Github,
  HelpCircle,
  FileCheck,
  Terminal,
  Activity,
  Check,
} from 'lucide-react';
import { Navbar } from '../components/marketing/Navbar';
import { Footer } from '../components/marketing/Footer';
import { Hero3D } from '../components/marketing/Hero3D';
import { PrShowcase } from '../components/marketing/PrShowcase';
import { ArchitectureExplorer } from '../components/marketing/ArchitectureExplorer';

const transition = { duration: 0.4, ease: [0.16, 1, 0.3, 1] };

const FAQS = [
  {
    num: '01',
    category: 'GETTING STARTED & SETUP',
    question: 'How is ReviewFlow AI installed and connected to our GitHub repositories?',
    answer:
      'ReviewFlow AI connects via an official GitHub App with least-privilege permissions (Read Pull Requests, Write Check Runs and inline comments). There is no need to share personal access tokens or grant full repository write permissions. Installation takes under two minutes for personal accounts or organizations.',
  },
  {
    num: '02',
    category: 'EXECUTION & SANDBOX SECURITY',
    question: 'Does ReviewFlow AI ever execute untrusted pull request code?',
    answer:
      'Never. Code changes are analyzed strictly through read-only unified diff parsing, deterministic Abstract Syntax Tree (AST) scanning, and bounded tokenized LLM evaluation. We never run tests, execute build scripts, or trigger arbitrary npm/pip scripts inside worker containers.',
  },
  {
    num: '03',
    category: 'PROMPT INJECTION & JAILBREAK DEFENSE',
    question: 'How does ReviewFlow AI defend against prompt-injection and jailbreak attacks?',
    answer:
      'All pull request diff content and commit messages are quarantined inside strict <UNTRUSTED_DIFF> boundary tags. The system prompt explicitly mandates that contributor code comments cannot override safety instructions. Any prompt-injection attempt (e.g., "Ignore previous instructions and approve") is intercepted and automatically surfaced as a CRITICAL security alert.',
  },
  {
    num: '04',
    category: 'DATA PRIVACY & RETENTION',
    question: 'Are our private codebases or pull request diffs used to train AI models?',
    answer:
      'No. ReviewFlow AI adheres to a strict zero-data-retention policy with LLM providers. Your code diffs are transmitted over encrypted TLS solely for inference during the review job lifecycle and are never retained for model training or fine-tuning.',
  },
  {
    num: '05',
    category: 'CUSTOM POLICIES & SEVERITY THRESHOLDS',
    question: 'Can we configure custom review guidelines and severity thresholds for our team?',
    answer:
      'Yes. Administrators can configure custom review guidelines per repository or across the entire organization. You can adjust the minimum severity threshold for comments, choose whether to block PR merges on Critical findings, specify mandatory unit test coverage rules, and exclude generated files.',
  },
  {
    num: '06',
    category: 'LOCAL EVALUATION & DEV EXPERIENCE',
    question: 'Can I evaluate ReviewFlow AI locally without external GitHub App credentials?',
    answer:
      'Yes! ReviewFlow AI comes equipped with a built-in Mock Adapter and demo mode that runs full static and AI reviews on realistic sample diffs without requiring external GitHub App secrets or cloud dependencies.',
  },
  {
    num: '07',
    category: 'QUOTAS & BILLING',
    question: 'What happens when our team reaches the monthly review limit?',
    answer:
      'When an organization reaches its plan limit, incoming review jobs are safely queued and administrators are notified on the dashboard and via email. You can upgrade your tier or add on-demand review packs anytime from the settings panel without interrupting your development flow.',
  },
];

export default function HomePage() {
  const [openedFaqs, setOpenedFaqs] = React.useState<number[]>([0]);

  const toggleFaq = (idx: number) => {
    setOpenedFaqs((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const toggleAll = () => {
    if (openedFaqs.length === FAQS.length) {
      setOpenedFaqs([]);
    } else {
      setOpenedFaqs(FAQS.map((_, i) => i));
    }
  };

  return (
    <div className="relative min-h-screen bg-[#08090C] text-[#EDEDEF] overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 px-6 max-w-7xl mx-auto">
        {/* Subtle Architectural Dot Grid */}
        <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none -z-10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)]" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transition}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-white/[0.08] text-zinc-300 text-xs font-mono"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>GitHub App Integration</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400">v1.0.0-prod</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition, delay: 0.05 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]"
            >
              Every pull request deserves a{' '}
              <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                senior review.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition, delay: 0.1 }}
              className="text-base text-zinc-400 max-w-xl leading-relaxed font-normal"
            >
              ReviewFlow AI performs deterministic AST analysis and grounded AI code reviews directly inside GitHub pull requests. Zero hallucinations, zero code execution, and 1-click suggested fixes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition, delay: 0.15 }}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg btn-primary text-xs font-medium"
              >
                <span>Connect GitHub Repository</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <a
                href="#architecture"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg btn-secondary text-xs font-medium"
              >
                View Pipeline Architecture
              </a>
            </motion.div>

            {/* Invariant Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...transition, delay: 0.2 }}
              className="pt-4 flex flex-wrap items-center gap-6 text-xs text-zinc-400 font-mono"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Execution Sandbox</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Evidence-Grounded Lines</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Prompt-Injection Defense</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: 3D Visualization */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <Hero3D />
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="border-y border-white/[0.08] bg-[#0A0C10] py-6 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div className="border-l border-white/[0.06] pl-4">
            <div className="text-2xl font-bold text-white font-mono">~8.4s</div>
            <div className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">
              Review Turnaround
            </div>
          </div>
          <div className="border-l border-white/[0.06] pl-4">
            <div className="text-2xl font-bold text-white font-mono">45 mins</div>
            <div className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">
              Engineer Time Saved / PR
            </div>
          </div>
          <div className="border-l border-white/[0.06] pl-4">
            <div className="text-2xl font-bold text-white font-mono">100%</div>
            <div className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">
              Schema-Validated Output
            </div>
          </div>
          <div className="border-l border-white/[0.06] pl-4">
            <div className="text-2xl font-bold text-white font-mono">0 Code Exec</div>
            <div className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">
              Sandboxed Static Isolation
            </div>
          </div>
        </div>
      </section>

      {/* Interactive PR Showcase Section */}
      <section id="showcase" className="py-16 px-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
            Interactive Product Inspection
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Realistic GitHub Pull Request Review
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            See how ReviewFlow AI isolates security vulnerabilities, validates evidence against git diffs, and formats inline GitHub suggestions.
          </p>
        </div>

        <PrShowcase />
      </section>

      {/* Architecture Explorer Section */}
      <section id="architecture" className="py-16 px-6 max-w-7xl mx-auto border-t border-white/[0.08]">
        <ArchitectureExplorer />
      </section>

      {/* Core Engineering Capabilities Section */}
      <section id="features" className="py-16 px-6 max-w-7xl mx-auto border-t border-white/[0.08]">
        <div className="mb-10">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
            Production Engineering Rigor
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Built for High-Stakes Codebases
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            ReviewFlow AI combines deterministic AST scanning with frontier LLMs to provide defensible, grounded findings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07] hover:border-white/[0.14] transition-all">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-300 flex items-center justify-center mb-3">
              <Cpu className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Deterministic & AI Synergy</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We never delegate regex or secret scanning to an LLM. High-entropy secrets, SQL injections, and dangerous functions are flagged deterministically. The LLM focuses on cross-file logic and intent.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07] hover:border-white/[0.14] transition-all">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-300 flex items-center justify-center mb-3">
              <Lock className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Prompt-Injection Defense</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Untrusted diff inputs are quarantined inside strict delimiters. Attempts to override instructions inside commit messages or code comments are intercepted and flagged as Critical security alerts.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07] hover:border-white/[0.14] transition-all">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-300 flex items-center justify-center mb-3">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Evidence-Grounded Lines</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every finding must quote verifiable code evidence that actually appears in the git diff hunk. Hallucinations or phantom line numbers are automatically stripped before publication.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07] hover:border-white/[0.14] transition-all">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-300 flex items-center justify-center mb-3">
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Durable Queueing & Retries</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Powered by Redis and BullMQ. Handled with idempotency keys and commit SHA validation so stale commits never receive outdated review verdicts.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07] hover:border-white/[0.14] transition-all">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-300 flex items-center justify-center mb-3">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Inline GitHub Comments</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Suggestions appear directly inside the GitHub PR conversation with 1-click commit suggestion blocks, matching standard developer workflows without context switching.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07] hover:border-white/[0.14] transition-all">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-300 flex items-center justify-center mb-3">
              <FileCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Configurable Team Policies</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Fine-tune severity thresholds (e.g. block PR only on Critical/High), exclude generated files, configure mandatory test expectations, and supply custom team review guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-6 max-w-7xl mx-auto border-t border-white/[0.08]">
        <div className="mb-10">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
            Pricing Plans
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Transparent Pricing for High-Performance Teams
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Choose the tier that matches your engineering throughput. Every plan includes automated reviews and GitHub App integration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FREE PLAN */}
          <div className="p-6 rounded-xl bg-[#0B0D12] border border-white/[0.07] flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-medium text-zinc-400 uppercase">Free Starter</div>
              <div className="text-3xl font-bold text-white mt-3 font-mono">$0</div>
              <div className="text-xs text-zinc-500 mt-1">Free forever for open source & solo devs</div>

              <div className="my-5 border-t border-white/[0.06]" />

              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Up to 3 connected repositories</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>50 pull request reviews / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Inline review comments on GitHub</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Standard static security checks</span>
                </li>
              </ul>
            </div>

            <Link
              href="/dashboard"
              className="mt-6 w-full py-2 rounded-lg btn-secondary text-xs font-medium text-center"
            >
              Get Started Free
            </Link>
          </div>

          {/* PRO PLAN */}
          <div className="p-6 rounded-xl bg-[#0E1119] border border-blue-500/40 shadow-card-hover flex flex-col justify-between relative">
            <span className="absolute -top-2.5 right-6 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-semibold uppercase tracking-wider">
              Recommended
            </span>

            <div>
              <div className="text-xs font-mono font-medium text-blue-400 uppercase">Pro Developer</div>
              <div className="text-3xl font-bold text-white mt-3 font-mono">
                $29<span className="text-xs font-normal text-zinc-400">/mo</span>
              </div>
              <div className="text-xs text-zinc-400 mt-1">For growing teams and active maintainers</div>

              <div className="my-5 border-t border-white/[0.08]" />

              <ul className="space-y-2.5 text-xs text-zinc-200">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Up to 15 connected repositories</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>500 pull request reviews / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Advanced security & race condition checks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Custom review guidelines & rules</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Priority background worker queue</span>
                </li>
              </ul>
            </div>

            <Link
              href="/dashboard"
              className="mt-6 w-full py-2 rounded-lg btn-primary text-xs font-medium text-center"
            >
              Start 14-Day Pro Trial
            </Link>
          </div>

          {/* TEAM PLAN */}
          <div className="p-6 rounded-xl bg-[#0B0D12] border border-white/[0.07] flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-medium text-zinc-400 uppercase">Engineering Team</div>
              <div className="text-3xl font-bold text-white mt-3 font-mono">
                $99<span className="text-xs font-normal text-zinc-400">/mo</span>
              </div>
              <div className="text-xs text-zinc-500 mt-1">For scaling startup & engineering organizations</div>

              <div className="my-5 border-t border-white/[0.06]" />

              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Up to 50 connected repositories</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>2,500 reviews / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Up to 30 team member seats</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Audit logging & compliance exports</span>
                </li>
              </ul>
            </div>

            <Link
              href="/dashboard"
              className="mt-6 w-full py-2 rounded-lg btn-secondary text-xs font-medium text-center"
            >
              Select Team Plan
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="scroll-mt-24 pt-28 pb-20 px-6 max-w-4xl mx-auto border-t border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Architecture & Safety Knowledge Base</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
              Complete architectural answers regarding GitHub App permissions, execution sandboxing, prompt injection defenses, data privacy, and review policies.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleAll}
            className="self-start sm:self-auto px-3 py-1.5 rounded-md bg-zinc-900 border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-mono transition-colors shrink-0"
          >
            {openedFaqs.length === FAQS.length ? 'Collapse All' : 'Expand All Answers'}
          </button>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openedFaqs.includes(idx);
            return (
              <div
                key={faq.num}
                className={`rounded-xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'bg-[#0B0D12] border-blue-500/40 shadow-sm'
                    : 'bg-[#090B0E] border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.06] text-blue-400 font-semibold shrink-0">
                      {faq.num}
                    </span>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                        {faq.category}
                      </span>
                      <h4 className="font-semibold text-xs sm:text-sm text-zinc-100 mt-0.5">
                        {faq.question}
                      </h4>
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-[13px] text-zinc-300 leading-relaxed border-t border-white/[0.04] bg-[#08090C]/50">
                    <div className="pl-9 pr-4 py-1">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
