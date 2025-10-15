/**
 * Routes de validation et vérification d'intégrité des données
 * MIGRATION SUPABASE: Module de validation obsolète depuis la migration vers Supabase
 * Les validations sont maintenant gérées directement par Supabase avec RLS et contraintes
 */

import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const app = new Hono()

// Middleware CORS
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))

// Client Supabase pour les validations modernes
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Types pour la validation
interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * NOUVELLES VALIDATIONS SUPABASE
 */
class SupabaseValidators {
  static async validatePackExists(packId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('packs')
        .select('id')
        .eq('id', packId)
        .single()
      
      return !error && !!data
    } catch (error) {
      console.error('Erreur validation pack:', error)
      return false
    }
  }

  static async validateUserExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()
      
      return !error && !!data
    } catch (error) {
      console.error('Erreur validation user:', error)
      return false
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static sanitizeInput(data: any): any {
    if (typeof data === 'string') {
      return data.trim().replace(/<[^>]*>/g, '')
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeInput(value)
      }
      return sanitized
    }
    
    return data
  }
}

/**
 * ROUTES MODERNES DE VALIDATION SUPABASE
 */

// Validation basique d'une entité
app.post('/validation/:table', async (c) => {
  try {
    const table = c.req.param('table')
    const { data } = await c.req.json()

    console.log(`Validation moderne demandée pour ${table}:`, data)

    // Sanitisation des données
    const sanitizedData = SupabaseValidators.sanitizeInput(data)
    const errors: string[] = []

    // Validations spécifiques
    if (table === 'users' && data.email) {
      if (!SupabaseValidators.validateEmail(data.email)) {
        errors.push('Format email invalide')
      }
    }

    const result = {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    }

    console.log('Résultat de validation moderne:', result)
    return c.json(result)

  } catch (error) {
    console.error('Erreur validation moderne:', error)
    return c.json({ 
      isValid: false, 
      errors: [`Erreur lors de la validation: ${error}`],
      sanitizedData: null
    }, 500)
  }
})

// Vérification d'existence d'une entité dans Supabase
app.get('/validation/exists/:table/:id', async (c) => {
  try {
    const table = c.req.param('table')
    const id = c.req.param('id')

    let exists = false

    switch (table) {
      case 'packs':
        exists = await SupabaseValidators.validatePackExists(id)
        break
      case 'users':
        exists = await SupabaseValidators.validateUserExists(id)
        break
      default:
        // Pour les autres tables, vérification générique
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .eq('id', id)
          .single()
        exists = !error && !!data
    }
    
    return c.json({ exists })

  } catch (error) {
    console.error('Erreur vérification existence Supabase:', error)
    return c.json({ 
      exists: false,
      error: `Erreur vérification existence: ${error}`
    }, 500)
  }
})

// Génération d'ID unique moderne
app.post('/validation/generate-id/:prefix', async (c) => {
  try {
    const prefix = c.req.param('prefix')
    const id = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    
    console.log(`ID moderne généré pour ${prefix}: ${id}`)
    return c.json({ id })

  } catch (error) {
    console.error('Erreur génération ID moderne:', error)
    return c.json({ error: `Erreur génération ID: ${error}` }, 500)
  }
})

// Health check pour le module de validation
app.get('/validation/health', (c) => {
  return c.json({ 
    status: 'OK',
    message: 'Module de validation Supabase opérationnel',
    timestamp: new Date().toISOString()
  })
})

export default app