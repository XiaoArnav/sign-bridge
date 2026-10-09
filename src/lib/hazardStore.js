/**
 * RASTA Central Data Store
 * Multi-city national coverage (Bengaluru, Mumbai, Delhi-NCR, Chennai),
 * Strict separation of authentic live intelligence vs demo scenarios,
 * 5-state transitions, audit provenance, and raw source item logging.
 */

import { calculatePriorityScore } from './priorityEngine.js'
import { getCategory } from './hazardTypes.js'

const INCIDENTS_KEY = 'rasta_incidents_v5'
const MY_REPORTS_KEY = 'rasta_my_reports_v5'
const SOURCE_ITEMS_KEY = 'rasta_source_items_v5'
const RUNS_KEY = 'rasta_ingestion_runs_v5'

export const CITIES = [
  { id: 'bengaluru', name: 'Bengaluru', center: [12.9716, 77.5946], zoom: 13, state: 'Karnataka' },
  { id: 'mumbai',    name: 'Mumbai',    center: [19.0760, 72.8777], zoom: 12, state: 'Maharashtra' },
  { id: 'delhi',     name: 'Delhi-NCR', center: [28.6139, 77.2090], zoom: 12, state: 'Delhi' },
  { id: 'chennai',   name: 'Chennai',   center: [13.0827, 80.2707], zoom: 12, state: 'Tamil Nadu' },
]

