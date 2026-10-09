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
    <div className="flex flex-col h-full bg-midnight overflow-y-auto p-4 sm:p-6 max-w-lg mx-auto w-full space-y-4 pb-24">
      {/* ── Profile Header ───────────────────────────────────────────── */}
      <div className="rasta-surface p-5 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal to-emerald-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-teal/20">
            AP
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-rastaText-primary truncate">Arnav Patel</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-muted text-teal border border-teal/30">
                LEVEL 2 SCOUT
              </span>
            </div>
            <p className="text-xs text-rastaText-secondary mt-0.5 font-mono truncate">ID: RASTA-SCOUT-2026</p>
            <p className="text-[11px] text-rastaText-muted flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-teal" /> Bengaluru Urban Ward #112
            </p>
          </div>
        </div>

        {/* Civic Impact Stats Grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-surface-border text-center">
          <div className="bg-midnight/70 p-2.5 rounded-xl border border-surface-border">
            <span className="text-lg font-black text-rastaText-primary">4</span>
            <p className="text-[10px] text-rastaText-muted uppercase font-semibold mt-0.5">Logged</p>
          </div>
          <div className="bg-midnight/70 p-2.5 rounded-xl border border-surface-border">
            <span className="text-lg font-black text-emerald-400">2</span>
            <p className="text-[10px] text-rastaText-muted uppercase font-semibold mt-0.5">Verified Fixed</p>
          </div>
          <div className="bg-midnight/70 p-2.5 rounded-xl border border-surface-border">
            <span className="text-lg font-black text-teal">118</span>
            <p className="text-[10px] text-rastaText-muted uppercase font-semibold mt-0.5">Helpful Votes</p>
          </div>
        </div>
      </div>

      {/* ── Authority Workspace Quick Switch ─────────────────────────── */}
      <div className="rasta-surface p-4 space-y-2 border-teal/30 bg-gradient-to-r from-surface via-surface to-teal-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal" />
            <h3 className="text-sm font-bold text-rastaText-primary">Authority Workspace</h3>
          </div>
          <span className="text-[10px] font-mono text-teal font-semibold px-2 py-0.5 rounded bg-midnight">
            STAFF ACCESS
          </span>
        </div>
        <p className="text-xs text-rastaText-secondary leading-relaxed">
          Switch to the municipal command center to triage incoming reports, assign field crews, and audit resolution evidence.
        </p>
        <button
          onClick={onNavigateAuthority}
          className="btn-rasta-teal w-full text-xs min-h-[44px] mt-1"
        >
          Open Municipal Command Center →
        </button>
      </div>

      {/* ── Commute & Safety Preferences ────────────────────────────── */}
      <div className="rasta-surface p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-rastaText-muted">
          Sensor & Notification Settings
        </h3>

        <div className="space-y-2.5 text-xs">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-midnight/80 border border-surface-border cursor-pointer">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-teal" />
              <div>
                <p className="font-semibold text-rastaText-primary">Auto-Detect GPS on Launch</p>
                <p className="text-[10px] text-rastaText-muted">Request location only when app is open</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={gpsAutoDetect}
              onChange={e => setGpsAutoDetect(e.target.checked)}
              className="w-4 h-4 accent-teal rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-midnight/80 border border-surface-border cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-amber-400" />
              <div>
                <p className="font-semibold text-rastaText-primary">Proximity Hazard Alerts</p>
                <p className="text-[10px] text-rastaText-muted">Push alerts for critical live wires within 500m</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pushAlerts}
              onChange={e => setPushAlerts(e.target.checked)}
              className="w-4 h-4 accent-teal rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* ── Privacy & Data Handling (Blueprint Section 8) ────────────── */}
      <div className="rasta-surface p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-rastaText-muted">
          Privacy & Image Handling
        </h3>

        <div className="space-y-2.5 text-xs">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-midnight/80 border border-surface-border cursor-pointer">
            <div className="flex items-center gap-2.5">
              <EyeOff className="w-4 h-4 text-rastaText-secondary" />
              <div>
                <p className="font-semibold text-rastaText-primary">Anonymize Public Submissions</p>
                <p className="text-[10px] text-rastaText-muted">Display "Verified Citizen" instead of name</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={anonymizeReports}
              onChange={e => setAnonymizeReports(e.target.checked)}
              className="w-4 h-4 accent-teal rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-midnight/80 border border-surface-border cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-teal" />
              <div>
                <p className="font-semibold text-rastaText-primary">Strip Image EXIF Metadata</p>
                <p className="text-[10px] text-rastaText-muted">Removes camera device serial & private tags</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={stripExif}
              onChange={e => setStripExif(e.target.checked)}
              className="w-4 h-4 accent-teal rounded cursor-pointer"
            />
          </label>
        </div>

        <button
          onClick={handleClearCache}
          className="w-full p-2.5 rounded-xl bg-midnight border border-surface-border hover:border-rose-900/50 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{cacheCleared ? 'Offline Cache Cleared ✅' : 'Reset Local Incident Cache'}</span>
        </button>
      </div>

      {/* ── Version & Attribution ────────────────────────────────────── */}
      <div className="text-center pt-2 space-y-1">
        <p className="text-xs font-bold text-rastaText-secondary">RASTA v2.4 · Protothon 2026</p>
        <p className="text-[11px] text-rastaText-muted">
          Built by Team Obsidian · Open Government Safety Protocol
        </p>
      </div>
    </div>
  )
}
