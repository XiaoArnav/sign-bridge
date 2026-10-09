import React from 'react'
import { Bell, AlertTriangle, ShieldCheck, CloudRain, Clock, ChevronRight, ExternalLink } from 'lucide-react'
import { hazardStore } from '../lib/hazardStore.js'

export default function AlertsPage({ onSelectIncident }) {
  const alerts = hazardStore.getAlerts()

  return (
    <div className="flex flex-col h-full bg-[#F5F5F7] overflow-y-auto px-4 py-6 sm:px-6 max-w-lg mx-auto w-full space-y-5 pb-28">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="pb-3 border-b border-[#E5E5EA]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
            <Bell className="w-4.5 h-4.5" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">Safety Alerts</h2>
        </div>
        <p className="text-xs text-[#6E6E73] mt-1.5 leading-relaxed">
          Geo-targeted notifications for active hazards along commute corridors.
        </p>
      </div>

      {/* ── iOS Notification Center Cards ───────────────────────────── */}
      <div className="space-y-3">
        {alerts.map(alert => {
          const isCritical = alert.type === 'critical'
          const isVerified = alert.type === 'verified'

          return (
            <div
              key={alert.id}
              onClick={() => onSelectIncident && onSelectIncident(alert.incidentId)}
              className={`bg-white p-4.5 rounded-2xl border border-[#E5E5EA] shadow-apple-sm space-y-2.5 cursor-pointer hover:border-[#D2D2D7] active:scale-[0.99] transition-all group ${
                isCritical ? 'border-l-4 border-l-[#FF3B30]' : isVerified ? 'border-l-4 border-l-[#34C759]' : 'border-l-4 border-l-[#0071E3]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {isCritical ? (
                    <div className="w-7 h-7 rounded-lg bg-[#FFECEB] text-[#FF3B30] flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  ) : isVerified ? (
                    <div className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#34C759] flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center flex-shrink-0">
                      <CloudRain className="w-4 h-4" />
                    </div>
                  )}
                  <h3 className="text-sm font-semibold text-[#1D1D1F] leading-snug">
                    {alert.title}
                  </h3>
                </div>
                <span className="text-[10px] text-[#86868B] font-medium flex-shrink-0">
                  {alert.time}
                </span>
              </div>

              <p className="text-xs text-[#6E6E73] leading-relaxed">
                {alert.description}
              </p>

              <div className="flex items-center justify-between pt-2.5 border-t border-[#E5E5EA] text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#0071E3] font-semibold">Incident #{alert.incidentId}</span>
                  {alert.isDemo ? (
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF4E5] text-[#C96E00] uppercase">
                      Demo
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F8EE] text-[#248A3D] uppercase">
                      Live
                    </span>
                  )}
                </div>
                <span className="text-[#0071E3] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Inspect Incident <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5EA] text-center shadow-apple-sm">
        <p className="text-[11px] text-[#86868B] leading-relaxed">
          Alerts are synthesized from verified citizen reports, NDMA SACHET advisories, and municipal dispatches.
        </p>
      </div>
    </div>
  )
}
