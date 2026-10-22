'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Send,
  FolderGit2,
  FileCode2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  Copy,
  Check,
  ShieldCheck,
  Database,
  ArrowRight,
  Activity,
  Coins,
  Zap,
  Cpu,
  MessageSquare,
  Plus,
  Trash2,
  History,
  Menu,
  X,
  RotateCcw,
} from 'lucide-react';
import { Header } from '../../../components/dashboard/Header';
import { MarkdownMessage } from '../../../components/dashboard/MarkdownMessage';
import { api } from '../../../lib/api-client';

interface Citation {
  filePath: string;
  startLine: number;
  endLine: number;
  commitSha?: string;
  snippet?: string;
}

export interface MessageTelemetry {
  evaluation: {
    groundedScore: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    citationsCount: number;
    sourceFilesCount: number;
    antiHallucinationVerified: boolean;
    verdict: string;
  };
  source: {
    files: string[];
    totalChunksRetrieved: number;
    commitSha?: string;
    scopes: string[];
  };
  cost: {
    tokensUsed: number;
    estimatedCostUsd: number;
    ratePer1kTokens: number;
  };
  latency: {
    totalMs: number;
    retrievalMs: number;
    generationMs: number;
  };
  fallback: {
    provider: string;
    model: string;
    fallbackTriggered: boolean;
    status: 'DIRECT' | 'FALLBACK ACTIVE';
  };
}

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  citations?: Citation[];
  tokensUsed?: number;
  telemetry?: MessageTelemetry;
  createdAt: string;
}

function CodebaseQnAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [indexingStatus, setIndexingStatus] = useState<any>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [showIndexMenu, setShowIndexMenu] = useState(false);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [copiedCiteIdx, setCopiedCiteIdx] = useState<string | null>(null);
  const [collapsedCitations, setCollapsedCitations] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleCitations = (msgId: string) => {
    setCollapsedCitations((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeRepo = repositories.find((r) => r.id === selectedRepoId) || repositories[0];

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    const loadInitialData = async () => {
      try {
        const repoRes = await api.getRepositories();
        const repos = repoRes.data || [];
        setRepositories(repos);

        if (repos.length > 0) {
          const queryRepoId = searchParams.get('repoId');
          const targetId = (queryRepoId && repos.some((r: any) => r.id === queryRepoId))
            ? queryRepoId
            : repos[0].id;

          setSelectedRepoId(targetId);
          await loadRepoContext(targetId);
        }
      } catch (err) {
        console.error('Failed to load initial repos:', err);
      } finally {
        setIsPageLoading(false);
      }
    };

    loadInitialData();
  }, [router, searchParams]);

  const loadConversationMessages = async (repoId: string, convoId: string) => {
    if (!convoId) return;
    try {
      setIsLoading(true);
      const res = await api.getConversation(repoId, convoId);
      if (res?.data) {
        setActiveConversationId(res.data.id);
        const mapped: Message[] = (res.data.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role as 'USER' | 'ASSISTANT',
          content: m.content,
          citations: m.citations,
          tokensUsed: m.tokensUsed,
          telemetry: m.telemetry,
          createdAt: m.createdAt,
        }));
        setMessages(mapped);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRepoContext = async (repoId: string) => {
    try {
      const [statusRes, convosRes] = await Promise.all([
        api.getIndexingStatus(repoId).catch(() => null),
        api.getConversations(repoId).catch(() => null),
      ]);

      if (statusRes?.data) {
        setIndexingStatus(statusRes.data);
      }
      if (convosRes?.data) {
        setConversations(convosRes.data);
        // Auto-load most recent thread if one exists
        if (convosRes.data.length > 0) {
          await loadConversationMessages(repoId, convosRes.data[0].id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.warn('Failed to load repo context:', err);
    }
  };

  const handleSelectRepo = async (repoId: string) => {
    setSelectedRepoId(repoId);
    setMessages([]);
    setActiveConversationId(null);
    await loadRepoContext(repoId);
  };

  const handleTriggerIndexing = async (force: boolean = false) => {
    if (!selectedRepoId) return;
    setShowIndexMenu(false);
    setIsIndexing(true);
    try {
      await api.triggerIndexing(selectedRepoId, undefined, undefined, force);
      const pollInterval = setInterval(async () => {
        const statusRes = await api.getIndexingStatus(selectedRepoId);
        if (statusRes?.data) {
          setIndexingStatus(statusRes.data);
          if (
            statusRes.data.latestJob?.status === 'COMPLETED' ||
            statusRes.data.latestJob?.status === 'FAILED'
          ) {
            clearInterval(pollInterval);
            setIsIndexing(false);
          }
        }
      }, 2500);
    } catch (err: any) {
      alert(`Indexing failed to start: ${err?.message}`);
      setIsIndexing(false);
    }
  };

  const handleSendMessage = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || !selectedRepoId || isLoading) return;

    setInputQuestion('');
    const tempUserMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'USER',
      content: q,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await api.askCodebase(selectedRepoId, q, activeConversationId || undefined);
      if (res?.data) {
        if (!activeConversationId) {
          setActiveConversationId(res.data.conversationId);
        }
        const assistantMsg: Message = {
          id: res.data.messageId || `asst-${Date.now()}`,
          role: 'ASSISTANT',
          content: res.data.answer,
          citations: res.data.citations,
          tokensUsed: res.data.tokensUsed,
          telemetry: res.data.telemetry,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Refresh conversation list in background so new thread appears in sidebar
        api.getConversations(selectedRepoId).then((r) => {
          if (r?.data) setConversations(r.data);
        }).catch(() => {});
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'ASSISTANT',
        content: `⚠️ Failed to query repository: ${err?.message || 'Unknown error'}. Please verify the repository has been indexed with semantic embeddings.`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleSelectConversation = async (convoId: string) => {
    if (!convoId || convoId === activeConversationId) return;
    setIsSidebarOpen(false);
    await loadConversationMessages(selectedRepoId, convoId);
  };

  const handleStartNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convoId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation thread?')) return;
    try {
      await api.deleteConversation(selectedRepoId, convoId);
      setConversations((prev) => prev.filter((c) => c.id !== convoId));
      if (activeConversationId === convoId) {
        handleStartNewConversation();
      }
    } catch (err: any) {
      alert(`Failed to delete conversation: ${err?.message || 'Error'}`);
    }
  };

  const handleCopyCitation = (text: string, citeKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCiteIdx(citeKey);
    setTimeout(() => setCopiedCiteIdx(null), 2000);
  };

  const sampleQuestions = [
    'How does authentication and token rotation work in this repository?',
    'Where is authorization enforced for API endpoints and webhooks?',
    'Explain the background worker review execution pipeline.',
    'What tests cover the cryptographic signing and payment services?',
  ];

  return (
    <div className="flex-1 pb-12 bg-[#F7F9F8] min-h-screen flex flex-col">
      <Header
        title="Codebase Q&A Assistant"
        description="Ask deep architectural questions grounded in genuine source code evidence, symbols, and citations."
        action={
          <div className="flex items-center gap-2">
            {repositories.length > 0 && (
              <select
                value={selectedRepoId}
                onChange={(e) => handleSelectRepo(e.target.value)}
                className="bg-white border border-[#E4EAE6] text-[#14211D] text-xs rounded-xl px-3 py-2 font-mono focus:outline-none shadow-sleek-sm font-semibold cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
              >
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.fullName}
                  </option>
                ))}
              </select>
            )}

            {/* Thread Selector Dropdown in Navbar */}
            <select
              value={activeConversationId || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  handleStartNewConversation();
                } else {
                  handleSelectConversation(val);
                }
              }}
              className="bg-white border border-[#E4EAE6] text-[#14211D] text-xs rounded-xl px-3 py-2 font-mono focus:outline-none shadow-sleek-sm font-semibold cursor-pointer max-w-[180px] sm:max-w-[240px] truncate"
              title="Select or switch conversation thread"
            >
              <option value="">+ New Thread ({conversations.length} saved)</option>
              {conversations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title ? (c.title.length > 28 ? c.title.substring(0, 28) + '...' : c.title) : 'Thread'} ({c._count?.messages || 0} msgs)
                </option>
              ))}
            </select>

            {/* Quick New Thread Button */}
            <button
              type="button"
              onClick={handleStartNewConversation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E4EAE6] hover:bg-[#F8FCFA] text-[#14211D] text-xs font-mono font-semibold shadow-sleek-sm transition-all"
              title="Start a fresh conversation thread"
            >
              <Plus className="w-3.5 h-3.5 text-[#126B50]" />
              <span className="hidden sm:inline">New</span>
            </button>

            {/* Delete active thread button */}
            {activeConversationId && (
              <button
                type="button"
                onClick={(e) => handleDeleteConversation(e, activeConversationId)}
                className="p-2 rounded-xl bg-white border border-[#E4EAE6] text-[#94A3B8] hover:text-[#DC2626] hover:bg-red-50 shadow-sleek-sm transition-all"
                title="Delete current thread"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        }
      />

      <div className="px-4 sm:px-8 pt-4 max-w-5xl mx-auto w-full flex-1 flex flex-col space-y-4">
        {/* Indexing Status Card Banner */}
        {indexingStatus && (
            <div className="p-4 rounded-2xl bg-white border border-[#E4EAE6] flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-sleek-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6] font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16835B]" />
                  <span>Indexed</span>
                </span>
                <span className="text-[#14211D]">
                  <strong>{indexingStatus.indexedFilesCount}</strong> files (
                  <strong>{indexingStatus.totalChunksCount}</strong> code chunks)
                </span>
                {indexingStatus.lastIndexedCommitSha && (
                  <span className="text-[#66736D]">
                    SHA: <strong className="text-[#14211D]">@{indexingStatus.lastIndexedCommitSha.substring(0, 7)}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#66736D]">
                {indexingStatus.latestJob?.status === 'QUEUED' ||
                indexingStatus.latestJob?.status === 'CLONING' ||
                indexingStatus.latestJob?.status === 'CHUNKING' ||
                indexingStatus.latestJob?.status === 'EMBEDDING' ? (
                  <span className="text-[#B7791F] font-semibold flex items-center gap-1.5 bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
                    <RefreshCw className="w-3 h-3 animate-spin text-[#B7791F]" />
                    <span>Processing ({indexingStatus.latestJob.statusMessage || 'embedding'})</span>
                  </span>
                ) : (
                  <span>
                    Last synced: <strong className="text-[#14211D]">{indexingStatus.lastIndexedAt ? new Date(indexingStatus.lastIndexedAt).toLocaleTimeString() : 'never'}</strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Chat Stream View */}
          <div className="flex-1 overflow-y-auto space-y-5 py-2 min-h-[460px]">
            {messages.length === 0 ? (
              <div className="py-12 px-6 rounded-2xl bg-white border border-[#E4EAE6] text-center shadow-sleek-sm max-w-2xl mx-auto my-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#EAF5EF] border border-[#C7E4D6] flex items-center justify-center text-[#126B50] mx-auto shadow-sm">
                  <Sparkles className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#14211D] font-display">Understand your codebase instantly</h3>
                  <p className="text-xs sm:text-sm text-[#66736D] mt-1.5 max-w-md mx-auto font-mono leading-relaxed">
                    ReviewFlow AI indexes repository revisions, extracts semantic scopes, and answers developer questions with verified line citations.
                  </p>
                </div>

                {/* Sample Prompts */}
                <div className="space-y-2 pt-2 text-left">
                  <div className="text-[11px] uppercase tracking-wider text-[#66736D] font-mono font-bold px-1">
                    Recommended architectural queries:
                  </div>
                  {sampleQuestions.map((sq, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(sq)}
                      className="w-full text-left text-xs bg-[#F8FCFA] hover:bg-[#EAF5EF] border border-[#E2EDE6] hover:border-[#C7E4D6] text-[#14211D] rounded-xl p-3.5 transition-all shadow-sleek-sm flex items-center justify-between group font-mono font-medium"
                    >
                      <span>{sq}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#66736D] group-hover:text-[#126B50] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'USER' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'USER'
                        ? 'max-w-2xl rounded-2xl rounded-br-sm bg-[#126B50] text-white p-4 shadow-sm'
                        : 'max-w-4xl w-full rounded-2xl rounded-bl-sm bg-white border border-[#E4EAE6] text-[#14211D] p-5 sm:p-6 shadow-sleek-sm space-y-4'
                    }`}
                  >
                    {msg.role === 'USER' ? (
                      <div className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</div>
                    ) : (
                      <>
                        <MarkdownMessage content={msg.content} />

                        {/* Telemetry & Evaluation Inspector Strip */}
                        {msg.telemetry && (
                          <div className="pt-3 border-t border-[#E4EAE6] space-y-2.5">
                            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#52635B]">
                              <span className="flex items-center gap-1.5 text-[#126B50]">
                                <Activity className="w-3.5 h-3.5" />
                                <span>Evaluation & Operational Telemetry</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#EBF7F0] text-[#063B2C] border border-[#C3EBD7] text-[10px]">
                                Grounded: {msg.telemetry.evaluation.groundedScore}%
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                              <div className="p-2 rounded-xl bg-[#F8FCFA] border border-[#E2EDE6]">
                                <div className="text-[#7A8C84] text-[10px]">Confidence & Verdict</div>
                                <div className="font-bold text-[#111C18] mt-0.5 truncate">
                                  {msg.telemetry.evaluation.confidence} • {msg.telemetry.evaluation.verdict}
                                </div>
                              </div>
                              <div className="p-2 rounded-xl bg-[#F8FCFA] border border-[#E2EDE6]">
                                <div className="text-[#7A8C84] text-[10px]">Latency Breakdown</div>
                                <div className="font-bold text-[#111C18] mt-0.5">
                                  {msg.telemetry.latency.totalMs}ms ({msg.telemetry.latency.retrievalMs}ms ret / {msg.telemetry.latency.generationMs}ms gen)
                                </div>
                              </div>
                              <div className="p-2 rounded-xl bg-[#F8FCFA] border border-[#E2EDE6]">
                                <div className="text-[#7A8C84] text-[10px]">Cost & Tokens</div>
                                <div className="font-bold text-[#111C18] mt-0.5">
                                  {msg.telemetry.cost.tokensUsed} tokens (${msg.telemetry.cost.estimatedCostUsd.toFixed(5)})
                                </div>
                              </div>
                              <div className="p-2 rounded-xl bg-[#F8FCFA] border border-[#E2EDE6]">
                                <div className="text-[#7A8C84] text-[10px]">Provider / Model</div>
                                <div className="font-bold text-[#111C18] mt-0.5 truncate">
                                  {msg.telemetry.fallback.provider} ({msg.telemetry.fallback.model})
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Citations Expandable Section */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="pt-3 border-t border-[#E4EAE6]">
                            <button
                              type="button"
                              onClick={() => toggleCitations(msg.id)}
                              className="flex items-center justify-between w-full text-left text-xs font-mono font-bold text-[#14211D] hover:text-[#126B50] transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <FileCode2 className="w-3.5 h-3.5 text-[#126B50]" />
                                <span>Source Evidence Citations ({msg.citations.length})</span>
                              </span>
                              {collapsedCitations[msg.id] ? (
                                <ChevronRight className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {!collapsedCitations[msg.id] && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
                                {msg.citations.map((cite, cIdx) => {
                                  const citeKey = `${msg.id}-${cIdx}`;
                                  const isCopied = copiedCiteIdx === citeKey;

                                  return (
                                    <div
                                      key={cIdx}
                                      className="p-3 rounded-xl bg-[#F8FCFA] border border-[#E4EAE6] text-xs font-mono space-y-1.5 group hover:border-[#126B50]/30 transition-all"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-[#14211D] truncate max-w-[200px]" title={cite.filePath}>
                                          {cite.filePath}
                                        </span>
                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-white border border-[#E4EAE6] text-[#126B50] font-semibold shrink-0">
                                          L{cite.startLine}-L{cite.endLine}
                                        </span>
                                      </div>

                                      {cite.snippet && (
                                        <div className="p-2 rounded bg-white border border-[#E4EAE6] text-[11px] text-[#475467] overflow-x-auto font-mono whitespace-pre line-clamp-3">
                                          {cite.snippet}
                                        </div>
                                      )}

                                      <div className="flex items-center justify-between pt-1 text-[10px] text-[#7A8C84]">
                                        <span>Confidence Grounded</span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyCitation(`[${cite.filePath}#L${cite.startLine}-L${cite.endLine}]`, citeKey)}
                                          className="hover:text-[#126B50] flex items-center gap-1"
                                        >
                                          {isCopied ? <Check className="w-3 h-3 text-[#126B50]" /> : <Copy className="w-3 h-3" />}
                                          <span>{isCopied ? 'Copied' : 'Copy Citation'}</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="pt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-[#E4EAE6] focus-within:border-[#126B50] focus-within:ring-2 focus-within:ring-[#126B50]/10 shadow-sleek-sm transition-all"
            >
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ask anything about this repository (e.g., How does authorization work?)..."
                disabled={isLoading || !selectedRepoId}
                className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-[#14211D] placeholder-[#98A2B3] focus:outline-none font-sans"
              />
              <button
                type="submit"
                disabled={isLoading || !inputQuestion.trim() || !selectedRepoId}
                className="p-2.5 rounded-xl btn-primary text-white disabled:opacity-40 transition-all shadow-sm"
                title="Submit query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#66736D] px-2 mt-2">
              <span>All responses are grounded strictly in indexed repository files.</span>
              <span>Zero execution of untrusted repository code.</span>
            </div>
          </div>
        </div>
      </div>
    );
}

export default function CodebaseQnAPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F9F8] p-8 text-[#66736D] font-mono text-xs flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-[#126B50] mr-2" />
          <span>Loading codebase Q&A assistant...</span>
        </div>
      }
    >
      <CodebaseQnAContent />
    </Suspense>
  );
}
