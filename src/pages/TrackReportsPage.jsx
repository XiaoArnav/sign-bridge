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
    <div className="flex flex-col h-full bg-[#FAF9F6] overflow-y-auto px-4 py-8 sm:px-8 max-w-3xl sm:max-w-4xl mx-auto w-full space-y-6 pb-28 text-[#171717]">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E0]">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-[#626262] hover:text-[#171717] rounded-xl cursor-pointer transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold text-[#171717]">Citizen Status Tracker</span>
        <div className="w-5" />
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">My Hazard Reports</h2>
        <p className="text-xs text-[#626262] leading-relaxed">
          Track official dispatch, field inspection updates, and photographic resolution proof for all submissions from this device.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-sm p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#F3F3F0] text-[#858585] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#171717]">No Reports Logged Yet</h3>
            <p className="text-xs text-[#626262] mt-1 max-w-sm mx-auto">
              Incidents you report will appear here with live dispatch tracking and municipal auditor signatures.
            </p>
          </div>
          <button
            onClick={onNavigateReport}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold py-2.5 px-5 rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            Report Your First Hazard
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(item => {
            const cat = getCategory(item.category)
            const sev = getSeverity(item.severity)
            const st  = getStatus(item.status)

            return (
              <div key={item.id} className="bg-white rounded-2xl border border-[#E7E5E0] shadow-sm p-5 space-y-4 hover:border-[#D1CFCA] transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.emoji}</span>
                    <div>
                      <span className="text-[10px] font-mono text-[#4F46E5] font-bold">{item.id}</span>
                      <h4 className="text-sm font-bold text-[#171717]">{item.title}</h4>
                    </div>
                  </div>
                  <span className={st.badgeClass}>{st.label}</span>
                </div>

                <p className="text-xs text-[#626262] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Evidence and Resolution Before / After */}
                {item.evidence_url ? (
                  <div className="grid grid-cols-2 gap-3 bg-[#F3F3F0] p-3 rounded-xl border border-[#E7E5E0]">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-[#858585] uppercase tracking-wider">Your Initial Report</span>
                      <img src={item.photo_url} alt="Before" className="w-full h-20 object-cover rounded-lg border border-[#E7E5E0]" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-[#15803D] uppercase tracking-wider">Audited Resolution</span>
                      <img src={item.evidence_url} alt="After" className="w-full h-20 object-cover rounded-lg border border-emerald-200" />
                    </div>
                  </div>
                ) : item.photo_url && (
                  <div className="w-full h-28 rounded-xl overflow-hidden border border-[#E7E5E0]">
                    <img src={item.photo_url} alt="Reported" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Chronological Audit Trail */}
                {item.history && item.history.length > 0 && (
                  <div className="bg-[#F3F3F0] p-3.5 rounded-xl border border-[#E7E5E0] space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#858585] block">
                      Official Timeline
                    </span>
                    <div className="space-y-2.5">
                      {item.history.map((h, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs">
                          <span className="w-2 h-2 rounded-full bg-[#4F46E5] mt-1.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="text-[#171717] font-semibold">{h.actor || 'Municipal Authority'}</span>
                              <span className="text-[10px] text-[#858585] font-mono">
                                {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className="text-[#626262] text-[11px] block mt-0.5">{h.note}</span>
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
