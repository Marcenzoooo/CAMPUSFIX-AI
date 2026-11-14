import React, { useMemo, useState } from 'react';
import { Bookmark, Download, Eye, FileText, Plus, Search, X } from 'lucide-react';
import { useCampusData } from '../contexts/CampusDataContext';
import { useAuth } from '../contexts/AuthContext';
import type { VaultResource } from '../types';
import { StatusBadge } from './StatusChip';

export function AcademicVaultModule() {
  const { bookmarks, toggleBookmark } = useAuth();
  const { resources, createResource, incrementDownload, pushToast } = useCampusData();

  const [typeFilter, setTypeFilter] = useState<'all' | VaultResource['resourceType']>('all');
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [savedOnly, setSavedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<VaultResource | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('CS-304');
  const [resourceType, setResourceType] = useState<VaultResource['resourceType']>('notes');
  const [semester, setSemester] = useState('Fall 2026');
  const [description, setDescription] = useState('');

  const semesters = useMemo(
    () => ['all', ...Array.from(new Set(resources.map((r) => r.semester)))],
    [resources]
  );

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (typeFilter !== 'all' && r.resourceType !== typeFilter) return false;
      if (semesterFilter !== 'all' && r.semester !== semesterFilter) return false;
      if (savedOnly && !bookmarks.includes(r.id)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.courseCode.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [resources, typeFilter, semesterFilter, savedOnly, bookmarks, searchQuery]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseCode.trim()) return;
    await createResource({ title, courseCode, resourceType, semester, description });
    setTitle('');
    setDescription('');
    setShowUpload(false);
  };

  const handleDownload = async (docItem: VaultResource) => {
    await incrementDownload(docItem.id);
    const content = [
      docItem.title,
      `Course: ${docItem.courseCode} | ${docItem.semester}`,
      `Uploaded by: ${docItem.uploaderName}`,
      '',
      docItem.description,
      '',
      ...docItem.previewSections.map((s) => `${s.heading}\n${s.body}\n`),
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docItem.courseCode}-${docItem.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast('Study packet downloaded', docItem.title);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#19171D] dark:text-white">
            Academic Vault · Notes, Books & PYQs
          </h1>
          <p className="text-sm text-[#574148] dark:text-[#C5BECF]">
            Verified lecture notes, past-year question papers, and lab manuals with instant document preview.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-medium cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Contribute Resource
        </button>
      </div>

      <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F8F6F7] dark:bg-[#25212C] rounded-lg overflow-x-auto">
          {[
            { value: 'all' as const, label: 'All Materials' },
            { value: 'notes' as const, label: 'Lecture Notes' },
            { value: 'pyq' as const, label: 'Past Papers (PYQ)' },
            { value: 'lab_manual' as const, label: 'Lab Manuals' },
            { value: 'book' as const, label: 'Reference Books' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setTypeFilter(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                typeFilter === tab.value
                  ? 'bg-white dark:bg-[#19171D] text-[#19171D] dark:text-white shadow-sm'
                  : 'text-[#574148] dark:text-[#B9B2C3] hover:text-[#19171D] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            aria-label="Filter by semester"
            className="h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-xs font-medium"
          >
            {semesters.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Semesters' : s}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setSavedOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
              savedOnly
                ? 'bg-[#F8E7EF] dark:bg-[#3A2233] border-[#E84D96] text-[#E84D96]'
                : 'border-[#E8E4E9] dark:border-[#342E3D] text-[#302B35] dark:text-[#D5CFDC]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" fill={savedOnly ? 'currentColor' : 'none'} />
            Saved
          </button>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#77727D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search CS-304, Raft..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-10 text-center">
          <FileText className="w-8 h-8 text-[#77727D] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#19171D] dark:text-white">
            No academic resources match your filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((res) => {
            const isSaved = bookmarks.includes(res.id);
            return (
              <div
                key={res.id}
                className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-mono-num text-xs font-bold text-[#E84D96]">
                      {res.courseCode}
                    </span>
                    <StatusBadge label={res.resourceType.replace('_', ' ')} tone="charcoal" />
                  </div>
                  <h2 className="text-base font-bold text-[#19171D] dark:text-white line-clamp-2">
                    {res.title}
                  </h2>
                  <p className="mt-2 text-sm text-[#574148] dark:text-[#C5BECF] line-clamp-3">
                    {res.description}
                  </p>
                  <div className="mt-3 text-xs text-[#77727D] dark:text-[#A19BA8]">
                    <span>{res.uploaderName}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{res.semester}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono-num">{res.downloads} downloads</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E8E4E9] dark:border-[#342E3D] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(res)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#19171D] dark:bg-[#E84D96] hover:bg-[#302B35] text-white text-xs font-medium cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview PDF
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownload(res)}
                      className="p-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96] text-[#302B35] dark:text-[#E2DCE7] cursor-pointer"
                      aria-label="Download study packet"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(res.id)}
                      className={`p-2 rounded-lg border cursor-pointer ${
                        isSaved
                          ? 'bg-[#F8E7EF] dark:bg-[#3A2233] border-[#E84D96] text-[#E84D96]'
                          : 'border-[#E8E4E9] dark:border-[#342E3D] text-[#302B35] dark:text-[#E2DCE7]'
                      }`}
                      aria-label="Bookmark resource"
                    >
                      <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Document / PDF Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-[#19171D]/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#19171D] text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-[#E84D96] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{previewDoc.title}</p>
                  <p className="text-xs text-white/70 font-mono-num">
                    {previewDoc.courseCode} · {previewDoc.pagesCount} pages · {previewDoc.semester}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-[#F8F6F7] dark:bg-[#141218] overflow-y-auto space-y-4">
              {previewDoc.previewSections.map((sec, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-6 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono-num text-[#77727D] dark:text-[#A19BA8]">
                    <span>{previewDoc.courseCode} ACADEMIC ARCHIVE</span>
                    <span>Page {idx + 1}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#19171D] dark:text-white">
                    {sec.heading}
                  </h3>
                  <p className="text-sm text-[#302B35] dark:text-[#D5CFDC] leading-relaxed">
                    {sec.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-6 py-3.5 border-t border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#1E1B24] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDownload(previewDoc)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-medium cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Study Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-[#19171D]/55 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleUpload}
            className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#19171D] dark:text-white">
                Add Academic Resource
              </h2>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
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
                placeholder="e.g. Midterm Review Packet — Operating Systems"
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  required
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Type
                </label>
                <select
                  value={resourceType}
                  onChange={(e) =>
                    setResourceType(e.target.value as VaultResource['resourceType'])
                  }
                  className="w-full h-10 px-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm bg-white dark:bg-[#141218]"
                >
                  <option value="notes">Notes</option>
                  <option value="pyq">PYQ Archive</option>
                  <option value="lab_manual">Lab Manual</option>
                  <option value="book">Reference Book</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Semester
              </label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Summary
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="px-4 py-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#E84D96] text-white text-sm font-medium cursor-pointer"
              >
                Publish Resource
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
