import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatRupiah } from '../utils/formatters'
import { PageHeader } from '../components/PageHeader'
import { Loader2, Save, Trash2 } from 'lucide-react'

export function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const fetchProduct = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
    if (error || !data) {
      setMessage({ type: 'error', text: error?.message || 'Produk tidak ditemukan.' })
      setProduct(null)
    } else {
      setProduct(data)
      setMessage({ type: '', text: '' })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProduct()
  }, [id])

  const handleChange = (field, value) => {
    setProduct((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!product) return

    setSaving(true)
    setMessage({ type: '', text: '' })

    const { error } = await supabase
      .from('products')
      .update({
        name: product.name.trim(),
        price: Number(product.price),
        stock: Number(product.stock),
      })
      .eq('id', id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Produk berhasil diperbarui.' })
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!isAdmin || !product) return
    if (!confirm('Yakin ingin menghapus produk ini?')) return

    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      navigate('/produk')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <p className="text-neutral-500 dark:text-neutral-400 mb-4">Produk tidak ditemukan.</p>
        <button onClick={() => navigate('/produk')} className="btn-primary">Kembali ke Produk</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Detail Produk" backTo="/produk" backLabel="Produk" />

      <form onSubmit={handleSave} className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nama</label>
          <input
            type="text"
            value={product.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            className="input"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Harga</label>
            <input
              type="number"
              min={0}
              value={product.price}
              onChange={(e) => handleChange('price', e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Stok</label>
            <input
              type="number"
              min={0}
              value={product.stock}
              onChange={(e) => handleChange('stock', e.target.value)}
              required
              className="input"
            />
          </div>
        </div>

        <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Total nilai stok</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {formatRupiah(product.price * product.stock)}
          </p>
        </div>

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

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Perubahan
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/50 font-medium py-2.5 px-4 transition"
            >
              <Trash2 className="w-4 h-4" /> Hapus
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
