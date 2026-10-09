import React, { useState, useEffect } from 'react'
import { ArrowLeft, Clock, CheckCircle2, ShieldCheck, FileText, ChevronRight, AlertTriangle } from 'lucide-react'
import { hazardStore } from '../lib/hazardStore.js'
import { getCategory, getSeverity, getStatus } from '../lib/hazardTypes.js'

export default function TrackReportsPage({ onBack, onNavigateReport }) {
  const [reports, setReports] = useState([])

  useEffect(() => {
    setReports(hazardStore.getMyReports())
  }, [])

  return (
    <div className="flex flex-col h-full bg-midnight overflow-y-auto p-4 sm:p-5 max-w-lg mx-auto w-full space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-surface-border">
        <button onClick={onBack} className="p-2 -ml-1 text-rastaText-secondary hover:text-white rounded-lg cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-mono font-bold text-teal">CITIZEN STATUS TRACKER</span>
        <div className="w-5" />
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-black text-rastaText-primary">My Hazard Reports</h2>
        <p className="text-xs text-rastaText-secondary">
          Track official dispatch, field inspection updates, and photographic resolution evidence
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="rasta-surface p-8 text-center space-y-3">
          <FileText className="w-10 h-10 text-rastaText-muted mx-auto" />
          <h3 className="text-sm font-bold text-rastaText-primary">No Reports Logged Yet</h3>
          <p className="text-xs text-rastaText-secondary">Incidents you submit from this device will appear here.</p>
          <button
            onClick={onNavigateReport}
            className="btn-rasta-primary py-2.5 text-xs mx-auto"
          >
            Report Your First Hazard
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {reports.map(item => {
            const cat = getCategory(item.category)
            const sev = getSeverity(item.severity)
            const st  = getStatus(item.status)

            return (
              <div key={item.id} className="rasta-surface p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{cat.emoji}</span>
                    <div>
                      <span className="text-[10px] font-mono text-teal font-semibold">{item.id}</span>
                      <h4 className="text-xs font-bold text-rastaText-primary">{item.title}</h4>
                    </div>
                  </div>
                  <span className={st.badgeClass}>{st.label}</span>
                </div>

                <p className="text-xs text-rastaText-secondary line-clamp-2">
                  {item.description}
                </p>

                {/* Evidence and Resolution Before / After */}
                {item.evidence_url ? (
                  <div className="grid grid-cols-2 gap-2 bg-midnight p-2.5 rounded-xl border border-surface-border">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-rastaText-muted uppercase">Your Initial Report</span>
                      <img src={item.photo_url} alt="Before" className="w-full h-16 object-cover rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase">Audited Resolution</span>
                      <img src={item.evidence_url} alt="After" className="w-full h-16 object-cover rounded-lg" />
                    </div>
                  </div>
                ) : item.photo_url && (
                  <div className="w-full h-24 rounded-xl overflow-hidden border border-surface-border">
                    <img src={item.photo_url} alt="Reported" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Chronological Audit Trail (Blueprint Section 6 & 8) */}
                {item.history && item.history.length > 0 && (
                  <div className="bg-midnight p-3 rounded-xl border border-surface-border space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rastaText-muted block">
                      Official Timeline
                    </span>
                    <div className="space-y-2">
                      {item.history.map((h, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-teal mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="text-rastaText-primary font-semibold">{h.actor || 'Authority'}</span>
                              <span className="text-[9px] text-rastaText-muted font-mono">
                                {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className="text-rastaText-secondary text-[11px] block mt-0.5">{h.note}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
