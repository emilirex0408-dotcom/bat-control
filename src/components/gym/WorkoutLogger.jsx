import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Trash2, Minus, Check, X, Dumbbell, Copy, GripVertical, Pencil, ArrowUp, ArrowDown } from 'lucide-react'
import { EXERCISES_BY_MUSCLE, MUSCLE_COLORS } from '../../constants/exercises'
import { kgToUnit, unitToKg, unitLabel } from '../../utils/units'

const REC_RANGES = {
  Pecho: { min: 6, max: 12 },
  Espalda: { min: 6, max: 12 },
  Hombro: { min: 8, max: 15 },
  Biceps: { min: 8, max: 15 },
  Triceps: { min: 8, max: 15 },
  Pierna: { min: 6, max: 12 },
  Abdomen: { min: 12, max: 20 },
  'Brazo completo': { min: 8, max: 15 },
}

function getRecRange(muscle) {
  return REC_RANGES[muscle] || { min: 8, max: 12 }
}

export default function WorkoutLogger({ date, muscleGroups, existingWorkout, onSave, workouts, unit = 'kg' }) {
  const [exercises, setExercises] = useState(
    existingWorkout?.exercises || []
  )
  const [showAll, setShowAll] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerMuscle, setPickerMuscle] = useState(null)
  const [customExercise, setCustomExercise] = useState('')
  const [editingExIdx, setEditingExIdx] = useState(null)
  const [showReplacer, setShowReplacer] = useState(false)
  const [draggedIdx, setDraggedIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  useEffect(() => {
    if (existingWorkout?.exercises) {
      setExercises(existingWorkout.exercises)
    }
  }, [existingWorkout])

  const selectedNames = useMemo(() => new Set(exercises.map((e) => e.name)), [exercises])

  const toggleExercise = (name, muscle) => {
    if (selectedNames.has(name)) {
      setExercises(exercises.filter((e) => e.name !== name))
    } else {
      setExercises([
        ...exercises,
        {
          id: Date.now() + Math.random(),
          name,
          muscle,
          sets: [{ weight: '', reps: '', done: false }],
        },
      ])
    }
  }

  const updateSet = (exIdx, setIdx, field, value) => {
    const updated = [...exercises]
    updated[exIdx].sets[setIdx][field] = value
    setExercises(updated)
  }

  const toggleSetDone = (exIdx, setIdx) => {
    const updated = [...exercises]
    updated[exIdx].sets[setIdx].done = !updated[exIdx].sets[setIdx].done
    setExercises(updated)
  }

  const addSet = (exIdx) => {
    const updated = [...exercises]
    const lastSet = updated[exIdx].sets[updated[exIdx].sets.length - 1]
    updated[exIdx].sets.push({
      weight: lastSet?.weight || '',
      reps: lastSet?.reps || '',
      done: false,
    })
    setExercises(updated)
  }

  const removeSet = (exIdx, setIdx) => {
    const updated = [...exercises]
    updated[exIdx].sets.splice(setIdx, 1)
    if (updated[exIdx].sets.length === 0) {
      updated.splice(exIdx, 1)
    }
    setExercises(updated)
  }

  const removeExercise = (exIdx) => {
    setExercises(exercises.filter((_, i) => i !== exIdx))
  }

  const replaceExercise = (exIdx, newName, newMuscle) => {
    const updated = [...exercises]
    updated[exIdx] = { ...updated[exIdx], name: newName, muscle: newMuscle }
    setExercises(updated)
    setEditingExIdx(null)
    setShowReplacer(false)
  }

  const moveExercise = (fromIdx, toIdx) => {
    if (fromIdx === toIdx || toIdx < 0 || toIdx >= exercises.length) return
    const updated = [...exercises]
    const [moved] = updated.splice(fromIdx, 1)
    updated.splice(toIdx, 0, moved)
    setExercises(updated)
  }

  const addExercise = (name, muscle) => {
    if (selectedNames.has(name)) return
    setExercises([
      ...exercises,
      {
        id: Date.now() + Math.random(),
        name,
        muscle,
        sets: [{ weight: '', reps: '', done: false }],
      },
    ])
    setShowPicker(false)
    setPickerMuscle(null)
    setCustomExercise('')
  }

  const handleSave = () => {
    onSave({
      id: existingWorkout?.id || Date.now(),
      date,
      muscleGroups,
      exercises: exercises.filter((e) => e.sets.length > 0),
    })
  }

  const lastWeekWorkout = useMemo(() => {
    if (!workouts || workouts.length === 0) return null
    const sameDayLastWeek = workouts.find((w) => {
      const diff = new Date(date) - new Date(w.date)
      const days = diff / (1000 * 60 * 60 * 24)
      return days > 4 && days <= 10 && w.muscleGroups.some((m) => muscleGroups.includes(m))
    })
    if (sameDayLastWeek) return sameDayLastWeek
    const recent = workouts
      .filter((w) => w.muscleGroups.some((m) => muscleGroups.includes(m)))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    return recent[0] || null
  }, [workouts, date, muscleGroups])

  const copyLastWeek = () => {
    if (!lastWeekWorkout) return
    setExercises(
      lastWeekWorkout.exercises.map((e) => ({
        id: Date.now() + Math.random(),
        name: e.name,
        muscle: e.muscle,
        sets: e.sets.map((s) => ({ weight: s.weight || '', reps: '', done: false })),
      }))
    )
  }

  const handleDragStart = (idx) => {
    setDraggedIdx(idx)
  }

  const handleDragOver = (e, idx) => {
    e.preventDefault()
    setDragOverIdx(idx)
  }

  const handleDrop = (e, idx) => {
    e.preventDefault()
    if (draggedIdx !== null) {
      moveExercise(draggedIdx, idx)
    }
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  const availableExercises = pickerMuscle
    ? EXERCISES_BY_MUSCLE[pickerMuscle] || []
    : []

  const allMuscles = [...new Set([...muscleGroups, ...Object.keys(EXERCISES_BY_MUSCLE)])]

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Copy last week */}
      {lastWeekWorkout && exercises.length === 0 && (
        <div className="bat-card border-bat-gold/20 bg-gradient-to-br from-bat-dark to-bat-panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-bat-silver">Tienes un entreno similar guardado</p>
              <p className="text-xs text-bat-muted mt-0.5">
                {lastWeekWorkout.exercises.length} ejercicios · puedes copiarlo y solo cambiar pesos
              </p>
            </div>
            <button onClick={copyLastWeek} className="bat-btn bat-btn-gold shrink-0">
              <Copy className="w-4 h-4" /> Copiar
            </button>
          </div>
        </div>
      )}

      {/* Exercise pool - choose what to do today */}
      {exercises.length === 0 && showAll && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm text-bat-muted uppercase">Elige tus ejercicios de hoy</h3>
            <button onClick={() => setShowAll(false)} className="text-xs text-bat-muted">
              Ocultar lista
            </button>
          </div>
          {muscleGroups.map((muscle) => {
            const muscleExercises = EXERCISES_BY_MUSCLE[muscle] || []
            const rec = getRecRange(muscle)
            return (
              <div key={muscle} className="bat-card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MUSCLE_COLORS[muscle] }} />
                  <h4 className="font-display text-sm uppercase" style={{ color: MUSCLE_COLORS[muscle] }}>{muscle}</h4>
                  <span className="text-xs text-bat-muted ml-auto">Rec: {rec.min}-{rec.max} reps</span>
                </div>
                <div className="space-y-1">
                  {muscleExercises.map((name) => (
                    <button
                      key={name}
                      onClick={() => toggleExercise(name, muscle)}
                      className={`w-full flex items-center gap-2 text-left rounded-lg px-2 py-1.5 transition ${
                        selectedNames.has(name)
                          ? 'bg-bat-gold/10 border border-bat-gold/20'
                          : 'border border-transparent hover:bg-bat-panel'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        selectedNames.has(name) ? 'bg-bat-gold border-bat-gold' : 'border-bat-border'
                      }`}>
                        {selectedNames.has(name) && <Check className="w-3 h-3 text-bat-black" />}
                      </div>
                      <span className="text-sm text-bat-silver">{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {exercises.length === 0 && !showAll && (
        <button onClick={() => setShowAll(true)} className="w-full bat-btn bat-btn-ghost">
          <Dumbbell className="w-4 h-4" /> Ver ejercicios disponibles
        </button>
      )}

      {/* Selected exercises - draggable */}
      {exercises.map((ex, exIdx) => {
        const rec = getRecRange(ex.muscle)
        const isDragging = draggedIdx === exIdx
        const isDragOver = dragOverIdx === exIdx && draggedIdx !== null && draggedIdx !== exIdx
        return (
          <div
            key={ex.id}
            draggable
            onDragStart={() => handleDragStart(exIdx)}
            onDragOver={(e) => handleDragOver(e, exIdx)}
            onDrop={(e) => handleDrop(e, exIdx)}
            onDragEnd={handleDragEnd}
            className={`bat-card p-3 transition-all ${
              isDragging ? 'opacity-40 scale-95' : ''
            } ${
              isDragOver ? 'border-bat-gold ring-2 ring-bat-gold/30' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <GripVertical className="w-4 h-4 text-bat-muted shrink-0 cursor-grab" />
                <div className="min-w-0">
                  <h3 className="font-bold text-bat-white truncate">{ex.name}</h3>
                  <span className="text-xs" style={{ color: MUSCLE_COLORS[ex.muscle] }}>{ex.muscle}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setEditingExIdx(exIdx); setShowReplacer(true) }}
                  className="text-bat-muted hover:text-bat-gold transition p-1"
                  title="Cambiar ejercicio"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveExercise(exIdx, exIdx - 1)}
                  disabled={exIdx === 0}
                  className="text-bat-muted hover:text-bat-silver transition p-1 disabled:opacity-30"
                  title="Subir"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveExercise(exIdx, exIdx + 1)}
                  disabled={exIdx === exercises.length - 1}
                  className="text-bat-muted hover:text-bat-silver transition p-1 disabled:opacity-30"
                  title="Bajar"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => removeExercise(exIdx)}
                  className="text-bat-muted hover:text-gym-purple transition p-1"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-xs text-bat-muted mb-2 flex items-center gap-2">
              <span className="bg-bat-night px-2 py-0.5 rounded-md border border-bat-border">
                Rec: {rec.min}-{rec.max} reps
              </span>
              <span>(apuntar a hipertrofia)</span>
            </div>

            <div className="flex gap-2 mb-2 items-center px-1">
              <span className="bat-label w-6 text-center shrink-0">#</span>
              <span className="bat-label flex-1 text-center">{unitLabel(unit)}</span>
              <span className="bat-label flex-1 text-center">Reps</span>
              <span className="bat-label w-10 text-center shrink-0">Done</span>
              <span className="w-8 shrink-0"></span>
            </div>

            {ex.sets.map((set, setIdx) => (
              <div key={setIdx} className="flex gap-2 mb-2 items-center">
                <span className="w-6 text-center text-bat-muted text-sm font-bold shrink-0">{setIdx + 1}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={set.weight !== '' && set.weight != null ? (unit === 'lb' ? kgToUnit(set.weight, 'lb').toFixed(1) : set.weight) : ''}
                  onChange={(e) => {
                    const v = e.target.value
                    updateSet(exIdx, setIdx, 'weight', v === '' ? '' : unitToKg(v, unit))
                  }}
                  className="bat-input flex-1 text-center text-lg font-bold py-3 min-h-[48px]"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={String(rec.min)}
                  value={set.reps}
                  onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                  className={`bat-input flex-1 text-center text-lg font-bold py-3 min-h-[48px] ${
                    set.reps && (parseInt(set.reps) < rec.min || parseInt(set.reps) > rec.max)
                      ? 'border-gym-purple/30'
                      : ''
                  }`}
                />
                <button
                  onClick={() => toggleSetDone(exIdx, setIdx)}
                  className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition ${
                    set.done
                      ? 'bg-gym-green/15 text-gym-green border border-gym-green/30'
                      : 'bg-bat-night text-bat-muted border border-bat-border'
                  }`}
                >
                  {set.done ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => removeSet(exIdx, setIdx)}
                  className="w-8 h-10 shrink-0 rounded-xl bg-bat-night border border-bat-border text-bat-muted hover:text-gym-purple hover:border-gym-purple/30 flex items-center justify-center transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              onClick={() => addSet(exIdx)}
              className="mt-2 w-full bat-btn bat-btn-ghost py-1.5 text-xs"
            >
              <Plus className="w-3 h-3" /> Agregar set
            </button>
          </div>
        )
      })}

      {/* Add custom exercise */}
      <button
        onClick={() => setShowPicker(true)}
        className="w-full bat-btn bat-btn-ghost"
      >
        <Plus className="w-4 h-4" /> Agregar ejercicio personalizado
      </button>

      {/* Save button */}
      {exercises.length > 0 && (
        <button onClick={handleSave} className="w-full bat-btn bat-btn-gold">
          <Check className="w-4 h-4" /> Guardar entrenamiento
        </button>
      )}

      {/* Exercise picker modal (add new) */}
      {showPicker && (
        <div
          className="fixed inset-0 bg-bat-black/90 z-[60] flex items-end md:items-center justify-center p-4 animate-fade-in"
          onClick={() => { setShowPicker(false); setPickerMuscle(null) }}
        >
          <div
            className="bg-bat-dark border border-bat-border rounded-3xl w-full max-w-md p-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {!pickerMuscle ? (
              <>
                <h3 className="font-display text-xl text-bat-gold uppercase mb-4">Selecciona musculo</h3>
                <div className="grid grid-cols-2 gap-2">
                  {muscleGroups.map((muscle) => (
                    <button
                      key={muscle}
                      onClick={() => setPickerMuscle(muscle)}
                      className="bat-btn bat-btn-ghost"
                    >
                      {muscle}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl text-bat-gold uppercase">{pickerMuscle}</h3>
                  <button onClick={() => setPickerMuscle(null)} className="text-bat-muted hover:text-bat-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-1.5 mb-4">
                  {availableExercises.map((name) => (
                    <button
                      key={name}
                      onClick={() => addExercise(name, pickerMuscle)}
                      className="w-full text-left bat-card bat-card-hover py-2.5 px-3 text-sm"
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div className="border-t border-bat-border pt-3">
                  <p className="bat-label mb-2">Ejercicio personalizado</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customExercise}
                      onChange={(e) => setCustomExercise(e.target.value)}
                      placeholder="Nombre del ejercicio"
                      className="bat-input flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customExercise.trim()) {
                          addExercise(customExercise.trim(), pickerMuscle)
                        }
                      }}
                    />
                    <button
                      onClick={() => customExercise.trim() && addExercise(customExercise.trim(), pickerMuscle)}
                      className="bat-btn bat-btn-gold px-3"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Exercise replacer modal */}
      {showReplacer && editingExIdx !== null && (
        <ExerciseReplacer
          exercises={exercises}
          exIdx={editingExIdx}
          onReplace={replaceExercise}
          onClose={() => { setShowReplacer(false); setEditingExIdx(null) }}
        />
      )}
    </div>
  )
}

function ExerciseReplacer({ exercises, exIdx, onReplace, onClose }) {
  const currentEx = exercises[exIdx]
  const [pickerMuscle, setPickerMuscle] = useState(currentEx?.muscle || null)
  const [customName, setCustomName] = useState('')

  if (!currentEx) return null

  const availableExercises = pickerMuscle
    ? EXERCISES_BY_MUSCLE[pickerMuscle] || []
    : []

  return (
    <div
      className="fixed inset-0 bg-bat-black/90 z-[60] flex items-end md:items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-bat-dark border border-bat-border rounded-3xl w-full max-w-md p-5 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-lg text-bat-gold uppercase">Cambiar ejercicio</h3>
          <button onClick={onClose} className="text-bat-muted hover:text-bat-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-bat-muted mb-4">
          Actual: <span className="text-bat-white font-bold">{currentEx.name}</span>
          <span className="ml-1" style={{ color: MUSCLE_COLORS[currentEx.muscle] }}>({currentEx.muscle})</span>
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.keys(EXERCISES_BY_MUSCLE).map((muscle) => (
            <button
              key={muscle}
              onClick={() => setPickerMuscle(muscle)}
              className={`bat-badge transition ${
                pickerMuscle === muscle
                  ? 'text-bat-black font-bold'
                  : 'bg-bat-panel text-bat-muted border border-bat-border'
              }`}
              style={pickerMuscle === muscle ? { backgroundColor: MUSCLE_COLORS[muscle] } : {}}
            >
              {muscle}
            </button>
          ))}
        </div>

        {pickerMuscle && (
          <div className="space-y-1.5 mb-4">
            {availableExercises.map((name) => (
              <button
                key={name}
                onClick={() => onReplace(exIdx, name, pickerMuscle)}
                className={`w-full text-left bat-card bat-card-hover py-2.5 px-3 text-sm transition ${
                  name === currentEx.name ? 'opacity-50' : ''
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-bat-border pt-3">
          <p className="bat-label mb-2">Nombre personalizado</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Escribe el nombre..."
              className="bat-input flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customName.trim()) {
                  onReplace(exIdx, customName.trim(), pickerMuscle || currentEx.muscle)
                }
              }}
            />
            <button
              onClick={() => customName.trim() && onReplace(exIdx, customName.trim(), pickerMuscle || currentEx.muscle)}
              className="bat-btn bat-btn-gold px-3"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}