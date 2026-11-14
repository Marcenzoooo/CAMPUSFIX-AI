import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  Compass,
  FolderKanban,
  Github,
  Instagram,
  Layers,
  Mail,
  Megaphone,
  Menu,
  MonitorCheck,
  Moon,
  PackageSearch,
  Send,
  Shield,
  ShoppingBag,
  Sparkles,
  Sun,
  Thermometer,
  Trophy,
  Users,
  Wind,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCampusData } from '../contexts/CampusDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { CAMPUS_BUILDINGS, CAMPUS_HERO_IMAGE } from '../data/seedData';
import type { ModuleId } from '../types';
import { CampusThreeCanvas } from './CampusThreeCanvas';
import { Nova3DCanvas } from './Nova3DCanvas';
import type { NovaState } from './NovaAvatar';
import { SafeImage, StatusBadge } from './StatusChip';

interface LandingPageProps {
  onGetStarted: (targetModule?: ModuleId) => void;
}

/**
 * Configurable contact & social channels for CAMPUSFIX AI.
 * Replace these values with your institution or repository endpoints when deploying.
 */
const CONTACT_LINKS = {
  email: 'campusfix.platform@example.edu',
  instagramLabel: '@campusfix.ai',
  instagramHref: '#contact-instagram',
  githubLabel: 'campusfix-ai/smart-campus-os',
  githubHref: '#contact-github',
} as const;

interface ShowcaseModule {
  id: ModuleId;
  name: string;
  tagline: string;
  category: 'AI & Academics' | 'Campus Operations' | 'Community';
  icon: React.ComponentType<{ className?: string }>;
  highlights: string[];
  workflowNote: string;
}

