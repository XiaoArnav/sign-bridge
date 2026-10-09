import React from 'react'
import { Bell, AlertTriangle, ShieldCheck, CloudRain, Clock, ChevronRight, ExternalLink } from 'lucide-react'
import { hazardStore } from '../lib/hazardStore.js'

export default function AlertsPage({ onSelectIncident }) {
  const alerts = hazardStore.getAlerts()

  return (
    <div className="flex flex-col h-full bg-midnight overflow-y-auto p-4 max-w-lg mx-auto w-full space-y-4 pb-24">
      <div className="pb-2 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal" />
          <h2 className="text-lg font-black text-rastaText-primary">Commuter Safety Alerts</h2>
        </div>
        <p className="text-xs text-rastaText-secondary mt-0.5">
          Geo-targeted notifications for active hazards within your commute radius
        </p>
      </div>

      <div className="space-y-3">
        {alerts.map(alert => {
          const isCritical = alert.type === 'critical'
          const isVerified = alert.type === 'verified'

          return (
            <div
              key={alert.id}
              onClick={() => onSelectIncident && onSelectIncident(alert.incidentId)}
              className={`rasta-surface-interactive p-4 space-y-2 cursor-pointer ${
                isCritical ? 'border-rose-900/60 bg-gradient-to-r from-rose-950/20 to-surface' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isCritical ? (
                    <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  ) : isVerified ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <CloudRain className="w-5 h-5 text-sky-400 flex-shrink-0" />
                  )}
                  <h3 className="text-sm font-bold text-rastaText-primary leading-tight">
                    {alert.title}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-rastaText-muted flex-shrink-0">
                  {alert.time}
                </span>
              </div>

              <p className="text-xs text-rastaText-secondary leading-relaxed">
                {alert.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-surface-border/60 text-[11px]">
                <span className="font-mono text-teal font-semibold">Incident #{alert.incidentId}</span>
                <span className="text-rastaText-muted flex items-center gap-1 group-hover:text-teal">
                  Inspect Incident <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border text-center">
        <p className="text-[11px] text-rastaText-muted">
          Alerts are generated from verified citizen reports, NDMA SACHET advisories, and municipal dispatches.
        </p>
      </div>
    </div>
  )
}
