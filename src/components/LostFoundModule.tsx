import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ImagePlus,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useCampusData } from '../contexts/CampusDataContext';
import type { LostFoundItem } from '../types';
import { SafeImage, StatusBadge } from './StatusChip';

export function LostFoundModule() {
  const { lostItems, createLostItem, updateLostItemStatus, pushToast } = useCampusData();
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [claimItem, setClaimItem] = useState<LostFoundItem | null>(null);
  const [claimProof, setClaimProof] = useState('');

  const [title, setTitle] = useState('');
  const [itemType, setItemType] = useState<LostFoundItem['itemType']>('lost');
  const [category, setCategory] = useState<LostFoundItem['category']>('electronics');
  const [location, setLocation] = useState('Central Library');
  const [description, setDescription] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState('');

  const filtered = useMemo(() => {
    return lostItems.filter((item) => {
      if (typeFilter !== 'all' && item.itemType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [lostItems, typeFilter, searchQuery]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      pushToast('Image too large', 'Please select an image under 3 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImageUrl(String(reader.result || ''));
      pushToast('Photo attached for local preview');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      setFormError('Item name must be at least 2 characters.');
      return;
    }
    if (location.trim().length < 2) {
      setFormError('Location must be at least 2 characters.');
      return;
    }
    if (description.trim().length < 5) {
      setFormError('Identifying details must be at least 5 characters.');
      return;
    }
    setFormError('');
    await createLostItem({
      title,
      description,
      itemType,
      location,
      category,
      imageUrl: previewImageUrl,
    });
    setTitle('');
    setDescription('');
    setPreviewImageUrl(undefined);
    setShowReportModal(false);
  };

  const handleClaimConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimItem || claimProof.trim().length < 3) return;
    await updateLostItemStatus(claimItem.id, 'claimed');
    setClaimItem(null);
    setClaimProof('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#19171D] dark:text-white">
            Smart Lost & Found Matching
          </h1>
          <p className="text-sm text-[#574148] dark:text-[#C5BECF]">
            Automated keyword matching across campus security desks with ownership claim verification.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-medium cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Report Lost / Found Item
        </button>
      </div>

      <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F8F6F7] dark:bg-[#25212C] rounded-lg">
          {(['all', 'found', 'lost'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium capitalize cursor-pointer ${
                typeFilter === t
                  ? 'bg-white dark:bg-[#19171D] text-[#19171D] dark:text-white shadow-sm'
                  : 'text-[#574148] dark:text-[#B9B2C3] hover:text-[#19171D] dark:hover:text-white'
              }`}
            >
              {t === 'all' ? 'All Items' : t}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#77727D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search headphones, RFID, keys..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl overflow-hidden flex flex-col justify-between"
          >
            {item.imageUrl && (
              <div className="aspect-[4/3] bg-[#F8F6F7] dark:bg-[#25212C] overflow-hidden">
                <SafeImage
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  fallbackTitle={item.title}
                />
              </div>
            )}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <StatusBadge
                    label={item.itemType}
                    tone={item.itemType === 'found' ? 'green' : 'amber'}
                  />
                  <StatusBadge
                    label={item.status}
                    tone={
                      item.status === 'claimed'
                        ? 'charcoal'
                        : item.status === 'matched'
                          ? 'rose'
                          : 'amber'
                    }
                  />
                </div>
                <h2 className="text-base font-bold text-[#19171D] dark:text-white">{item.title}</h2>
                <p className="mt-1.5 text-sm text-[#574148] dark:text-[#C5BECF]">
                  {item.description}
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-[#77727D] dark:text-[#A19BA8]">
                  <MapPin className="w-3.5 h-3.5 text-[#E84D96]" />
                  <span>{item.location}</span>
                  <span>·</span>
                  <span>{item.createdAtLabel}</span>
                </div>

                {item.matchConfidence && item.matchedItemTitle && (
                  <div className="mt-3 p-3 rounded-xl bg-[#F8E7EF]/70 dark:bg-[#3A2233] text-xs text-[#3E0021] dark:text-[#FFD6E6] space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="inline-flex items-center gap-1 text-[#AD1A68] dark:text-[#FFB0CC]">
                        <Sparkles className="w-3.5 h-3.5" />
                        Smart Match Detected
                      </span>
                      <span className="font-mono-num">{item.matchConfidence}% match</span>
                    </div>
                    <p>{item.matchedItemTitle}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#E8E4E9] dark:border-[#342E3D] flex items-center justify-between gap-2">
                <span className="text-xs text-[#77727D] dark:text-[#A19BA8] truncate">
                  Desk: {item.reporterName}
                </span>
                <button
                  type="button"
                  disabled={item.status === 'claimed'}
                  onClick={() => setClaimItem(item)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                    item.status === 'claimed'
                      ? 'bg-[#EBF5F1] dark:bg-[#163128] text-[#27866D] dark:text-[#6EE7B7]'
                      : 'bg-[#19171D] dark:bg-[#E84D96] hover:bg-[#302B35] text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {item.status === 'claimed' ? 'Claimed' : 'Initiate Claim'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Claim Verification Modal */}
      {claimItem && (
        <div className="fixed inset-0 z-50 bg-[#19171D]/55 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleClaimConfirm}
            className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#E84D96]" />
                <h2 className="text-base font-bold text-[#19171D] dark:text-white">
                  Verify Ownership Claim
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setClaimItem(null)}
                className="p-1.5 rounded-lg hover:bg-[#F8F6F7] dark:hover:bg-[#292431] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#574148] dark:text-[#C5BECF]">
              Item: <strong className="text-[#19171D] dark:text-white">{claimItem.title}</strong> ({claimItem.location})
            </p>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Identifying Mark, Serial Digits, or Sticker Detail
              </label>
              <textarea
                required
                rows={3}
                value={claimProof}
                onChange={(e) => setClaimProof(e.target.value)}
                placeholder="Describe a unique detail only the owner would know..."
                className="w-full p-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setClaimItem(null)}
                className="px-4 py-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#27866D] text-white text-xs font-semibold cursor-pointer"
              >
                Confirm Claim Request
              </button>
            </div>
          </form>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-[#19171D]/55 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#19171D] dark:text-white">
                Report Lost or Found Item
              </h2>
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  setShowReportModal(false);
                }}
                className="p-1.5 rounded-lg hover:bg-[#F8F6F7] dark:hover:bg-[#292431] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {formError && (
              <div className="p-3 rounded-lg bg-[#FBEBED] dark:bg-[#3A1B22] text-[#C95765] dark:text-[#FF9AA6] text-xs font-medium">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Report Type
                </label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as LostFoundItem['itemType'])}
                  className="w-full h-10 px-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm bg-white dark:bg-[#141218]"
                >
                  <option value="lost">Lost Item</option>
                  <option value="found">Found Item</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as LostFoundItem['category'])}
                  className="w-full h-10 px-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm bg-white dark:bg-[#141218]"
                >
                  <option value="electronics">Electronics</option>
                  <option value="id_card">ID Card</option>
                  <option value="accessories">Accessories</option>
                  <option value="books">Books</option>
                  <option value="keys">Keys</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Item Name
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Silver MacBook Charger 67W"
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Location
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Identifying Details
              </label>
              <textarea
                required
                minLength={5}
                maxLength={1000}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
              />
            </div>

            <div>
              <label className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-[#D5D0D7] dark:border-[#41394D] hover:border-[#E84D96] bg-[#F8F6F7] dark:bg-[#25212C] cursor-pointer text-xs">
                <span className="inline-flex items-center gap-2 font-medium text-[#302B35] dark:text-[#E2DCE7]">
                  <ImagePlus className="w-4 h-4 text-[#E84D96]" />
                  {previewImageUrl ? 'Change item photo (local preview)' : 'Attach item photo (local preview)'}
                </span>
                <span className="text-[11px] text-[#77727D] dark:text-[#A19BA8]">Optional</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#E84D96] text-white text-sm font-medium cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
