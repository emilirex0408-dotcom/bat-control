import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import { categorizeTransaction } from './categorizer'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

const MONTHS = {
  ENE: 1, FEB: 2, MAR: 3, ABR: 4, MAY: 5, JUN: 6,
  JUL: 7, AGO: 8, SEP: 9, OCT: 10, NOV: 11, DIC: 12,
  ENERO: 1, FEBRERO: 2, MARZO: 3, ABRIL: 4, MAYO: 5, JUNIO: 6,
  JULIO: 7, AGOSTO: 8, SEPTIEMBRE: 9, OCTUBRE: 10, NOVIEMBRE: 11, DICIEMBRE: 12,
}

export async function parseNuPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    let pageText = ''
    let lastY = null
    for (const item of content.items) {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        pageText += '\n'
      } else if (pageText && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
        pageText += ' '
      }
      pageText += item.str
      lastY = item.transform[5]
    }
    fullText += pageText + '\n'
  }

  const isDebit = detectDebit(fullText)
  if (isDebit) {
    return extractDebitTransactions(fullText)
  }
  return extractTransactions(fullText)
}

function detectDebit(text) {
  return text.includes('Detalle de movimientos en tu cuenta') ||
    text.includes('Cuenta Nu:') ||
    text.includes('MONTO EN PESOS MEXICANOS')
}

