import React from 'react'
import { PlusCircle, Map, FileText, Bell, ShieldCheck, ChevronRight, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'
import { hazardStore } from '../lib/hazardStore.js'
import { getActiveConnectorsCount } from '../lib/ingestionEngine.js'

export default function CitizenHome({ onNavigate }) {
  const stats = hazardStore.getStats()
  const myReports = hazardStore.getMyReports()
  const activeCount = getActiveConnectorsCount()

  const openCount = stats.open + stats.acknowledged + stats.inProgress

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] overflow-y-auto px-6 py-10 sm:py-14 max-w-5xl mx-auto w-full space-y-10 sm:space-y-12 pb-28 text-[#171717]">
      {/* ── Sarvam-Inspired Editorial Hero Section ──────────────────── */}
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F3F0] border border-[#E7E5E0] text-xs font-medium text-[#171717]">
          <span className="w-2 h-2 rounded-full bg-[#0F8B72] animate-pulse" />
          <span>Live Civic Safety Network</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-[#171717] leading-[1.12]">
          Safer roads start here.
        </h1>

        <p className="text-base sm:text-lg text-[#626262] max-w-2xl leading-relaxed">
          Report hazards, discover road risks, and help your community travel safely.
        </p>

        {/* Primary Call to Action Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('report')}
            className="btn-sarvam-primary text-sm py-2.5 px-5 font-medium"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report a Road Hazard</span>
          </button>

          <button
            onClick={() => onNavigate('map')}
            className="btn-sarvam-secondary text-sm py-2.5 px-5 font-medium"
          >
            <Map className="w-4 h-4 text-[#626262]" />
            <span>Explore Safety Map</span>
          </button>

          <button
            onClick={() => onNavigate('track')}
            className="text-sm font-medium text-[#626262] hover:text-[#171717] transition-colors px-3 py-2 cursor-pointer flex items-center gap-1.5"
          >
            <span>Track my reports</span>
            {myReports.length > 0 && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#4F46E5]/10 text-[#4F46E5]">
                {myReports.length}
              </span>
            )}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Editorial Safety Metrics Section ────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E5E0] p-6 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E7E5E0] gap-6 sm:gap-0">
          <div className="sm:pr-8">
            <span className="text-4xl sm:text-5xl font-light tracking-tight text-[#171717] block">
              {openCount}
            </span>
            <span className="text-xs text-[#626262] font-medium uppercase tracking-wider mt-1.5 block">
              Open hazards
            </span>
            <p className="text-[11px] text-[#858585] mt-1">
              Active road surface & electrical defects
            </p>
          </div>

          <div className="pt-6 sm:pt-0 sm:px-8">
            <span className="text-4xl sm:text-5xl font-light tracking-tight text-[#C62828] block">
              {stats.criticalCount}
            </span>
            <span className="text-xs text-[#626262] font-medium uppercase tracking-wider mt-1.5 block">
              Critical incidents
            </span>
            <p className="text-[11px] text-[#858585] mt-1">
              Immediate threat to motorist or pedestrian safety
            </p>
          </div>

          <div className="pt-6 sm:pt-0 sm:pl-8">
            <span className="text-4xl sm:text-5xl font-light tracking-tight text-[#15803D] block">
              {stats.verifiedResolved}
            </span>
            <span className="text-xs text-[#626262] font-medium uppercase tracking-wider mt-1.5 block">
              Verified resolutions
            </span>
            <p className="text-[11px] text-[#858585] mt-1">
              Audited with before & after photographic evidence
            </p>
          </div>
        </div>

        {/* Live Feeds Connected Status Bar */}
        <div className="mt-6 pt-5 border-t border-[#E7E5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#626262]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0F8B72]" />
            <span className="font-medium text-[#171717]">{activeCount} Feeds Connected</span>
            <span className="text-[#858585]">· Ingestion engine actively polling</span>
          </div>
          <span className="text-[#858585] text-[11px] font-mono">
            NDMA SACHET · Verified Regional RSS Feeds
          </span>
        </div>
      </div>

      {/* ── 3 Primary Action Cards Grid (Responsive 3-Column) ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Report Road Hazard */}
        <div
          onClick={() => onNavigate('report')}
          className="bg-white rounded-2xl border border-[#E7E5E0] p-6 hover:border-[#D3D0C9] transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#171717]">
                Report a road hazard
              </h2>
              <p className="text-xs text-[#626262] mt-1 leading-relaxed">
                Photo, GPS location, and severity in under 10 seconds. Voice notes supported.
              </p>
            </div>
          </div>
          <div className="text-xs font-medium text-[#4F46E5] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform pt-2">
            <span>Start report</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 2. Explore Safety Map */}
        <div
          onClick={() => onNavigate('map')}
          className="bg-white rounded-2xl border border-[#E7E5E0] p-6 hover:border-[#D3D0C9] transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F8B72]/10 text-[#0F8B72] flex items-center justify-center">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#171717]">
                Explore safety map
              </h2>
              <p className="text-xs text-[#626262] mt-1 leading-relaxed">
                Live hazard layer, safe detour threat scanner, and browser GPS positioning.
              </p>
            </div>
          </div>
          <div className="text-xs font-medium text-[#0F8B72] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform pt-2">
            <span>Open map</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 3. Track My Reports */}
        <div
          onClick={() => onNavigate('track')}
          className="bg-white rounded-2xl border border-[#E7E5E0] p-6 hover:border-[#D3D0C9] transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3F3F0] text-[#171717] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#171717]">
                  Track my reports
                </h2>
                {myReports.length > 0 && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#4F46E5]/10 text-[#4F46E5]">
                    {myReports.length} Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#626262] mt-1 leading-relaxed">
                Official dispatch updates, field inspection timeline, and verified photo proof.
              </p>
            </div>
          </div>
          <div className="text-xs font-medium text-[#171717] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform pt-2">
            <span>View timeline</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* ── Supporting Section: Commuter Safety Alerts ──────────────── */}
      <div
        onClick={() => onNavigate('alerts')}
        className="bg-[#F3F3F0] rounded-2xl border border-[#E7E5E0] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-[#D3D0C9] transition-all group"
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white text-[#B7791F] flex items-center justify-center flex-shrink-0 border border-[#E7E5E0]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#171717]">
              Commuter safety alerts
            </h3>
            <p className="text-xs text-[#626262] mt-0.5 leading-relaxed">
              Geo-targeted warnings for high-voltage hazards, flooding & street closures along transit corridors.
            </p>
          </div>
        </div>
        <div className="text-xs font-medium text-[#171717] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform self-end sm:self-auto flex-shrink-0">
          <span>View alerts</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* ── Discreet Municipal Portal Entry ─────────────────────────── */}
      <div className="pt-2 text-center">
        <button
          onClick={() => onNavigate('authority')}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#626262] hover:text-[#4F46E5] transition-colors cursor-pointer py-2 px-4 rounded-xl hover:bg-white border border-transparent hover:border-[#E7E5E0]"
        >
          <ShieldCheck className="w-4 h-4 text-[#4F46E5]" />
          <span>Municipal Authority Command Center — Department Triage Portal →</span>
        </button>
      </div>

      {/* Regulatory & Verification Footnote */}
      <div className="text-center pt-2">
        <p className="text-[11px] text-[#858585] leading-relaxed max-w-md mx-auto">
          Public safety intelligence platform. Incident reports are corroborated with live municipal dispatch telemetry.
        </p>
      </div>
    </div>
  )
}
