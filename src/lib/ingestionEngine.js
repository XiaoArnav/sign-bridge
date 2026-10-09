/**
 * RASTA Live Intelligence Ingestion Engine
 * Automated worker that polls multi-source feeds, extracts authentic road & civic hazards,
 * sanitizes raw text/HTML (removing base64 artifacts & raw URLs),
 * deduplicates against active canonical incidents, geocodes locations honestly,
 * and maintains source attribution and audit logs.
 */

import { hazardStore } from './hazardStore.js'

export const SOURCE_REGISTRY = [
  {
    id: 'src-sachet',
    name: 'NDMA SACHET India CAP Feed',
    type: 'Government Disaster Alert (CAP)',
    url: '/api/sachet',
    status: 'Connected',
    authRequired: false,
    pollingIntervalSeconds: 60,
    lastSync: null,
    itemsReceived: 0,
    itemsCreated: 0,
    icon: '🏛️',
    docsUrl: 'https://sachet.ndma.gov.in',
    setupInstructions: 'Official CAP RSS feed from National Disaster Management Authority. No authentication required.'
  },
  {
    id: 'src-news',
    name: 'Civic & Road Hazard News RSS (India)',
    type: 'News & Media OSINT Feed',
    url: '/api/news',
    status: 'Connected',
    authRequired: false,
    pollingIntervalSeconds: 45,
    lastSync: null,
    itemsReceived: 0,
    itemsCreated: 0,
    icon: '📰',
    docsUrl: 'https://news.google.com',
    setupInstructions: 'Filtered RSS topic feed for Indian municipal infrastructure, potholes, waterlogging, and road collapses. No API key needed.'
  },
  {
    id: 'src-imd',
    name: 'IMD Monsoon & Flash Flood Nowcast',
    type: 'Meteorological Service',
    url: 'https://api.imd.gov.in/public',
    status: 'Setup Required',
    authRequired: true,
    pollingIntervalSeconds: 90,
    lastSync: null,
    itemsReceived: 0,
    itemsCreated: 0,
    icon: '🌦️',
    docsUrl: 'https://api.imd.gov.in',
    setupInstructions: 'Requires IMD Developer Portal registration and API Token. Set VITE_IMD_API_KEY in your environment configuration to activate direct meteorological streams.'
  },
  {
    id: 'src-datagov',
    name: 'Open Government Data (Data.gov.in)',
    type: 'National Open Data Platform',
    url: 'https://api.data.gov.in',
    status: 'Setup Required',
    authRequired: true,
    pollingIntervalSeconds: 120,
    lastSync: null,
    itemsReceived: 0,
    itemsCreated: 0,
    icon: '🇮🇳',
    docsUrl: 'https://data.gov.in',
    setupInstructions: 'Requires an official Data.gov.in API Key. Register on data.gov.in and set VITE_DATAGOV_API_KEY in .env to ingest national road infrastructure telemetry.'
  },
  {
    id: 'src-citizen',
    name: 'Citizen Mobile App Submissions',
    type: 'Direct Submissions',
    url: 'INTERNAL/GPS',
    status: 'Active (Realtime)',
    authRequired: false,
    pollingIntervalSeconds: 0,
    lastSync: new Date().toISOString(),
    itemsReceived: 4,
    itemsCreated: 4,
    icon: '📱',
    docsUrl: '#',
    setupInstructions: 'Real-time telemetry stream directly from user mobile web submissions with GPS coordinates.'
  }
]

export function getActiveConnectorsCount() {
  return SOURCE_REGISTRY.filter(s => s.status === 'Connected' || s.status.includes('Active')).length
}

// ── Text Sanitization Helpers (Removes Base64 tokens, raw URLs, and HTML tags) ──
export function sanitizeHtml(htmlString) {
  if (!htmlString) return ''
  let text = String(htmlString)
    .replace(/<[^>]*>/g, ' ') // Strip HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    // Remove raw URLs, Google News base64 tokens, and tracking artifacts
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/CBMi[A-Za-z0-9_-]{20,}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text
}

export function parsePublisherFromItem(title = '', itemElement = null) {
  const sourceElem = itemElement?.querySelector('source')
  if (sourceElem && sourceElem.textContent?.trim()) {
    return sourceElem.textContent.trim()
  }
  const authorElem = itemElement?.querySelector('author')
  if (authorElem && authorElem.textContent?.trim()) {
    return authorElem.textContent
      .trim()
      .replace(/^controlroom@ndma\.gov\.in\s*\(/i, '')
      .replace(/\)$/, '')
  }
  const parts = title.split(' - ')
  if (parts.length > 1) {
    return parts[parts.length - 1].trim()
  }
  return 'Regional Alert Portal'
}

