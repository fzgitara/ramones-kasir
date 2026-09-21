import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * Header halaman dengan tombol kembali ke dashboard.
 *
 * Props:
 * - title: judul halaman
 * - backTo: tujuan tombol kembali (default '/')
 * - backLabel: label tombol kembali (default 'Dashboard')
 * - actions: elemen opsional di sisi kanan
 */
export function PageHeader({ title, backTo = '/', backLabel = 'Dashboard', actions = null }) {
  const navigate = useNavigate()
  const showBack = backTo !== null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            aria-label={`Kembali ke ${backLabel}`}
            title={`Kembali ke ${backLabel}`}
            className="shrink-0 p-2 rounded-lg bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 truncate">{title}</h1>
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
