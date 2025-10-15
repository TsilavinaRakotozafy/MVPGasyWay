/**
 * Base de données centralisée des pays avec codes téléphoniques
 * Source: ITU-T E.164 + données actualisées 2024
 */

export interface PhoneCountry {
  code: string
  country: string
  flag: string
  iso: string
  minDigits: number
  maxDigits: number
  format?: string
  priority?: number // Pour les pays prioritaires dans la recherche
}

/**
 * Liste complète des pays avec validation moderne
 * Organisée par priorité : Madagascar, pays francophones, destinations touristiques, puis ordre alphabétique
 */
export const phoneCountries: PhoneCountry[] = [
  // 🇲🇬 PRIORITÉ 1 : Madagascar (pays principal)
  { code: '+261', country: 'Madagascar', flag: '🇲🇬', iso: 'MG', minDigits: 9, maxDigits: 9, format: 'XX XX XXX XX', priority: 1 },
  
  // 🇫🇷 PRIORITÉ 2 : Pays francophones (marché principal)
  { code: '+33', country: 'France', flag: '🇫🇷', iso: 'FR', minDigits: 10, maxDigits: 10, format: 'XX XX XX XX XX', priority: 2 },
  { code: '+32', country: 'Belgique', flag: '🇧🇪', iso: 'BE', minDigits: 9, maxDigits: 9, priority: 2 },
  { code: '+41', country: 'Suisse', flag: '🇨🇭', iso: 'CH', minDigits: 9, maxDigits: 9, priority: 2 },
  { code: '+1', country: 'Canada', flag: '🇨🇦', iso: 'CA', minDigits: 10, maxDigits: 10, format: '(XXX) XXX-XXXX', priority: 2 },
  
  // 🌍 PRIORITÉ 3 : Océan Indien & Afrique (proximité géographique)
  { code: '+230', country: 'Maurice', flag: '🇲🇺', iso: 'MU', minDigits: 8, maxDigits: 8, priority: 3 },
  { code: '+248', country: 'Seychelles', flag: '🇸🇨', iso: 'SC', minDigits: 7, maxDigits: 7, priority: 3 },
  { code: '+262', country: 'Réunion', flag: '🇷🇪', iso: 'RE', minDigits: 10, maxDigits: 10, priority: 3 },
  { code: '+269', country: 'Comores', flag: '🇰🇲', iso: 'KM', minDigits: 7, maxDigits: 7, priority: 3 },
  { code: '+27', country: 'Afrique du Sud', flag: '🇿🇦', iso: 'ZA', minDigits: 9, maxDigits: 9, priority: 3 },
  { code: '+254', country: 'Kenya', flag: '🇰🇪', iso: 'KE', minDigits: 9, maxDigits: 9, priority: 3 },
  { code: '+255', country: 'Tanzanie', flag: '🇹🇿', iso: 'TZ', minDigits: 9, maxDigits: 9, priority: 3 },
  
  // 🏖️ PRIORITÉ 4 : Destinations touristiques majeures
  { code: '+1', country: 'États-Unis', flag: '🇺🇸', iso: 'US', minDigits: 10, maxDigits: 10, format: '(XXX) XXX-XXXX', priority: 4 },
  { code: '+44', country: 'Royaume-Uni', flag: '🇬🇧', iso: 'GB', minDigits: 10, maxDigits: 10, priority: 4 },
  { code: '+49', country: 'Allemagne', flag: '🇩🇪', iso: 'DE', minDigits: 10, maxDigits: 12, priority: 4 },
  { code: '+39', country: 'Italie', flag: '🇮🇹', iso: 'IT', minDigits: 9, maxDigits: 11, priority: 4 },
  { code: '+34', country: 'Espagne', flag: '🇪🇸', iso: 'ES', minDigits: 9, maxDigits: 9, priority: 4 },
  { code: '+61', country: 'Australie', flag: '🇦🇺', iso: 'AU', minDigits: 9, maxDigits: 9, priority: 4 },
  { code: '+81', country: 'Japon', flag: '🇯🇵', iso: 'JP', minDigits: 10, maxDigits: 11, priority: 4 },
  
  // 📈 PRIORITÉ 5 : Marchés émergents & business
  { code: '+86', country: 'Chine', flag: '🇨🇳', iso: 'CN', minDigits: 11, maxDigits: 11, priority: 5 },
  { code: '+91', country: 'Inde', flag: '🇮🇳', iso: 'IN', minDigits: 10, maxDigits: 10, priority: 5 },
  { code: '+55', country: 'Brésil', flag: '🇧🇷', iso: 'BR', minDigits: 10, maxDigits: 11, priority: 5 },
  { code: '+7', country: 'Russie', flag: '🇷🇺', iso: 'RU', minDigits: 10, maxDigits: 10, priority: 5 },
  
  // 🌐 Autres pays importants (ordre alphabétique)
  { code: '+213', country: 'Algérie', flag: '🇩🇿', iso: 'DZ', minDigits: 9, maxDigits: 9 },
  { code: '+54', country: 'Argentine', flag: '🇦🇷', iso: 'AR', minDigits: 10, maxDigits: 11 },
  { code: '+43', country: 'Autriche', flag: '🇦🇹', iso: 'AT', minDigits: 10, maxDigits: 13 },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩', iso: 'BD', minDigits: 10, maxDigits: 10 },
  { code: '+229', country: 'Bénin', flag: '🇧🇯', iso: 'BJ', minDigits: 8, maxDigits: 8 },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫', iso: 'BF', minDigits: 8, maxDigits: 8 },
  { code: '+257', country: 'Burundi', flag: '🇧🇮', iso: 'BI', minDigits: 8, maxDigits: 8 },
  { code: '+237', country: 'Cameroun', flag: '🇨🇲', iso: 'CM', minDigits: 9, maxDigits: 9 },
  { code: '+56', country: 'Chili', flag: '🇨🇱', iso: 'CL', minDigits: 9, maxDigits: 9 },
  { code: '+57', country: 'Colombie', flag: '🇨🇴', iso: 'CO', minDigits: 10, maxDigits: 10 },
  { code: '+243', country: 'Congo (RDC)', flag: '🇨🇩', iso: 'CD', minDigits: 9, maxDigits: 9 },
  { code: '+242', country: 'Congo', flag: '🇨🇬', iso: 'CG', minDigits: 9, maxDigits: 9 },
  { code: '+225', country: 'Côte d\'Ivoire', flag: '🇨🇮', iso: 'CI', minDigits: 8, maxDigits: 8 },
  { code: '+45', country: 'Danemark', flag: '🇩🇰', iso: 'DK', minDigits: 8, maxDigits: 8 },
  { code: '+20', country: 'Égypte', flag: '🇪🇬', iso: 'EG', minDigits: 10, maxDigits: 11 },
  { code: '+971', country: 'Émirats arabes unis', flag: '🇦🇪', iso: 'AE', minDigits: 9, maxDigits: 9 },
  { code: '+251', country: 'Éthiopie', flag: '🇪🇹', iso: 'ET', minDigits: 9, maxDigits: 9 },
  { code: '+358', country: 'Finlande', flag: '🇫🇮', iso: 'FI', minDigits: 9, maxDigits: 12 },
  { code: '+241', country: 'Gabon', flag: '🇬🇦', iso: 'GA', minDigits: 8, maxDigits: 8 },
  { code: '+220', country: 'Gambie', flag: '🇬🇲', iso: 'GM', minDigits: 7, maxDigits: 7 },
  { code: '+233', country: 'Ghana', flag: '🇬🇭', iso: 'GH', minDigits: 9, maxDigits: 9 },
  { code: '+30', country: 'Grèce', flag: '🇬🇷', iso: 'GR', minDigits: 10, maxDigits: 10 },
  { code: '+224', country: 'Guinée', flag: '🇬🇳', iso: 'GN', minDigits: 9, maxDigits: 9 },
  { code: '+245', country: 'Guinée-Bissau', flag: '🇬🇼', iso: 'GW', minDigits: 7, maxDigits: 7 },
  { code: '+36', country: 'Hongrie', flag: '🇭🇺', iso: 'HU', minDigits: 9, maxDigits: 9 },
  { code: '+62', country: 'Indonésie', flag: '🇮🇩', iso: 'ID', minDigits: 9, maxDigits: 12 },
  { code: '+98', country: 'Iran', flag: '🇮🇷', iso: 'IR', minDigits: 10, maxDigits: 10 },
  { code: '+353', country: 'Irlande', flag: '🇮🇪', iso: 'IE', minDigits: 9, maxDigits: 9 },
  { code: '+972', country: 'Israël', flag: '🇮🇱', iso: 'IL', minDigits: 9, maxDigits: 9 },
  { code: '+1876', country: 'Jamaïque', flag: '🇯🇲', iso: 'JM', minDigits: 10, maxDigits: 10 },
  { code: '+962', country: 'Jordanie', flag: '🇯🇴', iso: 'JO', minDigits: 9, maxDigits: 9 },
  { code: '+7', country: 'Kazakhstan', flag: '🇰🇿', iso: 'KZ', minDigits: 10, maxDigits: 10 },
  { code: '+965', country: 'Koweït', flag: '🇰🇼', iso: 'KW', minDigits: 8, maxDigits: 8 },
  { code: '+961', country: 'Liban', flag: '🇱🇧', iso: 'LB', minDigits: 8, maxDigits: 8 },
  { code: '+231', country: 'Libéria', flag: '🇱🇷', iso: 'LR', minDigits: 8, maxDigits: 8 },
  { code: '+218', country: 'Libye', flag: '🇱🇾', iso: 'LY', minDigits: 9, maxDigits: 9 },
  { code: '+352', country: 'Luxembourg', flag: '🇱🇺', iso: 'LU', minDigits: 9, maxDigits: 9 },
  { code: '+60', country: 'Malaisie', flag: '🇲🇾', iso: 'MY', minDigits: 9, maxDigits: 10 },
  { code: '+223', country: 'Mali', flag: '🇲🇱', iso: 'ML', minDigits: 8, maxDigits: 8 },
  { code: '+212', country: 'Maroc', flag: '🇲🇦', iso: 'MA', minDigits: 9, maxDigits: 9 },
  { code: '+52', country: 'Mexique', flag: '🇲🇽', iso: 'MX', minDigits: 10, maxDigits: 10 },
  { code: '+258', country: 'Mozambique', flag: '🇲🇿', iso: 'MZ', minDigits: 9, maxDigits: 9 },
  { code: '+264', country: 'Namibie', flag: '🇳🇦', iso: 'NA', minDigits: 9, maxDigits: 9 },
  { code: '+227', country: 'Niger', flag: '🇳🇪', iso: 'NE', minDigits: 8, maxDigits: 8 },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬', iso: 'NG', minDigits: 10, maxDigits: 11 },
  { code: '+47', country: 'Norvège', flag: '🇳🇴', iso: 'NO', minDigits: 8, maxDigits: 8 },
  { code: '+64', country: 'Nouvelle-Zélande', flag: '🇳🇿', iso: 'NZ', minDigits: 9, maxDigits: 10 },
  { code: '+31', country: 'Pays-Bas', flag: '🇳🇱', iso: 'NL', minDigits: 9, maxDigits: 9 },
  { code: '+51', country: 'Pérou', flag: '🇵🇪', iso: 'PE', minDigits: 9, maxDigits: 9 },
  { code: '+63', country: 'Philippines', flag: '🇵🇭', iso: 'PH', minDigits: 10, maxDigits: 10 },
  { code: '+48', country: 'Pologne', flag: '🇵🇱', iso: 'PL', minDigits: 9, maxDigits: 9 },
  { code: '+351', country: 'Portugal', flag: '🇵🇹', iso: 'PT', minDigits: 9, maxDigits: 9 },
  { code: '+40', country: 'Roumanie', flag: '🇷🇴', iso: 'RO', minDigits: 9, maxDigits: 9 },
  { code: '+250', country: 'Rwanda', flag: '🇷🇼', iso: 'RW', minDigits: 9, maxDigits: 9 },
  { code: '+221', country: 'Sénégal', flag: '🇸🇳', iso: 'SN', minDigits: 9, maxDigits: 9 },
  { code: '+232', country: 'Sierra Leone', flag: '🇸🇱', iso: 'SL', minDigits: 8, maxDigits: 8 },
  { code: '+65', country: 'Singapour', flag: '🇸🇬', iso: 'SG', minDigits: 8, maxDigits: 8 },
  { code: '+46', country: 'Suède', flag: '🇸🇪', iso: 'SE', minDigits: 9, maxDigits: 9 },
  { code: '+66', country: 'Thaïlande', flag: '🇹🇭', iso: 'TH', minDigits: 9, maxDigits: 9 },
  { code: '+228', country: 'Togo', flag: '🇹🇬', iso: 'TG', minDigits: 8, maxDigits: 8 },
  { code: '+216', country: 'Tunisie', flag: '🇹🇳', iso: 'TN', minDigits: 8, maxDigits: 8 },
  { code: '+90', country: 'Turquie', flag: '🇹🇷', iso: 'TR', minDigits: 10, maxDigits: 10 },
  { code: '+256', country: 'Ouganda', flag: '🇺🇬', iso: 'UG', minDigits: 9, maxDigits: 9 },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾', iso: 'UY', minDigits: 8, maxDigits: 8 },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪', iso: 'VE', minDigits: 10, maxDigits: 10 },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳', iso: 'VN', minDigits: 9, maxDigits: 10 },
  { code: '+967', country: 'Yémen', flag: '🇾🇪', iso: 'YE', minDigits: 9, maxDigits: 9 },
  { code: '+260', country: 'Zambie', flag: '🇿🇲', iso: 'ZM', minDigits: 9, maxDigits: 9 },
  { code: '+263', country: 'Zimbabwe', flag: '🇿🇼', iso: 'ZW', minDigits: 9, maxDigits: 9 }
]

