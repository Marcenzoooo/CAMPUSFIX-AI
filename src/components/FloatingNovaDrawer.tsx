import React, { useState } from 'react';
import { ArrowRight, Bot, Send, Sparkles, X } from 'lucide-react';
import type { ModuleId } from '../types';
import { NovaAvatar, type NovaState } from './NovaAvatar';
import { Nova3DCanvas } from './Nova3DCanvas';

interface DrawerMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestedModule?: ModuleId;
  suggestedModuleLabel?: string;
}

interface FloatingNovaDrawerProps {
  open: boolean;
  onToggle: (next: boolean) => void;
  onNavigateModule: (id: ModuleId) => void;
  activeModuleLabel?: string;
}

const STARTER_PROMPTS = [
  'Where can I report a broken lab AC or projector?',
  'Help me find quiet smart study rooms open now',
  'How does Nova PDF Q&A work for exam prep?',
];

export function FloatingNovaDrawer({
  open,
  onToggle,
  onNavigateModule,
  activeModuleLabel = 'Campus Platform',
}: FloatingNovaDrawerProps) {
  const [novaState, setNovaState] = useState<NovaState>('idle');
  const [input, setInput] = useState('');
  const [quickPrompts, setQuickPrompts] = useState<string[]>(STARTER_PROMPTS);
  const [messages, setMessages] = useState<DrawerMessage[]>([
    {
      id: 'nova-welcome',
      role: 'assistant',
      text: 'Hi! I am Nova, your CAMPUSFIX AI companion. Ask me to route you to any campus service, explain features, or jump straight into AI Academic Mentor.',
      suggestedModule: 'mentor',
      suggestedModuleLabel: 'Open Full AI Mentor',
    },
  ]);

  const sendPrompt = async (promptOverride?: string) => {
    const text = (promptOverride ?? input).trim();
    if (!text || novaState === 'thinking') return;

    const userMsg: DrawerMessage = { id: `u-${Date.now()}`, role: 'user', text };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!promptOverride) setInput('');
    setNovaState('thinking');

    try {
      const res = await fetch('/api/campus/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          context: { currentView: activeModuleLabel },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Assistant unavailable');

      setNovaState('responding');
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: data.reply || 'I can help you navigate CAMPUSFIX AI modules.',
          suggestedModule: data.suggestedModule || undefined,
          suggestedModuleLabel: data.suggestedModuleLabel || undefined,
        },
      ]);
      if (Array.isArray(data.quickPrompts) && data.quickPrompts.length > 0) {
        setQuickPrompts(data.quickPrompts);
      }
      setTimeout(() => setNovaState('idle'), 1400);
    } catch (err) {
      setNovaState('idle');
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text:
            err instanceof Error
              ? `Could not connect to Nova service: ${err.message}`
              : 'Nova service is temporarily unavailable.',
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating Companion Launcher Button */}
      {!open && (
        <button
          type="button"
          onClick={() => onToggle(true)}
          className="fixed bottom-5 right-5 z-40 group flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-2xl bg-[#19171D] dark:bg-[#26222E] text-white border border-[#302B35] dark:border-[#E84D96]/40 shadow-xl hover:border-[#E84D96] transition-all cursor-pointer"
          aria-label="Open Nova AI Campus Companion"
        >
          <NovaAvatar state={novaState} size="sm" className="!w-9 !h-9" />
          <div className="text-left">
            <span className="block text-xs font-bold leading-tight">Ask Nova AI</span>
            <span className="block text-[10px] text-[#FFB0CC]">Campus Companion</span>
          </div>
        </button>
      )}

      {/* Slide-over Companion Drawer */}
      {open && (
        <aside
          className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-[400px] h-[540px] max-h-[82vh] bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          aria-label="Nova AI Campus Companion Drawer"
        >
          <div className="px-4 py-3 bg-[#19171D] text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#27222D] overflow-hidden flex items-center justify-center shrink-0">
                <Nova3DCanvas state={novaState} className="w-12 h-12" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold">Nova AI</span>
                  <span className="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-[#E84D96]/25 text-[#FF8EC4]">
                    {novaState}
                  </span>
                </div>
                <p className="text-[11px] text-white/70">Smart Campus Assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggle(false)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label="Close Nova drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F6F7]/60 dark:bg-[#141218]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#19171D] dark:bg-[#E84D96] text-white'
                      : 'bg-white dark:bg-[#26222E] border border-[#E8E4E9] dark:border-[#342E3D] text-[#19171D] dark:text-[#F5F3F6]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.suggestedModule && m.suggestedModuleLabel && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateModule(m.suggestedModule!);
                        onToggle(false);
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F8E7EF] dark:bg-[#E84D96]/20 text-[#AD1A68] dark:text-[#FF8EC4] text-[11px] font-semibold hover:opacity-90 cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      {m.suggestedModuleLabel}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {novaState === 'thinking' && (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#26222E] border border-[#E8E4E9] dark:border-[#342E3D] text-xs text-[#77727D]">
                <Sparkles className="w-3.5 h-3.5 text-[#E84D96]" />
                Nova is thinking...
              </div>
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 border-t border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#1E1B24] flex gap-1.5 overflow-x-auto">
            {quickPrompts.map((qp) => (
              <button
                key={qp}
                type="button"
                onClick={() => sendPrompt(qp)}
                className="px-2.5 py-1 rounded-lg bg-[#F8F6F7] dark:bg-[#2A2633] border border-[#E8E4E9] dark:border-[#342E3D] text-[11px] text-[#302B35] dark:text-[#E8E4E9] hover:border-[#E84D96] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendPrompt();
            }}
            className="p-3 border-t border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#1E1B24] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Nova anything about campus..."
              className="flex-1 h-9 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-xs text-[#19171D] dark:text-white focus:outline-none focus:border-[#E84D96]"
            />
            <button
              type="submit"
              disabled={!input.trim() || novaState === 'thinking'}
              className="h-9 px-3 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              aria-label="Send message to Nova"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
