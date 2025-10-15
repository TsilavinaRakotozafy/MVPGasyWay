import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Loader2,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface TypographyIssue {
  file: string
  line: number
  type: 'font-size' | 'font-weight' | 'line-height' | 'color'
  className: string
  element: string
  suggestion: string
}

interface CheckResult {
  totalFiles: number
  issuesFound: number
  issues: TypographyIssue[]
  cleanFiles: string[]
}

export function DesignSystemChecker() {
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)

  // Classes interdites selon les guidelines
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
    'color': [
      // Couleurs hardcodées communes
      'text-gray-', 'text-blue-', 'text-green-', 'text-red-', 'text-yellow-',
      'text-purple-', 'text-pink-', 'text-indigo-', 'text-orange-', 'text-emerald-',
      'bg-gray-', 'bg-blue-', 'bg-green-', 'bg-red-', 'bg-yellow-',
      'bg-purple-', 'bg-pink-', 'bg-indigo-', 'bg-orange-', 'bg-emerald-',
      'border-gray-', 'border-blue-', 'border-green-', 'border-red-'
    ]
  }

  const checkDesignSystem = async () => {
    setChecking(true)
    try {
      const response = await fetch(`https://${window.location.hostname.includes('localhost') ? 'localhost:8000' : window.location.hostname.replace('.netlify.app', '.supabase.co')}/functions/v1/make-server-3aa6b185/check-design-system`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la vérification')
      }
      
      const result = await response.json()
      setResult(result)
      
      if (result.issuesFound === 0) {
        toast.success('🎉 Aucun problème détecté ! Votre design system est conforme.')
      } else {
        toast.warning(`⚠️ ${result.issuesFound} problèmes détectés dans ${result.totalFiles} fichiers`)
      }
    } catch (error) {
      console.error('Erreur vérification design system:', error)
      toast.error('Erreur lors de la vérification du design system')
    } finally {
      setChecking(false)
    }
  }

  const fixIssue = (issue: TypographyIssue) => {
    toast.info(`🔧 Correction suggérée pour ${issue.file}:${issue.line}`)
    // Ici on pourrait implémenter une correction automatique
  }

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'font-size': return 'bg-red-100 text-red-800'
      case 'font-weight': return 'bg-orange-100 text-orange-800'
      case 'line-height': return 'bg-yellow-100 text-yellow-800'
      case 'color': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRecommendation = (type: string) => {
    switch (type) {
      case 'font-size':
        return 'Utilisez les éléments HTML appropriés (h1, h2, h3, h4, h5, h6, p) sans classes Tailwind'
      case 'font-weight':
        return 'Les font-weight sont automatiquement gérés par le design system selon l\'élément HTML'
      case 'line-height':
        return 'Les line-height sont automatiquement définis à 1.5 par le design system'
      case 'color':
        return 'Utilisez les tokens du design system : text-primary, text-secondary, text-accent, etc.'
      default:
        return 'Consultez les guidelines du design system'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Vérificateur de Design System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Scanne tous les fichiers React pour détecter les violations des guidelines du design system GasyWay.
          </p>

          <div className="space-y-4">
            <h4>Classes interdites détectées :</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5>🚫 Font Size</h5>
                <p className="text-sm text-muted-foreground">
                  text-xs, text-sm, text-lg, text-xl, etc.
                </p>
              </div>
              <div>
                <h5>🚫 Font Weight</h5>
                <p className="text-sm text-muted-foreground">
                  font-bold, font-semibold, font-medium, etc.
                </p>
              </div>
              <div>
                <h5>🚫 Line Height</h5>
                <p className="text-sm text-muted-foreground">
                  leading-none, leading-tight, leading-relaxed, etc.
                </p>
              </div>
              <div>
                <h5>🚫 Couleurs hardcodées</h5>
                <p className="text-sm text-muted-foreground">
                  text-gray-600, bg-blue-500, border-red-400, etc.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={checkDesignSystem}
            disabled={checking}
            className="w-full"
          >
            {checking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Vérification en cours...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Lancer la vérification
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.issuesFound === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              )}
              Résultats de la vérification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{result.totalFiles}</div>
                <p className="text-sm text-muted-foreground">Fichiers scannés</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${result.issuesFound === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.issuesFound}
                </div>
                <p className="text-sm text-muted-foreground">Problèmes trouvés</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.cleanFiles.length}</div>
                <p className="text-sm text-muted-foreground">Fichiers conformes</p>
              </div>
            </div>

            {result.issuesFound > 0 && (
              <div className="space-y-4">
                <h4>🚨 Problèmes détectés :</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.issues.map((issue, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getIssueColor(issue.type)}>
                              {issue.type}
                            </Badge>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {issue.file}:{issue.line}
                            </code>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm">
                              <strong>Élément :</strong> <code>{issue.element}</code>
                            </p>
                            <p className="text-sm">
                              <strong>Classe problématique :</strong> <code className="text-red-600">{issue.className}</code>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Suggestion :</strong> {issue.suggestion}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getRecommendation(issue.type)}
                            </p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fixIssue(issue)}
                        >
                          Voir correction
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {result.cleanFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Fichiers conformes :
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {result.cleanFiles.map((file, index) => (
                    <code key={index} className="text-sm bg-green-50 text-green-800 px-2 py-1 rounded">
                      {file}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}