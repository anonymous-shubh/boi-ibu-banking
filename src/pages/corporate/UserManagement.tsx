import { useState }               from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Shield, CheckCircle2, Plus,
  Edit, Lock, Unlock, X, Search,
} from 'lucide-react'
import { toast }                   from 'sonner'
import { useAuth }                 from '@/context/AuthContext'
import { cn }                      from '@/lib/utils'
import usersData                   from '@/data/users.json'
import type { User, UserRole }     from '@/types'

const INITIAL_USERS = usersData as User[]

const ROLE_COLORS: Record<UserRole, string> = {
  Admin:   'bg-primary-50 text-primary-700 border-primary-200',
  Maker:   'bg-warning-50 text-warning-700 border-warning-200',
  Checker: 'bg-success-50 text-success-700 border-success-200',
}

const ALL_PERMISSIONS = [
  { id: 'initiate',      label: 'Initiate Payments',    roles: ['Admin', 'Maker'] },
  { id: 'approve',       label: 'Approve / Authorize',  roles: ['Admin', 'Checker'] },
  { id: 'reject',        label: 'Reject Transactions',  roles: ['Admin', 'Checker'] },
  { id: 'manage_users',  label: 'Manage Users',         roles: ['Admin'] },
  { id: 'view_all',      label: 'View All Accounts',    roles: ['Admin'] },
  { id: 'view_own',      label: 'View Own Transactions',roles: ['Admin', 'Maker'] },
  { id: 'view_pending',  label: 'View Pending Approvals',roles: ['Admin', 'Checker'] },
]

interface UserWithStatus extends User {
  active: boolean
}

