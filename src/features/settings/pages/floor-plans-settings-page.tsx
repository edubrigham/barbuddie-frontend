import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ArrowLeft, Plus, Pencil, Trash2, LayoutGrid } from 'lucide-react'
import { getFloorPlans, deleteFloorPlan, getTables, type CostCenter } from '@/features/floor-plan/api/floor-plan.api'

export function FloorPlansSettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Fetch all floor plans
  const { data: floorPlans, isLoading: loadingPlans } = useQuery({
    queryKey: ['floorPlans'],
    queryFn: getFloorPlans,
  })

  // Fetch all tables to show count per area
  const { data: tables } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteFloorPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorPlans'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })

  // Group tables by area
  const tablesByArea = tables?.reduce((acc, table) => {
    const area = table.area || 'Unassigned'
    if (!acc[area]) acc[area] = []
    acc[area].push(table)
    return acc
  }, {} as Record<string, CostCenter[]>) || {}

  const handleCreateNew = () => {
    navigate('/settings/floor-plans/edit')
  }

  const handleEdit = (areaName: string) => {
    navigate(`/settings/floor-plans/edit/${encodeURIComponent(areaName)}`)
  }

  const handleDeleteClick = (areaName: string) => {
    setDeleteTarget(areaName)
  }

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget)
      setDeleteTarget(null)
    }
  }

  const handleBack = () => {
    navigate('/settings')
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Floor Plans</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage floor plans for your establishment
          </p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Floor Plan
        </Button>
      </div>

      <div className="space-y-4">
        {loadingPlans ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : floorPlans && floorPlans.length > 0 ? (
          floorPlans.map((plan) => {
            const areaTableCount = tablesByArea[plan.areaName]?.length || 0
            return (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <LayoutGrid className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{plan.areaName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {areaTableCount} table{areaTableCount !== 1 ? 's' : ''}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Last updated: {new Date(plan.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(plan.areaName)}
                        className="gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(plan.areaName)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Floor Plans Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first floor plan to arrange tables visually.
              </p>
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Floor Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Help section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Create separate floor plans for different areas (e.g., "Terrace", "2nd Floor")</p>
          <p>• Tables defined in floor plans will be synced to the database</p>
          <p>• Use Ctrl+C/Ctrl+V to quickly duplicate tables in the editor</p>
          <p>• Double-click a table to edit its number</p>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete "${deleteTarget}"?`}
        description="Tables won't be deleted, only the layout"
        confirmText="Delete"
        cancelText="Keep"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
