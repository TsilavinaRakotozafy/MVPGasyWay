import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react'
import { Button } from '../ui/button'
import { Calendar as CalendarComponent } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { cn } from '../../lib/utils'

export interface DateRange {
  start: Date | undefined
  end: Date | undefined
}

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (dateRange: DateRange) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({ 
  value, 
  onChange, 
  placeholder = "Ajouter des dates",
  className
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectingStart, setSelectingStart] = useState(true)
  // État temporaire pour la sélection avant validation
  const [tempSelection, setTempSelection] = useState<DateRange | undefined>(value)

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    const currentRange = tempSelection || { start: undefined, end: undefined }

    if (selectingStart || !currentRange.start) {
      // Sélection de la date de début
      const newRange = { start: date, end: undefined }
      setTempSelection(newRange)
      setSelectingStart(false)
    } else {
      // Sélection de la date de fin
      if (date < currentRange.start) {
        // Si la date de fin est antérieure au début, inverser
        const newRange = { start: date, end: currentRange.start }
        setTempSelection(newRange)
      } else {
        const newRange = { start: currentRange.start, end: date }
        setTempSelection(newRange)
      }
      // NE PAS fermer le dropdown - attendre le clic sur "Enregistrer"
    }
  }

  // Fonction pour valider et enregistrer la sélection
  const handleSave = () => {
    if (tempSelection) {
      onChange?.(tempSelection)
    }
    setIsOpen(false)
    setSelectingStart(true)
  }

  // Fonction pour effacer la sélection
  const handleClear = () => {
    setTempSelection({ start: undefined, end: undefined })
    onChange?.({ start: undefined, end: undefined })
    setSelectingStart(true)
  }

  // Synchroniser tempSelection avec value quand le composant s'ouvre
  useEffect(() => {
    if (isOpen) {
      setTempSelection(value)
      setSelectingStart(!value?.start)
    }
  }, [isOpen, value])

  const formatDateRange = () => {
    if (!value?.start && !value?.end) {
      return placeholder
    }

    if (value?.start && !value?.end) {
      const startDate = value.start.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      })
      return `${startDate} - ...`
    }

    if (value?.start && value?.end) {
      const startDate = value.start.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      })
      const endDate = value.end.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      })
      return `${startDate} - ${endDate}`
    }

    return placeholder
  }

  const hasSelection = value?.start || value?.end
  const isComplete = value?.start && value?.end

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full text-left justify-start p-0 h-auto hover:bg-transparent",
            className
          )}
        >
          <div className="flex items-center">
            <span className={cn(
              hasSelection ? "text-foreground" : "text-muted-foreground"
            )}>
              {formatDateRange()}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          {/* Instructions */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {selectingStart || !tempSelection?.start 
                ? "Sélectionnez la date d'arrivée" 
                : tempSelection?.end 
                ? "Plage sélectionnée - Cliquez sur Enregistrer"
                : "Sélectionnez la date de départ"}
            </p>
          </div>
          
          {/* Calendrier avec date du jour en couleur secondary */}
          <CalendarComponent
            mode="range"
            selected={{
              from: tempSelection?.start,
              to: tempSelection?.end
            }}
            onSelect={(range) => {
              if (range?.from) {
                if (!tempSelection?.start || selectingStart) {
                  // Première date sélectionnée
                  setTempSelection({ start: range.from, end: undefined })
                  setSelectingStart(false)
                } else if (range?.to) {
                  // Deuxième date sélectionnée
                  if (range.to < range.from) {
                    setTempSelection({ start: range.to, end: range.from })
                  } else {
                    setTempSelection({ start: range.from, end: range.to })
                  }
                }
              }
            }}
            initialFocus
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            className="w-full [&_.rdp-day_today]:bg-secondary [&_.rdp-day_today]:text-secondary-foreground"
          />

          {/* Boutons d'action */}
          <div className="flex gap-2">
            {(tempSelection?.start || tempSelection?.end) && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={handleClear}
              >
                Effacer
              </Button>
            )}
            {tempSelection?.start && tempSelection?.end && (
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleSave}
              >
                Enregistrer
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}