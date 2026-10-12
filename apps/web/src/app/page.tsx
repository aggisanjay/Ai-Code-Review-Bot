'use client';

import React, { useState } from 'react';
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
  FileCheck,
  Check,
  GitPullRequest,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  Play,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import { Navbar } from '../components/marketing/Navbar';
import { Footer } from '../components/marketing/Footer';
import { PrShowcase } from '../components/marketing/PrShowcase';
import { ArchitectureExplorer } from '../components/marketing/ArchitectureExplorer';

const transition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] };

const FAQS = [
  {
    num: '01',
    category: 'GETTING STARTED & SETUP',
    question: 'How does ReviewFlow AI connect to our GitHub repositories?',
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
  const [openedFaqs, setOpenedFaqs] = useState<number[]>([0]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const toggleFaq = (idx: number) => {
    setOpenedFaqs((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="relative min-h-screen bg-white text-[#111C18] selection:bg-[#EBF7F0] selection:text-[#063B2C]">
      <Navbar />

      {/* ========================================================================= */}
      {/* HERO SECTION (Styled directly after Fintara Images 1 & 2)                  */}
      {/* ========================================================================= */}
      <section className="relative pt-32 sm:pt-36 pb-20 px-4 sm:px-6 overflow-hidden fintara-hero-glow">
        <div className="max-w-5xl mx-auto text-center space-y-7">
          {/* Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#C3EBD7] text-[#063B2C] text-xs font-medium shadow-sm backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Trusted by engineering teams worldwide</span>
          </motion.div>

          {/* Headline with Signature Newsreader Italic Serif accent */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#111C18] leading-[1.12]"
          >
            Build a Smarter{' '}
            <span className="font-serif italic font-normal text-[#063B2C]">Code Review</span>
            <br className="hidden sm:inline" />{' '}
            <span className="font-serif italic font-normal text-[#063B2C]">Future</span> With ReviewFlow
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.1 }}
            className="text-base sm:text-lg text-[#52635B] max-w-2xl mx-auto leading-relaxed"
          >
            Bring deterministic AST security scanning, evidence-grounded AI reviews, and 1-click suggested fixes together in one simple, intelligent platform.
          </motion.p>

          {/* Primary & Secondary Pill CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-3.5 pt-2"
          >
            <Link
              href="/connect-github"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#063B2C] hover:bg-[#0A4D3A] text-white text-sm font-semibold shadow-sm transition-all duration-fast hover:scale-[1.02]"
            >
              <span>Start for free</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <a
              href="#showcase"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white hover:bg-[#F8FCFA] text-[#111C18] border border-[#DDE7E1] text-sm font-medium shadow-sm transition-all duration-fast hover:scale-[1.02]"
            >
              <Play className="w-3.5 h-3.5 fill-[#111C18] text-[#111C18]" />
              <span>Explore ReviewFlow</span>
            </a>
          </motion.div>

          {/* ========================================================================= */}
          {/* PRODUCT WINDOW MOCKUP (Exact Browser Frame from Images 1 & 2)             */}
          {/* ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.22 }}
            className="pt-10 sm:pt-14 max-w-5xl mx-auto"
          >
            <div className="rounded-3xl border border-[#E2EDE6] bg-white shadow-fintara-float overflow-hidden text-left">
              {/* Browser Chrome Header */}
              <div className="bg-[#FAFDFB] border-b border-[#E2EDE6] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                  <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                </div>

                {/* Address Pill */}
                <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-white border border-[#E2EDE6] text-xs font-mono text-[#52635B] shadow-sm">
                  <span className="text-[#A3B8AD]">🔗</span>
                  <span>reviewflow.ai/dashboard</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-[#7A8C84]">
                  <span className="px-2 py-0.5 rounded-full bg-[#EBF7F0] text-[#063B2C] text-[10px] font-semibold">
                    Live Telemetry
                  </span>
                </div>
              </div>

              {/* Inner App Navbar */}
              <div className="px-6 py-3.5 border-b border-[#E2EDE6] bg-white flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#063B2C] flex items-center justify-center text-white text-xs">
                    <GitPullRequest className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-sm text-[#111C18] font-display">ReviewFlow</span>
                </div>

                {/* Mock Nav Pills */}
                <div className="hidden sm:flex items-center gap-2 text-xs font-medium">
                  <span className="px-3.5 py-1.5 rounded-full bg-[#063B2C] text-white font-semibold">
                    • Overview
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-[#52635B] hover:text-[#111C18]">
                    Pull Requests
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-[#52635B] hover:text-[#111C18]">
                    AST Security
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-[#52635B] hover:text-[#111C18]">
                    Analytics
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#EBF7F0] border border-[#C3EBD7] text-[#063B2C] flex items-center justify-center text-xs font-bold font-mono">
                    RF
                  </div>
                </div>
              </div>

              {/* Inner Mockup Dashboard Content */}
              <div className="p-6 sm:p-8 bg-[#F8FCFA] space-y-6">
                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm">
                    <div className="flex items-center justify-between text-xs text-[#52635B] mb-2 font-medium">
                      <span>Total PRs Reviewed</span>
                      <span className="text-[#063B2C] bg-[#EBF7F0] w-6 h-6 rounded-full flex items-center justify-center font-bold">
                        $
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#111C18] font-mono">1,482</div>
                    <div className="text-[11px] text-[#52635B] mt-2 flex items-center gap-1">
                      <span className="text-[#10B981] font-semibold bg-[#EBF7F0] px-1.5 py-0.5 rounded-full">
                        +12.4%
                      </span>
                      <span>this month</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm">
                    <div className="flex items-center justify-between text-xs text-[#52635B] mb-2 font-medium">
                      <span>Average Turnaround</span>
                      <Clock className="w-4 h-4 text-[#063B2C]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#111C18] font-mono">~8.4s</div>
                    <div className="text-[11px] text-[#52635B] mt-2 flex items-center gap-1">
                      <span className="text-[#063B2C] font-semibold bg-[#EBF7F0] px-1.5 py-0.5 rounded-full">
                        -42.0s
                      </span>
                      <span>vs benchmark</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm">
                    <div className="flex items-center justify-between text-xs text-[#52635B] mb-2 font-medium">
                      <span>Critical Issues Blocked</span>
                      <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#111C18] font-mono">18 CVEs</div>
                    <div className="text-[11px] text-[#52635B] mt-2 flex items-center gap-1">
                      <span className="text-[#DC2626] font-semibold bg-red-50 px-1.5 py-0.5 rounded-full">
                        0 Breaches
                      </span>
                      <span>pre-merge</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm">
                    <div className="flex items-center justify-between text-xs text-[#52635B] mb-2 font-medium">
                      <span>Engineer Hours Saved</span>
                      <Zap className="w-4 h-4 text-[#063B2C]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#111C18] font-mono">380 hrs</div>
                    <div className="text-[11px] text-[#52635B] mt-2 flex items-center gap-1">
                      <span className="text-[#10B981] font-semibold bg-[#EBF7F0] px-1.5 py-0.5 rounded-full">
                        +18.4%
                      </span>
                      <span>vs last sprint</span>
                    </div>
                  </div>
                </div>

                {/* Scheduled Review Queue + Weekly Review Bar Chart (Matching Image 2) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Scheduled / Active Reviews */}
                  <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-[#111C18]">Active Pull Request Queue</h4>
                        <p className="text-[11px] text-[#52635B]">Real-time AST parsing, token bounding & comments</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8FCFA] border border-[#E2EDE6] text-xs text-[#52635B]">
                        <SlidersHorizontal className="w-3 h-3 text-[#52635B]" />
                        <span>Filters</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="p-3.5 rounded-xl bg-[#063B2C] text-white flex items-center justify-between shadow-sm">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold block">PR #142: feat(auth): Session verification & MFA</span>
                          <span className="text-[10px] text-[#C3EBD7] font-mono">9 files changed • 12 AST rules verified</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-mono font-bold">
                          CLEAN & APPROVED
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#F8FCFA] border border-[#E2EDE6] flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-[#111C18] block">PR #141: fix(db): Dynamic SQL interpolation</span>
                          <span className="text-[10px] text-[#52635B] font-mono">2 files changed • SQL Injection flagged</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-red-50 text-[#DC2626] border border-red-200 text-[11px] font-mono font-bold">
                          BLOCKED
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Weekly Review Velocity Bars (Matching Emerald Bars in Image 2) */}
                  <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-[#111C18]">Weekly Review Velocity</h4>
                        <span className="text-xs text-[#52635B]">📅</span>
                      </div>
                      <p className="text-[11px] text-[#52635B]">PRs reviewed vs. commits committed</p>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-[#111C18]">284 PRs</span>
                        <span className="text-[11px] font-semibold text-[#10B981] bg-[#EBF7F0] px-2 py-0.5 rounded-full">
                          +18.4% vs last week
                        </span>
                      </div>
                    </div>

                    {/* Emerald Bar Chart */}
                    <div className="pt-6">
                      <div className="flex items-end justify-between gap-2 h-28 px-2">
                        {[
                          { day: 'Mon', h: '45%', active: false },
                          { day: 'Tue', h: '65%', active: false },
                          { day: 'Wed', h: '95%', active: true, value: '92 PRs' },
                          { day: 'Thu', h: '50%', active: false },
                          { day: 'Fri', h: '80%', active: false },
                          { day: 'Sat', h: '30%', active: false },
                          { day: 'Sun', h: '20%', active: false },
                        ].map((bar, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex justify-center items-end h-24">
                              <div
                                style={{ height: bar.h }}
                                className={`w-full max-w-[24px] rounded-md transition-all duration-300 ${
                                  bar.active
                                    ? 'bg-[#10B981] shadow-sm'
                                    : 'bg-[#D1FAE5] hover:bg-[#A7F3D0]'
                                }`}
                              />
                            </div>
                            <span className="text-[10px] text-[#7A8C84] font-mono">{bar.day}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* METRICS STRIP                                                             */}
      {/* ========================================================================= */}
      <section className="border-y border-[#E2EDE6] bg-[#F8FCFA] py-8 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div className="border-l-2 border-[#063B2C] pl-4 sm:pl-5">
            <div className="text-2xl sm:text-3xl font-bold text-[#111C18] font-mono">~8.4s</div>
            <div className="text-[11px] text-[#52635B] mt-1.5 uppercase tracking-wider font-mono font-medium">
              Review Turnaround
            </div>
          </div>
          <div className="border-l-2 border-[#063B2C] pl-4 sm:pl-5">
            <div className="text-2xl sm:text-3xl font-bold text-[#111C18] font-mono">45 mins</div>
            <div className="text-[11px] text-[#52635B] mt-1.5 uppercase tracking-wider font-mono font-medium">
              Engineer Time Saved / PR
            </div>
          </div>
          <div className="border-l-2 border-[#063B2C] pl-4 sm:pl-5">
            <div className="text-2xl sm:text-3xl font-bold text-[#111C18] font-mono">100%</div>
            <div className="text-[11px] text-[#52635B] mt-1.5 uppercase tracking-wider font-mono font-medium">
              Schema-Validated Output
            </div>
          </div>
          <div className="border-l-2 border-[#063B2C] pl-4 sm:pl-5">
            <div className="text-2xl sm:text-3xl font-bold text-[#111C18] font-mono">0 Code Exec</div>
            <div className="text-[11px] text-[#52635B] mt-1.5 uppercase tracking-wider font-mono font-medium">
              Sandboxed Static Isolation
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* INTERACTIVE PR SHOWCASE SECTION                                           */}
      {/* ========================================================================= */}
      <section id="showcase" className="scroll-mt-24 py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#EBF7F0] border border-[#C3EBD7] text-[#063B2C] text-[11px] font-mono font-bold tracking-wider uppercase">
            Interactive Product Inspection
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111C18] tracking-tight">
            Realistic GitHub Pull Request{' '}
            <span className="font-serif italic font-normal text-[#063B2C]">Review</span>
          </h2>
          <p className="text-sm text-[#52635B] leading-relaxed">
            See how ReviewFlow AI isolates security vulnerabilities, validates evidence against git diffs, and formats inline GitHub suggestions.
          </p>
        </div>

        <div className="rounded-3xl border border-[#E2EDE6] bg-white p-2 sm:p-4 shadow-sm">
          <PrShowcase />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ARCHITECTURE EXPLORER SECTION                                             */}
      {/* ========================================================================= */}
      <section id="architecture" className="scroll-mt-24 py-24 px-6 max-w-7xl mx-auto border-t border-[#E2EDE6]">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#EBF7F0] border border-[#C3EBD7] text-[#063B2C] text-[11px] font-mono font-bold tracking-wider uppercase">
            Engineering Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111C18] tracking-tight">
            Defense in Depth{' '}
            <span className="font-serif italic font-normal text-[#063B2C]">Review Pipeline</span>
          </h2>
          <p className="text-sm text-[#52635B] leading-relaxed">
            Every step in the lifecycle is bounded, isolated, and verified to ensure maximum reliability and speed.
          </p>
        </div>

        <div className="rounded-3xl border border-[#E2EDE6] bg-white p-2 sm:p-4 shadow-sm">
          <ArchitectureExplorer />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FEATURES SECTION (Exact Layout & Typography from Image 3)                 */}
      {/* ========================================================================= */}
      <section id="features" className="scroll-mt-24 py-24 px-6 max-w-7xl mx-auto border-t border-[#E2EDE6]">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#EBF7F0] border border-[#C3EBD7] text-[#063B2C] text-[11px] font-mono font-bold tracking-wider uppercase">
            Features
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-[#111C18] tracking-tight">
            Everything you need,{' '}
            <span className="font-serif italic font-normal text-[#063B2C]">all in one place.</span>
          </h2>
          <p className="text-sm text-[#52635B] leading-relaxed">
            ReviewFlow AI combines deterministic AST scanning with frontier LLMs to provide defensible, grounded code reviews.
          </p>
        </div>

        {/* 6-Card Feature Grid with Mint Icons and Thin Dividers (Image 3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-7 rounded-2xl bg-white border border-[#E2EDE6] hover:border-[#B2E0C7] hover:shadow-md transition-all duration-base group">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF7F0] text-[#063B2C] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Cpu className="w-6 h-6 text-[#063B2C]" />
            </div>
            <h3 className="text-lg font-bold text-[#111C18] mb-2 font-display">
              Deterministic AST Scanning
            </h3>
            <p className="text-xs sm:text-sm text-[#52635B] leading-relaxed">
              We never delegate regex or secret scanning to an LLM. High-entropy keys, SQL injections, and dangerous calls are flagged deterministically.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white border border-[#E2EDE6] hover:border-[#B2E0C7] hover:shadow-md transition-all duration-base group">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF7F0] text-[#063B2C] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Lock className="w-6 h-6 text-[#063B2C]" />
            </div>
            <h3 className="text-lg font-bold text-[#111C18] mb-2 font-display">
              Prompt-Injection Defense
            </h3>
            <p className="text-xs sm:text-sm text-[#52635B] leading-relaxed">
              Untrusted diff inputs are quarantined inside strict delimiters. Attempts to override instructions inside commit messages are intercepted immediately.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white border border-[#E2EDE6] hover:border-[#B2E0C7] hover:shadow-md transition-all duration-base group">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF7F0] text-[#063B2C] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6 text-[#063B2C]" />
            </div>
            <h3 className="text-lg font-bold text-[#111C18] mb-2 font-display">
              Evidence-Grounded Lines
            </h3>
            <p className="text-xs sm:text-sm text-[#52635B] leading-relaxed">
              Every finding must quote verifiable code evidence that actually exists in the git diff hunk. Hallucinations are automatically stripped before posting.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white border border-[#E2EDE6] hover:border-[#B2E0C7] hover:shadow-md transition-all duration-base group">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF7F0] text-[#063B2C] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6 text-[#063B2C]" />
            </div>
            <h3 className="text-lg font-bold text-[#111C18] mb-2 font-display">
              Durable Queueing & Retries
            </h3>
            <p className="text-xs sm:text-sm text-[#52635B] leading-relaxed">
              Powered by Redis and BullMQ. Handled with idempotency keys and commit SHA validation so stale commits never receive outdated review verdicts.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white border border-[#E2EDE6] hover:border-[#B2E0C7] hover:shadow-md transition-all duration-base group">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF7F0] text-[#063B2C] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 text-[#063B2C]" />
            </div>
            <h3 className="text-lg font-bold text-[#111C18] mb-2 font-display">
              Inline GitHub Comments
            </h3>
            <p className="text-xs sm:text-sm text-[#52635B] leading-relaxed">
              Suggestions appear directly inside the GitHub PR conversation with 1-click commit suggestion blocks, matching standard developer workflows without friction.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white border border-[#E2EDE6] hover:border-[#B2E0C7] hover:shadow-md transition-all duration-base group">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF7F0] text-[#063B2C] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <FileCheck className="w-6 h-6 text-[#063B2C]" />
            </div>
            <h3 className="text-lg font-bold text-[#111C18] mb-2 font-display">
              Configurable Team Policies
            </h3>
            <p className="text-xs sm:text-sm text-[#52635B] leading-relaxed">
              Fine-tune severity thresholds (e.g. block PR only on Critical/High), exclude generated files, configure mandatory test expectations, and set custom rules.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PRICING SECTION (Exact Layout & Structure from Image 4)                    */}
      {/* ========================================================================= */}
      <section id="pricing" className="scroll-mt-24 py-24 px-6 max-w-7xl mx-auto border-t border-[#E2EDE6]">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#EBF7F0] border border-[#C3EBD7] text-[#063B2C] text-[11px] font-mono font-bold tracking-wider uppercase">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-[#111C18] tracking-tight">
            Start free.{' '}
            <span className="font-serif italic font-normal text-[#063B2C]">Grow with confidence.</span>
          </h2>
          <p className="text-sm text-[#52635B] leading-relaxed">
            Start managing your pull requests today. Upgrade when you need more throughput and enterprise policies.
          </p>

          {/* Monthly / Yearly Pill Toggle (Image 4) */}
          <div className="pt-4 flex justify-center">
            <div className="bg-[#F0FAF4] p-1 rounded-full inline-flex border border-[#D6EFE1]">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-fast ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-[#111C18] shadow-sm'
                    : 'text-[#52635B] hover:text-[#111C18]'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-fast ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-[#111C18] shadow-sm'
                    : 'text-[#52635B] hover:text-[#111C18]'
                }`}
              >
                Yearly 15% off
              </button>
            </div>
          </div>
        </div>

        {/* 3 Pricing Cards with Pro Featured (Image 4) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
          {/* Card 1: FREE */}
          <div className="p-8 rounded-3xl bg-white border border-[#E2EDE6] shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono font-semibold text-[#52635B] uppercase block">Free</span>
              <div className="text-4xl font-bold text-[#111C18] mt-3 font-mono">
                $0<span className="text-sm font-normal text-[#52635B]"> / month</span>
              </div>

              <div className="my-6 border-t border-[#E2EDE6]" />

              <ul className="space-y-3.5 text-xs text-[#111C18]">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Up to 3 connected repositories</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>25 pull request reviews / month</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Inline review comments on GitHub</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Deterministic static security checks</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Community support</span>
                </li>
              </ul>
            </div>

            <Link
              href="/connect-github"
              className="mt-8 w-full py-3 rounded-full bg-[#063B2C] hover:bg-[#0A4D3A] text-white text-xs font-semibold text-center transition-all duration-fast shadow-sm"
            >
              Get started
            </Link>
          </div>

          {/* Card 2: PRO (Featured Card with Popular Banner - Image 4) */}
          <div className="rounded-3xl bg-white border-2 border-[#063B2C] shadow-md flex flex-col justify-between overflow-hidden relative">
            {/* Top Popular Banner */}
            <div className="bg-[#063B2C] py-2 text-center text-white text-xs font-semibold tracking-wide">
              Popular
            </div>

            <div className="p-8 flex flex-col justify-between flex-1">
              <div>
                <span className="text-xs font-mono font-bold text-[#063B2C] uppercase block">Pro</span>
                <div className="text-4xl font-bold text-[#111C18] mt-3 font-mono">
                  {billingCycle === 'monthly' ? '$29' : '$24'}
                  <span className="text-sm font-normal text-[#52635B]"> / month</span>
                </div>

                <div className="my-6 border-t border-[#E2EDE6]" />

                <ul className="space-y-3.5 text-xs text-[#111C18]">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Up to 15 connected repositories</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>500 pull request reviews / month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Advanced security & race condition checks</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Custom review guidelines & team rules</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Priority background worker queues</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/dashboard/settings"
                className="mt-8 w-full py-3 rounded-full bg-[#063B2C] hover:bg-[#0A4D3A] text-white text-xs font-semibold text-center transition-all duration-fast shadow-sm"
              >
                Get started
              </Link>
            </div>
          </div>

          {/* Card 3: PREMIUM / TEAM */}
          <div className="p-8 rounded-3xl bg-white border border-[#E2EDE6] shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono font-semibold text-[#52635B] uppercase block">Premium</span>
              <div className="text-4xl font-bold text-[#111C18] mt-3 font-mono">
                {billingCycle === 'monthly' ? '$99' : '$84'}
                <span className="text-sm font-normal text-[#52635B]"> / month</span>
              </div>

              <div className="my-6 border-t border-[#E2EDE6]" />

              <ul className="space-y-3.5 text-xs text-[#111C18]">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Unlimited connected repositories</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>2,500 reviews / month</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Advanced security and SOC2 compliance</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Dedicated Slack / webhook integrations</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Personalized 24/7 priority support</span>
                </li>
              </ul>
            </div>

            <Link
              href="/dashboard/settings"
              className="mt-8 w-full py-3 rounded-full bg-[#063B2C] hover:bg-[#0A4D3A] text-white text-xs font-semibold text-center transition-all duration-fast shadow-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FAQS SECTION (Exact Layout & Typography from Image 5)                      */}
      {/* ========================================================================= */}
      <section id="faq" className="scroll-mt-24 py-24 px-6 max-w-4xl mx-auto border-t border-[#E2EDE6]">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#EBF7F0] border border-[#C3EBD7] text-[#063B2C] text-[11px] font-mono font-bold tracking-wider uppercase">
            FAQs
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-[#111C18] tracking-tight">
            Frequently Asked{' '}
            <span className="font-serif italic font-normal text-[#063B2C]">Questions</span>
          </h2>
          <p className="text-sm text-[#52635B] leading-relaxed">
            Everything you need to know about ReviewFlow's security, GitHub App permissions, and automated intelligence.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openedFaqs.includes(idx);
            return (
              <div
                key={faq.num}
                className={`rounded-2xl border transition-all duration-fast overflow-hidden ${
                  isOpen
                    ? 'bg-white border-[#063B2C] shadow-sm'
                    : 'bg-white border-[#E2EDE6] hover:border-[#CADCD2]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-semibold text-sm sm:text-base text-[#111C18]">
                    {faq.question}
                  </span>

                  <ChevronDown
                    className={`w-4 h-4 text-[#52635B] shrink-0 transition-transform duration-fast ${
                      isOpen ? 'rotate-180 text-[#063B2C]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#52635B] leading-relaxed border-t border-[#E2EDE6]/60 bg-[#F8FCFA]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PRE-FOOTER CTA SECTION (Exact Layout & Typography from Image 6)           */}
      {/* ========================================================================= */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-[#E2EDE6]">
        <div className="rounded-3xl border border-dashed border-[#CBDCD2] bg-white p-8 sm:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-sm">
          <div className="max-w-xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF7F0] text-[#063B2C] text-xs font-medium border border-[#C3EBD7]">
              <span>⚡</span>
              <span>Smart Code Review Intelligence</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111C18]">
              Take complete control of your{' '}
              <span className="font-serif italic font-normal text-[#063B2C]">codebase quality</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#52635B] leading-relaxed">
              Join thousands of forward-thinking engineering teams tracking, predicting, and elevating their code quality with ReviewFlow AI.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <Link
              href="/connect-github"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#063B2C] hover:bg-[#0A4D3A] text-white text-sm font-semibold shadow-sm transition-all duration-fast hover:scale-[1.02]"
            >
              <span>Get started for free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="text-[11px] text-[#7A8C84]">Free forever plan • No credit card required</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
