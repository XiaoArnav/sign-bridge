import React from 'react'
import { Bell, AlertTriangle, ShieldCheck, CloudRain, Clock, ChevronRight, ExternalLink } from 'lucide-react'
import { hazardStore } from '../lib/hazardStore.js'

export default function AlertsPage({ onSelectIncident }) {
  const alerts = hazardStore.getAlerts()

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] overflow-y-auto px-4 py-8 sm:px-8 max-w-3xl sm:max-w-4xl mx-auto w-full space-y-6 pb-28 text-[#171717]">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="pb-4 border-b border-[#E7E5E0]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center border border-[#E0E7FF]">
            <Bell className="w-5 h-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">Safety Alerts</h2>
        </div>
        <p className="text-xs text-[#626262] mt-1.5 leading-relaxed">
          Geo-targeted notifications for active hazards along commute corridors synthesized from NDMA SACHET and citizen reports.
        </p>
      </div>

      {/* ── Alert Cards ──────────────────────────────────────────────── */}
      <div className="space-y-3.5">
        {alerts.map(alert => {
          const isCritical = alert.type === 'critical'
          const isVerified = alert.type === 'verified'

          return (
            <div
              key={alert.id}
              onClick={() => onSelectIncident && onSelectIncident(alert.incidentId)}
              className={`bg-white p-5 rounded-2xl border border-[#E7E5E0] shadow-sm space-y-3 cursor-pointer hover:border-[#D1CFCA] active:scale-[0.99] transition-all group ${
                isCritical
                  ? 'border-l-4 border-l-[#C62828]'
                  : isVerified
                  ? 'border-l-4 border-l-[#15803D]'
                  : 'border-l-4 border-l-[#4F46E5]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {isCritical ? (
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#C62828] border border-rose-200 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  ) : isVerified ? (
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#15803D] border border-emerald-200 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF] flex items-center justify-center flex-shrink-0">
                      <CloudRain className="w-4 h-4" />
                    </div>
                  )}
                  <h3 className="text-sm font-bold text-[#171717] leading-snug">
                    {alert.title}
                  </h3>
                </div>
                <span className="text-[10px] text-[#858585] font-medium flex-shrink-0">
                  {alert.time}
                </span>
              </div>

              <p className="text-xs text-[#626262] leading-relaxed">
                {alert.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-[#E7E5E0] text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#4F46E5] font-bold">Incident #{alert.incidentId}</span>
                  {alert.isDemo ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-[#B7791F] border border-amber-200 uppercase">
                      Demo
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0F8B72] border border-emerald-200 uppercase">
                      Live
                    </span>
                  )}
                </div>
                <span className="text-[#4F46E5] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Inspect Incident <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 rounded-2xl bg-[#F3F3F0] border border-[#E7E5E0] text-center">
        <p className="text-[11px] text-[#858585] leading-relaxed">
          Alerts are synthesized from verified citizen reports, NDMA SACHET advisories, and municipal dispatches.
        </p>
      </div>
    </div>
  )
}
