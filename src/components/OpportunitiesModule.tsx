import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Briefcase,
  Calendar,
  CheckCircle2,
  Plus,
  Search,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useCampusData } from '../contexts/CampusDataContext';
import { useAuth } from '../contexts/AuthContext';
import type { OpportunityItem } from '../types';
import { SafeImage, StatusBadge } from './StatusChip';

export function OpportunitiesModule() {
  const { user, bookmarks, toggleBookmark } = useAuth();
  const { opportunities, applyOpportunity, createOpportunity } = useCampusData();

  const [typeFilter, setTypeFilter] = useState<'all' | OpportunityItem['oppType']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedIds, setAppliedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('campusfix_applied_opps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('Center for Urban Intelligence');
  const [oppType, setOppType] = useState<OpportunityItem['oppType']>('research');
  const [deadline, setDeadline] = useState('Dec 20, 2026');
  const [reward, setReward] = useState('$1,000 Stipend');
  const [description, setDescription] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('campusfix_applied_opps', JSON.stringify(appliedIds));
    } catch {
      // ignore
    }
  }, [appliedIds]);

  const filtered = useMemo(() => {
    return opportunities.filter((opp) => {
      if (typeFilter !== 'all' && opp.oppType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          opp.title.toLowerCase().includes(q) ||
          opp.organization.toLowerCase().includes(q) ||
          opp.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [opportunities, typeFilter, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    await createOpportunity({
      title,
      organization,
      oppType,
      deadline,
      reward,
      description,
    });
    setTitle('');
    setDescription('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#19171D] dark:text-white">
            Community & Opportunities
          </h1>
          <p className="text-sm text-[#574148] dark:text-[#C5BECF]">
            Campus hackathons, faculty research fellowships, internships, and service volunteering tracks.
          </p>
        </div>
        {(user.role === 'faculty' || user.role === 'admin' || !user.isDemo) && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Post Opportunity
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F8F6F7] dark:bg-[#25212C] rounded-lg overflow-x-auto">
          {(['all', 'hackathon', 'internship', 'research', 'volunteering'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize whitespace-nowrap shrink-0 cursor-pointer ${
                typeFilter === t
                  ? 'bg-white dark:bg-[#19171D] text-[#19171D] dark:text-white shadow-sm'
                  : 'text-[#574148] dark:text-[#B9B2C3] hover:text-[#19171D] dark:hover:text-white'
              }`}
            >
              {t === 'all' ? 'All Tracks' : t}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#77727D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hackathons, fellowships..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((opp) => {
          const isSaved = bookmarks.includes(opp.id);
          const hasApplied = appliedIds.includes(opp.id);
          return (
            <div
              key={opp.id}
              className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              {opp.imageUrl && (
                <div className="aspect-[16/7] bg-[#F8F6F7] dark:bg-[#25212C] overflow-hidden">
                  <SafeImage
                    src={opp.imageUrl}
                    alt={opp.title}
                    className="w-full h-full object-cover"
                    fallbackTitle={opp.title}
                  />
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-[#77727D] dark:text-[#A19BA8] flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#E84D96]" />
                      {opp.organization}
                    </span>
                    <StatusBadge
                      label={opp.oppType}
                      tone={
                        opp.oppType === 'hackathon'
                          ? 'rose'
                          : opp.oppType === 'research'
                            ? 'green'
                            : 'charcoal'
                      }
                    />
                  </div>
                  <h2 className="text-lg font-bold text-[#19171D] dark:text-white">{opp.title}</h2>
                  <p className="mt-2 text-sm text-[#574148] dark:text-[#C5BECF] leading-relaxed">
                    {opp.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#302B35] dark:text-[#D5CFDC] bg-[#F8F6F7] dark:bg-[#25212C] px-3.5 py-2.5 rounded-xl">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#E84D96]" />
                      Deadline: <strong className="font-mono-num">{opp.deadline}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-[#27866D]" />
                      {opp.reward}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono-num">
                      <Users className="w-3.5 h-3.5 text-[#77727D]" />
                      {opp.applicantCount} applied
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleBookmark(opp.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer ${
                        isSaved
                          ? 'bg-[#F8E7EF] dark:bg-[#3A2233] border-[#E84D96] text-[#E84D96]'
                          : 'border-[#E8E4E9] dark:border-[#342E3D] text-[#302B35] dark:text-[#E2DCE7]'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} />
                      {isSaved ? 'Saved' : 'Save'}
                    </button>

                    <button
                      type="button"
                      disabled={hasApplied}
                      onClick={async () => {
                        await applyOpportunity(opp.id);
                        setAppliedIds((prev) =>
                          prev.includes(opp.id) ? prev : [...prev, opp.id]
                        );
                      }}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                        hasApplied
                          ? 'bg-[#EBF5F1] dark:bg-[#163128] text-[#27866D] dark:text-[#6EE7B7]'
                          : 'bg-[#19171D] dark:bg-[#E84D96] hover:bg-[#302B35] text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {hasApplied ? 'Application Submitted' : 'Apply / Register Team'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#19171D]/55 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#19171D] dark:text-white">
                Post Campus Opportunity
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
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
                placeholder="e.g. Spring Smart Grid Systems Fellowship"
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Track
                </label>
                <select
                  value={oppType}
                  onChange={(e) => setOppType(e.target.value as OpportunityItem['oppType'])}
                  className="w-full h-10 px-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm bg-white dark:bg-[#141218]"
                >
                  <option value="hackathon">Hackathon</option>
                  <option value="research">Research</option>
                  <option value="internship">Internship</option>
                  <option value="volunteering">Volunteering</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Deadline
                </label>
                <input
                  type="text"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Organization / Lab
                </label>
                <input
                  type="text"
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Stipend / Reward
                </label>
                <input
                  type="text"
                  required
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Description
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#E84D96] text-white text-sm font-medium cursor-pointer"
              >
                Publish Opportunity
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
