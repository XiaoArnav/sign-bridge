/**
 * RASTA Central Data Store
 * Multi-city national coverage (Bengaluru, Mumbai, Delhi-NCR, Chennai),
 * 5-state transitions, audit history, voice notes, and alerts.
 */

import { calculatePriorityScore } from './priorityEngine.js'
import { getCategory } from './hazardTypes.js'

const INCIDENTS_KEY = 'rasta_incidents_v5'
const MY_REPORTS_KEY = 'rasta_my_reports_v5'

export const CITIES = [
  { id: 'bengaluru', name: 'Bengaluru', center: [12.9716, 77.5946], zoom: 13, state: 'Karnataka' },
  { id: 'mumbai',    name: 'Mumbai',    center: [19.0760, 72.8777], zoom: 12, state: 'Maharashtra' },
  { id: 'delhi',     name: 'Delhi-NCR', center: [28.6139, 77.2090], zoom: 12, state: 'Delhi' },
  { id: 'chennai',   name: 'Chennai',   center: [13.0827, 80.2707], zoom: 12, state: 'Tamil Nadu' },
]

const SEED_INCIDENTS = [
  // ── BENGALURU ─────────────────────────────────────────────────────────────
  {
    id: 'RASTA-8042',
    city: 'bengaluru',
    category: 'wire',
    severity: 'critical',
    title: 'Live 11kV transformer cable dangling into rainwater puddle',
    description: 'Transformer wire snapped following heavy monsoon storm. Touching active pedestrian pavement near school.',
    latitude: 12.9352,
    longitude: 77.6245,
    address: '8th Main, 4th Block, Koramangala, Bengaluru',
    photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    evidence_url: null,
    status: 'open',
    reporter_name: 'Ananya Sharma (Resident)',
    dept: 'BESCOM',
    assigned_crew: null,
    votes: 38,
    created_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Incident logged via Citizen Mobile Web App with GPS coordinates', timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), actor: 'Citizen App' }
    ]
  },
  {
    id: 'RASTA-7911',
    city: 'bengaluru',
    category: 'manhole',
    severity: 'critical',
    title: 'Uncovered sewer pit on active two-wheeler lane',
    description: 'Cast iron cover shattered. Zero visibility at night. Two scooterists reported skidding.',
    latitude: 12.9716,
    longitude: 77.5946,
    address: 'Opposite Shanthi Nagar Bus Depot, Bengaluru',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    evidence_url: null,
    status: 'in_progress',
    reporter_name: 'Sunil Gowda (Commuter)',
    dept: 'BWSSB',
    assigned_crew: 'BWSSB Ward #112 Emergency Squad',
    votes: 46,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Citizen report logged with photographic evidence', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), actor: 'Citizen App' },
      { from: 'open', to: 'acknowledged', note: 'BWSSB Central Triage acknowledged incident', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), actor: 'Dispatch Officer' },
      { from: 'acknowledged', to: 'in_progress', note: 'Field crew assigned. Steel barricades dispatched to site', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), actor: 'Ward Engineer' }
    ]
  },
  {
    id: 'RASTA-7530',
    city: 'bengaluru',
    category: 'pothole',
    severity: 'high',
    title: 'Severe 10-inch asphalt collapse on bridge descent',
    description: 'Deep road crater on bridge ramp causing sudden emergency braking by vehicles.',
    latitude: 12.9900,
    longitude: 77.5500,
    address: 'Navrang Bridge Down-Ramp, Rajajinagar, Bengaluru',
    photo_url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&auto=format&fit=crop&q=80',
    evidence_url: 'https://images.unsplash.com/photo-1578965879900-b601614777e5?w=600&auto=format&fit=crop&q=80',
    status: 'pending_verification',
    reporter_name: 'Rajesh V.',
    dept: 'BBMP',
    assigned_crew: 'BBMP Road Maintenance Wing',
    votes: 21,
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Citizen incident logged', timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), actor: 'Citizen App' },
      { from: 'open', to: 'in_progress', note: 'BBMP Road Contractor assigned for asphalt hot-mix patch', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), actor: 'Executive Engineer' },
      { from: 'in_progress', to: 'pending_verification', note: 'Contractor uploaded "AFTER" photo proof. Awaiting physical audit inspection', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), actor: 'Contractor App' }
    ]
  },
  {
    id: 'RASTA-7102',
    city: 'bengaluru',
    category: 'footpath',
    severity: 'medium',
    title: 'Damaged concrete pavers obstructing senior citizens',
    description: 'Collapsed pavement slabs forcing pedestrians into moving vehicular traffic.',
    latitude: 12.9780,
    longitude: 77.6400,
    address: '100 Feet Road, Indiranagar, Bengaluru',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    evidence_url: 'https://images.unsplash.com/photo-1578965879900-b601614777e5?w=600&auto=format&fit=crop&q=80',
    status: 'verified_resolved',
    reporter_name: 'Meera Iyer',
    dept: 'BBMP',
    assigned_crew: 'Zone East PWD Contractor',
    votes: 14,
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Logged by neighborhood resident', timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), actor: 'Citizen App' },
      { from: 'open', to: 'in_progress', note: 'PWD footpath repair scheduled', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), actor: 'Ward Engineer' },
      { from: 'in_progress', to: 'pending_verification', note: 'New paver blocks installed with photo proof', timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), actor: 'Contractor' },
      { from: 'pending_verification', to: 'verified_resolved', note: 'Passed audit by Municipal Quality Inspector. Resolution certified.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), actor: 'Chief Inspector' }
    ]
  },

  // ── MUMBAI ────────────────────────────────────────────────────────────────
  {
    id: 'RASTA-9104',
    city: 'mumbai',
    category: 'flooding',
    severity: 'critical',
    title: 'Severe flash flooding and submerged drain pit in Andheri Subway',
    description: 'Andheri vehicular subway submerged under 3.5 feet rainwater. Both carriageways closed for traffic.',
    latitude: 19.1197,
    longitude: 72.8468,
    address: 'Andheri Subway, Andheri West, Mumbai',
    photo_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80',
    evidence_url: null,
    status: 'open',
    reporter_name: 'Mumbai Traffic Eye',
    dept: 'BMC / Disaster Management',
    votes: 52,
    created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Alert ingested via Mumbai Traffic Police OSINT feed', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), actor: 'OSINT' }
    ]
  },
  {
    id: 'RASTA-9231',
    city: 'mumbai',
    category: 'pothole',
    severity: 'high',
    title: 'Cluster of 5 craters on Western Express Highway flyover ramp',
    description: 'Heavy vehicle impact created sharp road pits on southbound lane near Bandra-Kurla Complex turn.',
    latitude: 19.0600,
    longitude: 72.8500,
    address: 'Western Express Highway, Kalanagar, Bandra, Mumbai',
    photo_url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&auto=format&fit=crop&q=80',
    evidence_url: null,
    status: 'in_progress',
    reporter_name: 'Auto Drivers Union',
    dept: 'MMRDA',
    votes: 34,
    created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Citizen mobile log', timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), actor: 'Citizen App' },
      { from: 'open', to: 'in_progress', note: 'MMRDA Highway Maintenance unit dispatched', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), actor: 'Highway Control' }
    ]
  },

  // ── DELHI-NCR ─────────────────────────────────────────────────────────────
  {
    id: 'RASTA-6201',
    city: 'delhi',
    category: 'wire',
    severity: 'critical',
    title: 'Snapped overhead power cable touching water-filled pothole',
    description: 'High-voltage cable downed near ITO junction. Pavement electrified during drizzle.',
    latitude: 28.6289,
    longitude: 77.2405,
    address: 'ITO Ring Road Junction, New Delhi',
    photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    evidence_url: null,
    status: 'open',
    reporter_name: 'Deepak Verma',
    dept: 'BSES / Delhi Power',
    votes: 61,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Direct Citizen Report with high corroboration score', timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), actor: 'Citizen App' }
    ]
  },

  // ── CHENNAI ───────────────────────────────────────────────────────────────
  {
    id: 'RASTA-5120',
    city: 'chennai',
    category: 'flooding',
    severity: 'high',
    title: 'Stormwater drain silting overflow at Velachery Main Road',
    description: 'Clogged canal causing 1.5 feet water stagnation across bus stops. Commuters unable to access walkways.',
    latitude: 12.9791,
    longitude: 80.2212,
    address: 'Velachery Main Road, Chennai',
    photo_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80',
    evidence_url: null,
    status: 'in_progress',
    reporter_name: 'K. Balaji',
    dept: 'Greater Chennai Corporation',
    votes: 29,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    history: [
      { from: null, to: 'open', note: 'Logged via RASTA Mobile Web', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), actor: 'Citizen' },
      { from: 'open', to: 'in_progress', note: 'GCC Ward #177 desilting super-sucker deployed', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), actor: 'Zonal Officer' }
    ]
  }
]