function UserRow({
  user,
  isCurrentUser,
  onToggleActive,
  onEdit,
}: {
  user: UserWithStatus
  isCurrentUser: boolean
  onToggleActive: () => void
  onEdit: () => void
}) {
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'transition-colors',
        !user.active && 'opacity-50',
        isCurrentUser && 'bg-accent-light',
      )}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold',
            isCurrentUser ? 'bg-primary-700 text-white' : 'bg-surface-100 text-muted-foreground',
          )}>
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{user.name}</p>
              {isCurrentUser && (
                <span className="text-xs bg-primary-100 text-primary-700 rounded-full px-2 py-0.5">You</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-xs font-mono text-muted-foreground">{user.id}</td>
      <td className="px-5 py-4">
        <span className={cn('text-xs font-medium rounded-full px-3 py-1 border', ROLE_COLORS[user.role])}>
          {user.role}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1">
          {user.permissions.map(p => (
            <span key={p} className="text-xs bg-surface-100 text-muted-foreground rounded px-2 py-0.5">
              {p.replace('_', ' ')}
            </span>
          ))}
        </div>
      </td>
      <td className="px-5 py-4 text-xs text-muted-foreground">{user.mobile ?? '—'}</td>
      <td className="px-5 py-4">
        <span className={cn(
          'text-xs rounded-full px-2.5 py-1 font-medium',
          user.active ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700',
        )}>
          {user.active ? 'Active' : 'Locked'}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-surface-100 text-muted-foreground hover:text-primary-600 transition-colors"
            title="Edit permissions"
          >
            <Edit size={14} />
          </button>
          {!isCurrentUser && (
            <button
              onClick={onToggleActive}
              className={cn(
                'p-1.5 rounded hover:bg-surface-100 transition-colors',
                user.active ? 'text-muted-foreground hover:text-error-600' : 'text-muted-foreground hover:text-success-600',
              )}
              title={user.active ? 'Lock user' : 'Unlock user'}
            >
              {user.active ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  )
}

function EditPermissionsModal({
  user,
  onClose,
  onSave,
}: {
  user: UserWithStatus
  onClose: () => void
  onSave: (perms: string[]) => void
}) {
  const [perms, setPerms] = useState<string[]>(user.permissions)
  const [role,  setRole]  = useState<UserRole>(user.role)

  function togglePerm(id: string) {
    setPerms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <div className="bg-surface-0 rounded-xl shadow-modal border border-border w-full max-w-md mx-4 pointer-events-auto">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground">Edit User — {user.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Modify role and permissions</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-2">Role</label>
              <div className="flex gap-2">
                {(['Admin', 'Maker', 'Checker'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={cn(
                      'flex-1 py-2 rounded-md border-2 text-xs font-semibold transition-all',
                      role === r ? `border-primary-500 ${ROLE_COLORS[r]}` : 'border-border text-muted-foreground hover:border-primary-300',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-2">Permissions</label>
              <div className="space-y-2">
                {ALL_PERMISSIONS.map(p => {
                  const isEnabled = perms.includes(p.id)
                  return (
                    <label key={p.id} className="flex items-center justify-between cursor-pointer group">
                      <span className="text-xs text-foreground">{p.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{p.roles.join(', ')}</span>
                        <div
                          onClick={() => togglePerm(p.id)}
                          className={cn(
                            'w-9 h-5 rounded-full relative transition-all',
                            isEnabled ? 'bg-primary-600' : 'bg-surface-200',
                          )}
                        >
                          <div className={cn(
                            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
                            isEnabled ? 'left-4' : 'left-0.5',
                          )} />
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 p-5 border-t border-border">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-md border border-border text-sm text-muted-foreground hover:bg-surface-100 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => { onSave(perms); onClose() }}
              className="flex-1 py-2.5 rounded-md bg-primary-900 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export function UserManagement() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState<UserWithStatus[]>(
    INITIAL_USERS.map(u => ({ ...u, active: true })),
  )
  const [search,   setSearch]   = useState('')
  const [editUser, setEditUser] = useState<UserWithStatus | null>(null)

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase()),
  )

  function toggleActive(id: string) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u))
    const user = users.find(u => u.id === id)
    if (user) toast.success(`${user.name} ${user.active ? 'locked' : 'unlocked'}.`)
  }

  function savePermissions(id: string, perms: string[]) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, permissions: perms } : u))
    toast.success('User permissions updated.')
  }

  const isAdmin = currentUser?.role === 'Admin'

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Corporate User Management</h1>
          <p className="page-subtitle text-muted-foreground mt-0.5">
            Manage roles, permissions, and access control for IBU internet banking users
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => toast.info('Add User — contact BOI branch for new user onboarding (demo)')}
            className="flex items-center gap-2 bg-primary-900 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} /> Add User
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="flex items-start gap-2 p-3 bg-warning-50 border border-warning-200 rounded-md text-xs text-warning-700">
          <Shield size={13} className="flex-shrink-0 mt-0.5" />
          <span>User management is restricted to Admin role. Switch to Admin in the TopBar to manage users.</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Users',    value: users.length,                               icon: Users },
          { label: 'Active',         value: users.filter(u => u.active).length,          icon: CheckCircle2 },
          { label: 'Admins',         value: users.filter(u => u.role === 'Admin').length, icon: Shield },
          { label: 'Locked',         value: users.filter(u => !u.active).length,          icon: Lock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card-base px-4 py-3 flex items-center gap-3">
            <Icon size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* User table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-100 border-b border-border">
              {['User', 'User ID', 'Role', 'Permissions', 'Mobile', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(user => (
              <UserRow
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUser?.id}
                onToggleActive={() => toggleActive(user.id)}
                onEdit={() => setEditUser(user)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Role legend */}
      <div className="card-base p-4">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Role Definitions</p>
        <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div>
            <span className={cn('inline-block text-xs font-medium rounded-full px-2.5 py-1 border mb-1.5', ROLE_COLORS.Admin)}>Admin</span>
            <p>Full access: initiate payments, approve transactions, and manage all users and accounts.</p>
          </div>
          <div>
            <span className={cn('inline-block text-xs font-medium rounded-full px-2.5 py-1 border mb-1.5', ROLE_COLORS.Maker)}>Maker</span>
            <p>Can initiate payments and view own transactions. Cannot approve — all payments go to Checker queue.</p>
          </div>
          <div>
            <span className={cn('inline-block text-xs font-medium rounded-full px-2.5 py-1 border mb-1.5', ROLE_COLORS.Checker)}>Checker</span>
            <p>Can approve or reject payments submitted by Makers. Cannot initiate transactions.</p>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editUser && (
          <EditPermissionsModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSave={perms => savePermissions(editUser.id, perms)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
