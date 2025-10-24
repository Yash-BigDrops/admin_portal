import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import PublisherPerformance from '@/components/publishers/PublisherPerformance'

interface PublisherDetailPageProps {
  params: Promise<{
    id: string
  }>
}

function PublisherDetailContent({ publisherId }: { publisherId: string }) {
  return <PublisherPerformance publisherId={publisherId} />
}

export default async function PublisherDetailPage({ params }: PublisherDetailPageProps) {
  const { id: publisherId } = await params

  if (!publisherId) {
    notFound()
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PublisherDetailContent publisherId={publisherId} />
    </Suspense>
  )
}
