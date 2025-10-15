/**
 * Configuration automatique pour Figma Make
 * Détecte l'URL de base et configure les redirections
 */

export const getFigmaMakeUrl = (): string => {
  // Dans Figma Make, window.location.origin contient l'URL complète
  return window.location.origin
}

export const getAuthCallbackUrl = (): string => {
  return `${getFigmaMakeUrl()}/auth/callback`
}

export const getResetPasswordUrl = (): string => {
  return `${getFigmaMakeUrl()}/reset-password`
}

/**
 * Instructions pour configurer Supabase avec Figma Make
 */
export const getSupabaseConfigInstructions = () => {
  const baseUrl = getFigmaMakeUrl()
  
  return {
    siteUrl: baseUrl,
    redirectUrls: [
      `${baseUrl}/auth/callback`,
      `${baseUrl}/reset-password`
    ],
    instructions: `
🔧 Configuration Supabase pour Figma Make:

1. Dans votre tableau de bord Supabase:
   • Allez dans Authentication → Settings
   • Site URL: ${baseUrl}
   
2. Dans Authentication → URL Configuration:
   • Ajoutez ces URLs dans "Redirect URLs":
     - ${baseUrl}/auth/callback
     - ${baseUrl}/reset-password

3. Dans Authentication → Settings:
   • ✅ Enable email confirmations
   • ✅ Enable email change confirmations

URL actuelle détectée: ${baseUrl}
`
  }
}

// Fonction pour afficher les instructions dans la console
export const logSupabaseInstructions = () => {
  const config = getSupabaseConfigInstructions()
  console.log('📋 Configuration Supabase pour Figma Make:')
  console.log(config.instructions)
  return config
}