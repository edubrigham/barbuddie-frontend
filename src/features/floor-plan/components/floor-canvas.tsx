import { useRef, useEffect, useCallback, useState } from 'react'
import * as fabric from 'fabric'
import { cn } from '@/lib/utils'
import {
  GRID_SIZE,
  createGridLines,
  snapToGrid,
  createTableGroup,
  createWall,
  getTableNumbersFromCanvas,
  generateNextTableNumber,
  updateTableNumber,
  updateTableCapacity,
  type TableShapeType,
} from '../utils/fabric-helpers'
import { TableEditDialog } from './table-edit-dialog'

interface FloorCanvasProps {
  width?: number
  height?: number
  onCanvasReady?: (canvas: fabric.Canvas) => void
  className?: string
}

export function FloorCanvas({
  width = 900,
  height = 600,
  onCanvasReady,
  className,
}: FloorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const clipboardRef = useRef<fabric.Object | null>(null)

  // Table edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<{
    id: string
    tableNumber: string
    capacity: number
    object: fabric.Group
  } | null>(null)

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#f8fafc',
      selection: true,
      preserveObjectStacking: true,
    })

    fabricRef.current = canvas

    // Add grid lines
    const gridLines = createGridLines(width, height, GRID_SIZE)
    gridLines.forEach((line) => {
      canvas.add(line)
      canvas.sendObjectToBack(line)
    })

    // Snap to grid on move
    canvas.on('object:moving', (e) => {
      const obj = e.target
      if (!obj) return
      obj.set({
        left: snapToGrid(obj.left || 0),
        top: snapToGrid(obj.top || 0),
      })
    })

    // Keep within bounds
    canvas.on('object:modified', (e) => {
      const obj = e.target
      if (!obj) return

      const bound = obj.getBoundingRect()
      if (bound.left < 0) obj.set('left', (obj.left || 0) - bound.left)
      if (bound.top < 0) obj.set('top', (obj.top || 0) - bound.top)
      if (bound.left + bound.width > width)
        obj.set('left', width - bound.width + ((obj.left || 0) - bound.left))
      if (bound.top + bound.height > height)
        obj.set('top', height - bound.height + ((obj.top || 0) - bound.top))

      canvas.renderAll()
    })

    // Double-click to edit table
    canvas.on('mouse:dblclick', (e) => {
      if (!e.target) return
      const data = (e.target as any).data
      if (data?.type === 'table') {
        setSelectedTable({
          id: data.id,
          tableNumber: data.tableNumber,
          capacity: data.capacity,
          object: e.target as fabric.Group,
        })
        setEditDialogOpen(true)
      }
    })

    // Keyboard events for copy/paste and delete
    const handleKeyDown = (e: KeyboardEvent) => {
      // Copy: Ctrl+C or Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const activeObj = canvas.getActiveObject()
        if (activeObj) {
          const data = (activeObj as any).data
          if (data?.type) {
            // Clone the object for clipboard
            activeObj.clone().then((cloned: fabric.Object) => {
              clipboardRef.current = cloned
              ;(cloned as any).data = { ...data }
            })
          }
        }
      }

      // Paste: Ctrl+V or Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const clipboard = clipboardRef.current
        if (clipboard) {
          clipboard.clone().then((cloned: fabric.Object) => {
            const data = (clipboard as any).data

            // Offset position so paste doesn't overlap
            cloned.set({
              left: (cloned.left || 0) + GRID_SIZE,
              top: (cloned.top || 0) + GRID_SIZE,
            })

            // For tables, generate a new unique table number
            if (data?.type === 'table') {
              const existingNumbers = getTableNumbersFromCanvas(canvas)
              const newTableNumber = generateNextTableNumber(existingNumbers)

              // Update the cloned group with new table number
              ;(cloned as any).data = {
                ...data,
                id: crypto.randomUUID(),
                tableNumber: newTableNumber,
              }

              // Update the text in the group
              if (cloned instanceof fabric.Group) {
                const objects = cloned.getObjects()
                const textObj = objects.find((obj) => obj instanceof fabric.IText) as fabric.IText | undefined
                if (textObj) {
                  textObj.set('text', newTableNumber)
                }
              }
            } else if (data?.type === 'wall') {
              ;(cloned as any).data = { ...data }
            }

            canvas.add(cloned)
            canvas.setActiveObject(cloned)
            canvas.renderAll()

            // Update clipboard position for next paste
            clipboardRef.current?.set({
              left: (clipboardRef.current.left || 0) + GRID_SIZE,
              top: (clipboardRef.current.top || 0) + GRID_SIZE,
            })
          })
        }
      }

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObj = canvas.getActiveObject()
        if (activeObj) {
          const data = (activeObj as any).data
          // Only delete objects with data (tables, walls, etc.), not grid lines
          if (data?.type) {
            canvas.remove(activeObj)
            canvas.renderAll()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    onCanvasReady?.(canvas)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      canvas.dispose()
      fabricRef.current = null
    }
  }, [width, height, onCanvasReady])

  // Add table to canvas
  const addTable = useCallback((shapeType: TableShapeType) => {
    const canvas = fabricRef.current
    if (!canvas) return

    const existingNumbers = getTableNumbersFromCanvas(canvas)
    const tableNumber = generateNextTableNumber(existingNumbers)

    const group = createTableGroup({
      id: crypto.randomUUID(),
      tableNumber,
      shapeType,
      capacity: shapeType === 'rectangle' ? 6 : 4,
      left: width / 2,
      top: height / 2,
    })

    canvas.add(group)
    canvas.setActiveObject(group)
    canvas.renderAll()
  }, [width, height])

  // Add wall to canvas
  const addWall = useCallback((orientation: 'horizontal' | 'vertical') => {
    const canvas = fabricRef.current
    if (!canvas) return

    const wall = createWall(orientation, width / 2, height / 2)
    canvas.add(wall)
    canvas.setActiveObject(wall)
    canvas.renderAll()
  }, [width, height])

  // Handle table edit save
  const handleTableSave = useCallback((newTableNumber: string, newCapacity: number) => {
    if (!selectedTable) return

    updateTableNumber(selectedTable.object, newTableNumber)
    updateTableCapacity(selectedTable.object, newCapacity)

    fabricRef.current?.renderAll()
    setSelectedTable(null)
  }, [selectedTable])

  // Handle table delete
  const handleTableDelete = useCallback(() => {
    if (!selectedTable || !fabricRef.current) return

    fabricRef.current.remove(selectedTable.object)
    fabricRef.current.renderAll()
    setSelectedTable(null)
  }, [selectedTable])

  // Expose methods to parent
  useEffect(() => {
    const canvas = fabricRef.current
    if (canvas) {
      (canvas as any).addTable = addTable;
      (canvas as any).addWall = addWall
    }
  }, [addTable, addWall])

  return (
    <div className={cn('relative', className)}>
      <canvas ref={canvasRef} />

      {/* Table Edit Dialog */}
      <TableEditDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          setSelectedTable(null)
        }}
        tableNumber={selectedTable?.tableNumber || ''}
        capacity={selectedTable?.capacity || 4}
        existingNumbers={
          fabricRef.current
            ? getTableNumbersFromCanvas(fabricRef.current)
            : []
        }
        onSave={handleTableSave}
        onDelete={handleTableDelete}
      />
    </div>
  )
}

