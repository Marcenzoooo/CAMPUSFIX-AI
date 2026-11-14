import React, { useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Calendar,
  CheckCircle2,
  FileText,
  HelpCircle,
  MessageSquarePlus,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCampusData } from '../contexts/CampusDataContext';
import { NovaAvatar, type NovaState } from './NovaAvatar';
import { Nova3DCanvas } from './Nova3DCanvas';
import { StatusBadge } from './StatusChip';

type MentorTab = 'chat' | 'study_plan' | 'quiz' | 'saved';
type MentorMode = 'doubt' | 'explain' | 'weak_topics' | 'pdf_qa';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  keyConcepts?: string[];
  followUps?: string[];
}

interface ChatThread {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

interface AttachedDocument {
  name: string;
  mimeType: string;
  sizeLabel: string;
  base64Data?: string;
  textContent?: string;
}

interface StudyPlanResult {
  title: string;
  strategySummary: string;
  schedule: {
    dayLabel: string;
    focusTopic: string;
    durationMinutes: number;
    tasks: string[];
  }[];
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subtopic: string;
}

interface QuizResult {
  title: string;
  topic: string;
  questions: QuizQuestion[];
}

const DEFAULT_THREADS: ChatThread[] = [
  {
    id: 'thread-1',
    title: 'CS-304 Raft Consensus & Quorums',
    updatedAt: 'Today',
    messages: [
      {
        id: 'm-1',
        role: 'assistant',
        text: 'Hello! I am Nova, your AI Academic Mentor. Upload a lecture PDF, ask a conceptual question, or switch tabs to generate a tailored 5-day study plan and diagnostic practice quiz.',
        keyConcepts: ['Distributed Consensus', 'Active Recall', 'PDF Grounding'],
        followUps: [
          'Explain why Raft requires majority quorums for leader election',
          'Contrast Two-Phase Commit with Paxos fault tolerance',
          'Quiz me on Eigenvalues and SVD proofs',
        ],
      },
    ],
  },
];

const QUICK_PROMPTS = [
  'Break down Fourier Transform intuition with an engineering example',
  'Help me diagnose common pitfalls in Dynamic Programming memoization',
  'Summarize key invariants of B+ Tree node splitting',
];

export function MentorModule() {
  const { savedMentor, saveMentorResponse, deleteMentorResponse, pushToast } = useCampusData();
  const [activeTab, setActiveTab] = useState<MentorTab>('chat');
  const [mode, setMode] = useState<MentorMode>('doubt');
  const [novaState, setNovaState] = useState<NovaState>('idle');

  const [threads, setThreads] = useState<ChatThread[]>(() => {
    try {
      const raw = localStorage.getItem('campusfix_mentor_threads');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_THREADS;
  });
  const [activeThreadId, setActiveThreadId] = useState<string>(threads[0].id);
  const [inputText, setInputText] = useState('');
  const [attachedDoc, setAttachedDoc] = useState<AttachedDocument | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [planSubject, setPlanSubject] = useState('CS-304 Distributed Systems');
  const [planExamDate, setPlanExamDate] = useState('Nov 28, 2026');
  const [planHours, setPlanHours] = useState('3');
  const [planWeakTopics, setPlanWeakTopics] = useState('Raft log recovery, Vector clocks, Linearizability');
  const [studyPlan, setStudyPlan] = useState<StudyPlanResult | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [planLoading, setPlanLoading] = useState(false);

  const [quizTopic, setQuizTopic] = useState('Distributed Consensus & Replication');
  const [quizDifficulty, setQuizDifficulty] = useState('intermediate');
  const [quizCount, setQuizCount] = useState('4');
  const [quizData, setQuizData] = useState<QuizResult | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('campusfix_mentor_threads', JSON.stringify(threads));
    } catch {
      // ignore
    }
  }, [threads]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      pushToast('File too large', 'Please select a PDF or text file under 6 MB.', 'error');
      return;
    }

    const sizeLabel = `${(file.size / 1024).toFixed(0)} KB`;
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        const base64Data = result.includes(',') ? result.split(',')[1] : result;
        setAttachedDoc({
          name: file.name,
          mimeType: 'application/pdf',
          sizeLabel,
          base64Data,
        });
        setMode('pdf_qa');
        pushToast('PDF attached to Nova', `${file.name} ready for question answering.`);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedDoc({
          name: file.name,
          mimeType: 'text/plain',
          sizeLabel,
          textContent: String(reader.result || ''),
        });
        setMode('pdf_qa');
        pushToast('Document attached to Nova', `${file.name} loaded.`);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const createNewThread = () => {
    const id = `thread-${Date.now()}`;
    const newThread: ChatThread = {
      id,
      title: 'New Study Session',
      updatedAt: 'Just now',
      messages: [
        {
          id: `m-${Date.now()}`,
          role: 'assistant',
          text: 'Ready for a fresh study session. Ask any coursework question or upload a PDF to begin.',
          followUps: QUICK_PROMPTS,
        },
      ],
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(id);
    setActiveTab('chat');
  };

  const deleteThread = (id: string) => {
    if (threads.length === 1) return;
    const remaining = threads.filter((t) => t.id !== id);
    setThreads(remaining);
    if (activeThreadId === id) {
      setActiveThreadId(remaining[0].id);
    }
  };

  const sendMessage = async (promptOverride?: string) => {
    const prompt = (promptOverride ?? inputText).trim();
    if (!prompt || novaState === 'thinking') return;

    setChatError(null);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: prompt,
    };

    const updatedMessages = [...activeThread.messages, userMsg];
    const nextTitle =
      activeThread.title === 'New Study Session'
        ? prompt.slice(0, 38) + (prompt.length > 38 ? '...' : '')
        : activeThread.title;

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, title: nextTitle, updatedAt: 'Just now', messages: updatedMessages }
          : t
      )
    );
    if (!promptOverride) setInputText('');
    setNovaState('thinking');

    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);

    try {
      const res = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: attachedDoc ? 'pdf_qa' : mode,
          messages: updatedMessages.map((m) => ({ role: m.role, text: m.text })),
          document: attachedDoc
            ? {
                name: attachedDoc.name,
                mimeType: attachedDoc.mimeType,
                base64Data: attachedDoc.base64Data,
                textContent: attachedDoc.textContent,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mentor request failed.');

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.reply || 'I could not formulate a response. Please try rephrasing.',
        keyConcepts: Array.isArray(data.keyConcepts) ? data.keyConcepts : [],
        followUps: Array.isArray(data.suggestedFollowUps) ? data.suggestedFollowUps : [],
      };

      setNovaState('responding');
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? { ...t, messages: [...updatedMessages, assistantMsg] }
            : t
        )
      );
      setTimeout(() => {
        setNovaState('idle');
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 1600);
    } catch (err) {
      setNovaState('idle');
      const msg = err instanceof Error ? err.message : 'Unable to reach Gemini Mentor service.';
      setChatError(msg);
      pushToast('Mentor Error', msg, 'error');
    }
  };

  const handleGenerateStudyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanLoading(true);
    setNovaState('thinking');
    try {
      const res = await fetch('/api/mentor/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: planSubject,
          examDate: planExamDate,
          hoursPerDay: Number(planHours) || 2,
          weakTopics: planWeakTopics,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate study plan.');
      setStudyPlan(data);
      setCompletedTasks({});
      setNovaState('responding');
      setTimeout(() => setNovaState('idle'), 1200);
      pushToast('Study plan generated', data.title);
    } catch (err) {
      setNovaState('idle');
      pushToast('Study Plan Error', err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setPlanLoading(false);
    }
  };

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuizLoading(true);
    setNovaState('thinking');
    try {
      const res = await fetch('/api/mentor/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: quizTopic,
          difficulty: quizDifficulty,
          count: Number(quizCount) || 4,
          document: attachedDoc
            ? {
                name: attachedDoc.name,
                mimeType: attachedDoc.mimeType,
                base64Data: attachedDoc.base64Data,
                textContent: attachedDoc.textContent,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Quiz generation failed.');
      setQuizData(data);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setNovaState('responding');
      setTimeout(() => setNovaState('idle'), 1200);
      pushToast('Practice quiz ready', `${data.questions?.length || 0} questions generated.`);
    } catch (err) {
      setNovaState('idle');
      pushToast('Quiz Error', err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setQuizLoading(false);
    }
  };

  const topicStats = React.useMemo(() => {
    if (!quizData || !quizSubmitted) return [];
    const map: Record<string, { total: number; correct: number }> = {};
    quizData.questions.forEach((q) => {
      const key = q.subtopic || 'Core Concept';
      if (!map[key]) map[key] = { total: 0, correct: 0 };
      map[key].total += 1;
      if (quizAnswers[q.id] === q.correctIndex) map[key].correct += 1;
    });
    return Object.entries(map).map(([subtopic, st]) => ({
      subtopic,
      pct: Math.round((st.correct / st.total) * 100),
      correct: st.correct,
      total: st.total,
    }));
  }, [quizData, quizSubmitted, quizAnswers]);

  const totalPlanTasks =
    studyPlan?.schedule.reduce((acc, day) => acc + day.tasks.length, 0) || 0;
  const donePlanTasks = Object.values(completedTasks).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header Banner with Interactive 3D Nova Companion */}
      <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-[#19171D] p-1 border border-[#302B35] shrink-0">
            <Nova3DCanvas state={novaState} className="w-20 h-20" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#19171D] dark:text-white">
                Nova · AI Academic Mentor
              </h1>
              <StatusBadge
                label={
                  novaState === 'thinking'
                    ? 'Processing'
                    : novaState === 'responding'
                      ? 'Responding'
                      : 'Ready'
                }
                tone={novaState === 'thinking' ? 'rose' : novaState === 'responding' ? 'green' : 'charcoal'}
              />
            </div>
            <p className="text-sm text-[#574148] dark:text-[#C5BECF] mt-0.5">
              Gemini-powered doubt resolution, PDF document Q&A, study schedules, and diagnostic quizzes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F8F6F7] dark:bg-[#25212C] rounded-xl overflow-x-auto">
          {[
            { id: 'chat' as const, label: 'Mentor Chat', icon: Sparkles },
            { id: 'study_plan' as const, label: 'Study Plan', icon: Calendar },
            { id: 'quiz' as const, label: 'Practice Quiz', icon: HelpCircle },
            { id: 'saved' as const, label: `Saved (${savedMentor.length})`, icon: Bookmark },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-[#19171D] text-[#19171D] dark:text-white shadow-sm'
                    : 'text-[#574148] dark:text-[#B9B2C3] hover:text-[#19171D] dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#E84D96]" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: MENTOR CHAT & PDF QA */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <aside className="lg:col-span-3 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <button
                type="button"
                onClick={createNewThread}
                className="w-full inline-flex items-center justify-center gap-2 h-10 px-3 rounded-lg bg-[#19171D] dark:bg-[#E84D96] hover:bg-[#302B35] dark:hover:bg-[#D23C83] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <MessageSquarePlus className="w-4 h-4" />
                New Conversation
              </button>

              <div className="space-y-1.5 max-h-[340px] overflow-y-auto pt-1">
                {threads.map((t) => (
                  <div
                    key={t.id}
                    className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-xs transition-colors ${
                      t.id === activeThread.id
                        ? 'bg-[#F8E7EF]/60 dark:bg-[#3A2233] border-[#E84D96]/40 text-[#19171D] dark:text-white font-semibold'
                        : 'bg-white dark:bg-transparent border-transparent hover:bg-[#F8F6F7] dark:hover:bg-[#25212C] text-[#302B35] dark:text-[#D5CFDC]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveThreadId(t.id)}
                      className="text-left flex-1 truncate cursor-pointer"
                    >
                      {t.title}
                    </button>
                    {threads.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteThread(t.id)}
                        aria-label="Delete thread"
                        className="opacity-0 group-hover:opacity-100 text-[#77727D] hover:text-[#C95765] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#E8E4E9] dark:border-[#342E3D] space-y-2.5">
              <p className="text-xs font-semibold text-[#19171D] dark:text-white">
                Document Context (PDF / TXT)
              </p>
              <label className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-dashed border-[#D5D0D7] dark:border-[#41394D] hover:border-[#E84D96] bg-[#F8F6F7]/70 dark:bg-[#25212C] cursor-pointer transition-colors text-center">
                <Upload className="w-4 h-4 text-[#E84D96] mb-1" />
                <span className="text-xs font-medium text-[#302B35] dark:text-[#E2DCE7]">
                  Upload Lecture PDF
                </span>
                <span className="text-[11px] text-[#77727D] dark:text-[#A19BA8]">Up to 6 MB</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {attachedDoc && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#F8E7EF] dark:bg-[#3A2233] text-xs text-[#3E0021] dark:text-[#FFD6E6]">
                  <span className="flex items-center gap-1.5 truncate font-medium">
                    <FileText className="w-3.5 h-3.5 text-[#E84D96] shrink-0" />
                    <span className="truncate">{attachedDoc.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedDoc(null)}
                    className="text-[#8D0052] dark:text-[#FFB0CC] hover:text-[#19171D] cursor-pointer"
                    aria-label="Remove attached PDF"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </aside>

          <div className="lg:col-span-9 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl flex flex-col min-h-[540px] max-h-[680px]">
            <div className="px-5 py-3 border-b border-[#E8E4E9] dark:border-[#342E3D] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  { id: 'doubt' as const, label: 'Doubt Solving' },
                  { id: 'explain' as const, label: 'First Principles' },
                  { id: 'weak_topics' as const, label: 'Weak-Topic Coach' },
                  { id: 'pdf_qa' as const, label: 'PDF Q&A' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      mode === m.id
                        ? 'bg-[#F8E7EF] dark:bg-[#3A2233] text-[#AD1A68] dark:text-[#FFB0CC] font-semibold'
                        : 'text-[#574148] dark:text-[#B9B2C3] hover:bg-[#F8F6F7] dark:hover:bg-[#25212C]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {attachedDoc && (
                <span className="text-xs font-mono-num text-[#27866D] dark:text-[#6EE7B7] font-medium">
                  Grounded: {attachedDoc.name}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {activeThread.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#19171D] dark:bg-[#E84D96] text-white'
                        : 'bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D] text-[#19171D] dark:text-[#F5F3F6]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {msg.keyConcepts && msg.keyConcepts.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-[#E8E4E9] dark:border-[#342E3D] flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-[#77727D] dark:text-[#A19BA8]">
                          Concepts: {msg.keyConcepts.join(' · ')}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            saveMentorResponse({
                              title: msg.keyConcepts?.[0] || 'Nova Academic Explanation',
                              summary: msg.text,
                              topic: msg.keyConcepts?.join(', ') || 'Coursework',
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#E84D96] hover:text-[#D23C83] cursor-pointer"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          Save
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.role === 'assistant' && msg.followUps && msg.followUps.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-2xl">
                      {msg.followUps.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => sendMessage(f)}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96] hover:text-[#E84D96] text-xs text-[#302B35] dark:text-[#E2DCE7] transition-colors text-left cursor-pointer"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {novaState === 'thinking' && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D] max-w-sm">
                  <NovaAvatar state="thinking" size="sm" />
                  <div>
                    <p className="text-xs font-semibold text-[#19171D] dark:text-white">
                      Nova is synthesizing...
                    </p>
                    <p className="text-[11px] text-[#77727D] dark:text-[#A19BA8]">
                      Checking formulas and document context
                    </p>
                  </div>
                </div>
              )}

              {chatError && (
                <div className="p-3 rounded-xl bg-[#FBEBED] dark:bg-[#3A1B22] text-[#C95765] dark:text-[#FF9AA6] text-xs font-medium">
                  {chatError}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="p-4 border-t border-[#E8E4E9] dark:border-[#342E3D] flex items-center gap-3"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  attachedDoc
                    ? `Ask Nova a question about ${attachedDoc.name}...`
                    : 'Ask a STEM, systems, or exam preparation question...'
                }
                className="flex-1 h-11 px-4 rounded-xl border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm text-[#19171D] dark:text-white focus:outline-none focus:border-[#E84D96]"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || novaState === 'thinking'}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-medium disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Ask Nova
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONALIZED STUDY PLAN GENERATOR */}
      {activeTab === 'study_plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleGenerateStudyPlan}
            className="lg:col-span-4 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 space-y-4 h-fit"
          >
            <h2 className="text-lg font-bold text-[#19171D] dark:text-white">
              Build 5-Day Study Plan
            </h2>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Course / Subject
              </label>
              <input
                type="text"
                required
                value={planSubject}
                onChange={(e) => setPlanSubject(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Exam Date
                </label>
                <input
                  type="text"
                  value={planExamDate}
                  onChange={(e) => setPlanExamDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Hours / Day
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={planHours}
                  onChange={(e) => setPlanHours(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm font-mono-num focus:outline-none focus:border-[#E84D96]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Weak Topics to Prioritize
              </label>
              <textarea
                rows={3}
                value={planWeakTopics}
                onChange={(e) => setPlanWeakTopics(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
              />
            </div>
            <button
              type="submit"
              disabled={planLoading}
              className="w-full h-10 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-medium disabled:opacity-60 cursor-pointer"
            >
              {planLoading ? 'Generating Schedule...' : 'Generate Study Plan'}
            </button>
          </form>

          <div className="lg:col-span-8 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6">
            {!studyPlan ? (
              <div className="py-16 text-center">
                <Calendar className="w-9 h-9 text-[#E84D96] mx-auto mb-3" />
                <h3 className="text-base font-semibold text-[#19171D] dark:text-white">
                  No active study plan yet
                </h3>
                <p className="text-sm text-[#77727D] dark:text-[#A19BA8] mt-1 max-w-md mx-auto">
                  Enter your course and weak topics on the left to generate a structured 5-day active-recall roadmap with Nova.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E8E4E9] dark:border-[#342E3D]">
                  <div>
                    <h3 className="text-xl font-bold text-[#19171D] dark:text-white">
                      {studyPlan.title}
                    </h3>
                    <p className="text-sm text-[#574148] dark:text-[#C5BECF] mt-1">
                      {studyPlan.strategySummary}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-[#77727D] dark:text-[#A19BA8] block">
                      Completion
                    </span>
                    <span className="text-lg font-bold font-mono-num text-[#27866D]">
                      {donePlanTasks} / {totalPlanTasks} tasks
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {studyPlan.schedule.map((day, idx) => (
                    <div
                      key={day.dayLabel + idx}
                      className="p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D] space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#19171D] dark:text-white">
                          {day.dayLabel} · {day.focusTopic}
                        </span>
                        <span className="text-xs font-mono-num text-[#77727D] dark:text-[#A19BA8]">
                          {day.durationMinutes} min
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {day.tasks.map((task, tIdx) => {
                          const key = `${idx}-${tIdx}`;
                          const checked = Boolean(completedTasks[key]);
                          return (
                            <label
                              key={key}
                              className="flex items-start gap-2.5 text-sm text-[#302B35] dark:text-[#E2DCE7] cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setCompletedTasks((prev) => ({ ...prev, [key]: !checked }))
                                }
                                className="mt-1 accent-[#E84D96] cursor-pointer"
                              />
                              <span className={checked ? 'line-through text-[#77727D]' : ''}>
                                {task}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PRACTICE QUIZ & WEAK-TOPIC ANALYSIS */}
      {activeTab === 'quiz' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleGenerateQuiz}
            className="lg:col-span-4 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 space-y-4 h-fit"
          >
            <h2 className="text-lg font-bold text-[#19171D] dark:text-white">
              Diagnostic Practice Quiz
            </h2>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Topic or Concept
              </label>
              <input
                type="text"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
                placeholder="e.g. Eigenvalues, Operating Systems"
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Difficulty
                </label>
                <select
                  value={quizDifficulty}
                  onChange={(e) => setQuizDifficulty(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm bg-white dark:bg-[#141218]"
                >
                  <option value="foundational">Foundational</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Exam Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Questions
                </label>
                <select
                  value={quizCount}
                  onChange={(e) => setQuizCount(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm bg-white dark:bg-[#141218] font-mono-num"
                >
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
            </div>
            {attachedDoc && (
              <p className="text-xs text-[#27866D] font-medium">
                Using attached document: {attachedDoc.name}
              </p>
            )}
            <button
              type="submit"
              disabled={quizLoading}
              className="w-full h-10 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-medium disabled:opacity-60 cursor-pointer"
            >
              {quizLoading ? 'Generating Quiz...' : 'Start Diagnostic Quiz'}
            </button>
          </form>

          <div className="lg:col-span-8 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 space-y-6">
            {!quizData ? (
              <div className="py-16 text-center">
                <BookOpen className="w-9 h-9 text-[#E84D96] mx-auto mb-3" />
                <h3 className="text-base font-semibold text-[#19171D] dark:text-white">
                  Ready to test your mastery
                </h3>
                <p className="text-sm text-[#77727D] dark:text-[#A19BA8] mt-1 max-w-md mx-auto">
                  Generate a multiple-choice quiz on any topic or attached PDF. Nova will grade your answers and highlight subtopics that need review.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E8E4E9] dark:border-[#342E3D]">
                  <div>
                    <h3 className="text-xl font-bold text-[#19171D] dark:text-white">
                      {quizData.title}
                    </h3>
                    <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">{quizData.topic}</p>
                  </div>
                  {quizSubmitted && (
                    <StatusBadge
                      label={`Score: ${
                        quizData.questions.filter((q) => quizAnswers[q.id] === q.correctIndex)
                          .length
                      } / ${quizData.questions.length}`}
                      tone="rose"
                    />
                  )}
                </div>

                {quizSubmitted && topicStats.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#19171D] dark:text-white">
                        Weak-Topic Diagnostic Breakdown
                      </h4>
                      <span className="text-xs text-[#77727D] dark:text-[#A19BA8]">
                        Accuracy by subtopic
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {topicStats.map((st) => (
                        <div key={st.subtopic} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-[#302B35] dark:text-[#E2DCE7]">
                              {st.subtopic}
                            </span>
                            <span className="font-mono-num font-semibold text-[#19171D] dark:text-white">
                              {st.pct}% ({st.correct}/{st.total})
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-[#E8E4E9] dark:bg-[#342E3D] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                st.pct >= 75
                                  ? 'bg-[#27866D]'
                                  : st.pct >= 50
                                    ? 'bg-[#C58A32]'
                                    : 'bg-[#E84D96]'
                              }`}
                              style={{ width: `${Math.max(st.pct, 6)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  {quizData.questions.map((q, qIdx) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl border border-[#E8E4E9] dark:border-[#342E3D] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-[#19171D] dark:text-white">
                          {qIdx + 1}. {q.question}
                        </p>
                        <span className="text-[11px] text-[#77727D] dark:text-[#A19BA8] shrink-0">
                          {q.subtopic}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => {
                          const selected = quizAnswers[q.id] === oIdx;
                          const isCorrect = q.correctIndex === oIdx;
                          let style =
                            'border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#25212C] hover:border-[#E84D96]';
                          if (quizSubmitted) {
                            if (isCorrect)
                              style =
                                'border-[#27866D] bg-[#EBF5F1] dark:bg-[#163128] text-[#00513F] dark:text-[#86E0C3]';
                            else if (selected)
                              style =
                                'border-[#C95765] bg-[#FBEBED] dark:bg-[#3A1B22] text-[#93000A] dark:text-[#FF9AA6]';
                          } else if (selected) {
                            style =
                              'border-[#E84D96] bg-[#F8E7EF] dark:bg-[#3A2233] text-[#19171D] dark:text-white font-medium';
                          }
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              disabled={quizSubmitted}
                              onClick={() =>
                                setQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                              }
                              className={`text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${style}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {quizSubmitted && (
                        <p className="text-xs text-[#574148] dark:text-[#C5BECF] bg-[#F8F6F7] dark:bg-[#25212C] p-2.5 rounded-lg">
                          <strong className="text-[#19171D] dark:text-white">Explanation:</strong>{' '}
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {!quizSubmitted && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setQuizSubmitted(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#19171D] dark:bg-[#E84D96] hover:bg-[#302B35] text-white text-sm font-medium cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Submit & Analyze Weak Topics
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SAVED MENTOR RESPONSES */}
      {activeTab === 'saved' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedMentor.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-10 text-center">
              <Bookmark className="w-8 h-8 text-[#77727D] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#19171D] dark:text-white">
                No saved mentor insights yet
              </p>
              <p className="text-xs text-[#77727D] dark:text-[#A19BA8] mt-1">
                Click Save on any Nova chat explanation to store it here for exam revision.
              </p>
            </div>
          ) : (
            savedMentor.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-5 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#77727D] dark:text-[#A19BA8] mb-1.5">
                    <span>{item.topic}</span>
                    <span>{item.createdAtLabel}</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#19171D] dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#574148] dark:text-[#C5BECF] whitespace-pre-wrap">
                    {item.summary}
                  </p>
                </div>
                <div className="pt-3 border-t border-[#E8E4E9] dark:border-[#342E3D] flex justify-end">
                  <button
                    type="button"
                    onClick={() => deleteMentorResponse(item.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#C95765] hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
