import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Building2,
  Compass,
  FolderKanban,
  LayoutDashboard,
  Megaphone,
  MonitorCheck,
  PackageSearch,
  Search,
  Shield,
  ShoppingBag,
  Trophy,
  UserCircle,
  Wrench,
  X,
} from 'lucide-react';
import { useCampusData } from '../contexts/CampusDataContext';
import { useAuth } from '../contexts/AuthContext';
import { CAMPUS_BUILDINGS } from '../data/seedData';
import type { ModuleId } from '../types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: ModuleId) => void;
}

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  category: string;
  module: ModuleId;
  icon: React.ComponentType<{ className?: string }>;
}

export function CommandPalette({ open, onClose, onNavigate }: CommandPaletteProps) {
  const { user } = useAuth();
  const { complaints, listings, notices, resources, lostItems, opportunities, classrooms } =
    useCampusData();

  const [queryText, setQueryText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setQueryText('');
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const allItems = useMemo<SearchResult[]>(() => {
    const items: SearchResult[] = [
      { id: 'mod-overview', label: 'Overview Command Center', sublabel: '3D Campus & live KPIs', category: 'Module', module: 'overview', icon: LayoutDashboard },
      { id: 'mod-mentor', label: 'Nova AI Academic Mentor', sublabel: 'Chat, PDF Q&A, study plans, quizzes', category: 'Module', module: 'mentor', icon: Bot },
      { id: 'mod-campusfix', label: 'CampusFix Dispatch', sublabel: 'Report issues & track SLAs', category: 'Module', module: 'campusfix', icon: Wrench },
      { id: 'mod-classroom', label: 'Smart Classroom Telemetry', sublabel: 'Occupancy, CO₂, HVAC & AV', category: 'Module', module: 'classroom', icon: MonitorCheck },
      { id: 'mod-exchange', label: 'Campus Exchange', sublabel: 'Peer marketplace listings', category: 'Module', module: 'exchange', icon: ShoppingBag },
      { id: 'mod-connect', label: 'Campus Connect', sublabel: 'Circulars, events & RSVPs', category: 'Module', module: 'connect', icon: Megaphone },
      { id: 'mod-vault', label: 'Academic Vault', sublabel: 'Notes, PYQs & lab manuals', category: 'Module', module: 'vault', icon: BookOpen },
      { id: 'mod-mobility', label: 'Campus Mobility', sublabel: 'Accessible paths & shuttles', category: 'Module', module: 'mobility', icon: Compass },
      { id: 'mod-lostfound', label: 'Smart Lost & Found', sublabel: 'Automated item matching', category: 'Module', module: 'lostfound', icon: PackageSearch },
      { id: 'mod-opportunities', label: 'Opportunities', sublabel: 'Hackathons, research & internships', category: 'Module', module: 'opportunities', icon: Trophy },
      { id: 'mod-workspace', label: 'Student Workspace', sublabel: 'Personal notes & bookmarks', category: 'Module', module: 'workspace', icon: FolderKanban },
      { id: 'mod-profile', label: 'Student Profile', sublabel: 'Campus ID, personalization & badges', category: 'Module', module: 'profile', icon: UserCircle },
    ];

    if (user.role === 'admin' || user.role === 'faculty') {
      items.push({
        id: 'mod-admin',
        label: 'Admin & Faculty Console',
        sublabel: 'Operations dispatch & audit log',
        category: 'Module',
        module: 'admin',
        icon: Shield,
      });
    }

    CAMPUS_BUILDINGS.forEach((b) =>
      items.push({
        id: `b-${b.id}`,
        label: `${b.name} (${b.code})`,
        sublabel: b.services.join(' · '),
        category: 'Building',
        module: 'mobility',
        icon: Building2,
      })
    );

    classrooms.forEach((r) =>
      items.push({
        id: `rm-${r.id}`,
        label: `Room ${r.code} — ${r.currentClass}`,
        sublabel: `${r.building} · ${r.status}`,
        category: 'Classroom',
        module: 'classroom',
        icon: MonitorCheck,
      })
    );

    complaints.forEach((c) =>
      items.push({
        id: `cmp-${c.id}`,
        label: `${c.id}: ${c.title}`,
        sublabel: `${c.building} · ${c.status}`,
        category: 'Ticket',
        module: 'campusfix',
        icon: Wrench,
      })
    );

    listings.forEach((l) =>
      items.push({
        id: `exc-${l.id}`,
        label: `${l.title} ($${l.price})`,
        sublabel: `${l.category} · ${l.status}`,
        category: 'Exchange',
        module: 'exchange',
        icon: ShoppingBag,
      })
    );

    resources.forEach((r) =>
      items.push({
        id: `res-${r.id}`,
        label: `${r.courseCode} · ${r.title}`,
        sublabel: `${r.resourceType} · ${r.semester}`,
        category: 'Vault',
        module: 'vault',
        icon: BookOpen,
      })
    );

    notices.forEach((n) =>
      items.push({
        id: `ntc-${n.id}`,
        label: n.title,
        sublabel: `${n.organizerName} · ${n.eventDate || n.noticeType}`,
        category: 'Notice',
        module: 'connect',
        icon: Megaphone,
      })
    );

    lostItems.forEach((lf) =>
      items.push({
        id: `lf-${lf.id}`,
        label: lf.title,
        sublabel: `${lf.itemType.toUpperCase()} · ${lf.location}`,
        category: 'Lost & Found',
        module: 'lostfound',
        icon: PackageSearch,
      })
    );

    opportunities.forEach((o) =>
      items.push({
        id: `opp-${o.id}`,
        label: o.title,
        sublabel: `${o.organization} · ${o.deadline}`,
        category: 'Opportunity',
        module: 'opportunities',
        icon: Trophy,
      })
    );

    return items;
  }, [user.role, complaints, listings, notices, resources, lostItems, opportunities, classrooms]);

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return allItems.slice(0, 12);
    return allItems
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.sublabel.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      )
      .slice(0, 14);
  }, [allItems, queryText]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#19171D]/60 backdrop-blur-xs flex items-start justify-center pt-[10vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Universal Campus Search & Command Palette"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-[#E8E4E9] dark:border-[#342E3D] flex items-center gap-3">
          <Search className="w-4 h-4 text-[#E84D96] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filtered[0]) {
                onNavigate(filtered[0].module);
                onClose();
              }
            }}
            placeholder="Search modules, tickets, rooms, courses, events, buildings..."
            className="flex-1 bg-transparent text-sm text-[#19171D] dark:text-white placeholder:text-[#77727D] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#77727D] hover:text-[#19171D] dark:hover:text-white cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[58vh] overflow-y-auto divide-y divide-[#E8E4E9]/60 dark:divide-[#342E3D]/60">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#77727D]">
              No matching campus modules or records found for “{queryText}”.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.module);
                    onClose();
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[#F8F6F7] dark:hover:bg-[#282431] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#F8E7EF] dark:bg-[#E84D96]/15 text-[#E84D96] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#19171D] dark:text-white truncate">
                        {item.label}
                      </p>
                      <p className="text-xs text-[#77727D] dark:text-[#A39CA9] truncate">
                        {item.sublabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono-num px-2 py-0.5 rounded bg-[#F8F6F7] dark:bg-[#2C2735] text-[#574148] dark:text-[#D5CFD9]">
                      {item.category}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#77727D] group-hover:text-[#E84D96]" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2.5 bg-[#F8F6F7] dark:bg-[#141218] border-t border-[#E8E4E9] dark:border-[#342E3D] flex items-center justify-between text-[11px] text-[#77727D]">
          <span>Press Enter to jump to top match · Esc to close</span>
          <span className="font-mono-num">Cmd/Ctrl + K</span>
        </div>
      </div>
    </div>
  );
}
