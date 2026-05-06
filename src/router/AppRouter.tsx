import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// Layouts
import { AppShell }   from '@/components/layout/AppShell'
import { AuthLayout } from '@/components/layout/AuthLayout'

// Auth pages
import { Login }    from '@/pages/auth/Login'
import { OTPAuth }  from '@/pages/auth/OTPAuth'
import { Consent }  from '@/pages/auth/Consent'

// Core banking
import { Dashboard }     from '@/pages/Dashboard'
import { AccountList }   from '@/pages/accounts/AccountList'
import { AccountDetail } from '@/pages/accounts/AccountDetail'
import { Statements }    from '@/pages/accounts/Statements'

// Payments
import { Beneficiaries }      from '@/pages/payments/Beneficiaries'
import { PaymentNew }         from '@/pages/payments/PaymentNew'
import { PaymentReview }      from '@/pages/payments/PaymentReview'
import { PaymentSuccess }     from '@/pages/payments/PaymentSuccess'
import { ScheduledPayments }  from '@/pages/payments/ScheduledPayments'

// Approvals
import { MakerChecker } from '@/pages/approvals/MakerChecker'

// FX & Deposits
import { FXConversion } from '@/pages/fx/FXConversion'
import { FixedDeposit } from '@/pages/deposits/FixedDeposit'

// Requests
import { ServiceRequests } from '@/pages/requests/ServiceRequests'

// Corporate & Settings
import { UserManagement } from '@/pages/corporate/UserManagement'
import { Settings }       from '@/pages/corporate/Settings'
import { Notifications }  from '@/pages/corporate/Notifications'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login"      element={<Login />} />
          <Route path="/auth/otp"   element={<OTPAuth />} />
          <Route path="/consent"    element={<Consent />} />
        </Route>

        {/* Protected banking routes */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="/dashboard"              element={<Dashboard />} />
          <Route path="/accounts"               element={<AccountList />} />
          <Route path="/accounts/:id"           element={<AccountDetail />} />
          <Route path="/statements"             element={<Statements />} />
          <Route path="/beneficiaries"          element={<Beneficiaries />} />
          <Route path="/payments/new"           element={<PaymentNew />} />
          <Route path="/payments/review"        element={<PaymentReview />} />
          <Route path="/payments/success"       element={<PaymentSuccess />} />
          <Route path="/payments/scheduled"     element={<ScheduledPayments />} />
          <Route path="/approvals"              element={<MakerChecker />} />
          <Route path="/fx"                     element={<FXConversion />} />
          <Route path="/fixed-deposits"         element={<FixedDeposit />} />
          <Route path="/requests"               element={<ServiceRequests />} />
          <Route path="/corporate/users"        element={<UserManagement />} />
          <Route path="/settings"               element={<Settings />} />
          <Route path="/notifications"          element={<Notifications />} />
        </Route>

        {/* Default redirect */}
        <Route path="/"  element={<Navigate to="/login" replace />} />
        <Route path="*"  element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
