/**
 * Utilitaires pour maintenir l'intégrité des données dans le KV store
 * Simulation des contraintes PK, FK et validations métier
 */

import * as kv from '../supabase/functions/server/kv_store'

// Types pour l'intégrité des données
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ReferenceCheck {
  table: string
  field: string
  value: string
}

/**
 * GESTION DES CLÉS PRIMAIRES (PK)
 */
export class PrimaryKeyManager {
  
  /**
   * Génère un ID unique pour une entité
   */
  static generateId(prefix: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}_${timestamp}_${random}`
  }

  /**
   * Vérifie l'unicité d'une clé primaire
   */
  static async validateUniqueness(table: string, id: string): Promise<boolean> {
    try {
      const key = `${table}:${id}`
      const existing = await kv.get(key)
      return existing === null
    } catch (error) {
      console.error(`Erreur vérification unicité PK ${table}:${id}:`, error)
      return false
    }
  }

  /**
   * Vérifie l'existence d'une entité
   */
  static async exists(table: string, id: string): Promise<boolean> {
    try {
      const key = `${table}:${id}`
      const existing = await kv.get(key)
      return existing !== null
    } catch (error) {
      console.error(`Erreur vérification existence ${table}:${id}:`, error)
      return false
    }
  }
}

/**
 * GESTION DES CLÉS ÉTRANGÈRES (FK)
 */
export class ForeignKeyManager {
  
  /**
   * Vérifie l'intégrité référentielle
   */
  static async validateReference(reference: ReferenceCheck): Promise<boolean> {
    try {
      const key = `${reference.table}:${reference.value}`
      const exists = await kv.get(key)
      return exists !== null
    } catch (error) {
      console.error(`Erreur validation FK ${reference.table}:${reference.value}:`, error)
      return false
    }
  }

  /**
   * Vérifie plusieurs références en parallèle
   */
  static async validateReferences(references: ReferenceCheck[]): Promise<ValidationResult> {
    const results = await Promise.all(
      references.map(async (ref) => ({
        ref,
        isValid: await this.validateReference(ref)
      }))
    )

    const errors: string[] = []
    results.forEach(({ ref, isValid }) => {
      if (!isValid) {
        errors.push(`Référence invalide: ${ref.table}.${ref.field} = "${ref.value}" n'existe pas`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Trouve toutes les références vers une entité (pour contraintes CASCADE)
   */
  static async findReferences(table: string, id: string): Promise<string[]> {
    try {
      // Recherche dans les tables qui pourraient référencer cette entité
      const patterns = [
        `pack_days:*`, // Pour les packs
        `pack_locations:*`, // Pour les locations
        `pack_media:*`, // Pour les médias
        `bookings:*`, // Pour les réservations
        `reviews:*`, // Pour les avis
        `user_favorites:*`, // Pour les favoris
        `user_interests:*` // Pour les centres d'intérêt
      ]

      const allReferences: string[] = []

      for (const pattern of patterns) {
        const keys = await kv.getByPrefix(pattern.replace(':*', ''))
        
        for (const key of keys) {
          const data = await kv.get(key)
          if (data && typeof data === 'object') {
            // Vérifie toutes les propriétés de l'objet pour des références
            Object.entries(data).forEach(([prop, value]) => {
              if (typeof value === 'string' && value === id) {
                allReferences.push(`${key}.${prop}`)
              }
              if (prop.includes('_id') && value === id) {
                allReferences.push(`${key}.${prop}`)
              }
            })
          }
        }
      }

      return allReferences
    } catch (error) {
      console.error(`Erreur recherche références pour ${table}:${id}:`, error)
      return []
    }
  }
}

/**
 * VALIDATEURS MÉTIER SPÉCIFIQUES À GASYWAY
 */
export class GasyWayValidators {
  
