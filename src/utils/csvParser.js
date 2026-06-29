import Papa from 'papaparse'
import { categorizeTransaction } from './categorizer'

export async function parseNuCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const transactions = results.data
          .map((row) => {
            const keys = Object.keys(row).map((k) => k?.toLowerCase().trim())
            const raw = Object.values(row)

            const findKey = (names) => {
              const realKeys = Object.keys(row)
              for (const name of names) {
                const idx = keys.indexOf(name)
                if (idx !== -1) return realKeys[idx]
              }
              return null
            }

            const fechaKey = findKey(['fecha', 'date'])
            const descKey = findKey(['titulo', 'descripcion', 'description', 'detalle', 'title', 'merchant'])
            const montoKey = findKey(['monto', 'amount', 'valor'])

            if (!fechaKey && !descKey && !montoKey) return null

            const fechaStr = raw[Object.keys(row).indexOf(fechaKey)] || ''
            const desc = raw[Object.keys(row).indexOf(descKey)] || ''
            const montoStr = raw[Object.keys(row).indexOf(montoKey)] || '0'

            let fecha = null
            if (fechaStr) {
              const parts = String(fechaStr).split(/[\/\-.]/)
              if (parts.length === 3) {
                const [d, m, y] = parts.map(Number)
                const year = y < 100 ? 2000 + y : y
                fecha = new Date(year, m - 1, d)
              } else {
                const parsed = new Date(fechaStr)
                if (!isNaN(parsed)) fecha = parsed
              }
            }

            const monto = parseFloat(String(montoStr).replace(/[$,\s]/g, '')) || 0

            return {
              id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
              fecha: fecha ? fecha.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              descripcion: String(desc).trim(),
              monto: Math.abs(monto),
              esCargo: monto < 0 || monto > 0,
              categoria: categorizeTransaction(String(desc).toLowerCase()),
              source: 'csv',
            }
          })
          .filter((t) => t && t.descripcion)

        let monthKey = null
        if (transactions.length > 0 && transactions[0].fecha) {
          monthKey = transactions[0].fecha.substring(0, 7)
        }
        if (!monthKey) {
          const now = new Date()
          monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        }

        resolve({
          period: { monthKey, month: parseInt(monthKey.substring(5, 7)), year: parseInt(monthKey.substring(0, 4)) },
          transactions,
        })
      },
      error: (err) => reject(err),
    })
  })
}