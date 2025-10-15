import React from 'react'

/**
 * Utilitaire pour forcer l'encodage UTF-8 correct
 * Résout les problèmes d'affichage des caractères accentués français
 */

export const forceUTF8Encoding = () => {
  // 1. Supprimer tous les meta charset existants et en créer un nouveau
  const existingCharsets = document.querySelectorAll('meta[charset]')
  existingCharsets.forEach(meta => meta.remove())
  
  // 2. Créer le meta charset en première position
  const charset = document.createElement('meta')
  charset.setAttribute('charset', 'UTF-8')
  
  const firstChild = document.head.firstChild
  if (firstChild) {
    document.head.insertBefore(charset, firstChild)
  } else {
    document.head.appendChild(charset)
  }
  
  // 3. Ajouter des meta supplémentaires pour forcer UTF-8
  const httpEquiv = document.createElement('meta')
  httpEquiv.setAttribute('http-equiv', 'Content-Type')
  httpEquiv.setAttribute('content', 'text/html; charset=UTF-8')
  document.head.appendChild(httpEquiv)
  
  // 4. Forcer la langue française
  document.documentElement.setAttribute('lang', 'fr')
  document.documentElement.setAttribute('xml:lang', 'fr')
  
  console.log('✅ UTF-8 encoding forcé pour résoudre les caractères accentués')
}

/**
 * Corrige les caractères mal encodés dans une chaîne
 */
export const fixEncodedText = (text: string): string => {
  if (!text || typeof text !== 'string') return text
  
  // Corrections courantes pour les caractères français mal encodés
  const corrections = {
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ã ': 'à',
    'Ã§': 'ç',
    'Ã¹': 'ù',
    'Ãª': 'ê',
    'Ã¢': 'â',
    'Ã´': 'ô',
    'Ã®': 'î',
    'Ã¯': 'ï',
    'Ã»': 'û',
    'Ã¼': 'ü',
    'Ã‰': 'É',
    'Ãˆ': 'È',
    'Ã€': 'À',
    'Ã‡': 'Ç',
    'â€™': "'",
    'â€œ': '"',
    'â€': '"',
    'â€¦': '...',
    'â€"': '–',
    'â€"': '—'
  }
  
  let fixed = text
  Object.entries(corrections).forEach(([wrong, correct]) => {
    fixed = fixed.replace(new RegExp(wrong, 'g'), correct)
  })
  
  return fixed
}

/**
 * Hook React pour forcer l'encodage UTF-8
 */
export const useUTF8Fix = () => {
  React.useEffect(() => {
    forceUTF8Encoding()
    
    // Observer les mutations du DOM pour forcer UTF-8 sur les nouveaux éléments
    const observer = new MutationObserver(() => {
      // Reforcer l'encodage si nécessaire
      if (!document.querySelector('meta[charset="UTF-8"]')) {
        forceUTF8Encoding()
      }
    })
    
    observer.observe(document.head, {
      childList: true,
      subtree: true
    })
    
    return () => observer.disconnect()
  }, [])
}