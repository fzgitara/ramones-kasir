export function formatRupiah(value) {
  const number = Number(value) || 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number)
}

export function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function startOfDayISO(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toISOString()
}

export function endOfDayISO(dateStr) {
  return new Date(`${dateStr}T23:59:59.999`).toISOString()
}
