import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from './sheet'
import { Button } from './button'
import { ScrollArea } from './scroll-area'
import { formatCurrency } from '@/lib/utils'
import {
  X,
  CreditCard,
  Plus,
  ArrowRightLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import type { CostCenterWithOrders, Order } from '@/types/api.types'

interface TableOrdersSheetProps {
  open: boolean
  onClose: () => void
  table: CostCenterWithOrders | null
  onAddItems: () => void
  onChangeTable: () => void
  onSettleBill: () => void
}

interface OrderRowProps {
  order: Order
  isExpanded: boolean
  onToggle: () => void
}

function OrderRow({ order, isExpanded, onToggle }: OrderRowProps) {
  const orderTime = new Date(order.createdAt).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const itemCount = order.orderLines?.length || 0
  const orderTotal = order.orderLines?.reduce(
    (sum, line) => sum + Number(line.lineTotal),
    0
  ) || 0

  return (
    <div className="border-b last:border-b-0">
      {/* Order Summary Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 active:bg-muted/50 touch-manipulation"
      >
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
          <span className="font-medium text-left truncate">
            #{order.orderReference.slice(-4)}
          </span>
          <span className="text-muted-foreground text-center">{orderTime}</span>
          <span className="text-center">{itemCount}</span>
          <span className="font-semibold text-right">{formatCurrency(orderTotal)}</span>
        </div>
      </button>

      {/* Expanded Order Details */}
      {isExpanded && (
        <div className="bg-muted/30 px-4 py-3">
          <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground mb-2 px-8">
            <span>Item</span>
            <span className="text-center">Size</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Price</span>
          </div>
          <div className="space-y-2">
            {order.orderLines?.map((line) => (
              <div key={line.id} className="grid grid-cols-4 gap-2 text-sm px-8">
                <span className="font-medium truncate">{line.productId}</span>
                <span className="text-center text-muted-foreground">-</span>
                <span className="text-center">{line.quantity}</span>
                <span className="text-right">{formatCurrency(Number(line.lineTotal))}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function TableOrdersSheet({
  open,
  onClose,
  table,
  onAddItems,
  onChangeTable,
  onSettleBill,
}: TableOrdersSheetProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  if (!table) return null

  const grandTotal = table.totalAmount || 0
  const orders = table.orders || []

  const handleToggleOrder = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b bg-blue-500 text-white">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold text-white">
              {table.name}
            </SheetTitle>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30 touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-white/80">
            {orders.length} order{orders.length !== 1 ? 's' : ''} - {formatCurrency(grandTotal)}
          </p>
        </SheetHeader>

        {/* Action Buttons */}
        <div className="flex gap-2 p-4 border-b">
          <Button
            variant="default"
            size="lg"
            className="flex-1 bg-green-500 active:bg-green-600"
            onClick={onSettleBill}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Settle Bill
          </Button>
          <Button
            variant="default"
            size="lg"
            className="flex-1"
            onClick={onAddItems}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Items
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onChangeTable}
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Move
          </Button>
        </div>

        {/* Orders List Header */}
        <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
          <span className="pl-8">Order</span>
          <span className="text-center">Time</span>
          <span className="text-center">Items</span>
          <span className="text-right">Price</span>
        </div>

        {/* Orders List */}
        <ScrollArea className="flex-1">
          {orders.length > 0 ? (
            orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                isExpanded={expandedOrderId === order.id}
                onToggle={() => handleToggleOrder(order.id)}
              />
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No orders for this table
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t bg-muted/30 px-4 py-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Grand Total</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
