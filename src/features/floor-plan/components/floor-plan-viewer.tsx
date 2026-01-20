import { useRef, useEffect, useState } from 'react'
import * as fabric from 'fabric'
import { cn } from '@/lib/utils'

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
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)

  // Initialize canvas once
  useEffect(() => {
    if (!canvasRef.current) return

    // Set canvas element dimensions first
    canvasRef.current.width = width
    canvasRef.current.height = height

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#f8fafc',
      selection: false, // Read-only: no selection allowed
    })

    fabricCanvas.hoverCursor = 'pointer'
    fabricCanvas.renderAll()

    console.log('Canvas initialized:', width, 'x', height)

    setCanvas(fabricCanvas)

    return () => {
      fabricCanvas.dispose()
    }
  }, [width, height])

  // Load canvas data when canvasJson changes
  useEffect(() => {
    if (!canvas || !canvasJson) return

    const json = canvasJson as { objects?: unknown[], version?: string, background?: string }

    if (json.objects && Array.isArray(json.objects) && json.objects.length > 0) {
      console.log('Loading canvasJson with', json.objects.length, 'objects')

      // Fabric.js v6 uses Promises - load the full JSON
      canvas.loadFromJSON(json).then(() => {
        // Process objects AFTER loading (following old pattern)
        const canvasObjects = canvas.getObjects()

        console.log('Loaded objects:', canvasObjects.length)

        for (let k = 0; k < canvasObjects.length; k++) {
          const obj = canvasObjects[k]

          // Check if it's a table (group type) - old pattern
          if (obj.type === 'group') {
            const group = obj as fabric.Group
            const groupObjects = group.getObjects()

            // Extract table number from text object inside group
            const textObj = groupObjects.find(
              (o) => o.type === 'i-text' || o.type === 'text'
            ) as fabric.IText | fabric.FabricText | undefined

            const tableNumber = textObj?.text || ''
            console.log(`Table ${k}: type=group, text="${tableNumber}"`)

            // Check if occupied using tableStatuses map
            const isOccupied = tableStatuses?.get(tableNumber)?.hasOpenOrders || false

            // Apply color coding (following old pattern)
            const shapeObj = groupObjects.find(
              (o) => o.type === 'circle' || o.type === 'rect' || o.type === 'polygon'
            )

            if (shapeObj) {
              if (isOccupied) {
                shapeObj.set({ stroke: '#EB5757', strokeWidth: 3, fill: '#FBEBE9' })
              } else {
                shapeObj.set({ stroke: '#00A65A', fill: '#DFF5E5', strokeWidth: 3 })
              }
            }

            // Update text color for contrast
            if (textObj) {
              textObj.set({ fill: isOccupied ? '#EB5757' : '#00A65A' })
            }
          }

          // Disable interactions (read-only viewer)
          obj.set({
            hasControls: false,
            selectable: false,
            hasBorders: false,
            evented: obj.type === 'group', // Only groups (tables) are clickable
          })
        }

        canvas.renderAll()
      }).catch((err) => {
        console.error('Failed to load canvas:', err)
      })
    }
  }, [canvas, canvasJson, tableStatuses])

  // Handle click events - following old pattern
  useEffect(() => {
    if (!canvas) return

    const handleMouseDown = (event: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
      if (!event.target) return

      const activeObject = event.target

      // Check if it's a table (group type) - exactly like old system
      if (activeObject.type === 'group') {
        const group = activeObject as fabric.Group
        const groupObjects = group.getObjects()

        // Extract table number from text object inside group
        const textObj = groupObjects.find(
          (o) => o.type === 'i-text' || o.type === 'text'
        ) as fabric.IText | fabric.FabricText | undefined

        if (textObj?.text) {
          const tableNumber = textObj.text
          console.log('Table clicked:', tableNumber)

          if (onTableClick) {
            onTableClick(tableNumber)
          }
        }
      }
    }

    canvas.on('mouse:down', handleMouseDown)

    return () => {
      canvas.off('mouse:down', handleMouseDown)
    }
  }, [canvas, onTableClick])

  // Create a serialized key from tableStatuses for proper React dependency detection
  const tableStatusesKey = tableStatuses
    ? Array.from(tableStatuses.entries())
        .map(([k, v]) => `${k}:${v.hasOpenOrders}`)
        .join(',')
    : ''

  // Update colors when tableStatuses change (without reloading canvas)
  useEffect(() => {
    if (!canvas || !tableStatuses) return

    console.log('Updating table colors, statuses:', tableStatusesKey)

    const canvasObjects = canvas.getObjects()

    for (const obj of canvasObjects) {
      if (obj.type === 'group') {
        const group = obj as fabric.Group
        const groupObjects = group.getObjects()

        // Extract table number
        const textObj = groupObjects.find(
          (o) => o.type === 'i-text' || o.type === 'text'
        ) as fabric.IText | fabric.FabricText | undefined

        const tableNumber = textObj?.text || ''
        const isOccupied = tableStatuses.get(tableNumber)?.hasOpenOrders || false

        console.log(`Table ${tableNumber}: isOccupied=${isOccupied}`)

        // Update colors
        const shapeObj = groupObjects.find(
          (o) => o.type === 'circle' || o.type === 'rect' || o.type === 'polygon'
        )

        if (shapeObj) {
          if (isOccupied) {
            shapeObj.set({ stroke: '#EB5757', strokeWidth: 3, fill: '#FBEBE9' })
          } else {
            shapeObj.set({ stroke: '#00A65A', fill: '#DFF5E5', strokeWidth: 3 })
          }
        }

        if (textObj) {
          textObj.set({ fill: isOccupied ? '#EB5757' : '#00A65A' })
        }
      }
    }

    canvas.renderAll()
  }, [canvas, tableStatusesKey, tableStatuses])

  return (
    <div className={cn('relative', className)}>
      <canvas ref={canvasRef} />
    </div>
  )
}