/**
 * Fonction de recherche intelligente avec priorités
 */
export const searchCountries = (query: string): PhoneCountry[] => {
  if (!query.trim()) {
    // Sans recherche, trier par priorité puis par nom
    return phoneCountries.sort((a, b) => {
      if (a.priority && b.priority) {
        if (a.priority !== b.priority) {
          return a.priority - b.priority
        }
      } else if (a.priority && !b.priority) {
        return -1
      } else if (!a.priority && b.priority) {
        return 1
      }
      return a.country.localeCompare(b.country)
    })
  }

  const lowerQuery = (query || '').toLowerCase()
  
  return phoneCountries
    .filter(country => 
      (country.country || '').toLowerCase().includes(lowerQuery) ||
      (country.code || '').includes(lowerQuery) ||
      (country.iso || '').toLowerCase().includes(lowerQuery)
    )
    .sort((a, b) => {
      // Score de pertinence
      const scoreA = getRelevanceScore(a, lowerQuery)
      const scoreB = getRelevanceScore(b, lowerQuery)
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA // Score décroissant
      }
      
      // En cas d'égalité, trier par priorité puis nom
      if (a.priority && b.priority) {
        if (a.priority !== b.priority) {
          return a.priority - b.priority
        }
      } else if (a.priority && !b.priority) {
        return -1
      } else if (!a.priority && b.priority) {
        return 1
      }
      
      return a.country.localeCompare(b.country)
    })
}

