import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatRupiah, todayISO, startOfDayISO, endOfDayISO } from '../utils/formatters'
import { LayoutDashboard, ClipboardCheck, Package, ShoppingCart, Receipt, BarChart3, FileUser } from 'lucide-react'

export function DashboardPage() {
  const { role } = useAuth()
  const [today, setToday] = useState({ sales: 0, expenses: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchToday = async () => {
      setLoading(true)
      const from = startOfDayISO(todayISO())
      const to = endOfDayISO(todayISO())

      const [salesRes, expensesRes] = await Promise.all([
        supabase.from('sales').select('total_price').gte('created_at', from).lte('created_at', to),
        supabase.from('expenses').select('total_price').gte('created_at', from).lte('created_at', to),
      ])

      setToday({
        sales: (salesRes.data || []).reduce((a, c) => a + (c.total_price || 0), 0),
        expenses: (expensesRes.data || []).reduce((a, c) => a + (c.total_price || 0), 0),
      })
      setLoading(false)
    }
    fetchToday()
  }, [])

  const cards = [
    { to: '/absensi', label: 'Absensi', icon: ClipboardCheck },
    { to: '/produk', label: 'Produk', icon: Package },
    { to: '/penjualan', label: 'Penjualan', icon: ShoppingCart },
    { to: '/pengeluaran', label: 'Pengeluaran', icon: Receipt },
    ...(role === 'admin' ? [
      { to: '/laporan', label: 'Laporan', icon: BarChart3 },
      { to: '/laporan-absensi', label: 'Laporan Absensi', icon: FileUser }
    ] : []),
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-6 border border-neutral-200 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Penjualan Hari Ini</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {loading ? '…' : formatRupiah(today.sales)}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-6 border border-neutral-200 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Pengeluaran Hari Ini</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {loading ? '…' : formatRupiah(today.expenses)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group bg-white dark:bg-neutral-900 rounded-2xl shadow p-6 border border-neutral-200 dark:border-neutral-800 hover:border-brand-500 dark:hover:border-brand-400 transition"
          >
            <div className="flex flex-col items-center text-center gap-2">
              <card.icon className="w-8 h-8 text-brand-600" />
              <span className="font-medium text-neutral-800 dark:text-neutral-200">{card.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
