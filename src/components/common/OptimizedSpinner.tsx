import React from 'react'

interface OptimizedSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

export function OptimizedSpinner({ 
  size = 'md', 
  message = 'Chargement...', 
  className = '' 
}: OptimizedSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }
  
  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin`}
        aria-label="Chargement"
      />
      {message && (
        <div className="text-sm text-gray-600 font-medium">
          {message}
        </div>
      )}
    </div>
  )
}

// Version minimaliste pour les cas où seul le spinner est nécessaire
export function SimpleSpinner({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin ${className}`}
      aria-label="Chargement"
    />
  )
}