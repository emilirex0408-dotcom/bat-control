import { useState, useMemo } from 'react'
import { Search, Plus, Trash2, X, ArrowUpDown, Filter, Tag, ChevronDown } from 'lucide-react'
import { formatCurrency, formatDate, getTodayStr } from '../../utils/formatters'
import { EXPENSE_CATEGORIES } from '../../constants/categories'

export default function TransactionList({ transactions, categories, onDelete, onAddManual, onUpdateCategory }) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('Todas')
  const [sortBy, setSortBy] = useState('date')
  const [showAdd, setShowAdd] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [pendingCat, setPendingCat] = useState(null)
  const [editingSubcat, setEditingSubcat] = useState(null)
  const [newExpense, setNewExpense] = useState({
    descripcion: '',
    monto: '',
    categoria: 'Otros',
    fecha: getTodayStr(),
  })

  const filtered = useMemo(() => {
    let result = [...transactions]
    if (search) {
      result = result.filter((t) => t.descripcion.toLowerCase().includes(search.toLowerCase()))
    }
    if (filterCat !== 'Todas') {
      result = result.filter((t) => t.categoria === filterCat)
    }
    if (sortBy === 'date') result.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    else if (sortBy === 'amount') result.sort((a, b) => b.monto - a.monto)
    return result
  }, [transactions, search, filterCat, sortBy])

  const handleAdd = () => {
    if (!newExpense.descripcion.trim() || !newExpense.monto) return
    onAddManual({
      ...newExpense,
      monto: parseFloat(newExpense.monto),
    })
    setNewExpense({ descripcion: '', monto: '', categoria: 'Otros', fecha: getTodayStr() })
    setShowAdd(false)
  }

  const categories_list = ['Todas', ...Object.keys(EXPENSE_CATEGORIES)]

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search and filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bat-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="bat-input w-full pl-10"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bat-btn bat-btn-gold px-3"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {categories_list.map((cat) => {
          const config = EXPENSE_CATEGORIES[cat]
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`bat-badge shrink-0 transition ${
                filterCat === cat
                  ? 'text-bat-black font-bold'
                  : 'bg-bat-panel text-bat-muted border border-bat-border'
              }`}
              style={filterCat === cat && config ? { backgroundColor: config.color } : {}}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Sort toggle */}
      <button
        onClick={() => setSortBy(sortBy === 'date' ? 'amount' : 'date')}
        className="bat-btn bat-btn-ghost text-xs py-2 w-full"
      >
        <ArrowUpDown className="w-3 h-3" />
        Ordenar por: {sortBy === 'date' ? 'Fecha' : 'Monto'}
      </button>

      {/* List */}
      <div className="space-y-1">
        {filtered.length === 0 ? (
          <p className="text-center text-bat-muted py-8 text-sm">No se encontraron transacciones.</p>
        ) : (
          filtered.map((t) => {
            const config = EXPENSE_CATEGORIES[t.categoria] || { color: '#666' }
            const ambito = config.ambito || 'personal'
            return (
              <div
                key={t.id}
                className="bat-card flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-bat-white truncate">{t.descripcion}</p>
                    <button
                      onClick={() => setEditingCat(editingCat === t.id ? null : t.id)}
                      className="text-xs text-bat-muted flex items-center gap-1 hover:text-bat-gold transition mt-0.5 flex-wrap"
                    >
                      {t.fechaOperacion && t.fechaCargo && t.fechaOperacion !== t.fechaCargo ? (
                        <span className="text-bat-muted">
                          Op: {formatDate(t.fechaOperacion, true)} · Cargo: <span className="text-bat-silver">{formatDate(t.fechaCargo, true)}</span>
                        </span>
                      ) : (
                        <span>{formatDate(t.fecha, true)}</span>
                      )}
                      <span> · </span>
                      <span className="font-semibold" style={{ color: config.color }}>
                        {t.categoria}
                      </span>
                      {t.subcategory && <span className="text-bat-muted"> · {t.subcategory}</span>}
                      <Tag className="w-3 h-3 opacity-50" />
                      {ambito === 'nexus' && !t.esAbono && <span style={{ color: '#06b6d4' }}>· 🤖</span>}
                      {t.esAbono && <span className="text-gym-green">· Abono</span>}
                    </button>

                    {/* Category picker */}
                    {editingCat === t.id && (
                      <div className="mt-2 p-2 bg-bat-night rounded-xl border border-bat-border animate-slide-up">
                        <p className="bat-label mb-1.5">Categoria</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {Object.entries(EXPENSE_CATEGORIES).map(([cat, cfg]) => (
                            <button
                              key={cat}
                              onClick={() => {
                                setPendingCat(cat)
                                setEditingSubcat(t.id)
                              }}
                              className={`bat-badge transition ${
                                t.categoria === cat
                                  ? 'text-bat-black font-bold ring-2 ring-bat-gold'
                                  : 'bg-bat-panel text-bat-silver border border-bat-border hover:border-bat-gold/30'
                              }`}
                              style={t.categoria === cat ? { backgroundColor: cfg.color } : {}}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Subcategory picker */}
                        {editingSubcat === t.id && pendingCat && (
                          <>
                            <p className="bat-label mb-1.5">Subcategoria de {pendingCat}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(EXPENSE_CATEGORIES[pendingCat]?.subcategories || ['Otros']).map((sub) => (
                                <button
                                  key={sub}
                                  onClick={() => {
                                    onUpdateCategory(t.id, pendingCat, sub)
                                    setEditingCat(null)
                                    setEditingSubcat(null)
                                    setPendingCat(null)
                                  }}
                                  className="bat-badge bg-bat-panel text-bat-silver border border-bat-border hover:border-bat-gold/30 transition"
                                >
                                  {sub}
                                </button>
                              ))}
                              <button
                                onClick={() => {
                                  onUpdateCategory(t.id, pendingCat, null)
                                  setEditingCat(null)
                                  setEditingSubcat(null)
                                  setPendingCat(null)
                                }}
                                className="bat-badge text-bat-muted border border-bat-border"
                              >
                                Sin subcategoria
                              </button>
                            </div>
                          </>
                        )}

                        {/* Show current subcategory info */}
                        {editingSubcat !== t.id && t.subcategory && (
                          <p className="text-xs text-bat-muted mt-1">
                            Subcategoria actual: <span className="text-bat-silver">{t.subcategory}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-sm font-bold ${t.esAbono ? 'text-gym-green' : 'text-gym-red'}`}>
                    {t.esAbono ? '-' : '+'}{formatCurrency(t.monto)}
                  </span>
                  {!t.esAbono && (
                    <button
                      onClick={() => setEditingCat(editingCat === t.id ? null : t.id)}
                      className="opacity-0 group-hover:opacity-100 text-bat-muted hover:text-bat-gold transition md:opacity-0"
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(t.id)}
                    className="opacity-0 group-hover:opacity-100 text-bat-muted hover:text-gym-red transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add manual expense modal */}
      {showAdd && (
        <div
          className="fixed inset-0 bg-bat-black/90 z-[60] flex items-end md:items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-bat-dark border border-bat-border rounded-3xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-bat-gold uppercase">Nuevo gasto</h3>
              <button onClick={() => setShowAdd(false)} className="text-bat-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="bat-label">Descripcion</label>
              <input
                type="text"
                value={newExpense.descripcion}
                onChange={(e) => setNewExpense({ ...newExpense, descripcion: e.target.value })}
                placeholder="Ej: Spotify, Oxxo, Uber..."
                className="bat-input w-full mt-1"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="bat-label">Monto</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={newExpense.monto}
                  onChange={(e) => setNewExpense({ ...newExpense, monto: e.target.value })}
                  placeholder="0.00"
                  className="bat-input w-full mt-1"
                />
              </div>
              <div>
                <label className="bat-label">Fecha</label>
                <input
                  type="date"
                  value={newExpense.fecha}
                  onChange={(e) => setNewExpense({ ...newExpense, fecha: e.target.value })}
                  className="bat-input w-full mt-1"
                />
              </div>
            </div>

            <div>
              <label className="bat-label">Categoria</label>
              <select
                value={newExpense.categoria}
                onChange={(e) => setNewExpense({ ...newExpense, categoria: e.target.value })}
                className="bat-input w-full mt-1"
              >
                {Object.keys(EXPENSE_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat} className="bg-bat-dark">{cat}</option>
                ))}
              </select>
            </div>

            <button onClick={handleAdd} className="w-full bat-btn bat-btn-gold">
              <Plus className="w-4 h-4" /> Agregar gasto
            </button>
          </div>
        </div>
      )}
    </div>
  )
}