import { Hono } from 'npm:hono'

// Configuration des classes interdites selon les guidelines
const FORBIDDEN_CLASSES = {
  'font-size': [
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 
    'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl', 'text-9xl'
  ],
  'font-weight': [
    'font-thin', 'font-extralight', 'font-light', 'font-normal', 
    'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black'
  ],
  'line-height': [
    'leading-none', 'leading-tight', 'leading-snug', 'leading-normal',
    'leading-relaxed', 'leading-loose'
  ],
  'color-hardcoded': [
    'text-gray-', 'text-blue-', 'text-green-', 'text-red-', 'text-yellow-',
    'text-purple-', 'text-pink-', 'text-indigo-', 'text-orange-', 'text-emerald-',
    'bg-gray-', 'bg-blue-', 'bg-green-', 'bg-red-', 'bg-yellow-',
    'bg-purple-', 'bg-pink-', 'bg-indigo-', 'bg-orange-', 'bg-emerald-',
    'border-gray-', 'border-blue-', 'border-green-', 'border-red-'
  ]
}

interface TypographyIssue {
  file: string
  line: number
  type: 'font-size' | 'font-weight' | 'line-height' | 'color-hardcoded'
  className: string
  element: string
  suggestion: string
}

function getSuggestion(type: string, className: string): string {
  switch (type) {
    case 'font-size':
      return 'Utilisez les éléments HTML appropriés (h1-h6, p) sans classes Tailwind'
    case 'font-weight':
      return 'Les font-weight sont automatiquement gérés par le design system'
    case 'line-height':
      return 'Les line-height sont automatiquement définis à 1.5 par le design system'
    case 'color-hardcoded':
      if (className.includes('text-')) {
        return 'Utilisez text-primary, text-secondary, text-accent, text-muted-foreground, etc.'
      } else if (className.includes('bg-')) {
        return 'Utilisez bg-primary, bg-secondary, bg-accent, bg-background, etc.'
      } else if (className.includes('border-')) {
        return 'Utilisez border-primary, border-secondary, border-border, etc.'
      }
      return 'Utilisez les tokens du design system'
    default:
      return 'Consultez les guidelines du design system'
  }
}

function analyzeFileContent(content: string, filename: string): TypographyIssue[] {
  const issues: TypographyIssue[] = []
  const lines = content.split('\n')
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1
    
    // Chercher les éléments HTML et leurs classes
    const elementMatches = line.matchAll(/<(\w+)([^>]*className=["']([^"']*)["'][^>]*)>/g)
    
    for (const match of elementMatches) {
      const element = match[1]
      const classNames = match[3]
      
      // Vérifier chaque type de violation
      Object.entries(FORBIDDEN_CLASSES).forEach(([type, forbiddenClasses]) => {
        forbiddenClasses.forEach(forbiddenClass => {
          // Pour les couleurs avec préfixes, vérifier la correspondance partielle
          const isColorType = type === 'color-hardcoded'
          const hasViolation = isColorType 
            ? classNames.includes(forbiddenClass)
            : classNames.split(' ').includes(forbiddenClass)
          
          if (hasViolation) {
            // Trouver la classe exacte violée
            let violatedClass = forbiddenClass
            if (isColorType) {
              const colorMatch = classNames.match(new RegExp(`(${forbiddenClass}\\d+)`, 'g'))
              if (colorMatch) {
                violatedClass = colorMatch[0]
              }
            }
            
            issues.push({
              file: filename,
              line: lineNumber,
              type: type as any,
              className: violatedClass,
              element: `<${element}>`,
              suggestion: getSuggestion(type, violatedClass)
            })
          }
        })
      })
    }
  })
  
  return issues
}

// Simulation des fichiers à analyser (en réalité on lirait le système de fichiers)
const SAMPLE_FILES = {
  '/components/traveler/HomePage.tsx': `
import React from 'react'

export function HomePage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Titre conforme</h1>
      <p className="text-lg leading-relaxed text-gray-600">Paragraphe non conforme</p>
      <button className="bg-blue-500 text-white font-semibold">Bouton non conforme</button>
      <div className="bg-green-100 border-red-400">Couleurs hardcodées</div>
    </div>
  )
}
  `,
  '/components/ui/card.tsx': `
export function Card({ children, className = '' }) {
  return (
    <div className={\`bg-background border-border \${className}\`}>
      {children}
    </div>
  )
}
  `
}

export const designChecker = new Hono()

designChecker.post('/check-design-system', async (c) => {
  try {
    console.log('🔍 Début de la vérification du design system...')
    
    const allIssues: TypographyIssue[] = []
    const cleanFiles: string[] = []
    
    // Analyser chaque fichier
    Object.entries(SAMPLE_FILES).forEach(([filename, content]) => {
      console.log(`📂 Analyse de ${filename}...`)
      
      const fileIssues = analyzeFileContent(content, filename)
      
      if (fileIssues.length === 0) {
        cleanFiles.push(filename)
        console.log(`✅ ${filename} - Aucun problème`)
      } else {
        allIssues.push(...fileIssues)
        console.log(`❌ ${filename} - ${fileIssues.length} problèmes`)
      }
    })
    
    const result = {
      totalFiles: Object.keys(SAMPLE_FILES).length,
      issuesFound: allIssues.length,
      issues: allIssues,
      cleanFiles: cleanFiles
    }
    
    console.log(`📊 Résultat final:`, {
      totalFiles: result.totalFiles,
      issuesFound: result.issuesFound,
      cleanFiles: result.cleanFiles.length
    })
    
    return c.json(result)
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    return c.json({ 
      error: 'Erreur lors de la vérification du design system',
      details: error.message 
    }, 500)
  }
})

export default designChecker