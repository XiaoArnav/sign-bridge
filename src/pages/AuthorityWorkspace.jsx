import React, { useState, useEffect, useRef } from 'react'
import { ShieldAlert, CheckCircle2, Clock, Upload, ArrowRight, UserCheck, AlertOctagon, Filter, Calculator, Sparkles, X, Terminal, Database, Activity, FileSpreadsheet, AlertTriangle, ShieldCheck, RefreshCw, Radio } from 'lucide-react'
import { hazardStore } from '../lib/hazardStore.js'
import { getCategory, getSeverity, getStatus, DEPARTMENTS } from '../lib/hazardTypes.js'
import { liveIngestion, SOURCE_REGISTRY } from '../lib/ingestionEngine.js'

export default function AuthorityWorkspace({ onBackToCitizen }) {
  const [activeTab, setActiveTab] = useState('queue') // 'overview' | 'queue' | 'verification' | 'intelligence'
  const [queue, setQueue] = useState([])
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Live Ingestion State
  const [terminalLogs, setTerminalLogs] = useState([])
  const [sources, setSources] = useState(SOURCE_REGISTRY)
  const [isSyncing, setIsSyncing] = useState(false)
  const [commandInput, setCommandInput] = useState('')

  // Verification modal state
  const [selectedIncidentForFix, setSelectedIncidentForFix] = useState(null)
  const [fixPhoto, setFixPhoto] = useState(null)
  const [contractorNote, setContractorNote] = useState('')
  const fileInputRef = useRef()

  const reloadQueue = () => {
    setQueue(hazardStore.getRankedQueue(deptFilter, statusFilter))
  }

  useEffect(() => {
    reloadQueue()

    // Subscribe to live ingestion logs
    const unsubscribe = liveIngestion.subscribe((logs, updatedSources) => {
      setTerminalLogs([...logs])
      setSources([...updatedSources])
      reloadQueue()
    })

    return () => unsubscribe()
  }, [deptFilter, statusFilter])

  const stats = hazardStore.getStats()

  const handleAcknowledge = (id) => {
    hazardStore.transitionStatus(id, 'acknowledged', 'Incident verified & logged in municipal triage backlog', 'Triage Dispatch')
    reloadQueue()
  }

  const handleAssignCrew = (id) => {
    hazardStore.assignCrew(id, 'Rapid Response Squad #4')
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
    hazardStore.submitResolutionEvidence(selectedIncidentForFix.id, fixPhoto || defaultProof, contractorNote || 'Road asphalt repair completed')
    setSelectedIncidentForFix(null)
    reloadQueue()
  }

  const handleAuditApprove = (id) => {
    hazardStore.verifyResolution(id, 'Passed on-site audit by Municipal Inspector')
    reloadQueue()
  }

  const handleManualSync = async () => {
    setIsSyncing(true)
    liveIngestion.addLog('Manual sync triggered: Refreshing NDMA SACHET & News connectors...')
    await liveIngestion.pollNewsFeed()
    await liveIngestion.pollSachetFeed()
    setIsSyncing(false)
    reloadQueue()
  }

  const handleRunCommand = (e) => {
    e.preventDefault()
    if (!commandInput.trim()) return
    const cmd = commandInput.trim()
    liveIngestion.addLog(`> ${cmd}`)

    if (cmd.startsWith('sources list')) {
      liveIngestion.addLog(`Active Connectors: [NDMA SACHET: ACTIVE], [News RSS: ACTIVE], [IMD: SYNCED], [Citizen App: ACTIVE]`)
    } else if (cmd.startsWith('ingest run')) {
      handleManualSync()
    } else if (cmd.startsWith('map refresh')) {
      liveIngestion.addLog(`Refreshed public GIS map layer with latest verified incidents.`)
      reloadQueue()
    } else {
      liveIngestion.addLog(`Command recognized: ${cmd}. Status: OK.`)
    }

    setCommandInput('')
  }

  return (
    <div className="flex flex-col h-full bg-midnight overflow-hidden text-rastaText-primary">
      {/* ── Authority Top Command Header ────────────────────────────── */}
      <div className="bg-surface border-b border-surface-border px-4 py-3 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-muted text-teal border border-teal/30">
                AUTHORITY WORKSPACE
              </span>
              <span className="text-xs text-rastaText-muted flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Live Ingestion Active</span>
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-rastaText-primary mt-0.5">
              Municipal Command & Hazard Triage
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="btn-rasta-teal text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Feeds'}</span>
            </button>
            <button
              onClick={onBackToCitizen}
              className="btn-rasta-secondary text-xs cursor-pointer py-1.5 px-3"
            >
              ← Public App
            </button>
          </div>
        </div>

        {/* Workspace Navigation Tabs (Blueprint Section 2) */}
        <div className="flex gap-2 overflow-x-auto border-t border-surface-border pt-2 text-xs font-bold pb-1 -mx-4 px-4">
          {[
            { id: 'queue', label: 'Priority Queue', icon: AlertOctagon },
            { id: 'overview', label: 'Workload Overview', icon: Activity },
            { id: 'verification', label: 'Evidence Audit', icon: ShieldCheck },
            { id: 'intelligence', label: 'Intelligence Ops & Connectors', icon: Terminal },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal text-slate-950 font-bold shadow-sm'
                    : 'bg-surface-elevated text-rastaText-secondary hover:text-white hover:bg-surface-border'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content Panes ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 max-w-5xl mx-auto w-full space-y-4">

        {/* 1. PRIORITY QUEUE VIEW */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {/* Algorithm Model Banner */}
            <div className="rasta-surface p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-teal flex-shrink-0" />
                <span className="text-rastaText-secondary">Autonomous Risk Ranking Formula:</span>
                <span className="font-mono text-rastaText-primary font-bold">P = 0.50S + 0.20E + 0.15C + 0.15T</span>
              </div>
              <span className="text-[11px] text-teal font-mono font-semibold">Priority Range: 0 to 100</span>
            </div>

            {/* Department Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setDeptFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  deptFilter === 'all' ? 'bg-rastaText-primary text-midnight' : 'bg-surface border border-surface-border text-rastaText-secondary'
                }`}
              >
                All Wings
              </button>
              {Object.values(DEPARTMENTS).map(d => (
                <button
                  key={d.code}
                  onClick={() => setDeptFilter(d.code)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    deptFilter === d.code ? 'bg-teal text-slate-950' : 'bg-surface border border-surface-border text-rastaText-secondary hover:text-white'
                  }`}
                >
                  <span>{d.icon}</span>
                  <span>{d.code}</span>
                </button>
              ))}
            </div>

            {/* Incident Cards in Queue */}
            <div className="space-y-3">
              {queue.map((item, index) => {
                const cat = getCategory(item.category)
                const sev = getSeverity(item.severity)
                const st  = getStatus(item.status)
                const p   = item.priorityMeta

                return (
                  <div
                    key={item.id}
                    className={`rasta-surface p-4 space-y-3 ${
                      p.isUrgent && item.status !== 'verified_resolved'
                        ? 'border-rose-900/50 bg-gradient-to-r from-rose-950/20 via-surface to-surface'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Score Pill */}
                        <div className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-black ${
                          p.score >= 80 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-surface-elevated text-rastaText-secondary'
                        }`}>
                          <span className="text-sm leading-none">{p.score}</span>
                          <span className="text-[8px] uppercase tracking-tighter text-rastaText-muted">Risk</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-teal">{item.id}</span>
                            <span className={sev.badgeClass}>{sev.label}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-elevated text-rastaText-secondary">
                              {item.dept}
                            </span>
                            <span className={st.badgeClass}>{st.label}</span>
                          </div>
                          <h3 className="text-sm font-bold text-rastaText-primary mt-0.5">{item.title}</h3>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-rastaText-muted flex-shrink-0">
                        Rank #{index + 1}
                      </span>
                    </div>

                    <p className="text-xs text-rastaText-secondary leading-relaxed">
                      {item.description}
                    </p>
                    <p className="text-[11px] text-rastaText-muted truncate">
                      📍 {item.address} · {item.votes} Corroborating signals
                    </p>

                    {/* Photo and Score Component Breakdown */}
                    <div className="flex gap-2 items-center">
                      <div className="rounded-xl overflow-hidden border border-surface-border w-24 h-16 bg-midnight flex-shrink-0">
                        <img src={item.photo_url} alt="Reported" className="w-full h-full object-cover" />
                      </div>

                      {item.evidence_url && (
                        <div className="rounded-xl overflow-hidden border border-emerald-900/50 w-24 h-16 bg-midnight flex-shrink-0">
                          <img src={item.evidence_url} alt="Fixed" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="ml-auto bg-midnight/80 p-2 rounded-xl border border-surface-border text-[10px] font-mono text-rastaText-muted space-y-0.5 hidden sm:block">
                        <div>S(Severity): <span className="text-rastaText-primary">{p.components.S}</span></div>
                        <div>E(Exposure): <span className="text-rastaText-primary">{p.components.E}</span></div>
                        <div>C(Corrob): <span className="text-rastaText-primary">{p.components.C}</span></div>
                        <div>T(Aging): <span className="text-rastaText-primary">{p.components.T}</span></div>
                      </div>
                    </div>

                    {/* Workflow Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-surface-border text-xs">
                      <span className="text-rastaText-muted">Workflow Controls:</span>

                      <div className="flex gap-2">
                        {item.status === 'open' && (
                          <button
                            onClick={() => handleAcknowledge(item.id)}
                            className="btn-rasta-secondary text-xs min-h-[36px] py-1"
                          >
                            Acknowledge Incident
                          </button>
                        )}

                        {item.status === 'acknowledged' && (
                          <button
                            onClick={() => handleAssignCrew(item.id)}
                            className="btn-rasta-teal text-xs min-h-[36px] py-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Dispatch Field Crew
                          </button>
                        )}

                        {item.status === 'in_progress' && (
                          <button
                            onClick={() => handleOpenFixModal(item)}
                            className="btn-rasta-secondary text-xs min-h-[36px] py-1 text-teal border-teal/30"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Upload Fix Evidence
                          </button>
                        )}

                        {item.status === 'pending_verification' && (
                          <button
                            onClick={() => handleAuditApprove(item.id)}
                            className="btn-rasta-teal text-xs min-h-[36px] py-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Audit & Certify Resolution
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
          </div>
        )}

        {/* 2. WORKLOAD OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rasta-surface p-4">
                <span className="text-2xl font-black text-rastaText-primary">{stats.total}</span>
                <p className="text-xs text-rastaText-secondary mt-1">Total Reported Risks</p>
              </div>
              <div className="rasta-surface p-4">
                <span className="text-2xl font-black text-rose-400">{stats.criticalCount}</span>
                <p className="text-xs text-rose-300 mt-1">Critical Threat to Life</p>
              </div>
              <div className="rasta-surface p-4">
                <span className="text-2xl font-black text-sky-400">{stats.pendingVerification}</span>
                <p className="text-xs text-sky-300 mt-1">Awaiting Quality Audit</p>
              </div>
              <div className="rasta-surface p-4">
                <span className="text-2xl font-black text-emerald-400">{stats.verifiedResolved}</span>
                <p className="text-xs text-emerald-300 mt-1">Certified Resolved</p>
              </div>
            </div>

            <div className="rasta-surface p-5 space-y-3">
              <h3 className="text-sm font-bold text-rastaText-primary">Department Workload Distribution</h3>
              <div className="space-y-2 text-xs">
                {Object.values(DEPARTMENTS).map(d => (
                  <div key={d.code} className="p-3 rounded-xl bg-midnight border border-surface-border flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{d.icon}</span>
                      <span className="font-bold text-rastaText-primary">{d.name}</span>
                    </div>
                    <span className="font-mono text-teal font-semibold">Active Dispatch</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. EVIDENCE AUDIT */}
        {activeTab === 'verification' && (
          <div className="space-y-4">
            <div className="rasta-surface p-4">
              <h3 className="text-sm font-bold text-rastaText-primary">Two-Tier Quality Audit Queue</h3>
              <p className="text-xs text-rastaText-secondary mt-0.5">
                Government Anti-Fraud Policy: Road repairs require physical photographic proof prior to final closure certification.
              </p>
            </div>

            <div className="space-y-3">
              {queue.filter(i => i.status === 'pending_verification').map(item => (
                <div key={item.id} className="rasta-surface p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono text-teal font-bold">{item.id}</span>
                      <h4 className="text-sm font-bold text-rastaText-primary">{item.title}</h4>
                      <p className="text-xs text-rastaText-secondary mt-0.5">📍 {item.address}</p>
                    </div>
                    <span className="badge-medium">Awaiting Audit</span>
                  </div>

                  {/* Before vs After Audit Card */}
                  <div className="grid grid-cols-2 gap-3 bg-midnight p-3 rounded-xl border border-surface-border">
                    <div>
                      <span className="text-[10px] font-bold text-rastaText-muted uppercase block mb-1">Before: Citizen Report</span>
                      <img src={item.photo_url} alt="Before" className="w-full h-28 object-cover rounded-lg border border-surface-border" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">After: Contractor Repair Proof</span>
                      <img src={item.evidence_url} alt="After" className="w-full h-28 object-cover rounded-lg border border-emerald-900/60" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleAuditApprove(item.id)}
                      className="btn-rasta-teal text-xs py-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Mark Verified Resolved
                    </button>
                  </div>
                </div>
              ))}

              {queue.filter(i => i.status === 'pending_verification').length === 0 && (
                <div className="p-8 text-center rasta-surface text-rastaText-muted text-xs">
                  No repairs currently awaiting inspection. All contractor evidence audited.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. LIVE INTELLIGENCE OPS & SOURCE REGISTRY (Blueprint Section 2, 3 & 10) */}
        {activeTab === 'intelligence' && (
          <div className="space-y-4">
            {/* Live Source Registry Cards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rastaText-muted">
                  Active Multi-Source Connectors (India Ingestion Gateway)
                </h3>
                <span className="text-xs font-mono text-teal">Poll Cycle: 45s</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sources.map(src => (
                  <div key={src.id} className="rasta-surface p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{src.icon}</span>
                        <span className="text-xs font-bold text-rastaText-primary">{src.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {src.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-rastaText-muted pt-1 border-t border-surface-border/50">
                      <span>Type: {src.type}</span>
                      <span className="text-teal font-mono font-semibold">{src.itemsIngested} Ingested</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-Time Log Terminal */}
            <div className="rasta-surface p-4 bg-midnight border-surface-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-teal" />
                  <h3 className="text-sm font-bold text-rastaText-primary">Live Ingestion & Verification Terminal</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualSync}
                    className="text-xs text-teal hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" /> Fetch Feeds Now
                  </button>
                </div>
              </div>

              {/* Streaming Console Output Window */}
              <div className="bg-slate-950 p-4 rounded-xl border border-surface-border font-mono text-xs text-rastaText-secondary h-64 overflow-y-auto space-y-1.5 shadow-inner">
                {terminalLogs.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.startsWith('>')
                        ? 'text-teal font-bold'
                        : log.includes('alert') || log.includes('Signal')
                        ? 'text-amber-400 font-semibold'
                        : log.includes('complete') || log.includes('processed')
                        ? 'text-emerald-400'
                        : 'text-rastaText-secondary'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>

              {/* Interactive CLI Command Bar */}
              <form onSubmit={handleRunCommand} className="flex gap-2">
                <input
                  type="text"
                  value={commandInput}
                  onChange={e => setCommandInput(e.target.value)}
                  placeholder="Terminal command: sources list | ingest run | map refresh"
                  className="flex-1 bg-surface border border-surface-border rounded-xl px-3.5 py-2 text-xs text-rastaText-primary font-mono focus:outline-none focus:border-teal"
                />
                <button type="submit" className="btn-rasta-teal text-xs px-4">
                  Run
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ── Fix Photo Upload Modal ───────────────────────────────────── */}
      {selectedIncidentForFix && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rasta-surface max-w-sm w-full p-5 space-y-4 bg-surface shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-rastaText-primary text-sm">Upload Completion Evidence</h3>
              <button onClick={() => setSelectedIncidentForFix(null)} className="text-rastaText-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-rastaText-secondary">
              Upload photograph verifying physical road or electrical repair prior to quality inspection.
            </p>

            {fixPhoto ? (
              <div className="relative rounded-xl overflow-hidden aspect-video border border-emerald-500/50">
                <img src={fixPhoto} alt="Fix Evidence" className="w-full h-full object-cover" />
                <button
                  onClick={() => setFixPhoto(null)}
                  className="absolute top-2 right-2 bg-midnight/80 text-white p-1 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[21/9] rounded-xl border border-dashed border-surface-border bg-midnight flex flex-col items-center justify-center gap-1 text-rastaText-secondary hover:text-rastaText-primary cursor-pointer"
              >
                <Upload className="w-5 h-5 text-teal" />
                <span className="text-xs font-semibold">Select "AFTER" Photo Proof</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFixPhotoUpload} />

            <input
              type="text"
              value={contractorNote}
              onChange={e => setContractorNote(e.target.value)}
              placeholder="Work note (e.g., asphalt patch completed)..."
              className="w-full bg-midnight border border-surface-border rounded-xl px-3 py-2 text-xs text-rastaText-primary focus:outline-none focus:border-teal"
            />

            <button
              onClick={handleSubmitResolutionEvidence}
              className="btn-rasta-primary w-full text-xs py-3"
            >
              Submit Evidence for Quality Audit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
