import React, { useState } from 'react';
import { Accessibility, Box, Bus, Clock, Map, MapPin, Navigation } from 'lucide-react';
import { CAMPUS_BUILDINGS, SHUTTLE_ROUTES } from '../data/seedData';
import { CampusThreeCanvas } from './CampusThreeCanvas';
import { StatusBadge } from './StatusChip';

export function CampusMobilityModule() {
  const [originId, setOriginId] = useState('westquad');
  const [destId, setDestId] = useState('innovation');
  const [stepFreeOnly, setStepFreeOnly] = useState(true);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const origin = CAMPUS_BUILDINGS.find((b) => b.id === originId) || CAMPUS_BUILDINGS[4];
  const dest = CAMPUS_BUILDINGS.find((b) => b.id === destId) || CAMPUS_BUILDINGS[1];

  const dx = dest.x - origin.x;
  const dy = dest.y - origin.y;
  const distanceMeters = Math.max(80, Math.round(Math.hypot(dx, dy) * 8.5));
  const walkMinutes = Math.max(1, Math.round(distanceMeters / (stepFreeOnly ? 68 : 80)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#19171D] dark:text-white">
            Campus Mobility & Accessibility Navigation
          </h1>
          <p className="text-sm text-[#574148] dark:text-[#C5BECF]">
            Step-free accessible route planning, elevator readiness, 3D building inspection, and shuttle loop ETAs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D]">
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                viewMode === '2d'
                  ? 'bg-[#19171D] dark:bg-[#E84D96] text-white'
                  : 'text-[#574148] dark:text-[#C5BECF]'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              2D Route Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                viewMode === '3d'
                  ? 'bg-[#19171D] dark:bg-[#E84D96] text-white'
                  : 'text-[#574148] dark:text-[#C5BECF]'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              3D Campus View
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStepFreeOnly((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              stepFreeOnly
                ? 'bg-[#27866D] text-white border-[#27866D]'
                : 'bg-white dark:bg-[#1E1B24] text-[#302B35] dark:text-[#E2DCE7] border-[#E8E4E9] dark:border-[#342E3D]'
            }`}
          >
            <Accessibility className="w-4 h-4" />
            Step-Free & Elevator Routes: {stepFreeOnly ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Spatial Campus Map */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Origin
              </label>
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm bg-white dark:bg-[#141218]"
              >
                {CAMPUS_BUILDINGS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#302B35] dark:text-[#D5CFDC] mb-1">
                Destination
              </label>
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-sm bg-white dark:bg-[#141218]"
              >
                {CAMPUS_BUILDINGS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {viewMode === '3d' ? (
            <div className="h-[320px] rounded-xl overflow-hidden border border-[#E8E4E9] dark:border-[#342E3D]">
              <CampusThreeCanvas
                activeBuilding={destId}
                onSelectBuilding={setDestId}
                showHudOverlay
              />
            </div>
          ) : (
            <div className="relative rounded-xl border border-[#E8E4E9] dark:border-[#342E3D] bg-[#F8F6F7] dark:bg-[#141218] overflow-hidden">
              <svg viewBox="0 0 100 90" className="w-full h-[320px]">
                <defs>
                  <pattern id="campus-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity="0.12"
                      strokeWidth="0.4"
                    />
                  </pattern>
                </defs>
                <rect width="100" height="90" fill="url(#campus-grid)" />

                <path
                  d={`M ${origin.x} ${origin.y} Q ${(origin.x + dest.x) / 2} ${
                    stepFreeOnly ? Math.min(origin.y, dest.y) - 6 : (origin.y + dest.y) / 2
                  } ${dest.x} ${dest.y}`}
                  fill="none"
                  stroke={stepFreeOnly ? '#27866D' : '#E84D96'}
                  strokeWidth="1.6"
                  strokeDasharray="2.5 1.8"
                />

                {CAMPUS_BUILDINGS.map((b) => {
                  const isOrigin = b.id === originId;
                  const isDest = b.id === destId;
                  return (
                    <g key={b.id} onClick={() => setDestId(b.id)} className="cursor-pointer">
                      <circle
                        cx={b.x}
                        cy={b.y}
                        r={isDest || isOrigin ? 4.4 : 3.2}
                        fill={isDest ? '#E84D96' : isOrigin ? '#19171D' : '#FFFFFF'}
                        stroke={isDest ? '#FFFFFF' : '#E84D96'}
                        strokeWidth="1"
                      />
                      <text
                        x={b.x}
                        y={b.y + 8}
                        textAnchor="middle"
                        fontSize="3.2"
                        fontWeight="600"
                        fill="currentColor"
                      >
                        {b.code} · {b.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Route Summary Strip */}
          <div className="p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5 text-[#E84D96]" />
              <div>
                <p className="text-sm font-semibold text-[#19171D] dark:text-white">
                  {origin.code} → {dest.code} (
                  {stepFreeOnly ? 'Step-Free Ramp & Elevator Path' : 'Direct Walkway'})
                </p>
                <p className="text-xs text-[#574148] dark:text-[#C5BECF]">
                  Destination services: {dest.services.join(' · ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5 text-xs">
              <div>
                <span className="text-[#77727D] dark:text-[#A19BA8] block">Distance</span>
                <span className="font-mono-num font-bold text-[#19171D] dark:text-white">
                  {distanceMeters} m
                </span>
              </div>
              <div>
                <span className="text-[#77727D] dark:text-[#A19BA8] block">Elevators</span>
                <span className="font-mono-num font-bold text-[#19171D] dark:text-white">
                  {dest.elevators} Active
                </span>
              </div>
              <div>
                <span className="text-[#77727D] dark:text-[#A19BA8] block">Est. Time</span>
                <span className="font-mono-num font-bold text-[#27866D] dark:text-[#6EE7B7]">
                  {walkMinutes} min
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Shuttle Loop Tracker */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Bus className="w-5 h-5 text-[#E84D96]" />
              <h2 className="text-base font-bold text-[#19171D] dark:text-white">
                Campus Shuttle Loops
              </h2>
            </div>

            {SHUTTLE_ROUTES.map((route) => (
              <div
                key={route.id}
                className="p-4 rounded-xl bg-[#F8F6F7] dark:bg-[#25212C] border border-[#E8E4E9] dark:border-[#342E3D] space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#19171D] dark:text-white">
                    {route.name}
                  </span>
                  <StatusBadge label={`ETA ${route.etaMinutes}m`} tone="green" />
                </div>
                <p className="text-xs text-[#574148] dark:text-[#C5BECF] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#E84D96]" />
                  Next Stop: {route.nextStop}
                </p>
                <p className="text-[11px] text-[#77727D] dark:text-[#A19BA8]">
                  {route.stops.join(' → ')}
                </p>
                <div className="flex items-center justify-between text-[11px] pt-1 text-[#302B35] dark:text-[#D5CFDC]">
                  <span className="inline-flex items-center gap-1">
                    <Accessibility className="w-3.5 h-3.5 text-[#27866D]" />
                    Low-floor ramp
                  </span>
                  <span className="font-mono-num inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Load {route.capacityPct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