/**
 * Calcul du score de pertinence pour le tri des résultats
 */
function getRelevanceScore(country: PhoneCountry, query: string): number {
  let score = 0
  
  // Priorité du pays (plus important = score plus élevé)
  if (country.priority) {
    score += (6 - country.priority) * 10 // Madagascar = 50, France = 40, etc.
  }
  
  // Correspondance exacte du nom
  const countryName = (country.country || '').toLowerCase()
  if (countryName === query) {
    score += 100
  } else if (countryName.startsWith(query)) {
    score += 50
  } else if (countryName.includes(query)) {
    score += 25
  }
  
  // Correspondance du code pays
  if (country.code.includes(query)) {
    score += 30
  }
  
  // Correspondance ISO
  if ((country.iso || '').toLowerCase() === query) {
    score += 20
  }
  
  return score
}

/**
 * Validation d'un numéro de téléphone selon le pays
 */
export const validatePhoneNumber = (phoneNumber: string, countryCode: string): {
  isValid: boolean
  message?: string
  country?: PhoneCountry
} => {
  const country = phoneCountries.find(c => c.code === countryCode)
  
  if (!country) {
    return {
      isValid: false,
      message: 'Code pays non reconnu'
    }
  }
  
  const digitsOnly = phoneNumber.replace(/\D/g, '')
  const isValid = digitsOnly.length >= country.minDigits && digitsOnly.length <= country.maxDigits
  
  if (!isValid) {
    const message = country.minDigits === country.maxDigits
      ? `Le numéro doit contenir exactement ${country.minDigits} chiffres`
      : `Le numéro doit contenir entre ${country.minDigits} et ${country.maxDigits} chiffres`
    
    return {
      isValid: false,
      message,
      country
    }
  }
  
  return {
    isValid: true,
    country
  }
}

