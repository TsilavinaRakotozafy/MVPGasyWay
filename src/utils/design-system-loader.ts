import { supabase, createClient } from './supabase/client'
import { projectId, publicAnonKey } from './supabase/info'

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

/**
 * Charger les design tokens depuis Supabase
 * 
 * COMPORTEMENT :
 * - Si succès : retourne les tokens depuis Supabase (écrasent les valeurs CSS initiales)
 * - Si échec : retourne null (les valeurs CSS initiales restent actives)
 * - Logs clairs pour debugging
 */
export async function loadDesignTokens(): Promise<DesignTokens | null> {
  // ⚠️ Ne rien faire côté serveur (build-time)
  if (typeof window === 'undefined') {
    return null
  }
  
  console.log('🎨 [Loader] Chargement des design tokens depuis Supabase...')
  
  try {
    // Charger via l'endpoint serveur
    const url = `https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/design-tokens/active`
    console.log('🎨 [Loader] URL:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    })

    console.log('🎨 [Loader] Status HTTP:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
      console.error('❌ [Loader] Échec chargement serveur:', errorData)
      console.warn('⚠️ [Loader] Les valeurs INITIALES du CSS restent actives')
      return null
    }

    const result = await response.json()
    console.log('🎨 [Loader] Réponse serveur:', result)

    if (!result.success || !result.tokens) {
      console.error('❌ [Loader] Format de réponse invalide:', result)
      console.warn('⚠️ [Loader] Les valeurs INITIALES du CSS restent actives')
      return null
    }

    console.log('✅ [Loader] Design tokens chargés avec succès depuis Supabase')
    console.log('✅ [Loader] Les valeurs initiales CSS seront ÉCRASÉES par les valeurs dynamiques')
    return result.tokens as DesignTokens

  } catch (error) {
    console.error('❌ [Loader] Erreur critique lors du chargement:', error)
    console.warn('⚠️ [Loader] Les valeurs INITIALES du CSS restent actives')
    console.warn('⚠️ [Loader] Vérifiez : 1) Table design_tokens existe, 2) Un thème est actif, 3) RLS autorise lecture')
    return null
  }
}

/**
 * Appliquer les design tokens au CSS
 */
export function applyDesignTokensToCSS(tokens: DesignTokens): void {
  try {
    console.log('🎨 Application des design tokens au CSS...')
    const root = document.documentElement
    
    // Appliquer les couleurs principales
    root.style.setProperty('--primary', tokens.primary)
    root.style.setProperty('--primary-foreground', tokens.primaryForeground)
    root.style.setProperty('--secondary', tokens.secondary)
    root.style.setProperty('--secondary-foreground', tokens.secondaryForeground)
    root.style.setProperty('--accent', tokens.accent)
    root.style.setProperty('--accent-foreground', tokens.accentForeground)
    
    // Appliquer les couleurs système
    root.style.setProperty('--background', tokens.background)
    root.style.setProperty('--foreground', tokens.foreground)
    root.style.setProperty('--muted', tokens.muted)
    root.style.setProperty('--muted-foreground', tokens.mutedForeground)
    root.style.setProperty('--destructive', tokens.destructive)
    root.style.setProperty('--destructive-foreground', tokens.destructiveForeground)
    root.style.setProperty('--border', tokens.border)
    
    // Appliquer la typographie générale
    root.style.setProperty('--font-family', `'${tokens.fontFamily}', sans-serif`)
    root.style.setProperty('--font-size', `${tokens.fontSize}px`)
    root.style.setProperty('--font-weight-normal', tokens.fontWeightNormal.toString())
    root.style.setProperty('--font-weight-medium', tokens.fontWeightMedium.toString())
    
    // Appliquer les tailles typographiques pour compatibilité avec les anciennes variables
    root.style.setProperty('--text-xs', `${tokens.h6.fontSize}px`)
    root.style.setProperty('--text-sm', `${tokens.h5.fontSize}px`)
    root.style.setProperty('--text-base', `${tokens.p.fontSize}px`)
    root.style.setProperty('--text-lg', `${tokens.h3.fontSize}px`)
    root.style.setProperty('--text-xl', `${tokens.h2.fontSize}px`)
    root.style.setProperty('--text-2xl', `${tokens.h1.fontSize}px`)
    
    // Appliquer les variables typographiques personnalisées pour chaque élément
    root.style.setProperty('--text-h1-size', `${tokens.h1.fontSize}px`)
    root.style.setProperty('--text-h1-line-height', tokens.h1.lineHeight.toString())
    root.style.setProperty('--text-h1-weight', tokens.h1.fontWeight.toString())
    root.style.setProperty('--text-h1-transform', tokens.h1.textTransform)
    root.style.setProperty('--text-h1-spacing', `${tokens.h1.letterSpacing}px`)
    
    root.style.setProperty('--text-h2-size', `${tokens.h2.fontSize}px`)
    root.style.setProperty('--text-h2-line-height', tokens.h2.lineHeight.toString())
    root.style.setProperty('--text-h2-weight', tokens.h2.fontWeight.toString())
    root.style.setProperty('--text-h2-transform', tokens.h2.textTransform)
    root.style.setProperty('--text-h2-spacing', `${tokens.h2.letterSpacing}px`)
    
    root.style.setProperty('--text-h3-size', `${tokens.h3.fontSize}px`)
    root.style.setProperty('--text-h3-line-height', tokens.h3.lineHeight.toString())
    root.style.setProperty('--text-h3-weight', tokens.h3.fontWeight.toString())
    root.style.setProperty('--text-h3-transform', tokens.h3.textTransform)
    root.style.setProperty('--text-h3-spacing', `${tokens.h3.letterSpacing}px`)
    
    root.style.setProperty('--text-h4-size', `${tokens.h4.fontSize}px`)
    root.style.setProperty('--text-h4-line-height', tokens.h4.lineHeight.toString())
    root.style.setProperty('--text-h4-weight', tokens.h4.fontWeight.toString())
    root.style.setProperty('--text-h4-transform', tokens.h4.textTransform)
    root.style.setProperty('--text-h4-spacing', `${tokens.h4.letterSpacing}px`)
    
    root.style.setProperty('--text-h5-size', `${tokens.h5.fontSize}px`)
    root.style.setProperty('--text-h5-line-height', tokens.h5.lineHeight.toString())
    root.style.setProperty('--text-h5-weight', tokens.h5.fontWeight.toString())
    root.style.setProperty('--text-h5-transform', tokens.h5.textTransform)
    root.style.setProperty('--text-h5-spacing', `${tokens.h5.letterSpacing}px`)
    
    root.style.setProperty('--text-h6-size', `${tokens.h6.fontSize}px`)
    root.style.setProperty('--text-h6-line-height', tokens.h6.lineHeight.toString())
    root.style.setProperty('--text-h6-weight', tokens.h6.fontWeight.toString())
    root.style.setProperty('--text-h6-transform', tokens.h6.textTransform)
    root.style.setProperty('--text-h6-spacing', `${tokens.h6.letterSpacing}px`)
    
    root.style.setProperty('--text-p-size', `${tokens.p.fontSize}px`)
    root.style.setProperty('--text-p-line-height', tokens.p.lineHeight.toString())
    root.style.setProperty('--text-p-weight', tokens.p.fontWeight.toString())
    root.style.setProperty('--text-p-transform', tokens.p.textTransform)
    root.style.setProperty('--text-p-spacing', `${tokens.p.letterSpacing}px`)
    
    root.style.setProperty('--text-label-size', `${tokens.label.fontSize}px`)
    root.style.setProperty('--text-label-line-height', tokens.label.lineHeight.toString())
    root.style.setProperty('--text-label-weight', tokens.label.fontWeight.toString())
    root.style.setProperty('--text-label-transform', tokens.label.textTransform)
    root.style.setProperty('--text-label-spacing', `${tokens.label.letterSpacing}px`)
    
    // Appliquer les espacements
    root.style.setProperty('--radius', `${tokens.radiusBase}px`)
    
    console.log('✅ Design tokens appliqués avec succès au CSS')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application des design tokens au CSS:', error)
  }
}

/**
 * Initialiser le design system (à appeler au démarrage de l'app)
 */
export async function initializeDesignSystem(): Promise<void> {
  // ⚠️ Ne rien faire côté serveur (build-time)
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    console.log('🚀 [Loader] Initialisation du design system GasyWay...')
    
    const tokens = await loadDesignTokens()
    
    if (tokens) {
      applyDesignTokensToCSS(tokens)
      console.log('✅ [Loader] Design system initialisé avec succès - Tokens Supabase appliqués')
    } else {
      console.warn('⚠️ [Loader] Design system initialisé en mode FALLBACK - Valeurs CSS initiales utilisées')
      console.warn('⚠️ [Loader] L\'application fonctionne mais utilise les valeurs par défaut')
    }
    
  } catch (error) {
    console.error('❌ [Loader] Erreur lors de l\'initialisation du design system:', error)
    console.warn('⚠️ [Loader] Application continue avec les valeurs CSS initiales')
  }
}

/**
 * Écouter les changements de design tokens et les appliquer en temps réel
 */
export function watchDesignTokenChanges(): void {
  // Écouter les événements personnalisés pour les mises à jour en temps réel
  document.addEventListener('design-tokens-updated', (event: CustomEvent) => {
    const tokens = event.detail as DesignTokens
    applyDesignTokensToCSS(tokens)
    console.log('🔄 Design tokens mis à jour en temps réel')
  })
}

/**
 * Déclencher une mise à jour des design tokens
 */
export function triggerDesignTokenUpdate(tokens: DesignTokens): void {
  const event = new CustomEvent('design-tokens-updated', { detail: tokens })
  document.dispatchEvent(event)
}