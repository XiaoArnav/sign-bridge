import React, { useState, useEffect, useRef } from 'react'
import { ShieldAlert, CheckCircle2, Clock, Upload, ArrowRight, UserCheck, AlertOctagon, Filter, Calculator, Sparkles, X } from 'lucide-react'
import { hazardStore } from '../lib/hazardStore.js'
import { getCategory, getSeverity, getStatus, DEPARTMENTS } from '../lib/hazardTypes.js'

export default function DashboardPage({ onBackToCitizen }) {
  const [queue, setQueue] = useState([])
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Two-tier resolution modal states
  const [selectedIncidentForFix, setSelectedIncidentForFix] = useState(null)
  const [fixPhoto, setFixPhoto] = useState(null)
  const [contractorNote, setContractorNote] = useState('')
  const fileInputRef = useRef()

  const reloadQueue = () => {
    setQueue(hazardStore.getRankedQueue(deptFilter, statusFilter))
  }

  useEffect(() => {
    reloadQueue()
  }, [deptFilter, statusFilter])

  const stats = hazardStore.getStats()

  // Status transitions
  const handleAssign = (id) => {
    hazardStore.updateStatus(id, 'in_progress', 'Field inspection team dispatched to site')
    reloadQueue()
  }

  const handleOpenFixModal = (incident) => {
    setSelectedIncidentForFix(incident)
    setFixPhoto(null)
    setContractorNote('')
  }

  const handleFixPhotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setFixPhoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmitResolutionEvidence = () => {
    if (!selectedIncidentForFix) return
    const defaultProof = 'https://images.unsplash.com/photo-1578965879900-b601614777e5?w=600&auto=format&fit=crop&q=80'
    hazardStore.submitResolutionEvidence(selectedIncidentForFix.id, fixPhoto || defaultProof, contractorNote || 'Road asphalt patch completed')
    setSelectedIncidentForFix(null)
    reloadQueue()
  }

  const handleVerifyResolution = (id) => {
    hazardStore.verifyResolution(id, 'Passed quality audit by Municipal Inspector')
    reloadQueue()
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden text-slate-100">
      {/* ── Command Center Header ───────────────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                COMMAND CENTER
              </span>
              <span className="text-xs text-slate-500">Autonomous Incident Triage</span>
            </div>
            <h1 className="text-lg font-black text-white mt-0.5">Municipal Dispatch & Safety Queue</h1>
          </div>
          <button
            onClick={onBackToCitizen}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Citizen App View
          </button>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-lg font-black text-white">{stats.total}</span>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Logged</p>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-lg font-black text-rose-400">{stats.open}</span>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Unassigned</p>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-lg font-black text-sky-400">{stats.pendingVerification}</span>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Pending Audit</p>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-lg font-black text-emerald-400">{stats.verifiedResolved}</span>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Verified Fixed</p>
          </div>
        </div>

        {/* Algorithm Formula Banner (Blueprint Section 6) */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-sky-400" />
            <span className="text-slate-400">Queue Priority Model:</span>
            <span className="font-mono text-slate-200 font-bold">P = 0.50S + 0.20E + 0.15C + 0.15T</span>
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:inline">Weighted by Life Threat & Exposure</span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setDeptFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              deptFilter === 'all' ? 'bg-slate-100 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Departments
          </button>
          {Object.values(DEPARTMENTS).map(d => (
            <button
              key={d.code}
              onClick={() => setDeptFilter(d.code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-all ${
                deptFilter === d.code ? 'bg-slate-100 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{d.icon}</span>
              <span>{d.code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Ranked Incident Queue ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-w-4xl mx-auto w-full">
        {queue.map((item, index) => {
          const cat = getCategory(item.category)
          const sev = getSeverity(item.severity)
          const st  = getStatus(item.status)
          const p   = item.priorityMeta

          return (
            <div
              key={item.id}
              className={`rasta-card p-4 space-y-3 ${
                p.isUrgent && item.status !== 'verified_resolved'
                  ? 'border-rose-900/60 bg-gradient-to-r from-rose-950/20 via-slate-900 to-slate-900'
                  : ''
              }`}
            >
              {/* Header: Score & Incident Title */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Algorithmic Priority Score Pill */}
                  <div className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-black ${
                    p.score >= 80 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-300'
                  }`}>
                    <span className="text-sm leading-none">{p.score}</span>
                    <span className="text-[8px] uppercase tracking-tighter text-slate-500">Score</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-400">{item.id}</span>
                      <span className={sev.badgeClass}>{sev.label}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.dept}
                      </span>
                      <span className={st.badgeClass}>{st.label}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-0.5">{item.title}</h3>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-slate-500 flex-shrink-0">
                  Rank #{index + 1}
                </span>
              </div>

              {/* Description & Address */}
              <p className="text-xs text-slate-300 leading-relaxed">
                {item.description}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                📍 {item.address} · {item.votes} Corroborating citizen upvotes
              </p>

              {/* Evidence Photographs (Before / After) */}
              <div className="flex gap-2">
                <div className="rounded-xl overflow-hidden border border-slate-800 w-24 h-20 bg-slate-950 flex-shrink-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase px-1 block bg-slate-950">Citizen Photo</span>
                  <img src={item.photo_url} alt="Reported" className="w-full h-full object-cover" />
                </div>

                {item.evidence_url && (
                  <div className="rounded-xl overflow-hidden border border-sky-800/60 w-24 h-20 bg-slate-950 flex-shrink-0">
                    <span className="text-[9px] font-bold text-sky-400 uppercase px-1 block bg-slate-950">Fix Evidence</span>
                    <img src={item.evidence_url} alt="Fixed" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Score breakdown tooltip component */}
                <div className="ml-auto bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 text-[10px] font-mono text-slate-400 space-y-0.5 hidden sm:block">
                  <div>S(Severity): <span className="text-slate-200">{p.components.S}</span></div>
                  <div>E(Exposure): <span className="text-slate-200">{p.components.E}</span></div>
                  <div>C(Votes): <span className="text-slate-200">{p.components.C}</span></div>
                  <div>T(Age): <span className="text-slate-200">{p.components.T}</span></div>
                </div>
              </div>

              {/* ── Workflow Action Buttons (Two-Tier Architecture) ───── */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">Dispatch Controls:</span>

                <div className="flex gap-2">
                  {item.status === 'open' && (
                    <button
                      onClick={() => handleAssign(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Assign Field Crew
                    </button>
                  )}

                  {item.status === 'in_progress' && (
                    <button
                      onClick={() => handleOpenFixModal(item)}
                      className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Submit Resolution Evidence
                    </button>
                  )}

                  {item.status === 'pending_verification' && (
                    <button
                      onClick={() => handleVerifyResolution(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Audit & Verify Fix
                    </button>
                  )}

                  {item.status === 'verified_resolved' && (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Resolved
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Evidence Upload Modal (Pending Verification) ─────────────── */}
      {selectedIncidentForFix && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rasta-card max-w-sm w-full p-5 space-y-4 border-slate-700 bg-slate-900 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Upload Completion Evidence</h3>
              <button onClick={() => setSelectedIncidentForFix(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Contractor compliance rule: Upload photograph verifying completion before incident transitions to verification audit.
            </p>

            {fixPhoto ? (
              <div className="relative rounded-xl overflow-hidden aspect-video border border-emerald-500/50">
                <img src={fixPhoto} alt="Fix Evidence" className="w-full h-full object-cover" />
                <button
                  onClick={() => setFixPhoto(null)}
                  className="absolute top-2 right-2 bg-slate-950/80 text-white p-1 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[21/9] rounded-xl border border-dashed border-slate-700 bg-slate-950 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-200"
              >
                <Upload className="w-5 h-5 text-sky-400" />
                <span className="text-xs font-semibold">Select After-Fix Photograph</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFixPhotoUpload} />

            <input
              type="text"
              value={contractorNote}
              onChange={e => setContractorNote(e.target.value)}
              placeholder="Work note (e.g., asphalt patch laid)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />

            <button
              onClick={handleSubmitResolutionEvidence}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
            >
              Submit Evidence for Audit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
