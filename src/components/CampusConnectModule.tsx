import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, MapPin, Plus, Search, Users, X } from 'lucide-react';
import { useCampusData } from '../contexts/CampusDataContext';
import { useAuth } from '../contexts/AuthContext';
import type { CampusNotice } from '../types';
import { SafeImage, StatusBadge } from './StatusChip';

export function CampusConnectModule() {
  const { user } = useAuth();
  const { notices, createNotice, rsvpNotice } = useCampusData();

  const [filter, setFilter] = useState<'all' | CampusNotice['noticeType']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rsvpedIds, setRsvpedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('campusfix_rsvped_notices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState('');
  const [noticeType, setNoticeType] = useState<CampusNotice['noticeType']>('event');
  const [location, setLocation] = useState('Innovation Atrium');
  const [eventDate, setEventDate] = useState('Nov 24, 05:00 PM');
  const [body, setBody] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('campusfix_rsvped_notices', JSON.stringify(rsvpedIds));
    } catch {
      // ignore
    }
  }, [rsvpedIds]);

  const filtered = useMemo(
    () =>
      notices.filter((n) => {
        if (filter !== 'all' && n.noticeType !== filter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            n.title.toLowerCase().includes(q) ||
            n.body.toLowerCase().includes(q) ||
            n.organizerName.toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [notices, filter, searchQuery]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    await createNotice({ title, body, noticeType, location, eventDate });
    setTitle('');
    setBody('');
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#19171D] dark:text-white">
            Campus Connect · Notices & Events
          </h1>
          <p className="text-sm text-[#574148] dark:text-[#C5BECF]">
            Official academic circulars, technical sprints, and student community gatherings.
          </p>
        </div>
        {(user.role === 'faculty' || user.role === 'admin' || !user.isDemo) && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Post Notice / Event
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F8F6F7] dark:bg-[#25212C] rounded-lg w-fit overflow-x-auto">
          {(['all', 'event', 'academic', 'circular', 'maintenance'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === t
                  ? 'bg-white dark:bg-[#19171D] text-[#19171D] dark:text-white shadow-sm'
                  : 'text-[#574148] dark:text-[#B9B2C3] hover:text-[#19171D] dark:hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#77727D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circulars, buildathon, registrar..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((notice) => {
          const isRegistered = rsvpedIds.includes(notice.id);
          return (
            <article
              key={notice.id}
              className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              {notice.imageUrl && (
                <div className="aspect-[16/8] bg-[#F8F6F7] dark:bg-[#25212C] overflow-hidden">
                  <SafeImage
                    src={notice.imageUrl}
                    alt={notice.title}
                    className="w-full h-full object-cover"
                    fallbackTitle={notice.title}
                  />
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs text-[#77727D] dark:text-[#A19BA8]">
                      {notice.organizerName} · {notice.createdAtLabel}
                    </span>
                    <StatusBadge
                      label={notice.noticeType}
                      tone={
                        notice.noticeType === 'event'
                          ? 'rose'
                          : notice.noticeType === 'maintenance'
                            ? 'amber'
                            : 'charcoal'
                      }
                    />
                  </div>
                  <h2 className="text-lg font-bold text-[#19171D] dark:text-white">
                    {notice.title}
                  </h2>
                  <p className="mt-2 text-sm text-[#574148] dark:text-[#C5BECF] leading-relaxed">
                    {notice.body}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E8E4E9] dark:border-[#342E3D] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#574148] dark:text-[#C5BECF]">
                    {notice.eventDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#E84D96]" />
                        {notice.eventDate}
                      </span>
                    )}
                    {notice.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#E84D96]" />
                        {notice.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 font-mono-num">
                      <Users className="w-3.5 h-3.5 text-[#77727D]" />
                      {notice.rsvpCount}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isRegistered}
                    onClick={async () => {
                      await rsvpNotice(notice.id);
                      setRsvpedIds((prev) =>
                        prev.includes(notice.id) ? prev : [...prev, notice.id]
                      );
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isRegistered
                        ? 'bg-[#EBF5F1] dark:bg-[#163128] text-[#27866D] dark:text-[#6EE7B7]'
                        : 'bg-[#19171D] dark:bg-[#E84D96] hover:bg-[#302B35] text-white'
                    }`}
                  >
                    {isRegistered && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {isRegistered ? 'Registered' : 'Register / Acknowledge'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-[#19171D]/55 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#19171D] dark:text-white">
                Publish Notice or Event
              </h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-1.5 rounded-lg hover:bg-[#F8F6F7] dark:hover:bg-[#292431] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Type
                </label>
                <select
                  value={noticeType}
                  onChange={(e) => setNoticeType(e.target.value as CampusNotice['noticeType'])}
                  className="w-full h-10 px-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm bg-white dark:bg-[#141218]"
                >
                  <option value="event">Event</option>
                  <option value="academic">Academic</option>
                  <option value="circular">Circular</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Date / Time
                </label>
                <input
                  type="text"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Details
              </label>
              <textarea
                required
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#E84D96] text-white text-sm font-medium cursor-pointer"
              >
                Publish
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
