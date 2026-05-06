import { Bell, LogOut, Clock, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useBanking } from '@/context/BankingContext'
import { RoleSwitcher } from './RoleSwitcher'

export function TopBar() {
  const { logout }                   = useAuth()
  const { pendingApprovalsCount }    = useBanking()
  const navigate                     = useNavigate()
  const [sessionTime, setSessionTime] = useState(1800) // 30 min session
  const [showWarning, setShowWarning] = useState(false)

  // Session countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(t => {
        if (t <= 120 && !showWarning) setShowWarning(true)
        if (t <= 0) { logout(); navigate('/login'); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [logout, navigate, showWarning])

  const minutes = Math.floor(sessionTime / 60)
  const seconds = sessionTime % 60
  const isLow   = sessionTime <= 300

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      <header className="h-16 bg-primary-900 border-b border-primary-700 flex items-center justify-between px-6 flex-shrink-0 z-20">
        {/* Breadcrumb area */}
        <nav className="flex items-center gap-1 text-sm text-primary-300">
          <span>BOI GIFT City IBU</span>
          <ChevronRight size={14} />
          <span className="text-primary-100 font-medium">Internet Banking</span>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          {/* Session timer */}
          <div className={cn(
            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-mono',
            isLow ? 'bg-error-500/20 text-error-300' : 'bg-primary-800 text-primary-300',
          )}>
            <Clock size={12} />
            <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
          </div>

          {/* Notifications bell */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-md text-primary-300 hover:bg-primary-800 hover:text-white transition-colors"
          >
            <Bell size={18} />
            {pendingApprovalsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-gold" />
            )}
          </button>

          {/* Role switcher */}
          <RoleSwitcher />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-primary-300 hover:bg-primary-800 hover:text-white transition-colors"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Session expiry warning */}
      {showWarning && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-warning-200 rounded-lg shadow-modal p-4 w-80">
          <div className="flex items-start gap-3">
            <Clock size={18} className="text-warning-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Session Expiring Soon</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your session will expire in {minutes} min {String(seconds).padStart(2, '0')} sec.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setSessionTime(1800); setShowWarning(false) }}
                  className="flex-1 py-1.5 px-3 rounded-md bg-primary-900 text-white text-xs font-medium hover:bg-primary-700 transition-colors"
                >
                  Extend Session
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:bg-surface-100 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
