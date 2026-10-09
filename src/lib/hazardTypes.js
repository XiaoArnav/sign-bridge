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
  { id: 'critical', label: 'Critical', desc: 'Imminent threat to life',  badgeClass: 'bg-[#C62828]/10 text-[#C62828] border border-[#C62828]/20 font-medium px-2.5 py-0.5 rounded-full text-[11px]', dot: 'bg-[#C62828]' },
  { id: 'high',     label: 'High',     desc: 'Severe accident / vehicle risk', badgeClass: 'bg-[#B7791F]/10 text-[#B7791F] border border-[#B7791F]/20 font-medium px-2.5 py-0.5 rounded-full text-[11px]', dot: 'bg-[#B7791F]' },
  { id: 'medium',   label: 'Medium',   desc: 'Pedestrian obstacle',       badgeClass: 'bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/20 font-medium px-2.5 py-0.5 rounded-full text-[11px]', dot: 'bg-[#4F46E5]' },
  { id: 'low',      label: 'Low',      desc: 'Minor defect',              badgeClass: 'bg-[#F3F3F0] text-[#626262] border border-[#E7E5E0] font-medium px-2.5 py-0.5 rounded-full text-[11px]', dot: 'bg-[#858585]' },
]

// ── Complete 5-State Workflow (Blueprint Section 6) ─────────────────────────
export const STATUS_WORKFLOW = {
  open: {
    id: 'open',
    label: 'Open',
    badgeClass: 'bg-[#C62828]/10 text-[#C62828] border border-[#C62828]/20 text-[11px] font-medium px-2.5 py-0.5 rounded-full inline-block',
    stepNumber: 1,
    desc: 'Newly reported, awaiting municipal triage'
  },
  acknowledged: {
    id: 'acknowledged',
    label: 'Acknowledged',
    badgeClass: 'bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/20 text-[11px] font-medium px-2.5 py-0.5 rounded-full inline-block',
    stepNumber: 2,
    desc: 'Department reviewed and logged in work-order backlog'
  },
  in_progress: {
    id: 'in_progress',
    label: 'In Progress',
    badgeClass: 'bg-[#B7791F]/10 text-[#B7791F] border border-[#B7791F]/20 text-[11px] font-medium px-2.5 py-0.5 rounded-full inline-block',
    stepNumber: 3,
    desc: 'Field crew assigned on-site for physical repair'
  },
  pending_verification: {
    id: 'pending_verification',
    label: 'Resolved — Pending Verification',
    badgeClass: 'bg-[#0F8B72]/10 text-[#0F8B72] border border-[#0F8B72]/20 text-[11px] font-medium px-2.5 py-0.5 rounded-full inline-block',
    stepNumber: 4,
    desc: 'Contractor uploaded "AFTER" photo proof, awaiting inspection'
  },
  verified_resolved: {
    id: 'verified_resolved',
    label: 'Verified Resolved',
    badgeClass: 'bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20 text-[11px] font-medium px-2.5 py-0.5 rounded-full inline-block',
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
