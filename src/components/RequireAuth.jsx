import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function RequireAuth({ adminOnly = false, memberOnly = false, children }) {
  const { loading, session, isAdmin } = useAuth()

  if (loading) return null

  if (!session) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  // Profile / Payment history don't apply to an admin account (no
  // subscription, no purchases, no member-facing profile) — send them to
  // the admin equivalent (Settings -> Account) instead of a page that has
  // nothing to show them.
  if (memberOnly && isAdmin) return <Navigate to="/admin/settings" replace />

  return children
}
