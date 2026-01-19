import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children?: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main
        className={cn(
          'flex-1 ml-[65px] flex flex-col overflow-hidden',
          'transition-all duration-300'
        )}
      >
        {children || <Outlet />}
      </main>
    </div>
  )
}

// Layout variant with order panel for POS screens
interface POSLayoutProps {
  children: React.ReactNode
  orderPanel: React.ReactNode
}

export function POSLayout({ children, orderPanel }: POSLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content (Products/Tables) */}
      <main className="flex-1 ml-[65px] mr-[360px] flex flex-col overflow-hidden">
        {children}
      </main>

      {/* Fixed Order Panel */}
      <aside className="fixed right-0 top-0 w-[360px] h-full">
        {orderPanel}
      </aside>
    </div>
  )
}
