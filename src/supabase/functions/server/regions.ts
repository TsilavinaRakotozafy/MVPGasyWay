import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

export interface Region {
  id: string
  name: string
  slug?: string
  description?: string
  created_at?: string
  updated_at?: string
}

// ✅ Obtenir toutes les régions actives
export async function getAllRegions() {
  try {
    console.log('📍 [regions.ts] Récupération de toutes les régions...')
    
    const { data: regions, error } = await supabase
      .from('regions')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('❌ [regions.ts] Erreur lors de la récupération des régions:', error)
      return {
        success: false,
        error: `Erreur lors de la récupération des régions: ${error.message}`,
        regions: []
      }
    }

    console.log(`✅ [regions.ts] ${regions?.length || 0} région(s) récupérée(s)`)
    
    return {
      success: true,
      regions: regions || [],
      total: regions?.length || 0
    }
  } catch (error) {
    console.error('💥 [regions.ts] Erreur getAllRegions:', error)
    return {
      success: false,
      error: 'Erreur interne du serveur',
      regions: []
    }
  }
}

// ✅ Obtenir une région par son ID
export async function getRegionById(regionId: string) {
  try {
    console.log(`📍 [regions.ts] Récupération de la région ${regionId}...`)
    
    const { data: region, error } = await supabase
      .from('regions')
      .select('*')
      .eq('id', regionId)
      .single()

    if (error) {
      console.error('❌ [regions.ts] Erreur lors de la récupération de la région:', error)
      return {
        success: false,
        error: `Région non trouvée: ${error.message}`,
        region: null
      }
    }

    console.log(`✅ [regions.ts] Région ${region.name} récupérée`)
    
    return {
      success: true,
      region
    }
  } catch (error) {
    console.error('💥 [regions.ts] Erreur getRegionById:', error)
    return {
      success: false,
      error: 'Erreur interne du serveur',
      region: null
    }
  }
}

