import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatRupiah } from '../utils/formatters'
import { ShoppingCart, Plus } from 'lucide-react'

export function SalesPage() {
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    supabase.from('products').select('*').order('name').then(({ data }) => {
      setProducts(data || [])
    })
  }, [])

  useEffect(() => {
    if (selected) return
    const defaultProduct = products[0]
    if (defaultProduct) setSelected(defaultProduct)
  }, [products])

  const selectedProduct = products.find((p) => p.id === selected?.id) || null
  const totalPrice = selectedProduct ? selectedProduct.price * quantity : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (!selectedProduct) {
      setMessage({ type: 'error', text: 'Pilih produk terlebih dahulu.' })
      return
    }
    if (quantity <= 0) {
      setMessage({ type: 'error', text: 'Kuantitas harus lebih dari 0.' })
      return
    }
    if (selectedProduct.stock < quantity) {
      setMessage({ type: 'error', text: 'Stok tidak mencukupi.' })
      return
    }

    const { error: saleError } = await supabase.from('sales').insert({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      price: selectedProduct.price,
      total_item: quantity,
      total_price: totalPrice,
      user_id: user.id,
    })

    if (saleError) {
      setMessage({ type: 'error', text: saleError.message })
      return
    }

    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: selectedProduct.stock - quantity })
      .eq('id', selectedProduct.id)

    if (stockError) {
      setMessage({ type: 'error', text: stockError.message })
      return
    }

    setQuantity(1)
    setMessage({ type: 'success', text: 'Penjualan berhasil disimpan.' })
    supabase.from('products').select('*').order('name').then(({ data }) => setProducts(data || []))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Penjualan</h1>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800 max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Produk</label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const p = products.find((x) => x.id === e.target.value)
                setSelected(p || null)
              }}
              className="input"
            >
              <option value="">Pilih produk</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatRupiah(p.price)} (stok: {p.stock})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Harga satuan: {formatRupiah(selectedProduct.price)} | Stok: {selectedProduct.stock}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Jumlah</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="input"
            />
          </div>

          <div className="rounded-lg bg-brand-50 dark:bg-brand-900/30 p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Total</p>
            <p className="text-2xl font-bold text-brand-700 dark:text-brand-200">{formatRupiah(totalPrice)}</p>
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Simpan Penjualan
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
