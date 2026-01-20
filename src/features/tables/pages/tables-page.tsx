import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient, endpoints } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableOrdersSheet } from '@/components/ui/table-orders-sheet'
import { TableSelectDialog } from '@/components/ui/table-select-dialog'
import { PaymentDialog, type PaymentMethod } from '@/components/ui/payment-dialog'
import { AlertDialog } from '@/components/ui/confirm-dialog'
import { cn, formatCurrency, generateId } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import { FloorPlanViewer } from '@/features/floor-plan/components/floor-plan-viewer'
import { getFloorPlans } from '@/features/floor-plan/api/floor-plan.api'
import type { CostCenterWithOrders, CostCenter, Terminal, Sale, CreateSaleInput } from '@/types/api.types'
import { Settings, ShoppingCart } from 'lucide-react'

// Payment method name mapping
const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  CARD_DEBIT: 'Debit Card',
  CARD_CREDIT: 'Credit Card',
  MOBILE_PAYMENT: 'Mobile Payment',
}

export function TablesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setTable = useCartStore((state) => state.setTable)
  const clearCart = useCartStore((state) => state.clear)
  const [selectedArea, setSelectedArea] = useState<string | null>(null)

  // Dialog states
  const [selectedTable, setSelectedTable] = useState<CostCenterWithOrders | null>(null)
  const [showActionsDialog, setShowActionsDialog] = useState(false)
  const [showChangeTableDialog, setShowChangeTableDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean
    title: string
    message: string
    variant: 'success' | 'destructive' | 'warning'
  }>({ open: false, title: '', message: '', variant: 'success' })

  // Fetch floor plans
  const { data: floorPlans, isLoading: loadingPlans } = useQuery({
    queryKey: ['floorPlans'],
    queryFn: getFloorPlans,
  })

  // Fetch tables with order status
  const { data: tables, isLoading: loadingTables, refetch: refetchTables } = useQuery({
    queryKey: ['cost-centers', 'tables', 'with-orders'],
    queryFn: async () => {
      const response = await apiClient.get<CostCenterWithOrders[]>(
        endpoints.costCenters.tablesWithOrders
      )
      return response.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Fetch terminals
  const { data: terminals } = useQuery({
    queryKey: ['terminals'],
    queryFn: async () => {
      const response = await apiClient.get<Terminal[]>(endpoints.terminals.list)
      return response.data
    },
  })

  const activeTerminal = terminals?.find((t) => t.isActive) || terminals?.[0]

  // Set default selected area when floor plans load
  useMemo(() => {
    if (floorPlans && floorPlans.length > 0 && !selectedArea) {
      setSelectedArea(floorPlans[0].areaName)
    }
  }, [floorPlans, selectedArea])

  // Get current floor plan
  const currentFloorPlan = useMemo(() => {
    if (!selectedArea || !floorPlans) return null
    return floorPlans.find((fp) => fp.areaName === selectedArea)
  }, [selectedArea, floorPlans])

  // Build table status map for the viewer
  // Keys include both costCenterId and various text formats the canvas might use
  const tableStatuses = useMemo(() => {
    if (!tables) return new Map()
    const map = new Map<string, {
      costCenterId: string
      hasOpenOrders: boolean
      totalAmount: number
      orderCount: number
    }>()

    tables.forEach((table) => {
      const statusData = {
        costCenterId: table.costCenterId,
        hasOpenOrders: table.hasOpenOrders,
        totalAmount: table.totalAmount,
        orderCount: table.orders?.length || 0,
      }

      // Add with costCenterId as key (e.g., "T01")
      map.set(table.costCenterId, statusData)

      // Also add with name as key (e.g., "Table 1")
      map.set(table.name, statusData)

      // Add with just the numeric part as key (e.g., "1" or "01")
      const numericPart = table.costCenterId.replace(/[^0-9]/g, '')
      if (numericPart) {
        map.set(numericPart, statusData)
        map.set(`T${numericPart}`, statusData) // e.g., "T1"
        map.set(`T0${numericPart}`, statusData) // e.g., "T01" (with leading zero)
      }
    })

    return map
  }, [tables])

  // Create sale mutation (for Settle Bill)
  const createSaleMutation = useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      const response = await apiClient.post<Sale>(endpoints.sales.create, input)
      return response.data
    },
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] })
      refetchTables()
      setShowPaymentDialog(false)
      setShowActionsDialog(false)
      setSelectedTable(null)
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

  // Handle table click - different behavior for empty vs occupied
  const handleTableClick = (tableText: string) => {
    console.log('Table clicked (text from canvas):', tableText)
    console.log('Available tables:', tables?.map(t => ({ costCenterId: t.costCenterId, name: t.name })))

    // The canvas stores table text like "T01" or "T1"
    // Try to find by costCenterId (exact match), then by partial match
    let table = tables?.find((t) => t.costCenterId === tableText)

    // If not found, try matching without the "T" prefix or with normalized format
    if (!table) {
      const numericPart = tableText.replace(/[^0-9]/g, '')
      table = tables?.find((t) => {
        const tableCostCenterNumeric = t.costCenterId.replace(/[^0-9]/g, '')
        return tableCostCenterNumeric === numericPart
      })
    }

    // Also try matching by name
    if (!table) {
      table = tables?.find((t) => t.name === tableText || t.name.includes(tableText))
    }

    if (!table) {
      console.log('Table not found for:', tableText)
      return
    }

    console.log('Found table:', table.name, 'costCenterId:', table.costCenterId, 'hasOpenOrders:', table.hasOpenOrders)

    if (table.hasOpenOrders) {
      // Table has orders - show actions dialog
      setSelectedTable(table)
      setShowActionsDialog(true)
    } else {
      // Empty table - go directly to POS with table selected
      clearCart()
      setTable(table.name, table.costCenterId)
      navigate('/pos')
    }
  }

  // Handle Add Items action
  const handleAddItems = () => {
    if (!selectedTable) return
    setShowActionsDialog(false)
    setTable(selectedTable.name, selectedTable.costCenterId)
    navigate('/pos')
  }

  // Handle Change Table action
  const handleChangeTable = () => {
    setShowActionsDialog(false)
    setShowChangeTableDialog(true)
  }

  // Handle table selection for change
  const handleTableChangeSelect = (_newTable: CostCenter) => {
    // TODO: Implement order transfer API call
    // For now, just show a message
    setShowChangeTableDialog(false)
    setAlertDialog({
      open: true,
      title: 'Coming Soon',
      message: 'Table change functionality will be available soon.',
      variant: 'warning',
    })
  }

  // Handle Settle Bill action
  const handleSettleBill = () => {
    setShowActionsDialog(false)
    setShowPaymentDialog(true)
  }

  // Handle payment confirmation
  const handlePaymentConfirm = (method: PaymentMethod, amountReceived?: number) => {
    if (!selectedTable || !activeTerminal) {
      setAlertDialog({
        open: true,
        title: 'Error',
        message: 'Missing table or terminal information.',
        variant: 'destructive',
      })
      return
    }

    // Collect all order line items from all orders on this table
    const allItems: { productId: string; quantity: number }[] = []
    selectedTable.orders?.forEach((order) => {
      order.orderLines?.forEach((line) => {
        allItems.push({
          productId: line.productId,
          quantity: Number(line.quantity),
        })
      })
    })

    if (allItems.length === 0) {
      setAlertDialog({
        open: true,
        title: 'Error',
        message: 'No items to settle.',
        variant: 'destructive',
      })
      return
    }

    // Get all order IDs to mark them as PAID
    const orderIds = selectedTable.orders?.map((order) => order.id) || []

    createSaleMutation.mutate({
      terminalId: activeTerminal.id,
      orderIds, // Mark all orders on this table as PAID
      items: allItems,
      payments: [
        {
          id: generateId(),
          name: PAYMENT_METHOD_NAMES[method],
          type: method,
          amount: amountReceived || selectedTable.totalAmount,
        },
      ],
    })
  }

  const handleManageFloorPlans = () => {
    navigate('/settings/floor-plans')
  }

  const handleNewOrder = () => {
    clearCart()
    navigate('/pos')
  }

  const isLoading = loadingPlans || loadingTables

  // Status legend
  const Legend = () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-emerald-500" />
        <span className="text-xs text-muted-foreground">Available</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <span className="text-xs text-muted-foreground">Occupied</span>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  // No floor plans - show empty state
  if (!floorPlans || floorPlans.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Tables</h1>
            <Badge variant="outline">{tables?.length ?? 0} tables</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Legend />
            <Button variant="outline" onClick={handleManageFloorPlans} className="gap-2">
              <Settings className="w-4 h-4" />
              Manage Floor Plans
            </Button>
            <Button size="touch" onClick={handleNewOrder} className="gap-2">
              <ShoppingCart className="w-5 h-5" />
              Order
            </Button>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">No Floor Plans</h2>
            <p className="text-muted-foreground mb-4">
              Create a floor plan to visualize your tables
            </p>
            <Button onClick={handleManageFloorPlans} className="gap-2">
              <Settings className="w-4 h-4" />
              Create Floor Plan
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Tables</h1>
          <Badge variant="outline">{tables?.length ?? 0} tables</Badge>
        </div>
        <div className="flex items-center gap-4">
          <Legend />
          <Button variant="outline" onClick={handleManageFloorPlans} className="gap-2">
            <Settings className="w-4 h-4" />
            Manage Floor Plans
          </Button>
          <Button size="touch" onClick={handleNewOrder} className="gap-2">
            <ShoppingCart className="w-5 h-5" />
            Order
          </Button>
        </div>
      </div>

      {/* Floor Plan View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center bg-slate-100 p-4 overflow-auto">
          {currentFloorPlan ? (
            <div className="bg-white rounded-lg shadow-lg">
              <FloorPlanViewer
                canvasJson={currentFloorPlan.canvasJson}
                tableStatuses={tableStatuses}
                onTableClick={handleTableClick}
                width={900}
                height={600}
              />
            </div>
          ) : (
            <div className="text-muted-foreground">Select a floor plan</div>
          )}
        </div>

        {/* Area tabs at bottom */}
        {floorPlans.length > 1 && (
          <div className="px-4 py-3 border-t bg-card flex items-center gap-2">
            {floorPlans.map((plan) => (
              <Button
                key={plan.id}
                variant={selectedArea === plan.areaName ? 'default' : 'outline'}
                size="lg"
                onClick={() => setSelectedArea(plan.areaName)}
                className={cn(
                  'min-w-[120px]',
                  selectedArea === plan.areaName && 'bg-primary text-primary-foreground'
                )}
              >
                {plan.areaName}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Table Orders Sheet (for occupied tables) */}
      <TableOrdersSheet
        open={showActionsDialog}
        onClose={() => {
          setShowActionsDialog(false)
          setSelectedTable(null)
        }}
        table={selectedTable}
        onAddItems={handleAddItems}
        onChangeTable={handleChangeTable}
        onSettleBill={handleSettleBill}
      />

      {/* Table Selection Dialog (for changing tables) */}
      <TableSelectDialog
        open={showChangeTableDialog}
        onClose={() => setShowChangeTableDialog(false)}
        onSelect={handleTableChangeSelect}
        title="Move Order To"
      />

      {/* Payment Dialog (for settling bills) */}
      <PaymentDialog
        open={showPaymentDialog}
        onClose={() => {
          setShowPaymentDialog(false)
          setShowActionsDialog(true)
        }}
        onConfirm={handlePaymentConfirm}
        total={selectedTable?.totalAmount || 0}
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
