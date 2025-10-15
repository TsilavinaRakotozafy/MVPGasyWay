import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, MapPin, Search, X } from 'lucide-react'
import { Input } from '../ui/input'
import { cn } from '../../lib/utils'

interface Option {
  id: string
  name: string
}

interface SearchableDropdownProps {
  options: Option[]
  placeholder?: string
  value: string
  onValueChange: (value: string) => void
  searchValue: string
  onSearchChange: (value: string) => void
  className?: string
  emptyState?: string
  showAllOption?: boolean
  allOptionLabel?: string
}

export function SearchableDropdown({
  options,
  placeholder = "Rechercher...",
  value,
  onValueChange,
  searchValue,
  onSearchChange,
  className,
  emptyState = "Aucun résultat trouvé",
  showAllOption = true,
  allOptionLabel = "Toutes les options"
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filtrer les options selon la recherche
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchValue.toLowerCase())
  )

  // Construire la liste finale avec "Toutes les options" si nécessaire
  const finalOptions = showAllOption 
    ? [{ id: 'all', name: allOptionLabel }, ...filteredOptions]
    : filteredOptions

  // Gérer le clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Gérer les touches du clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true)
        setHighlightedIndex(0)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        setHighlightedIndex(prev => 
          prev < finalOptions.length - 1 ? prev + 1 : 0
        )
        e.preventDefault()
        break
      case 'ArrowUp':
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : finalOptions.length - 1
        )
        e.preventDefault()
        break
      case 'Enter':
        if (highlightedIndex >= 0 && finalOptions[highlightedIndex]) {
          handleOptionSelect(finalOptions[highlightedIndex])
        }
        e.preventDefault()
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleOptionSelect = (option: Option) => {
    onValueChange(option.id)
    if (option.id === 'all') {
      onSearchChange('')
    } else {
      onSearchChange(option.name)
    }
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.blur()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onSearchChange(newValue)
    
    if (!isOpen && newValue.length > 0) {
      setIsOpen(true)
    }
    
    setHighlightedIndex(-1)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const clearSearch = () => {
    onSearchChange('')
    onValueChange('all')
    inputRef.current?.focus()
  }

  // Afficher le texte de l'option sélectionnée
  const getDisplayValue = () => {
    // Si une option valide est sélectionnée (pas "all"), afficher son nom
    if (value && value !== 'all') {
      const selected = options.find(option => option.id === value)
      return selected ? selected.name : ''
    }
    
    // Si on est en mode recherche mais aucune option sélectionnée, afficher la recherche
    if (searchValue && (value === 'all' || !value)) {
      return searchValue
    }
    
    // Sinon, rien à afficher (placeholder)
    return ''
  }

  // Vérifier si on a une destination réellement sélectionnée (pour la couleur)
  const hasSelectedDestination = () => {
    return value && value !== 'all' && options.find(option => option.id === value)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <span
          ref={inputRef}
          onClick={handleInputFocus}
          className={`bg-transparent border-0 rounded-lg focus:ring-0 focus:outline-none focus:border-0 focus:shadow-none p-0 cursor-pointer min-h-[20px] flex items-center transition-colors duration-200 text-base ${hasSelectedDestination() ? 'text-primary' : 'text-muted-foreground'}`}
          style={{ 
            fontSize: 'var(--text-p-size, var(--text-base))',
            fontWeight: 'var(--text-p-weight, var(--font-weight-normal))',
            lineHeight: 'var(--text-p-line-height, 1.5)',
            fontFamily: 'var(--font-family)'
          }}
        >
          {getDisplayValue() || placeholder}
        </span>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <ChevronDown 
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} 
          />
        </button>
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {finalOptions.length === 0 ? (
            <div className="p-3 text-center text-muted-foreground">
              {emptyState}
            </div>
          ) : (
            finalOptions.map((option, index) => (
              <button
                key={option.id}
                role="menuitem"
                aria-selected={value === option.id}
                tabIndex={index === highlightedIndex ? 0 : -1}
                onClick={() => handleOptionSelect(option)}
                className={cn(
                  "w-full flex items-center gap-2 p-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors",
                  index === highlightedIndex && "bg-accent text-accent-foreground",
                  value === option.id && "bg-primary/10 text-primary"
                )}
              >
                {option.id !== 'all' && (
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{option.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}