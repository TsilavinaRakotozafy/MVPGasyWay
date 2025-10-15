import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Check, ChevronsUpDown, Phone } from 'lucide-react'
import { cn } from '../../lib/utils'

// Types locaux pour éviter les problèmes d'importation
interface PhoneCountry {
  code: string
  country: string
  flag: string
  iso: string
  minDigits: number
  maxDigits: number
  format?: string
  priority?: number
}

// Base de données simplifiée des pays prioritaires
const phoneCountries: PhoneCountry[] = [
  // Pays prioritaires
  { code: '+261', country: 'Madagascar', flag: '🇲🇬', iso: 'MG', minDigits: 9, maxDigits: 9, format: 'XX XX XXX XX', priority: 1 },
  { code: '+33', country: 'France', flag: '🇫🇷', iso: 'FR', minDigits: 10, maxDigits: 10, format: 'XX XX XX XX XX', priority: 2 },
  { code: '+1', country: 'États-Unis', flag: '🇺🇸', iso: 'US', minDigits: 10, maxDigits: 10, format: '(XXX) XXX-XXXX', priority: 3 },
  { code: '+32', country: 'Belgique', flag: '🇧🇪', iso: 'BE', minDigits: 9, maxDigits: 9, priority: 2 },
  { code: '+41', country: 'Suisse', flag: '🇨🇭', iso: 'CH', minDigits: 9, maxDigits: 9, priority: 2 },
  
  // Océan Indien
  { code: '+230', country: 'Maurice', flag: '🇲🇺', iso: 'MU', minDigits: 8, maxDigits: 8, priority: 3 },
  { code: '+248', country: 'Seychelles', flag: '🇸🇨', iso: 'SC', minDigits: 7, maxDigits: 7, priority: 3 },
  { code: '+262', country: 'Réunion', flag: '🇷🇪', iso: 'RE', minDigits: 10, maxDigits: 10, priority: 3 },
  { code: '+269', country: 'Comores', flag: '🇰🇲', iso: 'KM', minDigits: 7, maxDigits: 7, priority: 3 },
  
  // Autres pays importants
  { code: '+44', country: 'Royaume-Uni', flag: '🇬🇧', iso: 'GB', minDigits: 10, maxDigits: 10 },
  { code: '+49', country: 'Allemagne', flag: '🇩🇪', iso: 'DE', minDigits: 10, maxDigits: 12 },
  { code: '+39', country: 'Italie', flag: '🇮🇹', iso: 'IT', minDigits: 9, maxDigits: 11 },
  { code: '+34', country: 'Espagne', flag: '🇪🇸', iso: 'ES', minDigits: 9, maxDigits: 9 },
  { code: '+61', country: 'Australie', flag: '🇦🇺', iso: 'AU', minDigits: 9, maxDigits: 9 },
  { code: '+81', country: 'Japon', flag: '🇯🇵', iso: 'JP', minDigits: 10, maxDigits: 11 },
  { code: '+86', country: 'Chine', flag: '🇨🇳', iso: 'CN', minDigits: 11, maxDigits: 11 },
  { code: '+91', country: 'Inde', flag: '🇮🇳', iso: 'IN', minDigits: 10, maxDigits: 10 },
  { code: '+55', country: 'Brésil', flag: '🇧🇷', iso: 'BR', minDigits: 10, maxDigits: 11 }
].sort((a, b) => {
  // Trier par priorité puis par nom
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

// Fonction de recherche locale avec vérifications sécurisées
const searchCountries = (query: string): PhoneCountry[] => {
  // ✅ Vérifications sécurisées pour éviter les erreurs undefined
  if (!query || typeof query !== 'string' || !query.trim()) return phoneCountries
  
  const lowerQuery = query.toLowerCase()
  return phoneCountries.filter(country => {
    // ✅ Vérifications défensives pour toutes les propriétés
    const countryName = country.country || ''
    const countryCode = country.code || ''
    const countryIso = country.iso || ''
    
    return countryName.toLowerCase().includes(lowerQuery) ||
           countryCode.includes(lowerQuery) ||
           countryIso.toLowerCase().includes(lowerQuery)
  })
}

// Validation locale
const validatePhoneNumber = (phoneNumber: string, countryCode: string) => {
  const country = phoneCountries.find(c => c.code === countryCode)
  if (!country) {
    return { isValid: false, message: 'Code pays non reconnu' }
  }
  
  const digitsOnly = phoneNumber.replace(/\D/g, '')
  const isValid = digitsOnly.length >= country.minDigits && digitsOnly.length <= country.maxDigits
  
  if (!isValid) {
    const message = country.minDigits === country.maxDigits
      ? `Le numéro doit contenir exactement ${country.minDigits} chiffres`
      : `Le numéro doit contenir entre ${country.minDigits} et ${country.maxDigits} chiffres`
    
    return { isValid: false, message }
  }
  
  return { isValid: true }
}

// Détection IP simplifiée
const detectUserCountry = async (): Promise<string | null> => {
  try {
    console.log('🌍 Détection du pays via IP...')
    const response = await fetch('https://ipapi.co/json/', { 
      signal: AbortSignal.timeout(3000)
    })
    
    if (!response.ok) throw new Error('API unavailable')
    
    const data = await response.json()
    console.log('🎯 Pays détecté:', data.country_code, data.country_name)
    return data.country_code
  } catch (error) {
    console.log('⚠️ Détection IP échouée - aucun pays par défaut')
    return null
  }
}

interface PhoneInputProps {
  value: {
    countryCode: string
    phoneNumber: string
  }
  onChange: (value: { countryCode: string; phoneNumber: string }) => void
  error?: string
  required?: boolean
  autoDetectCountry?: boolean
}

export function PhoneInput({ 
  value, 
  onChange, 
  error, 
  required = false,
  autoDetectCountry = false 
}: PhoneInputProps) {
  const [open, setOpen] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // ✅ Protection contre les valeurs undefined dans les props
  const safeValue = {
    countryCode: value?.countryCode || '',
    phoneNumber: value?.phoneNumber || ''
  }

  // Détection automatique du pays seulement si demandée et au premier chargement
  useEffect(() => {
    if (!autoDetectCountry || isDetecting || !onChange) return
    
    // Ne faire la détection que si aucun pays n'est sélectionné
    if (!safeValue.countryCode) {
      setIsDetecting(true)
      detectUserCountry().then(countryCode => {
        if (countryCode) {
          const detectedCountry = phoneCountries.find(c => c.iso === countryCode)
          if (detectedCountry) {
            console.log('✅ Pays auto-sélectionné:', detectedCountry.country)
            onChange({
              ...safeValue,
              countryCode: detectedCountry.code
            })
          }
        }
        setIsDetecting(false)
      })
    }
  }, [autoDetectCountry, safeValue.countryCode, onChange, isDetecting])

  const selectedCountry = phoneCountries.find(country => country.code === safeValue.countryCode)
  const filteredCountries = searchCountries(searchQuery)

  const handlePhoneNumberChange = (phoneNumber: string) => {
    if (!onChange) return
    
    // Permettre seulement les chiffres, espaces, tirets, parenthèses
    const cleanedNumber = phoneNumber.replace(/[^\d\s\-\(\)]/g, '')
    onChange({
      ...safeValue,
      phoneNumber: cleanedNumber
    })
  }

  const getValidationMessage = (): string | null => {
    if (error) return error
    
    if (safeValue.phoneNumber && selectedCountry) {
      const validation = validatePhoneNumber(safeValue.phoneNumber, safeValue.countryCode)
      if (!validation.isValid) {
        return validation.message || 'Numéro invalide'
      }
    }
    
    return null
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="phone">
        Numéro de téléphone 
        {required && <span className="text-destructive">*</span>}

      </Label>
      
      <div className="flex gap-2">
        {/* Sélecteur de pays */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[108px] justify-between cursor-pointer hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary/20 pointer-events-auto"
              disabled={false}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setOpen(!open)
              }}
            >
              {selectedCountry && (
                <div className="flex items-center gap-2">
                  <span className="text-base">{selectedCountry.flag}</span>
                  <span className="text-sm font-mono">{selectedCountry.code}</span>
                </div>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput 
                placeholder="Rechercher un pays..." 
                value={searchQuery || ''}
                onValueChange={(value) => setSearchQuery(value || '')}
              />
              <CommandList>
                <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                <CommandGroup>
                  {filteredCountries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={`${country.country} ${country.code}`}
                      onSelect={() => {
                        if (onChange) {
                          onChange({
                            ...safeValue,
                            countryCode: country.code
                          })
                        }
                        setOpen(false)
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-lg">{country.flag}</span>
                        <span className="font-mono text-muted-foreground min-w-[50px]">
                          {country.code}
                        </span>
                        <span className="flex-1">{country.country}</span>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            value.countryCode === country.code ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Input du numéro */}
        <div className="flex-1 relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            value={safeValue.phoneNumber}
            onChange={(e) => handlePhoneNumberChange(e.target.value)}
            placeholder={selectedCountry?.format ? `Ex: ${selectedCountry.format}` : `Numéro de téléphone (${selectedCountry?.minDigits || 'X'}-${selectedCountry?.maxDigits || 'X'} chiffres)`}
            className="pl-10"
          />
        </div>
      </div>

      {/* Message de validation */}
      {getValidationMessage() && (
        <p className="text-sm text-destructive">{getValidationMessage()}</p>
      )}
      
      {/* Indication du format attendu */}
      {selectedCountry && !getValidationMessage() && (
        <p className="text-sm text-muted-foreground">
          Format attendu: {selectedCountry.minDigits === selectedCountry.maxDigits 
            ? `${selectedCountry.minDigits} chiffres`
            : `${selectedCountry.minDigits}-${selectedCountry.maxDigits} chiffres`
          }
          {selectedCountry.format && ` (ex: ${selectedCountry.format})`}
        </p>
      )}
    </div>
  )
}