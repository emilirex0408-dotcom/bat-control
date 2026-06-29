import { useState, useMemo, useCallback } from 'react'
import { Upload, List, LayoutDashboard, Wallet, ChevronDown, Trash2, ArrowDown, ArrowUp, Banknote, Repeat, Check, X, Tag, Search, ArrowUpDown, Plus } from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { formatCurrency, formatDate, getTodayStr } from '../../utils/formatters'
import { parseNuPDF } from '../../utils/pdfParser'
import { DEBIT_CATEGORIES } from '../../constants/categories'
import BatLogo from '../shared/BatLogo'
import DebitCharts from './DebitCharts'

export default function DebitApp() {
  const [view, setView] = useState('overview')
  const [periodsData, setPeriodsData] = useLocalStorage('bat_debit_periods', {})
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [parsedData, setParsedData] = useState(null)

  const uploadedPeriods = useMemo(() => {
    return Object.entries(periodsData)
      .map(([key, data]) => ({
        key,
        periodLabel: data.periodLabel || key,
        count: data.transactions.length,
      }))
      .sort((a, b) => b.key.localeCompare(a.key))
  }, [periodsData])

  const allPeriodKeys = useMemo(() => {
    return Object.keys(periodsData).sort().reverse()
  }, [periodsData])

  const activePeriod = selectedPeriod || (allPeriodKeys[0] || null)

  const periodTransactions = useMemo(() => {
    if (!activePeriod) return []
    const txs = periodsData[activePeriod]?.transactions || []
    return [...txs].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [periodsData, activePeriod])

  const activePeriodLabel = useMemo(() => {
    if (!activePeriod) return null
    return periodsData[activePeriod]?.periodLabel || activePeriod
  }, [periodsData, activePeriod])

  const stats = useMemo(() => {
    if (!periodTransactions.length) return null
    let depositos = 0, retiros = 0, pagosTarjeta = 0
    let countDep = 0, countRet = 0, countPago = 0
    const byCategory = {}

    periodTransactions.forEach((t) => {
      const cat = t.categoria || 'Otros'
      if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0, subs: {} }
      byCategory[cat].total += t.monto
      byCategory[cat].count++

      if (t.subcategory) {
        byCategory[cat].subs[t.subcategory] = (byCategory[cat].subs[t.subcategory] || 0) + t.monto
      }

      if (t.esPagoTarjeta) {
        pagosTarjeta += t.monto
        countPago++
      } else if (t.esDeposito) {
        depositos += t.monto
        countDep++
      } else {
        retiros += t.monto
        countRet++
      }
    })

    const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total)
    const neto = depositos - retiros - pagosTarjeta
    return { depositos, retiros, pagosTarjeta, neto, countDep, countRet, countPago, sortedCategories }
  }, [periodTransactions])

  const handleFile = async (file) => {
    setError(null)
    setLoading(true)
    try {
      const ext = file.name.toLowerCase().split('.').pop()
      if (ext !== 'pdf') throw new Error('Solo se aceptan PDFs de débito')

      const result = await parseNuPDF(file)
      const txs = result.transactions || []
      if (!txs || txs.length === 0) throw new Error('No se encontraron transacciones en el PDF')

      const debitTxs = txs.filter((t) => t.account === 'debit')
      if (debitTxs.length === 0) throw new Error('Este PDF no parece ser de cuenta de débito')

      setParsedData({ period: result.period, transactions: debitTxs })
    } catch (e) {
      setError(e.message || 'Error al procesar el archivo')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!parsedData) return
    const { period, transactions } = parsedData
    if (period && period.monthKey) {
      setPeriodsData({
        ...periodsData,
        [period.monthKey]: {
          periodLabel: period.periodLabel || period.monthKey,
          transactions,
        },
      })
      setSelectedPeriod(period.monthKey)
    }
    setParsedData(null)
  }

  const handleClearPeriod = (key) => {
    const updated = { ...periodsData }
    delete updated[key]
    setPeriodsData(updated)
  }

  const removeTransaction = useCallback((id) => {
    for (const [key, data] of Object.entries(periodsData)) {
      const filtered = data.transactions.filter((t) => t.id !== id)
      if (filtered.length !== data.transactions.length) {
        setPeriodsData({
          ...periodsData,
          [key]: { ...data, transactions: filtered },
        })
        break
      }
    }
  }, [periodsData, setPeriodsData])

  const updateTransactionCategory = useCallback((id, newCategory, newSubcategory) => {
    for (const [key, data] of Object.entries(periodsData)) {
      const updated = data.transactions.map((t) =>
        t.id === id ? { ...t, categoria: newCategory, subcategory: newSubcategory || null } : t
      )
      if (updated.some((t) => t.id === id)) {
        setPeriodsData({
          ...periodsData,
          [key]: { ...data, transactions: updated },
        })
        break
      }
    }
  }, [periodsData, setPeriodsData])

  const addManualTransaction = (tx) => {
    if (!activePeriod) return
    const newTx = {
      id: Date.now() + Math.random(),
      ...tx,
      source: 'manual',
      account: 'debit',
    }
    const existing = periodsData[activePeriod]
    if (existing) {
      setPeriodsData({
        ...periodsData,
        [activePeriod]: {
          ...existing,
          transactions: [...existing.transactions, newTx],
        },
      })
    }
  }

  const hasData = Object.values(periodsData).some((d) => d.transactions.length > 0)

  const allTransactions = useMemo(() => {
    const txs = []
    Object.values(periodsData).forEach((data) => txs.push(...data.transactions))
    return txs
  }, [periodsData])

  return (
    <div className="min-h-screen px-4 py-6 max-w-4xl mx-auto animate-fade-in">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BatLogo size={36} className="drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]" />
          <div>
            <h1 className="font-display text-2xl text-bat-gold uppercase tracking-wider">Cuenta Nu</h1>
            <p className="text-xs text-bat-muted">Débito · Movimientos</p>
          </div>
        </div>
      </header>

      {/* Sub-navigation */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setView('overview')}
          className={`bat-btn ${view === 'overview' ? 'bat-btn-gold' : 'bat-btn-ghost'} shrink-0`}
        >
          <LayoutDashboard className="w-4 h-4" /> Resumen
        </button>
        <button
          onClick={() => setView('upload')}
          className={`bat-btn ${view === 'upload' ? 'bat-btn-gold' : 'bat-btn-ghost'} shrink-0`}
        >
          <Upload className="w-4 h-4" /> Subir PDF
        </button>
        <button
          onClick={() => setView('transactions')}
          className={`bat-btn ${view === 'transactions' ? 'bat-btn-gold' : 'bat-btn-ghost'} shrink-0`}
        >
          <List className="w-4 h-4" /> Movimientos
        </button>
      </div>

      {/* Period selector */}
      {hasData && allPeriodKeys.length > 0 && view !== 'upload' && (
        <div className="mb-4">
          <div className="relative">
            <select
              value={activePeriod || ''}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bat-input w-full appearance-none pr-10"
            >
              {allPeriodKeys.map((pk) => {
                const label = periodsData[pk]?.periodLabel || pk
                return (
                  <option key={pk} value={pk} className="bg-bat-dark">
                    {label}
                  </option>
                )
              })}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bat-muted pointer-events-none" />
          </div>
        </div>
      )}

      {/* Overview */}
      {view === 'overview' && (
        stats ? (
          <div className="space-y-4 animate-fade-in">
            {activePeriodLabel && (
              <h2 className="font-display text-lg text-bat-silver uppercase">{activePeriodLabel}</h2>
            )}

            {/* Depositos vs Retiros */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bat-card border-gym-green/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-gym-green/10 flex items-center justify-center">
                    <ArrowDown className="w-5 h-5 text-gym-green" />
                  </div>
                  <span className="bat-label">Entradas</span>
                </div>
                <p className="font-display text-2xl text-gym-green">{formatCurrency(stats.depositos)}</p>
                <p className="text-xs text-bat-muted mt-0.5">{stats.countDep} depositos</p>
              </div>
              <div className="bat-card border-gym-red/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-gym-red/10 flex items-center justify-center">
                    <ArrowUp className="w-5 h-5 text-gym-red" />
                  </div>
                  <span className="bat-label">Salidas</span>
                </div>
                <p className="font-display text-2xl text-gym-red">{formatCurrency(stats.retiros + stats.pagosTarjeta)}</p>
                <p className="text-xs text-bat-muted mt-0.5">{stats.countRet + stats.countPago} movimientos</p>
              </div>
            </div>

            {/* Card payments */}
            {stats.pagosTarjeta > 0 && (
              <div className="bat-card bg-gradient-to-br from-bat-dark to-bat-panel border-bat-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-bat-gold/10 flex items-center justify-center">
                      <Repeat className="w-5 h-5 text-bat-gold" />
                    </div>
                    <div>
                      <p className="bat-label">Pagos a tarjeta de credito</p>
                      <p className="text-xs text-bat-muted">Transferencias internas</p>
                    </div>
                  </div>
                  <p className="font-display text-xl text-bat-gold">{formatCurrency(stats.pagosTarjeta)}</p>
                </div>
              </div>
            )}

            {/* Net */}
            <div className={`bat-card bg-gradient-to-br from-bat-dark to-bat-panel ${stats.neto >= 0 ? 'border-gym-green/20' : 'border-gym-red/20'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="bat-label mb-1">Balance del mes</p>
                  <p className={`font-display text-3xl ${stats.neto >= 0 ? 'text-gym-green' : 'text-gym-red'}`}>
                    {stats.neto >= 0 ? '+' : '-'}{formatCurrency(Math.abs(stats.neto))}
                  </p>
                </div>
                <div className={`px-3 py-1.5 rounded-full ${stats.neto >= 0 ? 'bg-gym-green/10 text-gym-green' : 'bg-gym-red/10 text-gym-red'}`}>
                  <span className="text-sm font-bold">{stats.neto >= 0 ? 'Superavit' : 'Deficit'}</span>
                </div>
              </div>
            </div>

            {/* Charts */}
            {periodTransactions.length > 0 && (
              <DebitCharts
                transactions={periodTransactions}
                allTransactions={allTransactions}
              />
            )}

            {/* Categories breakdown */}
            {stats.sortedCategories.length > 0 && (
              <div>
                <h3 className="font-display text-sm text-bat-muted uppercase mb-2">Por categoria</h3>
                <div className="space-y-2">
                  {stats.sortedCategories.map(([cat, data]) => {
                    const config = DEBIT_CATEGORIES[cat] || DEBIT_CATEGORIES.Otros
                    const subEntries = Object.entries(data.subs || {}).sort((a, b) => b[1] - a[1])
                    return (
                      <div key={cat} className="bat-card">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-bat-white font-medium">{cat}</span>
                              <span className="text-sm font-bold text-bat-silver">{formatCurrency(data.total)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-xs text-bat-muted">{data.count} movimientos</span>
                            </div>
                          </div>
                        </div>
                        {subEntries.length > 0 && (
                          <div className="mt-2 ml-6 space-y-1">
                            {subEntries.map(([sub, subAmount]) => (
                              <div key={sub} className="flex items-center justify-between text-xs text-bat-muted">
                                <span className="truncate">{sub}</span>
                                <span className="shrink-0 ml-2">{formatCurrency(subAmount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent transactions */}
            <div>
              <h3 className="font-display text-sm text-bat-muted uppercase mb-2">Movimientos recientes</h3>
              <div className="space-y-1">
                {periodTransactions.slice(0, 8).map((t) => (
                  <DebitRow key={t.id} t={t} onDelete={removeTransaction} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bat-card text-center py-12">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-bat-border" />
            <p className="text-bat-muted mb-2">No hay datos de debito todavia.</p>
            <p className="text-bat-muted text-sm mb-4">Sube tu estado de cuenta de Cuenta Nu (PDF) para empezar.</p>
            <button onClick={() => setView('upload')} className="bat-btn bat-btn-gold mx-auto">
              <Upload className="w-4 h-4" /> Subir PDF
            </button>
          </div>
        )
      )}

      {/* Upload */}
      {view === 'upload' && (
        <div className="space-y-4 animate-fade-in">
          {uploadedPeriods.length > 0 && (
            <div>
              <h3 className="bat-label mb-2">Meses cargados</h3>
              <div className="space-y-1.5">
                {uploadedPeriods.map((m) => (
                  <div key={m.key} className="bat-card flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-bat-white">{m.periodLabel}</span>
                      <span className="text-xs text-bat-muted">· {m.count} movimientos</span>
                    </div>
                    <button
                      onClick={() => handleClearPeriod(m.key)}
                      className="text-bat-muted hover:text-gym-red transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragging(false)
              if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
            }}
            className={`bat-card border-2 border-dashed transition-all ${
              dragging ? 'border-bat-gold bg-bat-gold/5' : 'border-bat-border'
            } py-12 text-center`}
          >
            <Upload className={`w-12 h-12 mx-auto mb-3 ${dragging ? 'text-bat-gold' : 'text-bat-muted'}`} />
            <p className="text-bat-white font-semibold mb-1">
              {loading ? 'Procesando...' : 'Arrastra tu PDF de Cuenta Nu aqui'}
            </p>
            <p className="text-xs text-bat-muted mb-4">
              Descargalo desde la app de Nu: Cuenta {'>'} Estados de cuenta {'>'} Descargar PDF
            </p>
            <label className="bat-btn bat-btn-gold cursor-pointer inline-flex">
              <Upload className="w-4 h-4" />
              {loading ? 'Procesando...' : 'Seleccionar PDF'}
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files[0] && handleFile(e.dataTransfer.files[0])}
              />
            </label>
          </div>

          {error && (
            <div className="bat-card border-gym-red/20 flex items-center gap-2 text-gym-red text-sm">
              <X className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {parsedData && (
            <div className="space-y-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg text-bat-gold uppercase">
                    {parsedData.transactions.length} movimientos
                  </h3>
                  {parsedData.period && (
                    <p className="text-xs text-bat-muted">
                      Periodo: {parsedData.period.periodLabel || parsedData.period.monthKey}
                    </p>
                  )}
                </div>
                <button onClick={handleConfirm} className="bat-btn bat-btn-gold">
                  <Check className="w-4 h-4" /> Guardar
                </button>
              </div>
              <div className="bat-card p-0 overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {parsedData.transactions.map((t) => (
                    <DebitRow key={t.id} t={t} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bat-card text-sm text-bat-muted">
            <p className="font-semibold text-bat-silver mb-1">Como obtener tu estado de cuenta de Cuenta Nu:</p>
            <p>1. Abre la app de Nu</p>
            <p>2. Ve a tu Cuenta Nu (debito)</p>
            <p>3. Toca "Estados de cuenta"</p>
            <p>4. Descarga el PDF</p>
            <p className="mt-2 text-xs">El archivo se procesa en tu navegador. Nada se sube a internet.</p>
          </div>
        </div>
      )}

      {/* Transactions list */}
      {view === 'transactions' && (
        periodTransactions.length > 0 ? (
          <DebitTransactionList
            transactions={periodTransactions}
            onDelete={removeTransaction}
            onUpdateCategory={updateTransactionCategory}
            onAddManual={addManualTransaction}
          />
        ) : (
          <div className="bat-card text-center py-12">
            <List className="w-12 h-12 mx-auto mb-4 text-bat-border" />
            <p className="text-bat-muted">No hay movimientos en este periodo.</p>
          </div>
        )
      )}
    </div>
  )
}

function DebitTransactionList({ transactions, onDelete, onUpdateCategory, onAddManual }) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('Todas')
  const [sortBy, setSortBy] = useState('date')
  const [editingCat, setEditingCat] = useState(null)
  const [pendingCat, setPendingCat] = useState(null)
  const [editingSubcat, setEditingSubcat] = useState(null)

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

  const categoriesList = ['Todas', ...Object.keys(DEBIT_CATEGORIES)]

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search */}
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
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {categoriesList.map((cat) => {
          const config = DEBIT_CATEGORIES[cat]
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
          <p className="text-center text-bat-muted py-8 text-sm">No se encontraron movimientos.</p>
        ) : (
          filtered.map((t) => {
            const config = DEBIT_CATEGORIES[t.categoria] || DEBIT_CATEGORIES.Otros
            const isEntrada = t.esDeposito
            const isPago = t.esPagoTarjeta
            return (
              <div key={t.id} className="bat-card flex items-center justify-between group">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                  <div className="min-w-0">
                    <p className="text-sm text-bat-white truncate">{t.descripcion}</p>
                    <button
                      onClick={() => setEditingCat(editingCat === t.id ? null : t.id)}
                      className="text-xs text-bat-muted flex items-center gap-1 hover:text-bat-gold transition mt-0.5 flex-wrap"
                    >
                      {formatDate(t.fecha, true)} ·
                      <span className="font-semibold" style={{ color: config.color }}>{t.categoria}</span>
                      {t.subcategory && <span className="text-bat-muted"> · {t.subcategory}</span>}
                      <Tag className="w-3 h-3 opacity-50" />
                      {isPago && <span className="text-bat-gold">· Transferencia</span>}
                      {isEntrada && <span className="text-gym-green">· Deposito</span>}
                    </button>

                    {/* Category picker */}
                    {editingCat === t.id && (
                      <div className="mt-2 p-2 bg-bat-night rounded-xl border border-bat-border animate-slide-up">
                        <p className="bat-label mb-1.5">Categoria</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {Object.entries(DEBIT_CATEGORIES).map(([cat, cfg]) => (
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
                              {(DEBIT_CATEGORIES[pendingCat]?.subcategories || ['Otros']).map((sub) => (
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
                  <span className={`text-sm font-bold ${isEntrada ? 'text-gym-green' : 'text-gym-red'}`}>
                    {isEntrada ? '+' : '-'}{formatCurrency(t.monto)}
                  </span>
                  <button
                    onClick={() => setEditingCat(editingCat === t.id ? null : t.id)}
                    className="opacity-0 group-hover:opacity-100 text-bat-muted hover:text-bat-gold transition"
                  >
                    <Tag className="w-4 h-4" />
                  </button>
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
    </div>
  )
}

function DebitRow({ t, onDelete, showDelete }) {
  const catConfig = DEBIT_CATEGORIES[t.categoria] || DEBIT_CATEGORIES.Otros
  const isEntrada = t.esDeposito
  const isPago = t.esPagoTarjeta

  return (
    <div className="bat-card flex items-center justify-between group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: catConfig.color }}
        />
        <div className="min-w-0">
          <p className="text-sm text-bat-white truncate">{t.descripcion}</p>
          <p className="text-xs text-bat-muted flex items-center gap-1 flex-wrap mt-0.5">
            {formatDate(t.fecha, true)} ·
            <span className="font-semibold" style={{ color: catConfig.color }}>{t.categoria}</span>
            {t.subcategory && <span className="text-bat-muted"> · {t.subcategory}</span>}
            {isPago && <span className="text-bat-gold"> · Transferencia</span>}
            {isEntrada && <span className="text-gym-green"> · Deposito</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <span className={`text-sm font-bold ${isEntrada ? 'text-gym-green' : 'text-gym-red'}`}>
          {isEntrada ? '+' : '-'}{formatCurrency(t.monto)}
        </span>
        {onDelete && showDelete && (
          <button
            onClick={() => onDelete(t.id)}
            className="opacity-0 group-hover:opacity-100 text-bat-muted hover:text-gym-red transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}