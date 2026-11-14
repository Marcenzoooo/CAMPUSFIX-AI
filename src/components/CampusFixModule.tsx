import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUp,
  CheckCircle2,
  ImagePlus,
  Plus,
  Search,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { useCampusData } from '../contexts/CampusDataContext';
import { useAuth } from '../contexts/AuthContext';
import type { ComplaintItem } from '../types';
import { StatusBadge } from './StatusChip';

const CATEGORIES: { value: ComplaintItem['category']; label: string }[] = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC / Thermal' },
  { value: 'network', label: 'Network / Wi-Fi' },
  { value: 'av_equipment', label: 'AV & Projectors' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'safety', label: 'Life Safety' },
];

export function CampusFixModule() {
  const { user } = useAuth();
  const { complaints, createComplaint, upvoteComplaint, updateComplaintStatus, pushToast } =
    useCampusData();

  const [statusFilter, setStatusFilter] = useState<'all' | ComplaintItem['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<ComplaintItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Staff edit state in detail modal
  const [staffTeam, setStaffTeam] = useState('');
  const [staffNotes, setStaffNotes] = useState('');

  // Create form state
  const [title, setTitle] = useState('');
  const [building, setBuilding] = useState('North Academic Block');
  const [room, setRoom] = useState('');
  const [category, setCategory] = useState<ComplaintItem['category']>('av_equipment');
  const [priority, setPriority] = useState<ComplaintItem['priority']>('medium');
  const [description, setDescription] = useState('');
  const [assignedTeam, setAssignedTeam] = useState('Campus Operations');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [evidencePreviewUrl, setEvidencePreviewUrl] = useState<string | undefined>(undefined);
  const [triaging, setTriaging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.building.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [complaints, statusFilter, searchQuery]);

  const openTicketDetail = (item: ComplaintItem) => {
    setSelectedTicket(item);
    setStaffTeam(item.assignedTeam || 'Campus Operations');
    setStaffNotes(item.resolutionNotes || '');
  };

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      pushToast('Image too large', 'Please select an image under 3 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEvidencePreviewUrl(String(reader.result || ''));
      pushToast('Photo attached for local preview', 'Stored locally in session preview.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAiTriage = async () => {
    if (!title.trim() && !description.trim()) {
      setFormError('Enter an issue title or description first so AI triage can classify it.');
      return;
    }
    setFormError('');
    setTriaging(true);
    try {
      const res = await fetch('/api/campus/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, building }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Triage failed');
      if (CATEGORIES.some((c) => c.value === data.suggestedCategory)) {
        setCategory(data.suggestedCategory);
      }
      if (['low', 'medium', 'high', 'critical'].includes(data.suggestedPriority)) {
        setPriority(data.suggestedPriority);
      }
      if (data.assignedTeam) setAssignedTeam(data.assignedTeam);
      if (data.triageNote) setAiSuggestion(`${data.triageNote} (SLA: ${data.estimatedSla || '4h'})`);
      pushToast('AI Triage applied', `Routed to ${data.assignedTeam || 'Facility Ops'}`);
    } catch (err) {
      pushToast(
        'AI Triage unavailable',
        err instanceof Error ? err.message : 'Could not reach triage service',
        'error'
      );
    } finally {
      setTriaging(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3 || description.trim().length < 5) {
      setFormError('Please provide a clear title (min 3 chars) and description (min 5 chars).');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      await createComplaint({
        title,
        description,
        category,
        building,
        room,
        priority,
        assignedTeam,
        aiSuggestion,
        evidencePreviewUrl,
      });
      setTitle('');
      setRoom('');
      setDescription('');
      setAiSuggestion('');
      setEvidencePreviewUrl(undefined);
      setShowCreateModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const statusTone = (status: ComplaintItem['status']) =>
    status === 'resolved' ? 'green' : status === 'in_progress' ? 'amber' : 'rose';

  const priorityTone = (p: ComplaintItem['priority']) =>
    p === 'critical' ? 'red' : p === 'high' ? 'amber' : 'charcoal';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#19171D] dark:text-white">
            CampusFix Issue & Incident Dispatch
          </h1>
          <p className="text-sm text-[#574148] dark:text-[#C5BECF]">
            Report facility faults, upvote urgent campus disruptions, and track resolution SLAs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Report Issue
        </button>
      </div>

      {/* Quick Incident Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tickets', count: complaints.length },
          { label: 'Open Dispatch', count: complaints.filter((c) => c.status === 'open').length },
          {
            label: 'In Progress',
            count: complaints.filter((c) => c.status === 'in_progress').length,
          },
          { label: 'Resolved', count: complaints.filter((c) => c.status === 'resolved').length },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl px-4 py-3"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77727D] dark:text-[#A19BA8]">
              {stat.label}
            </span>
            <p className="text-xl font-bold font-mono-num text-[#19171D] dark:text-white mt-0.5">
              {stat.count}
            </p>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F8F6F7] dark:bg-[#25212C] rounded-lg overflow-x-auto">
          {(['all', 'open', 'in_progress', 'resolved'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === status
                  ? 'bg-white dark:bg-[#19171D] text-[#19171D] dark:text-white shadow-sm'
                  : 'text-[#574148] dark:text-[#B9B2C3] hover:text-[#19171D] dark:hover:text-white'
              }`}
            >
              {status === 'all'
                ? 'All Tickets'
                : status === 'in_progress'
                  ? 'In Progress'
                  : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#77727D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket ID, building, issue..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm text-[#19171D] dark:text-white placeholder:text-[#77727D] focus:outline-none focus:border-[#E84D96]"
          />
        </div>
      </div>

      {/* Tickets List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-10 text-center">
          <Wrench className="w-8 h-8 text-[#77727D] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#19171D] dark:text-white">
            No matching issues found
          </p>
          <p className="text-xs text-[#77727D] dark:text-[#A19BA8] mt-1">
            Adjust your filter or submit a new campus facility ticket.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl overflow-hidden">
          <div className="divide-y divide-[#E8E4E9] dark:divide-[#342E3D]">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-[#FAF8FA] dark:hover:bg-[#25212C] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#77727D] dark:text-[#A19BA8]">
                    <span className="font-mono-num font-semibold text-[#302B35] dark:text-white">
                      {item.id}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.building}</span>
                    {item.room && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">{item.room}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{item.createdAtLabel}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openTicketDetail(item)}
                    className="text-left text-base font-semibold text-[#19171D] dark:text-white hover:text-[#E84D96] transition-colors cursor-pointer"
                  >
                    {item.title}
                  </button>
                  <p className="text-sm text-[#574148] dark:text-[#C5BECF] line-clamp-2">
                    {item.description}
                  </p>
                  {item.aiSuggestion && (
                    <p className="text-xs text-[#AD1A68] dark:text-[#FFB0CC] bg-[#F8E7EF]/60 dark:bg-[#3A2233] px-3 py-1.5 rounded-lg inline-block mt-1">
                      AI Triage: {item.aiSuggestion}
                    </p>
                  )}
                  {item.resolutionNotes && (
                    <p className="text-xs text-[#27866D] dark:text-[#6EE7B7] mt-1">
                      Staff Note: {item.resolutionNotes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <StatusBadge label={item.priority} tone={priorityTone(item.priority)} />
                  <StatusBadge
                    label={item.status.replace('_', ' ')}
                    tone={statusTone(item.status)}
                  />
                  <button
                    type="button"
                    onClick={() => upvoteComplaint(item.id)}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96] hover:bg-[#F8E7EF]/50 dark:hover:bg-[#3A2233] text-xs font-mono-num font-semibold text-[#19171D] dark:text-white transition-colors cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-[#E84D96]" />
                    {item.upvotes}
                  </button>
                  <button
                    type="button"
                    onClick={() => openTicketDetail(item)}
                    className="h-9 px-3 rounded-lg bg-[#F8F6F7] dark:bg-[#25212C] hover:bg-[#E8E4E9] dark:hover:bg-[#342E3D] text-xs font-medium text-[#19171D] dark:text-white transition-colors cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-[#19171D]/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono-num font-semibold text-[#77727D] dark:text-[#A19BA8]">
                  {selectedTicket.id} · {selectedTicket.building} {selectedTicket.room || ''}
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#19171D] dark:text-white">
                  {selectedTicket.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg hover:bg-[#F8F6F7] dark:hover:bg-[#292431] text-[#574148] dark:text-[#C5BECF] cursor-pointer"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={selectedTicket.status.replace('_', ' ')}
                tone={statusTone(selectedTicket.status)}
              />
              <StatusBadge
                label={`Priority: ${selectedTicket.priority}`}
                tone={priorityTone(selectedTicket.priority)}
              />
            </div>

            <p className="text-sm text-[#302B35] dark:text-[#D5CFDC] leading-relaxed">
              {selectedTicket.description}
            </p>

            {selectedTicket.evidencePreviewUrl && (
              <div className="rounded-xl overflow-hidden border border-[#E8E4E9] dark:border-[#342E3D]">
                <img
                  src={selectedTicket.evidencePreviewUrl}
                  alt="Attached local evidence preview"
                  className="w-full max-h-48 object-cover"
                />
                <p className="px-3 py-1.5 text-[11px] bg-[#F8F6F7] dark:bg-[#25212C] text-[#77727D] dark:text-[#A19BA8]">
                  Local session preview only (Cloud Storage not configured).
                </p>
              </div>
            )}

            <div className="bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#77727D] dark:text-[#A19BA8]">Assigned Team</span>
                <span className="font-medium text-[#19171D] dark:text-white">
                  {selectedTicket.assignedTeam || 'Campus Operations'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77727D] dark:text-[#A19BA8]">Reported By</span>
                <span className="font-medium text-[#19171D] dark:text-white">
                  {selectedTicket.authorName}
                </span>
              </div>
              {selectedTicket.resolutionNotes && (
                <div className="pt-1.5 border-t border-[#E8E4E9] dark:border-[#342E3D]">
                  <span className="text-[#77727D] dark:text-[#A19BA8] block">Resolution Notes</span>
                  <span className="font-medium text-[#27866D] dark:text-[#6EE7B7]">
                    {selectedTicket.resolutionNotes}
                  </span>
                </div>
              )}
            </div>

            {(user.role === 'admin' || user.role === 'faculty') && (
              <div className="pt-3 border-t border-[#E8E4E9] dark:border-[#342E3D] space-y-3">
                <p className="text-xs font-semibold text-[#77727D] dark:text-[#A19BA8]">
                  Staff Dispatch & Resolution Controls ({user.role})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={staffTeam}
                    onChange={(e) => setStaffTeam(e.target.value)}
                    placeholder="Assigned Team"
                    className="h-9 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-xs"
                  />
                  <input
                    type="text"
                    value={staffNotes}
                    onChange={(e) => setStaffNotes(e.target.value)}
                    placeholder="Resolution / inspection notes..."
                    className="h-9 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['open', 'in_progress', 'resolved'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={async () => {
                        await updateComplaintStatus(selectedTicket.id, st, {
                          assignedTeam: staffTeam,
                          resolutionNotes: staffNotes,
                        });
                        setSelectedTicket({
                          ...selectedTicket,
                          status: st,
                          assignedTeam: staffTeam,
                          resolutionNotes: staffNotes,
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                        selectedTicket.status === st
                          ? 'bg-[#19171D] dark:bg-[#E84D96] text-white border-transparent'
                          : 'bg-white dark:bg-[#25212C] text-[#302B35] dark:text-[#E2DCE7] border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96]'
                      }`}
                    >
                      Mark {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm font-medium text-[#19171D] dark:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#19171D]/55 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#19171D] dark:text-white">
                Report Campus Issue
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#F8F6F7] dark:hover:bg-[#292431] text-[#574148] dark:text-[#C5BECF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#FBEBED] dark:bg-[#3A1B22] text-[#C95765] dark:text-[#FF9AA6] text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Issue Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lab 2B AC cooling failure"
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Building
                </label>
                <input
                  type="text"
                  required
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Room / Zone
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. IC-204"
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC]">
                  Description
                </label>
                <button
                  type="button"
                  onClick={handleAiTriage}
                  disabled={triaging}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#E84D96] hover:text-[#D23C83] disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {triaging ? 'Analyzing...' : 'Auto-Classify with AI'}
                </button>
              </div>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe symptoms, safety impact, and exact location..."
                className="w-full p-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintItem['category'])}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm bg-white dark:bg-[#141218] focus:outline-none focus:border-[#E84D96]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ComplaintItem['priority'])}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm bg-white dark:bg-[#141218] focus:outline-none focus:border-[#E84D96]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Optional Local Photo Preview Attachment */}
            <div>
              <label className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-dashed border-[#D5D0D7] dark:border-[#41394D] hover:border-[#E84D96] bg-[#F8F6F7] dark:bg-[#25212C] cursor-pointer text-xs">
                <span className="inline-flex items-center gap-2 font-medium text-[#302B35] dark:text-[#E2DCE7]">
                  <ImagePlus className="w-4 h-4 text-[#E84D96]" />
                  {evidencePreviewUrl ? 'Change evidence photo (local preview)' : 'Attach photo evidence (local preview)'}
                </span>
                <span className="text-[11px] text-[#77727D] dark:text-[#A19BA8]">Optional</span>
                <input type="file" accept="image/*" onChange={handleEvidenceUpload} className="hidden" />
              </label>
              {evidencePreviewUrl && (
                <div className="mt-2 relative rounded-lg overflow-hidden border border-[#E8E4E9] dark:border-[#342E3D]">
                  <img
                    src={evidencePreviewUrl}
                    alt="Evidence preview"
                    className="w-full h-28 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setEvidencePreviewUrl(undefined)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-[#19171D]/80 text-white cursor-pointer"
                    aria-label="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {aiSuggestion && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[#F8E7EF] dark:bg-[#3A2233] text-[#3E0021] dark:text-[#FFD6E6] text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#E84D96] shrink-0 mt-0.5" />
                <span>{aiSuggestion}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm font-medium text-[#302B35] dark:text-[#E2DCE7] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-medium disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
