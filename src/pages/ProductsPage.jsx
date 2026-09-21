import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatRupiah } from '../utils/formatters'
import { Plus, Minus, Trash2, Edit3 } from 'lucide-react'

export function ProductsPage() {
  const { role } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', price: '', stock: '' })
  const [message, setMessage] = useState({ type: '', text: '' })

  const isAdmin = role === 'admin'

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('products').select('*').order('name')
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setProducts(data || [])
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    const { error } = await supabase.from('products').insert({
      name: form.name.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
    })
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setForm({ name: '', price: '', stock: '' })
      setMessage({ type: 'success', text: 'Produk berhasil ditambahkan.' })
      fetchProducts()
    }
  }

  const adjustStock = async (id, delta) => {
    const product = products.find((p) => p.id === id)
    if (!product) return
    const newStock = Math.max(0, product.stock + delta)
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      fetchProducts()
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      fetchProducts()
      setMessage({ type: 'success', text: 'Produk dihapus.' })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Produk</h1>

      <form
        onSubmit={handleCreate}
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800"
      >
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Nama produk"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="input"
          />
          <input
            type="number"
            placeholder="Harga"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
            className="input"
          />
          <input
            type="number"
            placeholder="Stok awal"
            min={0}
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            required
            className="input"
          />
          <button type="submit" className="btn-primary flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>
      </form>

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

      {loading ? (
        <p className="text-neutral-500 dark:text-neutral-400">Memuat produk…</p>
      ) : products.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">Belum ada produk.</p>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">Harga</th>
                <th className="px-4 py-3 font-semibold">Stok</th>
                <th className="px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">{product.name}</td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{formatRupiah(product.price)}</td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{product.stock}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustStock(product.id, -1)}
                        className="p-1.5 rounded-md bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                        title="Kurangi stok"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => adjustStock(product.id, 1)}
                        className="p-1.5 rounded-md bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                        title="Tambah stok"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/50"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
