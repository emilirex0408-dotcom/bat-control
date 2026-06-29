export const EXPENSE_CATEGORIES = {
  Diversión: {
    color: '#ec4899',
    icon: 'party-popper',
    ambito: 'personal',
    keywords: ['cine', 'teatro', 'concierto', 'ant', 'bar ', 'billar', 'bowling', 'evento', 'steam', 'steamgames', 'juego', 'game', 'xbox', 'playstation', 'twitch'],
    subcategories: ['Salidas con amigos', 'Juegos', 'Cine', 'Eventos', 'Streaming entretenimiento', 'Otros'],
  },
  'Nexus / IA': {
    color: '#06b6d4',
    icon: 'cpu',
    ambito: 'nexus',
    keywords: ['vercel', 'render', 'openai', 'anthropic', 'claude', 'gpt', 'digitalocean', 'github', 'namecheap', 'docker', 'dominio', 'hosting', 'aws', 'google cloud', 'supabase', 'elevenlabs', 'fal ', 'fal.ai', 'anomaly', 'canvastoolkit', 'microsoft store', 'apple.com/bill', 'stripe', 'railway', 'neon', 'planetscale'],
    subcategories: ['Hosting/Infra', 'IA APIs', 'Dominios', 'Herramientas dev', 'Suscripciones tech', 'Otros'],
  },
  Comida: {
    color: '#f59e0b',
    icon: 'utensils',
    ambito: 'personal',
    keywords: ['restaurante', 'starbucks', 'mcdonalds', 'burger', 'tacos', 'sushi', 'pizza', 'cafe', 'oxxo', '7-eleven', 'comida', 'diner', 'antoj', 'quekas', 'mercadopago', 'clip mx*rest', 'clip mx*abarr', 'groshi', 'guacamol', 'rodizio', 'rest ', 'restaurante', 'panissimo', 'club boca', 'market cafe'],
    subcategories: ['Oxxo/Conveniencia', 'Restaurante', 'Antojos', 'Super', 'Comida con amigos', 'Café', 'Otros'],
  },
  Transporte: {
    color: '#3b82f6',
    icon: 'car',
    ambito: 'personal',
    keywords: ['uber', 'did', 'gasolina', 'peaje', 'estacionamiento', 'metro', 'camion', 'taxi', 'rapipass', 'pago tag', 't1 telcel'],
    subcategories: ['Uber/Ride', 'Gasolina', 'Peaje', 'Transporte público', 'Teléfono', 'Otros'],
  },
  'Gym / Salud': {
    color: '#10b981',
    icon: 'dumbbell',
    ambito: 'personal',
    keywords: ['farmacia', 'medico', 'dentista', 'gym', 'fitnes', 'suplement', 'vitamina', 'clinica', 'consult', 'salud'],
    subcategories: ['Membresía gym', 'Suplementos', 'Consulta médica', 'Farmacia', 'Otros'],
  },
  Educación: {
    color: '#f97316',
    icon: 'book-open',
    ambito: 'personal',
    keywords: ['udemy', 'coursera', 'platzi', 'universi', 'curso', 'libro', 'escolar'],
    subcategories: ['Cursos online', 'Libros', 'Universidad', 'Otros'],
  },
  Otros: {
    color: '#9ca3af',
    icon: 'more-horizontal',
    ambito: 'personal',
    keywords: [],
    subcategories: ['Personal', 'Regalos', 'Hogar', 'Otros'],
  },
}

export const CATEGORY_NAMES = {
  diversion: 'Diversión',
  nexus: 'Nexus / IA',
  comida: 'Comida',
  transporte: 'Transporte',
  salud: 'Gym / Salud',
  educacion: 'Educación',
  otros: 'Otros',
}

export const CATEGORY_EMOJIS = {
  diversion: '🎉',
  nexus: '🤖',
  comida: '🍔',
  transporte: '🚗',
  salud: '💪',
  educacion: '📚',
  otros: '📦',
}

export const AMBITOS = {
  personal: { label: 'Personal', icon: '👤', color: '#8b5cf6' },
  nexus: { label: 'Nexus', icon: '🏢', color: '#06b6d4' },
}

export const DEBIT_CATEGORIES = {
  Deposito: {
    color: '#10b981',
    icon: 'arrow-down-circle',
    label: 'Depósito (entrada)',
    subcategories: ['Papá', 'Familia', 'Cliente', 'Reembolso', 'Otros'],
  },
  Transferencia: {
    color: '#3b82f6',
    icon: 'repeat',
    label: 'Transferencia interna',
    subcategories: ['Pago a crédito', 'A amigos', 'Otros'],
  },
  Gasto: {
    color: '#ef4444',
    icon: 'arrow-up-circle',
    label: 'Gasto de débito',
    subcategories: ['Compra', 'Transferencia enviada', 'Otros'],
  },
  Otros: {
    color: '#9ca3af',
    icon: 'more-horizontal',
    label: 'Otros',
    subcategories: ['Otros'],
  },
}