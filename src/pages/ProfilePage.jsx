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
    <div className="flex flex-col h-full bg-[#FAF9F6] overflow-y-auto px-4 py-8 sm:px-8 max-w-2xl sm:max-w-3xl mx-auto w-full space-y-6 pb-28 text-[#171717]">
      {/* ── Profile Header ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF] flex items-center justify-center font-bold text-lg flex-shrink-0">
            AP
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#171717] truncate">Arnav Patel</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]">
                Level 2 Scout
              </span>
            </div>
            <p className="text-xs text-[#626262] mt-0.5 font-mono truncate">ID: RASTA-SCOUT-2026</p>
            <p className="text-[11px] text-[#858585] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#4F46E5]" /> Bengaluru Urban Ward #112
            </p>
          </div>
        </div>

        {/* Civic Impact Stats Grid */}
        <div className="grid grid-cols-3 divide-x divide-[#E7E5E0] pt-4 border-t border-[#E7E5E0] text-center">
          <div className="pr-2">
            <span className="text-xl font-black text-[#171717] block">4</span>
            <span className="text-[10px] text-[#858585] uppercase font-bold mt-0.5 block tracking-wider">Logged</span>
          </div>
          <div className="px-2">
            <span className="text-xl font-black text-[#15803D] block">2</span>
            <span className="text-[10px] text-[#858585] uppercase font-bold mt-0.5 block tracking-wider">Verified Fixed</span>
          </div>
          <div className="pl-2">
            <span className="text-xl font-black text-[#4F46E5] block">118</span>
            <span className="text-[10px] text-[#858585] uppercase font-bold mt-0.5 block tracking-wider">Helpful Votes</span>
          </div>
        </div>
      </div>

      {/* ── Authority Workspace Quick Switch ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#4F46E5]" />
            <h3 className="text-sm font-bold text-[#171717]">Authority Workspace</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F3F3F0] text-[#626262] border border-[#E7E5E0]">
            MUNICIPAL STAFF
          </span>
        </div>
        <p className="text-xs text-[#626262] leading-relaxed">
          Switch to the municipal command center to triage incoming reports, assign field crews, and audit resolution proof.
        </p>
        <button
          onClick={onNavigateAuthority}
          className="w-full py-2.5 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer min-h-[44px]"
        >
          Open Municipal Command Center →
        </button>
      </div>

      {/* ── Sensor & Notification Settings (Grouped Table) ──────────── */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#858585] px-1">
          Sensor & Notifications
        </h3>

        <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-sm divide-y divide-[#E7E5E0] overflow-hidden text-xs">
          <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#FAF9F6] transition-colors">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#4F46E5]" />
              <div>
                <p className="font-semibold text-[#171717]">Auto-Detect GPS on Launch</p>
                <p className="text-[10px] text-[#858585]">Request location only when app is active</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={gpsAutoDetect}
              onChange={e => setGpsAutoDetect(e.target.checked)}
              className="w-4.5 h-4.5 accent-[#4F46E5] rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#FAF9F6] transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-[#B7791F]" />
              <div>
                <p className="font-semibold text-[#171717]">Proximity Hazard Alerts</p>
                <p className="text-[10px] text-[#858585]">Push alerts for critical live hazards within 500m</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pushAlerts}
              onChange={e => setPushAlerts(e.target.checked)}
              className="w-4.5 h-4.5 accent-[#4F46E5] rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* ── Privacy & Image Handling (Grouped Table) ─────────────────── */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#858585] px-1">
          Privacy & Image Handling
        </h3>

        <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-sm divide-y divide-[#E7E5E0] overflow-hidden text-xs">
          <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#FAF9F6] transition-colors">
            <div className="flex items-center gap-3">
              <EyeOff className="w-4 h-4 text-[#626262]" />
              <div>
                <p className="font-semibold text-[#171717]">Anonymize Public Submissions</p>
                <p className="text-[10px] text-[#858585]">Display "Verified Citizen" instead of full name</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={anonymizeReports}
              onChange={e => setAnonymizeReports(e.target.checked)}
              className="w-4.5 h-4.5 accent-[#4F46E5] rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#FAF9F6] transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-[#4F46E5]" />
              <div>
                <p className="font-semibold text-[#171717]">Strip Image EXIF Metadata</p>
                <p className="text-[10px] text-[#858585]">Removes camera hardware ID & personal tags</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={stripExif}
              onChange={e => setStripExif(e.target.checked)}
              className="w-4.5 h-4.5 accent-[#4F46E5] rounded cursor-pointer"
            />
          </label>

          <div className="p-3.5">
            <button
              onClick={handleClearCache}
              className="w-full py-2.5 px-3 rounded-xl hover:bg-rose-50 text-[#C62828] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{cacheCleared ? 'Offline Cache Cleared' : 'Reset Local Incident Cache'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Version & Attribution ────────────────────────────────────── */}
      <div className="text-center pt-2 space-y-1">
        <p className="text-xs font-semibold text-[#626262]">RASTA · Open Civic Safety Protocol</p>
        <p className="text-[11px] text-[#858585]">
          Autonomous Municipal Road Hazard Intelligence
        </p>
      </div>
    </div>
  )
}
