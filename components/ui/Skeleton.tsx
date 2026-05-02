export function ItemSkeleton() {
  return (
    <div className="bg-white border border-ink-100 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="skeleton w-5 h-5 rounded-md" />
        <div className="skeleton w-16 h-3 rounded-full" />
      </div>
      <div className="skeleton w-full h-4 rounded-md" />
      <div className="skeleton w-3/4 h-4 rounded-md" />
      <div className="skeleton w-full h-3 rounded-md" />
      <div className="skeleton w-5/6 h-3 rounded-md" />
      <div className="flex gap-1.5 pt-1">
        <div className="skeleton w-12 h-5 rounded-full" />
        <div className="skeleton w-16 h-5 rounded-full" />
        <div className="skeleton w-10 h-5 rounded-full" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white border border-ink-100 rounded-2xl p-4">
            <div className="skeleton w-16 h-3 rounded mb-2" />
            <div className="skeleton w-12 h-8 rounded" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[1,2,3,4,5,6].map(i => <ItemSkeleton key={i} />)}
      </div>
    </div>
  )
}