function detectPeriod(text) {
  const lines = text.split('\n').map((l) => l.trim())

  let periodLabel = null
  let monthKey = null
  let startDate = null
  let endDate = null
  let periodYear = null

  for (const line of lines) {
    const periodoAlMatch = line.match(/periodo:\s*(\d{1,2})\s+([A-Z]{3})\s+(\d{4})\s+al\s+(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/i)
    if (periodoAlMatch) {
      const [, d1, m1, y1, d2, m2, y2] = periodoAlMatch
      const mon1 = MONTHS[m1.toUpperCase()]
      const mon2 = MONTHS[m2.toUpperCase()]
      if (mon1 && mon2) {
        startDate = `${y1}-${String(mon1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`
        endDate = `${y2}-${String(mon2).padStart(2, '0')}-${String(d2).padStart(2, '0')}`
        periodLabel = `${d1} ${m1} ${y1} al ${d2} ${m2} ${y2}`
        monthKey = `${y2}-${String(mon2).padStart(2, '0')}`
        periodYear = parseInt(y2)
        break
      }
    }

    const periodoDashMatch = line.match(/periodo:\s*(\d{1,2})\s+([A-Z]{3})\s+(\d{4})\s*[-\u2013]\s*(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/i)
    if (periodoDashMatch) {
      const [, d1, m1, y1, d2, m2, y2] = periodoDashMatch
      const mon1 = MONTHS[m1.toUpperCase()]
      const mon2 = MONTHS[m2.toUpperCase()]
      if (mon1 && mon2) {
        startDate = `${y1}-${String(mon1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`
        endDate = `${y2}-${String(mon2).padStart(2, '0')}-${String(d2).padStart(2, '0')}`
        periodLabel = `${d1} ${m1} ${y1} al ${d2} ${m2} ${y2}`
        monthKey = `${y2}-${String(mon2).padStart(2, '0')}`
        periodYear = parseInt(y2)
        break
      }
    }
  }

  if (!monthKey) {
    for (const line of lines) {
      const estadoMatch = line.toLowerCase().match(/estado de cuenta de\s+([a-záéíóú]+)/i)
      if (estadoMatch) {
        const cleanMonth = estadoMatch[1].toUpperCase().substring(0, 3)
        const month = MONTHS[cleanMonth]
        if (month) {
          monthKey = `${new Date().getFullYear()}-${String(month).padStart(2, '0')}`
          periodLabel = estadoMatch[1]
          periodYear = new Date().getFullYear()
          break
        }
      }
    }
  }

  if (!monthKey) {
    const now = new Date()
    monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    periodLabel = 'Periodo actual'
    periodYear = now.getFullYear()
  }

  return { monthKey, periodLabel, startDate, endDate, periodYear }
}

function extractTransactions(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  const hasNewFormat = lines.some((l) => /TRANSACCIONES\s+DE/i.test(l))
  const hasOldFormat = lines.some((l) => l.toUpperCase().includes('CARGOS, ABONOS Y COMPRAS REGULARES'))

  let transactions = []

  if (hasNewFormat) {
    transactions = parseNewFormat(lines)
  }

  if (hasOldFormat && transactions.length === 0) {
    transactions = parseOldFormat(lines)
  }

  const period = detectPeriod(text)

  transactions.forEach((t) => {
    if (!t.fecha || t.fecha.startsWith('undefined')) {
      if (period.endDate) {
        t.fecha = period.endDate
      } else {
        const now = new Date()
        t.fecha = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      }
    }
    t.monthKey = period.monthKey
  })

  return { period, transactions }
}

function detectDebitPeriod(text) {
  const lines = text.split('\n').map((l) => l.trim())

  let periodLabel = null
  let monthKey = null
  let startDate = null
  let endDate = null

  for (const line of lines) {
    const match = line.match(/periodo:\s*del\s+(\d{1,2})\s+al\s+(\d{1,2})\s+([a-záéíóú]+)\s+(\d{4})/i)
    if (match) {
      const [, d1, d2, monthStr, year] = match
      const month = MONTHS[monthStr.toUpperCase().substring(0, 3)] || MONTHS[monthStr.toUpperCase()]
      if (month) {
        const y = parseInt(year)
        startDate = `${y}-${String(month).padStart(2, '0')}-${String(d1).padStart(2, '0')}`
        endDate = `${y}-${String(month).padStart(2, '0')}-${String(d2).padStart(2, '0')}`
        const monthAbbr = Object.keys(MONTHS).find((k) => MONTHS[k] === month && k.length === 3)
        periodLabel = `${d1} ${monthAbbr} ${y} al ${d2} ${monthAbbr} ${y}`
        monthKey = `${y}-${String(month).padStart(2, '0')}`
        break
      }
    }
  }

  if (!monthKey) {
    for (const line of lines) {
      const estadoMatch = line.toLowerCase().match(/estado de cuenta\s+de\s+([a-záéíóú]+)/i)
      if (estadoMatch) {
        const cleanMonth = estadoMatch[1].toUpperCase().substring(0, 3)
        const month = MONTHS[cleanMonth]
        if (month) {
          monthKey = `${new Date().getFullYear()}-${String(month).padStart(2, '0')}`
          periodLabel = estadoMatch[1]
          break
        }
      }
    }
  }

  if (!monthKey) {
    const now = new Date()
    monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    periodLabel = 'Periodo actual'
  }

  return { monthKey, periodLabel, startDate, endDate }
}

function extractDebitTransactions(text) {
  const rawLines = text.split('\n')
  const lines = []

  for (let i = 0; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim()
    if (!trimmed) continue
    const incompleteDate = trimmed.match(/^(\d{1,2})\s+([A-Z]{3})$/i)
    if (incompleteDate && i + 1 < rawLines.length) {
      const nextTrim = rawLines[i + 1].trim()
      if (/^\d{4}$/.test(nextTrim)) {
        lines.push(`${trimmed} ${nextTrim}`)
        i++
        continue
      }
    }
    lines.push(trimmed)
  }

  const period = detectDebitPeriod(text)

  return { period, transactions: parseDebitFormat(lines, period) }
}

function parseDebitFormat(lines, period) {
  const transactions = []

  const startIdx = lines.findIndex((l) => l.toUpperCase().includes('DETALLE DE MOVIMIENTOS'))
  if (startIdx === -1) return []

  const endMarkers = [
    'Con estos movimientos', 'DINERO GENERADO', 'CONTACTO',
    'COMPROBANTE FISCAL', 'GLOSARIO', 'Sello digital',
  ]

  const skipPatterns = [
    /^FECHA\s+DEL/i, /^MONTO EN PESOS/i,
    /^Emiliano Morales/i, /^Cuenta Nu:/i, /^Nu México/i,
    /^\d+ de \d+$/i, /^Periodo:/i, /^Saldo/i,
    /^Depósitos/i, /^Gastos/i, /^Comisiones/i,
    /^Dinero generado/i, /^Cómo está/i, /^En su Cuenta/i,
    /^En Cajitas/i, /^Total Cajitas/i, /^Disponible/i,
    /^Congelado/i, /^Si solo tienes/i, /^Este es/i,
    /^Detalle de movimientos/i,
  ]

  const isDetailLine = (line) => {
    return /^(Depósito SPEI|Transferencia SPEI|Clave de rastreo|Clave de referencia|De la cuenta|A la cuenta|por concepto|Dato no verificado|Abono \(con cuenta)/i.test(line)
  }

  const dateFullRegex = /^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/i

  let pendingDate = null
  let pendingDesc = []

  const flushTransaction = (dateStr, descLines) => {
    const description = descLines.join(' ').replace(/\s+/g, ' ').trim()
    if (!description) return null
    const lastPart = description.match(/([+-])\$?([\d,]+\.?\d*)$/)
    if (!lastPart) return null
    const sign = lastPart[1]
    const amount = parseFloat(lastPart[2].replace(/,/g, ''))
    if (isNaN(amount) || amount <= 0) return null

    const cleanDesc = description.replace(/\s*[+-]?\$?[\d,]+\.?\d*\s*$/, '').trim()
    const esTarjeta = /Pago a tu tarjeta de crédito/i.test(cleanDesc)
    const esDeposito = sign === '+'

    return {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      fecha: dateStr,
      fechaOperacion: dateStr,
      fechaCargo: dateStr,
      descripcion: esTarjeta ? 'Pago a tarjeta de crédito Nu' : cleanDesc,
      monto: amount,
      esCargo: !esDeposito,
      esAbono: esDeposito,
      esDeposito,
      esPagoTarjeta: esTarjeta,
      categoria: esTarjeta ? 'Transferencia' : (esDeposito ? 'Deposito' : categorizeTransaction(cleanDesc.toLowerCase())),
      source: 'pdf',
      account: 'debit',
    }
  }

  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i]

    if (endMarkers.some((m) => line.toUpperCase().includes(m.toUpperCase()))) break
    if (skipPatterns.some((p) => p.test(line))) continue
    if (isDetailLine(line)) continue

    const parts = line.split(/\s{2,}|\t/).map((p) => p.trim()).filter(Boolean)
    if (parts.length === 0) continue

    const firstPart = parts[0]
    const datePart = parseDatePart(firstPart)
    const isIncompleteDate = firstPart.match(/^(\d{1,2})\s+([A-Z]{3})$/i) && i + 1 < lines.length && /^\d{4}$/.test(lines[i + 1].trim())

    if (isIncompleteDate) {
      const fullDateStr = `${firstPart} ${lines[i + 1].trim()}`
      const dateP = parseDatePart(fullDateStr)
      if (dateP) {
        if (pendingDate) {
          if (pendingDesc.length > 0) {
            const tx = flushTransaction(pendingDate, pendingDesc)
            if (tx) transactions.push(tx)
          }
        }
        pendingDate = dateP.iso
        pendingDesc = parts.length > 1 ? parts.slice(1) : []
        i++
        continue
      }
    }

    if (datePart) {
      if (pendingDate && pendingDesc.length > 0) {
        const tx = flushTransaction(pendingDate, pendingDesc)
        if (tx) transactions.push(tx)
      }
      pendingDate = datePart.iso

      if (parts.length === 1) {
        pendingDesc = []
      } else {
        const lastPart = parts[parts.length - 1]
        const moneyMatch = lastPart.match(/^([+-])\$?([\d,]+\.?\d*)$/)
        if (moneyMatch) {
          const descParts = parts.slice(1, -1)
          const combined = [...descParts, `${moneyMatch[1]}$${moneyMatch[2]}`]
          const tx = flushTransaction(datePart.iso, combined)
          if (tx) transactions.push(tx)
          pendingDate = null
          pendingDesc = []
        } else if (lastPart.match(/^-?\$?[\d,]+\.?\d*$/)) {
          const sign = parts[1].includes('-') || lastPart.includes('-') ? '-' : '+'
          pendingDesc = [...parts.slice(1, -1), `${sign}$${lastPart.replace(/^[-+]?\$?/, '')}`]
          const tx = flushTransaction(datePart.iso, pendingDesc)
          if (tx) transactions.push(tx)
          pendingDate = null
          pendingDesc = []
        } else {
          pendingDesc = parts.slice(1)
        }
      }
      continue
    }

    const standaloneAmount = line.match(/^([+-])\$?([\d,]+\.?\d*)$/)
    if (standaloneAmount && pendingDate) {
      pendingDesc.push(`${standaloneAmount[1]}$${standaloneAmount[2]}`)
      const tx = flushTransaction(pendingDate, pendingDesc)
      if (tx) transactions.push(tx)
      pendingDate = null
      pendingDesc = []
      continue
    }

    if (pendingDate) {
      const lastPart = parts[parts.length - 1]
      const moneyMatch = lastPart.match(/^([+-])\$?([\d,]+\.?\d*)$/)
      if (moneyMatch && parts.length >= 2) {
        const partsDesc = parts.slice(0, -1)
        pendingDesc.push(...partsDesc)
        pendingDesc.push(`${moneyMatch[1]}$${moneyMatch[2]}`)
        const tx = flushTransaction(pendingDate, pendingDesc)
        if (tx) transactions.push(tx)
        pendingDate = null
        pendingDesc = []
        continue
      }

      pendingDesc.push(line)
    }
  }

  if (pendingDate && pendingDesc.length > 0) {
    const tx = flushTransaction(pendingDate, pendingDesc)
    if (tx) transactions.push(tx)
  }

  transactions.forEach((t) => {
    t.monthKey = period.monthKey
  })

  return transactions
}

function parseDatePart(str) {
  const match = str.match(/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/i)
  if (!match) return null
  const [, d, m, y] = match
  const month = MONTHS[m.toUpperCase()]
  if (!month) return null
  return {
    iso: `${y}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    day: parseInt(d),
    monthStr: m.toUpperCase(),
    month,
    year: parseInt(y),
  }
}

function parseNewFormat(lines) {
  const transactions = []

  const startIdx = lines.findIndex((l) => /TRANSACCIONES\s+DE/i.test(l))
  if (startIdx === -1) return []

  const endMarkers = ['Saldo final', 'INFORMACION', 'CONTACTO', 'GLOSARIO']

  const dateRegex = /^(\d{1,2})\s+([A-Z]{3})$/i
  const nuCategories = ['Supermercado', 'Hogar', 'Electr\xf3nicos', 'Electrónicos', 'Restaurante', 'Servicio', 'Otros', 'Transporte', 'Salud', 'Entretenimiento', 'Ropa']

  let inSection = false

  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i]

    if (endMarkers.some((m) => line.toUpperCase().includes(m.toUpperCase()))) break

    const parts = line.split(/\s{2,}|\t/).map((p) => p.trim()).filter(Boolean)

    if (parts.length === 0) continue

    const firstParts = parts[0].split(/\s+/)
    const dateMatch = `${firstParts[0]} ${firstParts[1]}`.match(dateRegex)

    if (dateMatch) {
      const day = parseInt(dateMatch[1])
      const monthStr = dateMatch[2].toUpperCase()
      let month = MONTHS[monthStr]

      let fechaCargo = null
      let fechaCargoStr = ''
      let descStart = 1

      if (month) {
        if (parts.length >= 2) {
          const datePart2 = parseDatePart(parts[1])
          if (datePart2) {
            fechaCargo = datePart2
            fechaCargoStr = datePart2.iso
            descStart = 2
          }
        }

        let description = ''
        let amount = null
        let isAbono = false

        const remainingParts = parts.slice(descStart)

        if (remainingParts.length >= 2) {
          const lastPart = remainingParts[remainingParts.length - 1].trim()
          const moneyMatch = lastPart.match(/^-?\s*\$?([\d,]+\.?\d*)$/)

          if (moneyMatch) {
            amount = parseFloat(moneyMatch[1].replace(/,/g, ''))
            isAbono = lastPart.includes('-')

            let descParts = remainingParts.slice(0, -1)
            description = descParts.join(' ').trim()
          }
        } else if (remainingParts.length === 1) {
          const lastPart = remainingParts[0]
          const moneyMatch = lastPart.match(/^(.+?)\s+(-\s*)?\$?([\d,]+\.?\d*)$/)

          if (moneyMatch) {
            description = moneyMatch[1].replace(/\s+/g, ' ').trim()
            amount = parseFloat(moneyMatch[3].replace(/,/g, ''))
            isAbono = !!moneyMatch[2]
          }
        }

        if (description && amount !== null && amount > 0) {
          const nuCategoryMatch = nuCategories.find((cat) =>
            description.toLowerCase().startsWith(cat.toLowerCase())
          )

          if (nuCategoryMatch) {
            description = description.substring(nuCategoryMatch.length).trim()
          }

          const opYear = new Date().getFullYear()
          const fechaOperacionStr = `${opYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

          transactions.push({
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            fecha: fechaCargoStr || fechaOperacionStr,
            fechaOperacion: fechaOperacionStr,
            fechaCargo: fechaCargoStr || fechaOperacionStr,
            descripcion: description,
            monto: amount,
            esCargo: !isAbono,
            esAbono: isAbono,
            categoria: categorizeTransaction(description.toLowerCase()),
            source: 'pdf',
          })
        }
      }
    }

    if (!inSection && dateMatch) inSection = true
  }

  return transactions
}

