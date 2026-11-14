import React, { useState } from 'react';
import {
  CalendarCheck,
  Leaf,
  Lock,
  MonitorPlay,
  Sliders,
  Thermometer,
  Users,
  Wind,
} from 'lucide-react';
import { useCampusData } from '../contexts/CampusDataContext';
import { useAuth } from '../contexts/AuthContext';
import { StatusBadge } from './StatusChip';

export function SmartClassroomModule() {
  const { user } = useAuth();
  const { classrooms, updateClassroom, pushToast } = useCampusData();
  const [selectedId, setSelectedId] = useState(classrooms[0].id);

  const active = classrooms.find((c) => c.id === selectedId) || classrooms[0];
  const occupancyPct = Math.round((active.occupancy / active.capacity) * 100);
  const isStaff = user.role === 'faculty' || user.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#19171D] dark:text-white">
            Smart Classroom Telemetry & Controls
          </h1>
          <p className="text-sm text-[#574148] dark:text-[#C5BECF]">
            Inspect simulated room occupancy, indoor air quality, lighting levels, and reserve open teaching pods.
          </p>
        </div>
        <StatusBadge label="Simulated IoT Telemetry" tone="charcoal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Room Selector List */}
        <div className="lg:col-span-4 space-y-3">
          {classrooms.map((room) => {
            const isSelected = room.id === active.id;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedId(room.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-[#1E1B24] border-[#E84D96] shadow-[0_8px_20px_rgba(232,77,150,0.08)]'
                    : 'bg-white dark:bg-[#1E1B24] border-[#E8E4E9] dark:border-[#342E3D] hover:border-[#D5D0D7]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono-num text-sm font-bold text-[#19171D] dark:text-white">
                    {room.code}
                  </span>
                  <StatusBadge
                    label={room.status}
                    tone={
                      room.status === 'available'
                        ? 'green'
                        : room.status === 'maintenance'
                          ? 'red'
                          : 'amber'
                    }
                  />
                </div>
                <p className="text-xs font-medium text-[#302B35] dark:text-[#D5CFDC]">
                  {room.building}
                </p>
                <p className="text-xs text-[#77727D] dark:text-[#A19BA8] mt-1 truncate">
                  {room.currentClass}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Room Control Deck */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#E8E4E9] dark:border-[#342E3D]">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#77727D] dark:text-[#A19BA8]">
                <span>{active.building}</span>
                <span aria-hidden="true">·</span>
                <span>{active.floor}</span>
              </div>
              <h2 className="mt-1 text-2xl font-bold text-[#19171D] dark:text-white">
                Room {active.code} — {active.currentClass}
              </h2>
              <p className="mt-1 text-xs text-[#574148] dark:text-[#C5BECF]">
                Next Window: {active.nextSlot}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isStaff && (
                <button
                  type="button"
                  onClick={() => {
                    const nextStatus =
                      active.status === 'maintenance' ? 'available' : 'maintenance';
                    updateClassroom(active.id, {
                      status: nextStatus,
                      currentClass:
                        nextStatus === 'maintenance'
                          ? 'Locked for Facilities Maintenance'
                          : 'Unscheduled — Ready for Booking',
                    });
                    pushToast(
                      nextStatus === 'maintenance'
                        ? `Room ${active.code} locked`
                        : `Room ${active.code} unlocked`,
                      'Updated via staff control.'
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-xs font-semibold text-[#19171D] dark:text-white hover:border-[#E84D96] cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-[#E84D96]" />
                  {active.status === 'maintenance' ? 'Unlock Room' : 'Maintenance Lock'}
                </button>
              )}

              <button
                type="button"
                disabled={active.status === 'maintenance'}
                onClick={() => {
                  updateClassroom(active.id, {
                    status: 'occupied',
                    currentClass: `Reserved by ${user.displayName.split(' ')[0]}`,
                  });
                  pushToast('Room slot reserved', `Booked ${active.code} for the next 60 minutes.`);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E84D96] hover:bg-[#D23C83] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <CalendarCheck className="w-4 h-4" />
                Reserve Next Slot
              </button>
            </div>
          </div>

          {/* Telemetry Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D]">
              <div className="flex items-center gap-2 text-xs text-[#77727D] dark:text-[#A19BA8] mb-1">
                <Users className="w-4 h-4 text-[#E84D96]" />
                Occupancy
              </div>
              <p className="text-2xl font-bold font-mono-num text-[#19171D] dark:text-white">
                {active.occupancy} / {active.capacity}
              </p>
              <p className="text-xs text-[#574148] dark:text-[#C5BECF] mt-0.5 font-mono-num">
                {occupancyPct}% utilized
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D]">
              <div className="flex items-center gap-2 text-xs text-[#77727D] dark:text-[#A19BA8] mb-1">
                <Thermometer className="w-4 h-4 text-[#E84D96]" />
                Ambient Temp
              </div>
              <p className="text-2xl font-bold font-mono-num text-[#19171D] dark:text-white">
                {active.temperatureC.toFixed(1)}°C
              </p>
              <p className="text-xs text-[#574148] dark:text-[#C5BECF] mt-0.5 font-mono-num">
                Target: {active.targetTempC.toFixed(1)}°C
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D]">
              <div className="flex items-center gap-2 text-xs text-[#77727D] dark:text-[#A19BA8] mb-1">
                <Wind className="w-4 h-4 text-[#27866D]" />
                CO₂ Air Quality
              </div>
              <p className="text-2xl font-bold font-mono-num text-[#19171D] dark:text-white">
                {active.co2Ppm} ppm
              </p>
              <p className="text-xs text-[#27866D] dark:text-[#6EE7B7] mt-0.5">
                {active.co2Ppm < 750 ? 'Optimal Ventilation' : 'Boost Intake Active'}
              </p>
            </div>
          </div>

          {/* Interactive Environment Controls */}
          <div className="space-y-5 pt-2">
            <h3 className="text-sm font-semibold text-[#19171D] dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#E84D96]" />
              Interactive Room Automation Controls (Simulated Session State)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="flex justify-between text-xs font-medium mb-2">
                  <span className="text-[#302B35] dark:text-[#D5CFDC]">HVAC Target Setpoint</span>
                  <span className="font-mono-num font-semibold text-[#E84D96]">
                    {active.targetTempC.toFixed(1)}°C
                  </span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={26}
                  step={0.5}
                  value={active.targetTempC}
                  onChange={(e) =>
                    updateClassroom(active.id, { targetTempC: Number(e.target.value) })
                  }
                  className="w-full accent-[#E84D96] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-2">
                  <span className="text-[#302B35] dark:text-[#D5CFDC]">LED Dimmer Level</span>
                  <span className="font-mono-num font-semibold text-[#19171D] dark:text-white">
                    {active.lightingPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={active.lightingPct}
                  onChange={(e) =>
                    updateClassroom(active.id, { lightingPct: Number(e.target.value) })
                  }
                  className="w-full accent-[#19171D] dark:accent-[#E84D96] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  const next = !active.projectorOn;
                  updateClassroom(active.id, { projectorOn: next });
                  pushToast(`Projector ${next ? 'powered on' : 'powered off'}`, active.code);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  active.projectorOn
                    ? 'bg-[#19171D] dark:bg-[#E84D96] text-white border-transparent'
                    : 'bg-white dark:bg-[#25212C] text-[#302B35] dark:text-[#E2DCE7] border-[#E8E4E9] dark:border-[#342E3D]'
                }`}
              >
                <MonitorPlay className="w-4 h-4" />
                Projector & AV: {active.projectorOn ? 'ON' : 'STANDBY'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !active.ecoMode;
                  updateClassroom(active.id, {
                    ecoMode: next,
                    lightingPct: next ? 30 : 80,
                  });
                  pushToast(`Eco Mode ${next ? 'enabled' : 'disabled'}`, active.code);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  active.ecoMode
                    ? 'bg-[#27866D] text-white border-[#27866D]'
                    : 'bg-white dark:bg-[#25212C] text-[#302B35] dark:text-[#E2DCE7] border-[#E8E4E9] dark:border-[#342E3D]'
                }`}
              >
                <Leaf className="w-4 h-4" />
                Eco Energy Profile: {active.ecoMode ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
