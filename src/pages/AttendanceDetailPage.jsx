import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, MapPin } from 'lucide-react'

export function AttendanceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userMap, setUserMap] = useState({})

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        setLoading(false)
        return
      }

      setSession(data)

      if (data.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', data.user_id)
          .single()

        if (profile) {
          setUserMap({ [profile.id]: profile })
        }
      }

      setLoading(false)
    }

    fetchSession()
  }, [id])

  const parseLocation = (loc) => {
    if (!loc) return null
    const [lat, lng] = loc.split(',').map((s) => parseFloat(s.trim()))
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null
    return { lat, lng }
  }

  const mapsUrl = (loc) => {
    const coords = parseLocation(loc)
    if (!coords) return null
    return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500 dark:text-neutral-400">Memuat detail absensi…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <p className="text-neutral-500 dark:text-neutral-400 mb-4">Data absensi tidak ditemukan.</p>
        <button onClick={() => navigate('/laporan-absensi')} className="btn-primary">
          Kembali ke Laporan Absensi
        </button>
      </div>
    )
  }

  const user = userMap[session.user_id]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/laporan-absensi')}
        className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-brand-600 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Laporan Absensi
      </button>

      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Detail Absensi</h1>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-6 border border-neutral-200 dark:border-neutral-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">User</p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {user ? user.full_name || user.email : session.user_id}
            </p>
            {user?.email && user.full_name && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Tanggal</p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{session.attendance_date}</p>
          </div>
        </div>

        <hr className="border-neutral-200 dark:border-neutral-800" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand-600 font-semibold">
              <MapPin className="w-4 h-4" /> Absen Masuk
            </div>
            <p className="text-neutral-700 dark:text-neutral-300">
              {session.check_in_at
                ? new Date(session.check_in_at).toLocaleString('id-ID')
                : '-'}
            </p>
            {session.check_in_location ? (
              <a
                href={mapsUrl(session.check_in_location)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
              >
                Lihat lokasi di Google Maps
              </a>
            ) : (
              <p className="text-sm text-neutral-500">Lokasi tidak tersedia</p>
            )}
            <p className="text-xs text-neutral-400 break-all">Device: {session.check_in_device || '-'}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 font-semibold">
              <MapPin className="w-4 h-4" /> Absen Keluar
            </div>
            <p className="text-neutral-700 dark:text-neutral-300">
              {session.check_out_at
                ? new Date(session.check_out_at).toLocaleString('id-ID')
                : 'Belum absen keluar'}
            </p>
            {session.check_out_location ? (
              <a
                href={mapsUrl(session.check_out_location)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
              >
                Lihat lokasi di Google Maps
              </a>
            ) : (
              <p className="text-sm text-neutral-500">Lokasi tidak tersedia</p>
            )}
            <p className="text-xs text-neutral-400 break-all">Device: {session.check_out_device || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
