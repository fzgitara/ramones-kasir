import { useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
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

export function AttendancePage() {
  const { user } = useAuth()
  const { location, loading, error, getLocation } = useGeolocation()
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleAttendance = async () => {
    setSubmitStatus({ type: '', message: '' })
    const result = await getLocation()
    if (result.error) return

    setSubmitting(true)
    const { error: insertError } = await supabase.from('attendances').insert({
      user_id: user.id,
      location: result.location,
      device: JSON.stringify(getDeviceInfo()),
    })

    setSubmitting(false)
    if (insertError) {
      setSubmitStatus({ type: 'error', message: insertError.message })
    } else {
      setSubmitStatus({ type: 'success', message: 'Absensi berhasil disimpan.' })
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Absensi</h1>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-6 border border-neutral-200 dark:border-neutral-800">
        <p className="text-neutral-600 dark:text-neutral-300 mb-6">
          Tekan tombol di bawah untuk mencatat kehadiran dengan lokasi saat ini.
        </p>

        <button
          onClick={handleAttendance}
          disabled={loading || submitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 dark:disabled:bg-brand-900 text-white font-medium py-3 transition"
        >
          {(loading || submitting) ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
          <span>{loading ? 'Mencari lokasi…' : submitting ? 'Menyimpan…' : 'Absen Sekarang'}</span>
        </button>

        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {submitStatus.message && (
          <p
            className={`mt-4 text-sm ${
              submitStatus.type === 'error'
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}
          >
            {submitStatus.message}
          </p>
        )}
        {location && (
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            Lokasi: {location}
          </p>
        )}
      </div>
    </div>
  )
}
