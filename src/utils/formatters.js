export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr, short = false) {
  const date = new Date(dateStr + 'T00:00:00')
  if (short) return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getDayOfWeek(date = new Date()) {
  return date.getDay()
}

export function getMonthName(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

export function getMonthKey(dateStr) {
  return dateStr.substring(0, 7)
}

export function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}