import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Advertiser Portal',
  description: 'Advertiser Portal for managing campaigns',
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