export const SEED_INCIDENTS = [
  // ── BENGALURU (DEMO SCENARIOS) ───────────────────────────────────────────
  {
    id: 'RASTA-8042',
    isDemo: true,
    city: 'bengaluru',
    category: 'wire',
    severity: 'critical',
    title: 'Live 11kV transformer cable dangling into rainwater puddle',
    description: 'Transformer wire snapped following heavy monsoon storm. Touching active pedestrian pavement near school.',
    latitude: 12.9352,
    longitude: 77.6245,
    is_geocoded: true,
    geocoding_note: 'Precision GPS pin from citizen camera telemetry',
    address: '8th Main, 4th Block, Koramangala, Bengaluru',
    photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    evidence_url: null,
    status: 'open',
    reporter_name: 'Ananya S. (DEMO TEST CASE)',
    dept: 'BESCOM',
    assigned_crew: null,
    votes: 38,
    created_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Demonstration scenario initialized for municipal triage testing', timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), actor: 'Seed Harness' }
    ]
  },
  {
    id: 'RASTA-7911',
    isDemo: true,
    city: 'bengaluru',
    category: 'manhole',
    severity: 'critical',
    title: 'Uncovered sewer pit on active two-wheeler lane',
    description: 'Cast iron cover shattered. Zero visibility at night. Two scooterists reported skidding.',
    latitude: 12.9716,
    longitude: 77.5946,
    is_geocoded: true,
    geocoding_note: 'Precision GPS pin from citizen camera telemetry',
    address: 'Opposite Shanthi Nagar Bus Depot, Bengaluru',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    evidence_url: null,
    status: 'in_progress',
    reporter_name: 'Sunil G. (DEMO TEST CASE)',
    dept: 'BWSSB',
    assigned_crew: 'BWSSB Ward #112 Emergency Squad',
    votes: 46,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Demonstration scenario initialized', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), actor: 'Seed Harness' },
      { from: 'open', to: 'acknowledged', note: 'BWSSB Central Triage acknowledged incident', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), actor: 'Dispatch Officer' },
      { from: 'acknowledged', to: 'in_progress', note: 'Field crew assigned. Steel barricades dispatched to site', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), actor: 'Ward Engineer' }
    ]
  },
  {
    id: 'RASTA-7530',
    isDemo: true,
    city: 'bengaluru',
    category: 'pothole',
    severity: 'high',
    title: 'Severe 10-inch asphalt collapse on bridge descent',
    description: 'Deep road crater on bridge ramp causing sudden emergency braking by vehicles.',
    latitude: 12.9900,
    longitude: 77.5500,
    is_geocoded: true,
    geocoding_note: 'Precision GPS pin from citizen camera telemetry',
    address: 'Navrang Bridge Down-Ramp, Rajajinagar, Bengaluru',
    photo_url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&auto=format&fit=crop&q=80',
    evidence_url: 'https://images.unsplash.com/photo-1578965879900-b601614777e5?w=600&auto=format&fit=crop&q=80',
    status: 'pending_verification',
    reporter_name: 'Rajesh V. (DEMO TEST CASE)',
    dept: 'BBMP',
    assigned_crew: 'BBMP Road Maintenance Wing',
    votes: 21,
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Demonstration scenario initialized', timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), actor: 'Seed Harness' },
      { from: 'open', to: 'in_progress', note: 'BBMP Road Contractor assigned for asphalt hot-mix patch', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), actor: 'Executive Engineer' },
      { from: 'in_progress', to: 'pending_verification', note: 'Contractor uploaded "AFTER" photo proof. Awaiting physical audit inspection', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), actor: 'Contractor App' }
    ]
  },
  {
    id: 'RASTA-7102',
    isDemo: true,
    city: 'bengaluru',
    category: 'footpath',
    severity: 'medium',
    title: 'Damaged concrete pavers obstructing senior citizens',
    description: 'Collapsed pavement slabs forcing pedestrians into moving vehicular traffic.',
    latitude: 12.9780,
    longitude: 77.6400,
    is_geocoded: true,
    geocoding_note: 'Precision GPS pin from citizen camera telemetry',
    address: '100 Feet Road, Indiranagar, Bengaluru',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    evidence_url: 'https://images.unsplash.com/photo-1578965879900-b601614777e5?w=600&auto=format&fit=crop&q=80',
    status: 'verified_resolved',
    reporter_name: 'Meera I. (DEMO TEST CASE)',
    dept: 'BBMP',
    assigned_crew: 'Zone East PWD Contractor',
    votes: 14,
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Demonstration scenario initialized', timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), actor: 'Seed Harness' },
      { from: 'open', to: 'in_progress', note: 'PWD footpath repair scheduled', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), actor: 'Ward Engineer' },
      { from: 'in_progress', to: 'pending_verification', note: 'New paver blocks installed with photo proof', timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), actor: 'Contractor' },
      { from: 'pending_verification', to: 'verified_resolved', note: 'Passed audit by Municipal Quality Inspector. Resolution certified.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), actor: 'Chief Inspector' }
    ]
  },

  // ── MUMBAI (DEMO SCENARIOS) ───────────────────────────────────────────────
  {
    id: 'RASTA-9104',
    isDemo: true,
    city: 'mumbai',
    category: 'flooding',
    severity: 'critical',
    title: 'Severe flash flooding and submerged drain pit in Andheri Subway',
    description: 'Andheri vehicular subway submerged under 3.5 feet rainwater. Both carriageways closed for traffic.',
    latitude: 19.1197,
    longitude: 72.8468,
    is_geocoded: true,
    geocoding_note: 'Precision GPS pin from municipal monitor',
    address: 'Andheri Subway, Andheri West, Mumbai',
    photo_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80',
    evidence_url: null,
    status: 'open',
    reporter_name: 'Traffic Eye (DEMO TEST CASE)',
    dept: 'BMC / Disaster Management',
    votes: 52,
    created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Demonstration scenario initialized', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), actor: 'Seed Harness' }
    ]
  },
  {
    id: 'RASTA-9231',
    isDemo: true,
    city: 'mumbai',
    category: 'pothole',
    severity: 'high',
    title: 'Cluster of 5 craters on Western Express Highway flyover ramp',
    description: 'Heavy vehicle impact created sharp road pits on southbound lane near Bandra-Kurla Complex turn.',
    latitude: 19.0600,
    longitude: 72.8500,
    is_geocoded: true,
    geocoding_note: 'Precision GPS pin from highway maintenance probe',
    address: 'Western Express Highway, Kalanagar, Bandra, Mumbai',
    photo_url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&auto=format&fit=crop&q=80',
    evidence_url: null,
    status: 'in_progress',
    reporter_name: 'Highway Patrol (DEMO TEST CASE)',
    dept: 'MMRDA',
    votes: 34,
    created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Demonstration scenario initialized', timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), actor: 'Seed Harness' },
      { from: 'open', to: 'in_progress', note: 'MMRDA Highway Maintenance unit dispatched', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), actor: 'Highway Control' }
    ]
  },

  // ── DELHI-NCR (DEMO SCENARIOS) ────────────────────────────────────────────
  {
    id: 'RASTA-6201',
    isDemo: true,
    city: 'delhi',
    category: 'wire',
    severity: 'critical',
    title: 'Snapped overhead power cable touching water-filled pothole',
    description: 'High-voltage cable downed near ITO junction. Pavement electrified during drizzle.',
    latitude: 28.6289,
    longitude: 77.2405,
    is_geocoded: true,
    geocoding_note: 'Precision GPS pin from power distribution telemetry',
    address: 'ITO Ring Road Junction, New Delhi',
    photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    evidence_url: null,
    status: 'open',
    reporter_name: 'D. Verma (DEMO TEST CASE)',
    dept: 'BSES / Delhi Power',
    votes: 61,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Demonstration scenario initialized', timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), actor: 'Seed Harness' }
    ]
  },

  // ── CHENNAI (DEMO SCENARIOS) ──────────────────────────────────────────────
  {
    id: 'RASTA-5120',
    isDemo: true,
    city: 'chennai',
    category: 'flooding',
    severity: 'high',
    title: 'Stormwater drain silting overflow at Velachery Main Road',
    description: 'Clogged canal causing 1.5 feet water stagnation across bus stops. Commuters unable to access walkways.',
    latitude: 12.9791,
    longitude: 80.2212,
    is_geocoded: true,
    geocoding_note: 'Precision GPS pin from municipal drain monitor',
    address: 'Velachery Main Road, Chennai',
    photo_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80',
    evidence_url: null,
    status: 'in_progress',
    reporter_name: 'K. Balaji (DEMO TEST CASE)',
    dept: 'Greater Chennai Corporation',
    votes: 29,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Demonstration scenario initialized', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), actor: 'Seed Harness' },
      { from: 'open', to: 'in_progress', note: 'GCC Ward #177 desilting super-sucker deployed', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), actor: 'Zonal Officer' }
    ]
  }
]

