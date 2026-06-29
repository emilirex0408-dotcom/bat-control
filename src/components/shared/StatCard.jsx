export default function StatCard({ icon: Icon, label, value, sublabel, color = '#FFD700' }) {
  return (
    <div className="bat-card flex items-center gap-3 min-w-0">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
      >
        {Icon && <Icon className="w-6 h-6" style={{ color }} />}
      </div>
      <div className="min-w-0">
        <p className="bat-label truncate">{label}</p>
        <p className="text-xl font-bold text-bat-white font-display truncate">{value}</p>
        {sublabel && <p className="text-xs text-bat-muted truncate">{sublabel}</p>}
      </div>
    </div>
  )
}