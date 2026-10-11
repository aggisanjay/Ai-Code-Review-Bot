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
} from 'lucide-react';
import { Navbar } from '../components/marketing/Navbar';
import { Footer } from '../components/marketing/Footer';
import { Hero3D } from '../components/marketing/Hero3D';
import { PrShowcase } from '../components/marketing/PrShowcase';
import { ArchitectureExplorer } from '../components/marketing/ArchitectureExplorer';
import { PLAN_CONFIGS } from '@reviewflow/shared';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#090D16] text-slate-100 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {/* Glow ambient background lights */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/10 to-cyan-500/15 blur-[120px] pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Next-Gen GitHub App Integration</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-400 font-mono">v1.0.0</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]"
            >
              Every pull request deserves a{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                senior review.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed"
            >
              ReviewFlow AI analyzes code changes, catches subtle defects, flags security vulnerabilities, and delivers actionable feedback directly in GitHub pull requests with zero hallucinations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold text-sm hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-glow hover:scale-[1.02]"
              >
                <span>Connect GitHub</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#architecture"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/90 text-slate-200 border border-slate-700 font-semibold text-sm hover:bg-slate-800 transition-all"
              >
                Explore Review Pipeline
              </a>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-6 flex flex-wrap items-center gap-6 text-xs text-slate-400"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Code Execution Sandbox</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Evidence-Grounded Lines</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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
      <section className="border-y border-slate-800/80 bg-slate-950/60 py-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-extrabold text-white font-mono">~8.4s</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Average Review Turnaround</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-cyan-400 font-mono">45 mins</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Engineering Time Saved / PR</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-indigo-400 font-mono">100%</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Zod-Validated Schema Output</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">0 Code Exec</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Read-Only Static Isolation</div>
          </div>
        </div>
      </section>

      {/* Interactive PR Showcase Section */}
      <section id="showcase" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Interactive Product Showcase
          </span>
          <h2 className="text-3xl font-extrabold text-slate-100 mt-3">
            Inspect a Real Pull Request Review
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
            Experience how ReviewFlow AI flags cryptographic fallbacks, TOCTOU race conditions, and generates line-specific suggested patches.
          </p>
        </div>

        <PrShowcase />
      </section>

      {/* Architecture Explorer Section */}
      <section id="architecture" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <ArchitectureExplorer />
      </section>

      {/* Core Engineering Capabilities Section */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-16">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            Built for Production Reliability
          </span>
          <h2 className="text-3xl font-extrabold text-slate-100 mt-3">
            Architected for Rigor, Not Vague Summaries
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
            ReviewFlow AI combines deterministic AST scanning with frontier LLMs to provide defensible, grounded findings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Deterministic & AI Synergy</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We never ask an LLM to do regex work. Secrets, SQL injections, and dangerous function calls are flagged deterministically. The LLM handles cross-file logic, concurrency, and context.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Prompt-Injection Defense</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Untrusted diff inputs are quarantined inside strict delimiters. Attempts to override reviewer instructions in commit messages or code comments are intercepted and flagged as Critical security alerts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Evidence-Grounded Lines</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every finding must quote verifiable code evidence that actually appears in the git diff. Hallucinations or phantom line numbers are automatically stripped before publication.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-purple-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Durable Queueing & Retries</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Powered by Redis and PostgreSQL. Handled with idempotency keys and commit SHA validation so stale commits never receive outdated review verdicts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-amber-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Inline GitHub Comments</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Suggestions appear directly inside the GitHub PR conversation with 1-click commit suggestion blocks, matching standard developer workflows without context switching.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Configurable Team Policies</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fine-tune severity thresholds (e.g. block PR only on Critical/High), exclude generated files, configure mandatory test expectations, and supply custom team review guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-16">
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Simple, Transparent Pricing
          </span>
          <h2 className="text-3xl font-extrabold text-slate-100 mt-3">
            Scale From Side Project to Enterprise Monorepo
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
            Choose the plan that fits your engineering volume. Every tier includes automated reviews and GitHub App integration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FREE PLAN */}
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-300">Free Starter</div>
              <div className="text-4xl font-extrabold text-white mt-4 font-mono">$0</div>
              <div className="text-xs text-slate-400 mt-1">Free forever for open source & solo devs</div>

              <div className="my-6 border-t border-slate-800" />

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 3 connected repositories</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>50 pull request reviews / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Inline review comments on GitHub</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Standard static security checks</span>
                </li>
              </ul>
            </div>

            <Link
              href="/dashboard"
              className="mt-8 w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold text-center hover:bg-slate-700 transition-all"
            >
              Get Started Free
            </Link>
          </div>

          {/* PRO PLAN */}
          <div className="p-8 rounded-2xl bg-slate-900/80 border-2 border-indigo-500 shadow-glow flex flex-col justify-between relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold tracking-wide uppercase">
              Most Popular
            </span>

            <div>
              <div className="text-sm font-semibold text-indigo-300">Pro Developer</div>
              <div className="text-4xl font-extrabold text-white mt-4 font-mono">
                $29<span className="text-sm font-normal text-slate-400">/mo</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">For growing teams and active maintainers</div>

              <div className="my-6 border-t border-slate-800" />

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Up to 15 connected repositories</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>500 pull request reviews / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Advanced security & race condition checks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Custom review guidelines & rules</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Priority background queue</span>
                </li>
              </ul>
            </div>

            <Link
              href="/dashboard"
              className="mt-8 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-semibold text-center hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-glow"
            >
              Start 14-Day Pro Trial
            </Link>
          </div>

          {/* TEAM PLAN */}
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-300">Engineering Team</div>
              <div className="text-4xl font-extrabold text-white mt-4 font-mono">
                $99<span className="text-sm font-normal text-slate-400">/mo</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">For scaling startup & engineering organizations</div>

              <div className="my-6 border-t border-slate-800" />

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 50 connected repositories</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>2,500 reviews / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 30 team member seats</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Audit logging & compliance exports</span>
                </li>
              </ul>
            </div>

            <Link
              href="/dashboard"
              className="mt-8 w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold text-center hover:bg-slate-700 transition-all"
            >
              Select Team Plan
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl font-extrabold text-slate-100 mt-3">
            Everything You Need to Know
          </h2>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <h4 className="font-semibold text-sm text-slate-200 mb-2">
              Does ReviewFlow AI ever execute pull request code?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No. Code is inspected through read-only static analysis and tokenized LLM diff evaluation. We never run tests, execute build scripts, or evaluate untrusted code in the application worker containers.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <h4 className="font-semibold text-sm text-slate-200 mb-2">
              How are prompt-injection attacks prevented?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              All repository content is isolated in strict untrusted tags. The system prompts explicitly mandate that contributor code comments cannot override safety instructions. Any prompt injection attempts are detected and recorded as Critical findings.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <h4 className="font-semibold text-sm text-slate-200 mb-2">
              Can I configure custom guidelines for my team?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yes. ReviewFlow AI allows administrators to configure custom review guidelines, severity thresholds, file exclusion patterns, and required test expectations per repository or organization.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <h4 className="font-semibold text-sm text-slate-200 mb-2">
              Can I test ReviewFlow AI locally without GitHub App credentials?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yes! ReviewFlow AI comes equipped with a built-in Mock Adapter and demo mode that runs full static and AI reviews on realistic sample diffs without requiring external GitHub App secrets.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
