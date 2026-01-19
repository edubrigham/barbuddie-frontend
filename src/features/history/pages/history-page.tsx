import { useQuery } from '@tanstack/react-query'
import { apiClient, endpoints } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { Sale } from '@/types/api.types'

export function HistoryPage() {
  // Fetch sales history
  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const response = await apiClient.get<Sale[]>(endpoints.sales.list)
      return response.data
    },
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
      <h1 className="text-2xl font-bold mb-6">Sales History</h1>

      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {sales?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No sales recorded yet
            </div>
          )}

          {sales?.map((sale) => (
            <Card key={sale.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">Ticket #{sale.posFiscalTicketNo}</p>
                    {sale.isRefund && (
                      <Badge variant="destructive">Refund</Badge>
                    )}
                    {sale.isTraining && (
                      <Badge variant="secondary">Training</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(sale.createdAt)}
                  </p>
                </div>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(sale.transactionTotal)}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t">
                <div className="flex gap-2 flex-wrap">
                  {sale.payments.map((payment) => (
                    <Badge key={payment.id} variant="outline">
                      {payment.name}: {formatCurrency(payment.amount)}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