// Export hooks to control canvas from parent
export function useFloorCanvas() {
  const canvasRef = useRef<fabric.Canvas | null>(null)

  const setCanvas = useCallback((canvas: fabric.Canvas) => {
    canvasRef.current = canvas
  }, [])

  const addTable = useCallback((shapeType: TableShapeType) => {
    const canvas = canvasRef.current
    if (!canvas) return

    ;(canvas as any).addTable?.(shapeType)
  }, [])

  const addWall = useCallback((orientation: 'horizontal' | 'vertical') => {
    const canvas = canvasRef.current
    if (!canvas) return

    ;(canvas as any).addWall?.(orientation)
  }, [])

  const getCanvasJSON = useCallback(() => {
    // Fabric.js v6 toJSON accepts propertiesToInclude but types don't reflect it
    return (canvasRef.current as any)?.toJSON(['data'])
  }, [])

  const loadCanvasJSON = useCallback((json: any) => {
    const canvas = canvasRef.current
    if (!canvas || !json) return

    canvas.loadFromJSON(json)
    canvas.renderAll()
  }, [])

  const getTableCount = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return 0

    return getTableNumbersFromCanvas(canvas).length
  }, [])

  return {
    setCanvas,
    addTable,
    addWall,
    getCanvasJSON,
    loadCanvasJSON,
    getTableCount,
    canvas: canvasRef.current,
  }
}
