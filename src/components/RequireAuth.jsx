import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function RequireAuth({ adminOnly = false, children }) {
  const { loading, session, isAdmin } = useAuth()

  if (loading) return null

  if (!session) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />

  return children
}
