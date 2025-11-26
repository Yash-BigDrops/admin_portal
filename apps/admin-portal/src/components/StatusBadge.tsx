'use client'

export default function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'approved'
      ? 'bg-green-100 text-green-700 border-green-200'
      : status === 'rejected'
      ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-yellow-100 text-yellow-700 border-yellow-200'

  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs capitalize ${color}`}
    >
      {status}
    </span>
  )
}

