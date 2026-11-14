import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '../firebase';
import type { CampusUser, UserRole } from '../types';

interface AuthContextValue {
  user: CampusUser;
  firebaseUser: FirebaseUser | null;
  authReady: boolean;
  isEmailVerified: boolean;
  isLiveSynced: boolean;
  authError: string | null;
  bookmarks: string[];
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (input: {
    displayName: string;
    email: string;
    password: string;
    department: string;
  }) => Promise<{ verificationSent: boolean; verificationError?: string }>;
  resendVerificationEmail: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchPreviewRole: (role: UserRole) => void;
  updateProfile: (
    updates: Partial<Pick<CampusUser, 'displayName' | 'department' | 'year' | 'bio'>>
  ) => Promise<void>;
  toggleBookmark: (itemId: string) => Promise<void>;
}

const DEFAULT_PREVIEW_USER: CampusUser = {
  uid: 'demo-student',
  displayName: 'Ananya Sharma',
  email: 'ananya.sharma@campusfix.edu',
  role: 'student',
  department: 'Computer Science & Engineering',
  year: 'Junior · Class of 2027',
  campusId: 'CFX-2027-0418',
  bio: 'Distributed systems track, robotics club lead, and peer mentor for CS-201.',
  isDemo: true,
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PENDING_PROFILE_PREFIX = 'campusfix_pending_profile_';

interface PendingProfileData {
  displayName: string;
  department: string;
}

function savePendingProfile(uid: string, data: PendingProfileData) {
  try {
    localStorage.setItem(`${PENDING_PROFILE_PREFIX}${uid}`, JSON.stringify(data));
  } catch {
    // Ignore storage quota / privacy mode issues
  }
}

function readPendingProfile(uid: string): PendingProfileData | null {
  try {
    const raw = localStorage.getItem(`${PENDING_PROFILE_PREFIX}${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingProfileData>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName.trim() : '',
      department: typeof parsed.department === 'string' ? parsed.department.trim() : '',
    };
  } catch {
    return null;
  }
}

function clearPendingProfile(uid: string) {
  try {
    localStorage.removeItem(`${PENDING_PROFILE_PREFIX}${uid}`);
  } catch {
    // Ignore storage cleanup issues
  }
}

function formatFirebaseAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code)
      : '';
  const msg = err instanceof Error ? err.message : 'Authentication failed.';

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console (Authentication → Sign-in method). Use Google Sign-In or enable Email/Password.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your credentials or reset your password.';
    case 'auth/invalid-email':
      return 'Please enter a valid university email address.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead or reset your password.';
    case 'auth/weak-password':
      return 'Password is too weak. Please enter at least 6 characters.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google Sign-In popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email under a different sign-in provider. Sign in using your original method.';
    case 'auth/network-request-failed':
      return 'Network error contacting Firebase Authentication. Check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts detected. Please wait a minute before trying again.';
    default:
      return msg;
  }
}

function isVerifiedOrGoogleUser(fbUser: FirebaseUser | null): boolean {
  if (!fbUser) return false;
  return (
    Boolean(fbUser.emailVerified) ||
    fbUser.providerData.some((provider) => provider.providerId === 'google.com')
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [user, setUser] = useState<CampusUser>(DEFAULT_PREVIEW_USER);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>(['RES-301', 'EXC-101', 'OPP-901']);
  const syncInFlightRef = useRef<Map<string, Promise<void>>>(new Map());

  const clearAuthError = () => setAuthError(null);

  const syncVerifiedUserProfile = async (fbUser: FirebaseUser) => {
    const existingSync = syncInFlightRef.current.get(fbUser.uid);
    if (existingSync) {
      return existingSync;
    }

    const syncPromise = (async () => {
      const tokenResult = await fbUser.getIdTokenResult();
      if (!tokenResult.claims.email_verified && isVerifiedOrGoogleUser(fbUser)) {
        await fbUser.getIdToken(true);
      }

      const publicRef = doc(db, 'users', fbUser.uid);
      const privateRef = doc(db, 'users', fbUser.uid, 'private', 'profile');
      const pending = readPendingProfile(fbUser.uid);

    let publicSnap;
    try {
      publicSnap = await getDoc(publicRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
    }

    const isBootstrappedAdminEmail =
      (fbUser.email || '').trim().toLowerCase() === 'marcenzoo44@gmail.com';
    const defaultRole: UserRole = isBootstrappedAdminEmail ? 'admin' : 'student';

    const boundedAvatar = (fbUser.photoURL || '').slice(0, 500);
    const safeDisplayName =
      (pending?.displayName || fbUser.displayName || '').trim().slice(0, 80) ||
      'Campus Member';
    const safeDepartment =
      (pending?.department || '').trim().slice(0, 80) ||
      'Computer Science & Engineering';
    const safeEmail =
      (fbUser.email || '').trim().slice(0, 160) || 'member@campusfix.edu';

    if (!publicSnap.exists()) {
      const newPublic = {
        uid: fbUser.uid,
        displayName: safeDisplayName,
        role: defaultRole,
        department: safeDepartment,
        year: defaultRole === 'admin' ? 'Campus Operations' : 'Class of 2027',
        bio: 'Verified CAMPUSFIX AI platform member.',
        avatarUrl: boundedAvatar,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      try {
        await setDoc(publicRef, newPublic);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
      }
    }

    let privateSnap;
    try {
      privateSnap = await getDoc(privateRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}/private/profile`);
    }

    if (!privateSnap.exists()) {
      try {
        await setDoc(privateRef, {
          uid: fbUser.uid,
          email: safeEmail,
          campusId: `CFX-${fbUser.uid.slice(0, 6).toUpperCase()}`,
          bookmarks: ['RES-301', 'EXC-101'],
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}/private/profile`);
      }
    }

    clearPendingProfile(fbUser.uid);

    const refreshedPublic = (await getDoc(publicRef)).data();
    const refreshedPrivate = (await getDoc(privateRef)).data();

    setUser({
      uid: fbUser.uid,
      displayName: refreshedPublic?.displayName || safeDisplayName,
      email: refreshedPrivate?.email || fbUser.email || '',
      role: (refreshedPublic?.role as UserRole) || defaultRole,
      department: refreshedPublic?.department || safeDepartment,
      year: refreshedPublic?.year || 'Class of 2027',
      campusId: refreshedPrivate?.campusId || `CFX-${fbUser.uid.slice(0, 6).toUpperCase()}`,
      bio: refreshedPublic?.bio || '',
      avatarUrl: refreshedPublic?.avatarUrl || boundedAvatar || undefined,
      isDemo: false,
    });

    if (Array.isArray(refreshedPrivate?.bookmarks)) {
      setBookmarks(refreshedPrivate.bookmarks);
    }
    setAuthError(null);
    })();

    syncInFlightRef.current.set(fbUser.uid, syncPromise);
    try {
      await syncPromise;
    } finally {
      syncInFlightRef.current.delete(fbUser.uid);
    }
  };

  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (!fbUser) {
        setIsEmailVerified(false);
        setUser(DEFAULT_PREVIEW_USER);
        setAuthReady(true);
        return;
      }

      if (!isVerifiedOrGoogleUser(fbUser)) {
        const pending = readPendingProfile(fbUser.uid);
        setIsEmailVerified(false);
        setUser({
          uid: fbUser.uid,
          displayName:
            (pending?.displayName || fbUser.displayName || '').trim().slice(0, 80) ||
            'Campus Member',
          email: fbUser.email || '',
          role: 'student',
          department:
            (pending?.department || '').trim().slice(0, 80) ||
            'Computer Science & Engineering',
          year: 'Verification Pending',
          campusId: `CFX-${fbUser.uid.slice(0, 6).toUpperCase()}`,
          bio: 'Email verification required before accessing Campus OS.',
          avatarUrl: (fbUser.photoURL || '').slice(0, 500) || undefined,
          isDemo: false,
        });
        setAuthReady(true);
        return;
      }

      setIsEmailVerified(true);
      try {
        await syncVerifiedUserProfile(fbUser);
      } catch (err) {
        console.error('Auth profile sync error:', err);
        setAuthError(
          'Signed in, but Firestore profile sync encountered a permission or network issue.'
        );
        setUser({
          uid: fbUser.uid,
          displayName: (fbUser.displayName || '').trim().slice(0, 80) || 'Campus Member',
          email: fbUser.email || '',
          role:
            (fbUser.email || '').trim().toLowerCase() === 'marcenzoo44@gmail.com'
              ? 'admin'
              : 'student',
          department: 'Computer Science & Engineering',
          year: 'Class of 2027',
          campusId: `CFX-${fbUser.uid.slice(0, 6).toUpperCase()}`,
          bio: 'Signed in session.',
          avatarUrl: (fbUser.photoURL || '').slice(0, 500) || undefined,
          isDemo: false,
        });
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (isVerifiedOrGoogleUser(cred.user)) {
        await cred.user.getIdToken(true);
        setFirebaseUser(cred.user);
        setIsEmailVerified(true);
        await syncVerifiedUserProfile(cred.user);
      }
    } catch (err) {
      const msg = formatFirebaseAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await cred.user.reload();
      if (!cred.user.emailVerified) {
        setFirebaseUser(cred.user);
        setIsEmailVerified(false);
        const msg =
          'Your email address is not verified yet. Please click the verification link in your inbox, or resend it below.';
        setAuthError(msg);
        throw new Error(msg);
      }
      await cred.user.getIdToken(true);
      setFirebaseUser(cred.user);
      setIsEmailVerified(true);
      await syncVerifiedUserProfile(cred.user);
    } catch (err) {
      const msg = formatFirebaseAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const registerWithEmail = async (input: {
    displayName: string;
    email: string;
    password: string;
    department: string;
  }) => {
    setAuthError(null);
    const safeName = input.displayName.trim().slice(0, 80);
    const safeDept = input.department.trim().slice(0, 80) || 'Computer Science & Engineering';

    if (safeName.length < 1) {
      throw new Error('Please enter your full name.');
    }
    if (input.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
      savePendingProfile(cred.user.uid, { displayName: safeName, department: safeDept });
      await updateFirebaseProfile(cred.user, {
        displayName: safeName,
      });

      setFirebaseUser(cred.user);
      setIsEmailVerified(Boolean(cred.user.emailVerified));

      let verificationSent = false;
      let verificationError: string | undefined;
      try {
        await sendEmailVerification(cred.user);
        verificationSent = true;
      } catch (verifyErr) {
        verificationSent = false;
        verificationError = formatFirebaseAuthError(verifyErr);
      }
      return { verificationSent, verificationError };
    } catch (err) {
      const msg = formatFirebaseAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const resendVerificationEmail = async () => {
    setAuthError(null);
    const current = auth.currentUser;
    if (!current) {
      throw new Error('Sign in with your registered email first to resend the verification link.');
    }
    try {
      await current.reload();
      if (current.emailVerified) {
        await current.getIdToken(true);
        setIsEmailVerified(true);
        await syncVerifiedUserProfile(current);
        return;
      }
      await sendEmailVerification(current);
    } catch (err) {
      const msg = formatFirebaseAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const refreshVerificationStatus = async (): Promise<boolean> => {
    setAuthError(null);
    const current = auth.currentUser;
    if (!current) return false;
    await current.reload();
    if (current.emailVerified) {
      await current.getIdToken(true);
      setFirebaseUser(current);
      setIsEmailVerified(true);
      await syncVerifiedUserProfile(current);
      return true;
    }
    setIsEmailVerified(false);
    return false;
  };

  const sendPasswordReset = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      const msg = formatFirebaseAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signOut = async () => {
    setAuthError(null);
    setIsEmailVerified(false);
    await firebaseSignOut(auth);
  };

  const switchPreviewRole = (role: UserRole) => {
    if (firebaseUser) return;
    setUser((prev) => ({
      ...prev,
      role,
      displayName:
        role === 'admin'
          ? 'Dr. Marcus Chen (Admin)'
          : role === 'faculty'
            ? 'Prof. Elena Vance'
            : 'Ananya Sharma',
      year:
        role === 'admin'
          ? 'Operations Director'
          : role === 'faculty'
            ? 'Associate Professor'
            : 'Junior · Class of 2027',
    }));
  };

  const updateProfile = async (
    updates: Partial<Pick<CampusUser, 'displayName' | 'department' | 'year' | 'bio'>>
  ) => {
    const cleanName = updates.displayName?.trim().slice(0, 80);
    const cleanDept = updates.department?.trim().slice(0, 80);
    const clean = {
      ...(cleanName && cleanName.length >= 1 ? { displayName: cleanName } : {}),
      ...(cleanDept && cleanDept.length >= 1 ? { department: cleanDept } : {}),
      ...(updates.year !== undefined ? { year: updates.year.trim().slice(0, 32) } : {}),
      ...(updates.bio !== undefined ? { bio: updates.bio.trim().slice(0, 300) } : {}),
    };
    setUser((prev) => ({ ...prev, ...clean }));
    if (firebaseUser && isVerifiedOrGoogleUser(firebaseUser)) {
      const publicRef = doc(db, 'users', firebaseUser.uid);
      try {
        await updateDoc(publicRef, {
          ...clean,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
      }
    }
  };

  const toggleBookmark = async (itemId: string) => {
    const next = bookmarks.includes(itemId)
      ? bookmarks.filter((id) => id !== itemId)
      : [itemId, ...bookmarks].slice(0, 100);
    setBookmarks(next);
    if (firebaseUser && isVerifiedOrGoogleUser(firebaseUser)) {
      const privateRef = doc(db, 'users', firebaseUser.uid, 'private', 'profile');
      try {
        const existingSnap = await getDoc(privateRef);
        if (!existingSnap.exists()) {
          await setDoc(privateRef, {
            uid: firebaseUser.uid,
            email: (firebaseUser.email || '').trim().slice(0, 160) || 'member@campusfix.edu',
            campusId: user.campusId || `CFX-${firebaseUser.uid.slice(0, 6).toUpperCase()}`,
            bookmarks: next,
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(privateRef, {
            bookmarks: next,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}/private/profile`);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        authReady,
        isEmailVerified,
        isLiveSynced: Boolean(firebaseUser && isEmailVerified),
        authError,
        bookmarks,
        clearAuthError,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        resendVerificationEmail,
        refreshVerificationStatus,
        sendPasswordReset,
        signOut,
        switchPreviewRole,
        updateProfile,
        toggleBookmark,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
