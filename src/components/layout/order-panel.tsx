import { Minus, Plus, Trash2 } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useCartStore, type CartItem } from '@/stores/cart.store'

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
  onPay?: () => void
  onHold?: () => void
}

export function OrderPanel({ className, onPay, onHold }: OrderPanelProps) {
  const {
    items,
    tableNumber,
    totals,
    updateQuantity,
    removeItem,
    clear,
  } = useCartStore()

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
            onClick={onHold}
            disabled={items.length === 0}
          >
            Hold
          </Button>
          <Button
            variant="success"
            size="touch"
            className="flex-1"
            onClick={onPay}
            disabled={items.length === 0}
          >
            Pay {formatCurrency(totals.grandTotal)}
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
