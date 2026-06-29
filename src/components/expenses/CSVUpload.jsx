import { useState } from 'react'
import { Upload, FileText, Check, Trash2, AlertCircle, Calendar } from 'lucide-react'
import { parseNuCSV } from '../../utils/csvParser'
import { parseNuPDF } from '../../utils/pdfParser'
import { formatCurrency, formatDate } from '../../utils/formatters'

export default function CSVUpload({ onParsed, uploadedMonths, onClearMonth, transactions }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [parsedData, setParsedData] = useState(null)

  const handleFile = async (file) => {
    setError(null)
    setLoading(true)
    try {
      const ext = file.name.toLowerCase().split('.').pop()
      let result

      if (ext === 'csv') {
        result = await parseNuCSV(file)
      } else if (ext === 'pdf') {
        result = await parseNuPDF(file)
      } else {
        throw new Error('Solo se aceptan archivos CSV o PDF')
      }

      const txs = result.transactions || result
      if (!txs || txs.length === 0) {
        throw new Error('No se encontraron transacciones en el archivo')
      }

      setParsedData({ period: result.period, transactions: txs })
    } catch (e) {
      setError(e.message || 'Error al procesar el archivo')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    onParsed(parsedData)
    setParsedData(null)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Uploaded months */}
      {uploadedMonths && uploadedMonths.length > 0 && (
        <div>
          <h3 className="bat-label mb-2">Meses cargados</h3>
          <div className="space-y-1.5">
            {uploadedMonths.map((m) => (
              <div key={m.key} className="bat-card flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-bat-gold" />
                  <span className="text-sm text-bat-white">{m.periodLabel}</span>
                  <span className="text-xs text-bat-muted">· {m.count} transacciones</span>
                </div>
                <button
                  onClick={() => onClearMonth(m.key)}
                  className="text-bat-muted hover:text-gym-red transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false)
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
        }}
        className={`bat-card border-2 border-dashed transition-all ${
          dragging ? 'border-bat-gold bg-bat-gold/5' : 'border-bat-border'
        } py-12 text-center`}
      >
        <Upload className={`w-12 h-12 mx-auto mb-3 ${dragging ? 'text-bat-gold' : 'text-bat-muted'}`} />
        <p className="text-bat-white font-semibold mb-1">
          {loading ? 'Procesando...' : 'Arrastra tu CSV o PDF aqui'}
        </p>
        <p className="text-xs text-bat-muted mb-4">
          Descargalo desde la app de Nu: Tarjeta {'>'} Estados de cuenta {'>'} Descargar
        </p>
        <label className="bat-btn bat-btn-gold cursor-pointer inline-flex">
          <Upload className="w-4 h-4" />
          {loading ? 'Procesando...' : 'Seleccionar archivo'}
          <input
            type="file"
            accept=".csv,.pdf"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="bat-card border-gym-red/20 flex items-center gap-2 text-gym-red text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Preview */}
      {parsedData && (
        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg text-bat-gold uppercase">
                {parsedData.transactions.length} transacciones
              </h3>
              {parsedData.period && (
                <p className="text-xs text-bat-muted">
                  Periodo: {parsedData.period.periodLabel || parsedData.period.monthKey}
                </p>
              )}
            </div>
            <button onClick={handleConfirm} className="bat-btn bat-btn-gold">
              <Check className="w-4 h-4" /> Guardar mes
            </button>
          </div>
          <div className="bat-card p-0 overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {parsedData.transactions.slice(0, 50).map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-2.5 border-b border-bat-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-bat-white truncate">{t.descripcion}</p>
                    <p className="text-xs text-bat-muted">
                      {formatDate(t.fecha)} · {t.categoria}
                      {t.esAbono && <span className="text-gym-green"> · Abono</span>}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ml-3 ${t.esAbono ? 'text-gym-green' : 'text-gym-red'}`}>
                    {t.esAbono ? '-' : '+'}{formatCurrency(t.monto)}
                  </span>
                </div>
              ))}
              {parsedData.transactions.length > 50 && (
                <p className="text-center text-xs text-bat-muted py-2">
                  +{parsedData.transactions.length - 50} mas...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help */}
      <div className="bat-card text-sm text-bat-muted">
        <p className="font-semibold text-bat-silver mb-1">Como obtener tu estado de cuenta de Nu:</p>
        <p>1. Abre la app de Nu</p>
        <p>2. Ve a tu Tarjeta de credito</p>
        <p>3. Toca "Estados de cuenta"</p>
        <p>4. Descarga el archivo (CSV o PDF)</p>
        <p className="mt-2 text-xs">El archivo se procesa 100% en tu navegador. Nada se sube a internet. Cada mes se guarda por separado.</p>
      </div>
    </div>
  )
}