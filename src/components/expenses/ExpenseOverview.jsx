import { useMemo } from 'react'
import { TrendingDown, TrendingUp, CreditCard, Banknote, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { EXPENSE_CATEGORIES, AMBITOS } from '../../constants/categories'
import ExpenseCharts from './ExpenseCharts'

export default function ExpenseOverview({ transactions, allTransactions, categories, periodLabel }) {
  const stats = useMemo(() => {
    const cargos = transactions.filter((t) => t.esCargo && !t.esAbono)
    const abonos = transactions.filter((t) => t.esAbono)

    const totalCargos = cargos.reduce((sum, t) => sum + t.monto, 0)
    const totalAbonos = abonos.reduce((sum, t) => sum + t.monto, 0)
    const neto = totalCargos - totalAbonos

    // Separar por ambito
    const personal = cargos.filter((t) => {
      const ambito = EXPENSE_CATEGORIES[t.categoria]?.ambito || 'personal'
      return ambito === 'personal'
    })
    const nexus = cargos.filter((t) => {
      const ambito = EXPENSE_CATEGORIES[t.categoria]?.ambito || 'personal'
      return ambito === 'nexus'
    })

    const totalPersonal = personal.reduce((sum, t) => sum + t.monto, 0)
    const totalNexus = nexus.reduce((sum, t) => sum + t.monto, 0)

    // Categorias por ambito (con subcategorias)
    const byCategoryPersonal = {}
    personal.forEach((t) => {
      const key = t.categoria
      if (!byCategoryPersonal[key]) byCategoryPersonal[key] = { total: 0, subs: {} }
      byCategoryPersonal[key].total += t.monto
      if (t.subcategory) {
        byCategoryPersonal[key].subs[t.subcategory] = (byCategoryPersonal[key].subs[t.subcategory] || 0) + t.monto
      }
    })
    const byCategoryNexus = {}
    nexus.forEach((t) => {
      const key = t.categoria
      if (!byCategoryNexus[key]) byCategoryNexus[key] = { total: 0, subs: {} }
      byCategoryNexus[key].total += t.monto
      if (t.subcategory) {
        byCategoryNexus[key].subs[t.subcategory] = (byCategoryNexus[key].subs[t.subcategory] || 0) + t.monto
      }
    })

    const sortedPersonal = Object.entries(byCategoryPersonal).sort((a, b) => b[1].total - a[1].total)
    const sortedNexus = Object.entries(byCategoryNexus).sort((a, b) => b[1].total - a[1].total)

    return {
      totalCargos, totalAbonos, neto,
      totalPersonal, totalNexus,
      totalCargosCount: cargos.length,
      totalAbonosCount: abonos.length,
      sortedPersonal, sortedNexus,
      recentTx: transactions.slice(0, 5),
    }
  }, [transactions])

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Period title */}
      {periodLabel && (
        <h2 className="font-display text-lg text-bat-silver uppercase">{periodLabel}</h2>
      )}

      {/* Credit vs Debit */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bat-card border-gym-red/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gym-red/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-gym-red" />
            </div>
            <span className="bat-label">Credito (gastos)</span>
          </div>
          <p className="font-display text-2xl text-gym-red">{formatCurrency(stats.totalCargos)}</p>
          <p className="text-xs text-bat-muted mt-0.5">{stats.totalCargosCount} cargos</p>
        </div>
        <div className="bat-card border-gym-green/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gym-green/10 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-gym-green" />
            </div>
            <span className="bat-label">Debito (abonos)</span>
          </div>
          <p className="font-display text-2xl text-gym-green">{formatCurrency(stats.totalAbonos)}</p>
          <p className="text-xs text-bat-muted mt-0.5">{stats.totalAbonosCount} pagos</p>
        </div>
      </div>

      {/* Net balance */}
      <div className={`bat-card bg-gradient-to-br from-bat-dark to-bat-panel ${
        stats.neto > 0 ? 'border-gym-purple/20' : 'border-gym-green/20'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="bat-label mb-1">Balance del periodo</p>
            <p className={`font-display text-3xl ${stats.neto > 0 ? 'text-gym-purple' : 'text-gym-green'}`}>
              {stats.neto > 0 ? '-' : '+'}{formatCurrency(Math.abs(stats.neto))}
            </p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
            stats.neto > 0 ? 'bg-gym-purple/10 text-gym-purple' : 'bg-gym-green/10 text-gym-green'
          }`}>
            {stats.neto > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span className="text-sm font-bold">{stats.neto > 0 ? 'Pendiente' : 'Cubierto'}</span>
          </div>
        </div>
        <p className="text-xs text-bat-muted mt-2">
          {stats.neto > 0
            ? `Se pagara en la fecha limite (dia 28-29)`
            : `Pagaste mas de lo que gastaste`}
        </p>
      </div>

      {/* Personal vs Nexus */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bat-card" style={{ borderColor: `${AMBITOS.personal.color}30` }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">👤</span>
            <span className="bat-label">Personal</span>
          </div>
          <p className="font-display text-xl text-bat-white">{formatCurrency(stats.totalPersonal)}</p>
          <p className="text-xs text-bat-muted mt-0.5">tu vida</p>
        </div>
        <div className="bat-card" style={{ borderColor: `${AMBITOS.nexus.color}30` }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🤖</span>
            <span className="bat-label">Nexus / IA</span>
          </div>
          <p className="font-display text-xl text-bat-white">{formatCurrency(stats.totalNexus)}</p>
          <p className="text-xs text-bat-muted mt-0.5">el negocio</p>
        </div>
      </div>

      {/* Charts */}
      {transactions.length > 0 && (
        <ExpenseCharts transactions={allTransactions || transactions} categories={categories} />
      )}

      {/* Personal categories */}
      {stats.sortedPersonal.length > 0 && (
        <div>
          <h3 className="font-display text-sm text-bat-muted uppercase mb-2">👤 Gasto personal por categoria</h3>
          <div className="space-y-2">
            {stats.sortedPersonal.map(([cat, data]) => {
              const config = EXPENSE_CATEGORIES[cat] || { color: '#666' }
              const amount = data.total
              const pct = stats.totalPersonal > 0 ? (amount / stats.totalPersonal * 100).toFixed(0) : 0
              const subEntries = Object.entries(data.subs || {}).sort((a, b) => b[1] - a[1])
              return (
                <div key={cat} className="bat-card">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-bat-white font-medium">{cat}</span>
                        <span className="text-sm font-bold text-bat-silver">{formatCurrency(amount)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 bg-bat-black rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: config.color }} />
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

      {/* Nexus categories */}
      {stats.sortedNexus.length > 0 && (
        <div>
          <h3 className="font-display text-sm text-bat-muted uppercase mb-2">🤖 Costos de Nexus por concepto</h3>
          <div className="space-y-2">
            {stats.sortedNexus.map(([cat, data]) => {
              const config = EXPENSE_CATEGORIES[cat] || { color: '#666' }
              const amount = data.total
              const pct = stats.totalNexus > 0 ? (amount / stats.totalNexus * 100).toFixed(0) : 0
              const subEntries = Object.entries(data.subs || {}).sort((a, b) => b[1] - a[1])
              return (
                <div key={cat} className="bat-card">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-bat-white font-medium">{cat}</span>
                        <span className="text-sm font-bold text-bat-silver">{formatCurrency(amount)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 bg-bat-black rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: config.color }} />
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
          {stats.recentTx.map((t) => {
            const config = EXPENSE_CATEGORIES[t.categoria] || { color: '#666' }
            const ambito = config.ambito || 'personal'
            return (
              <div key={t.id} className="bat-card flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                  <div className="min-w-0">
                    <p className="text-sm text-bat-white truncate">{t.descripcion}</p>
                    <p className="text-xs text-bat-muted">
                      {t.fechaOperacion && t.fechaCargo && t.fechaOperacion !== t.fechaCargo ? (
                        <span>Op: {formatDate(t.fechaOperacion, true)} · Cargo: <span className="text-bat-silver">{formatDate(t.fechaCargo, true)}</span>
                          {" · "}</span>
                      ) : (
                        <span>{formatDate(t.fecha, true)} · </span>
                      )}
                      {t.categoria}{t.subcategory && <span> · {t.subcategory}</span>}
                      {t.esAbono && <span className="text-gym-green"> · Abono</span>}
                      {ambito === 'nexus' && !t.esAbono && <span style={{ color: AMBITOS.nexus.color }}> · 🤖 Nexus</span>}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold shrink-0 ml-3 ${t.esAbono ? 'text-gym-green' : 'text-gym-red'}`}>
                  {t.esAbono ? '-' : '+'}{formatCurrency(t.monto)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}