import { useState, useMemo } from 'react'
import { Upload, LayoutDashboard, List, TrendingUp, Wallet, ChevronDown } from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { getMonthKey, getMonthName } from '../../utils/formatters'
import { EXPENSE_CATEGORIES } from '../../constants/categories'
import CSVUpload from './CSVUpload'
import ExpenseOverview from './ExpenseOverview'
import TransactionList from './TransactionList'
import Projections from './Projections'
import BatLogo from '../shared/BatLogo'

export default function ExpenseApp() {
  const [view, setView] = useState('overview')
  const [periodsData, setPeriodsData] = useLocalStorage('bat_expenses_periods', {})
  const [manualExpenses, setManualExpenses] = useLocalStorage('bat_expenses_manual', [])
  const [selectedPeriod, setSelectedPeriod] = useState(null)

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
    const keys = new Set(Object.keys(periodsData))
    manualExpenses.forEach((t) => keys.add(getMonthKey(t.fecha)))
    return [...keys].sort().reverse()
  }, [periodsData, manualExpenses])

  const activePeriod = selectedPeriod || (allPeriodKeys[0] || null)

  const allTransactions = useMemo(() => {
    const txs = []
    Object.values(periodsData).forEach((data) => txs.push(...data.transactions))
    txs.push(...manualExpenses)
    return txs
  }, [periodsData, manualExpenses])

  const periodTransactions = useMemo(() => {
    if (!activePeriod) return []
    const periodTxs = periodsData[activePeriod]?.transactions || []
    const manualTxs = manualExpenses.filter((t) => getMonthKey(t.fecha) === activePeriod)
    return [...periodTxs, ...manualTxs].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [periodsData, manualExpenses, activePeriod])

  const activePeriodLabel = useMemo(() => {
    if (!activePeriod) return null
    if (periodsData[activePeriod]?.periodLabel) return periodsData[activePeriod].periodLabel
    return getMonthName(activePeriod + '-01')
  }, [periodsData, activePeriod])

  const handleParsed = (parsedData) => {
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
  }

  const handleClearPeriod = (key) => {
    const updated = { ...periodsData }
    delete updated[key]
    setPeriodsData(updated)
  }

  const addManualExpense = (expense) => {
    setManualExpenses([
      {
        id: Date.now() + Math.random(),
        ...expense,
        source: 'manual',
      },
      ...manualExpenses,
    ])
  }

  const removeTransaction = (id) => {
    let found = false
    for (const [key, data] of Object.entries(periodsData)) {
      const filtered = data.transactions.filter((t) => t.id !== id)
      if (filtered.length !== data.transactions.length) {
        setPeriodsData({
          ...periodsData,
          [key]: { ...data, transactions: filtered },
        })
        found = true
        break
      }
    }
    if (!found) {
      setManualExpenses(manualExpenses.filter((t) => t.id !== id))
    }
  }

  const updateTransactionCategory = (id, newCategory, newSubcategory) => {
    let found = false
    for (const [key, data] of Object.entries(periodsData)) {
      const updated = data.transactions.map((t) =>
        t.id === id ? { ...t, categoria: newCategory, subcategory: newSubcategory || null } : t
      )
      if (updated.some((t) => t.id === id)) {
        setPeriodsData({
          ...periodsData,
          [key]: { ...data, transactions: updated },
        })
        found = true
        break
      }
    }
    if (!found) {
      setManualExpenses(
        manualExpenses.map((t) =>
          t.id === id ? { ...t, categoria: newCategory, subcategory: newSubcategory || null } : t
        )
      )
    }
  }

  const hasData = allTransactions.length > 0

  return (
    <div className="min-h-screen px-4 py-6 max-w-4xl mx-auto animate-fade-in">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BatLogo size={36} className="drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]" />
          <div>
            <h1 className="font-display text-2xl text-bat-gold uppercase tracking-wider">Bat Finance</h1>
            <p className="text-xs text-bat-muted">Control de gastos · Nu</p>
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
          <Upload className="w-4 h-4" /> Subir estado
        </button>
        <button
          onClick={() => setView('transactions')}
          className={`bat-btn ${view === 'transactions' ? 'bat-btn-gold' : 'bat-btn-ghost'} shrink-0`}
        >
          <List className="w-4 h-4" /> Transacciones
        </button>
        <button
          onClick={() => setView('projections')}
          className={`bat-btn ${view === 'projections' ? 'bat-btn-gold' : 'bat-btn-ghost'} shrink-0`}
        >
          <TrendingUp className="w-4 h-4" /> Proyecciones
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
                const label = periodsData[pk]?.periodLabel || getMonthName(pk + '-01')
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

      {/* Content */}
      {view === 'overview' && (
        hasData && periodTransactions.length > 0 ? (
          <ExpenseOverview
            transactions={periodTransactions}
            allTransactions={allTransactions}
            categories={EXPENSE_CATEGORIES}
            periodLabel={activePeriodLabel}
          />
        ) : (
          <div className="bat-card text-center py-12">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-bat-border" />
            <p className="text-bat-muted mb-2">No hay datos todavia.</p>
            <p className="text-bat-muted text-sm mb-4">Sube tu estado de cuenta de Nu (CSV o PDF) para empezar.</p>
            <button onClick={() => setView('upload')} className="bat-btn bat-btn-gold mx-auto">
              <Upload className="w-4 h-4" /> Subir estado
            </button>
          </div>
        )
      )}

      {view === 'upload' && (
        <CSVUpload
          onParsed={handleParsed}
          uploadedMonths={uploadedPeriods}
          onClearMonth={handleClearPeriod}
          transactions={allTransactions}
        />
      )}

      {view === 'transactions' && (
        periodTransactions.length > 0 ? (
          <TransactionList
            transactions={periodTransactions}
            categories={EXPENSE_CATEGORIES}
            onDelete={removeTransaction}
            onAddManual={addManualExpense}
            onUpdateCategory={updateTransactionCategory}
          />
        ) : (
          <div className="bat-card text-center py-12">
            <List className="w-12 h-12 mx-auto mb-4 text-bat-border" />
            <p className="text-bat-muted">No hay transacciones en este periodo.</p>
          </div>
        )
      )}

      {view === 'projections' && hasData && (
        <Projections transactions={allTransactions} categories={EXPENSE_CATEGORIES} />
      )}

      {view === 'projections' && !hasData && (
        <div className="bat-card text-center py-12">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-bat-border" />
          <p className="text-bat-muted">Necesitas datos de al menos 1 periodo para ver proyecciones.</p>
        </div>
      )}
    </div>
  )
}