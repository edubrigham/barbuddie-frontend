import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { TableSelectDialog } from '@/components/ui/table-select-dialog'
import { AlertDialog } from '@/components/ui/confirm-dialog'
import { useCartStore, type CartItem } from '@/stores/cart.store'
import { apiClient, endpoints } from '@/lib/api'
import type { CostCenter, Order, CreateOrderInput, Terminal } from '@/types/api.types'

interface OrderItemRowProps {
  item: CartItem
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
}

function OrderItemRow({ item, onIncrement, onDecrement, onRemove }: OrderItemRowProps) {
  const itemName =
    item.name.length > 15 ? `${item.name.slice(0, 10)}...` : item.name

  return (
    <div className="flex w-full items-center gap-1 px-2 py-3">
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="h-8 w-8 flex items-center justify-center text-danger hover:bg-danger/10 rounded-full transition-colors touch-manipulation active:scale-95"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Item info */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-sm font-medium truncate">{itemName}</p>
        {item.size && (
          <p className="text-xs text-muted-foreground truncate">{item.size}</p>
        )}
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onDecrement}
          className="h-6 w-6 flex items-center justify-center bg-muted rounded-full touch-manipulation active:scale-95"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center font-semibold">{item.quantity}</span>
        <button
          onClick={onIncrement}
          className="h-6 w-6 flex items-center justify-center bg-primary text-white rounded-full touch-manipulation active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Price */}
      <p className="w-24 shrink-0 text-right font-semibold tabular-nums">
        {formatCurrency(item.price * item.quantity)}
      </p>
    </div>
  )
}

interface OrderPanelProps {
  className?: string
}

export function OrderPanel({ className }: OrderPanelProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    items,
    tableNumber,
    costCenterId,
    totals,
    updateQuantity,
    removeItem,
    setTable,
    clear,
  } = useCartStore()

  // Fetch terminals to get a valid terminal ID
  const { data: terminals } = useQuery({
    queryKey: ['terminals'],
    queryFn: async () => {
      const response = await apiClient.get<Terminal[]>(endpoints.terminals.list)
      return response.data
    },
  })

  // Get the first active terminal
  const activeTerminal = terminals?.find((t) => t.isActive) || terminals?.[0]

  // Dialog states
  const [showTableSelect, setShowTableSelect] = useState(false)
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean
    title: string
    message: string
    variant: 'success' | 'destructive' | 'warning'
  }>({ open: false, title: '', message: '', variant: 'success' })

  // Create order mutation (for Hold)
  const createOrderMutation = useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const response = await apiClient.post<Order>(endpoints.orders.create, input)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] })
      clear()
      setAlertDialog({
        open: true,
        title: 'Order Held',
        message: `Order placed for ${tableNumber}`,
        variant: 'success',
      })
    },
    onError: (error) => {
      console.error('Failed to create order:', error)
      setAlertDialog({
        open: true,
        title: 'Error',
        message: 'Failed to place order. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const handleIncrement = (itemId: string, currentQty: number) => {
    updateQuantity(itemId, currentQty + 1)
  }

  const handleDecrement = (itemId: string, currentQty: number) => {
    if (currentQty > 1) {
      updateQuantity(itemId, currentQty - 1)
    } else {
      removeItem(itemId)
    }
  }

  // Handle Hold button - show table selection if no table selected
  const handleHold = () => {
    if (items.length === 0) return

    if (!costCenterId) {
      setShowTableSelect(true)
    } else {
      // Table already selected, create order directly
      submitOrder(costCenterId)
    }
  }

  // Handle table selection from dialog
  const handleTableSelect = (table: CostCenter) => {
    setTable(table.name, table.costCenterId)
    setShowTableSelect(false)
    submitOrder(table.costCenterId)
  }

  // Submit order to backend
  const submitOrder = (targetCostCenterId: string) => {
    if (!activeTerminal) {
      setAlertDialog({
        open: true,
        title: 'Error',
        message: 'No terminal configured. Please set up a terminal in settings.',
        variant: 'destructive',
      })
      return
    }

    createOrderMutation.mutate({
      costCenterId: targetCostCenterId,
      terminalId: activeTerminal.id,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes,
      })),
    })
  }

  // Handle Pay button - navigate to payment screen
  const handlePay = () => {
    if (items.length === 0) return
    // For now, navigate to a payment flow (can be expanded later)
    // TODO: Implement full payment flow with payment method selection
    navigate('/payment')
  }

  return (
    <div className={cn('h-full bg-card border-l flex flex-col', className)}>
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b bg-primary text-white">
        <div>
          <p className="text-sm opacity-80">Table</p>
          <p className="text-xl font-bold">{tableNumber || 'Not selected'}</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-80">Items</p>
          <p className="text-xl font-bold">{totals.itemCount}</p>
        </div>
      </div>

      {/* Items list */}
      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <ShoppingCartEmpty className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No items in order</p>
            <p className="text-xs">Tap products to add them</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <OrderItemRow
                key={item.id}
                item={item}
                onIncrement={() => handleIncrement(item.id, item.quantity)}
                onDecrement={() => handleDecrement(item.id, item.quantity)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer with totals */}
      <div className="border-t bg-muted/30 p-6">
        {/* Subtotal */}
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>

        {/* VAT */}
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">VAT</span>
          <span>{formatCurrency(totals.vatAmount)}</span>
        </div>

        <Separator className="my-3" />

        {/* Grand Total */}
        <div className="flex justify-between text-lg font-bold mb-4">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(totals.grandTotal)}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="touch"
            className="flex-1"
            onClick={handleHold}
            disabled={items.length === 0 || createOrderMutation.isPending}
          >
            {createOrderMutation.isPending ? 'Saving...' : 'Hold'}
          </Button>
          <Button
            variant="success"
            size="touch"
            className="flex-1"
            onClick={handlePay}
            disabled={items.length === 0}
          >
            Pay
          </Button>
        </div>

        {/* Clear button */}
        {items.length > 0 && (
          <Button
            size="touch"
            className="w-full mt-3 bg-danger text-white"
            onClick={clear}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Table Selection Dialog */}
      <TableSelectDialog
        open={showTableSelect}
        onClose={() => setShowTableSelect(false)}
        onSelect={handleTableSelect}
        title="Hold Order - Select Table"
      />

      {/* Alert Dialog for feedback */}
      <AlertDialog
        open={alertDialog.open}
        onClose={() => setAlertDialog((prev) => ({ ...prev, open: false }))}
        title={alertDialog.title}
        description={alertDialog.message}
        variant={alertDialog.variant}
      />
    </div>
  )
}

// Empty cart icon
function ShoppingCartEmpty({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}
