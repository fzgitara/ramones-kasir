import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatRupiah } from '../utils/formatters'
import { todayISO, startOfDayISO, endOfDayISO } from '../utils/formatters'
import { BarChart3, Search } from 'lucide-react'

export function ReportsPage() {
  const [start, setStart] = useState(todayISO())
  const [end, setEnd] = useState(todayISO())
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState(null)

  const fetchReport = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('total_price, created_at')
      .gte('created_at', startOfDayISO(start))
      .lte('created_at', endOfDayISO(end))

    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('total_price, created_at')
      .gte('created_at', startOfDayISO(start))
      .lte('created_at', endOfDayISO(end))

    setLoading(false)

    if (salesError || expensesError) {
      console.error(salesError || expensesError)
      return
    }

    const totalSales = (sales || []).reduce((acc, cur) => acc + (cur.total_price || 0), 0)
    const totalExpenses = (expenses || []).reduce((acc, cur) => acc + (cur.total_price || 0), 0)

    setSummary({
      totalSales,
      totalExpenses,
      net: totalSales - totalExpenses,
      saleCount: sales?.length || 0,
      expenseCount: expenses?.length || 0,
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Laporan Keuangan</h1>

      <form
        onSubmit={fetchReport}
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Dari</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Sampai</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} required className="input" />
          </div>
          <button type="submit" className="btn-primary flex items-center justify-center gap-2">
            <Search className="w-4 h-4" /> Tampilkan
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-neutral-500 dark:text-neutral-400">Memuat laporan…</p>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-6 border border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Penjualan</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatRupiah(summary.totalSales)}</p>
            <p className="text-xs text-neutral-400 mt-1">{summary.saleCount} transaksi</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-6 border border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Pengeluaran</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatRupiah(summary.totalExpenses)}</p>
            <p className="text-xs text-neutral-400 mt-1">{summary.expenseCount} transaksi</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-6 border border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Laba / Rugi</p>
            <p
              className={`text-2xl font-bold ${
                summary.net >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatRupiah(summary.net)}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
