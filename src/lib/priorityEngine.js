/**
 * RASTA — Algorithmic Incident Priority Engine
 * Computes priority score based on the blueprint model:
 * P = 0.50*S + 0.20*E + 0.15*C + 0.15*T
 * 
 * Where:
 * S = Physical Severity (0-100)
 * E = Public Exposure (traffic/pedestrian route density) (0-100)
 * C = Corroboration (distinct citizen upvotes & duplicate reports) (0-100)
 * T = Time waiting for action (normalized aging factor) (0-100)
 */

export function calculatePriorityScore(hazard) {
  // 1. Physical Severity (S)
  const severityBase = {
    critical: 100, // Imminent threat to life (open manhole, live wire)
    high: 75,      // Major accident risk (deep crater)
    medium: 45,    // Footpath breakage, minor hazards
    low: 20,       // Cosmetic or minor nuisance
  }
  const S = severityBase[hazard.severity] || 40

  // 2. Exposure Factor (E) based on road classification
  // In our model: school zones, arterial roads, bus stations have highest exposure
  const locationText = (hazard.address || '').toLowerCase()
  let E = 50 // default baseline
  if (locationText.includes('station') || locationText.includes('bus') || locationText.includes('school') || locationText.includes('main')) {
    E = 95
  } else if (locationText.includes('market') || locationText.includes('layout') || locationText.includes('road')) {
    E = 75
  } else {
    E = 40
  }

  // 3. Corroboration Factor (C) based on verified citizen upvotes
  // 1 vote = 20, 5 votes = 60, 15+ votes = 100
  const votes = hazard.votes || 1
  const C = Math.min(100, Math.round(votes * 5 + 15))

  // 4. Time Waiting Factor (T)
  // Increases as report sits unaddressed
  const ageHours = (Date.now() - new Date(hazard.createdAt).getTime()) / (1000 * 60 * 60)
  const T = Math.min(100, Math.round(ageHours * 4 + 10))

  // Final Priority Calculation
  const finalScore = Math.round(0.50 * S + 0.20 * E + 0.15 * C + 0.15 * T)

  return {
    score: finalScore,
    components: { S, E, C, T },
    isUrgent: S === 100 || finalScore >= 80,
    urgencyLabel: finalScore >= 85 ? 'Immediate Dispatch' : finalScore >= 65 ? 'High Priority' : finalScore >= 45 ? 'Scheduled Routine' : 'Low Priority'
  }
}
