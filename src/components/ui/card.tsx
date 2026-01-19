import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border bg-card text-card-foreground shadow-sm',
      className
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-4', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-4 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

// Touch-optimized Product Card for POS
interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  price: number | string
  categoryColor?: string
  onSelect?: () => void
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ className, name, price, categoryColor = '#3C9FFA', onSelect, ...props }, ref) => {
    // Convert price to number (Prisma Decimal comes as string)
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => e.key === 'Enter' && onSelect?.()}
        className={cn(
          'h-[180px] rounded-xl bg-card shadow-md cursor-pointer',
          'flex flex-col overflow-hidden',
          'touch-manipulation select-none',
          'active:scale-[0.97] transition-transform duration-150',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        {...props}
      >
        {/* Category color bar */}
        <div
          className="h-3 w-full flex-shrink-0"
          style={{ backgroundColor: categoryColor }}
        />

        {/* Content */}
        <div className="flex-1 flex flex-col items-start justify-between p-3">
          <p className="text-base font-semibold leading-tight line-clamp-2">
            {name}
          </p>
          <p className="text-lg font-bold">
            € {numericPrice.toFixed(2)}
          </p>
        </div>
      </div>
    )
  }
)
ProductCard.displayName = 'ProductCard'

// Touch-optimized Category Card for POS
interface CategoryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  itemCount: number
  backgroundColor?: string
  textColor?: string
  onSelect?: () => void
}

const CategoryCard = React.forwardRef<HTMLDivElement, CategoryCardProps>(
  ({ className, name, itemCount, backgroundColor = '#3C9FFA', textColor = '#FFFFFF', onSelect, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => e.key === 'Enter' && onSelect?.()}
        className={cn(
          'h-[130px] rounded-xl shadow-md cursor-pointer',
          'w-full flex flex-col items-center justify-center',
          'touch-manipulation select-none',
          'active:scale-[0.97] transition-transform duration-150',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        style={{ backgroundColor }}
        {...props}
      >
        <p
          className="text-base font-bold leading-tight text-center px-2 line-clamp-2 uppercase"
          style={{ color: textColor }}
        >
          {name}
        </p>
        <p
          className="text-xs mt-1 opacity-80"
          style={{ color: textColor }}
        >
         
        </p>
      </div>
    )
  }
)
CategoryCard.displayName = 'CategoryCard'

// Back navigation card for returning to categories
interface BackCardProps extends React.HTMLAttributes<HTMLDivElement> {
  categoryName: string
  backgroundColor?: string
  onBack?: () => void
}

const BackCard = React.forwardRef<HTMLDivElement, BackCardProps>(
  ({ className, categoryName, backgroundColor = '#3C9FFA', onBack, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={onBack}
        onKeyDown={(e) => e.key === 'Enter' && onBack?.()}
        className={cn(
          'h-[130px] rounded-lg shadow-md cursor-pointer',
          'flex flex-col items-start justify-between p-3',
          'touch-manipulation select-none',
          'active:scale-[0.97] transition-transform duration-150',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        style={{ backgroundColor }}
        {...props}
      >
        <p className="text-base font-bold text-white leading-tight line-clamp-2 uppercase">
          {categoryName}
        </p>
        <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
      </div>
    )
  }
)
BackCard.displayName = 'BackCard'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, ProductCard, CategoryCard, BackCard }
