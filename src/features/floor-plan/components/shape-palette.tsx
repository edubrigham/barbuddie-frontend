import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from 'react'
import type { TableShapeType } from '../utils/fabric-helpers'

interface ShapePaletteProps {
  onAddTable: (shapeType: TableShapeType) => void
  onAddWall: (orientation: 'horizontal' | 'vertical') => void
  onAddDoor: () => void
  className?: string
}

// SVG icons for shapes
const ShapeIcons = {
  circle: (
    <svg viewBox="0 0 40 40" className="w-10 h-10">
      <circle cx="20" cy="20" r="16" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
    </svg>
  ),
  square: (
    <svg viewBox="0 0 40 40" className="w-10 h-10">
      <rect x="4" y="4" width="32" height="32" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
    </svg>
  ),
  rectangle: (
    <svg viewBox="0 0 48 32" className="w-12 h-8">
      <rect x="4" y="4" width="40" height="24" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
    </svg>
  ),
  hexagon: (
    <svg viewBox="0 0 40 40" className="w-10 h-10">
      <polygon points="20,4 36,12 36,28 20,36 4,28 4,12" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
    </svg>
  ),
  wallV: (
    <svg viewBox="0 0 24 40" className="w-6 h-10">
      <rect x="10" y="4" width="4" height="32" rx="1" fill="#9ca3af" />
    </svg>
  ),
  wallH: (
    <svg viewBox="0 0 40 24" className="w-10 h-6">
      <rect x="4" y="10" width="32" height="4" rx="1" fill="#9ca3af" />
    </svg>
  ),
  door: (
    <svg viewBox="0 0 40 40" className="w-10 h-10">
      <line x1="4" y1="36" x2="4" y2="4" stroke="#6b7280" strokeWidth="3" />
      <path d="M 4 36 A 32 32 0 0 1 36 4" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="4 2" />
    </svg>
  ),
}

export function ShapePalette({
  onAddTable,
  onAddWall,
  onAddDoor,
  className,
}: ShapePaletteProps) {
  const [sections, setSections] = useState<Record<string, boolean>>({
    Structure: true,
    Tables: true,
    'Doors & Windows': true,
  })

  const toggleSection = (title: string) => {
    setSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const ShapeButton = ({
    icon,
    label,
    onClick,
  }: {
    icon: React.ReactNode
    label: string
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center p-3 rounded-lg',
        'bg-muted/50 hover:bg-accent border border-transparent',
        'hover:border-primary/20 transition-all duration-150',
        'touch-manipulation active:scale-95'
      )}
      title={label}
    >
      {icon}
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </button>
  )

  const SectionHeader = ({ title }: { title: string }) => (
    <button
      onClick={() => toggleSection(title)}
      className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
    >
      <span>{title}</span>
      <svg
        className={cn(
          'w-4 h-4 transition-transform',
          sections[title] ? 'rotate-180' : ''
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )

  return (
    <div className={cn('w-[200px] bg-card border-r flex flex-col h-full', className)}>
      <div className="p-3 border-b">
        <h2 className="font-semibold text-sm">Elements</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Structure Section */}
          <div className="mb-2">
            <SectionHeader title="Structure" />
            {sections['Structure'] && (
              <div className="grid grid-cols-2 gap-2 p-2">
                <ShapeButton
                  icon={ShapeIcons.wallV}
                  label="Wall (V)"
                  onClick={() => onAddWall('vertical')}
                />
                <ShapeButton
                  icon={ShapeIcons.wallH}
                  label="Wall (H)"
                  onClick={() => onAddWall('horizontal')}
                />
              </div>
            )}
          </div>

          {/* Tables Section */}
          <div className="mb-2">
            <SectionHeader title="Tables" />
            {sections['Tables'] && (
              <div className="grid grid-cols-2 gap-2 p-2">
                <ShapeButton
                  icon={ShapeIcons.circle}
                  label="Round"
                  onClick={() => onAddTable('circle')}
                />
                <ShapeButton
                  icon={ShapeIcons.square}
                  label="Square"
                  onClick={() => onAddTable('square')}
                />
                <ShapeButton
                  icon={ShapeIcons.rectangle}
                  label="Rectangle"
                  onClick={() => onAddTable('rectangle')}
                />
                <ShapeButton
                  icon={ShapeIcons.hexagon}
                  label="Hexagon"
                  onClick={() => onAddTable('hexagon')}
                />
              </div>
            )}
          </div>

          {/* Doors & Windows Section */}
          <div className="mb-2">
            <SectionHeader title="Doors & Windows" />
            {sections['Doors & Windows'] && (
              <div className="grid grid-cols-2 gap-2 p-2">
                <ShapeButton
                  icon={ShapeIcons.door}
                  label="Door"
                  onClick={onAddDoor}
                />
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Instructions */}
      <div className="p-3 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground">
          Click to add elements. Double-click a table to edit its number.
        </p>
      </div>
    </div>
  )
}
