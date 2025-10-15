import { createClient } from 'jsr:@supabase/supabase-js@2'
import type { Pack, Category } from './init-database.ts'

// Client Supabase pour les opérations de pack
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Données de démo pour les catégories
const defaultCategories: Category[] = [
  {
    id: 'cat-adventure',
    name: 'Aventure',
    description: 'Expériences palpitantes et sports extrêmes',
    icon: '🏔️',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cat-culture',
    name: 'Culture',
    description: 'Découverte du patrimoine et des traditions',
    icon: '🏛️',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cat-nature',
    name: 'Nature',
    description: 'Immersion dans la faune et la flore',
    icon: '🌿',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cat-beach',
    name: 'Plage',
    description: 'Détente et activités balnéaires',
    icon: '🏖️',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// Données de démo pour les packs
const defaultPacks: Pack[] = [
  {
    id: 'pack-andasibe',
    title: 'Safari Andasibe-Mantadia',
    description: 'Découvrez les lémuriens emblématiques de Madagascar dans leur habitat naturel. Une expérience inoubliable au cœur de la forêt tropicale humide.',
    short_description: 'Safari lémuriens dans la forêt d\'Andasibe',
    price: 280000,
    currency: 'MGA',
    duration_days: 3,
    max_participants: 8,
    min_participants: 2,
    location: 'Andasibe-Mantadia, Madagascar',
    coordinates: { lat: -18.9441, lng: 48.4245 },
    category_id: 'cat-nature',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1564760055775-d63b17a55c44', 'https://images.unsplash.com/photo-1547036967-23d11aacaee0'],
    included_services: ['Transport', 'Guide local', 'Hébergement', 'Repas', 'Entrées parcs'],
    excluded_services: ['Vols internationaux', 'Assurance voyage', 'Pourboires'],
    difficulty_level: 'medium',
    season_start: '04-01',
    season_end: '11-30',
    cancellation_policy: 'Annulation gratuite jusqu\'à 7 jours avant',
    created_by: 'demo-admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'pack-tsingy',
    title: 'Expédition Tsingy de Bemaraha',
    description: 'Aventure exceptionnelle dans les formations rocheuses uniques des Tsingy. Escalade, tyrolienne et découverte d\'un écosystème unique au monde.',
    short_description: 'Aventure dans les formations rocheuses des Tsingy',
    price: 450000,
    currency: 'MGA',
    duration_days: 5,
    max_participants: 6,
    min_participants: 2,
    location: 'Tsingy de Bemaraha, Madagascar',
    coordinates: { lat: -19.1347, lng: 44.7844 },
    category_id: 'cat-adventure',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4'],
    included_services: ['Transport 4x4', 'Guide spécialisé', 'Équipement escalade', 'Camping', 'Repas'],
    excluded_services: ['Vols domestiques', 'Équipement personnel', 'Assurance'],
    difficulty_level: 'hard',
    season_start: '05-01',
    season_end: '10-31',
    cancellation_policy: 'Annulation avec frais selon conditions météo',
    created_by: 'demo-admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'pack-nosy-be',
    title: 'Détente à Nosy Be',
    description: 'Séjour paradisiaque sur l\'île aux parfums. Plages de sable blanc, eaux cristallines et couchers de soleil spectaculaires.',
    short_description: 'Séjour détente sur l\'île aux parfums',
    price: 320000,
    currency: 'MGA',
    duration_days: 4,
    max_participants: 12,
    min_participants: 1,
    location: 'Nosy Be, Madagascar',
    coordinates: { lat: -13.3205, lng: 48.2613 },
    category_id: 'cat-beach',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19', 'https://images.unsplash.com/photo-1571104508999-893933ded431'],
    included_services: ['Hébergement bord de mer', 'Petits déjeuners', 'Excursions îles', 'Transferts'],
    excluded_services: ['Vols', 'Déjeuners et dîners', 'Activités nautiques payantes'],
    difficulty_level: 'easy',
    season_start: '03-01',
    season_end: '12-31',
    cancellation_policy: 'Annulation gratuite jusqu\'à 3 jours avant',
    created_by: 'demo-admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export async function initializePacksData() {
  try {
    console.log('🔍 Vérification des catégories et packs existants dans Supabase...')
    
    // Vérifier si les catégories existent déjà
    const { data: existingCategories, error: categoriesError } = await supabase
      .from('pack_categories')
      .select('*')
    
    if (categoriesError) {
      console.error('❌ Erreur lors de la vérification des catégories:', categoriesError)
    }
    
    // Initialiser les catégories si elles n'existent pas
    if (!existingCategories || existingCategories.length === 0) {
      console.log('📝 Insertion des catégories par défaut...')
      const { error: insertCategoriesError } = await supabase
        .from('pack_categories')
        .insert(defaultCategories)
      
      if (insertCategoriesError) {
        console.error('❌ Erreur insertion catégories:', insertCategoriesError)
      } else {
        console.log('✅ Catégories créées avec succès')
      }
    }
    
    // Vérifier si les packs existent déjà
    const { data: existingPacks, error: packsError } = await supabase
      .from('packs')
      .select('*')
    
    if (packsError) {
      console.error('❌ Erreur lors de la vérification des packs:', packsError)
    }
    
    // Initialiser les packs si ils n'existent pas
    if (!existingPacks || existingPacks.length === 0) {
      console.log('📝 Insertion des packs par défaut...')
      const { error: insertPacksError } = await supabase
        .from('packs')
        .insert(defaultPacks)
      
      if (insertPacksError) {
        console.error('❌ Erreur insertion packs:', insertPacksError)
      } else {
        console.log('✅ Packs créés avec succès')
      }
    }

    return { success: true, message: 'Données packs initialisées depuis Supabase' }
  } catch (error) {
    console.error('💥 Erreur initialisation packs:', error)
    return { success: false, error: error.message }
  }
}

export async function getAllPacks() {
  try {
    console.log('🔍 Récupération de tous les packs...')
    
    // Requête simple et directe
    const { data: packs, error } = await supabase
      .from('packs')
      .select(`
        *,
        category:pack_categories(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Erreur récupération packs: ${error.message}`)
    }
    
    console.log('✅ Packs récupérés:', packs?.length || 0)
    return { success: true, packs: packs || [] }
  } catch (error) {
    console.error('❌ Erreur getAllPacks:', error)
    return { success: false, error: error.message }
  }
}

export async function getActivePacks() {
  try {
    console.log('🔍 Récupération des packs actifs...')
    
    // Requête simple et directe
    const { data: packs, error } = await supabase
      .from('packs')
      .select(`
        *,
        category:pack_categories(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Erreur récupération packs actifs: ${error.message}`)
    }
    
    console.log('✅ Packs actifs récupérés:', packs?.length || 0)
    return { success: true, packs: packs || [] }
  } catch (error) {
    console.error('❌ Erreur getActivePacks:', error)
    return { success: false, error: error.message }
  }
}

export async function getPackById(packId: string) {
  try {
    // Utiliser une requête SQL optimisée avec la vue pack_reviews_stats
    const { data: packs, error } = await supabase
      .rpc('get_pack_by_id_with_reviews', { pack_id: packId })
    
    if (error || !packs || packs.length === 0) {
      console.log('Vue pack_reviews_stats non disponible, utilisation de la requête basique')
      // Fallback : requête basique sans reviews
      const { data: basicPack, error: basicError } = await supabase
        .from('packs')
        .select(`
          *,
          category:pack_categories(*)
        `)
        .eq('id', packId)
        .single()
      
      if (basicError || !basicPack) {
        return { success: false, error: 'Pack non trouvé' }
      }
      
      return { success: true, pack: basicPack }
    }

    return { success: true, pack: packs[0] }
  } catch (error) {
    console.error('❌ Erreur getPackById:', error)
    return { success: false, error: error.message }
  }
}

export async function createPack(packData: Omit<Pack, 'created_at' | 'updated_at'>) {
  try {
    const newPack = {
      ...packData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: pack, error } = await supabase
      .from('packs')
      .insert(newPack)
      .select(`
        *,
        category:pack_categories(*)
      `)
      .single()

    if (error) {
      throw new Error(`Erreur création pack: ${error.message}`)
    }

    return { success: true, pack }
  } catch (error) {
    console.error('❌ Erreur createPack:', error)
    return { success: false, error: error.message }
  }
}

export async function updatePack(packId: string, updates: Partial<Pack>) {
  try {
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data: pack, error } = await supabase
      .from('packs')
      .update(updatedData)
      .eq('id', packId)
      .select(`
        *,
        category:pack_categories(*)
      `)
      .single()

    if (error) {
      throw new Error(`Erreur mise à jour pack: ${error.message}`)
    }

    if (!pack) {
      return { success: false, error: 'Pack non trouvé' }
    }

    return { success: true, pack }
  } catch (error) {
    console.error('❌ Erreur updatePack:', error)
    return { success: false, error: error.message }
  }
}

export async function deletePack(packId: string) {
  try {
    const { error } = await supabase
      .from('packs')
      .delete()
      .eq('id', packId)

    if (error) {
      throw new Error(`Erreur suppression pack: ${error.message}`)
    }

    return { success: true, message: 'Pack supprimé avec succès' }
  } catch (error) {
    console.error('❌ Erreur deletePack:', error)
    return { success: false, error: error.message }
  }
}

export async function getAllCategories() {
  try {
    const { data: categories, error } = await supabase
      .from('pack_categories')
      .select('*')
      .order('name')

    if (error) {
      throw new Error(`Erreur récupération catégories: ${error.message}`)
    }

    return { success: true, categories: categories || [] }
  } catch (error) {
    console.error('❌ Erreur getAllCategories:', error)
    return { success: false, error: error.message }
  }
}