import React, { useState } from 'react';
import { Bell, CheckCheck, ChevronRight, Sparkles } from 'lucide-react';
import { useCampusData } from '../contexts/CampusDataContext';
import type { ModuleId } from '../types';

export function NotificationCenter({
  onNavigate,
}: {
  onNavigate: (id: ModuleId) => void;
}) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useCampusData();
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] bg-white dark:bg-[#1E1B24] hover:border-[#E84D96] text-[#19171D] dark:text-white transition-colors cursor-pointer"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E84D96] text-white text-[10px] font-mono-num font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 z-40 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E8E4E9] dark:border-[#342E3D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E84D96]" />
                <span className="text-xs font-bold text-[#19171D] dark:text-white">
                  Intelligent Campus Alerts
                </span>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E84D96] hover:underline cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#E8E4E9]/70 dark:divide-[#342E3D]/70">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#77727D]">
                  All campus alerts are clear.
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id);
                      onNavigate(n.module);
                      setOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left flex items-start justify-between gap-3 hover:bg-[#F8F6F7] dark:hover:bg-[#282431] transition-colors cursor-pointer ${
                      n.read ? 'opacity-65' : ''
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            n.severity === 'critical'
                              ? 'bg-[#C95765]'
                              : n.severity === 'success'
                                ? 'bg-[#27866D]'
                                : 'bg-[#E84D96]'
                          }`}
                        />
                        <p className="text-xs font-semibold text-[#19171D] dark:text-white truncate">
                          {n.title}
                        </p>
                      </div>
                      <p className="text-[11px] text-[#574148] dark:text-[#A39CA9] line-clamp-2 pl-4">
                        {n.detail}
                      </p>
                      <p className="text-[10px] font-mono-num text-[#77727D] pl-4">
                        {n.timeLabel}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#77727D] shrink-0 mt-1" />
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
