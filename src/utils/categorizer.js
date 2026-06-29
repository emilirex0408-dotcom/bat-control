import { EXPENSE_CATEGORIES } from '../constants/categories'

export function categorizeTransaction(description) {
  const desc = description.toLowerCase()
  for (const [category, config] of Object.entries(EXPENSE_CATEGORIES)) {
    if (config.keywords.some((kw) => desc.includes(kw))) {
      return category
    }
  }
  return 'Otros'
}

export function getAmbito(categoria) {
  return EXPENSE_CATEGORIES[categoria]?.ambito || 'personal'
}