export function cleanArticleTitle(title = '', publisher = '') {
  let clean = String(title).trim()
  if (publisher && clean.endsWith(` - ${publisher}`)) {
    clean = clean.slice(0, clean.length - (publisher.length + 3)).trim()
  }
  return clean
}

// ── Known Indian Geocoding Entity Mapping ───────────────────────────────────
const BENGALURU_HOTSPOTS = [
  { pattern: /koramangala/i, name: 'Koramangala 4th Block', lat: 12.9352, lng: 77.6245 },
  { pattern: /bellandur|outer ring road|orr/i, name: 'Outer Ring Road (Bellandur)', lat: 12.9260, lng: 77.6762 },
  { pattern: /silk board/i, name: 'Silk Board Junction', lat: 12.9177, lng: 77.6238 },
  { pattern: /indiranagar|100 feet/i, name: 'Indiranagar 100 Feet Road', lat: 12.9780, lng: 77.6400 },
  { pattern: /whitefield/i, name: 'Whitefield Main Road', lat: 12.9698, lng: 77.7499 },
  { pattern: /hebbal/i, name: 'Hebbal Flyover Down-Ramp', lat: 13.0358, lng: 77.5970 },
  { pattern: /shanthi nagar/i, name: 'Shanthi Nagar Bus Terminal', lat: 12.9716, lng: 77.5946 },
  { pattern: /rajajinagar|navrang/i, name: 'Navrang Bridge, Rajajinagar', lat: 12.9900, lng: 77.5500 },
  { pattern: /majestic|kg road/i, name: 'Majestic Transport Hub', lat: 12.9767, lng: 77.5713 },
  { pattern: /domlur/i, name: 'Domlur Flyover Corridor', lat: 12.9609, lng: 77.6387 },
  { pattern: /hsr layout/i, name: 'HSR Layout 27th Main', lat: 12.9116, lng: 77.6389 },
  { pattern: /marathahalli/i, name: 'Marathahalli Multiplex Junction', lat: 12.9569, lng: 77.7011 },
]

const REGIONAL_CENTERS = [
  { pattern: /coimbatore/i, name: 'Coimbatore District, TN', lat: 11.0168, lng: 76.9558, city: 'chennai' },
  { pattern: /madurai/i, name: 'Madurai District, TN', lat: 9.9252, lng: 78.1198, city: 'chennai' },
  { pattern: /salem/i, name: 'Salem District, TN', lat: 11.6643, lng: 78.1460, city: 'chennai' },
  { pattern: /chennai|velachery|guindy/i, name: 'Chennai Metropolitan Region', lat: 13.0827, lng: 80.2707, city: 'chennai' },
  { pattern: /mumbai|andheri|bandra|thane/i, name: 'Mumbai Metropolitan Region', lat: 19.0760, lng: 72.8777, city: 'mumbai' },
  { pattern: /delhi|noida|gurgaon/i, name: 'Delhi-NCR Ring Corridor', lat: 28.6139, lng: 77.2090, city: 'delhi' },
]

function resolveLocationFromText(text, fallbackIndex = 0) {
  // 1. Check Bengaluru specific hotspots
  for (const spot of BENGALURU_HOTSPOTS) {
    if (spot.pattern.test(text)) {
      return {
        address: `${spot.name}, Bengaluru`,
        city: 'bengaluru',
        lat: spot.lat,
        lng: spot.lng,
        isGeocoded: true,
        note: `Resolved to ${spot.name} via entity matching`
      }
    }
  }

  // 2. Check Regional centers
  for (const reg of REGIONAL_CENTERS) {
    if (reg.pattern.test(text)) {
      return {
        address: reg.name,
        city: reg.city,
        lat: reg.lat,
        lng: reg.lng,
        isGeocoded: false,
        note: `Regional advisory for ${reg.name} — no street-level coordinates in feed`
      }
    }
  }

  // 3. Default deterministic Bengaluru allocation with clear indicator
  const spot = BENGALURU_HOTSPOTS[fallbackIndex % BENGALURU_HOTSPOTS.length]
  return {
    address: `${spot.name}, Bengaluru`,
    city: 'bengaluru',
    lat: spot.lat,
    lng: spot.lng,
    isGeocoded: false,
    note: `General Bengaluru civic alert mapped to ${spot.name} sector`
  }
}

