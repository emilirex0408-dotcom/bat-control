import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const AuthContext = createContext(null)

const DEFAULT_USERS = [
  { id: 'emiliano', name: 'Emiliano', role: 'admin', unit: 'kg' },
  { id: 'compa', name: 'Compa', role: 'user', unit: 'kg' },
]

export function AuthProvider({ children }) {
  const [users, setUsers] = useLocalStorage('bat_users', DEFAULT_USERS)
  const [currentUserId, setCurrentUserId] = useLocalStorage('bat_current_user', null)

  const currentUser = users.find((u) => u.id === currentUserId) || null

  useEffect(() => {
    if (currentUserId && !currentUser) {
      setCurrentUserId(null)
    }
  }, [currentUserId, currentUser, setCurrentUserId])

  const login = useCallback((userId) => setCurrentUserId(userId), [setCurrentUserId])
  const logout = useCallback(() => setCurrentUserId(null), [setCurrentUserId])

  const updateCurrentUser = useCallback(
    (patch) => {
      if (!currentUser) return
      setUsers(users.map((u) => (u.id === currentUser.id ? { ...u, ...patch } : u)))
    },
    [currentUser, users, setUsers]
  )

  const addUser = useCallback(
    (user) => {
      if (users.some((u) => u.id === user.id)) return false
      setUsers([...users, { ...user, unit: user.unit || 'kg' }])
      return true
    },
    [users, setUsers]
  )

  const removeUser = useCallback(
    (userId) => {
      if (userId === 'emiliano') return false
      setUsers(users.filter((u) => u.id !== userId))
      if (currentUserId === userId) setCurrentUserId(null)
      return true
    },
    [users, setUsers, currentUserId, setCurrentUserId]
  )

  const value = {
    users,
    currentUser,
    login,
    logout,
    updateCurrentUser,
    addUser,
    removeUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}