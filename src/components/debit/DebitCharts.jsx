import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts'
import { formatCurrency, getMonthKey, getMonthName } from '../../utils/formatters'
import { DEBIT_CATEGORIES } from '../../constants/categories'

const TooltipStyle = {
  backgroundColor: '#15151c',
  border: '1px solid #252530',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#f0f0f5',
}

export default function DebitCharts({ transactions, allTransactions }) {
  const monthlyData = useMemo(() => {
    const byMonth = {}
    transactions.forEach((t) => {
      const key = getMonthKey(t.fecha)
      if (!byMonth[key]) byMonth[key] = { entradas: 0, salidas: 0 }
      if (t.esDeposito) byMonth[key].entradas += t.monto
      else byMonth[key].salidas += t.monto
    })
    return Object.entries(byMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, data]) => ({
        month: getMonthName(key + '-01').slice(0, 3),
        entradas: data.entradas,
        salidas: data.salidas,
      }))
  }, [allTransactions || transactions])

  const categoryData = useMemo(() => {
    const byCat = {}
    transactions.forEach((t) => {
      byCat[t.categoria] = (byCat[t.categoria] || 0) + t.monto
    })
    return Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, total]) => ({
        name: cat,
        value: total,
        color: DEBIT_CATEGORIES[cat]?.color || '#9ca3af',
      }))
  }, [transactions])

  const dailyFlow = useMemo(() => {
    const byDay = {}
    transactions.forEach((t) => {
      const day = new Date(t.fecha + 'T00:00:00').getDate()
      if (!byDay[day]) byDay[day] = { dia: day, entradas: 0, salidas: 0 }
      if (t.esDeposito) byDay[day].entradas += t.monto
      else byDay[day].salidas += t.monto
    })
    return Object.values(byDay).sort((a, b) => a.dia - b.dia)
  }, [transactions])

  const accumulatedBalance = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    let running = 0
    const byDay = {}
    sorted.forEach((t) => {
      running += t.esDeposito ? t.monto : -t.monto
      const day = new Date(t.fecha + 'T00:00:00').getDate()
      byDay[day] = running
    })
    return Object.entries(byDay)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([day, balance]) => ({ dia: parseInt(day), balance }))
  }, [transactions])

  if (monthlyData.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Monthly entradas vs salidas */}
      {monthlyData.length > 0 && (
        <div className="bat-card">
          <h3 className="font-display text-sm text-bat-muted uppercase mb-3">Entradas vs Salidas (6 meses)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252530" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6a6a7a', fontSize: 11 }} axisLine={{ stroke: '#252530' }} />
              <YAxis tick={{ fill: '#6a6a7a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={TooltipStyle}
                formatter={(v, name) => [formatCurrency(v), name === 'entradas' ? 'Entradas' : 'Salidas']}
                cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
              />
              <Bar dataKey="entradas" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="salidas" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-gym-green" />
              <span className="text-bat-silver">Entradas</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-gym-purple" />
              <span className="text-bat-silver">Salidas</span>
            </div>
          </div>
        </div>
      )}

      {/* Category pie chart */}
      {categoryData.length > 0 && (
        <div className="bat-card">
          <h3 className="font-display text-sm text-bat-muted uppercase mb-3">Por categoria</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
              >
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="#0a0a0f" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TooltipStyle}
                formatter={(v) => formatCurrency(v)}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-bat-silver">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accumulated balance trend */}
      {accumulatedBalance.length > 1 && (
        <div className="bat-card">
          <h3 className="font-display text-sm text-bat-muted uppercase mb-3">Balance acumulado del periodo</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={accumulatedBalance} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFD700" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#252530" vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: '#6a6a7a', fontSize: 10 }} axisLine={{ stroke: '#252530' }} />
              <YAxis tick={{ fill: '#6a6a7a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={TooltipStyle}
                formatter={(v) => [formatCurrency(v), 'Balance']}
                cursor={{ stroke: '#FFD700', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#FFD700" strokeWidth={2} fill="url(#balanceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}