// ✅ Créer une nouvelle région (admin uniquement)
export async function createRegion(regionData: Partial<Region>) {
  try {
    console.log('📍 [regions.ts] Création d\'une nouvelle région...')
    
    // Générer un slug automatique si pas fourni
    if (!regionData.slug && regionData.name) {
      regionData.slug = regionData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    }
    
    const { data: region, error } = await supabase
      .from('regions')
      .insert([{
        id: crypto.randomUUID(),
        ...regionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ [regions.ts] Erreur lors de la création de la région:', error)
      return {
        success: false,
        error: `Erreur lors de la création: ${error.message}`,
        region: null
      }
    }

    console.log(`✅ [regions.ts] Région ${region.name} créée avec succès`)
    
    return {
      success: true,
      region,
      message: 'Région créée avec succès'
    }
  } catch (error) {
    console.error('💥 [regions.ts] Erreur createRegion:', error)
    return {
      success: false,
      error: 'Erreur interne du serveur',
      region: null
    }
  }
}

// ✅ Mettre à jour une région (admin uniquement)
export async function updateRegion(regionId: string, updates: Partial<Region>) {
  try {
    console.log(`📍 [regions.ts] Mise à jour de la région ${regionId}...`)
    
    const { data: region, error } = await supabase
      .from('regions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', regionId)
      .select()
      .single()

    if (error) {
      console.error('❌ [regions.ts] Erreur lors de la mise à jour de la région:', error)
      return {
        success: false,
        error: `Erreur lors de la mise à jour: ${error.message}`,
        region: null
      }
    }

    console.log(`✅ [regions.ts] Région ${region.name} mise à jour`)
    
    return {
      success: true,
      region,
      message: 'Région mise à jour avec succès'
    }
  } catch (error) {
    console.error('💥 [regions.ts] Erreur updateRegion:', error)
    return {
      success: false,
      error: 'Erreur interne du serveur',
      region: null
    }
  }
}

// ✅ Supprimer une région (admin uniquement)
export async function deleteRegion(regionId: string) {
  try {
    console.log(`📍 [regions.ts] Suppression de la région ${regionId}...`)
    
    const { error } = await supabase
      .from('regions')
      .delete()
      .eq('id', regionId)

    if (error) {
      console.error('❌ [regions.ts] Erreur lors de la suppression de la région:', error)
      return {
        success: false,
        error: `Erreur lors de la suppression: ${error.message}`
      }
    }

    console.log(`✅ [regions.ts] Région supprimée avec succès`)
    
    return {
      success: true,
      message: 'Région supprimée avec succès'
    }
  } catch (error) {
    console.error('💥 [regions.ts] Erreur deleteRegion:', error)
    return {
      success: false,
      error: 'Erreur interne du serveur'
    }
  }
}

// ✅ Initialiser les données de régions (données de démonstration)
export async function initializeRegions() {
  try {
    console.log('📍 [regions.ts] Initialisation des régions...')
    
    // Vérifier si des régions existent déjà
    const { data: existingRegions, error: checkError } = await supabase
      .from('regions')
      .select('id')
      .limit(1)

    if (checkError) {
      console.error('❌ [regions.ts] Erreur lors de la vérification des régions:', checkError)
      return {
        success: false,
        error: `Erreur lors de la vérification: ${checkError.message}`
      }
    }

    if (existingRegions && existingRegions.length > 0) {
      console.log('ℹ️ [regions.ts] Régions déjà initialisées')
      return {
        success: true,
        message: 'Régions déjà initialisées',
        created: 0
      }
    }

    // Données de régions de Madagascar
    const regionsData = [
      {
        id: crypto.randomUUID(),
        name: 'Antananarivo',
        slug: 'antananarivo',
        description: 'La capitale et région centrale de Madagascar'
      },
      {
        id: crypto.randomUUID(),
        name: 'Andasibe-Mantadia',
        slug: 'andasibe-mantadia',
        description: 'Parc national célèbre pour les lémuriens Indri'
      },
      {
        id: crypto.randomUUID(),
        name: 'Antsirabe',
        slug: 'antsirabe',
        description: 'Ville thermale des hautes terres'
      },
      {
        id: crypto.randomUUID(),
        name: 'Morondava',
        slug: 'morondava',
        description: 'Région ouest, célèbre pour l\'allée des Baobabs'
      },
      {
        id: crypto.randomUUID(),
        name: 'Tsingy de Bemaraha',
        slug: 'tsingy-bemaraha',
        description: 'Formations rocheuses spectaculaires de l\'ouest'
      },
      {
        id: crypto.randomUUID(),
        name: 'Nosy Be',
        slug: 'nosy-be',
        description: 'Île parfumée du nord-ouest'
      },
      {
        id: crypto.randomUUID(),
        name: 'Diego Suarez',
        slug: 'diego-suarez',
        description: 'Extrême nord de Madagascar'
      },
      {
        id: crypto.randomUUID(),
        name: 'Sainte-Marie',
        slug: 'sainte-marie',
        description: 'Île de la côte est, parfaite pour les baleines'
      },
      {
        id: crypto.randomUUID(),
        name: 'Fianarantsoa',
        slug: 'fianarantsoa',
        description: 'Région des hautes terres du sud'
      },
      {
        id: crypto.randomUUID(),
        name: 'Isalo',
        slug: 'isalo',
        description: 'Parc national aux paysages désertiques'
      },
      {
        id: crypto.randomUUID(),
        name: 'Tuléar',
        slug: 'tulear',
        description: 'Porte d\'entrée du sud-ouest'
      },
      {
        id: crypto.randomUUID(),
        name: 'Fort Dauphin',
        slug: 'fort-dauphin',
        description: 'Extrême sud-est de l\'île'
      }
    ]

    const { data: regions, error } = await supabase
      .from('regions')
      .insert(regionsData.map(region => ({
        ...region,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })))
      .select()

    if (error) {
      console.error('❌ [regions.ts] Erreur lors de l\'initialisation:', error)
      return {
        success: false,
        error: `Erreur lors de l'initialisation: ${error.message}`
      }
    }

    console.log(`✅ [regions.ts] ${regions?.length || 0} région(s) créée(s)`)
    
    return {
      success: true,
      message: `${regions?.length || 0} régions initialisées avec succès`,
      created: regions?.length || 0
    }
  } catch (error) {
    console.error('💥 [regions.ts] Erreur initializeRegions:', error)
    return {
      success: false,
      error: 'Erreur interne du serveur'
    }
  }
}