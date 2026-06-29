import { Trash2, Dumbbell, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { formatDate } from '../../utils/formatters'
import { MUSCLE_COLORS } from '../../constants/exercises'
import { kgToUnit, unitLabel, setVolume, formatSetLine } from '../../utils/units'

export default function WorkoutHistory({ workouts, onDelete, muscleColors, unit = 'kg' }) {
  const [expanded, setExpanded] = useState(null)

  if (workouts.length === 0) {
    return (
      <div className="bat-card text-center py-12 animate-fade-in">
        <Dumbbell className="w-12 h-12 mx-auto mb-4 text-bat-border" />
        <p className="text-bat-muted">No hay entrenamientos registrados.</p>
        <p className="text-bat-muted text-sm mt-1">Empeza logueando el de hoy.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {workouts.map((w) => {
        const totalVolume = w.exercises.reduce(
          (sum, e) => sum + e.sets.reduce((s, set) => s + setVolume(set), 0),
          0
        )
        const totalVolumeDisplay = totalVolume ? kgToUnit(totalVolume, unit) : 0
        const volumeUnit = unitLabel(unit)
        const totalSets = w.exercises.reduce((sum, e) => sum + e.sets.length, 0)

        return (
          <div key={w.id} className="bat-card overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === w.id ? null : w.id)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display text-bat-white">{formatDate(w.date)}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {w.muscleGroups.map((m) => (
                    <span
                      key={m}
                      className="bat-badge text-white"
                      style={{ backgroundColor: (muscleColors || MUSCLE_COLORS)[m] || '#666' }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <p className="text-xs text-bat-muted">{totalSets} sets</p>
                  <p className="text-sm font-bold text-bat-gold">{(totalVolumeDisplay / 1000).toFixed(1)}k {volumeUnit}</p>
                </div>
                {expanded === w.id ? <ChevronDown className="w-5 h-5 text-bat-muted" /> : <ChevronRight className="w-5 h-5 text-bat-muted" />}
              </div>
            </button>

            {expanded === w.id && (
              <div className="mt-4 pt-4 border-t border-bat-border space-y-2">
                {w.exercises.map((ex) => (
                  <div key={ex.id} className="bg-bat-night rounded-xl p-2.5">
                    <p className="font-semibold text-bat-white text-sm">{ex.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {ex.sets.map((set, i) => (
                        <span key={i} className="text-xs bg-bat-panel px-2 py-0.5 rounded-md text-bat-silver">
                          {formatSetLine(set, unit)}
                        </span>
                      ))}
                    </div>
                    {ex.notes && (
                      <p className="text-xs text-bat-muted mt-1.5 italic border-l-2 border-bat-gold/30 pl-2">
                        {ex.notes}
                      </p>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => onDelete(w.id)}
                  className="w-full bat-btn bat-btn-danger mt-2"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}