export default function StockBadge({ stock, className = '' }) {
  if (stock === undefined || stock === null) return null

  if (stock <= 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full
                        bg-red-50 text-red-600 border border-red-200 ${className}`}>
        Sin stock
      </span>
    )
  }

  if (stock <= 5) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full
                        bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
        Últimas {stock}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full
                      bg-green-50 text-green-700 border border-green-200 ${className}`}>
      <span className="w-1 h-1 rounded-full bg-green-500 flex-shrink-0" />
      En stock
    </span>
  )
}