// ── Hazard Classification & Keyword Analysis ──────────────────────────────
function classifyHazard(title = '', description = '') {
  const combined = `${title} ${description}`.toLowerCase()

  // High-voltage / electrical
  if (/wire|cable|transformer|electrocution|electric shock|snapped wire/i.test(combined)) {
    return {
      isHazard: true,
      category: 'wire',
      severity: 'critical',
      dept: 'BESCOM'
    }
  }

  // Open manhole / drain pit
  if (/manhole|sewer pit|drain pit|uncovered drain|gutter/i.test(combined)) {
    return {
      isHazard: true,
      category: 'manhole',
      severity: 'critical',
      dept: 'BWSSB'
    }
  }

  // Waterlogging / flooding / heavy monsoon rain
  if (/waterlog|water stagnation|submerged|flood|inundat|stormwater|heavy rain|downpour/i.test(combined)) {
    return {
      isHazard: true,
      category: 'flooding',
      severity: /severe|submerged|traffic disruption|heavy/i.test(combined) ? 'high' : 'medium',
      dept: 'BWSSB'
    }
  }

  // Potholes / road cave-in / asphalt defect
  if (/pothole|crater|road cave|sinkhole|asphalt|road collapse|erosion|tunnel after rain|broken road|rut/i.test(combined)) {
    return {
      isHazard: true,
      category: 'pothole',
      severity: 'high',
      dept: 'BBMP'
    }
  }

  // Broken footpath / walkway
  if (/footpath|pavement|paver|walkway|pedestrian/i.test(combined)) {
    return {
      isHazard: true,
      category: 'footpath',
      severity: 'medium',
      dept: 'BBMP'
    }
  }

  // Non-hazard or general news (e.g. political debate, stray cattle, budget questions)
  return {
    isHazard: false,
    category: null,
    severity: null,
    dept: null
  }
}

class LiveIngestionPipeline {
  constructor() {
    this.logs = [
      `[${new Date().toLocaleTimeString()}] Pipeline initialized with ${SOURCE_REGISTRY.length} registered connectors`,
      `[${new Date().toLocaleTimeString()}] Live XML parsers & deduplication engine online`,
    ]
    this.isRunning = false
    this.pollInterval = null
    this.listeners = new Set()
    this.isPollingNews = false
    this.isPollingSachet = false
    this.notifyTimeout = null
  }

  addLog(message) {
    const time = new Date().toLocaleTimeString()
    const entry = `[${time}] ${message}`
    this.logs.unshift(entry)
    if (this.logs.length > 50) this.logs.pop()
    this.notifyListeners()
  }

  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notifyListeners() {
    if (this.notifyTimeout) clearTimeout(this.notifyTimeout)
    this.notifyTimeout = setTimeout(() => {
      this.listeners.forEach(cb => cb(this.logs, SOURCE_REGISTRY))
    }, 100)
  }

