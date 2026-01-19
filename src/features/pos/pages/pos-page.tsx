import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, endpoints } from '@/lib/api'
import { ProductCard, CategoryCard, BackCard } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/stores/cart.store'
import type { Department, Product } from '@/types/api.types'

// Category colors - can be customized per department in the future
const CATEGORY_COLORS = [
  { bg: '#3C9FFA', text: '#FFFFFF' }, // Blue
  { bg: '#00A65A', text: '#FFFFFF' }, // Green
  { bg: '#F39C12', text: '#FFFFFF' }, // Orange
  { bg: '#E74C3C', text: '#FFFFFF' }, // Red
  { bg: '#9B59B6', text: '#FFFFFF' }, // Purple
  { bg: '#1ABC9C', text: '#FFFFFF' }, // Teal
  { bg: '#E91E63', text: '#FFFFFF' }, // Pink
  { bg: '#795548', text: '#FFFFFF' }, // Brown
]

export function POSPage() {
  const addItem = useCartStore((state) => state.addItem)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)

  // Fetch products grouped by department
  const { data: departments, isLoading } = useQuery({
    queryKey: ['products', 'grouped'],
    queryFn: async () => {
      const response = await apiClient.get<Department[]>(endpoints.products.grouped)
      return response.data
    },
  })

  const handleCategoryClick = (dept: Department) => {
    setSelectedDepartment(dept)
  }

  const handleBackClick = () => {
    setSelectedDepartment(null)
  }

  const handleProductClick = (product: Product) => {
    // Convert price to number (Prisma Decimal comes as string)
    const price = typeof product.unitPrice === 'string'
      ? parseFloat(product.unitPrice)
      : product.unitPrice

    addItem({
      productId: product.productId,
      name: product.name,
      price,
      vatLabel: product.vatLabel,
    })
  }

  const getCategoryColor = (index: number) => {
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  // Show products for selected category
  if (selectedDepartment) {
    const categoryIndex = departments?.findIndex(d => d.id === selectedDepartment.id) ?? 0
    const categoryColor = getCategoryColor(categoryIndex)

    // Get other categories (excluding current one)
    const otherCategories = departments?.filter(d => d.id !== selectedDepartment.id) ?? []

    return (
      <div className="flex-1 flex h-full overflow-hidden">
        {/* Left column: Categories */}
        <div className="w-[240px] flex-shrink-0 p-3 overflow-auto">
          {/* Current category (back card) */}
          <BackCard
            categoryName={selectedDepartment.name}
            backgroundColor={categoryColor.bg}
            onBack={handleBackClick}
            className="w-full mb-4"
          />

          {/* Other categories for quick navigation */}
          <div className="space-y-3">
            {otherCategories.map((dept) => {
              const deptIndex = departments?.findIndex(d => d.id === dept.id) ?? 0
              return (
                <CategoryCard
                  key={dept.id}
                  name={dept.name}
                  itemCount={dept.products?.length ?? 0}
                  backgroundColor={getCategoryColor(deptIndex).bg}
                  textColor={getCategoryColor(deptIndex).text}
                  onSelect={() => handleCategoryClick(dept)}
                  className="w-full"
                />
              )
            })}
          </div>
        </div>

        {/* Vertical separator */}
        <Separator orientation="vertical" className="h-auto" />

        {/* Right area: Products (2/3 width) */}
        <ScrollArea className="flex-1">
          <div className="p-4 grid grid-cols-3 gap-4">
            {selectedDepartment.products?.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                price={product.unitPrice}
                categoryColor={categoryColor.bg}
                onSelect={() => handleProductClick(product)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Show category grid (main view)
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-4 grid grid-cols-4 gap-4">
          {departments?.map((dept, index) => (
            <CategoryCard
              key={dept.id}
              name={dept.name}
              itemCount={dept.products?.length ?? 0}
              backgroundColor={getCategoryColor(index).bg}
              textColor={getCategoryColor(index).text}
              onSelect={() => handleCategoryClick(dept)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