const DEMO_IDS = new Set(['RASTA-8042', 'RASTA-7911', 'RASTA-7530', 'RASTA-7102', 'RASTA-9104', 'RASTA-9231', 'RASTA-6201', 'RASTA-5120'])

function getStoredIncidents() {
  try {
    const raw = localStorage.getItem(INCIDENTS_KEY)
    if (!raw) {
      localStorage.setItem(INCIDENTS_KEY, JSON.stringify(SEED_INCIDENTS))
      return SEED_INCIDENTS
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(INCIDENTS_KEY, JSON.stringify(SEED_INCIDENTS))
      return SEED_INCIDENTS
    }
    // Ensure all items have explicit isDemo boolean & valid created_at
    return parsed.map(item => ({
      ...item,
      isDemo: item.isDemo !== undefined ? Boolean(item.isDemo) : DEMO_IDS.has(item.id),
      created_at: item.created_at || new Date().toISOString(),
      votes: Math.max(1, Number(item.votes) || 1),
    }))
  } catch {
    return SEED_INCIDENTS
  }
}

function saveIncidents(incidents) {
  try {
    localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents))
  } catch (err) {
    console.error('Failed to save incidents to localStorage:', err)
  }
}

function getStoredMyReports() {
  try {
    const raw = localStorage.getItem(MY_REPORTS_KEY)
    return raw ? JSON.parse(raw) : ['RASTA-8042']
  } catch {
    return ['RASTA-8042']
  }
}

function recordMyReportId(id) {
  const list = getStoredMyReports()
  if (!list.includes(id)) {
    list.unshift(id)
    try {
      localStorage.setItem(MY_REPORTS_KEY, JSON.stringify(list))
    } catch {}
  }
}

