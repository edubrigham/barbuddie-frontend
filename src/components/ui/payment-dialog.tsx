import { useState } from 'react'
import { Button } from './button'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export type PaymentMethod = 'CASH' | 'CARD_DEBIT' | 'CARD_CREDIT' | 'MOBILE_PAYMENT'

interface PaymentDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (method: PaymentMethod, amountReceived?: number) => void
  total: number
  isPending?: boolean
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'CASH', label: 'Cash', icon: '💵' },
  { id: 'CARD_DEBIT', label: 'Debit Card', icon: '💳' },
  { id: 'CARD_CREDIT', label: 'Credit Card', icon: '💳' },
  { id: 'MOBILE_PAYMENT', label: 'Mobile', icon: '📱' },
]

const QUICK_AMOUNTS = [5, 10, 20, 50, 100]

export function PaymentDialog({
  open,
  onClose,
  onConfirm,
  total,
  isPending = false,
}: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [amountReceived, setAmountReceived] = useState<string>('')

  if (!open) return null

  const numericAmount = parseFloat(amountReceived) || 0
  const change = numericAmount - total

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method)
    if (method !== 'CASH') {
      // For non-cash, auto-set amount to total
      setAmountReceived(total.toFixed(2))
    } else {
      setAmountReceived('')
    }
  }

  const handleQuickAmount = (amount: number) => {
    setAmountReceived(amount.toFixed(2))
  }

  const handleConfirm = () => {
    if (!selectedMethod) return
    onConfirm(selectedMethod, selectedMethod === 'CASH' ? numericAmount : total)
  }

  const canConfirm = selectedMethod && (selectedMethod !== 'CASH' || numericAmount >= total)

  const handleClose = () => {
    setSelectedMethod(null)
    setAmountReceived('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative bg-card rounded-xl shadow-xl w-[480px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-primary text-white">
          <h2 className="text-xl font-bold">Payment</h2>
          <p className="text-3xl font-bold mt-1">{formatCurrency(total)}</p>
        </div>

        {/* Payment Methods */}
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-3">Select payment method</p>
          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => handleMethodSelect(method.id)}
                className={cn(
                  'h-20 rounded-xl flex flex-col items-center justify-center gap-1',
                  'border-2 transition-all touch-manipulation active:scale-95',
                  selectedMethod === method.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card'
                )}
              >
                <span className="text-2xl">{method.icon}</span>
                <span className="font-semibold">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cash Amount Entry */}
        {selectedMethod === 'CASH' && (
          <div className="px-4 pb-4">
            <p className="text-sm text-muted-foreground mb-2">Amount received</p>

            {/* Quick amounts */}
            <div className="flex gap-2 mb-3">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickAmount(amount)}
                  className={cn(
                    'flex-1 py-2 rounded-lg border font-semibold',
                    'touch-manipulation active:scale-95',
                    numericAmount === amount
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border'
                  )}
                >
                  €{amount}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                €
              </span>
              <input
                type="number"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0.00"
                className="w-full h-14 pl-10 pr-4 text-2xl font-bold text-right border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Change display */}
            {numericAmount > 0 && (
              <div className={cn(
                'mt-3 p-3 rounded-lg text-center',
                change >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              )}>
                <p className="text-sm">
                  {change >= 0 ? 'Change' : 'Amount due'}
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(Math.abs(change))}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 flex gap-3">
          <Button
            variant="outline"
            size="touch"
            className="flex-1"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            size="touch"
            className="flex-1"
            onClick={handleConfirm}
            disabled={!canConfirm || isPending}
          >
            {isPending ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </div>
      </div>
    </div>
  )
}
