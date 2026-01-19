import { useRef, useEffect, useCallback } from 'react'
import * as fabric from 'fabric'
import { cn } from '@/lib/utils'
import { GRID_SIZE, createGridLines } from '../utils/fabric-helpers'

interface TableStatus {
  costCenterId: string
  hasOpenOrders: boolean
  totalAmount: number
  orderCount: number
}

interface FloorPlanViewerProps {
  canvasJson: unknown
  tableStatuses?: Map<string, TableStatus>
  onTableClick?: (tableNumber: string) => void
  width?: number
  height?: number
  className?: string
}

export function FloorPlanViewer({
  canvasJson,
  tableStatuses,
  onTableClick,
  width = 900,
  height = 600,
  className,
}: FloorPlanViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)

  // Update table colors based on status
  const updateTableColors = useCallback((canvas: fabric.Canvas) => {
    if (!tableStatuses) return

    canvas.getObjects().forEach((obj) => {
      const data = (obj as any).data
      if (data?.type === 'table') {
        const status = tableStatuses.get(data.tableNumber)
        const isOccupied = status?.hasOpenOrders || false

        // Find the shape inside the group
        if (obj instanceof fabric.Group) {
          const objects = obj.getObjects()
          const shape = objects.find(
            (o) => o instanceof fabric.Rect || o instanceof fabric.Circle || o instanceof fabric.Polygon
          )
          if (shape) {
            shape.set({
              fill: isOccupied ? '#fee2e2' : '#dcfce7', // red-100 or green-100
              stroke: isOccupied ? '#ef4444' : '#22c55e', // red-500 or green-500
            })
          }
          // Update text color
          const text = objects.find((o) => o instanceof fabric.IText || o instanceof fabric.Text)
          if (text) {
            text.set({
              fill: isOccupied ? '#b91c1c' : '#15803d', // red-700 or green-700
            })
          }
        }
      }
    })

    canvas.renderAll()
  }, [tableStatuses])

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return

    // Dispose existing canvas
    if (fabricRef.current) {
      fabricRef.current.dispose()
      fabricRef.current = null
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#f8fafc',
      selection: false, // Disable multi-selection
    })

    fabricRef.current = canvas

    // Load the floor plan JSON
    if (canvasJson) {
      canvas.loadFromJSON(canvasJson as object).then(() => {
        // Make all objects non-editable
        canvas.getObjects().forEach((obj) => {
          obj.set({
            selectable: false,
            evented: true, // Still allow click events
            hoverCursor: 'pointer',
          })

          // Make grid lines non-interactive
          const data = (obj as any).data
          if (!data?.type) {
            obj.set({ evented: false, hoverCursor: 'default' })
          }
        })

        // Update colors based on status
        updateTableColors(canvas)
        canvas.renderAll()
      })
    } else {
      // No floor plan - add grid lines only
      const gridLines = createGridLines(width, height, GRID_SIZE)
      gridLines.forEach((line) => {
        line.set({ evented: false })
        canvas.add(line)
      })
      canvas.renderAll()
    }

    // Handle table clicks
    canvas.on('mouse:down', (e) => {
      if (!e.target) return
      const data = (e.target as any).data
      if (data?.type === 'table' && onTableClick) {
        onTableClick(data.tableNumber)
      }
    })

    // Hover effect
    canvas.on('mouse:over', (e) => {
      if (!e.target) return
      const data = (e.target as any).data
      if (data?.type === 'table') {
        e.target.set({ opacity: 0.8 })
        canvas.renderAll()
      }
    })

    canvas.on('mouse:out', (e) => {
      if (!e.target) return
      const data = (e.target as any).data
      if (data?.type === 'table') {
        e.target.set({ opacity: 1 })
        canvas.renderAll()
      }
    })

    return () => {
      canvas.dispose()
      fabricRef.current = null
    }
  }, [canvasJson, width, height, onTableClick, updateTableColors])

  // Update colors when statuses change
  useEffect(() => {
    if (fabricRef.current) {
      updateTableColors(fabricRef.current)
    }
  }, [tableStatuses, updateTableColors])

  return (
    <div className={cn('relative', className)}>
      <canvas ref={canvasRef} />
    </div>
  )
}
