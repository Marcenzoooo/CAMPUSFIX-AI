import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './AuthContext';
import {
  INITIAL_CLASSROOMS,
  INITIAL_COMPLAINTS,
  INITIAL_LISTINGS,
  INITIAL_LOST_ITEMS,
  INITIAL_NOTES,
  INITIAL_NOTICES,
  INITIAL_OPPORTUNITIES,
  INITIAL_RESOURCES,
  INITIAL_SAVED_MENTOR,
} from '../data/seedData';
import type {
  ActivityEvent,
  AppNotification,
  CampusNotice,
  CampusUser,
  ClassroomNode,
  ComplaintItem,
  LostFoundItem,
  MarketplaceListing,
  ModuleId,
  OpportunityItem,
  SavedMentorResponse,
  VaultResource,
  WorkspaceNote,
} from '../types';

export interface ToastMessage {
  id: string;
  title: string;
  detail?: string;
  tone: 'success' | 'info' | 'error';
}

interface CampusDataContextValue {
  complaints: ComplaintItem[];
  listings: MarketplaceListing[];
  classrooms: ClassroomNode[];
  notices: CampusNotice[];
  resources: VaultResource[];
  lostItems: LostFoundItem[];
  opportunities: OpportunityItem[];
  notes: WorkspaceNote[];
  savedMentor: SavedMentorResponse[];
  directoryUsers: CampusUser[];
  activityFeed: ActivityEvent[];
  notifications: AppNotification[];
  reportedListingIds: Record<string, string>;
  toasts: ToastMessage[];
  loadingData: boolean;
  firestoreError: string | null;
  clearFirestoreError: () => void;
  pushToast: (title: string, detail?: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  logActivity: (title: string, detail: string, module: ModuleId, tone?: ActivityEvent['tone']) => void;
  createComplaint: (input: {
    title: string;
    description: string;
    category: ComplaintItem['category'];
    building: string;
    room: string;
    priority: ComplaintItem['priority'];
    assignedTeam?: string;
    aiSuggestion?: string;
    evidencePreviewUrl?: string;
  }) => Promise<void>;
  upvoteComplaint: (id: string) => Promise<void>;
  updateComplaintStatus: (
    id: string,
    status: ComplaintItem['status'],
    meta?: { assignedTeam?: string; resolutionNotes?: string }
  ) => Promise<void>;
  createListing: (input: {
    title: string;
    description: string;
    price: number;
    category: MarketplaceListing['category'];
    condition: MarketplaceListing['condition'];
  }) => Promise<void>;
  reserveListing: (id: string) => Promise<void>;
  reportListing: (id: string, reason: string) => void;
  updateClassroom: (id: string, patch: Partial<ClassroomNode>) => void;
  createNotice: (input: {
    title: string;
    body: string;
    noticeType: CampusNotice['noticeType'];
    location: string;
    eventDate: string;
  }) => Promise<void>;
  rsvpNotice: (id: string) => Promise<void>;
  createResource: (input: {
    title: string;
    courseCode: string;
    resourceType: VaultResource['resourceType'];
    semester: string;
    description: string;
  }) => Promise<void>;
  incrementDownload: (id: string) => Promise<void>;
  createLostItem: (input: {
    title: string;
    description: string;
    itemType: LostFoundItem['itemType'];
    location: string;
    category: LostFoundItem['category'];
    imageUrl?: string;
  }) => Promise<void>;
  updateLostItemStatus: (id: string, status: LostFoundItem['status']) => Promise<void>;
  createOpportunity: (input: {
    title: string;
    organization: string;
    oppType: OpportunityItem['oppType'];
    deadline: string;
    reward: string;
    description: string;
  }) => Promise<void>;
  applyOpportunity: (id: string) => Promise<void>;
  createNote: (input: { title: string; content: string; courseCode: string }) => Promise<void>;
  updateNote: (
    id: string,
    patch: { title: string; content: string; courseCode: string }
  ) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  saveMentorResponse: (input: { title: string; summary: string; topic: string }) => Promise<void>;
  deleteMentorResponse: (id: string) => Promise<void>;
}

const CampusDataContext = createContext<CampusDataContextValue | null>(null);

function makeDocId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const INITIAL_ACTIVITY: ActivityEvent[] = [
  {
    id: 'act-1',
    timeLabel: '2h ago',
    title: 'Ticket CMP-2408 dispatched to AV & Classroom Systems',
    detail: 'LH-3B projector HDMI matrix switching diagnostics active',
    module: 'campusfix',
    tone: 'amber',
  },
  {
    id: 'act-2',
    timeLabel: '3h ago',
    title: 'Smart Match detected in Lost & Found',
    detail: '94% confidence match on matte black wireless headphones (LIB Level 3)',
    module: 'lostfound',
    tone: 'rose',
  },
  {
    id: 'act-3',
    timeLabel: 'Today',
    title: 'Autumn Smart Campus Buildathon open for teams',
    detail: '142 students registered · Innovation Center Atrium',
    module: 'connect',
    tone: 'green',
  },
];

export function CampusDataProvider({ children }: { children: React.ReactNode }) {
  const { user, firebaseUser, authReady, isEmailVerified } = useAuth();
  const canSyncFirestore = Boolean(firebaseUser && isEmailVerified);
  const [fsComplaints, setFsComplaints] = useState<ComplaintItem[]>([]);
  const [localComplaints, setLocalComplaints] = useState<ComplaintItem[]>(INITIAL_COMPLAINTS);

  const [fsListings, setFsListings] = useState<MarketplaceListing[]>([]);
  const [localListings, setLocalListings] = useState<MarketplaceListing[]>(INITIAL_LISTINGS);
  const [reportedListingIds, setReportedListingIds] = useState<Record<string, string>>({});

  const [classrooms, setClassrooms] = useState<ClassroomNode[]>(INITIAL_CLASSROOMS);

  const [fsNotices, setFsNotices] = useState<CampusNotice[]>([]);
  const [localNotices, setLocalNotices] = useState<CampusNotice[]>(INITIAL_NOTICES);

  const [fsResources, setFsResources] = useState<VaultResource[]>([]);
  const [localResources, setLocalResources] = useState<VaultResource[]>(INITIAL_RESOURCES);

  const [fsLostItems, setFsLostItems] = useState<LostFoundItem[]>([]);
  const [localLostItems, setLocalLostItems] = useState<LostFoundItem[]>(INITIAL_LOST_ITEMS);

  const [fsOpportunities, setFsOpportunities] = useState<OpportunityItem[]>([]);
  const [localOpportunities, setLocalOpportunities] = useState<OpportunityItem[]>(INITIAL_OPPORTUNITIES);

  const [fsNotes, setFsNotes] = useState<WorkspaceNote[]>([]);
  const [localNotes, setLocalNotes] = useState<WorkspaceNote[]>(INITIAL_NOTES);

  const [fsSavedMentor, setFsSavedMentor] = useState<SavedMentorResponse[]>([]);
  const [localSavedMentor, setLocalSavedMentor] = useState<SavedMentorResponse[]>(INITIAL_SAVED_MENTOR);

  const [directoryUsers, setDirectoryUsers] = useState<CampusUser[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>(INITIAL_ACTIVITY);
  const [readNotifications, setReadNotifications] = useState<Record<string, boolean>>({});

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const clearFirestoreError = () => setFirestoreError(null);

  const pushToast = (
    title: string,
    detail?: string,
    tone: ToastMessage['tone'] = 'success'
  ) => {
    const id = makeDocId('toast');
    setToasts((prev) => [...prev.slice(-3), { id, title, detail, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logActivity = (
    title: string,
    detail: string,
    module: ModuleId,
    tone: ActivityEvent['tone'] = 'charcoal'
  ) => {
    setActivityFeed((prev) => [
      { id: makeDocId('act'), timeLabel: 'Just now', title, detail, module, tone },
      ...prev.slice(0, 19),
    ]);
  };

  const safeReportFirestoreError = (
    err: unknown,
    operation: (typeof OperationType)[keyof typeof OperationType],
    path: string
  ) => {
    try {
      handleFirestoreError(err, operation, path);
    } catch (wrapped) {
      const msg = wrapped instanceof Error ? wrapped.message : String(wrapped);
      let friendly = 'Cloud Firestore operation failed.';
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.error) friendly = `Firestore (${path}): ${parsed.error}`;
      } catch {
        friendly = msg;
      }
      setFirestoreError(friendly);
      pushToast('Sync Error', friendly, 'error');
    }
  };

  useEffect(() => {
    if (!authReady || !canSyncFirestore || !firebaseUser) {
      setFsComplaints([]);
      setFsListings([]);
      setFsNotices([]);
      setFsResources([]);
      setFsLostItems([]);
      setFsOpportunities([]);
      setFsNotes([]);
      setFsSavedMentor([]);
      setDirectoryUsers([]);
      setFirestoreError(null);
      return;
    }

    setLoadingData(true);
    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'complaints'),
          where('status', 'in', ['open', 'in_progress', 'resolved'])
        ),
        (snap) => {
          const rows = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: String(data.title || ''),
              description: String(data.description || ''),
              category: data.category || 'electrical',
              building: String(data.building || ''),
              room: data.room ? String(data.room) : '',
              priority: data.priority || 'medium',
              status: data.status || 'open',
              authorId: String(data.authorId || ''),
              authorName: String(data.authorName || ''),
              assignedTeam: data.assignedTeam ? String(data.assignedTeam) : undefined,
              aiSuggestion: data.aiSuggestion ? String(data.aiSuggestion) : undefined,
              resolutionNotes: data.resolutionNotes ? String(data.resolutionNotes) : undefined,
              upvotes: Number(data.upvotes || 0),
              createdAtLabel: 'Synced',
              source: 'firestore' as const,
            } satisfies ComplaintItem;
          });
          setFsComplaints(rows);
          setLoadingData(false);
        },
        (err) => {
          setLoadingData(false);
          safeReportFirestoreError(err, OperationType.LIST, 'complaints');
        }
      )
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'listings'),
          where('status', 'in', ['available', 'reserved', 'sold'])
        ),
        (snap) => {
          setFsListings(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                title: String(data.title || ''),
                description: String(data.description || ''),
                price: Number(data.price || 0),
                category: data.category || 'electronics',
                condition: data.condition || 'good',
                status: data.status || 'available',
                sellerId: String(data.sellerId || ''),
                sellerName: String(data.sellerName || ''),
                imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
                createdAtLabel: 'Synced',
                source: 'firestore' as const,
              } satisfies MarketplaceListing;
            })
          );
        },
        (err) => safeReportFirestoreError(err, OperationType.LIST, 'listings')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'notices'), where('status', 'in', ['active', 'archived'])),
        (snap) => {
          setFsNotices(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                title: String(data.title || ''),
                body: String(data.body || ''),
                noticeType: data.noticeType || 'circular',
                location: data.location ? String(data.location) : undefined,
                eventDate: data.eventDate ? String(data.eventDate) : undefined,
                organizerId: String(data.organizerId || ''),
                organizerName: String(data.organizerName || ''),
                rsvpCount: Number(data.rsvpCount || 0),
                createdAtLabel: 'Synced',
                source: 'firestore' as const,
              } satisfies CampusNotice;
            })
          );
        },
        (err) => safeReportFirestoreError(err, OperationType.LIST, 'notices')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'resources'), where('status', 'in', ['active', 'archived'])),
        (snap) => {
          setFsResources(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                title: String(data.title || ''),
                courseCode: String(data.courseCode || ''),
                resourceType: data.resourceType || 'notes',
                semester: String(data.semester || 'Fall 2026'),
                description: String(data.description || ''),
                uploaderId: String(data.uploaderId || ''),
                uploaderName: String(data.uploaderName || ''),
                downloads: Number(data.downloads || 0),
                pagesCount: 12,
                previewSections: [
                  {
                    heading: 'Uploaded Study Resource Summary',
                    body: String(data.description || 'Academic Vault verified document.'),
                  },
                ],
                source: 'firestore' as const,
              } satisfies VaultResource;
            })
          );
        },
        (err) => safeReportFirestoreError(err, OperationType.LIST, 'resources')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'lostItems'), where('status', 'in', ['open', 'matched', 'claimed'])),
        (snap) => {
          setFsLostItems(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                title: String(data.title || ''),
                description: String(data.description || ''),
                itemType: data.itemType || 'lost',
                location: String(data.location || ''),
                category: data.category || 'electronics',
                status: data.status || 'open',
                reporterId: String(data.reporterId || ''),
                reporterName: String(data.reporterName || ''),
                createdAtLabel: 'Synced',
                source: 'firestore' as const,
              } satisfies LostFoundItem;
            })
          );
        },
        (err) => safeReportFirestoreError(err, OperationType.LIST, 'lostItems')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'opportunities'), where('status', 'in', ['active', 'closed'])),
        (snap) => {
          setFsOpportunities(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                title: String(data.title || ''),
                organization: String(data.organization || ''),
                oppType: data.oppType || 'hackathon',
                deadline: String(data.deadline || ''),
                reward: String(data.reward || ''),
                description: String(data.description || ''),
                creatorId: String(data.creatorId || ''),
                applicantCount: Number(data.applicantCount || 0),
                source: 'firestore' as const,
              } satisfies OpportunityItem;
            })
          );
        },
        (err) => safeReportFirestoreError(err, OperationType.LIST, 'opportunities')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'notes'), where('userId', '==', firebaseUser.uid)),
        (snap) => {
          setFsNotes(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                userId: String(data.userId || ''),
                title: String(data.title || ''),
                content: String(data.content || ''),
                courseCode: String(data.courseCode || 'GENERAL'),
                updatedAtLabel: 'Synced',
                source: 'firestore' as const,
              } satisfies WorkspaceNote;
            })
          );
        },
        (err) => safeReportFirestoreError(err, OperationType.LIST, 'notes')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'mentorSessions'), where('userId', '==', firebaseUser.uid)),
        (snap) => {
          setFsSavedMentor(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                userId: String(data.userId || ''),
                title: String(data.title || ''),
                summary: String(data.summary || ''),
                topic: String(data.topic || 'Academic'),
                createdAtLabel: 'Synced',
                source: 'firestore' as const,
              } satisfies SavedMentorResponse;
            })
          );
        },
        (err) => safeReportFirestoreError(err, OperationType.LIST, 'mentorSessions')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'users'), where('role', 'in', ['student', 'faculty', 'admin'])),
        (snap) => {
          setDirectoryUsers(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                uid: String(data.uid || d.id),
                displayName: String(data.displayName || 'Campus Member'),
                email: 'Verified Campus Account',
                role: (data.role as CampusUser['role']) || 'student',
                department: String(data.department || 'General'),
                year: String(data.year || ''),
                campusId: `CFX-${d.id.slice(0, 6).toUpperCase()}`,
                bio: String(data.bio || ''),
                avatarUrl: data.avatarUrl ? String(data.avatarUrl) : undefined,
                isDemo: false,
              } satisfies CampusUser;
            })
          );
        },
        () => {
          // directory list optional; avoid noisy errors if unverified
        }
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [authReady, canSyncFirestore, firebaseUser]);

  const complaints = [...fsComplaints, ...localComplaints];
  const listings = [...fsListings, ...localListings];
  const notices = [...fsNotices, ...localNotices];
  const resources = [...fsResources, ...localResources];
  const lostItems = [...fsLostItems, ...localLostItems];
  const opportunities = [...fsOpportunities, ...localOpportunities];
  const notes = [...fsNotes, ...localNotes];
  const savedMentor = [...fsSavedMentor, ...localSavedMentor];

  const notifications: AppNotification[] = useMemo(() => {
    const items: AppNotification[] = [];

    complaints
      .filter((c) => c.status !== 'resolved' && (c.priority === 'critical' || c.priority === 'high'))
      .slice(0, 3)
      .forEach((c) => {
        const id = `notif-cmp-${c.id}`;
        items.push({
          id,
          title: `${c.priority.toUpperCase()} Facility Ticket: ${c.id}`,
          detail: `${c.title} (${c.building})`,
          module: 'campusfix',
          severity: c.priority === 'critical' ? 'critical' : 'info',
          timeLabel: c.createdAtLabel,
          read: Boolean(readNotifications[id]),
        });
      });

    lostItems
      .filter((l) => l.status === 'matched')
      .slice(0, 2)
      .forEach((l) => {
        const id = `notif-lf-${l.id}`;
        items.push({
          id,
          title: 'Smart Lost & Found Match Detected',
          detail: `${l.title} · ${l.location}`,
          module: 'lostfound',
          severity: 'success',
          timeLabel: l.createdAtLabel,
          read: Boolean(readNotifications[id]),
        });
      });

    classrooms
      .filter((r) => r.co2Ppm >= 750 || r.temperatureC - r.targetTempC >= 2.5)
      .slice(0, 2)
      .forEach((r) => {
        const id = `notif-rm-${r.id}`;
        items.push({
          id,
          title: `Room ${r.code} Environmental Advisory`,
          detail: `Temp ${r.temperatureC.toFixed(1)}°C · CO₂ ${r.co2Ppm} ppm`,
          module: 'classroom',
          severity: 'info',
          timeLabel: 'Telemetry',
          read: Boolean(readNotifications[id]),
        });
      });

    notices.slice(0, 2).forEach((n) => {
      const id = `notif-ntc-${n.id}`;
      items.push({
        id,
        title: n.title,
        detail: `${n.organizerName} · ${n.eventDate || n.createdAtLabel}`,
        module: 'connect',
        severity: 'info',
        timeLabel: n.createdAtLabel,
        read: Boolean(readNotifications[id]),
      });
    });

    return items;
  }, [complaints, lostItems, classrooms, notices, readNotifications]);

  const markNotificationRead = (id: string) => {
    setReadNotifications((prev) => ({ ...prev, [id]: true }));
  };

  const markAllNotificationsRead = () => {
    const next: Record<string, boolean> = {};
    notifications.forEach((n) => {
      next[n.id] = true;
    });
    setReadNotifications((prev) => ({ ...prev, ...next }));
  };

  const createComplaint: CampusDataContextValue['createComplaint'] = async (input) => {
    const id = makeDocId('CMP');
    if (canSyncFirestore && firebaseUser) {
      try {
        await setDoc(doc(db, 'complaints', id), {
          title: input.title.trim().slice(0, 140),
          description: input.description.trim().slice(0, 2000),
          category: input.category,
          building: input.building.trim().slice(0, 80) || 'Main Campus',
          room: input.room.trim().slice(0, 40),
          priority: input.priority,
          status: 'open',
          authorId: firebaseUser.uid,
          authorName: (user.displayName || '').trim().slice(0, 80) || 'Campus Member',
          assignedTeam: (input.assignedTeam || 'Campus Operations').trim().slice(0, 80),
          aiSuggestion: (input.aiSuggestion || '').trim().slice(0, 500),
          upvotes: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        pushToast('Issue logged to Cloud Firestore', `Ticket ${id} dispatched.`);
        logActivity(`Logged ticket ${id}`, `${input.title} (${input.building})`, 'campusfix', 'rose');
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.CREATE, `complaints/${id}`);
      }
    }

    setLocalComplaints((prev) => [
      {
        id,
        ...input,
        status: 'open',
        authorId: user.uid,
        authorName: user.displayName,
        upvotes: 0,
        createdAtLabel: 'Just now',
        source: 'seed',
      },
      ...prev,
    ]);
    logActivity(`Logged ticket ${id}`, `${input.title} (${input.building})`, 'campusfix', 'rose');
    pushToast(
      'Issue logged locally',
      'Sign in with Google to persist tickets to Cloud Firestore.',
      'info'
    );
  };

  const upvoteComplaint = async (id: string) => {
    const target = complaints.find((c) => c.id === id);
    if (!target) return;
    if (target.source === 'firestore' && canSyncFirestore && firebaseUser) {
      if (target.status === 'resolved') {
        pushToast('Resolved tickets cannot be upvoted', undefined, 'info');
        return;
      }
      try {
        await updateDoc(doc(db, 'complaints', id), {
          upvotes: target.upvotes + 1,
          updatedAt: serverTimestamp(),
        });
        pushToast('Upvote recorded');
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.UPDATE, `complaints/${id}`);
      }
    }
    setLocalComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c))
    );
    pushToast('Priority upvote added');
  };

  const updateComplaintStatus: CampusDataContextValue['updateComplaintStatus'] = async (
    id,
    status,
    meta
  ) => {
    const target = complaints.find((c) => c.id === id);
    if (!target) return;
    if (target.source === 'firestore' && canSyncFirestore && firebaseUser) {
      try {
        await updateDoc(doc(db, 'complaints', id), {
          status,
          ...(meta?.assignedTeam ? { assignedTeam: meta.assignedTeam.slice(0, 80) } : {}),
          ...(meta?.resolutionNotes !== undefined
            ? { resolutionNotes: meta.resolutionNotes.slice(0, 500) }
            : {}),
          updatedAt: serverTimestamp(),
        });
        pushToast('Ticket status updated', `${id} marked ${status.replace('_', ' ')}`);
        logActivity(`Updated ${id}`, `Status changed to ${status.replace('_', ' ')}`, 'campusfix', 'green');
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.UPDATE, `complaints/${id}`);
      }
    }
    setLocalComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              assignedTeam: meta?.assignedTeam || c.assignedTeam,
              resolutionNotes:
                meta?.resolutionNotes !== undefined ? meta.resolutionNotes : c.resolutionNotes,
            }
          : c
      )
    );
    logActivity(`Updated ${id}`, `Status changed to ${status.replace('_', ' ')}`, 'campusfix', 'green');
    pushToast('Ticket status updated', `${id} marked ${status.replace('_', ' ')}`);
  };

  const createListing: CampusDataContextValue['createListing'] = async (input) => {
    const id = makeDocId('EXC');
    if (canSyncFirestore && firebaseUser) {
      try {
        await setDoc(doc(db, 'listings', id), {
          title: input.title.trim().slice(0, 120),
          description: input.description.trim().slice(0, 1500),
          price: Number(input.price),
          category: input.category,
          condition: input.condition,
          status: 'available',
          sellerId: firebaseUser.uid,
          sellerName: (user.displayName || '').trim().slice(0, 80) || 'Campus Member',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        pushToast('Listing published to Firestore', input.title);
        logActivity('Published Exchange listing', input.title, 'exchange', 'rose');
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.CREATE, `listings/${id}`);
      }
    }
    setLocalListings((prev) => [
      {
        id,
        ...input,
        status: 'available',
        sellerId: user.uid,
        sellerName: user.displayName,
        createdAtLabel: 'Just now',
        source: 'seed',
      },
      ...prev,
    ]);
    logActivity('Published Exchange listing', input.title, 'exchange', 'rose');
    pushToast('Listing created locally', 'Sign in with Google to sync with Firestore.', 'info');
  };

  const reserveListing = async (id: string) => {
    const target = listings.find((l) => l.id === id);
    if (!target) return;
    if (target.source === 'firestore' && canSyncFirestore && firebaseUser) {
      try {
        await updateDoc(doc(db, 'listings', id), {
          status: 'reserved',
          updatedAt: serverTimestamp(),
        });
        pushToast('Item reserved', 'Seller has been notified.');
        logActivity('Reserved Exchange item', target.title, 'exchange', 'green');
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.UPDATE, `listings/${id}`);
      }
    }
    setLocalListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'reserved' } : l))
    );
    logActivity('Reserved Exchange item', target.title, 'exchange', 'green');
    pushToast('Hold placed on item', 'Reservation confirmed in local preview.');
  };

  const reportListing = (id: string, reason: string) => {
    const target = listings.find((l) => l.id === id);
    setReportedListingIds((prev) => ({ ...prev, [id]: reason }));
    logActivity(
      'Flagged Exchange listing',
      `${target?.title || id}: ${reason}`,
      'admin',
      'amber'
    );
    pushToast('Listing flagged for moderation', 'Campus Exchange safety team will review it.', 'info');
  };

  const updateClassroom = (id: string, patch: Partial<ClassroomNode>) => {
    setClassrooms((prev) =>
      prev.map((rm) => (rm.id === id ? { ...rm, ...patch } : rm))
    );
  };

  const createNotice: CampusDataContextValue['createNotice'] = async (input) => {
    const id = makeDocId('NTC');
    if (canSyncFirestore && firebaseUser) {
      try {
        await setDoc(doc(db, 'notices', id), {
          title: input.title.trim().slice(0, 140),
          body: input.body.trim().slice(0, 2000),
          noticeType: input.noticeType,
          status: 'active',
          location: input.location.trim().slice(0, 100),
          eventDate: input.eventDate.trim().slice(0, 60),
          organizerId: firebaseUser.uid,
          organizerName: (user.displayName || '').trim().slice(0, 80) || 'Campus Member',
          rsvpCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        pushToast('Notice published', input.title);
        logActivity('Published Campus notice', input.title, 'connect', 'green');
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.CREATE, `notices/${id}`);
      }
    }
    setLocalNotices((prev) => [
      {
        id,
        ...input,
        organizerId: user.uid,
        organizerName: user.displayName,
        rsvpCount: 0,
        createdAtLabel: 'Just now',
        source: 'seed',
      },
      ...prev,
    ]);
    logActivity('Published Campus notice', input.title, 'connect', 'green');
    pushToast('Notice posted locally', 'Sign in with Google to publish live.', 'info');
  };

  const rsvpNotice = async (id: string) => {
    const target = notices.find((n) => n.id === id);
    if (!target) return;
    if (target.source === 'firestore' && canSyncFirestore && firebaseUser) {
      try {
        await updateDoc(doc(db, 'notices', id), {
          rsvpCount: target.rsvpCount + 1,
          updatedAt: serverTimestamp(),
        });
        pushToast('Registration confirmed', `Seat reserved for ${target.title}`);
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.UPDATE, `notices/${id}`);
      }
    }
    setLocalNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, rsvpCount: n.rsvpCount + 1 } : n))
    );
    pushToast('Registration confirmed', `Added to your schedule for ${target.title}`);
  };

  const createResource: CampusDataContextValue['createResource'] = async (input) => {
    const id = makeDocId('RES');
    if (canSyncFirestore && firebaseUser) {
      try {
        await setDoc(doc(db, 'resources', id), {
          title: input.title.trim().slice(0, 140),
          courseCode: input.courseCode.trim().toUpperCase().slice(0, 24),
          resourceType: input.resourceType,
          status: 'active',
          semester: input.semester.trim().slice(0, 32),
          description: input.description.trim().slice(0, 1000),
          uploaderId: firebaseUser.uid,
          uploaderName: (user.displayName || '').trim().slice(0, 80) || 'Campus Member',
          downloads: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        pushToast('Resource added to Academic Vault', input.title);
        logActivity('Shared Vault resource', `${input.courseCode} · ${input.title}`, 'vault', 'green');
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.CREATE, `resources/${id}`);
      }
    }
    setLocalResources((prev) => [
      {
        id,
        ...input,
        uploaderId: user.uid,
        uploaderName: user.displayName,
        downloads: 0,
        pagesCount: 10,
        previewSections: [
          { heading: 'Overview', body: input.description || 'User-contributed resource.' },
        ],
        source: 'seed',
      },
      ...prev,
    ]);
    logActivity('Shared Vault resource', `${input.courseCode} · ${input.title}`, 'vault', 'green');
    pushToast('Resource added locally', input.title, 'info');
  };

  const incrementDownload = async (id: string) => {
    const target = resources.find((r) => r.id === id);
    if (!target) return;
    if (target.source === 'firestore' && canSyncFirestore && firebaseUser) {
      try {
        await updateDoc(doc(db, 'resources', id), {
          downloads: target.downloads + 1,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        safeReportFirestoreError(err, OperationType.UPDATE, `resources/${id}`);
      }
    } else {
      setLocalResources((prev) =>
        prev.map((r) => (r.id === id ? { ...r, downloads: r.downloads + 1 } : r))
      );
    }
  };

  const createLostItem: CampusDataContextValue['createLostItem'] = async (input) => {
    const id = makeDocId('LF');

    // Compute keyword match against existing opposite-type reports
    const tokens = `${input.title} ${input.description}`
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3);
    const oppositeType = input.itemType === 'lost' ? 'found' : 'lost';
    let bestMatch: { title: string; score: number } | null = null;
    lostItems
      .filter((item) => item.itemType === oppositeType && item.status !== 'claimed')
      .forEach((candidate) => {
        const haystack = `${candidate.title} ${candidate.description} ${candidate.category}`.toLowerCase();
        const hits = tokens.filter((t) => haystack.includes(t)).length;
        const catBonus = candidate.category === input.category ? 2 : 0;
        const rawScore = Math.min(96, 54 + hits * 11 + catBonus * 8);
        if ((hits > 0 || candidate.category === input.category) && (!bestMatch || rawScore > bestMatch.score)) {
          bestMatch = { title: candidate.title, score: rawScore };
        }
      });

    if (canSyncFirestore && firebaseUser) {
      try {
        await setDoc(doc(db, 'lostItems', id), {
          title: input.title.trim().slice(0, 120),
          description: input.description.trim().slice(0, 1000),
          itemType: input.itemType,
          location: input.location.trim().slice(0, 100),
          category: input.category,
          status: 'open',
          reporterId: firebaseUser.uid,
          reporterName: (user.displayName || '').trim().slice(0, 80) || 'Campus Member',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        pushToast('Lost & Found report submitted', input.title);
        logActivity('Submitted Lost & Found', `${input.itemType.toUpperCase()} · ${input.title}`, 'lostfound', 'amber');
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.CREATE, `lostItems/${id}`);
      }
    }
    setLocalLostItems((prev) => [
      {
        id,
        ...input,
        status: bestMatch ? 'matched' : 'open',
        reporterId: user.uid,
        reporterName: user.displayName,
        matchConfidence: bestMatch?.score,
        matchedItemTitle: bestMatch?.title,
        createdAtLabel: 'Just now',
        source: 'seed',
      },
      ...prev,
    ]);
    logActivity('Submitted Lost & Found', `${input.itemType.toUpperCase()} · ${input.title}`, 'lostfound', 'amber');
    pushToast('Report logged locally', input.title, 'info');
  };

  const updateLostItemStatus = async (id: string, status: LostFoundItem['status']) => {
    const target = lostItems.find((i) => i.id === id);
    if (!target) return;
    if (target.source === 'firestore' && canSyncFirestore && firebaseUser) {
      try {
        await updateDoc(doc(db, 'lostItems', id), {
          status,
          updatedAt: serverTimestamp(),
        });
        pushToast('Item status updated', `${target.title} is now ${status}.`);
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.UPDATE, `lostItems/${id}`);
      }
    }
    setLocalLostItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
    pushToast('Claim request recorded', `${target.title} updated to ${status}.`);
  };

  const createOpportunity: CampusDataContextValue['createOpportunity'] = async (input) => {
    const id = makeDocId('OPP');
    if (canSyncFirestore && firebaseUser) {
      try {
        await setDoc(doc(db, 'opportunities', id), {
          title: input.title.trim().slice(0, 140),
          organization: input.organization.trim().slice(0, 100),
          oppType: input.oppType,
          status: 'active',
          deadline: input.deadline.trim().slice(0, 40),
          reward: input.reward.trim().slice(0, 80),
          description: input.description.trim().slice(0, 1500),
          creatorId: firebaseUser.uid,
          applicantCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        pushToast('Opportunity published', input.title);
        logActivity('Published Opportunity', input.title, 'opportunities', 'green');
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.CREATE, `opportunities/${id}`);
      }
    }
    setLocalOpportunities((prev) => [
      {
        id,
        ...input,
        creatorId: user.uid,
        applicantCount: 0,
        source: 'seed',
      },
      ...prev,
    ]);
    logActivity('Published Opportunity', input.title, 'opportunities', 'green');
    pushToast('Opportunity published locally', input.title, 'info');
  };

  const applyOpportunity = async (id: string) => {
    const target = opportunities.find((o) => o.id === id);
    if (!target) return;
    if (target.source === 'firestore' && canSyncFirestore && firebaseUser) {
      try {
        await updateDoc(doc(db, 'opportunities', id), {
          applicantCount: target.applicantCount + 1,
          updatedAt: serverTimestamp(),
        });
        pushToast('Application submitted', target.title);
        logActivity('Applied to Opportunity', target.title, 'opportunities', 'green');
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.UPDATE, `opportunities/${id}`);
      }
    }
    setLocalOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, applicantCount: o.applicantCount + 1 } : o))
    );
    logActivity('Applied to Opportunity', target.title, 'opportunities', 'green');
    pushToast('Application registered', target.title);
  };

  const createNote: CampusDataContextValue['createNote'] = async (input) => {
    const id = makeDocId('NOTE');
    if (canSyncFirestore && firebaseUser) {
      try {
        await setDoc(doc(db, 'notes', id), {
          userId: firebaseUser.uid,
          title: input.title.trim().slice(0, 120),
          content: input.content.trim().slice(0, 5000),
          courseCode: input.courseCode.trim().toUpperCase().slice(0, 24) || 'GENERAL',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        pushToast('Note saved to Cloud Firestore');
        logActivity('Saved study note', input.title, 'workspace', 'rose');
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.CREATE, `notes/${id}`);
      }
    }
    setLocalNotes((prev) => [
      {
        id,
        userId: user.uid,
        title: input.title.trim(),
        content: input.content.trim(),
        courseCode: input.courseCode.trim().toUpperCase() || 'GENERAL',
        updatedAtLabel: 'Just now',
        source: 'local',
      },
      ...prev,
    ]);
    logActivity('Saved study note', input.title, 'workspace', 'rose');
    pushToast('Note saved locally');
  };

  const updateNote: CampusDataContextValue['updateNote'] = async (id, patch) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    if (target.source === 'firestore' && canSyncFirestore && firebaseUser) {
      try {
        await updateDoc(doc(db, 'notes', id), {
          title: patch.title.trim().slice(0, 120),
          content: patch.content.trim().slice(0, 5000),
          courseCode: patch.courseCode.trim().toUpperCase().slice(0, 24) || 'GENERAL',
          updatedAt: serverTimestamp(),
        });
        pushToast('Note updated in Cloud Firestore');
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.UPDATE, `notes/${id}`);
      }
    }
    setLocalNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              title: patch.title.trim(),
              content: patch.content.trim(),
              courseCode: patch.courseCode.trim().toUpperCase() || 'GENERAL',
              updatedAtLabel: 'Updated now',
            }
          : n
      )
    );
    pushToast('Note updated');
  };

  const deleteNote = async (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (target?.source === 'firestore' && canSyncFirestore && firebaseUser) {
      try {
        await deleteDoc(doc(db, 'notes', id));
        pushToast('Note deleted');
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.DELETE, `notes/${id}`);
      }
    }
    setLocalNotes((prev) => prev.filter((n) => n.id !== id));
    pushToast('Note removed');
  };

  const saveMentorResponse: CampusDataContextValue['saveMentorResponse'] = async (input) => {
    const id = makeDocId('SAV');
    if (canSyncFirestore && firebaseUser) {
      try {
        await setDoc(doc(db, 'mentorSessions', id), {
          userId: firebaseUser.uid,
          title: input.title.trim().slice(0, 120),
          summary: input.summary.trim().slice(0, 4000),
          topic: input.topic.trim().slice(0, 80),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        pushToast('Saved to AI Mentor Library');
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.CREATE, `mentorSessions/${id}`);
      }
    }
    setLocalSavedMentor((prev) => [
      {
        id,
        userId: user.uid,
        title: input.title.trim(),
        summary: input.summary.trim(),
        topic: input.topic.trim(),
        createdAtLabel: 'Just now',
        source: 'local',
      },
      ...prev,
    ]);
    pushToast('Saved to AI Mentor Library');
  };

  const deleteMentorResponse = async (id: string) => {
    const target = savedMentor.find((s) => s.id === id);
    if (target?.source === 'firestore' && canSyncFirestore && firebaseUser) {
      try {
        await deleteDoc(doc(db, 'mentorSessions', id));
        pushToast('Saved response removed');
        return;
      } catch (err) {
        safeReportFirestoreError(err, OperationType.DELETE, `mentorSessions/${id}`);
      }
    }
    setLocalSavedMentor((prev) => prev.filter((s) => s.id !== id));
    pushToast('Saved response removed');
  };

  return (
    <CampusDataContext.Provider
      value={{
        complaints,
        listings,
        classrooms,
        notices,
        resources,
        lostItems,
        opportunities,
        notes,
        savedMentor,
        directoryUsers,
        activityFeed,
        notifications,
        reportedListingIds,
        toasts,
        loadingData,
        firestoreError,
        clearFirestoreError,
        pushToast,
        dismissToast,
        markNotificationRead,
        markAllNotificationsRead,
        logActivity,
        createComplaint,
        upvoteComplaint,
        updateComplaintStatus,
        createListing,
        reserveListing,
        reportListing,
        updateClassroom,
        createNotice,
        rsvpNotice,
        createResource,
        incrementDownload,
        createLostItem,
        updateLostItemStatus,
        createOpportunity,
        applyOpportunity,
        createNote,
        updateNote,
        deleteNote,
        saveMentorResponse,
        deleteMentorResponse,
      }}
    >
      {children}
    </CampusDataContext.Provider>
  );
}

export function useCampusData(): CampusDataContextValue {
  const ctx = useContext(CampusDataContext);
  if (!ctx) {
    throw new Error('useCampusData must be used inside CampusDataProvider');
  }
  return ctx;
}
