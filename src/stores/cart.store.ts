import { create } from 'zustand'
import { generateId, VAT_RATES, type VatLabel } from '@/lib/utils'

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  size?: string
  vatLabel: VatLabel
  notes?: string
}

export interface CartTotals {
  subtotal: number
  vatAmount: number
  grandTotal: number
  itemCount: number
}

interface CartState {
  // State
  items: CartItem[]
  tableNumber: string | null
  costCenterId: string | null
  notes: string

  // Computed
  totals: CartTotals

  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>, quantity?: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  updateNotes: (itemId: string, notes: string) => void
  setTable: (tableNumber: string, costCenterId: string) => void
  setOrderNotes: (notes: string) => void
  clear: () => void
}

// Helper to calculate totals
function calculateTotals(items: CartItem[]): CartTotals {
  let subtotal = 0
  let vatAmount = 0

  items.forEach((item) => {
    const lineTotal = item.price * item.quantity
    subtotal += lineTotal

    // Calculate VAT for this item
    const vatRate = VAT_RATES[item.vatLabel] || 0
    vatAmount += lineTotal * vatRate / (1 + vatRate)
  })

  return {
    subtotal,
    vatAmount,
    grandTotal: subtotal,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}

// Helper to update state with recalculated totals
const updateWithTotals = (items: CartItem[]) => ({
  items,
  totals: calculateTotals(items),
})

export const useCartStore = create<CartState>((set, get) => ({
  // Initial state
  items: [],
  tableNumber: null,
  costCenterId: null,
  notes: '',
  totals: { subtotal: 0, vatAmount: 0, grandTotal: 0, itemCount: 0 },

  // Actions
  addItem: (itemData, quantity = 1) => {
    const items = get().items

    // Check if item with same productId and size exists
    const existingIndex = items.findIndex(
      (item) => item.productId === itemData.productId && item.size === itemData.size
    )

    let newItems: CartItem[]
    if (existingIndex >= 0) {
      // Update quantity of existing item
      newItems = [...items]
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + quantity,
      }
    } else {
      // Add new item
      newItems = [
        ...items,
        {
          ...itemData,
          id: generateId(),
          quantity,
        },
      ]
    }
    set(updateWithTotals(newItems))
  },

  removeItem: (itemId) => {
    const newItems = get().items.filter((item) => item.id !== itemId)
    set(updateWithTotals(newItems))
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId)
      return
    }

    const newItems = get().items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    )
    set(updateWithTotals(newItems))
  },

  updateNotes: (itemId, notes) => {
    const newItems = get().items.map((item) =>
      item.id === itemId ? { ...item, notes } : item
    )
    set(updateWithTotals(newItems))
  },

  setTable: (tableNumber, costCenterId) => {
    set({ tableNumber, costCenterId })
  },

  setOrderNotes: (notes) => {
    set({ notes })
  },

  clear: () => {
    set({
      items: [],
      tableNumber: null,
      costCenterId: null,
      notes: '',
      totals: { subtotal: 0, vatAmount: 0, grandTotal: 0, itemCount: 0 },
    })
  },
}))
