import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatRupiah } from '../utils/formatters'
import { ProductSearch } from '../components/ProductSearch'
import { Plus, Trash2, ShoppingCart } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'

export function SalesPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [paymentType, setPaymentType] = useState('cash')
  const [items, setItems] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name')
    setProducts(data || [])
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleAddItem = (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (!selectedProduct) {
      setMessage({ type: 'error', text: 'Pilih produk terlebih dahulu.' })
      return
    }

    const qty = Number(quantity)
    if (!qty || qty <= 0) {
      setMessage({ type: 'error', text: 'Kuantitas harus lebih dari 0.' })
      return
    }

    // Kalau produk sudah ada di keranjang, jumlahnya digabung
    const existing = items.find((item) => item.product_id === selectedProduct.id)
    const totalQty = (existing?.quantity || 0) + qty

    if (selectedProduct.stock < totalQty) {
      setMessage({
        type: 'error',
        text: `Stok ${selectedProduct.name} hanya ${selectedProduct.stock}.`,
      })
      return
    }

    if (existing) {
      setItems((prev) =>
        prev.map((item) =>
          item.product_id === selectedProduct.id
            ? { ...item, quantity: totalQty, total: item.price * totalQty }
            : item
        )
      )
    } else {
      setItems((prev) => [
        ...prev,
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          price: selectedProduct.price,
          quantity: qty,
          total: selectedProduct.price * qty,
        },
      ])
    }

    setSelectedProduct(null)
    setQuantity(1)
  }

  const handleRemoveItem = (productId) => {
    setItems((prev) => prev.filter((item) => item.product_id !== productId))
  }

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0)

  const handleSave = async () => {
    if (items.length === 0) {
      setMessage({ type: 'error', text: 'Tambahkan minimal satu produk.' })
      return
    }

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    const payload = items.map((item) => ({
      user_id: user.id,
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.price,
      total_item: item.quantity,
      total_price: item.total,
      payment_type: paymentType,
    }))

    const { error: saleError } = await supabase.from('sales').insert(payload)

    if (saleError) {
      setMessage({ type: 'error', text: saleError.message })
      setSubmitting(false)
      return
    }

    // Kurangi stok tiap produk berdasarkan stok terbaru
    const ids = items.map((item) => item.product_id)
    const { data: fresh } = await supabase.from('products').select('id, stock').in('id', ids)
    const stockMap = new Map((fresh || []).map((p) => [p.id, p.stock]))

    for (const item of items) {
      const currentStock = stockMap.get(item.product_id) ?? 0
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: Math.max(0, currentStock - item.quantity) })
        .eq('id', item.product_id)

      if (stockError) {
        setMessage({ type: 'error', text: `Penjualan tersimpan, tapi gagal update stok: ${stockError.message}` })
        setSubmitting(false)
        loadProducts()
        return
      }
    }

    setItems([])
    setPaymentType('cash')
    setMessage({ type: 'success', text: 'Penjualan berhasil disimpan.' })
    setSubmitting(false)
    loadProducts()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Penjualan" />

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800">
        <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Produk
            </label>
            <ProductSearch
              products={products}
              value={selectedProduct?.id || null}
              onChange={setSelectedProduct}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Jumlah
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input"
            />
          </div>

          <button type="submit" className="btn-primary flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </form>

        {selectedProduct && (
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
            Harga satuan {formatRupiah(selectedProduct.price)} · stok tersedia {selectedProduct.stock}
          </p>
        )}
      </div>

      {items.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Produk</th>
                <th className="px-4 py-3 font-semibold">Harga</th>
                <th className="px-4 py-3 font-semibold">Qty</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {items.map((item) => (
                <tr key={item.product_id}>
                  <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">{item.product_name}</td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{formatRupiah(item.price)}</td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{item.quantity}</td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{formatRupiah(item.total)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.product_id)}
                      className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/50"
                      title="Hapus item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="select"
            >
              <option value="cash">Cash</option>
              <option value="qris">QRIS</option>
            </select>
          </div>

          <div className="text-right">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total</p>
            <p className="text-3xl font-bold text-brand-700 dark:text-brand-200">
              {formatRupiah(grandTotal)}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={submitting || items.length === 0}
          className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          {submitting ? 'Menyimpan…' : 'Simpan Penjualan'}
        </button>

        {message.text && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200'
                : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}