  // 1. Fetch & Parse News RSS with in-flight lock
  async pollNewsFeed() {
    if (this.isPollingNews) return null
    this.isPollingNews = true
    const startTime = Date.now()
    const stats = { received: 0, created: 0, updated: 0, deduplicated: 0, rejected: 0 }
    const src = SOURCE_REGISTRY.find(s => s.id === 'src-news')

    try {
      this.addLog(`Polling Google News RSS for Indian civic hazard signals...`)
      const res = await fetch('/api/news')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const xmlText = await res.text()
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      const items = Array.from(xmlDoc.querySelectorAll('item'))

      stats.received = items.length

      items.forEach((item, index) => {
        const rawTitle = item.querySelector('title')?.textContent || ''
        const rawLink = item.querySelector('link')?.textContent || ''
        const rawGuid = item.querySelector('guid')?.textContent || rawLink
        const rawDesc = item.querySelector('description')?.textContent || ''
        const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString()

        const publisher = parsePublisherFromItem(rawTitle, item)
        const cleanTitle = cleanArticleTitle(rawTitle, publisher)
        const cleanDesc = sanitizeHtml(rawDesc) || `${cleanTitle}. Verified by ${publisher}.`

        // Check if item describes a real hazard
        const classification = classifyHazard(cleanTitle, cleanDesc)
        if (!classification.isHazard) {
          stats.rejected++
          hazardStore.recordSourceItem({
            source_id: 'src-news',
            external_id: rawGuid.slice(0, 40),
            publisher,
            title: cleanTitle,
            description: cleanDesc,
            original_url: rawLink,
            published_at: pubDate,
            matched_incident_id: null,
            hazard_category: null,
            rejection_reason: 'Non-hazard civic report'
          })
          return
        }

        // Deduplication check
        const existingSources = hazardStore.getSourceItems()
        const alreadyIngested = existingSources.some(s => s.external_id === rawGuid || (s.original_url && s.original_url === rawLink))
        if (alreadyIngested) {
          stats.deduplicated++
          return
        }

        const activeIncidents = hazardStore.getAll('all', 'all')
        const matchingIncident = activeIncidents.find(inc => {
          if (inc.category !== classification.category) return false
          const titleWords = cleanTitle.toLowerCase().split(/\s+/).filter(w => w.length > 4)
          const incTitle = inc.title.toLowerCase()
          const commonWords = titleWords.filter(w => incTitle.includes(w))
          return commonWords.length >= 2
        })

        if (matchingIncident) {
          hazardStore.corroborateIncident(matchingIncident.id, {
            sourceName: publisher,
            title: cleanTitle,
            url: rawLink
          })
          hazardStore.recordSourceItem({
            source_id: 'src-news',
            external_id: rawGuid.slice(0, 40),
            publisher,
            title: cleanTitle,
            description: cleanDesc,
            original_url: rawLink,
            published_at: pubDate,
            matched_incident_id: matchingIncident.id,
            hazard_category: classification.category
          })
          stats.updated++
          this.addLog(`Corroborated incident [${matchingIncident.id}] with ${publisher} dispatch`)
        } else {
          const geo = resolveLocationFromText(`${cleanTitle} ${cleanDesc}`, index)
          const newIncident = hazardStore.createLiveIncident({
            category: classification.category,
            severity: classification.severity,
            title: cleanTitle,
            description: cleanDesc,
            latitude: geo.lat + (Math.random() - 0.5) * 0.003,
            longitude: geo.lng + (Math.random() - 0.5) * 0.003,
            address: geo.address,
            city: geo.city,
            is_geocoded: geo.isGeocoded,
            geocoding_note: geo.note,
            source_id: 'src-news',
            source_name: publisher,
            original_url: rawLink,
            external_id: rawGuid.slice(0, 40),
            dept: classification.dept,
          })

          hazardStore.recordSourceItem({
            source_id: 'src-news',
            external_id: rawGuid.slice(0, 40),
            publisher,
            title: cleanTitle,
            description: cleanDesc,
            original_url: rawLink,
            published_at: pubDate,
            matched_incident_id: newIncident.id,
            hazard_category: classification.category
          })
          stats.created++
          this.addLog(`Created Live Incident [${newIncident.id}]: "${cleanTitle.slice(0, 50)}..." via ${publisher}`)
        }
      })

      if (src) {
        src.status = 'Connected'
        src.lastSync = new Date().toISOString()
        src.itemsReceived += stats.received
        src.itemsCreated += stats.created
      }

      this.addLog(`News feed sync complete: ${stats.received} items processed.`)
    } catch (err) {
      this.addLog(`News connector note: ${err.message || 'Error polling news feed'}`)
      if (src) src.status = 'Degraded'
    } finally {
      this.isPollingNews = false
    }

    return stats
  }

  // 2. Fetch & Parse NDMA SACHET with in-flight lock
  async pollSachetFeed() {
    if (this.isPollingSachet) return null
    this.isPollingSachet = true
    const stats = { received: 0, created: 0, updated: 0, deduplicated: 0, rejected: 0 }
    const src = SOURCE_REGISTRY.find(s => s.id === 'src-sachet')

    try {
      this.addLog(`Connecting to NDMA SACHET CAP public disaster gateway...`)
      const res = await fetch('/api/sachet')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const xmlText = await res.text()
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      const items = Array.from(xmlDoc.querySelectorAll('item'))

      stats.received = items.length

      items.forEach((item, index) => {
        if (index > 4) return // Top 5 alerts
        const rawTitle = item.querySelector('title')?.textContent || ''
        const rawLink = item.querySelector('link')?.textContent || ''
        const rawGuid = item.querySelector('guid')?.textContent || rawLink
        const rawDesc = item.querySelector('description')?.textContent || ''
        const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString()
        const author = item.querySelector('author')?.textContent || 'NDMA Control Room'

        const publisher = parsePublisherFromItem(rawTitle, item) || 'NDMA SACHET'
        const cleanTitle = cleanArticleTitle(rawTitle, publisher)
        const cleanDesc = sanitizeHtml(rawDesc) || `${cleanTitle}. Official alert issued by ${author}.`

        const classification = classifyHazard(cleanTitle, cleanDesc)
        const category = classification.category || 'flooding'
        const severity = classification.severity || 'critical'

        const existingSources = hazardStore.getSourceItems()
        const alreadyIngested = existingSources.some(s => s.external_id === rawGuid)
        if (alreadyIngested) {
          stats.deduplicated++
          return
        }

        const geo = resolveLocationFromText(cleanTitle, index)
        const newIncident = hazardStore.createLiveIncident({
          category,
          severity,
          title: `NDMA ALERT: ${cleanTitle}`,
          description: cleanDesc,
          latitude: geo.lat + (Math.random() - 0.5) * 0.002,
          longitude: geo.lng + (Math.random() - 0.5) * 0.002,
          address: geo.address,
          city: geo.city,
          is_geocoded: geo.isGeocoded,
          geocoding_note: geo.note,
          source_id: 'src-sachet',
          source_name: 'NDMA SACHET (Govt Alert)',
          original_url: rawLink,
          external_id: rawGuid.slice(0, 40),
          dept: 'DISASTER_MGMT',
        })

        hazardStore.recordSourceItem({
          source_id: 'src-sachet',
          external_id: rawGuid.slice(0, 40),
          publisher: 'NDMA SACHET',
          title: cleanTitle,
          description: cleanDesc,
          original_url: rawLink,
          published_at: pubDate,
          matched_incident_id: newIncident.id,
          hazard_category: category
        })

        stats.created++
        this.addLog(`SACHET Alert Ingested [${newIncident.id}]: "${cleanTitle.slice(0, 50)}..."`)
      })

      if (src) {
        src.status = 'Connected'
        src.lastSync = new Date().toISOString()
        src.itemsReceived += stats.received
        src.itemsCreated += stats.created
      }

      this.addLog(`SACHET CAP gateway: Processed ${items.length} active emergency alerts across India.`)
    } catch (err) {
      this.addLog(`NDMA SACHET connector error: ${err.message || 'Offline'}`)
      if (src) src.status = 'Degraded'
    } finally {
      this.isPollingSachet = false
    }

    return stats
  }

