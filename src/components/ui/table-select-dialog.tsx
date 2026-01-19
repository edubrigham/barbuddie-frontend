import { useQuery } from '@tanstack/react-query'
import { apiClient, endpoints } from '@/lib/api'
import { Button } from './button'
import { ScrollArea } from './scroll-area'
import { cn } from '@/lib/utils'
import type { CostCenter } from '@/types/api.types'

interface TableSelectDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (table: CostCenter) => void
  title?: string
}

export function TableSelectDialog({
  open,
  onClose,
  onSelect,
  title = 'Select Table',
}: TableSelectDialogProps) {
  // Fetch available tables
  const { data: tables, isLoading } = useQuery({
    queryKey: ['cost-centers', 'tables'],
    queryFn: async () => {
      const response = await apiClient.get<CostCenter[]>(endpoints.costCenters.tables)
      return response.data
    },
    enabled: open,
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-card rounded-xl shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : tables && tables.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => onSelect(table)}
                  className={cn(
                    'h-20 rounded-lg flex flex-col items-center justify-center',
                    'bg-emerald-100 text-emerald-800 border-2 border-emerald-300',
                    'touch-manipulation active:scale-95 transition-transform',
                    'font-semibold'
                  )}
                >
                  <span className="text-lg">{table.name}</span>
                  {table.capacity && (
                    <span className="text-xs opacity-70">{table.capacity} seats</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No tables available
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t">
          <Button
            variant="outline"
            size="touch"
            className="w-full"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
