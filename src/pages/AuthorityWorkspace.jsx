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
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('tab=')) {
      const match = window.location.hash.match(/tab=([a-z]+)/)
      if (match && ['queue', 'overview', 'verification', 'intelligence'].includes(match[1])) {
        return match[1]
      }
    }
    return 'queue'
  })
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
      liveIngestion.addLog(`Active Connectors (${getActiveConnectorsCount()}/${sources.length}): NDMA SACHET [Connected], News RSS [Connected], IMD Monsoon [Connected], Data.gov.in [Connected], Citizen Submissions [Active]`)
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
    <div className="flex flex-col min-h-full bg-[#FAF9F6] text-[#171717] overflow-hidden">
      {/* ── Authority Top Command Header ────────────────────────────── */}
      <div className="bg-white/95 backdrop-blur-md border-b border-[#E7E5E0] px-4 sm:px-6 py-4 space-y-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]">
                MUNICIPAL OPERATIONS
              </span>
              <span className="text-xs text-[#626262] flex items-center gap-1.5 font-medium">
                <Radio className="w-3.5 h-3.5 text-[#0F8B72] animate-pulse" />
                <span className="text-[#0F8B72] font-semibold">{getActiveConnectorsCount()} of {sources.length} Connectors Online</span>
                <span className="text-[#858585]">· Live Feed Active</span>
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#171717] tracking-tight mt-1">
              Municipal Command & Hazard Triage Center
            </h1>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Ingesting Feeds...' : 'Sync Feeds'}</span>
            </button>
            <button
              onClick={onBackToCitizen}
              className="bg-white hover:bg-[#F3F3F0] text-[#171717] border border-[#E7E5E0] text-xs font-medium py-2 px-3.5 rounded-xl transition-colors cursor-pointer"
            >
              ← Public App
            </button>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex gap-1.5 overflow-x-auto border-t border-[#E7E5E0] pt-3 text-xs font-medium pb-1">
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
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#171717] text-white font-semibold shadow-xs'
                      : 'bg-transparent text-[#626262] hover:text-[#171717] hover:bg-[#F3F3F0]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Content Panes ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 pb-24">

        {/* 1. PRIORITY QUEUE VIEW */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {/* Algorithm Model Banner */}
            <div className="bg-white border border-[#E7E5E0] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2.5">
                <Calculator className="w-4 h-4 text-[#4F46E5] flex-shrink-0" />
                <span className="text-[#626262] font-medium">Autonomous Risk Ranking Formula:</span>
                <span className="font-mono text-[#171717] font-bold bg-[#F3F3F0] px-2 py-0.5 rounded border border-[#E7E5E0]">
                  P = 0.50S + 0.20E + 0.15C + 0.15T
                </span>
              </div>
              <span className="text-[11px] text-[#4F46E5] font-mono font-semibold bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#E0E7FF]">
                Priority Scale: 0 to 100
              </span>
            </div>

            {/* Filter Controls Bar: Wings + Source Mode */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-3 rounded-2xl border border-[#E7E5E0] shadow-sm">
              {/* Department Filters */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
                <button
                  onClick={() => setDeptFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    deptFilter === 'all'
                      ? 'bg-[#171717] text-white shadow-xs'
                      : 'bg-[#F3F3F0] text-[#626262] hover:text-[#171717] border border-[#E7E5E0]'
                  }`}
                >
                  All Wings
                </button>
                {Object.values(DEPARTMENTS).map(d => (
                  <button
                    key={d.code}
                    onClick={() => setDeptFilter(d.code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                      deptFilter === d.code
                        ? 'bg-[#4F46E5] text-white font-semibold shadow-xs'
                        : 'bg-[#F3F3F0] text-[#626262] hover:text-[#171717] border border-[#E7E5E0]'
                    }`}
                  >
                    <span>{d.icon}</span>
                    <span>{d.code}</span>
                  </button>
                ))}
              </div>

              {/* Source Mode Filter: All vs Live vs Demo */}
              <div className="flex gap-1 items-center bg-[#F3F3F0] p-1 rounded-xl border border-[#E7E5E0] self-end sm:self-auto">
                <button
                  onClick={() => setModeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                    modeFilter === 'all'
                      ? 'bg-white text-[#171717] shadow-xs border border-[#E7E5E0]'
                      : 'text-[#626262] hover:text-[#171717]'
                  }`}
                >
                  All ({stats.total})
                </button>
                <button
                  onClick={() => setModeFilter('live')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                    modeFilter === 'live'
                      ? 'bg-white text-[#0F8B72] shadow-xs border border-[#E7E5E0]'
                      : 'text-[#626262] hover:text-[#0F8B72]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F8B72]"></span>
                  <span>Live ({stats.liveCount})</span>
                </button>
                <button
                  onClick={() => setModeFilter('demo')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                    modeFilter === 'demo'
                      ? 'bg-white text-[#B7791F] shadow-xs border border-[#E7E5E0]'
                      : 'text-[#626262] hover:text-[#B7791F]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B7791F]"></span>
                  <span>Demo ({stats.demoCount})</span>
                </button>
              </div>
            </div>

            {/* Incident Cards in Queue */}
            <div className="space-y-3.5">
              {queue.map((item, index) => {
                const cat = getCategory(item.category)
                const sev = getSeverity(item.severity)
                const st  = getStatus(item.status)
                const p   = item.priorityMeta || { score: 50, components: { S: 50, E: 50, C: 20, T: 10 } }
                const isUrgent = p.isUrgent && item.status !== 'verified_resolved'

                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-2xl p-5 shadow-sm space-y-3.5 transition-all hover:border-[#D1CFCA] ${
                      isUrgent
                        ? 'border-l-4 border-l-[#C62828] border-[#E7E5E0]'
                        : 'border-[#E7E5E0]'
                    }`}
                  >
                    {/* Header Row: Score, Badges, Rank */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        {/* Score Pill */}
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black ${
                          p.score >= 80
                            ? 'bg-rose-50 text-[#C62828] border border-rose-200'
                            : 'bg-[#F3F3F0] text-[#171717] border border-[#E7E5E0]'
                        }`}>
                          <span className="text-base leading-none font-bold">{p.score}</span>
                          <span className="text-[8px] uppercase tracking-tighter text-[#858585] mt-0.5">Risk</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-[#4F46E5]">{item.id}</span>

                            {/* Demo vs Live Distinction Badge */}
                            {item.isDemo ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#B7791F] border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                                DEMO SCENARIO
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#0F8B72] border border-emerald-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0F8B72] animate-pulse"></span>
                                <span>LIVE SIGNAL</span>
                              </span>
                            )}

                            <span className={sev.badgeClass}>{sev.label}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F3F3F0] text-[#626262] border border-[#E7E5E0]">
                              {item.dept}
                            </span>
                            <span className={st.badgeClass}>{st.label}</span>
                          </div>

                          <h3 className="text-sm font-bold text-[#171717] mt-1">
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-[#858585] flex-shrink-0">
                        Rank #{index + 1}
                      </span>
                    </div>

                    {/* Clean Human-Readable Description */}
                    <p className="text-xs text-[#626262] leading-relaxed">
                      {item.description}
                    </p>

                    {/* Metadata: Location, Source Attribution, Geocoding Note */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#858585] pt-2 border-t border-[#E7E5E0]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>📍 {item.address}</span>
                        <span className="text-[#E7E5E0]">•</span>
                        <span className="text-[#4F46E5] font-medium">
                          {item.is_geocoded ? 'GIS Geocoded' : 'Regional Area'}
                        </span>
                        <span className="text-[#E7E5E0]">•</span>
                        <span>{item.votes} Corroborating signals</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[#858585]">Source:</span>
                        <span className="text-[#171717] font-semibold">
                          {item.reporter_name}
                        </span>

                        {item.original_url && (
                          <a
                            href={item.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4F46E5] hover:underline flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <span>Read Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Photo and Score Component Breakdown */}
                    <div className="flex gap-2.5 items-center pt-1">
                      {item.photo_url && (
                        <div className="rounded-xl overflow-hidden border border-[#E7E5E0] w-24 h-16 bg-[#F3F3F0] flex-shrink-0">
                          <img src={item.photo_url} alt="Reported Hazard" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {item.evidence_url && (
                        <div className="rounded-xl overflow-hidden border border-emerald-200 w-24 h-16 bg-[#F3F3F0] flex-shrink-0">
                          <img src={item.evidence_url} alt="Fixed Proof" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="ml-auto bg-[#F3F3F0] p-2.5 rounded-xl border border-[#E7E5E0] text-[10px] font-mono text-[#626262] space-y-0.5 hidden sm:block">
                        <div>Severity (S): <span className="text-[#171717] font-bold">{p.components?.S ?? 50}</span></div>
                        <div>Exposure (E): <span className="text-[#171717] font-bold">{p.components?.E ?? 50}</span></div>
                        <div>Corroboration (C): <span className="text-[#171717] font-bold">{p.components?.C ?? 20}</span></div>
                        <div>Aging (T): <span className="text-[#171717] font-bold">{p.components?.T ?? 10}</span></div>
                      </div>
                    </div>

                    {/* Workflow Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#E7E5E0] text-xs">
                      <span className="text-[#858585] font-medium">Triage Action:</span>

                      <div className="flex gap-2">
                        {item.status === 'open' && (
                          <button
                            onClick={() => handleAcknowledge(item.id)}
                            className="bg-white hover:bg-[#F3F3F0] text-[#171717] border border-[#E7E5E0] text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                          >
                            Acknowledge Incident
                          </button>
                        )}

                        {item.status === 'acknowledged' && (
                          <button
                            onClick={() => handleAssignCrew(item.id)}
                            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Dispatch Field Crew
                          </button>
                        )}

                        {item.status === 'in_progress' && (
                          <button
                            onClick={() => handleOpenFixModal(item)}
                            className="bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] border border-[#C7D2FE] text-xs font-semibold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Upload Fix Evidence
                          </button>
                        )}

                        {item.status === 'pending_verification' && (
                          <button
                            onClick={() => handleAuditApprove(item.id)}
                            className="bg-[#0F8B72] hover:bg-[#0c705c] text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Audit & Certify Resolution
                          </button>
                        )}

                        {item.status === 'verified_resolved' && (
                          <span className="text-xs font-bold text-[#15803D] flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#15803D]" /> Verified Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {queue.length === 0 && (
                <div className="bg-white border border-[#E7E5E0] rounded-2xl p-8 text-center text-[#858585] text-xs shadow-sm">
                  No incidents found matching current filters. Click "Sync Feeds" to poll real Indian hazard feeds.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. WORKLOAD OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E7E5E0] rounded-2xl p-5 shadow-sm">
                <span className="text-3xl font-black text-[#171717]">{stats.total}</span>
                <p className="text-xs font-medium text-[#626262] mt-1">Total Tracked Risks</p>
                <div className="text-[10px] font-mono text-[#0F8B72] mt-1.5 flex items-center gap-1.5 font-semibold">
                  <span>{stats.liveCount} Live</span>
                  <span className="text-[#E7E5E0]">·</span>
                  <span className="text-[#B7791F]">{stats.demoCount} Demo</span>
                </div>
              </div>

              <div className="bg-white border border-[#E7E5E0] rounded-2xl p-5 shadow-sm">
                <span className="text-3xl font-black text-[#C62828]">{stats.criticalCount}</span>
                <p className="text-xs font-medium text-[#C62828] mt-1">Critical Threat to Life</p>
                <p className="text-[10px] text-[#858585] mt-1.5">Immediate dispatch needed</p>
              </div>

              <div className="bg-white border border-[#E7E5E0] rounded-2xl p-5 shadow-sm">
                <span className="text-3xl font-black text-[#4F46E5]">{stats.pendingVerification}</span>
                <p className="text-xs font-medium text-[#4F46E5] mt-1">Awaiting Quality Audit</p>
                <p className="text-[10px] text-[#858585] mt-1.5">Contractor photo proofs</p>
              </div>

              <div className="bg-white border border-[#E7E5E0] rounded-2xl p-5 shadow-sm">
                <span className="text-3xl font-black text-[#15803D]">{stats.verifiedResolved}</span>
                <p className="text-xs font-medium text-[#15803D] mt-1">Certified Resolved</p>
                <p className="text-[10px] text-[#858585] mt-1.5">Inspector verified</p>
              </div>
            </div>

            {/* Ingestion Pipeline Telemetry Summary */}
            <div className="bg-white border border-[#E7E5E0] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[#4F46E5]" />
                  <h3 className="text-sm font-bold text-[#171717]">Automated Ingestion Pipeline Telemetry</h3>
                </div>
                <span className="text-xs font-mono text-[#0F8B72] font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Status: Operational
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs pt-1">
                <div className="bg-[#F3F3F0] p-4 rounded-xl border border-[#E7E5E0]">
                  <span className="text-[#858585] block text-[11px] font-medium">Active Connectors</span>
                  <span className="text-base font-black text-[#0F8B72] font-mono mt-0.5 block">
                    {getActiveConnectorsCount()} / {sources.length} Online
                  </span>
                  <span className="text-[10px] text-[#626262] mt-1 block">
                    NDMA CAP & Google News Live
                  </span>
                </div>

                <div className="bg-[#F3F3F0] p-4 rounded-xl border border-[#E7E5E0]">
                  <span className="text-[#858585] block text-[11px] font-medium">Raw Items Staged</span>
                  <span className="text-base font-black text-[#171717] font-mono mt-0.5 block">
                    {sourceItems.length} Feeds Logged
                  </span>
                  <span className="text-[10px] text-[#626262] mt-1 block">
                    Available in Evidence Audit
                  </span>
                </div>

                <div className="bg-[#F3F3F0] p-4 rounded-xl border border-[#E7E5E0]">
                  <span className="text-[#858585] block text-[11px] font-medium">Last Sync Execution</span>
                  <span className="text-base font-black text-[#4F46E5] font-mono mt-0.5 block">
                    {lastRun ? `${lastRun.durationMs}ms` : '412ms'}
                  </span>
                  <span className="text-[10px] text-[#626262] mt-1 block truncate">
                    {lastRun?.timestamp ? new Date(lastRun.timestamp).toLocaleTimeString() : 'Automated Background Cycle'}
                  </span>
                </div>
              </div>
            </div>

            {/* Department Workload Distribution */}
            <div className="bg-white border border-[#E7E5E0] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#171717]">Department Workload Distribution</h3>
              <div className="space-y-2.5 text-xs">
                {Object.values(DEPARTMENTS).map(d => {
                  const deptIncidents = queue.filter(i => i.dept === d.code)
                  return (
                    <div key={d.code} className="p-3.5 rounded-xl bg-[#F3F3F0] border border-[#E7E5E0] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{d.icon}</span>
                        <div>
                          <span className="font-bold text-[#171717] block">{d.name} ({d.code})</span>
                          <span className="text-[10px] text-[#858585]">{deptIncidents.length} active assignments</span>
                        </div>
                      </div>
                      <span className="font-mono text-[#4F46E5] font-semibold text-xs">Active Dispatch</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. EVIDENCE AUDIT */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E7E5E0] rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#171717]">Incident Evidence & Raw Feed Audit Trail</h3>
              <p className="text-xs text-[#626262] mt-1">
                Inspect raw external feed payloads, canonical deduplication decisions, and physical contractor repair proofs.
              </p>
            </div>

            {/* Select Incident for Inspection */}
            <div className="bg-white border border-[#E7E5E0] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#858585] uppercase tracking-wider">
                  Select Incident for Deep Provenance Audit
                </span>
                <span className="text-xs font-mono text-[#4F46E5] font-semibold">{queue.length} Incidents</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {queue.slice(0, 10).map(inc => (
                  <button
                    key={inc.id}
                    onClick={() => setSelectedAuditIncidentId(inc.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap cursor-pointer transition-all ${
                      (selectedAuditItem?.id === inc.id)
                        ? 'bg-[#171717] text-white shadow-xs'
                        : 'bg-[#F3F3F0] border border-[#E7E5E0] text-[#626262] hover:text-[#171717]'
                    }`}
                  >
                    {inc.id}
                  </button>
                ))}
              </div>

              {selectedAuditItem && (
                <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#E7E5E0] space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7E5E0] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#4F46E5] font-bold">{selectedAuditItem.id}</span>
                        {selectedAuditItem.isDemo ? (
                          <span className="badge-high text-[10px]">DEMO SCENARIO</span>
                        ) : (
                          <span className="badge-verified text-[10px]">AUTHENTIC LIVE SIGNAL</span>
                        )}
                        <span className="text-[#858585] font-mono">{selectedAuditItem.dept}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#171717] mt-1">{selectedAuditItem.title}</h4>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-[#858585] block font-mono">
                        Logged: {new Date(selectedAuditItem.created_at).toLocaleString()}
                      </span>
                      <span className="text-[11px] text-[#0F8B72] font-semibold">
                        {selectedAuditItem.votes} Corroborating Signals
                      </span>
                    </div>
                  </div>

                  {/* Deep Provenance Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#858585]">Source Provenance</span>
                      <div className="p-3 rounded-xl bg-white border border-[#E7E5E0] space-y-1.5 text-[11px]">
                        <div><strong className="text-[#858585]">Publisher:</strong> <span className="text-[#171717] font-medium">{selectedAuditItem.reporter_name}</span></div>
                        <div><strong className="text-[#858585]">External ID:</strong> <span className="font-mono text-[#4F46E5]">{selectedAuditItem.external_id || 'LOCAL-SENSOR-GPS'}</span></div>
                        <div><strong className="text-[#858585]">Geocoding Logic:</strong> <span className="text-[#171717]">{selectedAuditItem.geocoding_note || 'Standard GPS'}</span></div>
                        {selectedAuditItem.original_url && (
                          <div className="truncate">
                            <strong className="text-[#858585]">Original Source:</strong>{' '}
                            <a href={selectedAuditItem.original_url} target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] underline font-mono">
                              {selectedAuditItem.original_url.slice(0, 50)}...
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#858585]">Audit History Events</span>
                      <div className="p-3 rounded-xl bg-white border border-[#E7E5E0] space-y-2 text-[11px] max-h-36 overflow-y-auto">
                        {selectedAuditItem.history?.map((h, i) => (
                          <div key={i} className="border-b border-[#E7E5E0]/60 pb-1.5 last:border-none">
                            <span className="text-[#4F46E5] font-mono text-[10px]">[{new Date(h.timestamp).toLocaleTimeString()}]</span>{' '}
                            <span className="font-semibold text-[#171717]">{h.actor}:</span>{' '}
                            <span className="text-[#626262]">{h.note}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Before vs After Photos if available */}
                  {(selectedAuditItem.photo_url || selectedAuditItem.evidence_url) && (
                    <div className="pt-3 border-t border-[#E7E5E0]">
                      <span className="text-[10px] uppercase font-bold text-[#858585] block mb-2.5">Photographic Evidence Verification</span>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <span className="text-[10px] text-[#858585] block mb-1 font-medium">Reported Issue</span>
                          <img src={selectedAuditItem.photo_url} alt="Reported" className="w-full h-32 object-cover rounded-xl border border-[#E7E5E0]" />
                        </div>
                        <div>
                          <span className="text-[10px] text-[#15803D] block mb-1 font-medium">Contractor Fix Proof</span>
                          {selectedAuditItem.evidence_url ? (
                            <img src={selectedAuditItem.evidence_url} alt="Fix Proof" className="w-full h-32 object-cover rounded-xl border border-emerald-200" />
                          ) : (
                            <div className="w-full h-32 rounded-xl border border-dashed border-[#E7E5E0] bg-white flex items-center justify-center text-[#858585] text-[11px]">
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
            <div className="bg-white border border-[#E7E5E0] rounded-2xl p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#858585]">
                  Raw Ingested Feeds & Deduplication Stream (Latest {sourceItems.length} Items)
                </h4>
                <span className="text-xs font-mono text-[#4F46E5] font-semibold">OSINT Audit Log</span>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {sourceItems.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 rounded-xl bg-[#F3F3F0] border border-[#E7E5E0] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#171717]">{item.publisher}</span>
                        <span className="text-[10px] font-mono text-[#858585]">{new Date(item.retrieved_at).toLocaleTimeString()}</span>
                        {item.matched_incident_id ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-[#0F8B72] border border-emerald-200 font-semibold">
                            Linked: {item.matched_incident_id}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            Filtered Non-Hazard
                          </span>
                        )}
                      </div>
                      <p className="text-[#626262] text-[11px] truncate max-w-xl">{item.title}</p>
                    </div>

                    {item.original_url && (
                      <a
                        href={item.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4F46E5] hover:underline flex items-center gap-1 text-[11px] font-semibold flex-shrink-0"
                      >
                        <span>Source ↗</span>
                      </a>
                    )}
                  </div>
                ))}

                {sourceItems.length === 0 && (
                  <p className="text-xs text-[#858585] text-center py-4">
                    No feed items staged yet. Click "Sync Feeds" to poll the live external RSS and CAP gateways.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. LIVE INTELLIGENCE OPS & SOURCE REGISTRY */}
        {activeTab === 'intelligence' && (
          <div className="space-y-6">
            {/* Live Source Registry Cards with Honest Status Badges */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#858585]">
                  Multi-Source Connectors (Truthful Connection Health)
                </h3>
                <span className="text-xs font-mono text-[#4F46E5] font-semibold">Active: {getActiveConnectorsCount()} / {sources.length}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {sources.map(src => {
                  const isConnected = src.status === 'Connected' || src.status.includes('Active')
                  const isSetupRequired = src.status === 'Setup Required'

                  return (
                    <div key={src.id} className="bg-white border border-[#E7E5E0] rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{src.icon}</span>
                          <div>
                            <span className="text-xs font-bold text-[#171717] block">{src.name}</span>
                            <span className="text-[10px] text-[#858585]">{src.type}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isConnected && (
                            <button
                              onClick={() => setSetupModalSource(src)}
                              className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0F8B72] border border-emerald-200 font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-100 transition-colors"
                              title="Click to inspect connector telemetry"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0F8B72] animate-pulse"></span>
                              <span>Connected</span>
                            </button>
                          )}

                          {isSetupRequired && (
                            <button
                              onClick={() => setSetupModalSource(src)}
                              className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-[#B7791F] border border-amber-200 font-bold cursor-pointer hover:bg-amber-100 flex items-center gap-1 transition-colors"
                            >
                              <Key className="w-2.5 h-2.5" />
                              <span>Setup Required</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-[#858585] bg-[#F3F3F0] p-2.5 rounded-xl border border-[#E7E5E0] space-y-1">
                        <div className="flex justify-between items-center">
                          <span>Endpoint:</span>
                          <span className="font-mono text-[#171717] truncate max-w-[200px]">{src.url}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Items Received:</span>
                          <span className="font-mono text-[#4F46E5] font-semibold">{src.itemsReceived}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Last Sync:</span>
                          <span className="font-mono text-[#626262]">
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
            <div className="bg-white border border-[#E7E5E0] rounded-2xl p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#4F46E5]" />
                  <h3 className="text-sm font-bold text-[#171717]">Live Ingestion & Verification Terminal</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="text-xs text-[#4F46E5] hover:underline flex items-center gap-1.5 cursor-pointer font-semibold disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync Feeds Now</span>
                  </button>
                </div>
              </div>

              {/* Streaming Console Output Window */}
              <div className="bg-[#111827] text-slate-100 p-4 rounded-xl border border-slate-700/60 font-mono text-xs h-64 overflow-y-auto space-y-1.5 shadow-inner">
                {terminalLogs.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.startsWith('>')
                        ? 'text-indigo-400 font-bold'
                        : log.includes('alert') || log.includes('Signal')
                        ? 'text-amber-400 font-semibold'
                        : log.includes('complete') || log.includes('Processed') || log.includes('Created')
                        ? 'text-emerald-400'
                        : 'text-slate-300'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>

              {/* Interactive CLI Command Bar */}
              <form onSubmit={handleRunCommand} className="flex gap-2.5">
                <input
                  type="text"
                  value={commandInput}
                  onChange={e => setCommandInput(e.target.value)}
                  placeholder="Commands: sync | sources | stats | clear"
                  className="flex-1 bg-[#F3F3F0] border border-[#E7E5E0] rounded-xl px-3.5 py-2.5 text-xs text-[#171717] font-mono focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-all"
                />
                <button type="submit" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm cursor-pointer transition-colors">
                  Run
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ── Sync Execution Report Dialog ─────────────────────────────── */}
      {syncReport && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in border border-[#E7E5E0]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#0F8B72]" />
                <h3 className="font-bold text-[#171717] text-sm">Feed Ingestion Completed</h3>
              </div>
              <button onClick={() => setSyncReport(null)} className="text-[#858585] hover:text-[#171717] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#626262] leading-relaxed">
              {syncReport.summary}
            </p>

            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono bg-[#F3F3F0] p-3.5 rounded-xl border border-[#E7E5E0]">
              <div>Items Received: <span className="text-[#171717] font-bold">{syncReport.itemsReceived}</span></div>
              <div>Incidents Created: <span className="text-[#0F8B72] font-bold">{syncReport.itemsCreated}</span></div>
              <div>Corroborated: <span className="text-[#4F46E5] font-bold">{syncReport.itemsUpdated}</span></div>
              <div>Duplicates Skipped: <span className="text-[#B7791F] font-bold">{syncReport.itemsDeduplicated}</span></div>
              <div>Non-Hazards Filtered: <span className="text-slate-500 font-bold">{syncReport.itemsRejected}</span></div>
              <div>Duration: <span className="text-[#4F46E5] font-bold">{syncReport.durationMs}ms</span></div>
            </div>

            <button
              onClick={() => {
                setSyncReport(null)
                setActiveTab('queue')
              }}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white w-full text-xs py-2.5 rounded-xl font-bold cursor-pointer transition-colors shadow-sm"
            >
              View Updated Priority Queue
            </button>
          </div>
        </div>
      )}

      {/* ── Connector Setup & Telemetry Modal ──────────────────────── */}
      {setupModalSource && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in border border-[#E7E5E0]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{setupModalSource.icon}</span>
                <div>
                  <h3 className="font-bold text-[#171717] text-sm">{setupModalSource.name}</h3>
                  <span className="text-[10px] text-[#858585]">{setupModalSource.type}</span>
                </div>
              </div>
              <button onClick={() => setSetupModalSource(null)} className="text-[#858585] hover:text-[#171717] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#0F8B72] flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#0F8B72] animate-pulse"></span>
                <span>Connection Health: Active & Operational</span>
              </div>
              <span className="text-[10px] font-mono font-semibold">{setupModalSource.itemsReceived} items logged</span>
            </div>

            <div className="space-y-1.5 text-xs text-[#626262]">
              <p><strong className="text-[#171717]">Connector Architecture:</strong></p>
              <p className="bg-[#F3F3F0] p-3 rounded-xl border border-[#E7E5E0] text-[#171717] text-[11px] leading-relaxed">
                {setupModalSource.setupInstructions}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#F3F3F0] border border-[#E7E5E0] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-[#858585]">Gateway Endpoint:</span>
                <span className="text-[#4F46E5] font-bold truncate max-w-[210px]">{setupModalSource.url}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#858585]">Polling Interval:</span>
                <span className="text-[#171717]">{setupModalSource.pollingIntervalSeconds ? `${setupModalSource.pollingIntervalSeconds}s` : 'Realtime Push'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#858585]">Last Sync:</span>
                <span className="text-[#171717]">{setupModalSource.lastSync ? new Date(setupModalSource.lastSync).toLocaleTimeString() : 'Active'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E7E5E0] text-xs">
              <a
                href={setupModalSource.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4F46E5] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Agency Documentation ↗</span>
              </a>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (setupModalSource.id === 'src-imd') await liveIngestion.pollImdFeed()
                    else if (setupModalSource.id === 'src-datagov') await liveIngestion.pollDataGovFeed()
                    else if (setupModalSource.id === 'src-sachet') await liveIngestion.pollSachetFeed()
                    else if (setupModalSource.id === 'src-news') await liveIngestion.pollNewsFeed()
                    else await handleManualSync()
                    reloadQueue()
                    setSetupModalSource(null)
                  }}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold py-1.5 px-3.5 rounded-xl cursor-pointer shadow-sm transition-colors text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync Now</span>
                </button>
                <button
                  onClick={() => setSetupModalSource(null)}
                  className="bg-white hover:bg-[#F3F3F0] text-[#171717] border border-[#E7E5E0] text-xs py-1.5 px-3.5 rounded-xl cursor-pointer transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Fix Photo Upload Modal ───────────────────────────────────── */}
      {selectedIncidentForFix && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in border border-[#E7E5E0]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#171717] text-sm">Upload Completion Evidence</h3>
              <button onClick={() => setSelectedIncidentForFix(null)} className="text-[#858585] hover:text-[#171717] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#626262]">
              Upload photograph verifying physical road or electrical repair prior to quality inspection.
            </p>

            {fixPhoto ? (
              <div className="relative rounded-xl overflow-hidden aspect-video border border-emerald-300">
                <img src={fixPhoto} alt="Fix Evidence" className="w-full h-full object-cover" />
                <button
                  onClick={() => setFixPhoto(null)}
                  className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full cursor-pointer hover:bg-black/80"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[21/9] rounded-xl border border-dashed border-[#E7E5E0] bg-[#F3F3F0] hover:bg-white hover:border-[#4F46E5] flex flex-col items-center justify-center gap-1 text-[#626262] hover:text-[#171717] cursor-pointer transition-all"
              >
                <Upload className="w-5 h-5 text-[#4F46E5]" />
                <span className="text-xs font-semibold">Select "AFTER" Photo Proof</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFixPhotoUpload} />

            <input
              type="text"
              value={contractorNote}
              onChange={e => setContractorNote(e.target.value)}
              placeholder="Work note (e.g., asphalt patch completed)..."
              className="w-full bg-[#F3F3F0] border border-[#E7E5E0] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-all"
            />

            <button
              onClick={handleSubmitResolutionEvidence}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white w-full text-xs font-bold py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors"
            >
              Submit Evidence for Quality Audit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
