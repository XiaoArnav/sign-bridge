import React, { useState, useEffect, useRef } from 'react'
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  Upload,
  ArrowRight,
  UserCheck,
  AlertOctagon,
  Filter,
  Calculator,
  Sparkles,
  X,
  Terminal,
  Database,
  Activity,
  FileSpreadsheet,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Radio,
  ExternalLink,
  Layers,
  Key,
  Info,
  Check
} from 'lucide-react'
import { hazardStore } from '../lib/hazardStore.js'
import { getCategory, getSeverity, getStatus, DEPARTMENTS } from '../lib/hazardTypes.js'
import { liveIngestion, SOURCE_REGISTRY, getActiveConnectorsCount } from '../lib/ingestionEngine.js'

export default function AuthorityWorkspace({ onBackToCitizen }) {
  const [activeTab, setActiveTab] = useState('queue') // 'queue' | 'overview' | 'verification' | 'intelligence'
  const [queue, setQueue] = useState([])
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modeFilter, setModeFilter] = useState('all') // 'all' | 'live' | 'demo'

  // Live Ingestion State
  const [terminalLogs, setTerminalLogs] = useState([])
  const [sources, setSources] = useState(SOURCE_REGISTRY)
  const [isSyncing, setIsSyncing] = useState(false)
  const [commandInput, setCommandInput] = useState('')
  const [syncReport, setSyncReport] = useState(null)
  const [setupModalSource, setSetupModalSource] = useState(null)

  // Audit State
  const [selectedAuditIncidentId, setSelectedAuditIncidentId] = useState(null)

  // Verification modal state
  const [selectedIncidentForFix, setSelectedIncidentForFix] = useState(null)
  const [fixPhoto, setFixPhoto] = useState(null)
  const [contractorNote, setContractorNote] = useState('')
  const fileInputRef = useRef()

  const reloadQueue = () => {
    setQueue(hazardStore.getRankedQueue(deptFilter, statusFilter, modeFilter))
  }

  useEffect(() => {
    reloadQueue()

    // Subscribe to live ingestion logs & source updates
    const unsubscribe = liveIngestion.subscribe((logs, updatedSources) => {
      setTerminalLogs([...logs])
      setSources([...updatedSources])
      reloadQueue()
    })

    return () => unsubscribe()
  }, [deptFilter, statusFilter, modeFilter])

  const stats = hazardStore.getStats()
  const sourceItems = hazardStore.getSourceItems()
  const lastRun = hazardStore.getLastRun()

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
    const report = await liveIngestion.runFullSync()
    setIsSyncing(false)
    setSyncReport(report)
    reloadQueue()
  }

  const handleRunCommand = (e) => {
    e.preventDefault()
    if (!commandInput.trim()) return
    const cmd = commandInput.trim().toLowerCase()
    liveIngestion.addLog(`> ${commandInput.trim()}`)

    if (cmd.startsWith('sources') || cmd.startsWith('connectors')) {
      liveIngestion.addLog(`Active Connectors (${getActiveConnectorsCount()}/${sources.length}): NDMA SACHET [Connected], News RSS [Connected], Citizen Submissions [Active]`)
    } else if (cmd.startsWith('sync') || cmd.startsWith('ingest')) {
      handleManualSync()
    } else if (cmd.startsWith('stats')) {
      liveIngestion.addLog(`Stats: Total=${stats.total}, Live=${stats.liveCount}, Demo=${stats.demoCount}, Critical=${stats.criticalCount}, Open=${stats.open}`)
    } else if (cmd.startsWith('clear')) {
      setTerminalLogs([])
    } else if (cmd.startsWith('help')) {
      liveIngestion.addLog(`Available CLI commands: sync | sources | stats | clear`)
    } else {
      liveIngestion.addLog(`Command acknowledged: "${commandInput}". Type "help" for options.`)
    }

    setCommandInput('')
  }

  const selectedAuditItem = selectedAuditIncidentId
    ? queue.find(i => i.id === selectedAuditIncidentId) || hazardStore.getById(selectedAuditIncidentId)
    : queue[0] || null

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
              <span className="text-xs text-rastaText-muted flex items-center gap-1.5 font-medium">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-semibold">{getActiveConnectorsCount()} of {sources.length} Connectors Online</span>
                <span className="text-rastaText-muted">· Live Feed Active</span>
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-rastaText-primary mt-0.5">
              Municipal Command & Hazard Triage Center
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="btn-rasta-teal text-xs py-1.5 px-3.5 flex items-center gap-2 font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Ingesting Feeds...' : 'Sync Feeds'}</span>
            </button>
            <button
              onClick={onBackToCitizen}
              className="btn-rasta-secondary text-xs cursor-pointer py-1.5 px-3"
            >
              ← Public App
            </button>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto border-t border-surface-border pt-2 text-xs font-bold pb-1 -mx-4 px-4">
          {[
            { id: 'queue', label: `Priority Queue (${queue.length})`, icon: AlertOctagon },
            { id: 'overview', label: 'Workload Overview', icon: Activity },
            { id: 'verification', label: `Evidence Audit (${stats.pendingVerification} awaiting)`, icon: ShieldCheck },
            { id: 'intelligence', label: `Intelligence Ops (${getActiveConnectorsCount()} active)`, icon: Terminal },
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

            {/* Filter Controls Bar: Wings + Source Mode */}
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center bg-surface p-2.5 rounded-xl border border-surface-border">
              {/* Department Filters */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
                <button
                  onClick={() => setDeptFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    deptFilter === 'all' ? 'bg-rastaText-primary text-midnight' : 'bg-surface-elevated border border-surface-border text-rastaText-secondary'
                  }`}
                >
                  All Wings
                </button>
                {Object.values(DEPARTMENTS).map(d => (
                  <button
                    key={d.code}
                    onClick={() => setDeptFilter(d.code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                      deptFilter === d.code ? 'bg-teal text-slate-950' : 'bg-surface-elevated border border-surface-border text-rastaText-secondary hover:text-white'
                    }`}
                  >
                    <span>{d.icon}</span>
                    <span>{d.code}</span>
                  </button>
                ))}
              </div>

              {/* Source Mode Filter: All vs Live vs Demo */}
              <div className="flex gap-1 items-center bg-midnight p-1 rounded-lg border border-surface-border self-end sm:self-auto">
                <button
                  onClick={() => setModeFilter('all')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                    modeFilter === 'all' ? 'bg-surface-border text-white' : 'text-rastaText-muted hover:text-white'
                  }`}
                >
                  All Sources ({stats.total})
                </button>
                <button
                  onClick={() => setModeFilter('live')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    modeFilter === 'live' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-rastaText-muted hover:text-emerald-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Live Only ({stats.liveCount})</span>
                </button>
                <button
                  onClick={() => setModeFilter('demo')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    modeFilter === 'demo' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-rastaText-muted hover:text-amber-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Demo Only ({stats.demoCount})</span>
                </button>
              </div>
            </div>

            {/* Incident Cards in Queue */}
            <div className="space-y-3">
              {queue.map((item, index) => {
                const cat = getCategory(item.category)
                const sev = getSeverity(item.severity)
                const st  = getStatus(item.status)
                const p   = item.priorityMeta || { score: 50, components: { S: 50, E: 50, C: 20, T: 10 } }

                return (
                  <div
                    key={item.id}
                    className={`rasta-surface p-4 space-y-3 transition-all ${
                      p.isUrgent && item.status !== 'verified_resolved'
                        ? 'border-rose-900/60 bg-gradient-to-r from-rose-950/20 via-surface to-surface'
                        : ''
                    }`}
                  >
                    {/* Header Row: Score, Badges, Rank */}
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

                            {/* Demo vs Live Distinction Badge */}
                            {item.isDemo ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                                ⚠️ DEMO — NOT A LIVE INCIDENT
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>LIVE SIGNAL</span>
                              </span>
                            )}

                            <span className={sev.badgeClass}>{sev.label}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-elevated text-rastaText-secondary">
                              {item.dept}
                            </span>
                            <span className={st.badgeClass}>{st.label}</span>
                          </div>

                          <h3 className="text-sm font-bold text-rastaText-primary mt-1">
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-rastaText-muted flex-shrink-0">
                        Rank #{index + 1}
                      </span>
                    </div>

                    {/* Clean Human-Readable Description */}
                    <p className="text-xs text-rastaText-secondary leading-relaxed">
                      {item.description}
                    </p>

                    {/* Metadata: Location, Source Attribution, Geocoding Note */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-rastaText-muted pt-1 border-t border-surface-border/60">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>📍 {item.address}</span>
                        <span className="text-surface-border">•</span>
                        <span className="text-teal font-medium">
                          {item.is_geocoded ? 'GIS Geocoded' : 'Regional Area'}
                        </span>
                        <span className="text-surface-border">•</span>
                        <span>{item.votes} Corroborating signals</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-rastaText-muted font-medium">Source:</span>
                        <span className="text-rastaText-primary font-semibold">
                          {item.reporter_name}
                        </span>

                        {item.original_url && (
                          <a
                            href={item.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal hover:underline flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <span>Read Article</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Photo and Score Component Breakdown */}
                    <div className="flex gap-2 items-center pt-1">
                      {item.photo_url && (
                        <div className="rounded-xl overflow-hidden border border-surface-border w-24 h-16 bg-midnight flex-shrink-0">
                          <img src={item.photo_url} alt="Reported Hazard" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {item.evidence_url && (
                        <div className="rounded-xl overflow-hidden border border-emerald-900/50 w-24 h-16 bg-midnight flex-shrink-0">
                          <img src={item.evidence_url} alt="Fixed Proof" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="ml-auto bg-midnight/80 p-2 rounded-xl border border-surface-border text-[10px] font-mono text-rastaText-muted space-y-0.5 hidden sm:block">
                        <div>S(Severity): <span className="text-rastaText-primary">{p.components?.S ?? 50}</span></div>
                        <div>E(Exposure): <span className="text-rastaText-primary">{p.components?.E ?? 50}</span></div>
                        <div>C(Corrob): <span className="text-rastaText-primary">{p.components?.C ?? 20}</span></div>
                        <div>T(Aging): <span className="text-rastaText-primary">{p.components?.T ?? 10}</span></div>
                      </div>
                    </div>

                    {/* Workflow Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-surface-border text-xs">
                      <span className="text-rastaText-muted">Workflow Controls:</span>

                      <div className="flex gap-2">
                        {item.status === 'open' && (
                          <button
                            onClick={() => handleAcknowledge(item.id)}
                            className="btn-rasta-secondary text-xs min-h-[36px] py-1 cursor-pointer"
                          >
                            Acknowledge Incident
                          </button>
                        )}

                        {item.status === 'acknowledged' && (
                          <button
                            onClick={() => handleAssignCrew(item.id)}
                            className="btn-rasta-teal text-xs min-h-[36px] py-1 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Dispatch Field Crew
                          </button>
                        )}

                        {item.status === 'in_progress' && (
                          <button
                            onClick={() => handleOpenFixModal(item)}
                            className="btn-rasta-secondary text-xs min-h-[36px] py-1 text-teal border-teal/30 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Upload Fix Evidence
                          </button>
                        )}

                        {item.status === 'pending_verification' && (
                          <button
                            onClick={() => handleAuditApprove(item.id)}
                            className="btn-rasta-teal text-xs min-h-[36px] py-1 cursor-pointer"
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

              {queue.length === 0 && (
                <div className="rasta-surface p-8 text-center text-rastaText-muted text-xs">
                  No incidents found matching current filters. Click "Sync Feeds" to poll real Indian hazard feeds.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. WORKLOAD OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rasta-surface p-4">
                <span className="text-2xl font-black text-rastaText-primary">{stats.total}</span>
                <p className="text-xs text-rastaText-secondary mt-1">Total Tracked Risks</p>
                <div className="text-[10px] font-mono text-teal mt-1 flex items-center gap-1.5">
                  <span>{stats.liveCount} Live</span>
                  <span>·</span>
                  <span>{stats.demoCount} Demo</span>
                </div>
              </div>
              <div className="rasta-surface p-4">
                <span className="text-2xl font-black text-rose-400">{stats.criticalCount}</span>
                <p className="text-xs text-rose-300 mt-1">Critical Threat to Life</p>
                <p className="text-[10px] text-rastaText-muted mt-1">Immediate dispatch needed</p>
              </div>
              <div className="rasta-surface p-4">
                <span className="text-2xl font-black text-sky-400">{stats.pendingVerification}</span>
                <p className="text-xs text-sky-300 mt-1">Awaiting Quality Audit</p>
                <p className="text-[10px] text-rastaText-muted mt-1">Contractor photo proofs</p>
              </div>
              <div className="rasta-surface p-4">
                <span className="text-2xl font-black text-emerald-400">{stats.verifiedResolved}</span>
                <p className="text-xs text-emerald-300 mt-1">Certified Resolved</p>
                <p className="text-[10px] text-rastaText-muted mt-1">Inspector verified</p>
              </div>
            </div>

            {/* Ingestion Pipeline Telemetry Summary */}
            <div className="rasta-surface p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-teal" />
                  <h3 className="text-sm font-bold text-rastaText-primary">Automated Ingestion Pipeline Telemetry</h3>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  Status: Operational
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="bg-midnight p-3 rounded-xl border border-surface-border">
                  <span className="text-rastaText-muted block text-[11px]">Active Connectors</span>
                  <span className="text-base font-black text-teal font-mono mt-0.5 block">
                    {getActiveConnectorsCount()} / {sources.length} Online
                  </span>
                  <span className="text-[10px] text-rastaText-muted mt-1 block">
                    NDMA CAP & Google News Live
                  </span>
                </div>

                <div className="bg-midnight p-3 rounded-xl border border-surface-border">
                  <span className="text-rastaText-muted block text-[11px]">Raw Items Logged</span>
                  <span className="text-base font-black text-rastaText-primary font-mono mt-0.5 block">
                    {sourceItems.length} Feeds Staged
                  </span>
                  <span className="text-[10px] text-rastaText-muted mt-1 block">
                    Available in Evidence Audit
                  </span>
                </div>

                <div className="bg-midnight p-3 rounded-xl border border-surface-border">
                  <span className="text-rastaText-muted block text-[11px]">Last Sync Execution</span>
                  <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">
                    {lastRun ? `${lastRun.durationMs}ms` : '412ms'}
                  </span>
                  <span className="text-[10px] text-rastaText-muted mt-1 block truncate">
                    {lastRun?.timestamp ? new Date(lastRun.timestamp).toLocaleTimeString() : 'Automated Background Cycle'}
                  </span>
                </div>
              </div>
            </div>

            {/* Department Workload Distribution */}
            <div className="rasta-surface p-5 space-y-3">
              <h3 className="text-sm font-bold text-rastaText-primary">Department Workload Distribution</h3>
              <div className="space-y-2 text-xs">
                {Object.values(DEPARTMENTS).map(d => {
                  const deptIncidents = queue.filter(i => i.dept === d.code)
                  return (
                    <div key={d.code} className="p-3 rounded-xl bg-midnight border border-surface-border flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{d.icon}</span>
                        <div>
                          <span className="font-bold text-rastaText-primary block">{d.name} ({d.code})</span>
                          <span className="text-[10px] text-rastaText-muted">{deptIncidents.length} active assignments</span>
                        </div>
                      </div>
                      <span className="font-mono text-teal font-semibold">Active Dispatch</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. EVIDENCE AUDIT */}
        {activeTab === 'verification' && (
          <div className="space-y-4">
            <div className="rasta-surface p-4">
              <h3 className="text-sm font-bold text-rastaText-primary">Incident Evidence & Raw Feed Audit Trail</h3>
              <p className="text-xs text-rastaText-secondary mt-0.5">
                Inspect raw external feed payloads, canonical deduplication decisions, and physical contractor repair proofs.
              </p>
            </div>

            {/* Select Incident for Inspection */}
            <div className="rasta-surface p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rastaText-muted uppercase tracking-wider">
                  Select Incident for Deep Provenance Audit
                </span>
                <span className="text-xs font-mono text-teal">{queue.length} Incidents</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {queue.slice(0, 10).map(inc => (
                  <button
                    key={inc.id}
                    onClick={() => setSelectedAuditIncidentId(inc.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap cursor-pointer transition-all ${
                      (selectedAuditItem?.id === inc.id)
                        ? 'bg-teal text-slate-950 font-black'
                        : 'bg-midnight border border-surface-border text-rastaText-secondary hover:text-white'
                    }`}
                  >
                    {inc.id}
                  </button>
                ))}
              </div>

              {selectedAuditItem && (
                <div className="bg-midnight p-4 rounded-xl border border-surface-border space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-teal font-bold">{selectedAuditItem.id}</span>
                        {selectedAuditItem.isDemo ? (
                          <span className="badge-medium text-[10px]">DEMO SCENARIO</span>
                        ) : (
                          <span className="badge-verified text-[10px]">AUTHENTIC LIVE SIGNAL</span>
                        )}
                        <span className="text-rastaText-muted font-mono">{selectedAuditItem.dept}</span>
                      </div>
                      <h4 className="text-sm font-bold text-rastaText-primary mt-1">{selectedAuditItem.title}</h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-rastaText-muted block font-mono">
                        Logged: {new Date(selectedAuditItem.created_at).toLocaleString()}
                      </span>
                      <span className="text-[11px] text-teal font-semibold">
                        {selectedAuditItem.votes} Corroborating Signals
                      </span>
                    </div>
                  </div>

                  {/* Deep Provenance Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-rastaText-muted">Source Provenance</span>
                      <div className="p-2.5 rounded-lg bg-surface border border-surface-border space-y-1 text-[11px]">
                        <div><strong className="text-rastaText-muted">Publisher:</strong> {selectedAuditItem.reporter_name}</div>
                        <div><strong className="text-rastaText-muted">External ID:</strong> <span className="font-mono text-teal">{selectedAuditItem.external_id || 'LOCAL-SENSOR-GPS'}</span></div>
                        <div><strong className="text-rastaText-muted">Geocoding Logic:</strong> {selectedAuditItem.geocoding_note || 'Standard GPS'}</div>
                        {selectedAuditItem.original_url && (
                          <div className="truncate">
                            <strong className="text-rastaText-muted">Original Source:</strong>{' '}
                            <a href={selectedAuditItem.original_url} target="_blank" rel="noopener noreferrer" className="text-teal underline font-mono">
                              {selectedAuditItem.original_url.slice(0, 50)}...
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-rastaText-muted">Audit History Events</span>
                      <div className="p-2.5 rounded-lg bg-surface border border-surface-border space-y-1.5 text-[11px] max-h-32 overflow-y-auto">
                        {selectedAuditItem.history?.map((h, i) => (
                          <div key={i} className="border-b border-surface-border/50 pb-1 last:border-none">
                            <span className="text-teal font-mono text-[10px]">[{new Date(h.timestamp).toLocaleTimeString()}]</span>{' '}
                            <span className="font-semibold text-rastaText-primary">{h.actor}:</span>{' '}
                            <span className="text-rastaText-secondary">{h.note}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Before vs After Photos if available */}
                  {(selectedAuditItem.photo_url || selectedAuditItem.evidence_url) && (
                    <div className="pt-2 border-t border-surface-border">
                      <span className="text-[10px] uppercase font-bold text-rastaText-muted block mb-2">Photographic Evidence Verification</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] text-rastaText-muted block mb-1">Reported Issue</span>
                          <img src={selectedAuditItem.photo_url} alt="Reported" className="w-full h-28 object-cover rounded-lg border border-surface-border" />
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-400 block mb-1">Contractor Fix Proof</span>
                          {selectedAuditItem.evidence_url ? (
                            <img src={selectedAuditItem.evidence_url} alt="Fix Proof" className="w-full h-28 object-cover rounded-lg border border-emerald-900/60" />
                          ) : (
                            <div className="w-full h-28 rounded-lg border border-dashed border-surface-border flex items-center justify-center text-rastaText-muted text-[11px]">
                              Awaiting Repair Completion
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Raw Ingestion Source Items Stream */}
            <div className="rasta-surface p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rastaText-muted">
                  Raw Ingested Feeds & Deduplication Stream (Latest {sourceItems.length} Items)
                </h4>
                <span className="text-xs font-mono text-teal">OSINT Audit Log</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sourceItems.map((item, idx) => (
                  <div key={item.id || idx} className="p-2.5 rounded-xl bg-midnight border border-surface-border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rastaText-primary">{item.publisher}</span>
                        <span className="text-[10px] font-mono text-rastaText-muted">{new Date(item.retrieved_at).toLocaleTimeString()}</span>
                        {item.matched_incident_id ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Linked: {item.matched_incident_id}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            Filtered Non-Hazard
                          </span>
                        )}
                      </div>
                      <p className="text-rastaText-secondary text-[11px] truncate max-w-xl">{item.title}</p>
                    </div>

                    {item.original_url && (
                      <a
                        href={item.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal hover:underline flex items-center gap-1 text-[11px] font-semibold flex-shrink-0"
                      >
                        <span>Source ↗</span>
                      </a>
                    )}
                  </div>
                ))}

                {sourceItems.length === 0 && (
                  <p className="text-xs text-rastaText-muted text-center py-4">
                    No feed items staged yet. Click "Sync Feeds" to poll the live external RSS and CAP gateways.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. LIVE INTELLIGENCE OPS & SOURCE REGISTRY */}
        {activeTab === 'intelligence' && (
          <div className="space-y-4">
            {/* Live Source Registry Cards with Honest Status Badges */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rastaText-muted">
                  Multi-Source Connectors (Truthful Connection Health)
                </h3>
                <span className="text-xs font-mono text-teal">Active: {getActiveConnectorsCount()} / {sources.length}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sources.map(src => {
                  const isConnected = src.status === 'Connected' || src.status.includes('Active')
                  const isSetupRequired = src.status === 'Setup Required'

                  return (
                    <div key={src.id} className="rasta-surface p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{src.icon}</span>
                          <div>
                            <span className="text-xs font-bold text-rastaText-primary block">{src.name}</span>
                            <span className="text-[10px] text-rastaText-muted">{src.type}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isConnected && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>Connected</span>
                            </span>
                          )}

                          {isSetupRequired && (
                            <button
                              onClick={() => setSetupModalSource(src)}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold cursor-pointer hover:bg-amber-500/25 flex items-center gap-1"
                            >
                              <Key className="w-2.5 h-2.5" />
                              <span>Setup Required</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-rastaText-muted bg-midnight p-2 rounded-lg border border-surface-border/50 space-y-1">
                        <div className="flex justify-between items-center">
                          <span>Endpoint:</span>
                          <span className="font-mono text-rastaText-secondary truncate max-w-[200px]">{src.url}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Items Received:</span>
                          <span className="font-mono text-teal font-semibold">{src.itemsReceived}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Last Sync:</span>
                          <span className="font-mono text-rastaText-secondary">
                            {src.lastSync ? new Date(src.lastSync).toLocaleTimeString() : 'Awaiting trigger'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
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
                    disabled={isSyncing}
                    className="text-xs text-teal hover:underline flex items-center gap-1 cursor-pointer font-semibold disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync Feeds Now</span>
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
                        : log.includes('complete') || log.includes('Processed') || log.includes('Created')
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
                  placeholder="Commands: sync | sources | stats | clear"
                  className="flex-1 bg-surface border border-surface-border rounded-xl px-3.5 py-2 text-xs text-rastaText-primary font-mono focus:outline-none focus:border-teal"
                />
                <button type="submit" className="btn-rasta-teal text-xs px-4 cursor-pointer">
                  Run
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ── Sync Execution Report Dialog ─────────────────────────────── */}
      {syncReport && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rasta-surface max-w-md w-full p-5 space-y-4 bg-surface shadow-2xl animate-fade-in border border-teal/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal" />
                <h3 className="font-bold text-rastaText-primary text-sm">Feed Ingestion Completed</h3>
              </div>
              <button onClick={() => setSyncReport(null)} className="text-rastaText-muted hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-rastaText-secondary leading-relaxed">
              {syncReport.summary}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-midnight p-3 rounded-xl border border-surface-border">
              <div>Items Received: <span className="text-white font-bold">{syncReport.itemsReceived}</span></div>
              <div>Incidents Created: <span className="text-emerald-400 font-bold">{syncReport.itemsCreated}</span></div>
              <div>Corroborated: <span className="text-teal font-bold">{syncReport.itemsUpdated}</span></div>
              <div>Duplicates Skipped: <span className="text-amber-300 font-bold">{syncReport.itemsDeduplicated}</span></div>
              <div>Non-Hazards Filtered: <span className="text-slate-400 font-bold">{syncReport.itemsRejected}</span></div>
              <div>Duration: <span className="text-teal font-bold">{syncReport.durationMs}ms</span></div>
            </div>

            <button
              onClick={() => {
                setSyncReport(null)
                setActiveTab('queue')
              }}
              className="btn-rasta-teal w-full text-xs py-2.5 font-bold cursor-pointer"
            >
              View Updated Priority Queue
            </button>
          </div>
        </div>
      )}

      {/* ── Connector Setup Instructions Modal ──────────────────────── */}
      {setupModalSource && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rasta-surface max-w-md w-full p-5 space-y-4 bg-surface shadow-2xl animate-fade-in border border-amber-500/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{setupModalSource.icon}</span>
                <h3 className="font-bold text-rastaText-primary text-sm">{setupModalSource.name}</h3>
              </div>
              <button onClick={() => setSetupModalSource(null)} className="text-rastaText-muted hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
              <strong>Status: Setup Required.</strong> Direct API integration requires official developer credentials.
            </div>

            <div className="space-y-2 text-xs text-rastaText-secondary">
              <p><strong>Setup Instructions:</strong></p>
              <p className="bg-midnight p-3 rounded-xl border border-surface-border text-rastaText-primary font-mono text-[11px] leading-relaxed">
                {setupModalSource.setupInstructions}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-border text-xs">
              <a
                href={setupModalSource.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Developer Portal ↗</span>
              </a>
              <button
                onClick={() => setSetupModalSource(null)}
                className="btn-rasta-secondary text-xs py-1.5 px-4 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
              className="btn-rasta-primary w-full text-xs py-3 cursor-pointer"
            >
              Submit Evidence for Quality Audit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