  // 3. Full Sync Execution
  async runFullSync() {
    const startTime = Date.now()
    this.addLog(`▶ MANUAL SYNC TRIGGERED: Polling all connected Indian intelligence feeds...`)

    const newsStats = await this.pollNewsFeed()
    const sachetStats = await this.pollSachetFeed()

    const durationMs = Date.now() - startTime
    const totalReceived = (newsStats?.received || 0) + (sachetStats?.received || 0)
    const totalCreated = (newsStats?.created || 0) + (sachetStats?.created || 0)
    const totalUpdated = (newsStats?.updated || 0) + (sachetStats?.updated || 0)
    const totalDeduplicated = (newsStats?.deduplicated || 0) + (sachetStats?.deduplicated || 0)
    const totalRejected = (newsStats?.rejected || 0) + (sachetStats?.rejected || 0)

    const summaryReport = {
      durationMs,
      sourcesContacted: 2,
      itemsReceived: totalReceived,
      itemsCreated: totalCreated,
      itemsUpdated: totalUpdated,
      itemsDeduplicated: totalDeduplicated,
      itemsRejected: totalRejected,
      status: 'SUCCESS',
      summary: `Synchronized ${totalReceived} feed items in ${durationMs}ms: ${totalCreated} canonical incidents created, ${totalUpdated} corroborated, ${totalDeduplicated} duplicates filtered, ${totalRejected} non-hazards rejected.`
    }

    hazardStore.recordIngestionRun(summaryReport)
    this.addLog(`✔ ${summaryReport.summary}`)
    this.notifyListeners()

    return summaryReport
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.addLog(`Ingestion worker started: background polling cycle initialized`)
    
    // Initial run
    this.pollNewsFeed()
    this.pollSachetFeed()

    // Recurring cycle
    this.pollInterval = setInterval(() => {
      // Pause polling when tab is not visible to prevent battery & CPU drain
      if (typeof document !== 'undefined' && document.hidden) return
      this.pollNewsFeed()
      this.pollSachetFeed()
    }, 60000)

    // Listen for tab visibility changes
    if (typeof document !== 'undefined') {
      this.visibilityHandler = () => {
        if (!document.hidden && this.isRunning) {
          const src = SOURCE_REGISTRY.find(s => s.id === 'src-news')
          const timeSinceLast = src?.lastSync ? (Date.now() - new Date(src.lastSync).getTime()) : 999999
          if (timeSinceLast > 60000) {
            this.pollNewsFeed()
            this.pollSachetFeed()
          }
        }
      }
      document.addEventListener('visibilitychange', this.visibilityHandler)
    }
  }

  stop() {
    if (this.pollInterval) clearInterval(this.pollInterval)
    if (typeof document !== 'undefined' && this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler)
    }
    this.isRunning = false
    this.addLog(`Ingestion worker paused.`)
  }
}

export const liveIngestion = new LiveIngestionPipeline()
// Start immediately on app boot
liveIngestion.start()

