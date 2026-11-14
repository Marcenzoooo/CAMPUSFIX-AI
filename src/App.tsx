import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Compass,
  FolderKanban,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MonitorCheck,
  Moon,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Shield,
  ShoppingBag,
  Sun,
  Trophy,
  UserCircle,
  Wrench,
  X,
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CampusDataProvider, useCampusData } from './contexts/CampusDataContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import type { ModuleId } from './types';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { OverviewModule } from './components/OverviewModule';
import { CampusFixModule } from './components/CampusFixModule';
import { CampusExchangeModule } from './components/CampusExchangeModule';
import { SmartClassroomModule } from './components/SmartClassroomModule';
import { MentorModule } from './components/MentorModule';
import { CampusConnectModule } from './components/CampusConnectModule';
import { AcademicVaultModule } from './components/AcademicVaultModule';
import { CampusMobilityModule } from './components/CampusMobilityModule';
import { LostFoundModule } from './components/LostFoundModule';
import { OpportunitiesModule } from './components/OpportunitiesModule';
import { WorkspaceModule } from './components/WorkspaceModule';
import { StudentProfileModule } from './components/StudentProfileModule';
import { AdminConsoleModule } from './components/AdminConsoleModule';
import { CommandPalette } from './components/CommandPalette';
import { NotificationCenter } from './components/NotificationCenter';
import { FloatingNovaDrawer } from './components/FloatingNovaDrawer';
import { OnboardingTour } from './components/OnboardingTour';

type ViewMode = 'landing' | 'auth' | 'workspace';

interface NavItem {
  id: ModuleId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'Core' | 'Campus' | 'Personal';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'Core' },
  { id: 'mentor', label: 'AI Mentor', icon: Bot, group: 'Core' },
  { id: 'campusfix', label: 'CampusFix', icon: Wrench, group: 'Core' },
  { id: 'classroom', label: 'Smart Classroom', icon: MonitorCheck, group: 'Campus' },
  { id: 'exchange', label: 'Campus Exchange', icon: ShoppingBag, group: 'Campus' },
  { id: 'connect', label: 'Campus Connect', icon: Megaphone, group: 'Campus' },
  { id: 'vault', label: 'Academic Vault', icon: BookOpen, group: 'Campus' },
  { id: 'mobility', label: 'Campus Mobility', icon: Compass, group: 'Campus' },
  { id: 'lostfound', label: 'Lost & Found', icon: PackageSearch, group: 'Campus' },
  { id: 'opportunities', label: 'Opportunities', icon: Trophy, group: 'Campus' },
  { id: 'workspace', label: 'Student Workspace', icon: FolderKanban, group: 'Personal' },
  { id: 'profile', label: 'Student Profile', icon: UserCircle, group: 'Personal' },
  { id: 'admin', label: 'Admin Console', icon: Shield, group: 'Personal' },
];

