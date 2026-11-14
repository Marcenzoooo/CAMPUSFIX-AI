import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Flag,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserCheck,
  X,
} from 'lucide-react';
import { useCampusData } from '../contexts/CampusDataContext';
import { useAuth } from '../contexts/AuthContext';
import type { MarketplaceListing } from '../types';
import { SafeImage, StatusBadge } from './StatusChip';

const LISTING_CATEGORIES: { value: 'all' | MarketplaceListing['category']; label: string }[] = [
  { value: 'all', label: 'All Items' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'books', label: 'Textbooks' },
  { value: 'lab_gear', label: 'Lab Gear' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'cycles', label: 'Cycles' },
];

export function CampusExchangeModule() {
  const { bookmarks, toggleBookmark } = useAuth();
  const { listings, createListing, reserveListing, reportListing, reportedListingIds } =
    useCampusData();

  const [category, setCategory] = useState<'all' | MarketplaceListing['category']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MarketplaceListing | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Misleading price or condition');

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('45');
  const [itemCat, setItemCat] = useState<MarketplaceListing['category']>('books');
  const [condition, setCondition] = useState<MarketplaceListing['condition']>('like_new');
  const [description, setDescription] = useState('');

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (category !== 'all' && l.category !== category) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.sellerName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [listings, category, searchQuery]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    await createListing({
      title,
      description,
      price: Math.max(0, Number(price) || 0),
      category: itemCat,
      condition,
    });
    setTitle('');
    setDescription('');
    setShowPostModal(false);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTargetId) return;
    reportListing(reportTargetId, reportReason);
    setReportTargetId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#19171D] dark:text-white">
            Campus Exchange Marketplace
          </h1>
          <p className="text-sm text-[#574148] dark:text-[#C5BECF]">
            Verified peer-to-peer student listings for electronics, textbooks, and lab equipment.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPostModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Post Listing
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F8F6F7] dark:bg-[#25212C] rounded-lg overflow-x-auto">
          {LISTING_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                category === c.value
                  ? 'bg-white dark:bg-[#19171D] text-[#19171D] dark:text-white shadow-sm'
                  : 'text-[#574148] dark:text-[#B9B2C3] hover:text-[#19171D] dark:hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#77727D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search textbooks, MacBook, seller..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
          />
        </div>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-xl p-10 text-center">
          <ShoppingBag className="w-8 h-8 text-[#77727D] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#19171D] dark:text-white">
            No listings match your filter
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const isSaved = bookmarks.includes(item.id);
            const isFlagged = Boolean(reportedListingIds[item.id]);
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96]/60 rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-[0_10px_24px_rgba(25,23,29,0.05)]"
              >
                <div className="relative aspect-[4/3] bg-[#F8F6F7] dark:bg-[#25212C] overflow-hidden">
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    fallbackTitle={item.title}
                  />
                  <button
                    type="button"
                    onClick={() => toggleBookmark(item.id)}
                    aria-label="Toggle wishlist bookmark"
                    className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                      isSaved
                        ? 'bg-[#E84D96] text-white border-[#E84D96]'
                        : 'bg-white/95 dark:bg-[#19171D]/90 text-[#19171D] dark:text-white border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#E84D96]'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-[#77727D] dark:text-[#A19BA8] mb-2">
                      <span className="capitalize">{item.condition.replace('_', ' ')}</span>
                      <div className="flex items-center gap-1.5">
                        {isFlagged && <StatusBadge label="Flagged" tone="red" />}
                        <StatusBadge
                          label={item.status}
                          tone={item.status === 'available' ? 'green' : 'amber'}
                        />
                      </div>
                    </div>
                    <h2 className="text-base font-semibold text-[#19171D] dark:text-white line-clamp-1">
                      {item.title}
                    </h2>
                    <p className="mt-1.5 text-sm text-[#574148] dark:text-[#C5BECF] line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E8E4E9] dark:border-[#342E3D] flex items-center justify-between gap-3">
                    <div>
                      <span className="text-lg font-bold font-mono-num text-[#19171D] dark:text-white">
                        ${item.price}
                      </span>
                      <span className="block text-[11px] text-[#77727D] dark:text-[#A19BA8]">
                        Seller: {item.sellerName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="px-3.5 py-2 rounded-lg bg-[#19171D] dark:bg-[#E84D96] hover:bg-[#302B35] dark:hover:bg-[#D23C83] text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Inspect Item
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-[#19171D]/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="aspect-[16/9] bg-[#F8F6F7] dark:bg-[#25212C] relative">
              <SafeImage
                src={selectedItem.imageUrl}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
                fallbackTitle={selectedItem.title}
              />
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/95 dark:bg-[#19171D]/90 text-[#19171D] dark:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#19171D] dark:text-white">
                    {selectedItem.title}
                  </h2>
                  <p className="text-xs text-[#77727D] dark:text-[#A19BA8] mt-0.5">
                    Listed {selectedItem.createdAtLabel} · {selectedItem.condition.replace('_', ' ')}
                  </p>
                </div>
                <span className="text-2xl font-bold font-mono-num text-[#E84D96]">
                  ${selectedItem.price}
                </span>
              </div>

              <p className="text-sm text-[#302B35] dark:text-[#D5CFDC] leading-relaxed">
                {selectedItem.description}
              </p>

              {/* Verified Campus Seller Card */}
              <div className="p-3.5 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#19171D] dark:bg-[#E84D96] text-white flex items-center justify-center text-xs font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#19171D] dark:text-white">
                      {selectedItem.sellerName}
                    </p>
                    <p className="text-[11px] text-[#27866D] dark:text-[#6EE7B7] inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified Campus Member · Quad Pickup
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReportTargetId(selectedItem.id)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#77727D] hover:text-[#C95765] cursor-pointer"
                >
                  <Flag className="w-3 h-3" />
                  Report
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm font-medium text-[#302B35] dark:text-[#E2DCE7] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={selectedItem.status !== 'available'}
                  onClick={async () => {
                    await reserveListing(selectedItem.id);
                    setSelectedItem({ ...selectedItem, status: 'reserved' });
                  }}
                  className="px-5 py-2 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-medium disabled:opacity-50 cursor-pointer"
                >
                  {selectedItem.status === 'available' ? 'Reserve for Campus Pickup' : 'Reserved'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Listing Modal */}
      {reportTargetId && (
        <div className="fixed inset-0 z-50 bg-[#19171D]/55 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleReportSubmit}
            className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#19171D] dark:text-white">
                Flag Listing for Review
              </h3>
              <button
                type="button"
                onClick={() => setReportTargetId(null)}
                className="p-1 rounded-lg hover:bg-[#F8F6F7] dark:hover:bg-[#292431] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Safety / Policy Reason
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm"
              >
                <option value="Misleading price or condition">Misleading price or condition</option>
                <option value="Prohibited campus item">Prohibited campus item</option>
                <option value="Duplicate or spam post">Duplicate or spam post</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportTargetId(null)}
                className="px-3.5 py-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#C95765] text-white text-xs font-semibold cursor-pointer"
              >
                Submit Flag
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Post Listing Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-[#19171D]/55 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handlePost}
            className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#19171D] dark:text-white">
                Post Marketplace Item
              </h2>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#F8F6F7] dark:hover:bg-[#292431] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Item Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Raspberry Pi 5 Starter Kit"
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm font-mono-num focus:outline-none focus:border-[#E84D96]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Category
                </label>
                <select
                  value={itemCat}
                  onChange={(e) => setItemCat(e.target.value as MarketplaceListing['category'])}
                  className="w-full h-10 px-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm bg-white dark:bg-[#141218]"
                >
                  <option value="electronics">Electronics</option>
                  <option value="books">Books</option>
                  <option value="lab_gear">Lab Gear</option>
                  <option value="furniture">Furniture</option>
                  <option value="cycles">Cycles</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as MarketplaceListing['condition'])}
                  className="w-full h-10 px-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm bg-white dark:bg-[#141218]"
                >
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
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
                placeholder="Include condition notes, pickup location, and accessories..."
                className="w-full p-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#141218] text-sm focus:outline-none focus:border-[#E84D96]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="px-4 py-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-sm font-medium cursor-pointer"
              >
                Publish Listing
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
