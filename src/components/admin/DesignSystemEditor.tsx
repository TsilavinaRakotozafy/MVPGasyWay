import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Slider } from '../ui/slider'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../../utils/supabase/info'
import { useAuth } from '../../contexts/AuthContextSQL'
import { triggerDesignTokenUpdate } from '../../utils/design-system-loader'
import { 
  Palette, 
  Type, 
  Save,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  Move
} from 'lucide-react'

interface DesignTokens {
  // Couleurs principales
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  
  // Couleurs système
  background: string
  foreground: string
  muted: string
  mutedForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  
  // Typographie générale
  fontFamily: string
  fontSize: number
  fontWeightNormal: number
  fontWeightMedium: number
  
  // Typographie par élément
  h1: {
    fontSize: number
    lineHeight: number
    fontWeight: number
    textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
    letterSpacing: number
  }
  h2: {
    fontSize: number
    lineHeight: number
    fontWeight: number
    textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
    letterSpacing: number
  }
  h3: {
    fontSize: number
    lineHeight: number
    fontWeight: number
    textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
    letterSpacing: number
  }
  h4: {
    fontSize: number
    lineHeight: number
    fontWeight: number
    textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
    letterSpacing: number
  }
  h5: {
    fontSize: number
    lineHeight: number
    fontWeight: number
    textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
    letterSpacing: number
  }
  h6: {
    fontSize: number
    lineHeight: number
    fontWeight: number
    textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
    letterSpacing: number
  }
  p: {
    fontSize: number
    lineHeight: number
    fontWeight: number
    textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
    letterSpacing: number
  }
  label: {
    fontSize: number
    lineHeight: number
    fontWeight: number
    textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
    letterSpacing: number
  }
  
  // Espacements
  radiusBase: number
  spacingBase: number
}

interface ColorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
}

function ColorInput({ label, value, onChange, description }: ColorInputProps) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <div 
          className="w-12 h-10 rounded border-2 border-border cursor-pointer transition-transform hover:scale-105"
          style={{ backgroundColor: value }}
          onClick={() => document.getElementById(`color-${label}`)?.click()}
        />
        <Input
          id={`color-${label}`}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className="flex-shrink-0"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

interface TypographyControlsProps {
  label: string
  elementKey: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'label'
  tokens: DesignTokens
  onUpdate: (key: keyof DesignTokens, value: any) => void
  exampleText: string
}

