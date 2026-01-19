import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatTableNumber, parseTableNumber } from '../utils/fabric-helpers'

interface TableEditDialogProps {
  open: boolean
  onClose: () => void
  tableNumber: string
  capacity: number
  existingNumbers: string[]
  onSave: (tableNumber: string, capacity: number) => void
  onDelete: () => void
}

export function TableEditDialog({
  open,
  onClose,
  tableNumber: initialTableNumber,
  capacity: initialCapacity,
  existingNumbers,
  onSave,
  onDelete,
}: TableEditDialogProps) {
  const [numberInput, setNumberInput] = useState('')
  const [capacityInput, setCapacityInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      // Extract just the number part (e.g., "T01" -> "1")
      const num = parseTableNumber(initialTableNumber)
      setNumberInput(String(num))
      setCapacityInput(String(initialCapacity))
      setError(null)
    }
  }, [open, initialTableNumber, initialCapacity])

  const handleSave = () => {
    const num = parseInt(numberInput, 10)
    const cap = parseInt(capacityInput, 10)

    if (isNaN(num) || num < 1 || num > 99) {
      setError('Table number must be between 1 and 99')
      return
    }

    if (isNaN(cap) || cap < 1 || cap > 20) {
      setError('Capacity must be between 1 and 20')
      return
    }

    const formattedNumber = formatTableNumber(num)

    // Check uniqueness (excluding current table)
    const otherNumbers = existingNumbers.filter(
      (n) => n !== initialTableNumber
    )
    if (otherNumbers.includes(formattedNumber)) {
      setError(`Table ${formattedNumber} already exists`)
      return
    }

    onSave(formattedNumber, cap)
    onClose()
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this table?')) {
      onDelete()
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>Edit Table</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Table Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Table Number
            </label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">T</span>
              <Input
                type="number"
                min={1}
                max={99}
                value={numberInput}
                onChange={(e) => {
                  setNumberInput(e.target.value)
                  setError(null)
                }}
                placeholder="01"
                className="w-20"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter a number between 1-99
            </p>
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Capacity (seats)
            </label>
            <Input
              type="number"
              min={1}
              max={20}
              value={capacityInput}
              onChange={(e) => {
                setCapacityInput(e.target.value)
                setError(null)
              }}
              placeholder="4"
              className="w-20"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="destructive" onClick={handleDelete}>
            Delete Table
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
