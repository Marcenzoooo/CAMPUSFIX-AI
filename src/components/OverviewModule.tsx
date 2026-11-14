import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ShoppingBag,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useCampusData } from '../contexts/CampusDataContext';
import { useAuth } from '../contexts/AuthContext';
import { CAMPUS_BUILDINGS, CAMPUS_HERO_IMAGE } from '../data/seedData';
import type { ModuleId } from '../types';
import { CampusThreeCanvas } from './CampusThreeCanvas';
import { Nova3DCanvas } from './Nova3DCanvas';
import { SafeImage, StatusBadge } from './StatusChip';

export function OverviewModule({ onNavigate }: { onNavigate: (id: ModuleId) => void }) {
  const { user, isLiveSynced } = useAuth();
  const { complaints, listings, classrooms, notices, resources, lostItems, activityFeed } =
    useCampusData();
  const [selectedBuilding, setSelectedBuilding] = useState('innovation');

  const openComplaints = complaints.filter((c) => c.status !== 'resolved').length;
  const resolvedComplaints = complaints.filter((c) => c.status === 'resolved').length;
  const inProgressComplaints = complaints.filter((c) => c.status === 'in_progress').length;
  const activeRooms = classrooms.filter((r) => r.status === 'available').length;
  const activeBuildingMeta =
    CAMPUS_BUILDINGS.find((b) => b.id === selectedBuilding) || CAMPUS_BUILDINGS[1];

  const personalizedFocus = useMemo(() => {
    if (user.role === 'admin' || user.role === 'faculty') {
      return {
        label: 'Staff & Operations Priority',
        headline: `${openComplaints} open facility tickets awaiting review & SLA resolution.`,
        ctaLabel: 'Open Admin Console',
        target: 'admin' as ModuleId,
      };
    }
    if (user.department.toLowerCase().includes('robot') || user.department.toLowerCase().includes('mech')) {
      return {
        label: 'Department Spotlight · Robotics & Labs',
        headline: 'Innovation Center IC-204 thermal advisory active — inspect Smart Classroom telemetry.',
        ctaLabel: 'Inspect IC-204',
        target: 'classroom' as ModuleId,
      };
    }
    return {
      label: `Academic Track · ${user.department}`,
      headline: `${resources.length} verified study packets and Nova PDF Q&A ready for midterm prep.`,
      ctaLabel: 'Open Academic Vault',
      target: 'vault' as ModuleId,
    };
  }, [user.role, user.department, openComplaints, resources.length]);

  const totalTickets = Math.max(complaints.length, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Hero Asymmetric Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-[0_1px_3px_rgba(25,23,29,0.04)]">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#77727D] dark:text-[#A19BA8] mb-4">
              <span className="font-semibold text-[#19171D] dark:text-white">
                Smart Campus Command Center
              </span>
              <span aria-hidden="true">·</span>
              <span>{user.department}</span>
              <span aria-hidden="true">·</span>
              <span className={isLiveSynced ? 'text-[#27866D] font-semibold' : ''}>
                {isLiveSynced ? 'Cloud Firestore Synced' : 'Local Preview Mode'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.025em] text-[#19171D] dark:text-white max-w-2xl [text-wrap:balance]">
              Welcome back, {user.displayName.split(' ')[0]}. Campus systems are operating cleanly.
            </h1>

            <p className="mt-3 text-[15px] leading-relaxed text-[#574148] dark:text-[#C5BECF] max-w-xl">
              Triage infrastructure issues, reserve smart classrooms, collaborate with Nova your AI Academic Mentor, and access every campus service from one unified workspace.
            </p>

            {/* Personalized Role / Department Callout */}
            <div className="mt-5 p-3.5 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D] flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#E84D96] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {personalizedFocus.label}
                </span>
                <p className="text-xs font-medium text-[#19171D] dark:text-white mt-0.5">
                  {personalizedFocus.headline}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(personalizedFocus.target)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#E84D96] hover:underline shrink-0 cursor-pointer"
              >
                {personalizedFocus.ctaLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('mentor')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              Open AI Academic Mentor
            </button>
            <button
              type="button"
              onClick={() => onNavigate('campusfix')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#D5D0D7] hover:bg-[#F8F6F7] dark:hover:bg-[#2E2936] text-[#19171D] dark:text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              Report Campus Issue
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl overflow-hidden flex flex-col shadow-[0_1px_3px_rgba(25,23,29,0.04)]">
          <div className="relative h-56 lg:h-full min-h-[240px]">
            <SafeImage
              src={CAMPUS_HERO_IMAGE}
              alt="Modern smart university innovation center courtyard"
              className="w-full h-full object-cover"
              fallbackTitle="Innovation Center Courtyard"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#19171D]/85 via-[#19171D]/20 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4 text-white">
              <div>
                <p className="text-xs text-white/80 font-medium">Innovation District</p>
                <p className="text-base font-semibold tracking-tight">Central Quad & Smart Labs</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('mobility')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-[#19171D] text-xs font-semibold hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Campus Map
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('campusfix')}
          className="text-left bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96]/60 rounded-xl p-5 transition-all hover:shadow-[0_10px_24px_rgba(25,23,29,0.05)] cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[#77727D] dark:text-[#A19BA8]">
              Active Tickets
            </span>
            <StatusBadge label="Live Queue" tone="amber" />
          </div>
          <p className="text-3xl font-bold font-mono-num text-[#19171D] dark:text-white">
            {openComplaints}
          </p>
          <p className="mt-1 text-xs text-[#574148] dark:text-[#C5BECF]">
            CampusFix facility requests open
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('classroom')}
          className="text-left bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96]/60 rounded-xl p-5 transition-all hover:shadow-[0_10px_24px_rgba(25,23,29,0.05)] cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[#77727D] dark:text-[#A19BA8]">
              Smart Rooms Free
            </span>
            <StatusBadge label="Simulated" tone="green" />
          </div>
          <p className="text-3xl font-bold font-mono-num text-[#19171D] dark:text-white">
            {activeRooms} / {classrooms.length}
          </p>
          <p className="mt-1 text-xs text-[#574148] dark:text-[#C5BECF]">
            Ready for study or seminar booking
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('exchange')}
          className="text-left bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96]/60 rounded-xl p-5 transition-all hover:shadow-[0_10px_24px_rgba(25,23,29,0.05)] cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[#77727D] dark:text-[#A19BA8]">
              Campus Exchange
            </span>
            <StatusBadge label="Verified" tone="rose" />
          </div>
          <p className="text-3xl font-bold font-mono-num text-[#19171D] dark:text-white">
            {listings.filter((l) => l.status === 'available').length}
          </p>
          <p className="mt-1 text-xs text-[#574148] dark:text-[#C5BECF]">
            Student listings available today
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('connect')}
          className="text-left bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96]/60 rounded-xl p-5 transition-all hover:shadow-[0_10px_24px_rgba(25,23,29,0.05)] cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[#77727D] dark:text-[#A19BA8]">
              Campus Notices
            </span>
            <StatusBadge label="Updated" tone="charcoal" />
          </div>
          <p className="text-3xl font-bold font-mono-num text-[#19171D] dark:text-white">
            {notices.length}
          </p>
          <p className="mt-1 text-xs text-[#574148] dark:text-[#C5BECF]">
            Upcoming events & registrar alerts
          </p>
        </button>
      </section>

      {/* 3D Smart Campus Spatial Node + AI Mentor Spotlight */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#19171D] dark:text-white">
                3D Smart Campus Topology
              </h2>
              <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">
                Click a 3D block or code pill to inspect live environmental & facility telemetry
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CAMPUS_BUILDINGS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBuilding(b.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono-num font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedBuilding === b.id
                      ? 'bg-[#19171D] dark:bg-[#E84D96] text-white'
                      : 'bg-[#F8F6F7] dark:bg-[#292431] text-[#302B35] dark:text-[#D5CFDC] hover:bg-[#F8E7EF] hover:text-[#E84D96]'
                  }`}
                >
                  {b.code}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[260px] w-full rounded-xl overflow-hidden border border-[#E8E4E9] dark:border-[#342E3D]">
            <CampusThreeCanvas
              activeBuilding={selectedBuilding}
              onSelectBuilding={setSelectedBuilding}
              showHudOverlay
            />
          </div>

          <div className="mt-4 pt-4 border-t border-[#E8E4E9] dark:border-[#342E3D] flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#E84D96]" />
                <span className="text-sm font-semibold text-[#19171D] dark:text-white">
                  {activeBuildingMeta.name}
                </span>
                <StatusBadge
                  label={activeBuildingMeta.status === 'alert' ? 'HVAC Watch' : 'Normal'}
                  tone={activeBuildingMeta.status === 'alert' ? 'amber' : 'green'}
                />
              </div>
              <p className="mt-1 text-xs text-[#77727D] dark:text-[#A19BA8]">
                {activeBuildingMeta.services.join(' · ')}
              </p>
            </div>
            <div className="flex items-center gap-5 text-xs">
              <div>
                <span className="text-[#77727D] dark:text-[#A19BA8] block">Occupancy</span>
                <span className="font-mono-num font-semibold text-[#19171D] dark:text-white">
                  {activeBuildingMeta.occupancyPct}%
                </span>
              </div>
              <div>
                <span className="text-[#77727D] dark:text-[#A19BA8] block">Elevators</span>
                <span className="font-mono-num font-semibold text-[#19171D] dark:text-white">
                  {activeBuildingMeta.elevators} Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Academic Mentor Launchpad with Nova 3D */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[#E84D96]">
                  Featured Experience
                </span>
                <h2 className="mt-1 text-xl font-bold text-[#19171D] dark:text-white">
                  Meet Nova, AI Academic Mentor
                </h2>
                <p className="mt-1.5 text-sm text-[#574148] dark:text-[#C5BECF]">
                  Powered by Gemini for PDF document Q&A, tailored 5-day exam study plans, and adaptive practice quizzes.
                </p>
              </div>
              <div className="rounded-xl bg-[#19171D] p-1 border border-[#302B35] shrink-0">
                <Nova3DCanvas state="idle" className="w-20 h-20" />
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {[
                { label: 'Upload lecture PDF & ask targeted questions', module: 'mentor' as ModuleId },
                { label: 'Generate a personalized midterm study schedule', module: 'mentor' as ModuleId },
                { label: 'Review CS-304 notes in Academic Vault', module: 'vault' as ModuleId },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onNavigate(item.module)}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-[#F8F6F7] dark:bg-[#25212C] hover:bg-[#F8E7EF] dark:hover:bg-[#3A2233] text-left text-sm text-[#19171D] dark:text-white transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#E84D96] shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#77727D] group-hover:text-[#E84D96] shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E8E4E9] dark:border-[#342E3D] grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onNavigate('vault')}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96] text-xs font-medium text-[#302B35] dark:text-[#E2DCE7] cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#E84D96]" />
              Vault
            </button>
            <button
              type="button"
              onClick={() => onNavigate('exchange')}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96] text-xs font-medium text-[#302B35] dark:text-[#E2DCE7] cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#E84D96]" />
              Exchange
            </button>
            <button
              type="button"
              onClick={() => onNavigate('connect')}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96] text-xs font-medium text-[#302B35] dark:text-[#E2DCE7] cursor-pointer"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#E84D96]" />
              Events
            </button>
          </div>
        </div>
      </section>

      {/* Live Analytics Breakdown & Campus Activity Feed */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#19171D] dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#E84D96]" />
              Campus Operations Analytics
            </h2>
            <span className="text-xs text-[#77727D] dark:text-[#A19BA8] font-mono-num">
              {complaints.length} tickets
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                label: 'Open Dispatch',
                count: complaints.filter((c) => c.status === 'open').length,
                bar: 'bg-[#E84D96]',
              },
              {
                label: 'In Progress',
                count: inProgressComplaints,
                bar: 'bg-[#C58A32]',
              },
              {
                label: 'Resolved',
                count: resolvedComplaints,
                bar: 'bg-[#27866D]',
              },
            ].map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-[#302B35] dark:text-[#D5CFDC]">{row.label}</span>
                  <span className="font-mono-num font-semibold text-[#19171D] dark:text-white">
                    {row.count} ({Math.round((row.count / totalTickets) * 100)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#F8F6F7] dark:bg-[#292431] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.bar}`}
                    style={{ width: `${Math.max((row.count / totalTickets) * 100, 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E8E4E9] dark:border-[#342E3D] grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C]">
              <span className="text-[#77727D] dark:text-[#A19BA8] block">Lost & Found Matches</span>
              <span className="font-mono-num font-bold text-base text-[#19171D] dark:text-white">
                {lostItems.filter((l) => l.status === 'matched').length} active
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C]">
              <span className="text-[#77727D] dark:text-[#A19BA8] block">Eco Standby Rooms</span>
              <span className="font-mono-num font-bold text-base text-[#27866D]">
                {classrooms.filter((c) => c.ecoMode).length} / {classrooms.length}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#19171D] dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#E84D96]" />
              Live Campus Activity Feed
            </h2>
            <span className="text-xs text-[#77727D] dark:text-[#A19BA8]">Real-time session log</span>
          </div>

          <div className="space-y-2.5">
            {activityFeed.slice(0, 5).map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => onNavigate(ev.module)}
                className="w-full text-left p-3 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] hover:bg-[#F8E7EF]/70 dark:hover:bg-[#3A2233] border border-[#E8E4E9] dark:border-[#342E3D] flex items-start justify-between gap-3 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#19171D] dark:text-white truncate">
                    {ev.title}
                  </p>
                  <p className="text-xs text-[#574148] dark:text-[#B9B2C3] truncate mt-0.5">
                    {ev.detail}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge label={ev.timeLabel} tone={ev.tone} />
                  <ArrowRight className="w-3.5 h-3.5 text-[#77727D]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