function getStoredIncidents() {
  try {
    const raw = localStorage.getItem(INCIDENTS_KEY)
    if (!raw) {
      localStorage.setItem(INCIDENTS_KEY, JSON.stringify(SEED_INCIDENTS))
      return SEED_INCIDENTS
    }
    return JSON.parse(raw)
  } catch {
    return SEED_INCIDENTS
  }
}

function saveIncidents(incidents) {
  localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents))
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
    localStorage.setItem(MY_REPORTS_KEY, JSON.stringify(list))
  }
}

export const hazardStore = {
  getAll(cityFilter = 'all') {
    const all = getStoredIncidents()
    if (cityFilter === 'all') return all
    return all.filter(i => (i.city || 'bengaluru') === cityFilter)
  },

  getById(id) {
    return getStoredIncidents().find(i => i.id === id)
  },

  getMyReports() {
    const ids = getStoredMyReports()
    const all = getStoredIncidents()
    return all.filter(i => ids.includes(i.id))
  },

  createReport({ category, severity, title, description, latitude, longitude, address, photo_url, voice_note, reporter_name, city = 'bengaluru' }) {
    const incidents = getStoredIncidents()
    const catInfo = getCategory(category)
    const reportId = `RASTA-${Math.floor(1000 + Math.random() * 9000)}`
    
    const newIncident = {
      id: reportId,
      city,
      category,
      severity: severity || catInfo.defaultSeverity,
      title: title || `${catInfo.label} reported near ${address?.split(',')[0] || 'Road'}`,
      description: description || `Urgent road safety defect reported by commuter.`,
      latitude,
      longitude,
      address,
      photo_url,
      evidence_url: null,
      voice_note: voice_note || null,
      status: 'open',
      reporter_name: reporter_name || 'Verified Citizen',
      dept: catInfo.dept,
      assigned_crew: null,
      votes: 1,
      created_at: new Date().toISOString(),
      history: [
        { from: null, to: 'open', note: 'Incident logged via Citizen Mobile Web App', timestamp: new Date().toISOString(), actor: 'Citizen App' }
      ]
    }

    incidents.unshift(newIncident)
    saveIncidents(incidents)
    recordMyReportId(reportId)
    return newIncident
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

  getRankedQueue(deptFilter = 'all', statusFilter = 'all') {
    let list = getStoredIncidents()

    if (deptFilter !== 'all') {
      list = list.filter(i => i.dept === deptFilter)
    }

    if (statusFilter !== 'all') {
      list = list.filter(i => i.status === statusFilter)
    }

    const withScores = list.map(item => {
      const priorityMeta = calculatePriorityScore({
        severity: item.severity,
        address: item.address,
        votes: item.votes,
        createdAt: item.created_at
      })
      return { ...item, priorityMeta }
    })

    return withScores.sort((a, b) => {
      const aDone = a.status === 'verified_resolved'
      const bDone = b.status === 'verified_resolved'
      if (aDone && !bDone) return 1
      if (!aDone && bDone) return -1
      return b.priorityMeta.score - a.priorityMeta.score
    })
  },

  getStats() {
    const all = getStoredIncidents()
    return {
      total: all.length,
      open: all.filter(i => i.status === 'open').length,
      acknowledged: all.filter(i => i.status === 'acknowledged').length,
      inProgress: all.filter(i => i.status === 'in_progress').length,
      pendingVerification: all.filter(i => i.status === 'pending_verification').length,
      verifiedResolved: all.filter(i => i.status === 'verified_resolved').length,
      criticalCount: all.filter(i => i.severity === 'critical' && i.status !== 'verified_resolved').length,
    }
  },

  getAlerts() {
    return [
      {
        id: 'alt-1',
        type: 'critical',
        title: 'High Voltage Hazard on Koramangala 4th Block',
        description: 'Dangling live wire reported 450m from your area. BESCOM line crew dispatched. Exercise caution.',
        time: '12m ago',
        incidentId: 'RASTA-8042'
      },
      {
        id: 'alt-2',
        type: 'monsoon',
        title: 'Flash Waterlogging Alert: Shanthi Nagar',
        description: 'Rainwater drain overflowing near Bus Stand. Road visibility low. Multiple submerged manholes.',
        time: '1h ago',
        incidentId: 'RASTA-7911'
      },
      {
        id: 'alt-3',
        type: 'critical',
        title: 'Mumbai Flooding: Andheri Subway Inundated',
        description: 'Subway waterlogged under 3.5ft water. Traffic diverted to SV Road.',
        time: '1.5h ago',
        incidentId: 'RASTA-9104'
      }
    ]
  }
}
