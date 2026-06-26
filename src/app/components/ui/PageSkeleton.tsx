import { Skeleton } from './Skeleton'

/**
 * Per-page loading skeletons. Each route's `loading.tsx` renders the variant
 * that mirrors its real layout, so the loading state feels like the page
 * "developing" rather than a generic spinner.
 */
export type SkeletonVariant =
  | 'dashboard'
  | 'finance'
  | 'analytics'
  | 'manager'
  | 'list'
  | 'narrow-list'
  | 'grid'
  | 'settings'
  | 'prose'

function Header({ wide = false }: { wide?: boolean }) {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="h-3 w-28 rounded-full" />
      <Skeleton className={`h-8 ${wide ? 'w-72' : 'w-56'} rounded-lg`} />
      <Skeleton className="h-3.5 w-64 rounded-full" />
    </div>
  )
}

function Card({ className = '' }: { className?: string }) {
  return <Skeleton className={`rounded-2xl ${className}`} />
}

function StatCardSkel() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-2.5 w-20 rounded-full" />
        <Skeleton className="h-4 w-4 rounded-md" />
      </div>
      <Skeleton className="h-8 w-24 rounded-lg" />
      <Skeleton className="h-2.5 w-12 rounded-full" />
    </div>
  )
}

function Row() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 flex items-center gap-3">
      <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton className="h-3.5 w-1/2 rounded-full" />
        <Skeleton className="h-3 w-3/4 rounded-full" />
      </div>
      <Skeleton className="h-6 w-16 rounded-lg flex-shrink-0" />
    </div>
  )
}

function Rows({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Row key={i} />
      ))}
    </div>
  )
}

export function PageSkeleton({ variant = 'list' }: { variant?: SkeletonVariant }) {
  if (variant === 'dashboard') {
    return (
      <div className="flex flex-col gap-8 md:gap-10">
        <Header wide />
        <Card className="h-28" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-44 flex-shrink-0 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkel key={i} />
          ))}
        </div>
        <Card className="h-24" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-3 w-32 rounded-full" />
            <Rows count={2} />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-3 w-32 rounded-full" />
            <Rows count={2} />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'finance') {
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Header />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
        <Card className="h-44" />
        {/* Compact balance rows on mobile, cards on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-3 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between gap-3 sm:flex-col sm:items-start"
            >
              <Skeleton className="h-4 w-24 rounded-full sm:mb-4" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-40 rounded-full" />
          <Rows count={6} />
        </div>
      </div>
    )
  }

  if (variant === 'analytics') {
    return (
      <div className="flex flex-col gap-8">
        <Header />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkel key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="h-64" />
          <Card className="h-64" />
        </div>
        <Card className="h-48" />
      </div>
    )
  }

  if (variant === 'manager') {
    return (
      <div className="flex flex-col gap-8">
        <Header />
        <div className="max-w-4xl flex flex-col gap-6">
          <Card className="h-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="h-32" />
            <Card className="h-32" />
          </div>
          <Card className="h-56" />
        </div>
      </div>
    )
  }

  if (variant === 'grid') {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <Header />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-52" />
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'settings') {
    return (
      <div className="flex flex-col gap-8 max-w-2xl">
        <Header />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="h-3 w-28 rounded-full" />
            <Card className="h-28" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'prose') {
    return (
      <div className="flex flex-col gap-6 max-w-3xl">
        <Header />
        <div className="flex flex-col gap-3">
          {[
            'w-full',
            'w-11/12',
            'w-full',
            'w-4/5',
            'w-full',
            'w-3/4',
          ].map((w, i) => (
            <Skeleton key={i} className={`h-3.5 ${w} rounded-full`} />
          ))}
        </div>
        <Card className="h-40" />
      </div>
    )
  }

  // 'list' and 'narrow-list'
  const narrow = variant === 'narrow-list'
  return (
    <div className={`flex flex-col gap-8 ${narrow ? 'max-w-2xl mx-auto' : ''}`}>
      <div className="flex items-start justify-between">
        <Header />
        {narrow && <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />}
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <Rows count={narrow ? 6 : 7} />
    </div>
  )
}
