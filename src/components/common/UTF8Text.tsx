import React from 'react'
import { fixEncodedText } from '../../utils/utf8-fixer'

interface UTF8TextProps {
  children: React.ReactNode
  as?: keyof JSX.IntrinsicElements
  className?: string
}

/**
 * Composant wrapper qui corrige automatiquement l'encodage UTF-8
 * Utilise ce composant pour tous les textes qui contiennent des accents
 */
export const UTF8Text: React.FC<UTF8TextProps> = ({ 
  children, 
  as: Component = 'span',
  className,
  ...props 
}) => {
  const fixedContent = React.useMemo(() => {
    if (typeof children === 'string') {
      return fixEncodedText(children)
    }
    return children
  }, [children])

  return React.createElement(Component, { className, ...props }, fixedContent)
}

/**
 * Hook pour corriger automatiquement les textes dans un composant
 */
export const useUTF8Text = (text: string): string => {
  return React.useMemo(() => fixEncodedText(text), [text])
}