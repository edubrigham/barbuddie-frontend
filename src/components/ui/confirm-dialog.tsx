import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react'

type DialogVariant = 'default' | 'success' | 'warning' | 'destructive'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: DialogVariant
  loading?: boolean
}

const variantConfig: Record<
  DialogVariant,
  { icon: React.ReactNode; iconBg: string; confirmVariant: 'default' | 'destructive' }
> = {
  default: {
    icon: <Info className="h-8 w-8 text-primary" />,
    iconBg: 'bg-primary/10',
    confirmVariant: 'default',
  },
  success: {
    icon: <CheckCircle className="h-8 w-8 text-emerald-600" />,
    iconBg: 'bg-emerald-100',
    confirmVariant: 'default',
  },
  warning: {
    icon: <AlertTriangle className="h-8 w-8 text-amber-600" />,
    iconBg: 'bg-amber-100',
    confirmVariant: 'default',
  },
  destructive: {
    icon: <Trash2 className="h-8 w-8 text-destructive" />,
    iconBg: 'bg-destructive/10',
    confirmVariant: 'destructive',
  },
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant]

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader className="items-center text-center space-y-4">
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center',
              config.iconBg
            )}
          >
            {config.icon}
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-base">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-6">
          <Button
            size="touch"
            variant={config.confirmVariant}
            onClick={handleConfirm}
            disabled={loading}
            className="w-full text-lg font-semibold"
          >
            {loading ? 'Please wait...' : confirmText}
          </Button>
          <Button
            size="touch"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full text-lg"
          >
            {cancelText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Simple alert/info dialog (single button)
interface AlertDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  buttonText?: string
  variant?: DialogVariant
}

export function AlertDialog({
  open,
  onClose,
  title,
  description,
  buttonText = 'OK',
  variant = 'default',
}: AlertDialogProps) {
  const config = variantConfig[variant]

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader className="items-center text-center space-y-4">
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center',
              config.iconBg
            )}
          >
            {config.icon}
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-base">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="mt-6">
          <Button
            size="touch"
            variant="default"
            onClick={onClose}
            className="w-full text-lg font-semibold"
          >
            {buttonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
