import React from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Flag,
  Lock,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCampusData } from '../contexts/CampusDataContext';
import { StatusBadge } from './StatusChip';

export function AdminConsoleModule() {
  const { user, firebaseUser, switchPreviewRole } = useAuth();
  const {
    complaints,
    classrooms,
    notices,
    listings,
    directoryUsers,
    reportedListingIds,
    activityFeed,
    updateComplaintStatus,
  } = useCampusData();

  const isPrivileged = user.role === 'admin' || user.role === 'faculty';

  const openCount = complaints.filter((c) => c.status === 'open').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
  const totalCount = Math.max(complaints.length, 1);

  const flaggedEntries = Object.entries(reportedListingIds).map(([id, reason]) => ({
    id,
    reason,
    listing: listings.find((l) => l.id === id),
  }));

  if (!isPrivileged) {
    return (
      <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4 my-8">
        <div className="w-12 h-12 rounded-2xl bg-[#F8E7EF] dark:bg-[#3A2233] text-[#E84D96] flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[#19171D] dark:text-white">
          Role-Based Access Control · Staff Console
        </h1>
        <p className="text-sm text-[#574148] dark:text-[#C5BECF]">
          Your current active role is{' '}
          <strong className="text-[#19171D] dark:text-white">{user.role}</strong>. Ticket dispatch overrides, room maintenance locks, and campus-wide analytics require Faculty or Administrator credentials.
        </p>
        {!firebaseUser && (
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => switchPreviewRole('faculty')}
              className="px-4 py-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96] text-xs font-semibold text-[#19171D] dark:text-white cursor-pointer"
            >
              Preview as Faculty
            </button>
            <button
              type="button"
              onClick={() => switchPreviewRole('admin')}
              className="px-4 py-2 rounded-lg bg-[#19171D] dark:bg-[#E84D96] hover:bg-[#302B35] text-white text-xs font-semibold cursor-pointer"
            >
              Preview as Administrator
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#19171D] dark:text-white">
              Admin & Faculty Operations Console
            </h1>
            <StatusBadge label={`Role: ${user.role}`} tone="rose" />
          </div>
          <p className="text-sm text-[#574148] dark:text-[#C5BECF]">
            Dispatch maintenance teams, audit SLA resolution metrics, review flagged items, and monitor campus directory members.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EBF5F1] dark:bg-[#163128] text-[#27866D] dark:text-[#6EE7B7] text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          RBAC Verified Session
        </div>
      </div>

      {/* Operations KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[#77727D] dark:text-[#A19BA8]">
            Resolution Rate
          </span>
          <p className="text-3xl font-bold font-mono-num text-[#19171D] dark:text-white mt-2">
            {Math.round((resolvedCount / totalCount) * 100)}%
          </p>
          <p className="text-xs text-[#27866D] dark:text-[#6EE7B7] mt-1">
            {resolvedCount} of {complaints.length} tickets closed
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[#77727D] dark:text-[#A19BA8]">
            Active Smart Rooms
          </span>
          <p className="text-3xl font-bold font-mono-num text-[#19171D] dark:text-white mt-2">
            {classrooms.length} Nodes
          </p>
          <p className="text-xs text-[#574148] dark:text-[#C5BECF] mt-1">
            {classrooms.filter((c) => c.ecoMode).length} in Eco Standby
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[#77727D] dark:text-[#A19BA8]">
            Published Circulars
          </span>
          <p className="text-3xl font-bold font-mono-num text-[#19171D] dark:text-white mt-2">
            {notices.length} Active
          </p>
          <p className="text-xs text-[#574148] dark:text-[#C5BECF] mt-1">
            Synced across Campus Connect
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[#77727D] dark:text-[#A19BA8]">
            Directory & Flags
          </span>
          <p className="text-3xl font-bold font-mono-num text-[#19171D] dark:text-white mt-2">
            {directoryUsers.length}
          </p>
          <p className="text-xs text-[#574148] dark:text-[#C5BECF] mt-1">
            {flaggedEntries.length} flagged Exchange item(s)
          </p>
        </div>
      </div>

      {/* SLA Distribution Bar Chart */}
      <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-[#19171D] dark:text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#E84D96]" />
          Incident Queue Distribution
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Open Dispatch', count: openCount, color: 'bg-[#E84D96]' },
            { label: 'In Progress', count: inProgressCount, color: 'bg-[#C58A32]' },
            { label: 'Resolved', count: resolvedCount, color: 'bg-[#27866D]' },
          ].map((row) => (
            <div key={row.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-[#302B35] dark:text-[#D5CFDC]">{row.label}</span>
                <span className="font-mono-num font-semibold text-[#19171D] dark:text-white">
                  {row.count} ({Math.round((row.count / totalCount) * 100)}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#F8F6F7] dark:bg-[#25212C] overflow-hidden">
                <div
                  className={`h-full rounded-full ${row.color}`}
                  style={{ width: `${Math.max((row.count / totalCount) * 100, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Dispatch Table */}
      <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E4E9] dark:border-[#342E3D] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#19171D] dark:text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#E84D96]" />
            Facility Escalation Queue
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E4E9] dark:border-[#342E3D] bg-[#F8F6F7] dark:bg-[#25212C] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#77727D] dark:text-[#A19BA8]">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Issue</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E9] dark:divide-[#342E3D] text-sm">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAF8FA] dark:hover:bg-[#25212C]">
                  <td className="py-3 px-4 font-mono-num text-xs font-semibold text-[#19171D] dark:text-white">
                    {c.id}
                  </td>
                  <td className="py-3 px-4 font-medium text-[#19171D] dark:text-white max-w-xs truncate">
                    {c.title}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#574148] dark:text-[#C5BECF]">
                    {c.building} {c.room || ''}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge
                      label={c.priority}
                      tone={
                        c.priority === 'critical'
                          ? 'red'
                          : c.priority === 'high'
                            ? 'amber'
                            : 'charcoal'
                      }
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {(['open', 'in_progress', 'resolved'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updateComplaintStatus(c.id, st)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer ${
                            c.status === st
                              ? 'bg-[#19171D] dark:bg-[#E84D96] text-white border-transparent'
                              : 'bg-white dark:bg-[#25212C] text-[#574148] dark:text-[#D5CFDC] border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96]'
                          }`}
                        >
                          {st === 'resolved' ? (
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Resolved
                            </span>
                          ) : (
                            st.replace('_', ' ')
                          )}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Directory Members, Moderation Flags & Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-[#19171D] dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#E84D96]" />
            Firestore Directory ({directoryUsers.length})
          </h3>
          {directoryUsers.length === 0 ? (
            <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">
              Sign in with a verified account to view live Cloud Firestore campus directory profiles.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {directoryUsers.map((u) => (
                <div
                  key={u.uid}
                  className="p-2.5 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#19171D] dark:text-white truncate">
                      {u.displayName}
                    </p>
                    <p className="text-[#77727D] dark:text-[#A19BA8] truncate">{u.department}</p>
                  </div>
                  <StatusBadge label={u.role} tone={u.role === 'admin' ? 'rose' : 'charcoal'} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-[#19171D] dark:text-white flex items-center gap-2">
            <Flag className="w-4 h-4 text-[#E84D96]" />
            Exchange Safety Flags ({flaggedEntries.length})
          </h3>
          {flaggedEntries.length === 0 ? (
            <p className="text-xs text-[#77727D] dark:text-[#A19BA8]">
              No Exchange listings are currently flagged for moderation.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {flaggedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-2.5 rounded-xl bg-[#FBEBED] dark:bg-[#3A1B22] text-xs space-y-0.5"
                >
                  <p className="font-semibold text-[#93000A] dark:text-[#FF9AA6]">
                    {entry.listing?.title || entry.id}
                  </p>
                  <p className="text-[#574148] dark:text-[#FFD6E6]">{entry.reason}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-[#19171D] dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#E84D96]" />
            Operations Audit Feed
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {activityFeed.slice(0, 8).map((ev) => (
              <div
                key={ev.id}
                className="p-2.5 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] text-xs space-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#19171D] dark:text-white truncate">
                    {ev.title}
                  </span>
                  <span className="text-[11px] font-mono-num text-[#77727D] shrink-0">
                    {ev.timeLabel}
                  </span>
                </div>
                <p className="text-[#574148] dark:text-[#B9B2C3] truncate">{ev.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