const MODULE_SHOWCASE: ShowcaseModule[] = [
  {
    id: 'mentor',
    name: 'AI Academic Mentor — Nova',
    tagline:
      'Gemini-powered study partner with PDF grounding, 5-day exam roadmaps, and weak-topic quizzes.',
    category: 'AI & Academics',
    icon: Bot,
    highlights: ['3D Expressive Visor Avatar', 'Lecture PDF Q&A', 'Diagnostic Quizzes'],
    workflowNote: 'Upload course handouts and receive structured study sessions synced to your account.',
  },
  {
    id: 'campusfix',
    name: 'CampusFix — Issue Management',
    tagline:
      'Report electrical, HVAC, AV, and network faults with instant AI priority triage and routing.',
    category: 'Campus Operations',
    icon: Wrench,
    highlights: ['Automated AI Triage', 'SLA Queue & Upvotes', 'Resolution Audit Log'],
    workflowNote: 'Transforms natural-language issue reports into categorized facility dispatch tickets.',
  },
  {
    id: 'classroom',
    name: 'Smart Classroom',
    tagline:
      'Monitor room occupancy, CO2 air quality, thermal targets, and reserve open study pods.',
    category: 'Campus Operations',
    icon: MonitorCheck,
    highlights: ['Live Telemetry Simulators', 'Eco Standby Profiles', 'One-Click Booking'],
    workflowNote: 'Helps students locate available quiet rooms while reducing idle HVAC load.',
  },
  {
    id: 'exchange',
    name: 'Campus Exchange',
    tagline:
      'Peer-to-peer campus marketplace for verified students buying or selling books and lab gear.',
    category: 'Community',
    icon: ShoppingBag,
    highlights: ['Campus Hold Requests', 'Verified Student Profiles', 'Safety Flagging'],
    workflowNote: 'Keeps textbook and hardware exchanges accountable within the university community.',
  },
  {
    id: 'connect',
    name: 'Campus Connect',
    tagline:
      'Official academic circulars, department notices, club showcases, and persistent event RSVPs.',
    category: 'Community',
    icon: Megaphone,
    highlights: ['Verified Circulars', 'Event RSVP Sync', 'Department Filtering'],
    workflowNote: 'Replaces scattered email chains with one searchable campus announcement feed.',
  },
  {
    id: 'vault',
    name: 'Academic Vault',
    tagline:
      'Structured archive of lecture notes, past-year question papers, and lab manuals with reader view.',
    category: 'AI & Academics',
    icon: BookOpen,
    highlights: ['Course Code Indexing', 'In-App Document Reader', 'Cloud Bookmarks'],
    workflowNote: 'Organizes verified semester materials so students revise faster before assessments.',
  },
  {
    id: 'mobility',
    name: 'Campus Mobility',
    tagline:
      'Step-free accessible route planner, elevator readiness indicators, and campus shuttle loop ETAs.',
    category: 'Campus Operations',
    icon: Compass,
    highlights: ['Step-Free Pathfinding', 'Elevator Readiness', 'Shuttle Loop ETAs'],
    workflowNote: 'Provides barrier-free navigation across academic blocks, libraries, and quads.',
  },
  {
    id: 'lostfound',
    name: 'Lost & Found',
    tagline:
      'Automated keyword matching across campus desks with photo preview and ownership verification.',
    category: 'Community',
    icon: PackageSearch,
    highlights: ['Similarity Matching', 'Desk Pickup Tracking', 'Verified Claim Flow'],
    workflowNote: 'Accelerates returning misplaced IDs, laptops, and accessories to their owners.',
  },
  {
    id: 'opportunities',
    name: 'Opportunities',
    tagline:
      'Curated hackathons, undergraduate research fellowships, scholarships, and tracked applications.',
    category: 'Community',
    icon: Trophy,
    highlights: ['Deadline Tracking', 'Saved Applications', 'Faculty Endorsements'],
    workflowNote: 'Connects students directly to campus research labs and career milestones.',
  },
  {
    id: 'workspace',
    name: 'Student Workspace',
    tagline:
      'Personal study hub storing notes, saved Nova AI explanations, bookmarks, and Digital Campus ID.',
    category: 'AI & Academics',
    icon: FolderKanban,
    highlights: ['Cloud-Synced Notes', 'Saved Nova Insights', 'Campus ID Credentials'],
    workflowNote: 'Brings every personal task, note, and saved resource into one focused space.',
  },
  {
    id: 'admin',
    name: 'Admin Console',
    tagline:
      'Role-gated governance workspace for ticket dispatch, user directory audit, and official circulars.',
    category: 'Campus Operations',
    icon: Shield,
    highlights: ['RBAC Security Rules', 'Dispatch Queue Control', 'Marketplace Moderation'],
    workflowNote: 'Empowers faculty and campus operations teams with transparent real-time oversight.',
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Authenticate with Campus Identity',
    detail:
      'Visitors click Get Started to sign in through Google Campus SSO or university email on the dedicated authentication gateway.',
    icon: Shield,
  },
  {
    step: '02',
    title: 'Capture Signals & Course Context',
    detail:
      'Submit facility faults, upload lecture PDFs to Nova AI, browse open classrooms, or log lost items with structured campus metadata.',
    icon: Layers,
  },
  {
    step: '03',
    title: 'AI Triage & Nova Guidance',
    detail:
      'Server-side Gemini models classify maintenance priority, recommend step-free routes, and generate personalized 5-day study plans.',
    icon: Sparkles,
  },
  {
    step: '04',
    title: 'Real-Time Firestore Synchronization',
    detail:
      'Every ticket update, room reservation, bookmark, and circular persists in Cloud Firestore with role-based access enforcement.',
    icon: Building2,
  },
];

const FEATURE_SPOTLIGHTS = [
  {
    id: 'pdf-qa',
    title: 'PDF-Grounded Lecture Q&A',
    summary:
      'Attach syllabus documents or lecture slides and ask Nova targeted conceptual questions with saved study summaries.',
    novaState: 'responding' as NovaState,
    previewPrompt: 'Explain deadlock prevention strategies from Week 5 OS slides.',
    previewOutput:
      'Nova identifies mutual exclusion, hold-and-wait, and circular wait ordering from your uploaded handout and builds a 3-step revision drill.',
  },
  {
    id: 'triage',
    title: 'Intelligent Facility Auto-Triage',
    summary:
      'Plain-English student maintenance reports are analyzed server-side for severity, category, and nearest operations crew.',
    novaState: 'thinking' as NovaState,
    previewPrompt: 'Lab 204 projector flickers and AC vents rattle loudly.',
    previewOutput:
      'Classified as High Priority · AV & HVAC · Routed to Innovation Center Facilities Crew with suggested SLA window.',
  },
  {
    id: 'roadmap',
    title: 'Adaptive 5-Day Exam Planner',
    summary:
      'Turn weak topics and assessment dates into balanced daily active-recall blocks inside your Student Workspace.',
    novaState: 'idle' as NovaState,
    previewPrompt: 'Build a 5-day plan for Graph Algorithms & Dynamic Programming.',
    previewOutput:
      'Generates spaced practice sessions across Days 1–5 paired with Vault PYQ references and quick confidence checks.',
  },
];

