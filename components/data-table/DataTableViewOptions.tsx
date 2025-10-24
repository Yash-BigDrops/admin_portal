'use client'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import type { Table } from '@tanstack/react-table'

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        className="ml-auto hidden h-8 lg:flex"
        onClick={() => table.toggleAllColumnsVisible()}
      >
        <Eye className="mr-2 h-4 w-4" />
        Toggle All
      </Button>
    </div>
  )
}
