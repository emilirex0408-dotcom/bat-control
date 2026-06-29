import { useState, useMemo, useEffect } from 'react'
import { Flame, Calendar, ClipboardList, TrendingUp, Plus, Check } from 'lucide-react'
import { ROUTINE, MUSCLE_COLORS } from '../../constants/exercises'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { getDayOfWeek, getTodayStr } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'
import { kgToUnit, unitLabel } from '../../utils/units'
import WorkoutLogger from './WorkoutLogger'
import WorkoutHistory from './WorkoutHistory'
import RoutineView from './RoutineView'
import BatLogo from '../shared/BatLogo'

export default function GymApp() {
  const { currentUser } = useAuth()
  const [view, setView] = useState('today')
  const storageKey = `bat_gym_workouts_${currentUser.id}`

  const [workouts, setWorkouts] = useLocalStorage(storageKey, [])

  useEffect(() => {
    const legacy = localStorage.getItem('bat_gym_workouts')
    if (legacy && currentUser.id === 'emiliano') {
      try {
        const parsed = JSON.parse(legacy)
        if (Array.isArray(parsed) && parsed.length > 0 && !localStorage.getItem(storageKey)) {
          setWorkouts(parsed)
        }
      } catch {}
    }
  }, [storageKey, currentUser.id, setWorkouts])

  const unit = currentUser.unit || 'kg'

  const today = getDayOfWeek()
  const todayRoutine = ROUTINE[today]
  const todayStr = getTodayStr()

  const todaysWorkout = useMemo(
    () => workouts.find((w) => w.date === todayStr),
    [workouts, todayStr]
  )

  const stats = useMemo(() => {
    const totalWorkouts = workouts.length
    const totalVolumeKg = workouts.reduce((sum, w) => {
      return sum + w.exercises.reduce((s, e) => {
        return s + e.sets.reduce((ss, set) => ss + (Number(set.weight) * Number(set.reps) || 0), 0)
      }, 0)
    }, 0)
    const totalVolume = kgToUnit(totalVolumeKg, unit)

    const last7 = workouts.filter((w) => {
      const d = new Date(w.date)
      return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000
    })

    const muscleGroups = new Set()
    workouts.forEach((w) => w.muscleGroups.forEach((m) => muscleGroups.add(m)))

    return { totalWorkouts, totalVolume, last7Count: last7.length, musclesTrained: muscleGroups.size }
  }, [workouts])

  const saveWorkout = (workout) => {
    const existing = workouts.findIndex((w) => w.date === workout.date)
    if (existing !== -1) {
      const updated = [...workouts]
      updated[existing] = workout
      setWorkouts(updated)
    } else {
      setWorkouts([workout, ...workouts])
    }
    setView('history')
  }

  const deleteWorkout = (id) => {
    setWorkouts(workouts.filter((w) => w.id !== id))
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BatLogo size={36} className="drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]" />
          <div>
            <h1 className="font-display text-2xl text-bat-gold uppercase tracking-wider">Bat Gym</h1>
            <p className="text-xs text-bat-muted">Control de entrenamientos</p>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bat-card flex flex-col items-center text-center">
          <Flame className="w-5 h-5 text-gym-orange mb-1" />
          <span className="font-display text-2xl text-bat-white">{stats.last7Count}</span>
          <span className="text-[10px] text-bat-muted uppercase">Esta semana</span>
        </div>
        <div className="bat-card flex flex-col items-center text-center">
          <TrendingUp className="w-5 h-5 text-gym-green mb-1" />
          <span className="font-display text-2xl text-bat-white">
            {(stats.totalVolume / 1000).toFixed(1)}k
          </span>
          <span className="text-[10px] text-bat-muted uppercase">Volumen {unitLabel(unit)} total</span>
        </div>
        <div className="bat-card flex flex-col items-center text-center">
          <Check className="w-5 h-5 text-bat-gold mb-1" />
          <span className="font-display text-2xl text-bat-white">{stats.totalWorkouts}</span>
          <span className="text-[10px] text-bat-muted uppercase">Entrenos totales</span>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setView('today')}
          className={`bat-btn ${view === 'today' ? 'bat-btn-gold' : 'bat-btn-ghost'} shrink-0`}
        >
          <Calendar className="w-4 h-4" /> Hoy
        </button>
        <button
          onClick={() => setView('history')}
          className={`bat-btn ${view === 'history' ? 'bat-btn-gold' : 'bat-btn-ghost'} shrink-0`}
        >
          <ClipboardList className="w-4 h-4" /> Historial
        </button>
        <button
          onClick={() => setView('routine')}
          className={`bat-btn ${view === 'routine' ? 'bat-btn-gold' : 'bat-btn-ghost'} shrink-0`}
        >
          <Plus className="w-4 h-4" /> Rutina
        </button>
      </div>

      {/* Views */}
      {view === 'today' && (
        <div className="animate-slide-up">
          <div className="mb-4">
            <h2 className="font-display text-xl text-bat-white uppercase">{todayRoutine.dia}</h2>
            <p className="text-sm text-bat-muted">
              {todayRoutine.grupos.length > 0
                ? todayRoutine.grupos.join(' · ')
                : 'Dia de descanso'}
            </p>
          </div>

          {todayRoutine.grupos.length > 0 ? (
            <WorkoutLogger
              date={todayStr}
              muscleGroups={todayRoutine.grupos}
              existingWorkout={todaysWorkout}
              onSave={saveWorkout}
              workouts={workouts}
              unit={unit}
            />
          ) : (
            <div className="bat-card text-center py-12">
              <BatLogo size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-bat-muted">Hoy es descanso. Recuperate que mañana se entrena.</p>
            </div>
          )}
        </div>
      )}

      {view === 'history' && (
        <WorkoutHistory
          workouts={workouts}
          onDelete={deleteWorkout}
          muscleColors={MUSCLE_COLORS}
          unit={unit}
        />
      )}

      {view === 'routine' && <RoutineView />}
    </div>
  )
}