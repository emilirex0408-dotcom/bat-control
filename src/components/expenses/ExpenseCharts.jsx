import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts'
import { formatCurrency, getMonthKey, getMonthName } from '../../utils/formatters'
import { EXPENSE_CATEGORIES } from '../../constants/categories'

const TooltipStyle = {
  backgroundColor: '#15151c',
  border: '1px solid #252530',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#f0f0f5',
}

export default function ExpenseCharts({ transactions, categories }) {
  const monthlyData = useMemo(() => {
    const byMonth = {}
    transactions.forEach((t) => {
      const key = getMonthKey(t.fecha)
      byMonth[key] = (byMonth[key] || 0) + t.monto
    })
    return Object.entries(byMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, total]) => ({
        month: getMonthName(key + '-01').slice(0, 3),
        total,
      }))
  }, [transactions])

  const categoryData = useMemo(() => {
    const byCat = {}
    const currentMonth = getMonthKey(new Date().toISOString().split('T')[0])
    transactions
      .filter((t) => getMonthKey(t.fecha) === currentMonth)
      .forEach((t) => {
        byCat[t.categoria] = (byCat[t.categoria] || 0) + t.monto
      })
    return Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, total]) => ({
        name: cat,
        value: total,
        color: EXPENSE_CATEGORIES[cat]?.color || '#666',
      }))
  }, [transactions])

  const dailyTrend = useMemo(() => {
    const currentMonth = getMonthKey(new Date().toISOString().split('T')[0])
    const byDay = {}
    transactions
      .filter((t) => getMonthKey(t.fecha) === currentMonth)
      .forEach((t) => {
        byDay[t.fecha] = (byDay[t.fecha] || 0) + t.monto
      })
    return Object.entries(byDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({
        day: new Date(date + 'T00:00:00').getDate(),
        total,
      }))
  }, [transactions])

  if (monthlyData.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Monthly bar chart */}
      {monthlyData.length > 0 && (
        <div className="bat-card">
          <h3 className="font-display text-sm text-bat-muted uppercase mb-3">Gasto mensual (6 meses)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252530" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6a6a7a', fontSize: 11 }} axisLine={{ stroke: '#252530' }} />
              <YAxis tick={{ fill: '#6a6a7a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={TooltipStyle}
                formatter={(v) => [formatCurrency(v), 'Gasto total']}
                cursor={{ fill: 'rgba(255, 215, 0, 0.05)' }}
              />
              <Bar dataKey="total" fill="#FFD700" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category pie chart */}
      {categoryData.length > 0 && (
        <div className="bat-card">
          <h3 className="font-display text-sm text-bat-muted uppercase mb-3">Por categoria (este mes)</h3>
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
          <div className="flex flex-wrap gap-2 mt-2">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-bat-silver">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily trend */}
      {dailyTrend.length > 1 && (
        <div className="bat-card">
          <h3 className="font-display text-sm text-bat-muted uppercase mb-3">Tendencia diaria (este mes)</h3>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={dailyTrend} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFD700" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#252530" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#6a6a7a', fontSize: 10 }} axisLine={{ stroke: '#252530' }} />
              <YAxis tick={{ fill: '#6a6a7a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={TooltipStyle}
                formatter={(v) => [formatCurrency(v), 'Gasto']}
                cursor={{ stroke: '#FFD700', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area type="monotone" dataKey="total" stroke="#FFD700" strokeWidth={2} fill="url(#goldGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}