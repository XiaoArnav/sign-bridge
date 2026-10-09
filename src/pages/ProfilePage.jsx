import React, { useState } from 'react'
import { User, Shield, ShieldCheck, MapPin, Bell, Eye, EyeOff, Trash2, Award, CheckCircle2, ChevronRight, Smartphone, ExternalLink } from 'lucide-react'

export default function ProfilePage({ onNavigateAuthority, onNavigateReports }) {
  const [gpsAutoDetect, setGpsAutoDetect] = useState(true)
  const [pushAlerts, setPushAlerts] = useState(true)
  const [anonymizeReports, setAnonymizeReports] = useState(false)
  const [stripExif, setStripExif] = useState(true)
  const [cacheCleared, setCacheCleared] = useState(false)

  const handleClearCache = () => {
    setCacheCleared(true)
    setTimeout(() => setCacheCleared(false), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F5F7] overflow-y-auto px-4 py-6 sm:px-6 max-w-lg mx-auto w-full space-y-5 pb-28 text-[#1D1D1F]">
      {/* ── Profile Header ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-apple-sm p-5 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center font-semibold text-lg flex-shrink-0">
            AP
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#1D1D1F] truncate">Arnav Patel</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3]">
                Level 2 Scout
              </span>
            </div>
            <p className="text-xs text-[#6E6E73] mt-0.5 font-mono truncate">ID: RASTA-SCOUT-2026</p>
            <p className="text-[11px] text-[#86868B] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#0071E3]" /> Bengaluru Urban Ward #112
            </p>
          </div>
        </div>

        {/* Civic Impact Stats Grid */}
        <div className="grid grid-cols-3 divide-x divide-[#E5E5EA] pt-3 border-t border-[#E5E5EA] text-center">
          <div className="pr-2">
            <span className="text-xl font-semibold text-[#1D1D1F] block">4</span>
            <span className="text-[10px] text-[#86868B] uppercase font-medium mt-0.5 block">Logged</span>
          </div>
          <div className="px-2">
            <span className="text-xl font-semibold text-[#34C759] block">2</span>
            <span className="text-[10px] text-[#86868B] uppercase font-medium mt-0.5 block">Verified Fixed</span>
          </div>
          <div className="pl-2">
            <span className="text-xl font-semibold text-[#0071E3] block">118</span>
            <span className="text-[10px] text-[#86868B] uppercase font-medium mt-0.5 block">Helpful Votes</span>
          </div>
        </div>
      </div>

      {/* ── Authority Workspace Quick Switch ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-apple-sm p-4.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0071E3]" />
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Authority Workspace</h3>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F5F5F7] text-[#6E6E73]">
            STAFF ACCESS
          </span>
        </div>
        <p className="text-xs text-[#6E6E73] leading-relaxed">
          Switch to the municipal command center to triage incoming reports, assign field crews, and audit resolution proof.
        </p>
        <button
          onClick={onNavigateAuthority}
          className="w-full py-2.5 px-4 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-apple transition-colors cursor-pointer min-h-[44px]"
        >
          Open Municipal Command Center →
        </button>
      </div>

      {/* ── Sensor & Notification Settings (iOS Grouped Table) ──────── */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868B] px-1">
          Sensor & Notifications
        </h3>

        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-apple-sm divide-y divide-[#E5E5EA] overflow-hidden text-xs">
          <label className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#FBFBFD] transition-colors">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#0071E3]" />
              <div>
                <p className="font-medium text-[#1D1D1F]">Auto-Detect GPS on Launch</p>
                <p className="text-[10px] text-[#86868B]">Request location only when app is active</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={gpsAutoDetect}
              onChange={e => setGpsAutoDetect(e.target.checked)}
              className="w-4.5 h-4.5 accent-[#0071E3] rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#FBFBFD] transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-[#FF9500]" />
              <div>
                <p className="font-medium text-[#1D1D1F]">Proximity Hazard Alerts</p>
                <p className="text-[10px] text-[#86868B]">Push alerts for critical live wires within 500m</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pushAlerts}
              onChange={e => setPushAlerts(e.target.checked)}
              className="w-4.5 h-4.5 accent-[#0071E3] rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* ── Privacy & Image Handling (iOS Grouped Table) ─────────────── */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868B] px-1">
          Privacy & Image Handling
        </h3>

        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-apple-sm divide-y divide-[#E5E5EA] overflow-hidden text-xs">
          <label className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#FBFBFD] transition-colors">
            <div className="flex items-center gap-3">
              <EyeOff className="w-4 h-4 text-[#6E6E73]" />
              <div>
                <p className="font-medium text-[#1D1D1F]">Anonymize Public Submissions</p>
                <p className="text-[10px] text-[#86868B]">Display "Verified Citizen" instead of name</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={anonymizeReports}
              onChange={e => setAnonymizeReports(e.target.checked)}
              className="w-4.5 h-4.5 accent-[#0071E3] rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#FBFBFD] transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-[#0071E3]" />
              <div>
                <p className="font-medium text-[#1D1D1F]">Strip Image EXIF Metadata</p>
                <p className="text-[10px] text-[#86868B]">Removes camera hardware ID & personal tags</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={stripExif}
              onChange={e => setStripExif(e.target.checked)}
              className="w-4.5 h-4.5 accent-[#0071E3] rounded cursor-pointer"
            />
          </label>

          <div className="p-3">
            <button
              onClick={handleClearCache}
              className="w-full py-2 px-3 rounded-xl hover:bg-[#FFECEB] text-[#FF3B30] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{cacheCleared ? 'Offline Cache Cleared' : 'Reset Local Incident Cache'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Version & Attribution ────────────────────────────────────── */}
      <div className="text-center pt-2 space-y-1">
        <p className="text-xs font-medium text-[#6E6E73]">RASTA · Open Civic Safety Protocol</p>
        <p className="text-[11px] text-[#86868B]">
          Autonomous Municipal Road Hazard Intelligence
        </p>
      </div>
    </div>
  )
}
