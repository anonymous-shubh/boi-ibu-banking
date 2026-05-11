import { Outlet } from 'react-router-dom'
import { Building2, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center p-6">
      {/* Background pattern */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #C9A84C 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-gold shadow-lg mb-4">
            <Building2 size={28} className="text-primary-900" />
          </div>
          <h1 className="text-2xl font-bold text-white">Arttha</h1>
          <p className="text-primary-300 text-sm mt-1">Internet Banking Platform</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-modal overflow-hidden"
        >
          <Outlet />
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-primary-400 text-xs">
            <Shield size={12} />
            <span>Secured by 256-bit TLS Encryption</span>
          </div>
          <p className="text-primary-500 text-xs mt-2">
            As per IFSCA Circular IFSCA/IBU/2024/012 &mdash; Regulated by IFSCA
          </p>
        </motion.div>
      </div>
    </div>
  )
}
