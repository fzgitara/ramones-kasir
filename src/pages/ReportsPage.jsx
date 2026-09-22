import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatRupiah, formatDateTime, todayISO, startOfDayISO, endOfDayISO } from '../utils/formatters'
import { Search } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'

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
      .select('*')
      .gte('created_at', startOfDayISO(start))
      .lte('created_at', endOfDayISO(end))
      .order('created_at', { ascending: false })

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
      sales: sales || [],
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan Keuangan" />

      <form
        onSubmit={fetchReport}
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="min-w-0">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Dari</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required className="input" />
          </div>
          <div className="min-w-0">
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
        <>
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

          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <div className="px-4 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Detail Penjualan</h2>
            </div>
            {summary.sales.length === 0 ? (
              <p className="p-6 text-neutral-500 dark:text-neutral-400">Tidak ada data penjualan.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Waktu</th>
                      <th className="px-4 py-3 font-semibold">Produk</th>
                      <th className="px-4 py-3 font-semibold">Harga</th>
                      <th className="px-4 py-3 font-semibold">Qty</th>
                      <th className="px-4 py-3 font-semibold">Total</th>
                      <th className="px-4 py-3 font-semibold">Metode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {summary.sales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                          {formatDateTime(sale.created_at)}
                        </td>
                        <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">{sale.product_name}</td>
                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{formatRupiah(sale.price)}</td>
                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{sale.total_item}</td>
                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{formatRupiah(sale.total_price)}</td>
                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 capitalize">{sale.payment_type || 'cash'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
