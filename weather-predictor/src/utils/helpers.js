export function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date - start
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function parseDateString(dateStr) {
  if (typeof dateStr === 'string' && dateStr.length === 8) {
    return new Date(
      parseInt(dateStr.substring(0, 4)),
      parseInt(dateStr.substring(4, 6)) - 1,
      parseInt(dateStr.substring(6, 8))
    )
  }
  return new Date(dateStr)
}

export function clampValue(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max)
}
