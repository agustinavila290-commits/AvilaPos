/**
 * Badge de stock moderno.
 * stock: número de unidades (puede ser undefined si no se sabe)
 * Variantes: en-stock | bajo | sin-stock | consultar
 */
export default function StockBadge({ stock, className = '' }) {
  if (stock === undefined || stock === null) return null

  if (stock <= 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full
                        bg-gray-800 text-gray-400 border border-gray-700 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
        Sin stock
      </span>
    )
  }

  if (stock <= 5) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full
                        bg-amber-500/20 text-amber-400 border border-amber-500/30 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Últimas {stock}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full
                      bg-avila-green/20 text-green-400 border border-green-500/30 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
      En stock
    </span>
  )
}
