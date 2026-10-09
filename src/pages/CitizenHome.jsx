import React from 'react'
import { PlusCircle, Map, FileText, Bell, ShieldCheck, ChevronRight, AlertTriangle, CheckCircle2, Radio } from 'lucide-react'
import { hazardStore } from '../lib/hazardStore.js'
import { getActiveConnectorsCount } from '../lib/ingestionEngine.js'

export default function CitizenHome({ onNavigate }) {
  const stats = hazardStore.getStats()
  const myReports = hazardStore.getMyReports()
  const activeCount = getActiveConnectorsCount()

  const openCount = stats.open + stats.acknowledged + stats.inProgress

  return (
    <div className="flex flex-col h-full bg-[#F5F5F7] overflow-y-auto px-4 py-6 sm:px-6 max-w-xl mx-auto w-full space-y-6 pb-28">
      {/* ── Apple-Inspired Hero Section ─────────────────────────────── */}
      <div className="space-y-1.5 pt-1">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-[#E5E5EA] shadow-apple-sm text-[11px] font-medium text-[#1D1D1F]">
          <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
          <span>Live Civic Safety Network</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F] pt-1">
          Safer roads start here.
        </h1>
        <p className="text-sm sm:text-base text-[#6E6E73] leading-relaxed">
          Report hazards, explore verified incidents, and help your community travel safely.
        </p>
      </div>

      {/* ── Horizontal Metrics Bar with Subtle Dividers ─────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-apple p-4 sm:p-5">
        <div className="grid grid-cols-3 divide-x divide-[#E5E5EA]">
          <div className="pr-3 sm:pr-4">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] block">
              {openCount}
            </span>
            <span className="text-xs text-[#86868B] font-medium mt-0.5 block">
              Open hazards
            </span>
          </div>

          <div className="px-3 sm:px-4">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#FF3B30] block">
              {stats.criticalCount}
            </span>
            <span className="text-xs text-[#86868B] font-medium mt-0.5 block">
              Critical
            </span>
          </div>

          <div className="pl-3 sm:pl-4">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#34C759] block">
              {stats.resolvedCount}
            </span>
            <span className="text-xs text-[#86868B] font-medium mt-0.5 block">
              Resolved
            </span>
          </div>
        </div>

        {/* Live Ingestion Health Row */}
        <div className="mt-4 pt-3 border-t border-[#E5E5EA] flex items-center justify-between text-xs text-[#6E6E73]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
            <span className="font-medium text-[#1D1D1F]">{activeCount} Feeds Connected</span>
          </div>
          <span className="text-[#86868B] text-[11px]">NDMA SACHET · News RSS</span>
        </div>
      </div>

      {/* ── 3 Primary Action Cards ───────────────────────────────────── */}
      <div className="space-y-3">
        {/* 1. Primary Action: Report Hazard (Apple Blue) */}
        <button
          onClick={() => onNavigate('report')}
          className="w-full text-left bg-[#0071E3] hover:bg-[#0077ED] active:scale-[0.99] text-white p-5 rounded-2xl shadow-apple transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight text-white">
                Report a road hazard
              </h2>
              <p className="text-xs text-white/80 mt-1">
                Photo, location, and severity in under 10 seconds
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
        </button>

        {/* 2. Secondary Action: Explore Safety Map */}
        <button
          onClick={() => onNavigate('map')}
          className="w-full text-left bg-white hover:bg-[#FBFBFD] active:scale-[0.99] border border-[#E5E5EA] p-4.5 rounded-2xl shadow-apple-sm transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center flex-shrink-0">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1D1D1F]">
                Explore safety map
              </h3>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Live hazard layer, safe detours & threat scanner
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#86868B] group-hover:text-[#1D1D1F] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>

        {/* 3. Track My Reports */}
        <button
          onClick={() => onNavigate('track')}
          className="w-full text-left bg-white hover:bg-[#FBFBFD] active:scale-[0.99] border border-[#E5E5EA] p-4.5 rounded-2xl shadow-apple-sm transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#1D1D1F]">
                  Track my reports
                </h3>
                {myReports.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3]">
                    {myReports.length} Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Status timeline, field updates & verified proof
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#86868B] group-hover:text-[#1D1D1F] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>

        {/* 4. Commuter Safety Alerts */}
        <button
          onClick={() => onNavigate('alerts')}
          className="w-full text-left bg-white hover:bg-[#FBFBFD] active:scale-[0.99] border border-[#E5E5EA] p-4.5 rounded-2xl shadow-apple-sm transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FFF4E5] text-[#FF9500] flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1D1D1F]">
                Commuter safety alerts
              </h3>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                High-voltage hazards, flooding & street closures
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#86868B] group-hover:text-[#1D1D1F] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>
      </div>

      {/* ── Discrete Municipal Authority Switcher ─────────────────────── */}
      <div className="pt-2 text-center">
        <button
          onClick={() => onNavigate('authority')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6E73] hover:text-[#0071E3] transition-colors cursor-pointer py-1.5 px-3 rounded-full hover:bg-white"
        >
          <ShieldCheck className="w-4 h-4 text-[#0071E3]" />
          <span>Municipal Authority Command Center →</span>
        </button>
      </div>

      {/* Regulatory & Verification Disclaimer */}
      <div className="text-center">
        <p className="text-[11px] text-[#86868B] leading-relaxed max-w-sm mx-auto">
          Public safety preview. Incident logs are verified against official municipal dispatch and live telemetry.
        </p>
      </div>
    </div>
  )
}
