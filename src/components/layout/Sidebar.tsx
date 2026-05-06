import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, CreditCard, ArrowLeftRight, TrendingUp,
  PiggyBank, Users2, FileText, Bell, Settings, HelpCircle,
  Shield, ClipboardList, Calendar, ChevronLeft, ChevronRight,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBanking } from '@/context/BankingContext'
import { useState } from 'react'

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
  badge?: number | string
}

interface NavGroup {
  heading: string
  items: NavItem[]
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { pendingApprovalsCount } = useBanking()
  const location = useLocation()

  const navGroups: NavGroup[] = [
    {
      heading: 'Overview',
      items: [
        { label: 'Dashboard',     icon: LayoutDashboard, to: '/dashboard' },
        { label: 'Accounts',      icon: CreditCard,       to: '/accounts' },
      ],
    },
    {
      heading: 'Transactions',
      items: [
        { label: 'Payments',      icon: ArrowLeftRight,   to: '/payments/new' },
        { label: 'Beneficiaries', icon: Users2,            to: '/beneficiaries' },
        { label: 'Scheduled',     icon: Calendar,          to: '/payments/scheduled' },
        { label: 'Approvals',     icon: ClipboardList,     to: '/approvals', badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined },
      ],
    },
    {
      heading: 'Products',
      items: [
        { label: 'FX Conversion', icon: TrendingUp,        to: '/fx' },
        { label: 'Fixed Deposits',icon: PiggyBank,          to: '/fixed-deposits' },
      ],
    },
    {
      heading: 'Reports',
      items: [
        { label: 'Statements',    icon: FileText,           to: '/statements' },
        { label: 'Requests',      icon: HelpCircle,         to: '/requests' },
      ],
    },
    {
      heading: 'Corporate',
      items: [
        { label: 'User Mgmt',     icon: Shield,             to: '/corporate/users' },
        { label: 'Notifications', icon: Bell,               to: '/notifications' },
        { label: 'Settings',      icon: Settings,           to: '/settings' },
      ],
    },
  ]

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-primary-900 text-white transition-all duration-300 flex-shrink-0 relative',
        collapsed ? 'w-16' : 'w-60',
      )}
      style={{ boxShadow: '2px 0 8px 0 rgba(10,31,68,0.18)' }}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-primary-700 flex-shrink-0',
        collapsed ? 'h-16 justify-center px-0' : 'h-16 px-4 gap-3'
      )}>
        <div className="flex items-center justify-center w-8 h-8 bg-accent-gold rounded-md flex-shrink-0">
          <Building2 size={18} className="text-primary-900" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white leading-tight truncate">BOI GIFT City</p>
            <p className="text-2xs text-primary-300 font-medium truncate">IBU Internet Banking</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map(group => (
          <div key={group.heading}>
            {!collapsed && (
              <p className="text-2xs font-semibold uppercase tracking-widest text-primary-400 px-2 mb-1">
                {group.heading}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const isActive = location.pathname === item.to ||
                  (item.to !== '/dashboard' && location.pathname.startsWith(item.to))
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center rounded-md text-sm font-medium transition-colors duration-150',
                        collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5 gap-3',
                        isActive
                          ? 'bg-primary-700 text-white'
                          : 'text-primary-200 hover:bg-primary-800 hover:text-white',
                      )}
                    >
                      <item.icon size={18} className="flex-shrink-0" />
                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {!collapsed && item.badge !== undefined && (
                        <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent-gold text-primary-900 text-2xs font-bold">
                          {item.badge}
                        </span>
                      )}
                      {collapsed && item.badge !== undefined && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-gold" />
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary-700 border border-primary-600 flex items-center justify-center text-white hover:bg-primary-600 transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* IBU badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-primary-700">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-primary-800">
            <span className="w-2 h-2 rounded-full bg-success-500 flex-shrink-0" />
            <span className="text-2xs text-primary-300 truncate">IFSCA Licensed IBU</span>
          </div>
        </div>
      )}
    </aside>
  )
}
