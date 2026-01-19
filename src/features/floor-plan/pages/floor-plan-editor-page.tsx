import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as fabric from 'fabric'
import { Button } from '@/components/ui/button'
import { AlertDialog } from '@/components/ui/confirm-dialog'
import { ShapePalette } from '../components/shape-palette'
import { FloorCanvas } from '../components/floor-canvas'
import {
  createTableGroup,
  createWall,
  getTableNumbersFromCanvas,
  generateNextTableNumber,
  getTablesFromCanvas,
  type TableShapeType,
} from '../utils/fabric-helpers'
import {
  getFloorPlan,
  syncFloorPlan,
  type FloorPlanTable,
} from '../api/floor-plan.api'

type DialogType = 'success' | 'destructive' | 'warning' | null

// Default area name for new floor plans
const DEFAULT_AREA = 'Main Floor'

export function FloorPlanEditorPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { areaName: routeAreaName } = useParams<{ areaName?: string }>()

  // Initialize area name from route param or default
  const [areaName, setAreaName] = useState(
    routeAreaName ? decodeURIComponent(routeAreaName) : DEFAULT_AREA
  )
  const [isEditingName, setIsEditingName] = useState(false)
  const [tableCount, setTableCount] = useState(0)
  const [hasLoaded, setHasLoaded] = useState(false)
  const canvasRef = useRef<fabric.Canvas | null>(null)
  const isEditing = !!routeAreaName

  // Dialog state
  const [dialogType, setDialogType] = useState<DialogType>(null)
  const [dialogMessage, setDialogMessage] = useState('')
  const [shouldNavigateOnClose, setShouldNavigateOnClose] = useState(false)

  // Fetch floor plan from backend (only if editing existing)
  const { data: floorPlanData, isLoading } = useQuery({
    queryKey: ['floorPlan', areaName],
    queryFn: () => getFloorPlan(areaName),
    enabled: isEditing && !hasLoaded,
  })

  // Dialog close handler
  const handleDialogClose = useCallback(() => {
    setDialogType(null)
    setDialogMessage('')
    if (shouldNavigateOnClose) {
      setShouldNavigateOnClose(false)
      navigate('/settings/floor-plans')
    }
  }, [shouldNavigateOnClose, navigate])

  // Show dialog helper
  const showDialog = useCallback((type: DialogType, message: string, navigateOnClose = false) => {
    setDialogType(type)
    setDialogMessage(message)
    setShouldNavigateOnClose(navigateOnClose)
  }, [])

  // Sync floor plan mutation
  const syncMutation = useMutation({
    mutationFn: syncFloorPlan,
    onSuccess: (result) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['floorPlan'] })
      queryClient.invalidateQueries({ queryKey: ['floorPlans'] })
      queryClient.invalidateQueries({ queryKey: ['costCenters'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })

      // Show success and navigate back
      showDialog('success', `Saved! ${result.created} new, ${result.updated} updated`, true)
    },
    onError: (error) => {
      console.error('Failed to save floor plan:', error)
      showDialog('destructive', 'Failed to save. Please try again.')
    },
  })

  // Handle canvas ready
  const handleCanvasReady = useCallback((canvas: fabric.Canvas) => {
    canvasRef.current = canvas

    // Update table count on any change
    canvas.on('object:added', updateTableCount)
    canvas.on('object:removed', updateTableCount)
  }, [])

  // Load floor plan data into canvas when available
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || hasLoaded) return

    if (isEditing && floorPlanData?.canvasJson) {
      // Load from backend
      canvas.loadFromJSON(floorPlanData.canvasJson as object).then(() => {
        // Restore data property for objects that were saved before the fix
        // This handles floor plans saved without the 'data' property in toJSON
        canvas.getObjects().forEach((obj) => {
          // If object already has data, skip
          if ((obj as any).data?.type) return

          // Check if this looks like a table group (has text that matches T## pattern)
          if (obj instanceof fabric.Group) {
            const objects = obj.getObjects()
            const textObj = objects.find((o) => o instanceof fabric.IText || o instanceof fabric.Text)
            if (textObj) {
              const text = (textObj as fabric.IText).text || ''
              const match = text.match(/^T\d{2}$/)
              if (match) {
                // This is a table - restore its data property
                const shapeObj = objects.find(
                  (o) => o instanceof fabric.Rect || o instanceof fabric.Circle || o instanceof fabric.Polygon
                )
                let shapeType: 'square' | 'rectangle' | 'circle' | 'hexagon' = 'square'
                if (shapeObj instanceof fabric.Circle) {
                  shapeType = 'circle'
                } else if (shapeObj instanceof fabric.Polygon) {
                  shapeType = 'hexagon'
                } else if (shapeObj instanceof fabric.Rect) {
                  const width = shapeObj.width || 70
                  const height = shapeObj.height || 70
                  shapeType = width > height * 1.2 ? 'rectangle' : 'square'
                }

                ;(obj as any).data = {
                  id: crypto.randomUUID(),
                  type: 'table',
                  tableNumber: text,
                  shapeType,
                  capacity: shapeType === 'rectangle' ? 6 : 4,
                }
              }
            }
          }

          // Check if this looks like a wall
          if (obj instanceof fabric.Rect && !(obj instanceof fabric.Group)) {
            const width = obj.width || 0
            const height = obj.height || 0
            const fill = obj.fill
            // Walls are typically gray and have one dimension much larger than the other
            if (fill === '#9ca3af' && (width > height * 5 || height > width * 5)) {
              ;(obj as any).data = {
                type: 'wall',
                orientation: width > height ? 'horizontal' : 'vertical',
              }
            }
          }
        })

        canvas.renderAll()
        updateTableCount()
        setHasLoaded(true)
      })
    } else if (!isEditing || !isLoading) {
      // New floor plan or no existing data
      setHasLoaded(true)
    }
  }, [floorPlanData, isLoading, hasLoaded, isEditing])

  const updateTableCount = useCallback(() => {
    if (canvasRef.current) {
      const count = getTableNumbersFromCanvas(canvasRef.current).length
      setTableCount(count)
    }
  }, [])

  // Add table
  const handleAddTable = useCallback((shapeType: TableShapeType) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const existingNumbers = getTableNumbersFromCanvas(canvas)
    const tableNumber = generateNextTableNumber(existingNumbers)

    const group = createTableGroup({
      id: crypto.randomUUID(),
      tableNumber,
      shapeType,
      capacity: shapeType === 'rectangle' ? 6 : 4,
      left: 450,
      top: 300,
    })

    canvas.add(group)
    canvas.setActiveObject(group)
    canvas.renderAll()
  }, [])

  // Add wall
  const handleAddWall = useCallback((orientation: 'horizontal' | 'vertical') => {
    const canvas = canvasRef.current
    if (!canvas) return

    const wall = createWall(orientation, 450, 300)
    canvas.add(wall)
    canvas.setActiveObject(wall)
    canvas.renderAll()
  }, [])

  // Add door (placeholder)
  const handleAddDoor = useCallback(() => {
    // TODO: Implement door shape
    console.log('Door not implemented yet')
  }, [])

  // Save floor plan
  const handleSave = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!areaName.trim()) {
      showDialog('warning', 'Enter a name for this floor plan')
      return
    }

    const tables = getTablesFromCanvas(canvas)

    // Validate: must have at least one table
    if (tables.length === 0) {
      showDialog('warning', 'Add at least one table')
      return
    }

    // Prepare table data for API
    const floorPlanTables: FloorPlanTable[] = tables.map((table) => ({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      positionX: table.left,
      positionY: table.top,
      width: table.width,
      height: table.height,
      shapeType: table.shapeType,
    }))

    // Save canvas JSON and sync tables (include 'data' property for custom metadata)
    // Fabric.js v6 toJSON accepts propertiesToInclude but types don't reflect it
    const canvasJson = (canvas as any).toJSON(['data'])

    syncMutation.mutate({
      areaName: areaName.trim(),
      tables: floorPlanTables,
      canvasJson,
    })
  }, [areaName, syncMutation, showDialog])

  // Cancel and go back
  const handleCancel = useCallback(() => {
    navigate('/settings/floor-plans')
  }, [navigate])

  // Delete selected object
  const handleDeleteSelected = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const activeObj = canvas.getActiveObject()
    if (activeObj) {
      // Don't delete grid lines
      const data = (activeObj as any).data
      if (data?.type) {
        canvas.remove(activeObj)
        canvas.renderAll()
      }
    }
  }, [])

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>

          <div className="h-6 w-px bg-border" />

          {/* Area name */}
          {isEditingName ? (
            <input
              type="text"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              autoFocus
              placeholder="Enter floor plan name..."
              className="text-xl font-bold bg-transparent border-b-2 border-primary outline-none px-1 min-w-[200px]"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-2 hover:bg-accent rounded px-2 py-1"
            >
              <h1 className="text-xl font-bold">{areaName || 'Untitled'}</h1>
              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}

          {/* Table count badge */}
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm font-medium">
            {tableCount} table{tableCount !== 1 ? 's' : ''}
          </span>

          {/* Loading indicator */}
          {isLoading && (
            <span className="text-sm text-muted-foreground">Loading...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDeleteSelected}>
            Delete Selected
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={syncMutation.isPending}>
            {syncMutation.isPending ? 'Saving...' : 'Save Floor Plan'}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left palette */}
        <ShapePalette
          onAddTable={handleAddTable}
          onAddWall={handleAddWall}
          onAddDoor={handleAddDoor}
        />

        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center bg-slate-100 p-4 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg">
            <FloorCanvas
              width={900}
              height={600}
              onCanvasReady={handleCanvasReady}
            />
          </div>
        </div>
      </div>

      {/* Footer instructions */}
      <div className="px-4 py-2 border-t bg-muted/30 text-center">
        <p className="text-sm text-muted-foreground">
          Click shapes to add • Drag to move • Double-click table to edit • Ctrl+C/Ctrl+V to copy/paste • Delete to remove
        </p>
      </div>

      {/* Alert Dialog */}
      <AlertDialog
        open={dialogType !== null}
        onClose={handleDialogClose}
        title={
          dialogType === 'success' ? 'Saved' :
          dialogType === 'destructive' ? 'Error' :
          dialogType === 'warning' ? 'Warning' : ''
        }
        description={dialogMessage}
        variant={dialogType || 'default'}
      />
    </div>
  )
}
