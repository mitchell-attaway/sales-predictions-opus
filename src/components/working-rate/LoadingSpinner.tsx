export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="w-8 h-8 border-3 border-brand-navy/20 border-t-brand-red rounded-full animate-spin" />
    </div>
  );
}

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="mt-3 h-0.5 w-8 bg-gray-200 rounded-full" />
            <div className="mt-4 h-10 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50">
            <div className="h-4 w-40 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
            <div className="h-6 w-20 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
