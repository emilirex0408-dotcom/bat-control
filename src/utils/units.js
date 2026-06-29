export const KG_TO_LB = 2.2046226218

export function kgToUnit(kg, unit) {
  if (unit === 'lb') return Number(kg) * KG_TO_LB
  return Number(kg)
}

export function unitToKg(value, unit) {
  if (unit === 'lb') return Number(value) / KG_TO_LB
  return Number(value)
}

export function unitLabel(unit) {
  return unit === 'lb' ? 'lb' : 'kg'
}

export function formatWeight(kg, unit) {
  const v = kgToUnit(kg, unit)
  return `${Math.round(v)} ${unitLabel(unit)}`
}

export function setVolume(set) {
  const l = (Number(set.weight) || 0) * (Number(set.reps) || 0)
  const r = (Number(set.weightR) || 0) * (Number(set.repsR) || 0)
  return l + r
}

export function formatSetLine(set, unit) {
  const parts = []
  const wL = set.weight !== '' && set.weight != null ? Math.round(kgToUnit(set.weight, unit)) : null
  const rL = set.reps ?? null
  const wR = set.weightR !== '' && set.weightR != null ? Math.round(kgToUnit(set.weightR, unit)) : null
  const rR = set.repsR ?? null

  if (wR != null || rR != null) {
    if (wL != null || rL != null) parts.push(`I ${wL ?? 0}${unitLabel(unit)}x${rL ?? 0}`)
    if (wR != null || rR != null) parts.push(`D ${wR ?? 0}${unitLabel(unit)}x${rR ?? 0}`)
  } else {
    parts.push(`${wL ?? 0}${unitLabel(unit)}x${rL ?? 0}`)
  }
  if (set.done) parts.push('✓')
  return parts.join(' ')
}