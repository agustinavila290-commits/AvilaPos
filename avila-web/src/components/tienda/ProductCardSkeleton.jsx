export default function ProductCardSkeleton() {
  return (
    <div className="card flex flex-col overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />
        <div className="h-4 bg-gray-200 rounded w-3/5" />
        <div className="h-6 bg-gray-200 rounded w-1/2 mt-1" />
        <div className="h-8 bg-gray-200 rounded mt-1" />
      </div>
    </div>
  )
}
