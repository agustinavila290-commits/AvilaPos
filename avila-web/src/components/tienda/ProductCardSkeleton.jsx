export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-brand-border flex flex-col overflow-hidden">
      <div className="aspect-square skeleton-light" />
      <div className="p-3 flex flex-col gap-2.5">
        <div className="h-2 skeleton-light rounded-full w-1/4" />
        <div className="h-3.5 skeleton-light rounded-full w-5/6" />
        <div className="h-3.5 skeleton-light rounded-full w-4/6" />
        <div className="h-5 skeleton-light rounded-full w-2/5 mt-1" />
        <div className="h-9 skeleton-light rounded-xl mt-1" />
      </div>
    </div>
  )
}
