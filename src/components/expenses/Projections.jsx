import { useMemo } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Target, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import { formatCurrency, getMonthKey, getMonthName } from '../../utils/formatters'
import { EXPENSE_CATEGORIES } from '../../constants/categories'

const TooltipStyle = {
  backgroundColor: '#15151c',
  border: '1px solid #252530',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#f0f0f5',
}

export default function Projections({ transactions, categories }) {
  const analysis = useMemo(() => {
    const monthlyTotals = {}
    const monthlyByCategory = {}

    transactions.forEach((t) => {
      const key = getMonthKey(t.fecha)
      monthlyTotals[key] = (monthlyTotals[key] || 0) + t.monto
      if (!monthlyByCategory[key]) monthlyByCategory[key] = {}
      monthlyByCategory[key][t.categoria] = (monthlyByCategory[key][t.categoria] || 0) + t.monto
    })

    const months = Object.keys(monthlyTotals).sort()
    const last3Months = months.slice(-3)

    const last3Total = last3Months.reduce((sum, m) => sum + monthlyTotals[m], 0)
    const last3Avg = last3Months.length > 0 ? last3Total / last3Months.length : 0

    const prev3Months = months.slice(-6, -3)
    const prev3Avg = prev3Months.length > 0
      ? prev3Months.reduce((sum, m) => sum + monthlyTotals[m], 0) / prev3Months.length
      : 0

    const trendChange = prev3Avg > 0 ? ((last3Avg - prev3Avg) / prev3Avg * 100) : 0

    const projectNextMonth = last3Avg
    const annualProjection = last3Avg * 12

    const categoryTrends = {}
    last3Months.forEach((m) => {
      Object.entries(monthlyByCategory[m] || {}).forEach(([cat, amount]) => {
        if (!categoryTrends[cat]) categoryTrends[cat] = []
        categoryTrends[cat].push(amount)
      })
    })

    const categoryProjections = Object.entries(categoryTrends)
      .map(([cat, amounts]) => {
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
        const first = amounts[0]
        const last = amounts[amounts.length - 1]
        const change = first > 0 ? ((last - first) / first * 100) : 0
        return {
          category: cat,
          avgPerMonth: avg,
          trend: change,
          color: EXPENSE_CATEGORIES[cat]?.color || '#666',
          isWarning: change > 20,
        }
      })
      .sort((a, b) => b.avgPerMonth - a.avgPerMonth)
      .slice(0, 6)

    const chartData = months.slice(-6).map((m) => ({
      month: getMonthName(m + '-01').slice(0, 3),
      actual: monthlyTotals[m],
    }))
    chartData.push({
      month: 'Proy.',
      actual: null,
      projected: projectNextMonth,
    })

    return {
      last3Avg,
      trendChange,
      projectNextMonth,
      annualProjection,
      categoryProjections,
      chartData,
      monthsWithData: months.length,
    }
  }, [transactions])

  if (analysis.monthsWithData === 0) return null

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Main projection */}
      <div className={`bat-card ${analysis.trendChange > 15 ? 'border-gym-red/30' : 'border-bat-gold/20'} bg-gradient-to-br from-bat-dark to-bat-panel`}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="bat-label mb-1">Proyeccion del proximo mes</p>
            <p className="font-display text-3xl text-bat-gold">{formatCurrency(analysis.projectNextMonth)}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
            analysis.trendChange > 0 ? 'bg-gym-red/10' : 'bg-gym-green/10'
          }`}>
            {analysis.trendChange > 0 ? (
              <ArrowUpRight className="w-4 h-4 text-gym-red" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-gym-green" />
            )}
            <span className={`text-sm font-bold ${analysis.trendChange > 0 ? 'text-gym-red' : 'text-gym-green'}`}>
              {analysis.trendChange > 0 ? '+' : ''}{analysis.trendChange.toFixed(1)}%
            </span>
          </div>
        </div>
        <p className="text-xs text-bat-muted">
          Basado en el promedio de los ultimos 3 meses
        </p>
        {analysis.trendChange > 15 && (
          <div className="mt-3 flex items-center gap-2 text-gym-red text-xs">
            <AlertTriangle className="w-4 h-4" />
            Tus gastos estan subiendo. Revisa las categorias abajo.
          </div>
        )}
      </div>

      {/* Annual projection */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bat-card text-center">
          <Calendar className="w-5 h-5 text-bat-muted mx-auto mb-1" />
          <p className="bat-label">Proyeccion anual</p>
          <p className="font-display text-xl text-bat-white">{formatCurrency(analysis.annualProjection)}</p>
        </div>
        <div className="bat-card text-center">
          <Target className="w-5 h-5 text-bat-muted mx-auto mb-1" />
          <p className="bat-label">Promedio mensual</p>
          <p className="font-display text-xl text-bat-white">{formatCurrency(analysis.last3Avg)}</p>
        </div>
      </div>

      {/* Chart */}
      {analysis.chartData.length > 1 && (
        <div className="bat-card">
          <h3 className="font-display text-sm text-bat-muted uppercase mb-3">Historial y proyeccion</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analysis.chartData} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252530" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6a6a7a', fontSize: 11 }} axisLine={{ stroke: '#252530' }} />
              <YAxis tick={{ fill: '#6a6a7a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={TooltipStyle}
                formatter={(v) => [formatCurrency(v), '']}
                cursor={{ fill: 'rgba(255, 215, 0, 0.05)' }}
              />
              <Bar dataKey="actual" fill="#FFD700" radius={[6, 6, 0, 0]} />
              <Bar dataKey="projected" fill="#FFD700" fillOpacity={0.3} radius={[6, 6, 0, 0]} stroke="#FFD700" strokeDasharray="4 4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category breakdown */}
      <div>
        <h3 className="font-display text-sm text-bat-muted uppercase mb-2">Tendencia por categoria</h3>
        <div className="space-y-2">
          {analysis.categoryProjections.map((c) => (
            <div key={c.category} className="bat-card">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm text-bat-white font-medium">{c.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-bat-silver">{formatCurrency(c.avgPerMonth)}</span>
                  <span className={`text-xs font-bold ${c.trend > 0 ? 'text-gym-red' : 'text-gym-green'}`}>
                    {c.trend > 0 ? '↑' : '↓'} {Math.abs(c.trend).toFixed(0)}%
                  </span>
                </div>
              </div>
              {c.isWarning && (
                <div className="flex items-center gap-1 text-gym-red text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  Creciendo rapido
                </div>
              )}
              <div className="mt-2 h-1.5 bg-bat-black rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, (c.avgPerMonth / analysis.last3Avg) * 100)}%`, backgroundColor: c.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insight */}
      <div className="bat-card bg-gradient-to-br from-bat-dark to-bat-panel border-bat-gold/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-bat-gold/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-bat-gold" />
          </div>
          <div>
            <p className="text-sm text-bat-silver mb-1">
              {analysis.trendChange > 15
                ? `Tus gastos han subido ${analysis.trendChange.toFixed(0)}% respecto al trimestre anterior. Focus en las categorias que mas crecen.`
                : `Tus gastos estan ${analysis.trendChange > 0 ? 'subiendo' : 'bajando'} un ${Math.abs(analysis.trendChange).toFixed(0)}%. Vas bien.`
              }
            </p>
            {analysis.annualProjection > 0 && (
              <p className="text-xs text-bat-muted">
                A este ritmo gastaras {formatCurrency(analysis.annualProjection)} este ano.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}