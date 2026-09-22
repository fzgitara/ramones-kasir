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

function toLocalISO(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function startOfDayISO(dateStr) {
  // Ambil tanggal lokal user, mulai dari 00:00:00 dalam timezone user,
  // tapi disimpan sebagai string ISO supaya PostgreSQL bandingkan dengan created_at UTC.
  // Cara paling aman: buat Date di timezone user, lalu convert ke UTC-00:00 string.
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  return date.toISOString()
}

export function endOfDayISO(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
  return date.toISOString()
}
