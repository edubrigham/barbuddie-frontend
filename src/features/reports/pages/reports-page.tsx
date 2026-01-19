import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { apiClient, endpoints } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import type { GksSignResult, ReportInput } from '@/types/api.types'
import { FileText, AlertCircle, CheckCircle } from 'lucide-react'

export function ReportsPage() {
  const terminal = useAuthStore((state) => state.terminal)
  const [reportResult, setReportResult] = useState<GksSignResult | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const xReportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<GksSignResult>(
        endpoints.reports.turnoverX,
        { terminalId: terminal?.id } as ReportInput
      )
      return response.data
    },
    onSuccess: (data) => {
      setReportResult(data)
      setDialogOpen(true)
    },
  })

  const zReportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<GksSignResult>(
        endpoints.reports.turnoverZ,
        { terminalId: terminal?.id } as ReportInput
      )
      return response.data
    },
    onSuccess: (data) => {
      setReportResult(data)
      setDialogOpen(true)
    },
  })

  return (
    <div className="flex-1 p-6 overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* X Report Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              X Report (Interim)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Generate an interim report without closing the day. Use this to check
              current totals during business hours.
            </p>
            <Button
              size="touch"
              className="w-full"
              onClick={() => xReportMutation.mutate()}
              disabled={xReportMutation.isPending || !terminal}
            >
              {xReportMutation.isPending ? 'Generating...' : 'Generate X Report'}
            </Button>
          </CardContent>
        </Card>

        {/* Z Report Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-danger">
              <AlertCircle className="h-5 w-5" />
              Z Report (End of Day)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Close the current booking period and generate final report.
              <strong className="text-danger"> This action cannot be undone.</strong>
            </p>
            <Button
              size="touch"
              variant="destructive"
              className="w-full"
              onClick={() => zReportMutation.mutate()}
              disabled={zReportMutation.isPending || !terminal}
            >
              {zReportMutation.isPending ? 'Generating...' : 'Generate Z Report'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {!terminal && (
        <p className="mt-6 text-center text-muted-foreground">
          Please select a terminal in Settings to generate reports.
        </p>
      )}

      {/* Report Result Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Report Generated
            </DialogTitle>
          </DialogHeader>

          {reportResult && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket #</span>
                <span className="font-mono">{reportResult.posFiscalTicketNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date/Time</span>
                <span className="font-mono">{reportResult.posDateTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">FDM ID</span>
                <span className="font-mono">{reportResult.fdmRef.fdmId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Signature</span>
                <span className="font-mono text-xs truncate max-w-[200px]">
                  {reportResult.shortSignature}
                </span>
              </div>

              {reportResult.vatCalc && reportResult.vatCalc.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="font-medium mb-2">VAT Summary</p>
                  {reportResult.vatCalc.map((vat) => (
                    <div key={vat.label} className="flex justify-between text-xs">
                      <span>VAT {vat.label} ({vat.rate}%)</span>
                      <span>€{vat.vatAmount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
