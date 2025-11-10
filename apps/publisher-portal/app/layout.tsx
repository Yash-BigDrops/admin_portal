import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Publisher Portal',
  description: 'Publisher Portal for managing offers and submissions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

