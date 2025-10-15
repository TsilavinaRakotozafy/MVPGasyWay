import { createClient } from 'jsr:@supabase/supabase-js@2'

// Client Supabase pour les opérations de design tokens
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Interface pour les design tokens (doit correspondre à celle du frontend)
export interface DesignTokens {
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

export interface DesignTokenRecord {
  id: string
  name: string
  description?: string
  tokens: DesignTokens
  is_active: boolean
  is_default: boolean
  version: number
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * Récupérer tous les design tokens
 */
export async function getAllDesignTokens(includeInactive = false) {
  try {
    let query = supabase
      .from('design_tokens')
      .select(`
        id,
        name,
        description,
        tokens,
        is_active,
        is_default,
        version,
        created_by,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (!includeInactive) {
      query = query.or('is_active.eq.true,is_default.eq.true')
    }

    const { data: tokens, error } = await query

    if (error) {
      console.error('❌ Erreur récupération design tokens:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ ${tokens?.length || 0} design tokens récupérés`)
    return { success: true, tokens: tokens || [] }
  } catch (error: any) {
    console.error('❌ Erreur getAllDesignTokens:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Récupérer le design token actif
 */
export async function getActiveDesignToken() {
  try {
    const { data: token, error } = await supabase
      .from('design_tokens')
      .select(`
        id,
        name,
        description,
        tokens,
        is_active,
        is_default,
        version,
        created_by,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .single()

    if (error) {
      // Si aucun token actif, essayer de récupérer le token par défaut
      if (error.code === 'PGRST116') {
        console.log('⚠️ Aucun token actif, récupération du token par défaut')
        return getDefaultDesignToken()
      }
      console.error('❌ Erreur récupération token actif:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Design token actif récupéré:', token.name)
    return { success: true, token }
  } catch (error: any) {
    console.error('❌ Erreur getActiveDesignToken:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Récupérer le design token par défaut
 */
export async function getDefaultDesignToken() {
  try {
    const { data: token, error } = await supabase
      .from('design_tokens')
      .select(`
        id,
        name,
        description,
        tokens,
        is_active,
        is_default,
        version,
        created_by,
        created_at,
        updated_at
      `)
      .eq('is_default', true)
      .single()

    if (error) {
      console.error('❌ Erreur récupération token par défaut:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Design token par défaut récupéré:', token.name)
    return { success: true, token }
  } catch (error: any) {
    console.error('❌ Erreur getDefaultDesignToken:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Créer un nouveau design token
 */
export async function createDesignToken(
  name: string,
  tokens: DesignTokens,
  description?: string,
  createdBy?: string
) {
  try {
    const { data: newToken, error } = await supabase
      .from('design_tokens')
      .insert({
        name,
        description,
        tokens,
        is_active: false,
        is_default: false,
        created_by: createdBy
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur création design token:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Design token créé:', newToken.name)
    return { success: true, token: newToken }
  } catch (error: any) {
    console.error('❌ Erreur createDesignToken:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Mettre à jour un design token existant
 */
export async function updateDesignToken(
  tokenId: string,
  updates: Partial<{
    name: string
    description: string
    tokens: DesignTokens
  }>
) {
  try {
    const { data: updatedToken, error } = await supabase
      .from('design_tokens')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenId)
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur mise à jour design token:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Design token mis à jour:', updatedToken.name)
    return { success: true, token: updatedToken }
  } catch (error: any) {
    console.error('❌ Erreur updateDesignToken:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Activer un design token (désactive automatiquement les autres)
 */
export async function activateDesignToken(tokenId: string) {
  try {
    const { data: activatedToken, error } = await supabase
      .from('design_tokens')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenId)
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur activation design token:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Design token activé:', activatedToken.name)
    return { success: true, token: activatedToken }
  } catch (error: any) {
    console.error('❌ Erreur activateDesignToken:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Marquer un design token comme par défaut
 */
export async function setDefaultDesignToken(tokenId: string) {
  try {
    const { data: defaultToken, error } = await supabase
      .from('design_tokens')
      .update({ 
        is_default: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenId)
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur définition token par défaut:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Design token défini comme par défaut:', defaultToken.name)
    return { success: true, token: defaultToken }
  } catch (error: any) {
    console.error('❌ Erreur setDefaultDesignToken:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Supprimer un design token
 */
export async function deleteDesignToken(tokenId: string) {
  try {
    // Vérifier qu'on ne supprime pas le token actif ou par défaut
    const { data: tokenToDelete, error: fetchError } = await supabase
      .from('design_tokens')
      .select('name, is_active, is_default')
      .eq('id', tokenId)
      .single()

    if (fetchError) {
      console.error('❌ Erreur récupération token à supprimer:', fetchError)
      return { success: false, error: fetchError.message }
    }

    if (tokenToDelete.is_active) {
      return { 
        success: false, 
        error: 'Impossible de supprimer le design token actif. Activez d\'abord un autre token.' 
      }
    }

    if (tokenToDelete.is_default) {
      return { 
        success: false, 
        error: 'Impossible de supprimer le design token par défaut. Définissez d\'abord un autre token par défaut.' 
      }
    }

    const { error } = await supabase
      .from('design_tokens')
      .delete()
      .eq('id', tokenId)

    if (error) {
      console.error('❌ Erreur suppression design token:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Design token supprimé:', tokenToDelete.name)
    return { success: true, message: 'Design token supprimé avec succès' }
  } catch (error: any) {
    console.error('❌ Erreur deleteDesignToken:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Dupliquer un design token
 */
export async function duplicateDesignToken(
  tokenId: string,
  newName: string,
  createdBy?: string
) {
  try {
    // Récupérer le token original
    const { data: originalToken, error: fetchError } = await supabase
      .from('design_tokens')
      .select('name, description, tokens')
      .eq('id', tokenId)
      .single()

    if (fetchError) {
      console.error('❌ Erreur récupération token original:', fetchError)
      return { success: false, error: fetchError.message }
    }

    // Créer le duplicata
    const { data: duplicatedToken, error } = await supabase
      .from('design_tokens')
      .insert({
        name: newName,
        description: `Copie de ${originalToken.name}`,
        tokens: originalToken.tokens,
        is_active: false,
        is_default: false,
        created_by: createdBy
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur duplication design token:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Design token dupliqué:', duplicatedToken.name)
    return { success: true, token: duplicatedToken }
  } catch (error: any) {
    console.error('❌ Erreur duplicateDesignToken:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Générer le CSS à partir des tokens
 */
export function generateCSSFromTokens(tokens: DesignTokens): string {
  return `@import url('https://fonts.googleapis.com/css2?family=${tokens.fontFamily.replace(' ', '+')}:wght@300;400;500;600;700&display=swap');

@custom-variant dark (&:is(.dark *));

:root {
  --font-size: ${tokens.fontSize}px;
  --font-family: '${tokens.fontFamily}', sans-serif;
  --background: ${tokens.background};
  --foreground: ${tokens.foreground};
  --card: ${tokens.background};
  --card-foreground: ${tokens.foreground};
  --popover: ${tokens.background};
  --popover-foreground: ${tokens.foreground};
  --primary: ${tokens.primary};
  --primary-foreground: ${tokens.primaryForeground};
  --secondary: ${tokens.secondary};
  --secondary-foreground: ${tokens.secondaryForeground};
  --muted: ${tokens.muted};
  --muted-foreground: ${tokens.mutedForeground};
  --accent: ${tokens.accent};
  --accent-foreground: ${tokens.accentForeground};
  --destructive: ${tokens.destructive};
  --destructive-foreground: ${tokens.destructiveForeground};
  --border: ${tokens.border};
  --input: transparent;
  --input-background: #f3f3f5;
  --switch-background: #cbced4;
  --font-weight-medium: ${tokens.fontWeightMedium};
  --font-weight-normal: ${tokens.fontWeightNormal};
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --radius: ${tokens.radiusBase}px;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: #030213;
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
  
  /* Variables typographiques personnalisées */
  --text-h1-size: ${tokens.h1.fontSize}px;
  --text-h1-line-height: ${tokens.h1.lineHeight};
  --text-h1-weight: ${tokens.h1.fontWeight};
  --text-h1-transform: ${tokens.h1.textTransform};
  --text-h1-spacing: ${tokens.h1.letterSpacing}px;
  
  --text-h2-size: ${tokens.h2.fontSize}px;
  --text-h2-line-height: ${tokens.h2.lineHeight};
  --text-h2-weight: ${tokens.h2.fontWeight};
  --text-h2-transform: ${tokens.h2.textTransform};
  --text-h2-spacing: ${tokens.h2.letterSpacing}px;
  
  --text-h3-size: ${tokens.h3.fontSize}px;
  --text-h3-line-height: ${tokens.h3.lineHeight};
  --text-h3-weight: ${tokens.h3.fontWeight};
  --text-h3-transform: ${tokens.h3.textTransform};
  --text-h3-spacing: ${tokens.h3.letterSpacing}px;
  
  --text-h4-size: ${tokens.h4.fontSize}px;
  --text-h4-line-height: ${tokens.h4.lineHeight};
  --text-h4-weight: ${tokens.h4.fontWeight};
  --text-h4-transform: ${tokens.h4.textTransform};
  --text-h4-spacing: ${tokens.h4.letterSpacing}px;
  
  --text-p-size: ${tokens.p.fontSize}px;
  --text-p-line-height: ${tokens.p.lineHeight};
  --text-p-weight: ${tokens.p.fontWeight};
  --text-p-transform: ${tokens.p.textTransform};
  --text-p-spacing: ${tokens.p.letterSpacing}px;
  
  --text-label-size: ${tokens.label.fontSize}px;
  --text-label-line-height: ${tokens.label.lineHeight};
  --text-label-weight: ${tokens.label.fontWeight};
  --text-label-transform: ${tokens.label.textTransform};
  --text-label-spacing: ${tokens.label.letterSpacing}px;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-input-background: var(--input-background);
  --color-switch-background: var(--switch-background);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
  }
}

/**
 * Base typography using custom design tokens
 */
@layer base {
  :where(:not(:has([class*=" text-"]), :not(:has([class^="text-"])))) {
    h1 {
      font-size: var(--text-h1-size);
      font-weight: var(--text-h1-weight);
      line-height: var(--text-h1-line-height);
      text-transform: var(--text-h1-transform);
      letter-spacing: var(--text-h1-spacing);
    }

    h2 {
      font-size: var(--text-h2-size);
      font-weight: var(--text-h2-weight);
      line-height: var(--text-h2-line-height);
      text-transform: var(--text-h2-transform);
      letter-spacing: var(--text-h2-spacing);
    }

    h3 {
      font-size: var(--text-h3-size);
      font-weight: var(--text-h3-weight);
      line-height: var(--text-h3-line-height);
      text-transform: var(--text-h3-transform);
      letter-spacing: var(--text-h3-spacing);
    }

    h4 {
      font-size: var(--text-h4-size);
      font-weight: var(--text-h4-weight);
      line-height: var(--text-h4-line-height);
      text-transform: var(--text-h4-transform);
      letter-spacing: var(--text-h4-spacing);
    }

    p {
      font-size: var(--text-p-size);
      font-weight: var(--text-p-weight);
      line-height: var(--text-p-line-height);
      text-transform: var(--text-p-transform);
      letter-spacing: var(--text-p-spacing);
    }

    label {
      font-size: var(--text-label-size);
      font-weight: var(--text-label-weight);
      line-height: var(--text-label-line-height);
      text-transform: var(--text-label-transform);
      letter-spacing: var(--text-label-spacing);
    }

    button {
      font-size: var(--text-base);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    input {
      font-size: var(--text-base);
      font-weight: var(--font-weight-normal);
      line-height: 1.5;
    }
  }
}

html {
  font-size: var(--font-size);
}

body {
  font-family: var(--font-family);
}

* {
  font-family: var(--font-family);
}`
}