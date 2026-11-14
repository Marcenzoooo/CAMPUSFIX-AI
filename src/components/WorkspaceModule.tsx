import React, { useState } from 'react';
import {
  Award,
  Bookmark,
  Clock,
  Edit3,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCampusData } from '../contexts/CampusDataContext';
import { StatusBadge } from './StatusChip';

export function WorkspaceModule() {
  const { user, isLiveSynced, bookmarks, toggleBookmark, updateProfile } = useAuth();
  const {
    notes,
    savedMentor,
    activityFeed,
    createNote,
    updateNote,
    deleteNote,
    deleteMentorResponse,
    listings,
    resources,
    opportunities,
    pushToast,
  } = useCampusData();

  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [department, setDepartment] = useState(user.department);
  const [year, setYear] = useState(user.year);
  const [bio, setBio] = useState(user.bio);

  const [noteTitle, setNoteTitle] = useState('');
  const [noteCourse, setNoteCourse] = useState('CS-304');
  const [noteContent, setNoteContent] = useState('');

  // Inline note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ displayName, department, year, bio });
    setEditingProfile(false);
    pushToast(
      'Profile updated',
      isLiveSynced ? 'Synced to Cloud Firestore.' : 'Updated in local session.'
    );
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    await createNote({ title: noteTitle, content: noteContent, courseCode: noteCourse });
    setNoteTitle('');
    setNoteContent('');
  };

  const startEditNote = (note: (typeof notes)[number]) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditCourse(note.courseCode);
    setEditContent(note.content);
  };

  const handleSaveEditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoteId || !editTitle.trim() || !editContent.trim()) return;
    await updateNote(editingNoteId, {
      title: editTitle,
      courseCode: editCourse,
      content: editContent,
    });
    setEditingNoteId(null);
  };

  const bookmarkedItems = [
    ...resources
      .filter((r) => bookmarks.includes(r.id))
      .map((r) => ({ id: r.id, title: r.title, category: `Vault · ${r.courseCode}` })),
    ...listings
      .filter((l) => bookmarks.includes(l.id))
      .map((l) => ({ id: l.id, title: l.title, category: `Exchange · $${l.price}` })),
    ...opportunities
      .filter((o) => bookmarks.includes(o.id))
      .map((o) => ({ id: o.id, title: o.title, category: `Opportunity · ${o.oppType}` })),
  ];

  const achievements = [
    {
      title: 'Verified Peer Contributor',
      detail: `${resources.length} Academic Vault guides active`,
      earned: resources.length >= 3,
    },
    {
      title: 'Note Synthesis Active',
      detail: `${notes.length} personal study notes stored`,
      earned: notes.length >= 2,
    },
    {
      title: 'Nova AI Collaborator',
      detail: `${savedMentor.length} saved mentor insights`,
      earned: savedMentor.length >= 1,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#19171D] dark:text-white">
          Student Workspace & Personal Portfolio
        </h1>
        <p className="text-sm text-[#574148] dark:text-[#C5BECF]">
          Manage your campus profile, personal study notes, saved Nova mentor explanations, and activity timeline.
        </p>
      </div>

      {/* Profile Header Card */}
      <section className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#19171D] dark:bg-[#E84D96] text-white flex items-center justify-center text-lg font-bold shrink-0">
              {user.displayName
                .split(' ')
                .map((s) => s[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-[#19171D] dark:text-white">
                  {user.displayName}
                </h2>
                <StatusBadge label={user.role} tone="rose" />
                <StatusBadge
                  label={isLiveSynced ? 'Cloud Synced' : 'Preview Session'}
                  tone={isLiveSynced ? 'green' : 'charcoal'}
                />
              </div>
              <p className="text-xs text-[#77727D] dark:text-[#A19BA8] mt-1 font-mono-num">
                {user.campusId} · {user.department} · {user.year}
              </p>
              <p className="text-sm text-[#574148] dark:text-[#C5BECF] mt-2 max-w-2xl">
                {user.bio}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setDisplayName(user.displayName);
              setDepartment(user.department);
              setYear(user.year);
              setBio(user.bio);
              setEditingProfile((v) => !v);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96] text-xs font-semibold text-[#19171D] dark:text-white cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#E84D96]" />
            {editingProfile ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>

        {editingProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-5 pt-5 border-t border-[#E8E4E9] dark:border-[#342E3D] grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Display Name
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
                Department
              </label>
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
                Academic Year / Title
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Bio
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-xs font-semibold cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save Profile
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Personal Study Notes + Saved Mentor Responses */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 space-y-5">
            <h3 className="text-base font-bold text-[#19171D] dark:text-white">
              Personal Study Notes
            </h3>

            <form
              onSubmit={handleAddNote}
              className="p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D] space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title..."
                  className="sm:col-span-2 h-9 px-3 rounded-lg bg-white dark:bg-[#141218] border border-[#E8E4E9] dark:border-[#342E3D] text-xs"
                />
                <input
                  type="text"
                  value={noteCourse}
                  onChange={(e) => setNoteCourse(e.target.value)}
                  placeholder="Course (CS-304)"
                  className="h-9 px-3 rounded-lg bg-white dark:bg-[#141218] border border-[#E8E4E9] dark:border-[#342E3D] text-xs font-mono-num"
                />
              </div>
              <textarea
                required
                rows={2}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write key formulas, reminders, or project tasks..."
                className="w-full p-3 rounded-lg bg-white dark:bg-[#141218] border border-[#E8E4E9] dark:border-[#342E3D] text-xs"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#19171D] dark:bg-[#E84D96] text-white text-xs font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save Note
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {notes.map((n) =>
                editingNoteId === n.id ? (
                  <form
                    key={n.id}
                    onSubmit={handleSaveEditNote}
                    className="p-4 rounded-xl border border-[#E84D96] bg-[#F8E7EF]/30 dark:bg-[#292431] space-y-2.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="sm:col-span-2 h-9 px-3 rounded-lg bg-white dark:bg-[#141218] border border-[#E8E4E9] dark:border-[#342E3D] text-xs"
                      />
                      <input
                        type="text"
                        value={editCourse}
                        onChange={(e) => setEditCourse(e.target.value)}
                        className="h-9 px-3 rounded-lg bg-white dark:bg-[#141218] border border-[#E8E4E9] dark:border-[#342E3D] text-xs font-mono-num"
                      />
                    </div>
                    <textarea
                      required
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-white dark:bg-[#141218] border border-[#E8E4E9] dark:border-[#342E3D] text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingNoteId(null)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-xs cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E84D96] text-white text-xs font-semibold cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Update
                      </button>
                    </div>
                  </form>
                ) : (
                  <div
                    key={n.id}
                    className="p-4 rounded-xl border border-[#E8E4E9] dark:border-[#342E3D] flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[#77727D] dark:text-[#A19BA8]">
                        <span className="font-mono-num font-semibold text-[#E84D96]">
                          {n.courseCode}
                        </span>
                        <span>·</span>
                        <span>{n.updatedAtLabel}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#19171D] dark:text-white">
                        {n.title}
                      </h4>
                      <p className="text-xs text-[#574148] dark:text-[#C5BECF] whitespace-pre-wrap">
                        {n.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditNote(n)}
                        className="p-1.5 rounded-lg text-[#77727D] hover:text-[#E84D96] hover:bg-[#F8E7EF] dark:hover:bg-[#3A2233] cursor-pointer"
                        aria-label="Edit note"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteNote(n.id)}
                        className="p-1.5 rounded-lg text-[#77727D] hover:text-[#C95765] hover:bg-[#FBEBED] dark:hover:bg-[#3A1B22] cursor-pointer"
                        aria-label="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {/* Saved Mentor Library Summary */}
          <section className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[#19171D] dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E84D96]" />
              Saved Nova AI Explanations ({savedMentor.length})
            </h3>
            {savedMentor.length === 0 ? (
              <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">
                Save answers inside AI Academic Mentor to access quick summaries here.
              </p>
            ) : (
              <div className="space-y-3">
                {savedMentor.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D] flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <span className="text-[11px] font-semibold text-[#E84D96]">{item.topic}</span>
                      <h4 className="text-sm font-bold text-[#19171D] dark:text-white">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#574148] dark:text-[#C5BECF] line-clamp-3">
                        {item.summary}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteMentorResponse(item.id)}
                      className="p-1.5 rounded-lg text-[#77727D] hover:text-[#C95765] cursor-pointer shrink-0"
                      aria-label="Remove saved mentor insight"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Bookmarks, Achievements & Live Activity Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#19171D] dark:text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#E84D96]" />
              Saved Bookmarks ({bookmarkedItems.length})
            </h3>
            {bookmarkedItems.length === 0 ? (
              <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">
                Bookmark items from Campus Exchange, Academic Vault, or Opportunities to access them quickly here.
              </p>
            ) : (
              <div className="space-y-2">
                {bookmarkedItems.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#F8F6F7] dark:bg-[#25212C] text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#19171D] dark:text-white truncate">
                        {b.title}
                      </p>
                      <p className="text-[#77727D] dark:text-[#A19BA8]">{b.category}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(b.id)}
                      className="text-[#C95765] hover:underline shrink-0 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#19171D] dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-[#E84D96]" />
              Campus Achievements
            </h3>
            <div className="space-y-2.5">
              {achievements.map((a) => (
                <div
                  key={a.title}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D]"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#19171D] dark:text-white">
                      {a.title}
                    </p>
                    <p className="text-[11px] text-[#77727D] dark:text-[#A19BA8]">{a.detail}</p>
                  </div>
                  <StatusBadge
                    label={a.earned ? 'Earned' : 'In Progress'}
                    tone={a.earned ? 'green' : 'charcoal'}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#19171D] dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E84D96]" />
              Live Activity Timeline
            </h3>
            <div className="space-y-2.5">
              {activityFeed.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-start gap-2.5 text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-[#27866D] mt-0.5 shrink-0" />
                  <div>
                    <span className="font-mono-num text-[#77727D] dark:text-[#A19BA8] block">
                      {t.timeLabel}
                    </span>
                    <span className="font-medium text-[#19171D] dark:text-white">{t.title}</span>
                    <span className="block text-[#574148] dark:text-[#B9B2C3]">{t.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
