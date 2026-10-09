import React from 'react'
import { PlusCircle, Map, FileText, Bell, AlertTriangle, ShieldCheck, ChevronRight, Navigation, Sparkles } from 'lucide-react'
import { hazardStore } from '../lib/hazardStore.js'
import { getActiveConnectorsCount } from '../lib/ingestionEngine.js'

export default function CitizenHome({ onNavigate }) {
  const stats = hazardStore.getStats()
  const myReports = hazardStore.getMyReports()
  const activeCount = getActiveConnectorsCount()

  return (
    <div className="flex flex-col h-full bg-midnight overflow-y-auto p-4 sm:p-6 max-w-xl mx-auto w-full space-y-5 pb-24">
      {/* ── Brand Hero Card (Blueprint Section 2 & 8) ────────────────── */}
      <div className="rasta-surface p-5 sm:p-6 relative overflow-hidden bg-gradient-to-br from-surface via-surface to-midnight border-surface-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-rastaText-primary">RASTA</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-teal-muted text-teal border border-teal/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" /> LIVE
              </span>
            </div>
            <p className="text-xs text-rastaText-secondary mt-1">Public Road Safety · Autonomous Civic Intelligence</p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-surface-border">
          <div className="bg-midnight/70 p-3.5 rounded-xl border border-surface-border">
            <span className="text-2xl sm:text-3xl font-black text-rastaText-primary">{stats.open + stats.acknowledged + stats.inProgress}</span>
            <p className="text-xs text-rastaText-secondary mt-0.5 font-medium">Open hazards</p>
          </div>
          <div className="bg-midnight/70 p-3.5 rounded-xl border border-surface-border">
            <span className="text-2xl sm:text-3xl font-black text-rose-400">{stats.criticalCount}</span>
            <p className="text-xs text-rose-300/80 mt-0.5 font-medium">Critical incidents</p>
          </div>
        </div>

        {/* Live Data Ingestion Pulse Bar */}
        <div className="mt-3 pt-2.5 border-t border-surface-border/60 flex items-center justify-between text-[10px] font-mono text-rastaText-muted">
          <span className="flex items-center gap-1.5 text-teal">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{activeCount} Feeds Connected</span>
          </span>
          <span className="text-rastaText-secondary">NDMA SACHET · News RSS</span>
        </div>
      </div>

      {/* ── Primary Action: Report Hazard (<10s Goal) ──────────────────── */}
      <button
        onClick={() => onNavigate('report')}
        className="w-full text-left rasta-surface-interactive p-4 sm:p-5 group bg-gradient-to-r from-rose-950/25 to-surface border-rose-900/40 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-950/60 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rastaText-primary group-hover:text-rose-300 transition-colors">
                Report a road hazard
              </h2>
              <p className="text-xs text-rastaText-secondary mt-0.5">Photo · Location · Hazard category in &lt;10s</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-rastaText-muted group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </button>

      {/* ── Core Navigation Options ───────────────────────────────────── */}
      <div className="space-y-3">
        <button
          onClick={() => onNavigate('map')}
          className="w-full text-left rasta-surface-interactive p-4 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-surface-elevated text-teal flex items-center justify-center border border-surface-border">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rastaText-primary">Explore safety map</h3>
                <p className="text-xs text-rastaText-secondary mt-0.5">See verified hazards and live commuter warnings</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rastaText-muted group-hover:text-teal transition-colors" />
          </div>
        </button>

        <button
          onClick={() => onNavigate('track')}
          className="w-full text-left rasta-surface-interactive p-4 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-surface-elevated text-rastaText-secondary flex items-center justify-center border border-surface-border">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-rastaText-primary">Track my reports</h3>
                  {myReports.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                      {myReports.length} Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-rastaText-secondary mt-0.5">Status updates, work orders & resolution photos</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rastaText-muted group-hover:text-rastaText-primary transition-colors" />
          </div>
        </button>

        <button
          onClick={() => onNavigate('alerts')}
          className="w-full text-left rasta-surface-interactive p-4 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-surface-elevated text-amber-400 flex items-center justify-center border border-surface-border">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rastaText-primary">Commuter alerts</h3>
                <p className="text-xs text-rastaText-secondary mt-0.5">High-voltage hazards, flooding & road closures nearby</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rastaText-muted group-hover:text-amber-400 transition-colors" />
          </div>
        </button>
      </div>

      {/* ── Authority Workspace Switcher ─────────────────────────────── */}
      <div className="pt-2">
        <button
          onClick={() => onNavigate('authority')}
          className="w-full py-3 px-4 rounded-xl bg-surface border border-surface-border hover:border-teal/50 text-xs font-semibold text-rastaText-secondary hover:text-teal flex items-center justify-between transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-teal" />
            <span>Authorized Municipal Command Center</span>
          </div>
          <span className="text-[11px] font-mono text-teal font-bold">Admin Portal →</span>
        </button>
      </div>

      {/* Blueprint Compliance Disclaimer */}
      <div className="pt-2 text-center">
        <p className="text-[11px] text-rastaText-muted leading-relaxed">
          Concept preview only. Real-time incident logs are verified prior to official municipal dispatch.
        </p>
      </div>
    </div>
  )
}
