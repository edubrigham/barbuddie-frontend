import { useQuery } from '@tanstack/react-query'
import { apiClient, endpoints } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency, formatTime } from '@/lib/utils'
import type { Order } from '@/types/api.types'

const statusVariantMap = {
  OPEN: 'inProgress',
  PREBILL_PRINTED: 'prepared',
  PARTIALLY_PAID: 'warning',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const

export function OrdersPage() {
  // Fetch open orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', { status: 'OPEN' }],
    queryFn: async () => {
      const response = await apiClient.get<Order[]>(endpoints.orders.list, {
        params: { status: 'OPEN' },
      })
      return response.data
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6">
      <h1 className="text-2xl font-bold mb-6">Active Orders</h1>

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No active orders
            </div>
          )}

          {orders?.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-lg font-bold">{order.orderReference}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.costCenter?.name || 'No table'}
                  </p>
                </div>
                <Badge variant={statusVariantMap[order.status]}>
                  {order.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="space-y-1 mb-3">
                {order.orderLines.slice(0, 3).map((line) => (
                  <div key={line.id} className="flex justify-between text-sm">
                    <span>
                      {line.quantity}x Product
                    </span>
                    <span>{formatCurrency(line.lineTotal)}</span>
                  </div>
                ))}
                {order.orderLines.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{order.orderLines.length - 3} more items
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm text-muted-foreground">
                  {formatTime(order.createdAt)}
                </span>
                <span className="font-bold text-primary">
                  {formatCurrency(
                    order.orderLines.reduce((sum, line) => sum + line.lineTotal, 0)
                  )}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