  /**
   * Valide un pack touristique
   */
  static async validatePack(pack: any): Promise<ValidationResult> {
    const errors: string[] = []

    // Validation basique
    if (!pack.title || pack.title.trim().length < 3) {
      errors.push('Le titre du pack doit contenir au moins 3 caractères')
    }

    if (!pack.price || pack.price <= 0) {
      errors.push('Le prix doit être supérieur à 0')
    }

    if (!pack.duration || pack.duration <= 0) {
      errors.push('La durée doit être supérieure à 0')
    }

    if (!pack.max_participants || pack.max_participants <= 0) {
      errors.push('Le nombre maximum de participants doit être supérieur à 0')
    }

    // Validation des références
    const references: ReferenceCheck[] = []
    
    if (pack.category_id) {
      references.push({
        table: 'categories',
        field: 'category_id',
        value: pack.category_id
      })
    }

    if (pack.region_id) {
      references.push({
        table: 'regions',
        field: 'region_id',
        value: pack.region_id
      })
    }

    if (references.length > 0) {
      const refValidation = await ForeignKeyManager.validateReferences(references)
      if (!refValidation.isValid) {
        errors.push(...refValidation.errors)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Valide une réservation
   */
  static async validateBooking(booking: any): Promise<ValidationResult> {
    const errors: string[] = []

    // Validation des références obligatoires
    const references: ReferenceCheck[] = [
      {
        table: 'users',
        field: 'user_id',
        value: booking.user_id
      },
      {
        table: 'packs',
        field: 'pack_id',
        value: booking.pack_id
      }
    ]

    const refValidation = await ForeignKeyManager.validateReferences(references)
    if (!refValidation.isValid) {
      errors.push(...refValidation.errors)
    }

    // Validation métier
    if (!booking.participants || booking.participants <= 0) {
      errors.push('Le nombre de participants doit être supérieur à 0')
    }

    if (!booking.total_amount || booking.total_amount <= 0) {
      errors.push('Le montant total doit être supérieur à 0')
    }

    // Vérification de la capacité du pack
    const pack = await kv.get(`packs:${booking.pack_id}`)
    if (pack && booking.participants > pack.max_participants) {
      errors.push(`Le nombre de participants (${booking.participants}) dépasse la capacité maximale du pack (${pack.max_participants})`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Valide un profil utilisateur
   */
  static async validateProfile(profile: any): Promise<ValidationResult> {
    const errors: string[] = []

    // Validation des références
    const userExists = await PrimaryKeyManager.exists('users', profile.user_id)
    if (!userExists) {
      errors.push(`L'utilisateur ${profile.user_id} n'existe pas`)
    }

    // Validation des enums
    const validRoles = ['traveler', 'admin']
    if (!validRoles.includes(profile.role)) {
      errors.push(`Rôle invalide: ${profile.role}. Valeurs autorisées: ${validRoles.join(', ')}`)
    }

    const validStatuses = ['active', 'blocked', 'pending']
    if (!validStatuses.includes(profile.status)) {
      errors.push(`Statut invalide: ${profile.status}. Valeurs autorisées: ${validStatuses.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * GESTIONNAIRE PRINCIPAL D'INTÉGRITÉ
 */
export class DataIntegrityManager {
  
  /**
   * Effectue une validation complète avant insertion/mise à jour
   */
  static async validateEntity(table: string, data: any, isUpdate = false): Promise<ValidationResult> {
    const errors: string[] = []

    try {
      // Validation PK pour les nouvelles entités
      if (!isUpdate && data.id) {
        const isUnique = await PrimaryKeyManager.validateUniqueness(table, data.id)
        if (!isUnique) {
          errors.push(`L'ID ${data.id} existe déjà dans la table ${table}`)
        }
      }

      // Validations spécifiques par type d'entité
      let validation: ValidationResult

      switch (table) {
        case 'packs':
          validation = await GasyWayValidators.validatePack(data)
          break
        case 'bookings':
          validation = await GasyWayValidators.validateBooking(data)
          break
        case 'profiles':
          validation = await GasyWayValidators.validateProfile(data)
          break
        default:
          validation = { isValid: true, errors: [] }
      }

      if (!validation.isValid) {
        errors.push(...validation.errors)
      }

    } catch (error) {
      errors.push(`Erreur lors de la validation: ${error}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Effectue un nettoyage en cascade (simulation de CASCADE DELETE)
   */
  static async cascadeDelete(table: string, id: string): Promise<ValidationResult> {
    const errors: string[] = []

    try {
      // Trouve toutes les références
      const references = await ForeignKeyManager.findReferences(table, id)
      
      if (references.length > 0) {
        errors.push(`Impossible de supprimer ${table}:${id}. Références existantes: ${references.join(', ')}`)
        return { isValid: false, errors }
      }

      // Suppression de l'entité principale
      await kv.del(`${table}:${id}`)

    } catch (error) {
      errors.push(`Erreur lors de la suppression en cascade: ${error}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * UTILITAIRES DE SÉCURITÉ
 */
export class SecurityManager {
  
  /**
   * Vérifie les permissions d'accès selon le rôle
   */
  static validatePermissions(userRole: string, operation: string, table: string): boolean {
    const permissions = {
      admin: {
        read: ['*'],
        write: ['*'],
        delete: ['*']
      },
      traveler: {
        read: ['packs', 'categories', 'regions', 'bookings', 'reviews', 'profiles'],
        write: ['bookings', 'reviews', 'user_favorites', 'user_interests'],
        delete: ['bookings', 'reviews', 'user_favorites']
      }
    }

    const userPermissions = permissions[userRole as keyof typeof permissions]
    if (!userPermissions) return false

    const operationPermissions = userPermissions[operation as keyof typeof userPermissions]
    return operationPermissions.includes('*') || operationPermissions.includes(table)
  }

  /**
   * Sanitise les données d'entrée
   */
  static sanitizeInput(data: any): any {
    if (typeof data === 'string') {
      return data.trim().replace(/<[^>]*>/g, '') // Supprime les tags HTML basiques
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