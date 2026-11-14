import React, { useState } from 'react';
import {
  Award,
  Bookmark,
  BookOpen,
  Building2,
  CheckCircle2,
  Edit3,
  FolderKanban,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  UserCircle,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCampusData } from '../contexts/CampusDataContext';
import type { ModuleId } from '../types';
import { StatusBadge } from './StatusChip';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical & Autonomous Robotics',
  'Data Science & AI Systems',
  'Architecture & Urban Design',
  'Campus Operations & Administration',
];

export function StudentProfileModule({ onNavigate }: { onNavigate: (id: ModuleId) => void }) {
  const { user, isLiveSynced, bookmarks, updateProfile } = useAuth();
  const { notes, savedMentor, complaints, resources, pushToast } = useCampusData();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [department, setDepartment] = useState(user.department);
  const [year, setYear] = useState(user.year);
  const [bio, setBio] = useState(user.bio);
  const [saving, setSaving] = useState(false);

  const myComplaints = complaints.filter(
    (c) => c.authorId === user.uid || c.authorName === user.displayName
  ).length;
  const totalDownloads = resources.reduce((sum, r) => sum + r.downloads, 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ displayName, department, year, bio });
      setEditing(false);
      pushToast(
        'Campus profile saved',
        isLiveSynced
          ? 'Synced to your Cloud Firestore profile.'
          : 'Saved in your active preview session.'
      );
    } finally {
      setSaving(false);
    }
  };

  const badges = [
    {
      title: 'Verified Campus Identity',
      detail: isLiveSynced ? 'Authenticated Cloud Account' : 'Preview Session ID',
      earned: isLiveSynced,
    },
    {
      title: 'Active Note Architect',
      detail: `${notes.length} study notes saved in Workspace`,
      earned: notes.length >= 2,
    },
    {
      title: 'Nova Mentor Explorer',
      detail: `${savedMentor.length} AI study insights archived`,
      earned: savedMentor.length >= 1,
    },
    {
      title: 'Resource Curator',
      detail: `${bookmarks.length} cross-campus bookmarks`,
      earned: bookmarks.length >= 2,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#19171D] dark:text-white">
            Student Profile & Digital Campus ID
          </h1>
          <p className="text-sm text-[#574148] dark:text-[#C5BECF]">
            Personalize your department, academic cohort, and inspect your ecosystem activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('workspace')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#19171D] dark:bg-[#E84D96] text-white text-xs font-semibold cursor-pointer"
        >
          <FolderKanban className="w-4 h-4" />
          Open Study Workspace
        </button>
      </div>

      {/* Digital Campus ID + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-[#19171D] text-white rounded-2xl p-6 border border-[#302B35] flex flex-col justify-between space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-14 h-14 rounded-2xl object-cover border border-white/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[#E84D96] flex items-center justify-center font-display font-bold text-lg text-white">
                  {user.displayName
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold">{user.displayName}</h2>
                <p className="text-xs text-[#FFB0CC] capitalize font-semibold">{user.role} Pass</p>
              </div>
            </div>
            <StatusBadge
              label={isLiveSynced ? 'Firestore Live' : 'Preview ID'}
              tone={isLiveSynced ? 'green' : 'amber'}
            />
          </div>

          <div className="space-y-2.5 text-xs border-y border-white/10 py-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Campus ID</span>
              <span className="font-mono-num font-bold text-white">{user.campusId}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-white/60 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#E84D96]" /> Department
              </span>
              <span className="font-medium text-right">{user.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Cohort / Title</span>
              <span className="font-medium">{user.year}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-white/60 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#E84D96]" /> Email
              </span>
              <span className="font-mono-num truncate">{user.email}</span>
            </div>
          </div>

          <p className="text-xs text-white/80 leading-relaxed">{user.bio}</p>
        </div>

        {/* Profile Personalization Panel */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-[#E84D96]" />
              <h2 className="text-base font-bold text-[#19171D] dark:text-white">
                Academic Profile & Department Personalization
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setDisplayName(user.displayName);
                setDepartment(user.department);
                setYear(user.year);
                setBio(user.bio);
                setEditing((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96] text-xs font-semibold cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#E84D96]" />
              {editing ? 'Cancel' : 'Edit Details'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                    Academic Year / Title
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Department (personalizes Overview focus)
                </label>
                <select
                  value={DEPARTMENTS.includes(department) ? department : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') setDepartment(e.target.value);
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm mb-2"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  {!DEPARTMENTS.includes(department) && <option value="custom">{department}</option>}
                </select>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Academic Interests & Bio
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D]">
                <FolderKanban className="w-4 h-4 text-[#E84D96] mb-1.5" />
                <p className="text-2xl font-bold font-mono-num">{notes.length}</p>
                <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">Study Notes</p>
              </div>
              <div className="p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D]">
                <Sparkles className="w-4 h-4 text-[#E84D96] mb-1.5" />
                <p className="text-2xl font-bold font-mono-num">{savedMentor.length}</p>
                <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">Nova Saves</p>
              </div>
              <div className="p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D]">
                <Bookmark className="w-4 h-4 text-[#E84D96] mb-1.5" />
                <p className="text-2xl font-bold font-mono-num">{bookmarks.length}</p>
                <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">Bookmarks</p>
              </div>
              <div className="p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D]">
                <Wrench className="w-4 h-4 text-[#27866D] mb-1.5" />
                <p className="text-2xl font-bold font-mono-num">{myComplaints}</p>
                <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">Reports Filed</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#E8E4E9] dark:border-[#342E3D] flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[#574148] dark:text-[#C5BECF] flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#E84D96]" />
              Academic Vault shared {totalDownloads} total downloads campus-wide.
            </span>
            <button
              type="button"
              onClick={() => onNavigate('mentor')}
              className="font-semibold text-[#E84D96] hover:underline cursor-pointer"
            >
              Launch Nova AI Mentor →
            </button>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <section className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-[#19171D] dark:text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-[#E84D96]" />
          Campus Milestones & Verification Badges
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b) => (
            <div
              key={b.title}
              className="p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D] flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                {b.earned ? (
                  <ShieldCheck className="w-5 h-5 text-[#27866D]" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-[#77727D]" />
                )}
                <StatusBadge label={b.earned ? 'Earned' : 'In Progress'} tone={b.earned ? 'green' : 'charcoal'} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#19171D] dark:text-white">{b.title}</p>
                <p className="text-xs text-[#574148] dark:text-[#C5BECF] mt-0.5">{b.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
