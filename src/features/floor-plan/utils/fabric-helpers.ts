import * as fabric from 'fabric'

// Grid size in pixels
export const GRID_SIZE = 30

// Table number format: T01, T02, etc.
export function formatTableNumber(num: number): string {
  return `T${String(num).padStart(2, '0')}`
}

// Parse table number from format
export function parseTableNumber(tableNumber: string): number {
  const match = tableNumber.match(/T(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

// Generate next table number (continues from highest existing number)
export function generateNextTableNumber(existingNumbers: string[]): string {
  const usedNumbers = existingNumbers.map(parseTableNumber).filter(n => n > 0)
  const maxNumber = usedNumbers.length > 0 ? Math.max(...usedNumbers) : 0
  return formatTableNumber(maxNumber + 1)
}

// Check if table number already exists
export function isTableNumberUnique(
  tableNumber: string,
  existingNumbers: string[]
): boolean {
  return !existingNumbers.includes(tableNumber)
}

// Create grid lines for canvas
export function createGridLines(
  width: number,
  height: number,
  gridSize: number = GRID_SIZE
): fabric.Line[] {
  const lines: fabric.Line[] = []

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    const line = new fabric.Line([x, 0, x, height], {
      stroke: '#e5e7eb',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      excludeFromExport: false,
    })
    lines.push(line)
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    const line = new fabric.Line([0, y, width, y], {
      stroke: '#e5e7eb',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      excludeFromExport: false,
    })
    lines.push(line)
  }

  return lines
}

// Snap position to grid
export function snapToGrid(value: number, gridSize: number = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize
}

// Create a table shape (circle, square, rectangle, or hexagon)
export type TableShapeType = 'circle' | 'square' | 'rectangle' | 'hexagon'

interface CreateTableOptions {
  id: string
  tableNumber: string
  shapeType: TableShapeType
  capacity: number
  left?: number
  top?: number
}

export function createTableGroup(options: CreateTableOptions): fabric.Group {
  const { id, tableNumber, shapeType, capacity, left = 100, top = 100 } = options

  let shape: fabric.Object

  const fillColor = '#dcfce7'
  const strokeColor = '#22c55e'

  switch (shapeType) {
    case 'circle':
      shape = new fabric.Circle({
        radius: 35,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
      })
      break

    case 'rectangle':
      shape = new fabric.Rect({
        width: 100,
        height: 60,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: 2,
        rx: 5,
        ry: 5,
        originX: 'center',
        originY: 'center',
      })
      break

    case 'hexagon':
      const hexPoints = []
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2
        hexPoints.push({
          x: 35 * Math.cos(angle),
          y: 35 * Math.sin(angle),
        })
      }
      shape = new fabric.Polygon(hexPoints, {
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
      })
      break

    case 'square':
    default:
      shape = new fabric.Rect({
        width: 70,
        height: 70,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: 2,
        rx: 5,
        ry: 5,
        originX: 'center',
        originY: 'center',
      })
      break
  }

  // Table number text (centered)
  const text = new fabric.IText(tableNumber, {
    fontSize: 16,
    fontWeight: 'bold',
    fill: '#15803d',
    originX: 'center',
    originY: 'center',
    editable: false,
  })

  const group = new fabric.Group([shape, text], {
    left: snapToGrid(left),
    top: snapToGrid(top),
    hasControls: true,
    hasBorders: true,
    lockRotation: false,
    cornerColor: '#3b82f6',
    cornerStyle: 'circle',
    transparentCorners: false,
  })

  // Store custom data on the object (Fabric.js allows arbitrary properties)
  ;(group as any).data = {
    id,
    type: 'table',
    tableNumber,
    shapeType,
    capacity,
  }

  return group
}

// Create wall/barrier
export function createWall(
  orientation: 'horizontal' | 'vertical',
  left: number = 100,
  top: number = 100
): fabric.Rect {
  const isHorizontal = orientation === 'horizontal'

  const rect = new fabric.Rect({
    width: isHorizontal ? 150 : 8,
    height: isHorizontal ? 8 : 150,
    fill: '#9ca3af',
    left: snapToGrid(left),
    top: snapToGrid(top),
    hasControls: true,
  })

  ;(rect as any).data = {
    type: 'wall',
    orientation,
  }

  return rect
}

// Create door shape
export function createDoor(left: number = 100, top: number = 100): fabric.Group {
  const frame = new fabric.Line([0, 0, 0, 50], {
    stroke: '#6b7280',
    strokeWidth: 3,
  })

  const arc = new fabric.Circle({
    radius: 50,
    startAngle: 0,
    endAngle: 90,
    stroke: '#9ca3af',
    strokeWidth: 1.5,
    fill: 'transparent',
    left: 0,
    top: 0,
  })

  const group = new fabric.Group([frame, arc], {
    left: snapToGrid(left),
    top: snapToGrid(top),
  })

  ;(group as any).data = {
    type: 'door',
  }

  return group
}

// Extract all tables from canvas
export function getTablesFromCanvas(canvas: fabric.Canvas): Array<{
  id: string
  tableNumber: string
  shapeType: TableShapeType
  capacity: number
  left: number
  top: number
  width: number
  height: number
}> {
  const tables: Array<{
    id: string
    tableNumber: string
    shapeType: TableShapeType
    capacity: number
    left: number
    top: number
    width: number
    height: number
  }> = []

  canvas.getObjects().forEach((obj) => {
    const data = (obj as any).data
    if (data?.type === 'table') {
      tables.push({
        id: data.id,
        tableNumber: data.tableNumber,
        shapeType: data.shapeType,
        capacity: data.capacity,
        left: obj.left || 0,
        top: obj.top || 0,
        width: obj.width || 70,
        height: obj.height || 70,
      })
    }
  })

  return tables
}

// Get all table numbers from canvas
export function getTableNumbersFromCanvas(canvas: fabric.Canvas): string[] {
  return getTablesFromCanvas(canvas).map((t) => t.tableNumber)
}

// Update table number in group
export function updateTableNumber(
  group: fabric.Group,
  newTableNumber: string
): void {
  const objects = group.getObjects()
  const textObj = objects.find((obj) => obj instanceof fabric.IText) as fabric.IText | undefined
  if (textObj) {
    textObj.set('text', newTableNumber)
  }
  const data = (group as any).data
  if (data) {
    data.tableNumber = newTableNumber
  }
  group.setCoords()
}

// Update table capacity (stored in data, not displayed)
export function updateTableCapacity(
  group: fabric.Group,
  newCapacity: number
): void {
  const data = (group as any).data
  if (data) {
    data.capacity = newCapacity
  }
}
