// Données simulées pour les centres d'intérêt

export interface Interest {
  id: string
  name: string
  description: string
  icon: string
  category: 'nature' | 'culture' | 'adventure' | 'relaxation' | 'gastronomy' | 'photography'
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  pack_count?: number
}

export const mockInterests: Interest[] = [
  {
    id: 'int-nature-wildlife',
    name: 'Faune sauvage',
    description: 'Observation et découverte de la faune endémique de Madagascar',
    icon: '🦎',
    category: 'nature',
    status: 'active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    pack_count: 8
  },
  {
    id: 'int-nature-flora',
    name: 'Flore tropicale',
    description: 'Découverte de la végétation unique de Madagascar',
    icon: '🌿',
    category: 'nature',
    status: 'active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    pack_count: 6
  },
  {
    id: 'int-culture-traditions',
    name: 'Traditions locales',
    description: 'Immersion dans les coutumes et traditions malgaches',
    icon: '🎭',
    category: 'culture',
    status: 'active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    pack_count: 5
  },
  {
    id: 'int-culture-history',
    name: 'Histoire',
    description: 'Sites historiques et patrimoine culturel',
    icon: '🏛️',
    category: 'culture',
    status: 'active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    pack_count: 4
  },
  {
    id: 'int-adventure-hiking',
    name: 'Randonnée',
    description: 'Trekking et randonnées dans les paysages variés',
    icon: '🥾',
    category: 'adventure',
    status: 'active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    pack_count: 12
  },
  {
    id: 'int-adventure-climbing',
    name: 'Escalade',
    description: 'Escalade des formations rocheuses uniques',
    icon: '🧗',
    category: 'adventure',
    status: 'active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    pack_count: 3
  },
  {
    id: 'int-relaxation-beach',
    name: 'Plages paradisiaques',
    description: 'Détente sur les plus belles plages de l\'océan Indien',
    icon: '🏖️',
    category: 'relaxation',
    status: 'active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    pack_count: 7
  },
  {
    id: 'int-relaxation-spa',
    name: 'Bien-être & Spa',
    description: 'Soins traditionnels et moments de relaxation',
    icon: '🧘',
    category: 'relaxation',
    status: 'active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    pack_count: 2
  },
  {
    id: 'int-gastronomy-local',
    name: 'Cuisine locale',
    description: 'Découverte de la gastronomie malgache authentique',
    icon: '🍽️',
    category: 'gastronomy',
    status: 'active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    pack_count: 6
  },
  {
    id: 'int-gastronomy-markets',
    name: 'Marchés locaux',
    description: 'Visite des marchés traditionnels et produits locaux',
    icon: '🛒',
    category: 'gastronomy',
    status: 'active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    pack_count: 4
  },
  {
    id: 'int-photography-landscape',
    name: 'Photographie de paysages',
    description: 'Capture des paysages spectaculaires de Madagascar',
    icon: '📸',
    category: 'photography',
    status: 'active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    pack_count: 9
  },
  {
    id: 'int-photography-wildlife',
    name: 'Photographie animalière',
    description: 'Photographie de la faune endémique',
    icon: '📷',
    category: 'photography',
    status: 'active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    pack_count: 5
  }
]

export const interestCategories = [
  { id: 'nature', name: 'Nature', icon: '🌿', color: 'bg-green-100 text-green-800' },
  { id: 'culture', name: 'Culture', icon: '🎭', color: 'bg-purple-100 text-purple-800' },
  { id: 'adventure', name: 'Aventure', icon: '🏔️', color: 'bg-orange-100 text-orange-800' },
  { id: 'relaxation', name: 'Relaxation', icon: '🧘', color: 'bg-blue-100 text-blue-800' },
  { id: 'gastronomy', name: 'Gastronomie', icon: '🍽️', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'photography', name: 'Photographie', icon: '📸', color: 'bg-pink-100 text-pink-800' }
]

