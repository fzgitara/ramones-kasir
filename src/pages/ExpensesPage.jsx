import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatRupiah } from '../utils/formatters'
import { PageHeader } from '../components/PageHeader'
import { Receipt, Loader2, Trash2 } from 'lucide-react'

export function ExpensesPage() {
  const { user, role } = useAuth()
  const [form, setForm] = useState({ name: '', price: '', total_item: 1 })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const isAdmin = role === 'admin'

  const totalPrice = Number(form.price || 0) * Number(form.total_item || 0)

  const fetchExpenses = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error) setExpenses(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      name: form.name.trim(),
      price: Number(form.price),
      total_item: Number(form.total_item),
      total_price: totalPrice,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setForm({ name: '', price: '', total_item: 1 })
      setMessage({ type: 'success', text: 'Pengeluaran berhasil disimpan.' })
      fetchExpenses()
    }
  }

  const handleDelete = async (id) => {
    if (!isAdmin) return
    if (!confirm('Yakin ingin menghapus pengeluaran ini?')) return
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      fetchExpenses()
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pengeluaran" />

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800 max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nama</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Gula, Kopi, Plastik"
              required
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Harga satuan</label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Jumlah</label>
              <input
                type="number"
                min={1}
                value={form.total_item}
                onChange={(e) => setForm({ ...form, total_item: e.target.value })}
                required
                className="input"
              />
            </div>
          </div>

          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Total Pengeluaran</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-200">{formatRupiah(totalPrice)}</p>
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <Receipt className="w-4 h-4" /> Simpan Pengeluaran
          </button>

          {message.text && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200'
                  : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </form>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow overflow-hidden overflow-x-auto border border-neutral-200 dark:border-neutral-800">
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Daftar Pengeluaran</h2>
        </div>

        {loading ? (
          <div className="p-6 flex items-center justify-center text-neutral-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat…
          </div>
        ) : expenses.length === 0 ? (
          <p className="p-6 text-neutral-500 dark:text-neutral-400">Belum ada pengeluaran.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Harga</th>
                  <th className="px-4 py-3 font-semibold">Qty</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  {isAdmin && <th className="px-4 py-3 font-semibold">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">{expense.name}</td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{formatRupiah(expense.price)}</td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{expense.total_item}</td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{formatRupiah(expense.total_price)}</td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                      {new Date(expense.created_at).toLocaleDateString('id-ID')}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/50"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
