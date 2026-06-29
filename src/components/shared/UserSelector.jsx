import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import BatLogo from './BatLogo'

export default function UserSelector() {
  const { users, login, addUser } = useAuth()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('user')
  const [error, setError] = useState('')

  const slug = (name) =>
    name.toLowerCase().trim().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user' + Date.now()

  const handleAdd = () => {
    if (!newName.trim()) return
    const ok = addUser({ id: slug(newName), name: newName.trim(), role: newRole, unit: 'kg' })
    if (!ok) {
      setError('Ya existe un usuario con ese nombre')
      return
    }
    setNewName('')
    setNewRole('user')
    setError('')
    setShowAdd(false)
  }

  return (
    <div className="min-h-screen bg-bat-black text-bat-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <BatLogo size={80} className="drop-shadow-[0_0_16px_rgba(255,215,0,0.4)] mb-4" />
          <h1 className="font-display text-3xl text-bat-gold uppercase tracking-wider">Bat Control</h1>
          <p className="text-sm text-bat-muted mt-1">¿Quién entrena hoy?</p>
        </div>

        <div className="space-y-2">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => login(u.id)}
              className="w-full bat-card flex items-center justify-between hover:border-bat-gold/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-bat-night border border-bat-border flex items-center justify-center font-display text-bat-gold text-lg">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-bold text-bat-white">{u.name}</p>
                  <p className="text-xs text-bat-muted">
                    {u.role === 'admin' ? 'Admin · Gym + Finanzas' : 'Gym'}
                  </p>
                </div>
              </div>
              <span className="text-xs bat-badge bg-bat-panel text-bat-muted group-hover:text-bat-gold transition">
                {u.unit.toUpperCase()}
              </span>
            </button>
          ))}
        </div>

        {showAdd ? (
          <div className="mt-4 bat-card space-y-3">
            <h3 className="font-display text-sm text-bat-gold uppercase">Nuevo usuario</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre"
              className="bat-input w-full"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setNewRole('user')}
                className={`bat-btn flex-1 ${newRole === 'user' ? 'bat-btn-gold' : 'bat-btn-ghost'}`}
              >
                Gym (solo gym)
              </button>
              <button
                onClick={() => setNewRole('admin')}
                className={`bat-btn flex-1 ${newRole === 'admin' ? 'bat-btn-gold' : 'bat-btn-ghost'}`}
              >
                Admin (todo)
              </button>
            </div>
            {error && <p className="text-xs text-gym-purple">{error}</p>}
            <div className="flex gap-2">
              <button onClick={handleAdd} className="bat-btn bat-btn-gold flex-1">Crear</button>
              <button onClick={() => setShowAdd(false)} className="bat-btn bat-btn-ghost">Cancelar</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 w-full bat-btn bat-btn-ghost"
          >
            + Agregar usuario
          </button>
        )}

        <p className="text-[10px] text-bat-muted text-center mt-6">
          Los datos viven en este dispositivo. No hay servidor.
        </p>
      </div>
    </div>
  )
}