function parseOldFormat(lines) {
  const transactions = []

  const startIdx = lines.findIndex((l) =>
    l.toUpperCase().includes('CARGOS, ABONOS Y COMPRAS REGULARES') ||
    l.toUpperCase().includes('COMPRAS Y CARGOS REGULARES')
  )
  if (startIdx === -1) return []

  const endMarkers = ['Total de cargos', 'Total de abonos', 'ATENCI', 'GLOSARIO DE T', 'DISTRIBUCION DE']

  const skipPrefixes = [
    'Notas:',
    'Número de tarjeta',
    'Página',
    'CARGOS, ABONOS',
    'COMPRAS Y CARGOS REGULARES',
    'Tarjeta titular',
    'Fecha de la',
    'operación',
    'Cambio (',
    'Tarjeta virtual',
    'Abono (con cuenta',
    'M.N.',
  ]

  let i = startIdx + 1

  while (i < lines.length) {
    const line = lines[i]

    if (endMarkers.some((m) => line.toUpperCase().includes(m.toUpperCase()))) break

    const shouldSkip = skipPrefixes.some((p) =>
      line.toUpperCase().startsWith(p.toUpperCase()) || line.toUpperCase().includes(p.toUpperCase())
    )
    if (shouldSkip) { i++; continue }

    const parts = line.split(/\s{2,}|\t/).map((p) => p.trim()).filter(Boolean)

    if (parts.length >= 4) {
      const fechaOp = parseDatePart(parts[0])
      const fechaCargo = parseDatePart(parts[1])

      if (fechaOp && fechaCargo) {
        const lastPart = parts[parts.length - 1].trim()
        const moneyMatch = lastPart.match(/^([+-])\$?([\d,]+\.?\d*)$/)

        if (moneyMatch) {
          const sign = moneyMatch[1]
          const amount = parseFloat(moneyMatch[2].replace(/,/g, ''))

          if (!isNaN(amount) && amount > 0) {
            let descParts = parts.slice(2, -1)

            let description = descParts.join(' ').trim()
            description = description
              .replace(/Tarjeta virtual\s+\*+/g, '')
              .replace(/\| RFC:.*$/g, '')
              .replace(/\s+/g, ' ')
              .trim()

            if (description.length > 0) {
              transactions.push({
                id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                fecha: fechaCargo.iso,
                fechaOperacion: fechaOp.iso,
                fechaCargo: fechaCargo.iso,
                descripcion: description,
                monto: amount,
                esCargo: sign === '+',
                esAbono: sign === '-',
                categoria: categorizeTransaction(description.toLowerCase()),
                source: 'pdf',
              })
            }
          }
        }
      }
    }

    i++
  }

  return transactions
}