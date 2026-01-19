import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient, endpoints } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import { FloorPlanViewer } from '@/features/floor-plan/components/floor-plan-viewer'
import { getFloorPlans } from '@/features/floor-plan/api/floor-plan.api'
import type { CostCenterWithOrders } from '@/types/api.types'
import { Settings, ShoppingCart } from 'lucide-react'

export function TablesPage() {
  const navigate = useNavigate()
  const setTable = useCartStore((state) => state.setTable)
  const [selectedArea, setSelectedArea] = useState<string | null>(null)

  // Fetch floor plans
  const { data: floorPlans, isLoading: loadingPlans } = useQuery({
    queryKey: ['floorPlans'],
    queryFn: getFloorPlans,
  })

  // Fetch tables with order status
  const { data: tables, isLoading: loadingTables } = useQuery({
    queryKey: ['cost-centers', 'tables', 'with-orders'],
    queryFn: async () => {
      const response = await apiClient.get<CostCenterWithOrders[]>(
        endpoints.costCenters.tablesWithOrders
      )
      return response.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

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
  const tableStatuses = useMemo(() => {
    if (!tables) return new Map()
    const map = new Map<string, {
      costCenterId: string
      hasOpenOrders: boolean
      totalAmount: number
      orderCount: number
    }>()

    tables.forEach((table) => {
      map.set(table.costCenterId, {
        costCenterId: table.costCenterId,
        hasOpenOrders: table.hasOpenOrders,
        totalAmount: table.totalAmount,
        orderCount: table.orders?.length || 0,
      })
    })

    return map
  }, [tables])

  const handleTableClick = (tableNumber: string) => {
    const table = tables?.find((t) => t.costCenterId === tableNumber)
    if (table) {
      setTable(table.name, table.costCenterId)
      navigate('/pos')
    }
  }

  const handleManageFloorPlans = () => {
    navigate('/settings/floor-plans')
  }

  const handleNewOrder = () => {
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
    </div>
  )
}
