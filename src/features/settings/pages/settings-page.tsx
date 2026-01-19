import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { apiClient, endpoints } from '@/lib/api'
import { useUIStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { Sun, Moon, User, Building2, Cpu, LayoutGrid, ChevronRight, Monitor } from 'lucide-react'
import type { Terminal, FdmStatus } from '@/types/api.types'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useUIStore()
  const { user, terminal, setTerminal } = useAuthStore()

  // Fetch terminals
  const { data: terminals } = useQuery({
    queryKey: ['terminals'],
    queryFn: async () => {
      const response = await apiClient.get<Terminal[]>(endpoints.terminals.list)
      return response.data
    },
  })

  // Fetch FDM status
  const { data: fdmStatus } = useQuery({
    queryKey: ['fdm', 'status'],
    queryFn: async () => {
      const response = await apiClient.get<FdmStatus>(endpoints.fdm.status)
      return response.data
    },
    refetchInterval: 60000, // Check every minute
  })

  return (
    <div className="flex-1 p-6 overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Floor Plans */}
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/settings/floor-plans')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Floor Plans</h3>
                  <p className="text-sm text-muted-foreground">
                    Create and manage floor plan layouts
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="touch"
                onClick={() => setTheme('light')}
                className="flex-1"
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="touch"
                onClick={() => setTheme('dark')}
                className="flex-1"
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Current User
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <Badge>{user.role}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee ID (INSZ)</span>
                  <span className="font-mono">{user.employeeId}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Not logged in</p>
            )}
          </CardContent>
        </Card>

        {/* Terminal Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Terminal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Select the terminal for this device. Required for FDM operations.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {terminals?.map((t) => (
                <Button
                  key={t.id}
                  variant={terminal?.id === t.id ? 'default' : 'outline'}
                  size="touch"
                  onClick={() => setTerminal(t)}
                  className={cn(
                    'flex flex-col h-auto py-3',
                    terminal?.id === t.id && 'ring-2 ring-primary'
                  )}
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs opacity-70">{t.terminalId}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FDM Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              FDM Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fdmStatus ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={fdmStatus.initialized ? 'success' : 'destructive'}>
                    {fdmStatus.initialized ? 'Connected' : 'Not Initialized'}
                  </Badge>
                </div>
                {fdmStatus.initialized && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">FDM ID</span>
                      <span className="font-mono">{fdmStatus.device.fdmId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version</span>
                      <span className="font-mono">{fdmStatus.device.fdmSwVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Buffer Used</span>
                      <span>{fdmStatus.device.bufferCapacityUsed}%</span>
                    </div>
                  </>
                )}

                {fdmStatus.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-danger/10 rounded-lg">
                    <p className="text-sm font-medium text-danger mb-1">Errors</p>
                    {fdmStatus.errors.map((err, i) => (
                      <p key={i} className="text-xs text-danger">
                        {err.code}: {err.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Loading FDM status...</p>
            )}
          </CardContent>
        </Card>

        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Organization settings are managed in the admin portal.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