function TypographyControls({ label, elementKey, tokens, onUpdate, exampleText }: TypographyControlsProps) {
  const element = tokens[elementKey]
  
  const updateElement = (property: string, value: any) => {
    onUpdate(elementKey, {
      ...element,
      [property]: value
    })
  }

  const previewStyle = {
    fontSize: `${element.fontSize}px`,
    lineHeight: element.lineHeight,
    fontWeight: element.fontWeight,
    textTransform: element.textTransform,
    letterSpacing: `${element.letterSpacing}px`,
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-medium">{label}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Configuration pour les éléments {elementKey.toUpperCase()}
            </CardDescription>
          </div>
          <div 
            className="text-sm border border-border rounded p-2 bg-background min-w-[140px]"
            style={previewStyle}
          >
            {exampleText}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Font Size */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Taille (px)</Label>
          <div className="flex items-center space-x-4">
            <Slider
              value={[element.fontSize]}
              onValueChange={([value]) => updateElement('fontSize', value)}
              max={48}
              min={10}
              step={1}
              className="flex-1"
            />
            <Badge variant="outline" className="min-w-[50px] text-xs">
              {element.fontSize}px
            </Badge>
          </div>
        </div>

        {/* Line Height */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Hauteur de ligne</Label>
          <div className="flex items-center space-x-4">
            <Slider
              value={[element.lineHeight]}
              onValueChange={([value]) => updateElement('lineHeight', value)}
              max={2.5}
              min={0.8}
              step={0.1}
              className="flex-1"
            />
            <Badge variant="outline" className="min-w-[50px] text-xs">
              {element.lineHeight}
            </Badge>
          </div>
        </div>

        {/* Font Weight */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Poids</Label>
          <div className="flex items-center space-x-4">
            <Slider
              value={[element.fontWeight]}
              onValueChange={([value]) => updateElement('fontWeight', value)}
              max={900}
              min={100}
              step={100}
              className="flex-1"
            />
            <Badge variant="outline" className="min-w-[50px] text-xs">
              {element.fontWeight}
            </Badge>
          </div>
        </div>

        {/* Text Transform */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Transformation</Label>
          <Select 
            value={element.textTransform} 
            onValueChange={(value) => updateElement('textTransform', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune</SelectItem>
              <SelectItem value="uppercase">MAJUSCULES</SelectItem>
              <SelectItem value="lowercase">minuscules</SelectItem>
              <SelectItem value="capitalize">Capitalize</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Letter Spacing */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Espacement lettres (px)</Label>
          <div className="flex items-center space-x-4">
            <Slider
              value={[element.letterSpacing]}
              onValueChange={([value]) => updateElement('letterSpacing', value)}
              max={5}
              min={-2}
              step={0.1}
              className="flex-1"
            />
            <Badge variant="outline" className="min-w-[50px] text-xs">
              {element.letterSpacing}px
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Composant PreviewSection sticky
function PreviewSection({ tokens }: { tokens: DesignTokens }) {
  return (
    <div className="sticky top-6 z-10 bg-background border border-border rounded-lg p-6 shadow-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Prévisualisation du Design System</h3>
            <p className="text-sm text-muted-foreground">Aperçu en temps réel des modifications</p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Live Preview
          </Badge>
        </div>
        
        <Separator />
        
        {/* Colors Grid */}
        <div>
          <h4 className="text-sm font-medium mb-3">Palette de couleurs</h4>
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <div className="h-8 rounded border" style={{ backgroundColor: tokens.primary }} />
              <p className="text-xs text-center">Primary</p>
            </div>
            <div className="space-y-1">
              <div className="h-8 rounded border" style={{ backgroundColor: tokens.secondary }} />
              <p className="text-xs text-center">Secondary</p>
            </div>
            <div className="space-y-1">
              <div className="h-8 rounded border" style={{ backgroundColor: tokens.accent }} />
              <p className="text-xs text-center">Accent</p>
            </div>
            <div className="space-y-1">
              <div className="h-8 rounded border" style={{ backgroundColor: tokens.destructive }} />
              <p className="text-xs text-center">Destructive</p>
            </div>
            <div className="space-y-1">
              <div className="h-8 rounded border" style={{ backgroundColor: tokens.background }} />
              <p className="text-xs text-center">Background</p>
            </div>
            <div className="space-y-1">
              <div className="h-8 rounded border" style={{ backgroundColor: tokens.muted }} />
              <p className="text-xs text-center">Muted</p>
            </div>
            <div className="space-y-1">
              <div className="h-8 rounded border" style={{ backgroundColor: tokens.foreground }} />
              <p className="text-xs text-center">Foreground</p>
            </div>
            <div className="space-y-1">
              <div className="h-8 rounded border" style={{ backgroundColor: tokens.mutedForeground }} />
              <p className="text-xs text-center">Muted Fg</p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Typography Hierarchy */}
        <div>
          <h4 className="text-sm font-medium mb-3">Hiérarchie typographique</h4>
          <div className="space-y-3">
            <div style={{
              fontSize: `${tokens.h1.fontSize}px`,
              lineHeight: tokens.h1.lineHeight,
              fontWeight: tokens.h1.fontWeight,
              textTransform: tokens.h1.textTransform,
              letterSpacing: `${tokens.h1.letterSpacing}px`,
              color: tokens.foreground
            }}>
              H1 - Titre principal de page ({tokens.h1.fontSize}px)
            </div>
            <div style={{
              fontSize: `${tokens.h2.fontSize}px`,
              lineHeight: tokens.h2.lineHeight,
              fontWeight: tokens.h2.fontWeight,
              textTransform: tokens.h2.textTransform,
              letterSpacing: `${tokens.h2.letterSpacing}px`,
              color: tokens.foreground
            }}>
              H2 - Titre de section ({tokens.h2.fontSize}px)
            </div>
            <div style={{
              fontSize: `${tokens.h3.fontSize}px`,
              lineHeight: tokens.h3.lineHeight,
              fontWeight: tokens.h3.fontWeight,
              textTransform: tokens.h3.textTransform,
              letterSpacing: `${tokens.h3.letterSpacing}px`,
              color: tokens.foreground
            }}>
              H3 - Sous-titre ({tokens.h3.fontSize}px)
            </div>
            <div style={{
              fontSize: `${tokens.h4.fontSize}px`,
              lineHeight: tokens.h4.lineHeight,
              fontWeight: tokens.h4.fontWeight,
              textTransform: tokens.h4.textTransform,
              letterSpacing: `${tokens.h4.letterSpacing}px`,
              color: tokens.foreground
            }}>
              H4 - Titre de composant ({tokens.h4.fontSize}px)
            </div>
            <div style={{
              fontSize: `${tokens.h5.fontSize}px`,
              lineHeight: tokens.h5.lineHeight,
              fontWeight: tokens.h5.fontWeight,
              textTransform: tokens.h5.textTransform,
              letterSpacing: `${tokens.h5.letterSpacing}px`,
              color: tokens.foreground
            }}>
              H5 - Sous-composant ({tokens.h5.fontSize}px)
            </div>
            <div style={{
              fontSize: `${tokens.h6.fontSize}px`,
              lineHeight: tokens.h6.lineHeight,
              fontWeight: tokens.h6.fontWeight,
              textTransform: tokens.h6.textTransform,
              letterSpacing: `${tokens.h6.letterSpacing}px`,
              color: tokens.foreground
            }}>
              H6 - Détail/label ({tokens.h6.fontSize}px)
            </div>
            <div style={{
              fontSize: `${tokens.p.fontSize}px`,
              lineHeight: tokens.p.lineHeight,
              fontWeight: tokens.p.fontWeight,
              textTransform: tokens.p.textTransform,
              letterSpacing: `${tokens.p.letterSpacing}px`,
              color: tokens.foreground
            }}>
              P - Texte standard ({tokens.p.fontSize}px)
            </div>
            <div style={{
              fontSize: `${tokens.label.fontSize}px`,
              lineHeight: tokens.label.lineHeight,
              fontWeight: tokens.label.fontWeight,
              textTransform: tokens.label.textTransform,
              letterSpacing: `${tokens.label.letterSpacing}px`,
              color: tokens.foreground
            }}>
              Label - Libellé de champ ({tokens.label.fontSize}px)
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Button System Preview */}
        <div>
          <h4 className="text-sm font-medium mb-3">Système de boutons GasyWay</h4>
          <div className="space-y-4">
            {/* Primary Button */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">1er choix</Badge>
                <span className="text-sm font-medium">Primary</span>
              </div>
              <div className="flex gap-2 items-center">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200">
                  Action principale
                </Button>
                <span className="text-xs text-muted-foreground">→ Actions principales, navigation</span>
              </div>
            </div>

            {/* Outline Button */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">2ème choix</Badge>
                <span className="text-sm font-medium">Outline</span>
              </div>
              <div className="flex gap-2 items-center">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200">
                  Action secondaire
                </Button>
                <span className="text-xs text-muted-foreground">→ Actions secondaires, alternatives</span>
              </div>
            </div>

            {/* Accent Button */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">3ème choix</Badge>
                <span className="text-sm font-medium">Accent (Accessibilité)</span>
              </div>
              <div className="flex gap-2 items-center">
                <Button variant="accent" className="bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200">
                  CTA Important
                </Button>
                <span className="text-xs text-muted-foreground">→ Uniquement si primary/outline impossibles</span>
              </div>
            </div>

            {/* Destructive Button */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-destructive/20 text-destructive bg-destructive/5">Spécialisé</Badge>
                <span className="text-sm font-medium">Destructive</span>
              </div>
              <div className="flex gap-2 items-center">
                <Button variant="destructive" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all duration-200">
                  Supprimer
                </Button>
                <span className="text-xs text-muted-foreground">→ Actions destructives uniquement</span>
              </div>
            </div>

            {/* Glass Button */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-accent/20 text-accent bg-accent/5">Nouveau</Badge>
                <span className="text-sm font-medium">Glass (Images sombres)</span>
              </div>
              <div className="flex gap-2 items-center">
                <div className="relative p-6 rounded-lg" style={{
                  backgroundImage: 'linear-gradient(135deg, #0d4047 0%, #1a1a1a 100%)',
                  backgroundSize: 'cover'
                }}>
                  <Button variant="glass" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-primary transition-all duration-200">
                    Voir les destinations
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">→ Sur images sombres uniquement</span>
              </div>
            </div>

            {/* Button States Demo */}
            <div className="space-y-2">
              <span className="text-sm font-medium">États et transitions</span>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">États normaux</div>
                  <div className="space-y-1">
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200">
                      Normal
                    </Button>
                    <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200">
                      Outline
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">États disabled</div>
                  <div className="space-y-1">
                    <Button size="sm" disabled className="w-full bg-primary text-primary-foreground transition-all duration-200">
                      Disabled
                    </Button>
                    <Button size="sm" variant="outline" disabled className="w-full border-primary text-primary transition-all duration-200">
                      Outline Disabled
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Button Sizes */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Tailles disponibles</span>
              <div className="flex gap-2 items-end">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200">
                  Small
                </Button>
                <Button size="default" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200">
                  Default
                </Button>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200">
                  Large
                </Button>
                <Button size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200">
                  <Move className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Cards Preview */}
        <div>
          <h4 className="text-sm font-medium mb-3">Composants Cards</h4>
          <div className="space-y-3">
            
            <div 
              className="p-4 border rounded"
              style={{ 
                backgroundColor: tokens.background,
                borderColor: tokens.border,
                borderRadius: `${tokens.radiusBase}px`
              }}
            >
              <div 
                className="font-medium mb-2"
                style={{ 
                  fontSize: `${tokens.h4.fontSize}px`,
                  color: tokens.foreground 
                }}
              >
                Card Example
              </div>
              <div 
                className="text-sm"
                style={{ 
                  color: tokens.mutedForeground,
                  fontSize: `${tokens.p.fontSize}px`
                }}
              >
                Exemple de card avec les couleurs du design system appliquées
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Spacing Preview */}
        <div>
          <h4 className="text-sm font-medium mb-3">Espacements</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-sm min-w-[80px]">Radius:</span>
              <div 
                className="w-8 h-8 bg-primary"
                style={{ borderRadius: `${tokens.radiusBase}px` }}
              />
              <Badge variant="outline" className="text-xs">
                {tokens.radiusBase}px
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm min-w-[80px]">Spacing:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(multiplier => (
                  <div 
                    key={multiplier}
                    className="bg-secondary"
                    style={{ 
                      width: `${tokens.spacingBase * multiplier}px`,
                      height: '16px'
                    }}
                  />
                ))}
              </div>
              <Badge variant="outline" className="text-xs">
                Base: {tokens.spacingBase}px
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Valeurs par défaut GasyWay
const DEFAULT_TOKENS: DesignTokens = {
  primary: '#0d4047',
  primaryForeground: '#ffffff',
  secondary: '#c6e5de', 
  secondaryForeground: '#0d4047',
  accent: '#bcdc49',
  accentForeground: '#0d4047',
  
  background: '#ffffff',
  foreground: '#0d4047',
  muted: '#ececf0',
  mutedForeground: '#717182',
  destructive: '#d4183d',
  destructiveForeground: '#ffffff',
  border: 'rgba(0, 0, 0, 0.1)',
  
  fontFamily: 'Outfit',
  fontSize: 16,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  
  h1: {
    fontSize: 24,
    lineHeight: 1.5,
    fontWeight: 500,
    textTransform: 'none',
    letterSpacing: 0
  },
  h2: {
    fontSize: 20,
    lineHeight: 1.5,
    fontWeight: 500,
    textTransform: 'none',
    letterSpacing: 0
  },
  h3: {
    fontSize: 18,
    lineHeight: 1.5,
    fontWeight: 500,
    textTransform: 'none',
    letterSpacing: 0
  },
  h4: {
    fontSize: 16,
    lineHeight: 1.5,
    fontWeight: 500,
    textTransform: 'none',
    letterSpacing: 0
  },
  h5: {
    fontSize: 14,
    lineHeight: 1.5,
    fontWeight: 500,
    textTransform: 'none',
    letterSpacing: 0
  },
  h6: {
    fontSize: 12,
    lineHeight: 1.5,
    fontWeight: 500,
    textTransform: 'none',
    letterSpacing: 0
  },
  p: {
    fontSize: 16,
    lineHeight: 1.5,
    fontWeight: 400,
    textTransform: 'none',
    letterSpacing: 0
  },
  label: {
    fontSize: 16,
    lineHeight: 1.5,
    fontWeight: 500,
    textTransform: 'none',
    letterSpacing: 0
  },
  
  radiusBase: 10,
  spacingBase: 16
}

export function DesignSystemEditor() {
  const { session } = useAuth()
  const [tokens, setTokens] = useState<DesignTokens>(DEFAULT_TOKENS)
  const [originalTokens, setOriginalTokens] = useState<DesignTokens>(DEFAULT_TOKENS)
  const [hasChanges, setHasChanges] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cleaning, setCleaning] = useState(false)

  // ✅ Fonction de détection des changements simplifiée et CORRIGÉE
  const updateToken = useCallback((key: keyof DesignTokens, value: any) => {
    setTokens(prev => {
      const newTokens = { ...prev, [key]: value }
      
      // 🎯 Détection immédiate des changements avec deep compare
      const hasChanged = JSON.stringify(newTokens) !== JSON.stringify(originalTokens)
      setHasChanges(hasChanged)
      
      console.log(`🎨 Modification ${key}:`, value, `| Changements: ${hasChanged}`)
      
      return newTokens
    })
  }, [originalTokens])

  // Charger les tokens au montage du composant
  useEffect(() => {
    const loadTokens = async () => {
      if (!session?.access_token) return
      
      try {
        // Essayer de charger depuis la base via le serveur
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/admin/design-tokens/current`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.tokens) {
            setTokens(result.tokens)
            setOriginalTokens(result.tokens)
            setHasChanges(false)
            console.log('🎨 Tokens chargés depuis la base:', result.tokens)
            
            // Appliquer immédiatement les tokens au CSS
            applyTokensToCSS(result.tokens)
          }
        } else {
          console.log('🎨 Aucun thème trouvé, utilisation des valeurs par défaut')
        }
      } catch (error) {
        console.error('Erreur chargement tokens:', error)
        toast.error('Erreur lors du chargement du thème')
      }
    }

    loadTokens()
  }, [session?.access_token])

  // Fonction pour appliquer les tokens au CSS immédiatement
  const applyTokensToCSS = (newTokens: DesignTokens) => {
    const root = document.documentElement
    
    // Appliquer les couleurs
    root.style.setProperty('--primary', newTokens.primary)
    root.style.setProperty('--primary-foreground', newTokens.primaryForeground)
    root.style.setProperty('--secondary', newTokens.secondary)
    root.style.setProperty('--secondary-foreground', newTokens.secondaryForeground)
    root.style.setProperty('--accent', newTokens.accent)
    root.style.setProperty('--accent-foreground', newTokens.accentForeground)
    root.style.setProperty('--background', newTokens.background)
    root.style.setProperty('--foreground', newTokens.foreground)
    root.style.setProperty('--muted', newTokens.muted)
    root.style.setProperty('--muted-foreground', newTokens.mutedForeground)
    root.style.setProperty('--destructive', newTokens.destructive)
    root.style.setProperty('--destructive-foreground', newTokens.destructiveForeground)
    root.style.setProperty('--border', newTokens.border)
    
    // Appliquer la typographie
    root.style.setProperty('--font-family', newTokens.fontFamily)
    root.style.setProperty('--font-size', `${newTokens.fontSize}px`)
    root.style.setProperty('--font-weight-normal', newTokens.fontWeightNormal.toString())
    root.style.setProperty('--font-weight-medium', newTokens.fontWeightMedium.toString())
    
    // Appliquer les tailles de texte
    root.style.setProperty('--text-xs', `${newTokens.h6.fontSize}px`)
    root.style.setProperty('--text-sm', `${newTokens.h5.fontSize}px`)
    root.style.setProperty('--text-base', `${newTokens.p.fontSize}px`)
    root.style.setProperty('--text-lg', `${newTokens.h3.fontSize}px`)
    root.style.setProperty('--text-xl', `${newTokens.h2.fontSize}px`)
    root.style.setProperty('--text-2xl', `${newTokens.h1.fontSize}px`)
    
    // Appliquer les espacements
    root.style.setProperty('--radius', `${newTokens.radiusBase}px`)
  }

  // Fonction pour sauvegarder les modifications
  const handleSave = async () => {
    if (!session?.access_token) {
      toast.error('Vous devez être connecté pour sauvegarder')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/admin/design-tokens/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ tokens })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setOriginalTokens({...tokens})
        setHasChanges(false)
        toast.success('🎨 Design system modifié avec succès !')
        
        // Appliquer les changements immédiatement dans le CSS
        applyTokensToCSS(tokens)
        
        // Déclencher la mise à jour globale du design system
        triggerDesignTokenUpdate(tokens)
      } else {
        throw new Error(result.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur sauvegarde design system:', error)
      toast.error(`Erreur : ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour restaurer les valeurs d'origine
  const handleReset = () => {
    setTokens({...originalTokens})
    setHasChanges(false)
    toast.success('Modifications annulées')
  }

  // Fonction pour nettoyer les doublons
  const handleCleanupDuplicates = async () => {
    if (!session?.access_token) {
      toast.error('Vous devez être connecté')
      return
    }

    setCleaning(true)
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/admin/design-tokens/cleanup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(`🧹 ${result.message}`)
        console.log('Nettoyage terminé:', result)
        
        // Recharger les tokens après nettoyage
        await loadTokens()
      } else {
        throw new Error(result.error || 'Erreur lors du nettoyage')
      }
    } catch (error) {
      console.error('Erreur nettoyage design tokens:', error)
      toast.error(`Erreur nettoyage : ${error.message}`)
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header avec badge et boutons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1>Éditeur de Design System</h1>
            <p className="text-muted-foreground">
              Personnalisez les couleurs, typographie et espacements de GasyWay
            </p>
          </div>
          
          {/* Badge statut */}
          <Badge 
            variant={hasChanges ? "destructive" : "outline"}
            className={`gap-2 ${hasChanges ? 'animate-pulse' : ''}`}
          >
            <div className={`w-2 h-2 rounded-full ${hasChanges ? 'bg-current' : 'bg-green-500'}`} />
            {hasChanges ? 'Modifications non sauvegardées' : 'À jour'}
          </Badge>
        </div>

        {/* Boutons d'action principaux */}
        <div className="flex gap-4 items-center">
          {/* Bouton de nettoyage des doublons */}
          <Button
            variant="outline"
            onClick={handleCleanupDuplicates}
            disabled={cleaning}
            className="gap-2 border-orange-200 text-orange-600 hover:bg-orange-50"
            title="Nettoyer les doublons dans la base de données"
          >
            {cleaning ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {cleaning ? 'Nettoyage...' : 'Nettoyer doublons'}
          </Button>

          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2"
              title="Annuler toutes les modifications non sauvegardées"
            >
              <RotateCcw className="h-4 w-4" />
              Annuler
            </Button>
          )}
          
          <Button
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className={`gap-2 ${hasChanges 
              ? 'bg-accent hover:bg-accent/90 text-accent-foreground' 
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {hasChanges ? 'Enregistrer les modifications' : 'Aucune modification'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale avec tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="colors" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors" className="gap-2">
                <Palette className="h-4 w-4" />
                Couleurs
              </TabsTrigger>
              <TabsTrigger value="typography" className="gap-2">
                <Type className="h-4 w-4" />
                Typographie
              </TabsTrigger>
              <TabsTrigger value="spacing" className="gap-2">
                <Move className="h-4 w-4" />
                Espacements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-6">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Couleurs principales</CardTitle>
                  <CardDescription>
                    Couleurs de base du système GasyWay
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ColorInput
                      label="Couleur primaire"
                      value={tokens.primary}
                      onChange={(value) => updateToken('primary', value)}
                      description="Navigation, actions principales"
                    />
                    <ColorInput
                      label="Texte primaire"
                      value={tokens.primaryForeground}
                      onChange={(value) => updateToken('primaryForeground', value)}
                      description="Texte sur fond primaire"
                    />
                    <ColorInput
                      label="Couleur secondaire"
                      value={tokens.secondary}
                      onChange={(value) => updateToken('secondary', value)}
                      description="Arrière-plans subtils"
                    />
                    <ColorInput
                      label="Texte secondaire"
                      value={tokens.secondaryForeground}
                      onChange={(value) => updateToken('secondaryForeground', value)}
                      description="Texte sur fond secondaire"
                    />
                    <ColorInput
                      label="Couleur accent"
                      value={tokens.accent}
                      onChange={(value) => updateToken('accent', value)}
                      description="CTA importants, highlights"
                    />
                    <ColorInput
                      label="Texte accent"
                      value={tokens.accentForeground}
                      onChange={(value) => updateToken('accentForeground', value)}
                      description="Texte sur fond accent"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Couleurs système</CardTitle>
                  <CardDescription>
                    Couleurs de base et état du système
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ColorInput
                      label="Arrière-plan"
                      value={tokens.background}
                      onChange={(value) => updateToken('background', value)}
                      description="Fond principal des pages"
                    />
                    <ColorInput
                      label="Texte principal"
                      value={tokens.foreground}
                      onChange={(value) => updateToken('foreground', value)}
                      description="Couleur de texte principale"
                    />
                    <ColorInput
                      label="Fond atténué"
                      value={tokens.muted}
                      onChange={(value) => updateToken('muted', value)}
                      description="Fonds subtils"
                    />
                    <ColorInput
                      label="Texte atténué"
                      value={tokens.mutedForeground}
                      onChange={(value) => updateToken('mutedForeground', value)}
                      description="Texte secondaire"
                    />
                    <ColorInput
                      label="Couleur destructive"
                      value={tokens.destructive}
                      onChange={(value) => updateToken('destructive', value)}
                      description="Erreurs, suppressions"
                    />
                    <ColorInput
                      label="Texte destructif"
                      value={tokens.destructiveForeground}
                      onChange={(value) => updateToken('destructiveForeground', value)}
                      description="Texte sur fond destructif"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typography" className="space-y-6">
              {/* Typographie générale */}
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Configuration générale</CardTitle>
                  <CardDescription>
                    Paramètres généraux de typographie
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Police de caractères</Label>
                      <Input
                        value={tokens.fontFamily}
                        onChange={(e) => updateToken('fontFamily', e.target.value)}
                        placeholder="Outfit"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taille de base (px)</Label>
                      <div className="flex items-center space-x-4">
                        <Slider
                          value={[tokens.fontSize]}
                          onValueChange={([value]) => updateToken('fontSize', value)}
                          max={20}
                          min={12}
                          step={1}
                          className="flex-1"
                        />
                        <Badge variant="outline" className="min-w-[50px]">
                          {tokens.fontSize}px
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Poids normal</Label>
                      <div className="flex items-center space-x-4">
                        <Slider
                          value={[tokens.fontWeightNormal]}
                          onValueChange={([value]) => updateToken('fontWeightNormal', value)}
                          max={900}
                          min={100}
                          step={100}
                          className="flex-1"
                        />
                        <Badge variant="outline" className="min-w-[50px]">
                          {tokens.fontWeightNormal}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Poids medium</Label>
                      <div className="flex items-center space-x-4">
                        <Slider
                          value={[tokens.fontWeightMedium]}
                          onValueChange={([value]) => updateToken('fontWeightMedium', value)}
                          max={900}
                          min={100}
                          step={100}
                          className="flex-1"
                        />
                        <Badge variant="outline" className="min-w-[50px]">
                          {tokens.fontWeightMedium}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hiérarchie typographique */}
              <div className="grid gap-6">
                <TypographyControls
                  label="Titre H1"
                  elementKey="h1"
                  tokens={tokens}
                  onUpdate={updateToken}
                  exampleText="Titre principal"
                />
                <TypographyControls
                  label="Titre H2"
                  elementKey="h2"
                  tokens={tokens}
                  onUpdate={updateToken}
                  exampleText="Titre section"
                />
                <TypographyControls
                  label="Titre H3"
                  elementKey="h3"
                  tokens={tokens}
                  onUpdate={updateToken}
                  exampleText="Sous-titre"
                />
                <TypographyControls
                  label="Titre H4"
                  elementKey="h4"
                  tokens={tokens}
                  onUpdate={updateToken}
                  exampleText="Titre composant"
                />
                <TypographyControls
                  label="Titre H5"
                  elementKey="h5"
                  tokens={tokens}
                  onUpdate={updateToken}
                  exampleText="Sous-composant"
                />
                <TypographyControls
                  label="Titre H6"
                  elementKey="h6"
                  tokens={tokens}
                  onUpdate={updateToken}
                  exampleText="Détail/label"
                />
                <TypographyControls
                  label="Paragraphe"
                  elementKey="p"
                  tokens={tokens}
                  onUpdate={updateToken}
                  exampleText="Texte standard"
                />
                <TypographyControls
                  label="Label"
                  elementKey="label"
                  tokens={tokens}
                  onUpdate={updateToken}
                  exampleText="Libellé de champ"
                />
              </div>
            </TabsContent>

            <TabsContent value="spacing" className="space-y-6">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Espacements</CardTitle>
                  <CardDescription>
                    Configurez les rayons et espacements de base
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                  <div className="space-y-4">
                    <Label>Rayon de base (px)</Label>
                    <div className="flex items-center space-x-4">
                      <Slider
                        value={[tokens.radiusBase]}
                        onValueChange={([value]) => updateToken('radiusBase', value)}
                        max={20}
                        min={0}
                        step={1}
                        className="flex-1"
                      />
                      <Badge variant="outline" className="min-w-[60px]">
                        {tokens.radiusBase}px
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Label>Espacement de base (px)</Label>
                    <div className="flex items-center space-x-4">
                      <Slider
                        value={[tokens.spacingBase]}
                        onValueChange={([value]) => updateToken('spacingBase', value)}
                        max={32}
                        min={8}
                        step={4}
                        className="flex-1"
                      />
                      <Badge variant="outline" className="min-w-[60px]">
                        {tokens.spacingBase}px
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Colonne Preview */}
        <div className="lg:col-span-1">
          <PreviewSection tokens={tokens} />
        </div>
      </div>
    </div>
  )
}