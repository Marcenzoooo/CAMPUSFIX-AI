import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  MailCheck,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type AuthMode = 'signin' | 'register' | 'reset';

interface AuthPageProps {
  initialMode?: AuthMode;
  onBackToLanding: () => void;
  onAuthenticated: () => void;
}

const NETWORK_NODES = [
  { id: 'hub', x: 210, y: 150, label: 'CAMPUSFIX CORE', r: 10, accent: true },
  { id: 'nova', x: 95, y: 78, label: 'Nova AI', r: 7, accent: true },
  { id: 'nab', x: 330, y: 82, label: 'North Academic', r: 6, accent: false },
  { id: 'lib', x: 92, y: 224, label: 'Central Library', r: 6, accent: false },
  { id: 'eng', x: 332, y: 222, label: 'Engineering Lab', r: 7, accent: true },
  { id: 'ops', x: 210, y: 44, label: 'Smart Ops', r: 5, accent: false },
  { id: 'quad', x: 210, y: 256, label: 'West Quad', r: 5, accent: false },
];

const NETWORK_EDGES: [string, string][] = [
  ['hub', 'nova'],
  ['hub', 'nab'],
  ['hub', 'lib'],
  ['hub', 'eng'],
  ['hub', 'ops'],
  ['hub', 'quad'],
  ['nova', 'ops'],
  ['nab', 'ops'],
  ['lib', 'quad'],
  ['eng', 'quad'],
];

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical & Robotics',
  'Data Science & AI',
  'Architecture & Design',
  'Campus Operations & Faculty',
];

function GoogleBadgeIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.1 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z"
      />
      <path
        fill="#34A853"
        d="M3.3 7.5l3.2 2.3C7.4 7.8 9.5 6.4 12 6.4c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.1 14.6 2.2 12 2.2 8.1 2.2 4.7 4.4 3.3 7.5z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.8c2.6 0 4.8-.9 6.4-2.4l-3-2.4c-.8.6-1.9 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1l-3.2 2.5c1.5 3.2 4.9 5.4 8.8 5.4z"
      />
      <path
        fill="#4285F4"
        d="M21.4 12.2c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.3 1.4-1.1 2.5-2.1 3.2l3 2.4c1.8-1.6 3-4.1 3-7.9z"
      />
    </svg>
  );
}