function getStoredSourceItems() {
  try {
    const raw = localStorage.getItem(SOURCE_ITEMS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSourceItems(items) {
  try {
    localStorage.setItem(SOURCE_ITEMS_KEY, JSON.stringify(items.slice(0, 100))) // keep latest 100
  } catch {}
}

function getStoredRuns() {
  try {
    const raw = localStorage.getItem(RUNS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRuns(runs) {
  try {
    localStorage.setItem(RUNS_KEY, JSON.stringify(runs.slice(0, 30))) // keep latest 30 runs
  } catch {}
}

export const hazardStore = {
  // Mode filter: 'all' | 'live' | 'demo'
  getAll(cityFilter = 'all', modeFilter = 'all') {
    let all = getStoredIncidents()
    if (cityFilter !== 'all') {
      all = all.filter(i => (i.city || 'bengaluru') === cityFilter)
    }
    if (modeFilter === 'live') {
      all = all.filter(i => !i.isDemo)
    } else if (modeFilter === 'demo') {
      all = all.filter(i => !!i.isDemo)
    }
    return all
  },

  getById(id) {
    return getStoredIncidents().find(i => i.id === id)
  },

  getMyReports() {
    const ids = getStoredMyReports()
    const all = getStoredIncidents()
    return all.filter(i => ids.includes(i.id))
  },

  // Citizen-created report (Authentic user signal)
  createReport({ category, severity, title, description, latitude, longitude, address, photo_url, voice_note, reporter_name, city = 'bengaluru' }) {
    const incidents = getStoredIncidents()
    const catInfo = getCategory(category)
    const reportId = `RASTA-CITIZEN-${Math.floor(1000 + Math.random() * 9000)}`
    
    const newIncident = {
      id: reportId,
      isDemo: false, // Live citizen report
      city,
      category,
      severity: severity || catInfo.defaultSeverity,
      title: title || `${catInfo.label} reported near ${address?.split(',')[0] || 'Road'}`,
      description: description || `Road hazard reported by commuter via RASTA Mobile Web.`,
      latitude,
      longitude,
      is_geocoded: true,
      geocoding_note: 'Citizen GPS sensor fix',
      address,
      photo_url: photo_url || null,
      evidence_url: null,
      voice_note: voice_note || null,
      status: 'open',
      reporter_name: reporter_name || 'Verified Citizen (Direct Mobile Web)',
      dept: catInfo.dept,
      assigned_crew: null,
      votes: 1,
      created_at: new Date().toISOString(),
      history: [
        { from: null, to: 'open', note: 'Incident logged via Citizen Mobile Web App with GPS coordinates', timestamp: new Date().toISOString(), actor: 'Citizen App' }
      ]
    }

    incidents.unshift(newIncident)
    saveIncidents(incidents)
    recordMyReportId(reportId)
    return newIncident
  },

  // Automated Ingestion pipeline creating a verified live incident
  createLiveIncident({
    category,
    severity,
    title,
    description,
    latitude,
    longitude,
    address,
    city = 'bengaluru',
    is_geocoded = true,
    geocoding_note = 'Extracted via location entity analysis',
    source_id,
    source_name,
    original_url,
    external_id,
    dept,
    photo_url = null
  }) {
    const incidents = getStoredIncidents()
    const catInfo = getCategory(category)
    const reportId = `RASTA-LIVE-${Math.floor(1000 + Math.random() * 9000)}`

    const newIncident = {
      id: reportId,
      isDemo: false, // Authentic Live Incident
      city,
      category,
      severity: severity || catInfo.defaultSeverity,
      title: title || 'Live Road Hazard Signal',
      description: description || 'Hazard ingested via live intelligence pipeline.',
      latitude,
      longitude,
      is_geocoded,
      geocoding_note,
      address: address || `${city.toUpperCase()} Region`,
      photo_url: photo_url || (category === 'flooding' ? 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&auto=format&fit=crop&q=80'),
      evidence_url: null,
      status: 'open',
      reporter_name: source_name ? `${source_name} (Live Ingestion)` : 'Official Live Feed',
      dept: dept || catInfo.dept,
      assigned_crew: null,
      votes: 1,
      source_id: source_id || null,
      external_id: external_id || null,
      original_url: original_url || null,
      created_at: new Date().toISOString(),
      history: [
        {
          from: null,
          to: 'open',
          note: `Ingested from ${source_name || 'Live Gateway'}. Source ID: ${external_id || 'CAP-FEED'}.`,
          timestamp: new Date().toISOString(),
          actor: 'RASTA Ingestion Engine'
        }
      ]
    }

    incidents.unshift(newIncident)
    saveIncidents(incidents)
    return newIncident
  },

  // Corroborate an existing incident with an additional live feed item
  corroborateIncident(id, { sourceName, title, url }) {
    const incidents = getStoredIncidents()
    const idx = incidents.findIndex(i => i.id === id)
    if (idx !== -1) {
      incidents[idx].votes = (incidents[idx].votes || 1) + 1
      incidents[idx].history = incidents[idx].history || []
      incidents[idx].history.push({
        from: incidents[idx].status,
        to: incidents[idx].status,
        note: `Corroborating signal recorded from ${sourceName}: "${title?.slice(0, 70)}..."`,
        timestamp: new Date().toISOString(),
        actor: 'Deduplication Matcher'
      })
      if (url && !incidents[idx].original_url) {
        incidents[idx].original_url = url
      }
      saveIncidents(incidents)
      return incidents[idx]
    }
    return null
  },

  // Record raw source items for audit provenance
  recordSourceItem(sourceItem) {
    const items = getStoredSourceItems()
    items.unshift({
      id: `SRC-ITEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      retrieved_at: new Date().toISOString(),
      ...sourceItem
    })
    saveSourceItems(items)
  },

  getSourceItems() {
    return getStoredSourceItems()
  },

  // Ingestion runs logging
  recordIngestionRun(runData) {
    const runs = getStoredRuns()
    const run = {
      id: `RUN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...runData
    }
    runs.unshift(run)
    saveRuns(runs)
    return run
  },

  getIngestionRuns() {
    return getStoredRuns()
  },

  getLastRun() {
    const runs = getStoredRuns()
    return runs.length > 0 ? runs[0] : null
  },

  transitionStatus(id, newStatus, note = '', actor = 'Authority Officer') {
    const incidents = getStoredIncidents()
    const idx = incidents.findIndex(i => i.id === id)
    if (idx !== -1) {
      const old = incidents[idx].status
      incidents[idx].status = newStatus
      incidents[idx].history = incidents[idx].history || []
      incidents[idx].history.push({
        from: old,
        to: newStatus,
        note: note || `Status updated to ${newStatus}`,
        timestamp: new Date().toISOString(),
        actor
      })
      saveIncidents(incidents)
    }
  },

  // Backward compatibility alias for DashboardPage
  updateStatus(id, newStatus, note = '', actor = 'Authority Officer') {
    this.transitionStatus(id, newStatus, note, actor)
  },

  assignCrew(id, crewName) {
    const incidents = getStoredIncidents()
    const idx = incidents.findIndex(i => i.id === id)
    if (idx !== -1) {
      incidents[idx].assigned_crew = crewName
      incidents[idx].status = 'in_progress'
      incidents[idx].history = incidents[idx].history || []
      incidents[idx].history.push({
        from: 'acknowledged',
        to: 'in_progress',
        note: `Assigned to ${crewName}`,
        timestamp: new Date().toISOString(),
        actor: 'Municipal Dispatch'
      })
      saveIncidents(incidents)
    }
  },

  submitResolutionEvidence(id, evidencePhotoUrl, contractorNote) {
    const incidents = getStoredIncidents()
    const idx = incidents.findIndex(i => i.id === id)
    if (idx !== -1) {
      const old = incidents[idx].status
      incidents[idx].status = 'pending_verification'
      incidents[idx].evidence_url = evidencePhotoUrl
      incidents[idx].history = incidents[idx].history || []
      incidents[idx].history.push({
        from: old,
        to: 'pending_verification',
        note: contractorNote || 'Photographic resolution evidence uploaded by repair crew',
        timestamp: new Date().toISOString(),
        actor: 'Contractor Crew'
      })
      saveIncidents(incidents)
    }
  },

  verifyResolution(id, auditorNote) {
    const incidents = getStoredIncidents()
    const idx = incidents.findIndex(i => i.id === id)
    if (idx !== -1) {
      const old = incidents[idx].status
      incidents[idx].status = 'verified_resolved'
      incidents[idx].history = incidents[idx].history || []
      incidents[idx].history.push({
        from: old,
        to: 'verified_resolved',
        note: auditorNote || 'Passed engineering audit. Resolution certified and closed.',
        timestamp: new Date().toISOString(),
        actor: 'Municipal Inspector'
      })
      saveIncidents(incidents)
    }
  },

  upvote(id) {
    const incidents = getStoredIncidents()
    const idx = incidents.findIndex(i => i.id === id)
    if (idx !== -1) {
      incidents[idx].votes = (incidents[idx].votes || 0) + 1
      saveIncidents(incidents)
      return incidents[idx].votes
    }
    return 0
  },

  // Ranked Queue with crash-proof priority score calculation & mode filtering
  getRankedQueue(deptFilter = 'all', statusFilter = 'all', modeFilter = 'all') {
    let list = getStoredIncidents()

    if (deptFilter !== 'all') {
      list = list.filter(i => i.dept === deptFilter)
    }

    if (statusFilter !== 'all') {
      list = list.filter(i => i.status === statusFilter)
    }

    if (modeFilter === 'live') {
      list = list.filter(i => !i.isDemo)
    } else if (modeFilter === 'demo') {
      list = list.filter(i => !!i.isDemo)
    }

    const withScores = list.map(item => {
      let priorityMeta
      try {
        priorityMeta = calculatePriorityScore({
          severity: item.severity,
          address: item.address,
          title: item.title,
          votes: item.votes,
          createdAt: item.created_at
        })
      } catch {
        priorityMeta = {
          score: 50,
          components: { S: 50, E: 50, C: 20, T: 10 },
          isUrgent: false,
          urgencyLabel: 'Normal'
        }
      }

      return {
        ...item,
        priorityMeta: priorityMeta || {
          score: 50,
          components: { S: 50, E: 50, C: 20, T: 10 },
          isUrgent: false,
          urgencyLabel: 'Normal'
        }
      }
    })

    return withScores.sort((a, b) => {
      const aDone = a.status === 'verified_resolved'
      const bDone = b.status === 'verified_resolved'
      if (aDone && !bDone) return 1
      if (!aDone && bDone) return -1
      return (b.priorityMeta?.score || 0) - (a.priorityMeta?.score || 0)
    })
  },

  getStats() {
    const all = getStoredIncidents()
    const live = all.filter(i => !i.isDemo)
    const demo = all.filter(i => !!i.isDemo)

    return {
      total: all.length,
      liveCount: live.length,
      demoCount: demo.length,
      open: all.filter(i => i.status === 'open').length,
      acknowledged: all.filter(i => i.status === 'acknowledged').length,
      inProgress: all.filter(i => i.status === 'in_progress').length,
      pendingVerification: all.filter(i => i.status === 'pending_verification').length,
      verifiedResolved: all.filter(i => i.status === 'verified_resolved').length,
      criticalCount: all.filter(i => i.severity === 'critical' && i.status !== 'verified_resolved').length,
    }
  },

  getAlerts() {
    // Dynamically returns recent critical or severe incidents
    const all = getStoredIncidents()
    const criticals = all.filter(i => i.severity === 'critical' || i.category === 'flooding').slice(0, 5)
    
    if (criticals.length > 0) {
      return criticals.map((inc, idx) => ({
        id: `alt-${idx + 1}`,
        type: inc.category === 'flooding' ? 'monsoon' : 'critical',
        title: inc.title,
        description: inc.description,
        time: 'Active now',
        incidentId: inc.id,
        isDemo: inc.isDemo
      }))
    }

    return [
      {
        id: 'alt-1',
        type: 'critical',
        title: 'High Voltage Hazard on Koramangala 4th Block',
        description: 'Dangling live wire reported near residential area. BESCOM line crew dispatched.',
        time: '12m ago',
        incidentId: 'RASTA-8042',
        isDemo: true
      }
    ]
  }
}

