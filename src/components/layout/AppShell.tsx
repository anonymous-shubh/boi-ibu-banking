import { Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
}

export function AppShell() {
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
