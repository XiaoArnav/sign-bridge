// ─── RASTA Final UI/UX Blueprint: Types, Categories & 5-Step Workflow ────────

export const HAZARD_CATEGORIES = [
  { id: 'wire',     label: 'Electrical Danger',       emoji: '⚡',  color: '#EF4444', dept: 'BESCOM', defaultSeverity: 'critical', desc: 'Dangling live wire or transformer leak' },
  { id: 'manhole',  label: 'Open Manhole',            emoji: '⚠️',  color: '#EF4444', dept: 'BWSSB',  defaultSeverity: 'critical', desc: 'Missing or sunken drain/sewer cover' },
  { id: 'pothole',  label: 'Pothole / Road Defect',   emoji: '🕳️',  color: '#F59E0B', dept: 'BBMP',   defaultSeverity: 'high',     desc: 'Asphalt crater or road surface collapse' },
  { id: 'flooding', label: 'Waterlogging',            emoji: '🌊',  color: '#60A5FA', dept: 'BWSSB',  defaultSeverity: 'high',     desc: 'Submerged street or clogged monsoon drain' },
  { id: 'footpath', label: 'Broken Footpath',         emoji: '🚧',  color: '#8B5CF6', dept: 'BBMP',   defaultSeverity: 'medium',   desc: 'Damaged walkway or missing curb stones' },
  { id: 'other',    label: 'Other Road Hazard',       emoji: '📍',  color: '#94A3B8', dept: 'TRAFFIC',defaultSeverity: 'medium',   desc: 'Fallen tree, traffic light, or debris' },
]

export const SEVERITY_LEVELS = [
  { id: 'critical', label: 'Critical', desc: 'Imminent threat to life',  badgeClass: 'badge-critical', dot: 'bg-red-500' },
  { id: 'high',     label: 'High',     desc: 'Severe accident / vehicle risk', badgeClass: 'badge-high', dot: 'bg-amber-500' },
  { id: 'medium',   label: 'Medium',   desc: 'Pedestrian obstacle',       badgeClass: 'badge-medium', dot: 'bg-blue-400' },
  { id: 'low',      label: 'Low',      desc: 'Minor defect',              badgeClass: 'bg-slate-700/40 text-slate-400 border border-slate-600/30 font-bold px-2 py-0.5 rounded-full text-xs', dot: 'bg-slate-400' },
]

// ── Complete 5-State Workflow (Blueprint Section 6) ─────────────────────────
export const STATUS_WORKFLOW = {
  open: {
    id: 'open',
    label: 'Open',
    badgeClass: 'bg-red-500/10 text-red-400 border border-red-500/30',
    stepNumber: 1,
    desc: 'Newly reported, awaiting municipal triage'
  },
  acknowledged: {
    id: 'acknowledged',
    label: 'Acknowledged',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30',
    stepNumber: 2,
    desc: 'Department reviewed and logged in work-order backlog'
  },
  in_progress: {
    id: 'in_progress',
    label: 'In Progress',
    badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    stepNumber: 3,
    desc: 'Field crew assigned on-site for physical repair'
  },
  pending_verification: {
    id: 'pending_verification',
    label: 'Resolved — Pending Verification',
    badgeClass: 'bg-sky-500/10 text-sky-400 border border-sky-500/30',
    stepNumber: 4,
    desc: 'Contractor uploaded "AFTER" photo proof, awaiting inspection'
  },
  verified_resolved: {
    id: 'verified_resolved',
    label: 'Verified Resolved',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    stepNumber: 5,
    desc: 'Passed quality audit. Repair confirmed complete.'
  },
}

export const DEPARTMENTS = {
  BBMP:    { code: 'BBMP',    name: 'Municipal Road Wing', icon: '🏛️' },
  BESCOM:  { code: 'BESCOM',  name: 'Electricity Transmission', icon: '⚡' },
  BWSSB:   { code: 'BWSSB',   name: 'Water & Sewerage Board', icon: '🚰' },
  TRAFFIC: { code: 'TRAFFIC', name: 'Traffic Police Division', icon: '🚦' },
}

export const getCategory = (id) => HAZARD_CATEGORIES.find(c => c.id === id) || HAZARD_CATEGORIES[0]
export const getSeverity = (id) => SEVERITY_LEVELS.find(s => s.id === id) || SEVERITY_LEVELS[0]
export const getStatus   = (id) => STATUS_WORKFLOW[id] || STATUS_WORKFLOW.open
