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