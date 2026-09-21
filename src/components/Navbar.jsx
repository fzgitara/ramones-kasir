import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ThemeToggle } from './ThemeToggle'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/absensi', label: 'Absensi' },
  { to: '/produk', label: 'Produk' },
  { to: '/penjualan', label: 'Penjualan' },
  { to: '/pengeluaran', label: 'Pengeluaran' },
  { to: '/laporan', label: 'Laporan', roles: ['admin'] },
  { to: '/laporan-absensi', label: 'Lap. Absensi', roles: ['admin'] },
]

export function Navbar() {
  const { role, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const visibleLinks = links.filter((link) => !link.roles || link.roles.includes(role))

  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-brand-600 text-white'
        : 'text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800'
    }`

  return (
    <nav className="sticky top-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <span className="font-bold text-brand-600">Ramones Kasir</span>

          <div className="hidden md:flex items-center gap-1">
            {visibleLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs px-2 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 capitalize">
              {role || '-'}
            </span>
            <ThemeToggle />
            <button
              onClick={logout}
              title="Keluar"
              aria-label="Keluar"
              className="p-2 rounded-lg bg-neutral-200 text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
              className="md:hidden p-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-3 space-y-1">
            {visibleLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
