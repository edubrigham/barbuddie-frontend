import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import { cn, formatCurrency, generateId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TableSelectDialog } from '@/components/ui/table-select-dialog'
import { PaymentDialog, type PaymentMethod } from '@/components/ui/payment-dialog'
import { AlertDialog } from '@/components/ui/confirm-dialog'
import { useCartStore, type CartItem } from '@/stores/cart.store'
import { apiClient, endpoints } from '@/lib/api'
import type { CostCenter, Order, CreateOrderInput, Terminal, Sale, CreateSaleInput } from '@/types/api.types'

interface OrderItemRowProps {
  item: CartItem
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
}

function OrderItemRow({ item, onIncrement, onDecrement, onRemove }: OrderItemRowProps) {
  return (
    <div className="flex w-full items-center gap-2 px-4 py-3">
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="h-8 w-8 flex items-center justify-center text-red-500 rounded-full touch-manipulation active:scale-95 active:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        {item.size && (
          <p className="text-xs text-muted-foreground">{item.size}</p>
        )}
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onDecrement}
          className="h-7 w-7 flex items-center justify-center bg-muted rounded-full touch-manipulation active:scale-95"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
        <button
          onClick={onIncrement}
          className="h-7 w-7 flex items-center justify-center bg-primary text-white rounded-full touch-manipulation active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Price */}
      <p className="w-20 text-right font-semibold text-sm tabular-nums">
        {formatCurrency(item.price * item.quantity)}
      </p>
    </div>
  )
}

interface OrderPanelProps {
  className?: string
}

// Payment method name mapping
const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  CARD_DEBIT: 'Debit Card',
  CARD_CREDIT: 'Credit Card',
  MOBILE_PAYMENT: 'Mobile Payment',
}

export function OrderPanel({ className }: OrderPanelProps) {
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
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
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

  // Create sale mutation (for Pay)
  const createSaleMutation = useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      const response = await apiClient.post<Sale>(endpoints.sales.create, input)
      return response.data
    },
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      clear()
      setShowPaymentDialog(false)
      setAlertDialog({
        open: true,
        title: 'Payment Complete',
        message: `Ticket #${sale.posFiscalTicketNo} - ${formatCurrency(Number(sale.transactionTotal))}`,
        variant: 'success',
      })
    },
    onError: (error) => {
      console.error('Failed to create sale:', error)
      setAlertDialog({
        open: true,
        title: 'Payment Failed',
        message: 'Failed to process payment. Please try again.',
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

  // Handle Pay button - show payment dialog
  const handlePay = () => {
    if (items.length === 0) return
    setShowPaymentDialog(true)
  }

  // Handle payment confirmation
  const handlePaymentConfirm = (method: PaymentMethod, amountReceived?: number) => {
    if (!activeTerminal) {
      setAlertDialog({
        open: true,
        title: 'Error',
        message: 'No terminal configured. Please set up a terminal in settings.',
        variant: 'destructive',
      })
      return
    }

    createSaleMutation.mutate({
      terminalId: activeTerminal.id,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      payments: [
        {
          id: generateId(),
          name: PAYMENT_METHOD_NAMES[method],
          type: method,
          amount: amountReceived || totals.grandTotal,
        },
      ],
    })
  }

  // Header background color - red when table selected (like occupied), primary when new order
  const hasTable = !!tableNumber
  const headerBgClass = hasTable ? 'bg-blue-500' : 'bg-primary'

  return (
    <div className={cn('h-full bg-card border-l flex flex-col', className)}>
      {/* Header - matches TableOrdersSheet style */}
      <div className={cn('px-4 py-4 text-white', headerBgClass)}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {tableNumber || 'New Order'}
          </h2>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 opacity-80" />
            <span className="text-lg font-bold">{totals.itemCount}</span>
          </div>
        </div>
        <p className="text-sm text-white/80 mt-1">
          {items.length} item{items.length !== 1 ? 's' : ''} - {formatCurrency(totals.grandTotal)}
        </p>
      </div>

      {/* Items list header */}
      {items.length > 0 && (
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
          <span className="w-8"></span>
          <span>Item</span>
          <span className="w-24 text-center">Qty</span>
          <span className="w-20 text-right">Price</span>
        </div>
      )}

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

      {/* Footer - matches TableOrdersSheet style */}
      <div className="border-t bg-muted/30">
        {/* Totals */}
        <div className="px-4 py-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT</span>
            <span>{formatCurrency(totals.vatAmount)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t mt-2">
            <span className="text-muted-foreground">Grand Total</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-4 space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleHold}
              disabled={items.length === 0 || createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? 'Saving...' : 'Hold'}
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-green-500 active:bg-green-600"
              onClick={handlePay}
              disabled={items.length === 0 || createSaleMutation.isPending}
            >
              Pay
            </Button>
          </div>

          {/* Clear button */}
          {items.length > 0 && (
            <Button
              variant="outline"
              size="lg"
              className="w-full text-red-500 border-red-200 active:bg-red-50"
              onClick={clear}
            >
              Clear Order
            </Button>
          )}
        </div>
      </div>

      {/* Table Selection Dialog */}
      <TableSelectDialog
        open={showTableSelect}
        onClose={() => setShowTableSelect(false)}
        onSelect={handleTableSelect}
        title="Hold Order - Select Table"
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onConfirm={handlePaymentConfirm}
        total={totals.grandTotal}
        isPending={createSaleMutation.isPending}
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
