import { AuthProvider }    from '@/context/AuthContext'
import { BankingProvider } from '@/context/BankingContext'
import { AppRouter }       from '@/router/AppRouter'
import { Toaster }         from 'sonner'

export default function App() {
  return (
    <AuthProvider>
      <BankingProvider>
        <AppRouter />
        <Toaster position="top-right" richColors closeButton />
      </BankingProvider>
    </AuthProvider>
  )
}
