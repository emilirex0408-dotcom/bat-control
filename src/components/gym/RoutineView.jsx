import { ROUTINE, MUSCLE_COLORS, EXERCISES_BY_MUSCLE } from '../../constants/exercises'

export default function RoutineView() {
  const days = Object.entries(ROUTINE).filter(([k]) => k !== '0' && k !== '6')
  const weekend = [ROUTINE[0], ROUTINE[6]]

  return (
    <div className="space-y-3 animate-fade-in">
      {days.map(([key, routine]) => (
        <div key={key} className="bat-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-bat-gold uppercase">{routine.dia}</h3>
            <div className="flex items-center gap-1.5">
              {routine.grupos.map((m) => (
                <span
                  key={m}
                  className="bat-badge text-white"
                  style={{ backgroundColor: MUSCLE_COLORS[m] || '#666' }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            {routine.grupos.flatMap((muscle) =>
              (EXERCISES_BY_MUSCLE[muscle] || []).slice(0, 4).map((ex) => (
                <div key={ex} className="flex items-center gap-2 text-sm text-bat-silver">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MUSCLE_COLORS[muscle] }} />
                  {ex}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
      {weekend.map((routine) => (
        <div key={routine.dia} className="bat-card opacity-50">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg text-bat-muted uppercase">{routine.dia}</h3>
            <span className="text-xs text-bat-muted">Descanso</span>
          </div>
        </div>
      ))}
    </div>
  )
}