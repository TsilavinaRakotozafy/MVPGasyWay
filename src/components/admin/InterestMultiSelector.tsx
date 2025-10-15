import React, { useState, useEffect, useRef } from 'react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { ScrollArea } from '../ui/scroll-area'
import { X, Search, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { supabase } from '../../utils/supabase/client'

interface Interest {
  id: string
  name: string
  emoji: string
  category: string
}

interface InterestMultiSelectorProps {
  selectedInterests: string[]
  onSelectionChange: (interests: string[]) => void
  placeholder?: string
  className?: string
}

export function InterestMultiSelector({ 
  selectedInterests, 
  onSelectionChange, 
  placeholder = "Sélectionner des activités...",
  className = "" 
}: InterestMultiSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Charger les intérêts depuis la base de données
  useEffect(() => {
    loadInterests()
  }, [])

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadInterests = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setInterests(data || [])
    } catch (error) {
      console.error('Erreur chargement intérêts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les intérêts selon le terme de recherche
  const filteredInterests = interests.filter(interest =>
    (interest.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (interest.category?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  // Grouper par catégorie
  const groupedInterests = filteredInterests.reduce((acc, interest) => {
    const category = interest.category || 'Sans catégorie'
    if (!acc[category]) acc[category] = []
    acc[category].push(interest)
    return acc
  }, {} as Record<string, Interest[]>)

  // Récupérer les intérêts sélectionnés pour l'affichage
  const selectedInterestObjects = interests.filter(i => selectedInterests.includes(i.id))

  const toggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      onSelectionChange(selectedInterests.filter(id => id !== interestId))
    } else {
      onSelectionChange([...selectedInterests, interestId])
    }
  }

  const removeInterest = (interestId: string) => {
    onSelectionChange(selectedInterests.filter(id => id !== interestId))
  }

  const clearAll = () => {
    onSelectionChange([])
  }

  const handleDropdownToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Zone de sélection principale */}
      <div
        className="min-h-[40px] border border-input bg-background rounded-md px-3 py-2 cursor-pointer flex items-center justify-between"
        onClick={handleDropdownToggle}
      >
        <div className="flex-1">
          {selectedInterestObjects.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedInterestObjects.map(interest => (
                <Badge
                  key={interest.id}
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeInterest(interest.id)
                  }}
                >
                  <span>{interest.emoji || '📌'}</span>
                  <span>{interest.name || 'Sans nom'}</span>
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          {selectedInterests.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                clearAll()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
          <CardContent className="p-0">
            {/* Barre de recherche */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher une activité..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Liste des intérêts */}
            <ScrollArea className="max-h-64">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground overflow-hidden">
                  Chargement...
                </div>
              ) : Object.keys(groupedInterests).length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchTerm ? 'Aucun résultat trouvé' : 'Aucune activité disponible'}
                </div>
              ) : (
                <div className="p-2 overflow-hidden">
                  {Object.entries(groupedInterests).map(([category, categoryInterests]) => (
                    <div key={category} className="mb-3 overflow-hidden">
                      <div className="px-2 py-1 text-sm font-medium text-muted-foreground capitalize border-b mb-2 truncate">
                        {category}
                      </div>
                      <div className="space-y-1 overflow-hidden">
                        {categoryInterests.map(interest => {
                          const isSelected = selectedInterests.includes(interest.id)
                          return (
                            <div
                              key={interest.id}
                              className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-accent overflow-hidden ${
                                isSelected ? 'bg-accent' : ''
                              }`}
                              onClick={() => toggleInterest(interest.id)}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                <span className="flex-shrink-0">{interest.emoji || '📌'}</span>
                                <span className="text-sm truncate min-w-0">{interest.name || 'Sans nom'}</span>
                              </div>
                              {isSelected && (
                                <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                  <X className="h-3 w-3 text-primary-foreground" />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer avec statistiques */}
            {selectedInterests.length > 0 && (
              <div className="p-3 border-t bg-muted/30">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{selectedInterests.length} activité(s) sélectionnée(s)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="h-auto p-1 text-xs"
                  >
                    Tout effacer
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}