/**
 * Détection automatique du pays via IP
 * À utiliser avec parcimonie pour éviter les impacts performance
 */
export const detectUserCountry = async (): Promise<string | null> => {
  try {
    console.log('🌍 Détection du pays via IP (inscription uniquement)...')
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3s timeout
    
    const response = await fetch('https://ipapi.co/json/', { 
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) throw new Error('API unavailable')
    
    const data = await response.json()
    console.log('🎯 Pays détecté:', data.country_code, data.country_name)
    
    return data.country_code // 'MG', 'FR', etc.
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏱️ Timeout détection IP - utilisation de Madagascar par défaut')
    } else {
      console.log('⚠️ Détection IP échouée:', error.message, '- utilisation de Madagascar par défaut')
    }
    return 'MG' // Madagascar par défaut
  }
}

/**
 * Formatage automatique d'un numéro selon le pays
 */
export const formatPhoneNumber = (phoneNumber: string, countryCode: string): string => {
  const country = phoneCountries.find(c => c.code === countryCode)
  if (!country?.format) return phoneNumber
  
  const digitsOnly = phoneNumber.replace(/\D/g, '')
  let formatted = country.format
  
  // Remplacer les X par les chiffres
  for (let i = 0; i < digitsOnly.length; i++) {
    formatted = formatted.replace('X', digitsOnly[i])
  }
  
  // Supprimer les X restants
  formatted = formatted.replace(/X/g, '')
  
  return formatted
}