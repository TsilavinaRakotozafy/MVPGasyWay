import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Trash2, CheckCircle } from 'lucide-react'
import { clearAllCaches } from '../../utils/performance'
import { toast } from 'sonner'

interface CacheClearFloatingButtonProps {
  visible?: boolean
}

export function CacheClearFloatingButton({ visible = true }: CacheClearFloatingButtonProps) {
  const [isClearing, setIsClearing] = useState(false)
  const [justCleared, setJustCleared] = useState(false)

  const handleClearCaches = async () => {
    setIsClearing(true)
    try {
      const result = clearAllCaches()
      
      toast.success('🧹 Caches effacés', {
        description: 'Tous les caches ont été nettoyés avec succès'
      })
      
      console.log('Caches cleared via floating button:', result)
      
      setJustCleared(true)
      setTimeout(() => setJustCleared(false), 2000)
    } catch (error) {
      console.error('Error clearing caches:', error)
      toast.error('Erreur', {
        description: 'Impossible d\'effacer les caches'
      })
    } finally {
      setIsClearing(false)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleClearCaches}
        disabled={isClearing}
        size="sm"
        className={`
          shadow-lg transition-all duration-300
          ${justCleared 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'bg-red-600 hover:bg-red-700 text-white'
          }
          ${isClearing ? 'animate-pulse' : ''}
        `}
        title="Effacer tous les caches (Ctrl+Shift+C)"
      >
        {justCleared ? (
          <>
            <CheckCircle className="h-4 w-4 mr-1" />
            Effacé!
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4 mr-1" />
            {isClearing ? 'Effacement...' : 'Caches'}
          </>
        )}
      </Button>
    </div>
  )
}