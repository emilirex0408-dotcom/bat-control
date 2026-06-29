import { useState } from 'react'
import { LogOut, User, ChevronDown, Scale } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BatLogo from './BatLogo'

export default function UserMenu() {
  const { currentUser, logout, updateCurrentUser, users, removeUser, addUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')

  if (!currentUser) return null

  const toggleUnit = () => {
    updateCurrentUser({ unit: currentUser.unit === 'kg' ? 'lb' : 'kg' })
    setOpen(false)
  }

  const slug = (name) =>
    name.toLowerCase().trim().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user' + Date.now()

  const handleAdd = () => {
    if (!newName.trim()) return
    addUser({ id: slug(newName), name: newName.trim(), role: 'user', unit: 'kg' })
    setNewName('')
    setShowAdd(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-3 right-3 z-[55] bat-card py-1.5 px-3 flex items-center gap-2 hover:border-bat-gold/40 transition"
      >
        <div className="w-6 h-6 rounded-full bg-bat-night border border-bat-border flex items-center justify-center text-xs font-display text-bat-gold">
          {currentUser.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-semibold text-bat-silver hidden sm:block">{currentUser.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-bat-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div className="fixed top-12 right-3 z-[60] bat-card p-2 min-w-[200px] space-y-1 animate-fade-in">
            <div className="px-3 py-2 border-b border-bat-border mb-1">
              <p className="text-sm font-bold text-bat-white">{currentUser.name}</p>
              <p className="text-[10px] text-bat-muted uppercase">
                {currentUser.role === 'admin' ? 'Admin' : 'Gym'} · {currentUser.unit.toUpperCase()}
              </p>
            </div>

            <button
              onClick={toggleUnit}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-bat-panel transition flex items-center gap-2 text-sm text-bat-silver"
            >
              <Scale className="w-4 h-4 text-bat-gold" />
              Unidad: <span className="font-bold text-bat-white">{currentUser.unit === 'kg' ? 'Kg' : 'Lb'}</span>
              <span className="text-xs text-bat-muted ml-auto">Cambiar</span>
            </button>

            {currentUser.role === 'admin' && !showAdd && (
              <button
                onClick={() => setShowAdd(true)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-bat-panel transition flex items-center gap-2 text-sm text-bat-silver"
              >
                <User className="w-4 h-4 text-bat-gold" />
                Agregar usuario
              </button>
            )}

            {showAdd && (
              <div className="px-2 py-2 space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre del nuevo"
                  className="bat-input w-full text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
                  autoFocus
                />
                <div className="flex gap-1">
                  <button onClick={handleAdd} className="bat-btn bat-btn-gold flex-1 text-xs py-1.5">Crear</button>
                  <button onClick={() => setShowAdd(false)} className="bat-btn bat-btn-ghost text-xs py-1.5">X</button>
                </div>
              </div>
            )}

            <div className="border-t border-bat-border pt-1">
              <button
                onClick={() => { setOpen(false); logout() }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-bat-panel transition flex items-center gap-2 text-sm text-gym-purple"
              >
                <LogOut className="w-4 h-4" />
                Cambiar usuario
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}