const TEAM_PROFILES = [
  {
    name: 'Platform Architecture',
    role: 'React 19 · TypeScript · Tailwind CSS',
    bio: 'Modular 13-workspace campus operating shell designed with strict light/dark contrast and keyboard-first navigation.',
  },
  {
    name: 'AI & Spatial Systems',
    role: 'Gemini SDK · Three.js WebGL',
    bio: 'Server-side Gemini orchestration for Nova AI & CampusFix triage paired with interactive 3D campus topology.',
  },
  {
    name: 'Cloud & Security Engineering',
    role: 'Firebase Auth · Cloud Firestore RBAC',
    bio: 'Persistent user sessions, verified student registrations, and role-based security rules separating student and admin scopes.',
  },
];

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { user, isLiveSynced } = useAuth();
  const { classrooms, complaints, resources, listings, pushToast } = useCampusData();
  const { theme, toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroBuilding, setHeroBuilding] = useState('innovation');
  const [moduleCategory, setModuleCategory] = useState<
    'All' | 'AI & Academics' | 'Campus Operations' | 'Community'
  >('All');
  const [selectedShowcaseId, setSelectedShowcaseId] = useState<ModuleId>('mentor');
  const [activeFeatureId, setActiveFeatureId] = useState(FEATURE_SPOTLIGHTS[0].id);
  const [previewRoomId, setPreviewRoomId] = useState(classrooms[0]?.id || 'rm-lh3b');

  // Contact inquiry state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactRole, setContactRole] = useState('Student');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const activeHeroBuilding =
    CAMPUS_BUILDINGS.find((b) => b.id === heroBuilding) || CAMPUS_BUILDINGS[1];

  const previewRoom = classrooms.find((c) => c.id === previewRoomId) || classrooms[0];

  const filteredModules = useMemo(
    () =>
      moduleCategory === 'All'
        ? MODULE_SHOWCASE
        : MODULE_SHOWCASE.filter((m) => m.category === moduleCategory),
    [moduleCategory]
  );

  const selectedShowcase =
    MODULE_SHOWCASE.find((m) => m.id === selectedShowcaseId) || MODULE_SHOWCASE[0];

  const activeFeature =
    FEATURE_SPOTLIGHTS.find((f) => f.id === activeFeatureId) || FEATURE_SPOTLIGHTS[0];

  const openTickets = complaints.filter((c) => c.status !== 'resolved').length;
  const availableRooms = classrooms.filter((r) => r.status === 'available').length;

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
    setContactSent(true);
    pushToast(
      'Message received',
      `Thank you ${contactName.trim()}. Your campus inquiry has been recorded.`
    );
    setContactName('');
    setContactEmail('');
    setContactMessage('');
  };

  return (
    <div className="min-h-screen bg-[#F8F6F7] dark:bg-[#141218] text-[#19171D] dark:text-[#F5F3F6] transition-colors">
      {/* 1. CLEAN 3-ZONE NAVIGATION BAR */}
      <header className="sticky top-0 z-40 h-16 bg-white/95 dark:bg-[#19171D]/95 backdrop-blur-sm border-b border-[#E8E4E9] dark:border-[#302B35]">
        <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <a href="#top" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#E84D96] flex items-center justify-center font-display font-extrabold text-xs text-white shadow-xs">
              CF
            </div>
            <span className="font-display font-bold text-base tracking-tight text-[#19171D] dark:text-white whitespace-nowrap">
              CAMPUSFIX AI
            </span>
          </a>

          {/* Zone 2: Center Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#574148] dark:text-[#CFC9D4]"
            aria-label="Primary sections"
          >
            <a href="#features" className="hover:text-[#E84D96] transition-colors whitespace-nowrap">
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#E84D96] transition-colors whitespace-nowrap"
            >
              How It Works
            </a>
            <a href="#about" className="hover:text-[#E84D96] transition-colors whitespace-nowrap">
              About Us
            </a>
            <a href="#contact" className="hover:text-[#E84D96] transition-colors whitespace-nowrap">
              Contact
            </a>
          </nav>

          {/* Zone 3: Theme Toggle + Single Prominent Get Started Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#24202B] text-[#19171D] dark:text-white hover:border-[#E84D96] transition-colors cursor-pointer"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => onGetStarted('overview')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer shadow-xs"
            >
              {isLiveSynced ? `Open Dashboard` : 'Get Started'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#24202B] text-[#19171D] dark:text-white cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#19171D] border-b border-[#E8E4E9] dark:border-[#302B35] px-4 py-4 flex flex-col gap-2 text-sm font-semibold">
            {[
              { id: 'features', label: 'Features' },
              { id: 'how-it-works', label: 'How It Works' },
              { id: 'about', label: 'About Us' },
              { id: 'contact', label: 'Contact' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="text-left px-3 py-2 rounded-lg hover:bg-[#F8F6F7] dark:hover:bg-[#24202B] text-[#19171D] dark:text-white cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section id="top" className="relative overflow-hidden border-b border-[#E8E4E9] dark:border-[#2E2936]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-24 w-[480px] h-[480px] rounded-full bg-[#E84D96]/12 dark:bg-[#E84D96]/16 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 w-[400px] h-[400px] rounded-full bg-[#302B35]/10 dark:bg-[#E84D96]/8 blur-3xl"
        />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] text-xs font-semibold text-[#302B35] dark:text-[#E2DCE7]">
              <Sparkles className="w-3.5 h-3.5 text-[#E84D96]" />
              Smart Campus Operating Platform · 11 Integrated Modules
            </div>

            <h1 className="text-[clamp(2.25rem,4.2vw,3.65rem)] font-bold tracking-[-0.03em] leading-[1.06] text-[#19171D] dark:text-white [text-wrap:balance]">
              Your Entire Campus.{' '}
              <span className="text-campus-gradient block sm:inline">
                One Intelligent Ecosystem.
              </span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-[#574148] dark:text-[#C5BECF] max-w-xl">
              CAMPUSFIX AI connects Nova AI Academic Mentor, automated facility issue triage, smart classroom telemetry, peer exchange, accessible mobility, and administrative governance into one real-time university workspace.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-semibold shadow-sm transition-all cursor-pointer"
              >
                Explore the Ecosystem
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('nova-feature')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#19171D] dark:bg-[#2B2634] hover:bg-[#302B35] dark:hover:bg-[#383144] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <Bot className="w-4 h-4 text-[#E84D96]" />
                Meet Nova AI
              </button>
            </div>

            {/* Compact Campus Readiness Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-5 border-t border-[#E8E4E9] dark:border-[#2E2936] max-w-lg">
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono-num text-[#19171D] dark:text-white">
                  {CAMPUS_BUILDINGS.length}
                </p>
                <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">3D Campus Blocks</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono-num text-[#E84D96]">
                  {openTickets}
                </p>
                <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">Active Ops Queue</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono-num text-[#27866D]">
                  {availableRooms}/{classrooms.length}
                </p>
                <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">Open Smart Rooms</p>
              </div>
            </div>
          </motion.div>

          {/* Interactive 3D Campus Topology Stage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="lg:col-span-6 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-4 sm:p-5 shadow-[0_14px_40px_rgba(25,23,29,0.08)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.45)] space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#E84D96]" />
                <span className="text-xs font-bold text-[#19171D] dark:text-white">
                  Interactive 3D Smart Campus Map
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {CAMPUS_BUILDINGS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setHeroBuilding(b.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono-num font-semibold transition-colors cursor-pointer ${
                      heroBuilding === b.id
                        ? 'bg-[#E84D96] text-white'
                        : 'bg-[#F8F6F7] dark:bg-[#292431] text-[#302B35] dark:text-[#D5CFDC] hover:text-[#E84D96]'
                    }`}
                  >
                    {b.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[320px] sm:h-[360px] w-full rounded-xl overflow-hidden border border-[#E8E4E9] dark:border-[#342E3D]">
              <CampusThreeCanvas
                activeBuilding={heroBuilding}
                onSelectBuilding={setHeroBuilding}
                showHudOverlay
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#19171D] dark:text-white">
                    {activeHeroBuilding.name}
                  </span>
                  <StatusBadge
                    label={activeHeroBuilding.status === 'alert' ? 'HVAC Watch' : 'Nominal'}
                    tone={activeHeroBuilding.status === 'alert' ? 'amber' : 'green'}
                  />
                </div>
                <p className="text-xs text-[#77727D] dark:text-[#A19BA8] mt-0.5">
                  {activeHeroBuilding.services.join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onGetStarted('mobility')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F6F7] dark:bg-[#292431] hover:bg-[#F8E7EF] dark:hover:bg-[#3A2233] text-xs font-semibold text-[#19171D] dark:text-white transition-colors cursor-pointer"
              >
                {isLiveSynced ? 'Inspect Route' : 'Sign In to Inspect'}
                <ArrowRight className="w-3.5 h-3.5 text-[#E84D96]" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. INTERACTIVE ECOSYSTEM SHOWCASE (ALL 11 MODULES) */}
      <section
        id="features"
        className="border-b border-[#E8E4E9] dark:border-[#2E2936] bg-white dark:bg-[#18151E]"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#E84D96]">
                01 · Interactive Ecosystem Showcase
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#19171D] dark:text-white [text-wrap:balance]">
                Every campus workflow connected in one platform
              </h2>
              <p className="text-sm text-[#574148] dark:text-[#C5BECF]">
                Select any module below to inspect its capabilities, or authenticate to launch the live workspace.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F8F6F7] dark:bg-[#24202B] border border-[#E8E4E9] dark:border-[#342E3D] overflow-x-auto">
              {(['All', 'AI & Academics', 'Campus Operations', 'Community'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setModuleCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    moduleCategory === cat
                      ? 'bg-[#19171D] dark:bg-[#E84D96] text-white'
                      : 'text-[#574148] dark:text-[#C5BECF] hover:text-[#19171D] dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredModules.map((mod) => {
                const Icon = mod.icon;
                const active = selectedShowcaseId === mod.id;
                return (
                  <motion.button
                    key={mod.id}
                    type="button"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.16 }}
                    onClick={() => setSelectedShowcaseId(mod.id)}
                    className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      active
                        ? 'bg-[#F8E7EF]/60 dark:bg-[#2D1A28] border-[#E84D96] shadow-xs'
                        : 'bg-[#F8F6F7]/75 dark:bg-[#1E1B24] border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96]/60'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#292431] border border-[#E8E4E9] dark:border-[#3A3444] flex items-center justify-center">
                          <Icon className="w-4 h-4 text-[#E84D96]" />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#77727D] dark:text-[#A19BA8]">
                          {mod.category.split(' ')[0]}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#19171D] dark:text-white">
                        {mod.name}
                      </h3>
                      <p className="text-xs text-[#574148] dark:text-[#B9B2C3] line-clamp-2 leading-relaxed">
                        {mod.tagline}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#E84D96] inline-flex items-center gap-1">
                      Inspect module <ArrowRight className="w-3 h-3" />
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Selected Module Detail Inspector */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 bg-[#19171D] text-white rounded-2xl p-6 space-y-5 border border-[#302B35] shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#FFB0CC]">
                  {selectedShowcase.category}
                </span>
                <selectedShowcase.icon className="w-5 h-5 text-[#E84D96]" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedShowcase.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-xl font-bold">{selectedShowcase.name}</h3>
                    <p className="mt-2 text-sm text-white/75 leading-relaxed">
                      {selectedShowcase.tagline}
                    </p>
                  </div>

                  <p className="text-xs text-white/65 leading-relaxed bg-[#24202B] border border-white/10 rounded-xl p-3.5">
                    {selectedShowcase.workflowNote}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    {selectedShowcase.highlights.map((h) => (
                      <div key={h} className="flex items-center gap-2 text-xs text-white/90">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#27866D] shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <button
                type="button"
                onClick={() => onGetStarted(selectedShowcase.id)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E84D96] hover:bg-[#D23C83] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {isLiveSynced ? `Open ${selectedShowcase.name}` : 'Get Started to Access'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16 space-y-10">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#E84D96]">
            02 · How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#19171D] dark:text-white [text-wrap:balance]">
            A clear four-stage journey from login to campus resolution
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {HOW_IT_WORKS_STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-num text-xs font-bold text-[#E84D96]">
                      STEP {item.step}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#F8E7EF] dark:bg-[#311E2C] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#E84D96]" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-[#19171D] dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#574148] dark:text-[#C5BECF] leading-relaxed">
                    {item.detail}
                  </p>
                </div>
                <div className="h-1 w-full rounded-full bg-[#F8F6F7] dark:bg-[#292431] overflow-hidden">
                  <div
                    className="h-full bg-[#E84D96] rounded-full"
                    style={{ width: `${(idx + 1) * 25}%` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 5. UNIQUE FEATURE SHOWCASE: INTERACTIVE NOVA 3D + SMART CLASSROOM TELEMETRY */}
      <section
        id="nova-feature"
        className="border-y border-[#E8E4E9] dark:border-[#2E2936] bg-white dark:bg-[#18151E]"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Interactive Nova 3D Card */}
            <div className="lg:col-span-5 bg-[#19171D] rounded-2xl p-6 sm:p-7 border border-[#302B35] flex flex-col items-center text-center space-y-5">
              <div className="w-full flex items-center justify-between text-xs text-white/70">
                <span className="font-semibold uppercase tracking-wider text-[#FFB0CC]">
                  Nova 3D Companion
                </span>
                <span className="font-mono-num capitalize text-white/60">
                  Mode: {activeFeature.novaState}
                </span>
              </div>

              <Nova3DCanvas state={activeFeature.novaState} className="w-44 h-44" />

              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-white">Interactive Optical AI Mentor</h3>
                <p className="text-xs text-white/75 max-w-sm leading-relaxed">
                  Move your pointer to track Nova&apos;s visor, and switch workflows on the right to preview how Nova powers study sessions and campus dispatch.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onGetStarted('mentor')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E84D96] hover:bg-[#D23C83] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {isLiveSynced ? 'Open Nova Mentor' : 'Sign In to Chat with Nova'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right Interactive Capability Switcher */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#E84D96]">
                  03 · Signature AI Experience
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-[#19171D] dark:text-white">
                  Grounded academic coaching meets automated operations
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {FEATURE_SPOTLIGHTS.map((item) => {
                  const selected = item.id === activeFeature.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveFeatureId(item.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-[#19171D] dark:bg-[#E84D96] text-white border-transparent'
                          : 'bg-[#F8F6F7] dark:bg-[#1E1B24] border-[#E8E4E9] dark:border-[#342E3D] text-[#19171D] dark:text-white hover:border-[#E84D96]'
                      }`}
                    >
                      <p className="text-xs font-bold leading-snug">{item.title}</p>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-2xl bg-[#F8F6F7] dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] space-y-4"
                >
                  <p className="text-sm text-[#302B35] dark:text-[#D5CFDC] leading-relaxed">
                    {activeFeature.summary}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#141218] border border-[#E8E4E9] dark:border-[#342E3D]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#77727D]">
                        Student Prompt
                      </span>
                      <p className="mt-1.5 text-xs font-medium text-[#19171D] dark:text-white">
                        &ldquo;{activeFeature.previewPrompt}&rdquo;
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#141218] border border-[#E84D96]/35">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#E84D96]">
                        Platform Output
                      </span>
                      <p className="mt-1.5 text-xs text-[#302B35] dark:text-[#CFC9D4]">
                        {activeFeature.previewOutput}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Interactive Smart Room Telemetry Preview */}
          <div className="bg-[#F8F6F7] dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#19171D] dark:text-white">
                  Live Smart Room Telemetry Preview
                </h3>
                <p className="text-xs text-[#574148] dark:text-[#B9B2C3]">
                  Inspect room occupancy, temperature setpoints, and CO2 levels across campus zones.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {classrooms.map((rm) => (
                  <button
                    key={rm.id}
                    type="button"
                    onClick={() => setPreviewRoomId(rm.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono-num font-semibold border transition-colors cursor-pointer ${
                      previewRoom?.id === rm.id
                        ? 'bg-[#19171D] dark:bg-[#E84D96] text-white border-transparent'
                        : 'bg-white dark:bg-[#292431] text-[#302B35] dark:text-[#D5CFDC] border-[#E8E4E9] dark:border-[#3A3444]'
                    }`}
                  >
                    {rm.code}
                  </button>
                ))}
              </div>
            </div>

            {previewRoom && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-[#141218] border border-[#E8E4E9] dark:border-[#342E3D]">
                  <p className="text-xs text-[#77727D] dark:text-[#A19BA8] flex items-center gap-1.5">
                    <MonitorCheck className="w-3.5 h-3.5 text-[#E84D96]" /> Active Schedule
                  </p>
                  <p className="mt-2 text-sm font-bold text-[#19171D] dark:text-white">
                    {previewRoom.currentClass}
                  </p>
                  <p className="text-xs text-[#574148] dark:text-[#C5BECF] mt-0.5">
                    {previewRoom.nextSlot}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#141218] border border-[#E8E4E9] dark:border-[#342E3D]">
                  <p className="text-xs text-[#77727D] dark:text-[#A19BA8] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#E84D96]" /> Occupancy
                  </p>
                  <p className="mt-2 text-2xl font-bold font-mono-num text-[#19171D] dark:text-white">
                    {previewRoom.occupancy} / {previewRoom.capacity}
                  </p>
                  <p className="text-xs text-[#574148] dark:text-[#C5BECF]">
                    {Math.round((previewRoom.occupancy / previewRoom.capacity) * 100)}% seated
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#141218] border border-[#E8E4E9] dark:border-[#342E3D]">
                  <p className="text-xs text-[#77727D] dark:text-[#A19BA8] flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-[#E84D96]" /> Thermal Setpoint
                  </p>
                  <p className="mt-2 text-2xl font-bold font-mono-num text-[#19171D] dark:text-white">
                    {previewRoom.temperatureC.toFixed(1)}°C
                  </p>
                  <p className="text-xs text-[#574148] dark:text-[#C5BECF]">
                    Target {previewRoom.targetTempC.toFixed(1)}°C · LED {previewRoom.lightingPct}%
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#141218] border border-[#E8E4E9] dark:border-[#342E3D]">
                  <p className="text-xs text-[#77727D] dark:text-[#A19BA8] flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-[#27866D]" /> Indoor Air Quality
                  </p>
                  <p className="mt-2 text-2xl font-bold font-mono-num text-[#19171D] dark:text-white">
                    {previewRoom.co2Ppm} ppm
                  </p>
                  <p className="text-xs text-[#27866D]">
                    {previewRoom.ecoMode ? 'Eco Standby Active' : 'Active Ventilation'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. ABOUT THE PLATFORM & TEAM SECTION */}
      <section id="about" className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#E84D96]">
              04 · About CAMPUSFIX AI
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#19171D] dark:text-white [text-wrap:balance]">
              Built to replace fragmented campus portals with one unified operating layer
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-[#574148] dark:text-[#C5BECF]">
              Universities typically scatter maintenance ticketing, course materials, room reservations, student exchanges, and career fellowships across disconnected websites. CAMPUSFIX AI consolidates those workflows behind shared Firebase authentication, Cloud Firestore persistence, and server-side Gemini AI assistance.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D]">
                <p className="text-xl font-bold font-mono-num text-[#19171D] dark:text-white">
                  {resources.length}
                </p>
                <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">Vault Study Assets</p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D]">
                <p className="text-xl font-bold font-mono-num text-[#19171D] dark:text-white">
                  {listings.length}
                </p>
                <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">Exchange Listings</p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] col-span-2 sm:col-span-1">
                <p className="text-xl font-bold font-mono-num text-[#E84D96]">100%</p>
                <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">Role-Scoped Access</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl overflow-hidden shadow-xs">
            <div className="relative h-64 sm:h-80">
              <SafeImage
                src={CAMPUS_HERO_IMAGE}
                alt="CAMPUSFIX AI Innovation Center architectural campus quad"
                className="w-full h-full object-cover"
                fallbackTitle="CAMPUSFIX AI Smart Quad"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#19171D]/85 via-[#19171D]/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] text-[#FFB0CC] uppercase tracking-wider font-semibold">
                    Unified Campus Graph
                  </p>
                  <p className="text-lg font-bold">
                    Connected Labs, Libraries & Operations Dispatch
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onGetStarted('overview')}
                  className="px-4 py-2 rounded-lg bg-white text-[#19171D] text-xs font-semibold hover:bg-[#F8E7EF] cursor-pointer"
                >
                  {isLiveSynced ? 'Open Workspace' : 'Get Started'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Engineering Team & Disciplines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TEAM_PROFILES.map((member) => (
            <div
              key={member.name}
              className="p-6 rounded-2xl bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] space-y-2.5"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E84D96]">
                {member.role}
              </span>
              <h3 className="text-lg font-bold text-[#19171D] dark:text-white">{member.name}</h3>
              <p className="text-xs sm:text-sm text-[#574148] dark:text-[#C5BECF] leading-relaxed">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. PREMIUM CONTACT SECTION */}
      <section
        id="contact"
        className="border-t border-[#E8E4E9] dark:border-[#2E2936] bg-white dark:bg-[#18151E]"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#E84D96]">
                05 · Contact & Channels
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[#19171D] dark:text-white">
                Reach the CAMPUSFIX AI team
              </h2>
              <p className="text-sm text-[#574148] dark:text-[#C5BECF] leading-relaxed">
                Connect with our platform engineering group for campus onboarding, department integration inquiries, or technical feedback.
              </p>
            </div>

            {/* Configurable Social & Email Cards */}
            <div className="space-y-3">
              <a
                href={`mailto:${CONTACT_LINKS.email}`}
                className="flex items-center justify-between p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#E84D96]/12 text-[#E84D96] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#19171D] dark:text-white">Email</p>
                    <p className="text-xs text-[#574148] dark:text-[#B9B2C3] truncate">
                      {CONTACT_LINKS.email}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#77727D] shrink-0" />
              </a>

              <a
                href={CONTACT_LINKS.instagramHref}
                onClick={(e) => {
                  if (CONTACT_LINKS.instagramHref.startsWith('#')) {
                    e.preventDefault();
                    pushToast('Instagram handle', `Configured handle: ${CONTACT_LINKS.instagramLabel}`);
                  }
                }}
                className="flex items-center justify-between p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#E84D96]/12 text-[#E84D96] flex items-center justify-center shrink-0">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#19171D] dark:text-white">Instagram</p>
                    <p className="text-xs text-[#574148] dark:text-[#B9B2C3] truncate">
                      {CONTACT_LINKS.instagramLabel}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#77727D] shrink-0" />
              </a>

              <a
                href={CONTACT_LINKS.githubHref}
                onClick={(e) => {
                  if (CONTACT_LINKS.githubHref.startsWith('#')) {
                    e.preventDefault();
                    pushToast('GitHub repository', `Configured repository: ${CONTACT_LINKS.githubLabel}`);
                  }
                }}
                className="flex items-center justify-between p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#19171D] dark:bg-[#302B35] text-white flex items-center justify-center shrink-0">
                    <Github className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#19171D] dark:text-white">GitHub</p>
                    <p className="text-xs text-[#574148] dark:text-[#B9B2C3] truncate">
                      {CONTACT_LINKS.githubLabel}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#77727D] shrink-0" />
              </a>
            </div>
          </div>

          <form
            onSubmit={handleContactSubmit}
            className="lg:col-span-7 bg-[#F8F6F7] dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 space-y-4"
          >
            {contactSent && (
              <div className="p-3 rounded-xl bg-[#EBF5F1] dark:bg-[#163128] text-[#00513F] dark:text-[#86E0C3] text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Inquiry captured. Click Get Started above whenever you are ready to sign in.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  University Email
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="alex@university.edu"
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Role
                </label>
                <select
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
                >
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Campus Administrator">Campus Administrator</option>
                  <option value="Facilities Ops">Facilities Ops</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Message or Department Request
              </label>
              <textarea
                rows={4}
                required
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Tell us which campus workflows or departments you would like to onboard..."
                className="w-full p-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#77727D] dark:text-[#A19BA8]">
                Ready to access the platform?{' '}
                <button
                  type="button"
                  onClick={() => onGetStarted('overview')}
                  className="font-semibold text-[#E84D96] hover:underline cursor-pointer"
                >
                  {isLiveSynced ? 'Open Dashboard' : 'Get Started'}
                </button>
              </span>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E84D96] hover:bg-[#D23C83] text-white text-xs font-semibold cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 8. PROFESSIONAL FOOTER */}
      <footer className="border-t border-[#E8E4E9] dark:border-[#2E2936] bg-[#19171D] text-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-white/70">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-white font-display font-bold text-sm">
              <span className="w-6 h-6 rounded-md bg-[#E84D96] text-white flex items-center justify-center text-[11px]">
                CF
              </span>
              CAMPUSFIX AI
            </div>
            <p className="text-white/60">
              {isLiveSynced
                ? `Signed in as ${user.displayName} (${user.email})`
                : 'Smart Campus Operating System · Authenticate via Get Started to launch workspace'}
            </p>
            <p className="text-white/45">© {new Date().getFullYear()} CAMPUSFIX AI. All rights reserved.</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#features" className="hover:text-[#FF70B5] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#FF70B5] transition-colors">
              How It Works
            </a>
            <a href="#about" className="hover:text-[#FF70B5] transition-colors">
              About Us
            </a>
            <a href="#contact" className="hover:text-[#FF70B5] transition-colors">
              Contact
            </a>
            <button
              type="button"
              onClick={() => onGetStarted('overview')}
              className="px-3.5 py-1.5 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white font-semibold cursor-pointer"
            >
              {isLiveSynced ? 'Open Dashboard' : 'Get Started'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