export function AuthPage({
  initialMode = 'signin',
  onBackToLanding,
  onAuthenticated,
}: AuthPageProps) {
  const {
    firebaseUser,
    isEmailVerified,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    resendVerificationEmail,
    refreshVerificationStatus,
    sendPasswordReset,
    signOut,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowPassword(false);
  };

  const resolveLoginEmail = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed.includes('@') && /^[A-Za-z0-9._-]{3,32}$/.test(trimmed)) {
      return `${trimmed.toLowerCase()}@campusfix.edu`;
    }
    return trimmed;
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      onAuthenticated();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);

    try {
      if (mode === 'signin') {
        const resolvedEmail = resolveLoginEmail(identifier);
        await signInWithEmail(resolvedEmail, password);
        onAuthenticated();
      } else if (mode === 'register') {
        if (!displayName.trim()) {
          setErrorMsg('Please enter your full name.');
          setBusy(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password is too weak. Please enter at least 6 characters.');
          setBusy(false);
          return;
        }
        const res = await registerWithEmail({
          displayName,
          email: identifier.trim(),
          password,
          department,
        });
        if (res.verificationSent) {
          setSuccessMsg(
            `Student account created for ${identifier.trim()}. A verification link has been sent to your email—verify it before entering Campus OS.`
          );
        } else {
          setErrorMsg(
            res.verificationError ||
              'Student account was created, but we could not dispatch the verification email automatically. Click "Resend Verification Link" below.'
          );
        }
      } else {
        const resolvedEmail = resolveLoginEmail(identifier);
        await sendPasswordReset(resolvedEmail);
        setSuccessMsg(
          'Password recovery email dispatched. Check your inbox for reset instructions.'
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication request failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleCheckVerification = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      const verified = await refreshVerificationStatus();
      if (verified) {
        onAuthenticated();
      } else {
        setErrorMsg(
          'Your email is still unverified. Click the verification link in your inbox (check spam/junk too), then click "I\'ve Verified — Continue".'
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not verify account status.');
    } finally {
      setBusy(false);
    }
  };

  const handleResendVerification = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      await resendVerificationEmail();
      setSuccessMsg(
        `Verification link re-sent to ${firebaseUser?.email || identifier.trim()}. Check your inbox and spam folder.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not resend verification email.');
    } finally {
      setBusy(false);
    }
  };

  const handleSwitchAccount = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    await signOut();
  };

  const awaitingEmailVerification = Boolean(firebaseUser && !isEmailVerified);

  const headingCopy = awaitingEmailVerification
    ? {
        title: 'Verify Your Email',
        subtitle:
          'Confirm your university email address to activate your Campus OS profile and Firestore access.',
      }
    : mode === 'signin'
      ? {
          title: 'Welcome Back',
          subtitle: 'Sign in with Google or your university credentials to enter Campus OS.',
        }
      : mode === 'register'
        ? {
            title: 'Create Student Account',
            subtitle: 'Provision your verified CAMPUSFIX AI profile across all 13 campus modules.',
          }
        : {
            title: 'Reset Password',
            subtitle: 'Enter your registered university email to receive a secure recovery link.',
          };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8F6F7] dark:bg-[#141218] text-[#19171D] dark:text-[#F5F3F6] transition-colors">
      {/* LEFT PANEL: Midnight Black + Signature Pink Animated Campus Identity */}
      <aside className="relative lg:w-[48%] xl:w-[50%] bg-[#19171D] text-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#302B35]">
        {/* Ambient Signature Pink & Rose Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -left-24 w-[420px] h-[420px] rounded-full bg-[#E84D96]/18 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-20 w-[380px] h-[380px] rounded-full bg-[#E84D96]/12 blur-3xl"
        />

        {/* Top Bar inside Left Panel */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white px-3 py-2 rounded-lg bg-[#25212C] border border-white/10 hover:border-[#E84D96]/60 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#E84D96]" />
            Back to Landing
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E84D96] flex items-center justify-center font-display font-extrabold text-xs text-white shadow-sm">
              CF
            </div>
            <span className="font-display font-bold text-sm tracking-tight whitespace-nowrap">
              CAMPUSFIX AI
            </span>
          </div>
        </div>

        {/* Center Visual: Animated Campus Network + Floating Graduation Cap */}
        <div className="relative z-10 my-8 lg:my-6 space-y-6">
          <div className="relative rounded-2xl bg-[#221E29]/90 border border-[#342E3D] p-5 sm:p-6 shadow-2xl overflow-hidden">
            {/* Subtle Floating Graduation Cap & AI Beacon */}
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#FFB0CC]">
                <Sparkles className="w-4 h-4 text-[#E84D96]" />
                <span>Intelligent Campus Graph</span>
              </div>
              <div className="animate-auth-float w-10 h-10 rounded-xl bg-[#E84D96]/15 border border-[#E84D96]/40 flex items-center justify-center text-[#FF70B5]">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            {/* Glowing Campus Network SVG */}
            <svg
              viewBox="0 0 420 295"
              className="w-full h-auto max-h-[260px]"
              role="img"
              aria-label="Animated campus network linking Nova AI, academic blocks, libraries, and operations nodes"
            >
              <defs>
                <radialGradient id="authNodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#E84D96" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#E84D96" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Soft radial halo behind core */}
              <circle cx="210" cy="150" r="68" fill="url(#authNodeGlow)" />

              {/* Animated connection lines */}
              {NETWORK_EDGES.map(([fromId, toId], idx) => {
                const a = NETWORK_NODES.find((n) => n.id === fromId);
                const b = NETWORK_NODES.find((n) => n.id === toId);
                if (!a || !b) return null;
                return (
                  <g key={`${fromId}-${toId}`}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="#3C3547"
                      strokeWidth="1.5"
                    />
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={idx % 2 === 0 ? '#E84D96' : '#FF8BC2'}
                      strokeOpacity="0.75"
                      strokeWidth="1.6"
                      className="animate-network-flow"
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {NETWORK_NODES.map((node) => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r + 6}
                    fill={node.accent ? '#E84D96' : '#FFFFFF'}
                    fillOpacity={node.accent ? '0.16' : '0.07'}
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r}
                    fill={node.accent ? '#E84D96' : '#302B35'}
                    stroke={node.accent ? '#FF9ACA' : '#77727D'}
                    strokeWidth="1.8"
                  />
                  <text
                    x={node.x}
                    y={node.y + node.r + 14}
                    textAnchor="middle"
                    fill="#D5CFDC"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="var(--font-sans)"
                  >
                    {node.label}
                  </text>
                </g>
              ))}
            </svg>

            {/* Bottom floating capability strip inside illustration */}
            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-[11px] text-white/75">
              <div className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-[#E84D96] shrink-0" />
                <span className="truncate">Nova AI Mentor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#E84D96] shrink-0" />
                <span className="truncate">Smart Facilities</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#27866D] shrink-0" />
                <span className="truncate">Firestore RBAC</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 max-w-md">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              One verified campus identity for learning, rooms, and operations.
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Authenticate once with Google Campus SSO or email credentials to synchronize Nova AI study plans, CampusFix tickets, smart classroom reservations, and Academic Vault bookmarks.
            </p>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="relative z-10 flex items-center justify-between text-xs text-white/50">
          <span>CAMPUSFIX AI Identity Gateway</span>
          <span>Encrypted Firebase Session</span>
        </div>
      </aside>

      {/* RIGHT PANEL: Animated Split-Screen Auth Forms */}
      <main className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12">
        {/* Top Utility Row */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#E84D96]">
            Campus Access Portal
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#1E1B24] text-[#19171D] dark:text-white hover:border-[#E84D96] transition-colors cursor-pointer"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto my-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`heading-${mode}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-1.5"
            >
              <h1 className="text-3xl font-bold tracking-tight text-[#19171D] dark:text-white">
                {headingCopy.title}
              </h1>
              <p className="text-sm text-[#574148] dark:text-[#C5BECF]">{headingCopy.subtitle}</p>
            </motion.div>
          </AnimatePresence>

          {/* Continue with Google Primary CTA */}
          {mode !== 'reset' && !awaitingEmailVerification && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={busy}
                className="w-full h-11 px-4 rounded-xl bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96] text-[#19171D] dark:text-white text-sm font-semibold flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                <GoogleBadgeIcon />
                Continue with Google
              </button>

              <div className="relative flex items-center justify-center">
                <span className="h-px bg-[#E8E4E9] dark:bg-[#342E3D] w-full" />
                <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-[#77727D] dark:text-[#A19BA8] bg-[#F8F6F7] dark:bg-[#141218] shrink-0">
                  or continue with email
                </span>
                <span className="h-px bg-[#E8E4E9] dark:bg-[#342E3D] w-full" />
              </div>
            </>
          )}

          {/* Mode Tabs */}
          {!awaitingEmailVerification && (
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] text-xs font-medium">
              {[
                { id: 'signin' as const, label: 'Sign In', icon: Mail },
                { id: 'register' as const, label: 'Create Account', icon: UserPlus },
                { id: 'reset' as const, label: 'Reset', icon: KeyRound },
              ].map((item) => {
                const Icon = item.icon;
                const active = mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => switchMode(item.id)}
                    className={`py-2 px-2 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#19171D] dark:bg-[#E84D96] text-white font-semibold'
                        : 'text-[#574148] dark:text-[#B9B2C3] hover:text-[#19171D] dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FBEBED] dark:bg-[#C95765]/15 border border-[#C95765]/35 text-xs text-[#93000A] dark:text-[#FDA4AF]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#EBF5F1] dark:bg-[#27866D]/20 border border-[#27866D]/35 text-xs text-[#00513F] dark:text-[#6EE7B7]"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {awaitingEmailVerification ? (
            <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F8E7EF] dark:bg-[#3A2233] flex items-center justify-center text-[#E84D96] shrink-0">
                  <MailCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h2 className="text-base font-bold text-[#19171D] dark:text-white">
                    Verify Your Email to Continue
                  </h2>
                  <p className="text-xs text-[#574148] dark:text-[#C5BECF] leading-relaxed">
                    Access to protected campus modules and Firestore writes is locked until{' '}
                    <span className="font-semibold text-[#19171D] dark:text-white break-all">
                      {firebaseUser?.email}
                    </span>{' '}
                    is verified.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleCheckVerification}
                  disabled={busy}
                  className="w-full h-11 rounded-xl bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
                  {busy ? 'Checking Verification...' : "I've Verified — Continue"}
                </button>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={busy}
                  className="w-full h-10 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96] text-xs font-semibold text-[#19171D] dark:text-white transition-colors cursor-pointer disabled:opacity-60"
                >
                  Resend Verification Link
                </button>
              </div>

              <div className="pt-2 border-t border-[#E8E4E9] dark:border-[#342E3D] flex items-center justify-between text-xs text-[#574148] dark:text-[#C5BECF]">
                <span>Wrong email or want Google SSO?</span>
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  disabled={busy}
                  className="font-semibold text-[#E84D96] hover:underline cursor-pointer"
                >
                  Sign Out & Switch
                </button>
              </div>
            </div>
          ) : (
            /* Animated Form Panel */
            <AnimatePresence mode="wait">
              <motion.form
                key={`form-${mode}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.22 }}
                onSubmit={handleSubmit}
                className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 shadow-xs space-y-4"
              >
              {mode === 'register' && (
                <>
                  <div>
                    <label
                      htmlFor="auth-fullname"
                      className="block text-xs font-semibold text-[#302B35] dark:text-[#E8E4E9] mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#77727D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-fullname"
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Ananya Sharma"
                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-[#F8F6F7]/50 dark:bg-[#141218] text-sm text-[#19171D] dark:text-white focus:outline-none focus:border-[#E84D96]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-department"
                      className="block text-xs font-semibold text-[#302B35] dark:text-[#E8E4E9] mb-1.5"
                    >
                      Department
                    </label>
                    <select
                      id="auth-department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-[#F8F6F7]/50 dark:bg-[#141218] text-sm text-[#19171D] dark:text-white focus:outline-none focus:border-[#E84D96]"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-[#302B35] dark:text-[#E8E4E9] mb-1.5"
                >
                  {mode === 'signin' ? 'University Email or PRN' : 'University Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#77727D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-email"
                    type={mode === 'signin' ? 'text' : 'email'}
                    required
                    autoComplete="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      mode === 'signin' ? 'student@university.edu or CFX20270418' : 'student@university.edu'
                    }
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-[#F8F6F7]/50 dark:bg-[#141218] text-sm text-[#19171D] dark:text-white focus:outline-none focus:border-[#E84D96]"
                  />
                </div>
                {mode === 'signin' && (
                  <p className="mt-1 text-[11px] text-[#77727D] dark:text-[#A19BA8]">
                    Bare Student PRNs resolve automatically to <span className="font-mono-num">@campusfix.edu</span>.
                  </p>
                )}
              </div>

              {mode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-semibold text-[#302B35] dark:text-[#E8E4E9]"
                    >
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => switchMode('reset')}
                        className="text-xs font-semibold text-[#E84D96] hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#77727D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full h-10 pl-9 pr-10 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-[#F8F6F7]/50 dark:bg-[#141218] text-sm text-[#19171D] dark:text-white focus:outline-none focus:border-[#E84D96]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-[#77727D] hover:text-[#19171D] dark:hover:text-white cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full h-11 rounded-xl bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
              >
                {busy
                  ? 'Authenticating...'
                  : mode === 'signin'
                    ? 'Sign In'
                    : mode === 'register'
                      ? 'Create Student Account'
                      : 'Send Password Reset Link'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 border-t border-[#E8E4E9] dark:border-[#342E3D] flex items-center justify-between text-xs text-[#574148] dark:text-[#C5BECF]">
                {mode === 'signin' ? (
                  <>
                    <span>New to CAMPUSFIX AI?</span>
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-semibold text-[#E84D96] hover:underline cursor-pointer"
                    >
                      Create Student Account
                    </button>
                  </>
                ) : (
                  <>
                    <span>Already have campus credentials?</span>
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="font-semibold text-[#E84D96] hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </motion.form>
          </AnimatePresence>
          )}
        </div>

        {/* Bottom Helper */}
        <p className="text-center text-xs text-[#77727D] dark:text-[#A19BA8]">
          Protected by Firebase Authentication & Cloud Firestore Security Rules.
        </p>
      </main>
    </div>
  );
}
