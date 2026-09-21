import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatRupiah } from '../utils/formatters'
import { Receipt } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'

export function ExpensesPage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', price: '', total_item: 1 })
  const [message, setMessage] = useState({ type: '', text: '' })

  const totalPrice = Number(form.price || 0) * Number(form.total_item || 0)

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
    </div>
  )
}
