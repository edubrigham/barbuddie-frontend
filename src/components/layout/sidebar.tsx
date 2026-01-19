import { Link, useLocation } from 'react-router-dom'
import {
  ShoppingCart,
  Grid3X3,
  LayoutGrid,
  History,
  BarChart2,
  Settings,
  LogOut,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'

interface NavItem {
  icon: React.ElementType
  label: string
  route: string
}

const navItems: NavItem[] = [
  { icon: ShoppingCart, label: 'Orders', route: '/orders' },
  { icon: Grid3X3, label: 'POS', route: '/pos' },
  { icon: LayoutGrid, label: 'Tables', route: '/tables' },
  { icon: History, label: 'History', route: '/history' },
  { icon: BarChart2, label: 'Reports', route: '/reports' },
  { icon: Settings, label: 'Settings', route: '/settings' },
]

interface SidebarButtonProps {
  icon: React.ElementType
  label: string
  route: string
  isActive: boolean
}

function SidebarButton({ icon: Icon, label, route, isActive }: SidebarButtonProps) {
  return (
    <Link
      to={route}
      className={cn(
        'flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-150',
        'touch-manipulation select-none active:scale-95',
        isActive
          ? 'bg-white/20 text-white'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </Link>
  )
}

export function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  return (
    <aside className="fixed left-0 top-0 h-full w-[65px] bg-primary flex flex-col items-center py-4 z-50">
      {/* Logo */}
      <div className="h-12 w-12 mb-6 flex items-center justify-center">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <span className="text-white font-bold text-lg">B</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => (
          <SidebarButton
            key={item.route}
            icon={item.icon}
            label={item.label}
            route={item.route}
            isActive={location.pathname.startsWith(item.route)}
          />
        ))}
      </nav>

      {/* User section */}
      <div className="mt-auto flex flex-col gap-2">
        {user && (
          <div className="flex flex-col items-center justify-center w-14 h-14 text-white/70">
            <User className="h-5 w-5" />
            <span className="text-[9px] mt-1 truncate max-w-[50px]">
              {user.firstName}
            </span>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-150',
            'touch-manipulation select-none active:scale-95',
            'text-white/70 hover:bg-white/10 hover:text-white'
          )}
        >
          <LogOut className="h-6 w-6" />
          <span className="text-[10px] mt-1 font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
