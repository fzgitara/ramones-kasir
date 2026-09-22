import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X, PackageX } from 'lucide-react'
import { formatRupiah } from '../utils/formatters'

/**
 * Combobox produk dengan pencarian.
 *
 * Props:
 * - products: array produk ({ id, name, price, stock })
 * - value: id produk terpilih
 * - onChange: (product | null) => void
 */
export function ProductSearch({ products = [], value, onChange, placeholder = 'Cari produk…' }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapperRef = useRef(null)

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === value) || null,
    [products, value]
  )

  // Sinkronkan teks input dengan produk terpilih
  useEffect(() => {
    if (selectedProduct) {
      setQuery(selectedProduct.name)
    } else if (!value) {
      setQuery('')
    }
  }, [selectedProduct, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, query])

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
        // Kalau teks tidak cocok dengan produk terpilih, kembalikan ke nama produk terpilih
        if (selectedProduct) setQuery(selectedProduct.name)
        else setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedProduct])

  const handleSelect = (product) => {
    if (product.stock <= 0) return
    onChange(product)
    setQuery(product.name)
    setOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
    setOpen(true)
  }

  const handleKeyDown = (event) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (event.key === 'Enter') {
      if (open && filtered[highlight]) {
        event.preventDefault()
        handleSelect(filtered[highlight])
      }
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setHighlight(0)
            if (value) onChange(null)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="input pl-9 pr-9"
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Hapus pilihan"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        ) : <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />}
      </div>

      {open && (
        <ul className="absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg">
          {filtered.length === 0 ? (
            <li className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
              <PackageX className="w-4 h-4" /> Produk tidak ditemukan
            </li>
          ) : (
            filtered.map((product, index) => {
              const outOfStock = product.stock <= 0
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    disabled={outOfStock}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => handleSelect(product)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition ${
                      outOfStock
                        ? 'opacity-50 cursor-not-allowed'
                        : index === highlight
                          ? 'bg-brand-50 dark:bg-brand-900/30'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span className="text-neutral-900 dark:text-neutral-500">
                      {product.name}
                      {outOfStock && (
                        <span className="ml-2 text-xs text-red-500">stok habis</span>
                      )}
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                      {formatRupiah(product.price)} · stok {product.stock}
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
