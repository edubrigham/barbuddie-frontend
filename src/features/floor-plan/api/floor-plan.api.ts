import { apiClient } from '@/lib/api/client'
import { endpoints } from '@/lib/api/endpoints'

// Types
export interface FloorPlanTable {
  tableNumber: string
  capacity: number
  positionX: number
  positionY: number
  width?: number
  height?: number
  shapeType?: string
}

export interface SyncFloorPlanRequest {
  areaName: string
  tables: FloorPlanTable[]
  canvasJson?: unknown
}

export interface SyncFloorPlanResponse {
  created: number
  updated: number
  deactivated: number
}

export interface FloorPlan {
  id: string
  organizationId: string
  areaName: string
  canvasJson: unknown
  createdAt: string
  updatedAt: string
}

export interface CostCenter {
  id: string
  organizationId: string
  costCenterId: string
  type: string
  name: string
  capacity?: number
  area?: string
  sortOrder: number
  isActive: boolean
  positionX?: number
  positionY?: number
  width?: number
  height?: number
  shapeType?: string
  createdAt: string
  updatedAt: string
}

// API Functions

/**
 * Get all floor plans for the organization
 */
export async function getFloorPlans(): Promise<FloorPlan[]> {
  const response = await apiClient.get<FloorPlan[]>(endpoints.costCenters.floorPlans)
  return response.data
}

/**
 * Get a specific floor plan by area name
 */
export async function getFloorPlan(areaName: string): Promise<FloorPlan | null> {
  try {
    const response = await apiClient.get<FloorPlan>(endpoints.costCenters.floorPlanByArea(areaName))
    return response.data
  } catch (error: unknown) {
    // Return null if not found
    if ((error as { response?: { status?: number } })?.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Sync floor plan tables with database
 */
export async function syncFloorPlan(data: SyncFloorPlanRequest): Promise<SyncFloorPlanResponse> {
  const response = await apiClient.post<SyncFloorPlanResponse>(
    endpoints.costCenters.syncFloorPlan,
    data
  )
  return response.data
}

/**
 * Delete a floor plan by area name
 */
export async function deleteFloorPlan(areaName: string): Promise<void> {
  await apiClient.delete(endpoints.costCenters.floorPlanByArea(areaName))
}

/**
 * Get all tables (cost centers of type TABLE)
 */
export async function getTables(): Promise<CostCenter[]> {
  const response = await apiClient.get<CostCenter[]>(endpoints.costCenters.tables)
  return response.data
}

/**
 * Check if a table number exists
 */
export async function checkTableNumberExists(
  tableNumber: string,
  excludeId?: string
): Promise<{ exists: boolean }> {
  const params = new URLSearchParams({ tableNumber })
  if (excludeId) {
    params.append('excludeId', excludeId)
  }
  const response = await apiClient.get<{ exists: boolean }>(
    `${endpoints.costCenters.checkTableNumber}?${params.toString()}`
  )
  return response.data
}

/**
 * Generate next available table number
 */
export async function generateTableNumber(
  unsavedTables: string[] = []
): Promise<{ newTableNumber: string }> {
  const params = unsavedTables.length > 0
    ? `?unsavedTables=${unsavedTables.join(',')}`
    : ''
  const response = await apiClient.get<{ newTableNumber: string }>(
    `${endpoints.costCenters.generateTableNumber}${params}`
  )
  return response.data
}
