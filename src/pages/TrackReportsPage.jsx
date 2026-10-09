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
    <div className="flex flex-col h-full bg-[#F5F5F7] overflow-y-auto px-4 py-6 sm:px-6 max-w-lg mx-auto w-full space-y-5 pb-28">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-[#6E6E73] hover:text-[#1D1D1F] rounded-lg cursor-pointer transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold text-[#1D1D1F]">Citizen Status Tracker</span>
        <div className="w-5" />
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">My Hazard Reports</h2>
        <p className="text-xs text-[#6E6E73] leading-relaxed">
          Track official dispatch, field inspection updates, and photographic resolution proof.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-apple-sm p-8 text-center space-y-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#F5F5F7] text-[#86868B] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1D1D1F]">No Reports Logged Yet</h3>
            <p className="text-xs text-[#6E6E73] mt-1 max-w-xs mx-auto">
              Incidents you report from this device will appear here with live tracking updates.
            </p>
          </div>
          <button
            onClick={onNavigateReport}
            className="bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold py-2.5 px-5 rounded-xl shadow-apple transition-colors cursor-pointer"
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
              <div key={item.id} className="bg-white rounded-2xl border border-[#E5E5EA] shadow-apple-sm p-4.5 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{cat.emoji}</span>
                    <div>
                      <span className="text-[10px] font-mono text-[#0071E3] font-semibold">{item.id}</span>
                      <h4 className="text-xs font-semibold text-[#1D1D1F]">{item.title}</h4>
                    </div>
                  </div>
                  <span className={st.badgeClass}>{st.label}</span>
                </div>

                <p className="text-xs text-[#6E6E73] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Evidence and Resolution Before / After */}
                {item.evidence_url ? (
                  <div className="grid grid-cols-2 gap-2 bg-[#F5F5F7] p-2.5 rounded-xl border border-[#E5E5EA]">
                    <div className="space-y-1">
                      <span className="text-[9px] font-semibold text-[#86868B] uppercase">Your Initial Report</span>
                      <img src={item.photo_url} alt="Before" className="w-full h-16 object-cover rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-semibold text-[#248A3D] uppercase">Audited Resolution</span>
                      <img src={item.evidence_url} alt="After" className="w-full h-16 object-cover rounded-lg" />
                    </div>
                  </div>
                ) : item.photo_url && (
                  <div className="w-full h-24 rounded-xl overflow-hidden border border-[#E5E5EA]">
                    <img src={item.photo_url} alt="Reported" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Chronological Audit Trail */}
                {item.history && item.history.length > 0 && (
                  <div className="bg-[#F5F5F7] p-3 rounded-xl border border-[#E5E5EA] space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B] block">
                      Official Timeline
                    </span>
                    <div className="space-y-2.5">
                      {item.history.map((h, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-[#0071E3] mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="text-[#1D1D1F] font-semibold">{h.actor || 'Authority'}</span>
                              <span className="text-[9px] text-[#86868B] font-mono">
                                {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className="text-[#6E6E73] text-[11px] block mt-0.5">{h.note}</span>
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