function ToastStack() {
  const { toasts, dismissToast } = useCampusData();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-5 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2.5rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-lg bg-white dark:bg-[#1E1B24] ${
            t.tone === 'error'
              ? 'border-[#C95765]'
              : t.tone === 'info'
                ? 'border-[#E8E4E9] dark:border-[#342E3D]'
                : 'border-[#27866D]/40'
          }`}
        >
          <div className="text-xs">
            <p className="font-semibold text-[#19171D] dark:text-white">{t.title}</p>
            {t.detail && (
              <p className="text-[#574148] dark:text-[#C5BECF] mt-0.5">{t.detail}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="text-[#77727D] hover:text-[#19171D] dark:hover:text-white cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function CampusShell() {
  const {
    user,
    firebaseUser,
    authReady,
    isEmailVerified,
    isLiveSynced,
    authError,
    clearAuthError,
    signOut,
  } = useAuth();
  const isVerifiedSession = Boolean(firebaseUser && isEmailVerified);
  const { firestoreError, clearFirestoreError } = useCampusData();
  const { theme, toggleTheme } = useTheme();

  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [activeModule, setActiveModule] = useState<ModuleId>('overview');
  const [pendingModule, setPendingModule] = useState<ModuleId | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [novaDrawerOpen, setNovaDrawerOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const prevUidRef = useRef<string | null>(null);

  // Sync viewMode with persisted verified Firebase Auth session without bypassing auth
  useEffect(() => {
    if (!authReady) return;
    const currentUid = isVerifiedSession && firebaseUser ? firebaseUser.uid : null;
    const prevUid = prevUidRef.current;

    if (currentUid && !prevUid) {
      // Initial session restoration or fresh verified login -> enter authenticated workspace
      if (pendingModule) {
        setActiveModule(pendingModule);
        setPendingModule(null);
      }
      setViewMode('workspace');
    } else if (!currentUid && prevUid) {
      // User signed out -> return to public landing page and close workspace overlays
      setPaletteOpen(false);
      setNovaDrawerOpen(false);
      setMobileMenuOpen(false);
      setViewMode('landing');
    } else if (!currentUid && viewMode === 'workspace') {
      // Guard: unauthenticated or unverified visitors cannot remain in workspace
      setViewMode('auth');
    }

    prevUidRef.current = currentUid;
  }, [authReady, firebaseUser, isVerifiedSession, pendingModule, viewMode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isVerifiedSession || viewMode !== 'workspace') return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isVerifiedSession, viewMode]);

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.id === 'admin' && user.role !== 'admin' && user.role !== 'faculty') {
      return false;
    }
    return true;
  });

  const activeNav = NAV_ITEMS.find((n) => n.id === activeModule) || NAV_ITEMS[0];

  const handleSelectModule = (id: ModuleId) => {
    if (!isVerifiedSession) {
      setPendingModule(id);
      setViewMode('auth');
      return;
    }
    setActiveModule(id);
    setViewMode('workspace');
    setMobileMenuOpen(false);
  };

  const handleGetStarted = (targetModule?: ModuleId) => {
    if (isVerifiedSession) {
      if (targetModule) setActiveModule(targetModule);
      setViewMode('workspace');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setPendingModule(targetModule || 'overview');
    setViewMode('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthenticated = () => {
    if (!isVerifiedSession) return;
    if (pendingModule) {
      setActiveModule(pendingModule);
      setPendingModule(null);
    }
    setViewMode('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    await signOut();
    setViewMode('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show clean branded loader while Firebase restores persisted session
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#19171D] text-white flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-12 h-12 rounded-2xl bg-[#E84D96] flex items-center justify-center font-display font-extrabold text-base text-white shadow-lg">
          CF
        </div>
        <div className="text-center space-y-1">
          <p className="font-display font-bold text-base tracking-tight">CAMPUSFIX AI</p>
          <p className="text-xs text-white/60">Verifying campus session...</p>
        </div>
      </div>
    );
  }

  // Strictly enforce verified authentication before rendering protected workspace
  const effectiveView: ViewMode =
    viewMode === 'workspace' && !isVerifiedSession ? 'auth' : viewMode;

  return (
    <>
      <AnimatePresence mode="wait">
        {effectiveView === 'landing' && (
          <motion.div
            key="view-landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LandingPage onGetStarted={handleGetStarted} />
          </motion.div>
        )}

        {effectiveView === 'auth' && (
          <motion.div
            key="view-auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AuthPage
              onBackToLanding={() => {
                setViewMode('landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onAuthenticated={handleAuthenticated}
            />
          </motion.div>
        )}

        {effectiveView === 'workspace' && isVerifiedSession && (
          <motion.div
            key="view-workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-screen flex bg-[#F8F6F7] dark:bg-[#141218] text-[#19171D] dark:text-[#F5F3F6] transition-colors"
          >
            {/* Desktop & Tablet Sidebar */}
            <aside
              className={`hidden md:flex flex-col justify-between bg-[#19171D] text-white shrink-0 transition-all duration-200 border-r border-[#302B35] ${
                collapsed ? 'w-[72px]' : 'w-[256px]'
              }`}
            >
              <div className="p-4 space-y-5">
                {/* Brand Row */}
                <div className="flex items-center justify-between gap-2 px-1">
                  <button
                    type="button"
                    onClick={() => handleSelectModule('overview')}
                    className="flex items-center gap-2.5 text-left cursor-pointer min-w-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#E84D96] flex items-center justify-center font-display font-extrabold text-sm text-white shrink-0">
                      CF
                    </div>
                    {!collapsed && (
                      <span className="font-display font-bold text-base tracking-tight whitespace-nowrap truncate">
                        CAMPUSFIX AI
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollapsed((v) => !v)}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-[#302B35] cursor-pointer shrink-0"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    {collapsed ? (
                      <PanelLeftOpen className="w-4 h-4" />
                    ) : (
                      <PanelLeftClose className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setViewMode('landing')}
                  title="Public Overview Landing"
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-semibold text-white/75 hover:text-white bg-[#24202B] hover:bg-[#302B35] transition-colors cursor-pointer"
                >
                  <Home className="w-4 h-4 text-[#E84D96] shrink-0" />
                  {!collapsed && <span>Public Landing Overview</span>}
                </button>

                {/* Navigation Groups */}
                <nav className="space-y-4" aria-label="Primary campus navigation">
                  {(['Core', 'Campus', 'Personal'] as const).map((group) => (
                    <div key={group} className="space-y-1">
                      {!collapsed && (
                        <p className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">
                          {group}
                        </p>
                      )}
                      {visibleNavItems
                        .filter((item) => item.group === group)
                        .map((item) => {
                          const Icon = item.icon;
                          const isActive = activeModule === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectModule(item.id)}
                              title={collapsed ? item.label : undefined}
                              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-[#E84D96] text-white'
                                  : 'text-white/75 hover:text-white hover:bg-[#302B35]'
                              }`}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              {!collapsed && (
                                <span className="whitespace-nowrap truncate">{item.label}</span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Bottom Account Summary */}
              <div className="p-4 border-t border-[#302B35]">
                {!collapsed ? (
                  <button
                    type="button"
                    onClick={() => handleSelectModule('profile')}
                    className="w-full flex items-center justify-between text-xs hover:text-[#FFB0CC] cursor-pointer"
                  >
                    <span className="font-semibold truncate">{user.displayName}</span>
                    <span className="text-[11px] text-[#FFB0CC] capitalize">{user.role}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelectModule('profile')}
                    className="flex justify-center w-full cursor-pointer"
                    aria-label="Open Student Profile"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#302B35] flex items-center justify-center text-xs font-bold">
                      {user.displayName.slice(0, 2).toUpperCase()}
                    </div>
                  </button>
                )}
              </div>
            </aside>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-50 md:hidden bg-[#19171D]/55 backdrop-blur-xs flex">
                <div className="w-72 bg-[#19171D] text-white h-full p-5 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-base">CAMPUSFIX AI</span>
                      <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-1.5 rounded-lg text-white/70 hover:text-white cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setViewMode('landing');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold bg-[#24202B] text-white/90 cursor-pointer"
                    >
                      <Home className="w-4 h-4 text-[#E84D96]" />
                      <span>Public Landing Overview</span>
                    </button>

                    <nav className="space-y-1">
                      {visibleNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeModule === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectModule(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                              isActive ? 'bg-[#E84D96] text-white' : 'text-white/80 hover:bg-[#302B35]'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>
                <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
              </div>
            )}

            {/* Main Content Viewport */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Top Bar Contract: 3 Clean Zones */}
              <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#19171D]/95 backdrop-blur-sm border-b border-[#E8E4E9] dark:border-[#302B35] px-4 sm:px-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden p-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-[#19171D] dark:text-white cursor-pointer"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 text-sm min-w-0">
                    <button
                      type="button"
                      onClick={() => setViewMode('landing')}
                      className="font-display font-bold text-[#19171D] dark:text-white hover:text-[#E84D96] whitespace-nowrap cursor-pointer"
                    >
                      CAMPUSFIX AI
                    </button>
                    <span className="text-[#77727D]" aria-hidden="true">
                      /
                    </span>
                    <span className="font-medium text-[#574148] dark:text-[#C5BECF] truncate">
                      {activeNav.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPaletteOpen(true)}
                    className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-[#F8F6F7] dark:bg-[#24202B] hover:border-[#E84D96] text-xs text-[#574148] dark:text-[#C5BECF] cursor-pointer"
                    aria-label="Open Universal Search"
                  >
                    <Search className="w-3.5 h-3.5 text-[#E84D96]" />
                    <span>Search campus...</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#19171D] border border-[#E8E4E9] dark:border-[#342E3D] text-[10px] font-mono-num">
                      ⌘K
                    </kbd>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaletteOpen(true)}
                    className="sm:hidden p-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#1E1B24] text-[#19171D] dark:text-white cursor-pointer"
                    aria-label="Search campus"
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  <NotificationCenter onNavigate={handleSelectModule} />

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="p-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#1E1B24] hover:border-[#E84D96] text-[#19171D] dark:text-white cursor-pointer"
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTourOpen(true)}
                    className="hidden lg:inline-flex p-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#1E1B24] hover:border-[#E84D96] text-[#19171D] dark:text-white cursor-pointer"
                    aria-label="Open Platform Tour"
                  >
                    <HelpCircle className="w-4 h-4 text-[#E84D96]" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectModule('profile')}
                      className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8F6F7] dark:bg-[#24202B] border border-[#E8E4E9] dark:border-[#342E3D] text-xs font-medium text-[#19171D] dark:text-white hover:border-[#E84D96] cursor-pointer"
                    >
                      <span>{user.displayName}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] hover:bg-[#F8F6F7] dark:hover:bg-[#24202B] text-xs font-semibold text-[#19171D] dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Sign Out</span>
                    </button>
                  </div>
                </div>
              </header>

              {authError && (
                <div className="mx-4 sm:mx-8 mt-4 p-3 rounded-xl bg-[#FBEBED] dark:bg-[#3A1B22] border border-[#C95765]/30 text-xs text-[#93000A] dark:text-[#FF9AA6] flex items-center justify-between gap-3">
                  <span>{authError}</span>
                  <button
                    type="button"
                    onClick={clearAuthError}
                    className="p-1 rounded hover:bg-black/5 cursor-pointer"
                    aria-label="Dismiss auth warning"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {firestoreError && (
                <div className="mx-4 sm:mx-8 mt-4 p-3 rounded-xl bg-[#FDF4E7] dark:bg-[#332717] border border-[#C58A32]/30 text-xs text-[#7C5314] dark:text-[#FCD38D] flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {firestoreError}
                  </span>
                  <button
                    type="button"
                    onClick={clearFirestoreError}
                    className="p-1 rounded hover:bg-black/5 cursor-pointer"
                    aria-label="Dismiss sync warning"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
                {activeModule === 'overview' && <OverviewModule onNavigate={handleSelectModule} />}
                {activeModule === 'campusfix' && <CampusFixModule />}
                {activeModule === 'exchange' && <CampusExchangeModule />}
                {activeModule === 'classroom' && <SmartClassroomModule />}
                {activeModule === 'mentor' && <MentorModule />}
                {activeModule === 'connect' && <CampusConnectModule />}
                {activeModule === 'vault' && <AcademicVaultModule />}
                {activeModule === 'mobility' && <CampusMobilityModule />}
                {activeModule === 'lostfound' && <LostFoundModule />}
                {activeModule === 'opportunities' && <OpportunitiesModule />}
                {activeModule === 'workspace' && <WorkspaceModule />}
                {activeModule === 'profile' && (
                  <StudentProfileModule onNavigate={handleSelectModule} />
                )}
                {activeModule === 'admin' && <AdminConsoleModule />}
              </main>

              <footer className="px-6 py-4 border-t border-[#E8E4E9] dark:border-[#302B35] bg-white dark:bg-[#19171D] text-xs text-[#77727D] dark:text-[#A19BA8] flex flex-wrap items-center justify-between gap-3">
                <span>CAMPUSFIX AI Smart Campus Operating Platform</span>
                <span>
                  {isLiveSynced
                    ? `Cloud Firestore Connected · ${user.email}`
                    : 'Authenticated Campus Session'}
                </span>
              </footer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workspace Overlays (strictly verified authenticated) */}
      {effectiveView === 'workspace' && isVerifiedSession && (
        <>
          <CommandPalette
            open={paletteOpen}
            onClose={() => setPaletteOpen(false)}
            onNavigate={handleSelectModule}
          />

          <FloatingNovaDrawer
            open={novaDrawerOpen}
            onToggle={setNovaDrawerOpen}
            onNavigateModule={handleSelectModule}
            activeModuleLabel={activeNav.label}
          />

          <OnboardingTour
            open={tourOpen}
            onClose={() => setTourOpen(false)}
            onNavigate={handleSelectModule}
          />
        </>
      )}

      <ToastStack />
    </>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AuthProvider>
          <CampusDataProvider>
            <CampusShell />
          </CampusDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
