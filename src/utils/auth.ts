import { supabase } from './supabase/client'

// Ce fichier est maintenant obsolète
// L'authentification est gérée par le contexte AuthContext directement
// et les fonctions serveur dans /supabase/functions/server/auth.ts

export function deprecatedMessage() {
  console.warn('Ce fichier utils/auth.ts est obsolète. Utilisez le contexte AuthContext directement.')
}