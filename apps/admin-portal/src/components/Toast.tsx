'use client'

import { useEffect } from 'react'

export function Toast({
  message,
  type = 'success',
  onClose,
}: {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500)
    return () => clearTimeout(t)
  }, [onClose])

  const color = type === 'success' ? 'bg-green-600' : 'bg-red-600'

  return (
    <div
      className={`fixed bottom-4 right-4 rounded text-white px-4 py-2 shadow ${color} z-50`}
    >
      {message}
    </div>
  )
}

