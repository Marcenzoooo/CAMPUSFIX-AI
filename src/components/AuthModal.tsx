import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type AuthTab = 'signin' | 'register' | 'reset';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated?: () => void;
}

export function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, registerWithEmail, sendPasswordReset } = useAuth();

  const [tab, setTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleGoogle = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      onAuthenticated?.();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      if (tab === 'signin') {
        await signInWithEmail(email, password);
        onAuthenticated?.();
        onClose();
      } else if (tab === 'register') {
        if (!displayName.trim()) {
          setErrorMsg('Please enter your full name.');
          setBusy(false);
          return;
        }
        const res = await registerWithEmail({
          displayName,
          email,
          password,
          department,
        });
        setSuccessMsg(
          res.verificationSent
            ? 'Account created! Verify the link sent to your email before signing in to Campus OS.'
            : 'Account created. Please verify your email before accessing Campus OS.'
        );
      } else {
        await sendPasswordReset(email);
        setSuccessMsg('Password reset link sent to your inbox if an account exists.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication request failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#19171D]/65 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E84D96] mb-1">
              <ShieldCheck className="w-4 h-4" />
              CAMPUSFIX AI Identity
            </div>
            <h2
              id="auth-modal-title"
              className="text-xl font-bold text-[#19171D] dark:text-white"
            >
              {tab === 'signin'
                ? 'Sign in to Campus OS'
                : tab === 'register'
                  ? 'Register Student Account'
                  : 'Reset Campus Password'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#77727D] hover:bg-[#F8F6F7] dark:hover:bg-[#2C2735] cursor-pointer"
            aria-label="Close sign in dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google One-Click Primary Provider */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="w-full h-11 px-4 rounded-xl bg-[#19171D] dark:bg-white text-white dark:text-[#19171D] hover:opacity-95 text-sm font-semibold flex items-center justify-center gap-2.5 transition-opacity cursor-pointer disabled:opacity-60"
        >
          <LogIn className="w-4 h-4 text-[#E84D96]" />
          Continue with Google Campus SSO
        </button>

        <div className="relative flex items-center justify-center">
          <span className="h-px bg-[#E8E4E9] dark:bg-[#342E3D] w-full" />
          <span className="px-3 text-[11px] uppercase tracking-wider text-[#77727D] dark:text-[#A39CA9] bg-white dark:bg-[#1E1B24] shrink-0">
            or email credentials
          </span>
          <span className="h-px bg-[#E8E4E9] dark:bg-[#342E3D] w-full" />
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F8F6F7] dark:bg-[#141218] text-xs font-medium">
          {[
            { id: 'signin' as const, label: 'Sign In', icon: Mail },
            { id: 'register' as const, label: 'Register', icon: UserPlus },
            { id: 'reset' as const, label: 'Recovery', icon: KeyRound },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 px-2 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  tab === item.id
                    ? 'bg-white dark:bg-[#2A2633] text-[#19171D] dark:text-white shadow-xs font-semibold'
                    : 'text-[#77727D] hover:text-[#19171D] dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#E84D96]" />
                {item.label}
              </button>
            );
          })}
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FBEBED] dark:bg-[#C95765]/15 border border-[#C95765]/30 text-xs text-[#93000A] dark:text-[#FDA4AF]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#EBF5F1] dark:bg-[#27866D]/20 border border-[#27866D]/30 text-xs text-[#00513F] dark:text-[#6EE7B7]">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {tab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#E8E4E9] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ananya Sharma"
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm text-[#19171D] dark:text-white focus:outline-none focus:border-[#E84D96]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#E8E4E9] mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm text-[#19171D] dark:text-white focus:outline-none focus:border-[#E84D96]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#302B35] dark:text-[#E8E4E9] mb-1">
              University Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm text-[#19171D] dark:text-white focus:outline-none focus:border-[#E84D96]"
            />
          </div>

          {tab !== 'reset' && (
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#E8E4E9] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm text-[#19171D] dark:text-white focus:outline-none focus:border-[#E84D96]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full h-10 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
          >
            {busy
              ? 'Please wait...'
              : tab === 'signin'
                ? 'Sign In with Email'
                : tab === 'register'
                  ? 'Create Student Account'
                  : 'Send Password Reset Link'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-3 border-t border-[#E8E4E9] dark:border-[#342E3D] flex items-center justify-between text-xs text-[#77727D] dark:text-[#A39CA9]">
          <span>Want to explore modules first?</span>
          <button
            type="button"
            onClick={() => {
              onAuthenticated?.();
              onClose();
            }}
            className="font-semibold text-[#E84D96] hover:underline cursor-pointer"
          >
            Enter Preview Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
