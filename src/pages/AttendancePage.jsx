import { useEffect, useState } from 'react'
import { Loader2, LogIn, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useGeolocation } from '../hooks/useGeolocation'

function getDeviceInfo() {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    platform: typeof navigator !== 'undefined' ? navigator.platform : '',
    vendor: typeof navigator !== 'undefined' ? navigator.vendor : '',
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function AttendancePage() {
  const { user } = useAuth()
  const { location, loading, error, getLocation } = useGeolocation()
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [openSession, setOpenSession] = useState(null)
  const [todaySessions, setTodaySessions] = useState([])

  const fetchSessions = async () => {
    const today = todayISO()

    const { data, error: fetchError } = await supabase
      .from('attendances')
      .select('*')
      .eq('user_id', user.id)
      .eq('attendance_date', today)
      .order('check_in_at', { ascending: false })

    if (!fetchError && data) {
      setTodaySessions(data)
      setOpenSession(data.find((s) => !s.check_out_at) || null)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleCheckIn = async () => {
    setStatus({ type: '', message: '' })
    const geo = await getLocation()
    if (geo.error) return

    setSubmitting(true)
    const { error: insertError } = await supabase.from('attendances').insert({
      user_id: user.id,
      attendance_date: todayISO(),
      check_in_at: new Date().toISOString(),
      check_in_location: geo.location,
      check_in_device: JSON.stringify(getDeviceInfo()),
    })

    if (insertError) {
      setStatus({ type: 'error', message: insertError.message })
    } else {
      setStatus({ type: 'success', message: 'Absen masuk berhasil disimpan.' })
    }
    setSubmitting(false)
    fetchSessions()
  }

  const handleCheckOut = async () => {
    setStatus({ type: '', message: '' })
    if (!openSession) {
      setStatus({ type: 'error', message: 'Tidak ada sesi masuk yang terbuka.' })
      return
    }

    const geo = await getLocation()
    if (geo.error) return

    setSubmitting(true)
    const { error: updateError } = await supabase
      .from('attendances')
      .update({
        check_out_at: new Date().toISOString(),
        check_out_location: geo.location,
        check_out_device: JSON.stringify(getDeviceInfo()),
      })
      .eq('id', openSession.id)

    if (updateError) {
      setStatus({ type: 'error', message: updateError.message })
    } else {
      setStatus({ type: 'success', message: 'Absen keluar berhasil disimpan.' })
    }
    setSubmitting(false)
    fetchSessions()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Absensi</h1>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-6 border border-neutral-200 dark:border-neutral-800">
        <p className="text-neutral-600 dark:text-neutral-300 mb-6">
          Catat kehadiran Anda. Setelah absen keluar, Anda bisa absen masuk lagi.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleCheckIn}
            disabled={loading || submitting || !!openSession}
            className="flex flex-col items-center justify-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 dark:disabled:bg-brand-900 text-white font-medium py-4 transition"
          >
            {loading || submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            <span>{openSession ? 'Sesi Masih Aktif' : 'Absen Masuk'}</span>
          </button>

          <button
            onClick={handleCheckOut}
            disabled={loading || submitting || !openSession}
            className="flex flex-col items-center justify-center gap-2 rounded-lg bg-neutral-800 hover:bg-neutral-900 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white font-medium py-4 transition"
          >
            {loading || submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
            <span>{openSession ? 'Absen Keluar' : 'Belum Absen Masuk'}</span>
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {status.message && (
          <p
            className={`mt-4 text-sm ${
              status.type === 'error'
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}
          >
            {status.message}
          </p>
        )}
        {location && (
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            Lokasi: {location}
          </p>
        )}

        {todaySessions.length > 0 && (
          <div className="mt-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <p className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700">
              Sesi hari ini
            </p>
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {todaySessions.map((session) => (
                <li key={session.id} className="px-4 py-3 flex justify-between items-center">
                  <div className="text-sm text-neutral-700 dark:text-neutral-300">
                    <span className="font-medium">Masuk:</span>{' '}
                    {session.check_in_at
                      ? new Date(session.check_in_at).toLocaleTimeString('id-ID')
                      : '-'}
                  </div>
                  <div className="text-sm text-neutral-700 dark:text-neutral-300">
                    <span className="font-medium">Keluar:</span>{' '}
                    {session.check_out_at
                      ? new Date(session.check_out_at).toLocaleTimeString('id-ID')
                      : <span className="text-brand-600 dark:text-brand-400">Sedang aktif</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