// Fonction pour obtenir les centres d'intérêt par catégorie
export function getInterestsByCategory(category: string) {
  return mockInterests.filter(interest => interest.category === category && interest.status === 'active')
}

// Fonction pour obtenir tous les centres d'intérêt actifs
export function getActiveInterests() {
  return mockInterests.filter(interest => interest.status === 'active')
}

// Fonction pour associer des centres d'intérêt à un pack
export function getPackInterests(pack: any): string[] {
  const interests: string[] = []
  
  // Logique d'association basée sur le titre, description et catégorie
  const title = (pack.title || '').toLowerCase()
  const description = (pack.description || '').toLowerCase()
  
  // Nature et faune
  if (title.includes('lemur') || title.includes('andasibe') || description.includes('faune')) {
    interests.push('int-nature-wildlife')
  }
  
  if (title.includes('tsingy') || title.includes('baobab') || description.includes('flore')) {
    interests.push('int-nature-flora')
  }
  
  // Culture
  if (title.includes('tradition') || description.includes('culture') || description.includes('village')) {
    interests.push('int-culture-traditions')
  }
  
  if (title.includes('historique') || description.includes('histoire') || description.includes('patrimoine')) {
    interests.push('int-culture-history')
  }
  
  // Aventure
  if (pack.difficulty_level === 'hard' || title.includes('trek') || description.includes('randonnée')) {
    interests.push('int-adventure-hiking')
  }
  
  if (title.includes('escalade') || description.includes('climbing') || title.includes('tsingy')) {
    interests.push('int-adventure-climbing')
  }
  
  // Relaxation
  if (title.includes('nosy be') || title.includes('plage') || description.includes('beach')) {
    interests.push('int-relaxation-beach')
  }
  
  if (title.includes('spa') || description.includes('bien-être') || description.includes('détente')) {
    interests.push('int-relaxation-spa')
  }
  
  // Gastronomie
  if (description.includes('cuisine') || description.includes('gastronomie') || description.includes('repas')) {
    interests.push('int-gastronomy-local')
  }
  
  if (description.includes('marché') || description.includes('produits locaux')) {
    interests.push('int-gastronomy-markets')
  }
  
  // Photographie
  if (description.includes('photo') || title.includes('découverte') || pack.category_id === 'cat-nature') {
    interests.push('int-photography-landscape')
  }
  
  if (title.includes('safari') || description.includes('observation')) {
    interests.push('int-photography-wildlife')
  }
  
  return [...new Set(interests)] // Éliminer les doublons
}

// Fonction pour obtenir les centres d'intérêt d'un utilisateur (simulé)
export function getUserInterests(userId: string): string[] {
  // Simuler des centres d'intérêt selon l'utilisateur
  const userInterestsMap: Record<string, string[]> = {
    'user-demo-traveler': ['int-nature-wildlife', 'int-adventure-hiking', 'int-photography-landscape'],
    'user-demo-admin': ['int-culture-traditions', 'int-gastronomy-local', 'int-relaxation-beach'],
    // Centres d'intérêt par défaut pour les nouveaux utilisateurs
    default: ['int-nature-wildlife', 'int-photography-landscape']
  }
  
  return userInterestsMap[userId] || userInterestsMap.default
}

// Fonction pour recommander des packs basés sur les centres d'intérêt
export function getRecommendedPacks(userInterests: string[], allPacks: any[]): any[] {
  if (userInterests.length === 0) return allPacks.slice(0, 6)
  
  // Scorer les packs selon les centres d'intérêt de l'utilisateur
  const scoredPacks = allPacks.map(pack => {
    const packInterests = getPackInterests(pack)
    const matchCount = packInterests.filter(interest => userInterests.includes(interest)).length
    const score = matchCount / Math.max(packInterests.length, 1) // Score de correspondance
    
    return {
      ...pack,
      recommendationScore: score,
      matchingInterests: packInterests.filter(interest => userInterests.includes(interest))
    }
  })
  
  // Trier par score de correspondance et prendre les 6 meilleurs
  return scoredPacks
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 6)
}