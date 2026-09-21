import { useState } from 'react'

export function useGeolocation() {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getLocation = () =>
    new Promise((resolve) => {
      setError('')
      setLocation(null)

      if (!navigator.geolocation) {
        const message = 'Browser tidak mendukung deteksi lokasi.'
        setError(message)
        resolve({ error: message })
        return
      }

      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const value = `${position.coords.latitude},${position.coords.longitude}`
          setLocation(value)
          setLoading(false)
          resolve({ location: value })
        },
        (err) => {
          const message =
            err.code === err.PERMISSION_DENIED
              ? 'Izin lokasi ditolak. Aktifkan izin lokasi di browser.'
              : 'Gagal mendapatkan lokasi. Coba lagi.'
          setError(message)
          setLoading(false)
          resolve({ error: message })
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      )
    })

  return { location, loading, error, getLocation }
}
