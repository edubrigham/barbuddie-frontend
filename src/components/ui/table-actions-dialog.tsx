import { Button } from './button'
import { formatCurrency } from '@/lib/utils'
import { Plus, ArrowRightLeft, CreditCard } from 'lucide-react'
import type { CostCenterWithOrders } from '@/types/api.types'

interface TableActionsDialogProps {
  open: boolean
  onClose: () => void
  table: CostCenterWithOrders | null
  onAddItems: () => void
  onChangeTable: () => void
  onSettleBill: () => void
}

export function TableActionsDialog({
  open,
  onClose,
  table,
  onAddItems,
  onChangeTable,
  onSettleBill,
}: TableActionsDialogProps) {
  if (!open || !table) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-card rounded-xl shadow-xl w-[400px] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-red-500 text-white">
          <h2 className="text-xl font-bold">{table.name}</h2>
          <p className="text-sm opacity-80">
            {table.orders?.length || 0} order{(table.orders?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Order Summary */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(table.totalAmount)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-3">
          <Button
            size="touch"
            className="w-full gap-3 justify-start px-6"
            onClick={onAddItems}
          >
            <Plus className="w-5 h-5" />
            Add Items
          </Button>

          <Button
            variant="outline"
            size="touch"
            className="w-full gap-3 justify-start px-6"
            onClick={onChangeTable}
          >
            <ArrowRightLeft className="w-5 h-5" />
            Change Table
          </Button>

          <Button
            variant="success"
            size="touch"
            className="w-full gap-3 justify-start px-6"
            onClick={onSettleBill}
          >
            <CreditCard className="w-5 h-5" />
            Settle Bill
          </Button>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <Button
            variant="ghost"
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
