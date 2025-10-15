import React from 'react'
import { Clock, Star } from 'lucide-react'

interface ComingSoonSectionProps {
  title: string
  description: string
  icon?: React.ReactNode
  className?: string
}

export function ComingSoonSection({ 
  title, 
  description, 
  icon = <Clock className="h-5 w-5" />,
  className = "" 
}: ComingSoonSectionProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="text-amber-600">
          {icon}
        </div>
        <h1 className="text-2xl">{title}</h1>
        <div className="flex items-center space-x-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs">
          <Star className="h-3 w-3" />
          <span>Bientôt</span>
        </div>
      </div>
      
      <p className="text-gray-600">{description}</p>
      
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="text-amber-500 mt-1">
            <Clock className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-amber-800 mb-2">En cours de développement</h3>
            <p className="text-amber-700 text-sm leading-relaxed">
              Cette fonctionnalité fait partie de notre feuille de route et sera disponible dans une prochaine mise à jour. 
              Nous travaillons activement pour vous offrir la meilleure expérience possible.
            </p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-amber-200">
          <div className="text-xs text-amber-600">
            🚀 Restez connecté pour les nouveautés !
          </div>
        </div>
      </div>
    </div>
  )
}