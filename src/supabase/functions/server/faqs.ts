/**
 * Routes FAQ pour GasyWay
 * FAQ liées aux centres d'intérêt, héritées par les packs
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

// Types
interface FAQ {
  id: string
  interest_id: string
  question: string
  answer: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
  interest_name?: string
  interest_icon?: string
}

interface PackFAQ {
  pack_id: string
  pack_title: string
  faq_id: string
  question: string
  answer: string
  order_index: number
  interest_name: string
  interest_icon: string
}

interface CreateFAQData {
  interest_id?: string | null
  question: string
  answer: string
  order_index?: number
  faq_type?: 'general' | 'interest'
}

interface UpdateFAQData {
  question?: string
  answer?: string
  order_index?: number
  is_active?: boolean
}

// Client Supabase
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

/**
 * Récupérer toutes les FAQ générales
 */
export async function getGeneralFAQs() {
  try {
    const { data: faqs, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('faq_type', 'general')
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching general FAQs:', error)
      return { success: false, error: error.message, faqs: [] }
    }

    const formattedFAQs = faqs.map(faq => ({
      ...faq,
      interest_name: 'GasyWay',
      interest_icon: '❓'
    }))

    return { success: true, faqs: formattedFAQs }
  } catch (error) {
    console.error('Error in getGeneralFAQs:', error)
    return { success: false, error: error.message, faqs: [] }
  }
}

/**
 * Récupérer toutes les FAQ actives d'un centre d'intérêt
 */
export async function getFAQsByInterest(interestId: string) {
  try {
    const { data: faqs, error } = await supabase
      .from('faqs')
      .select(`
        *,
        interests (
          name,
          icon_url
        )
      `)
      .eq('interest_id', interestId)
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching FAQs by interest:', error)
      return { success: false, error: error.message, faqs: [] }
    }

    const formattedFAQs = faqs.map(faq => ({
      ...faq,
      interest_name: faq.interests?.name,
      interest_icon: faq.interests?.icon_url
    }))

    return { success: true, faqs: formattedFAQs }
  } catch (error) {
    console.error('Error in getFAQsByInterest:', error)
    return { success: false, error: error.message, faqs: [] }
  }
}

// Fonction helper pour générer des FAQ mockeées basées sur les intérêts
async function generateMockFAQsForPack(mockInterestIds: string[]) {
  const mockFAQGroups = []
  
  if (mockInterestIds.includes('int-nature-wildlife') || mockInterestIds.includes('int-nature-flora')) {
    mockFAQGroups.push({
      interest_name: 'Nature & Faune',
      interest_icon: '🦎',
      faqs: [
        {
          id: 'faq-nature-1',
          question: 'Quels animaux pourrai-je observer ?',
          answer: 'Madagascar abrite une faune endémique unique : lémuriens, caméléons, fossas, et plus de 300 espèces d\'oiseaux. Nos guides expérimentés vous aideront à les repérer.',
          order_index: 1
        },
        {
          id: 'faq-nature-2',
          question: 'Quelle est la meilleure période pour observer la faune ?',
          answer: 'La saison sèche (avril à novembre) est idéale pour l\'observation. Les animaux sont plus actifs tôt le matin et en fin d\'après-midi.',
          order_index: 2
        }
      ]
    })
  }
  
  if (mockInterestIds.includes('int-adventure-hiking') || mockInterestIds.includes('int-adventure-climbing')) {
    mockFAQGroups.push({
      interest_name: 'Aventure & Sport',
      interest_icon: '🏔️',
      faqs: [
        {
          id: 'faq-adventure-1',
          question: 'Quel est le niveau de difficulté requis ?',
          answer: 'Nos expériences s\'adaptent à tous les niveaux. Une condition physique de base est recommandée pour profiter pleinement de l\'aventure.',
          order_index: 1
        },
        {
          id: 'faq-adventure-2',
          question: 'L\'équipement est-il fourni ?',
          answer: 'Nous fournissons l\'équipement de sécurité spécialisé. Une liste du matériel personnel à apporter vous sera communiquée.',
          order_index: 2
        }
      ]
    })
  }
  
  if (mockInterestIds.includes('int-culture-traditions') || mockInterestIds.includes('int-culture-history')) {
    mockFAQGroups.push({
      interest_name: 'Culture & Histoire',
      interest_icon: '🎭',
      faqs: [
        {
          id: 'faq-culture-1',
          question: 'Puis-je interagir avec les communautés locales ?',
          answer: 'Absolument ! Nos expériences privilégient les rencontres authentiques dans le respect des traditions et coutumes locales.',
          order_index: 1
        }
      ]
    })
  }
  
  if (mockInterestIds.includes('int-relaxation-beach') || mockInterestIds.includes('int-relaxation-spa')) {
    mockFAQGroups.push({
      interest_name: 'Détente & Bien-être',
      interest_icon: '🏖️',
      faqs: [
        {
          id: 'faq-relax-1',
          question: 'Les activités de détente sont-elles incluses ?',
          answer: 'Certaines activités de bien-être sont incluses. Les soins spa et massages sont disponibles en supplément sur demande.',
          order_index: 1
        }
      ]
    })
  }
  
  // Fallback générique si aucun groupe spécifique
  if (mockFAQGroups.length === 0) {
    mockFAQGroups.push({
      interest_name: 'Informations générales',
      interest_icon: '❓',
      faqs: [
        {
          id: 'faq-general-1',
          question: 'Cette expérience convient-elle aux débutants ?',
          answer: 'Oui, nos expériences sont conçues pour être accessibles. Nos guides s\'adaptent au niveau et aux besoins de chaque participant.',
          order_index: 1
        },
        {
          id: 'faq-general-2',
          question: 'Que se passe-t-il en cas de mauvais temps ?',
          answer: 'Nous adaptons le programme selon les conditions météorologiques pour garantir votre sécurité et votre plaisir.',
          order_index: 2
        }
      ]
    })
  }
  
  return { 
    success: true, 
    faqs: mockFAQGroups,
    total: mockFAQGroups.reduce((sum, group) => sum + group.faqs.length, 0)
  }
}

// Fonction pour associer des centres d'intérêt à un pack (même logique que le frontend)
function getPackInterests(pack: any): string[] {
  const interests: string[] = []
  
  // Logique d'association basée sur le titre, description et catégorie
  const title = pack.title?.toLowerCase() || ''
  const description = pack.description?.toLowerCase() || ''
  
  // Nature et faune
  if (title.includes('lemur') || title.includes('andasibe') || description.includes('faune') || title.includes('safari')) {
    interests.push('int-nature-wildlife')
  }
  
  if (title.includes('tsingy') || title.includes('baobab') || description.includes('flore') || description.includes('forêt')) {
    interests.push('int-nature-flora')
  }
  
  // Culture
  if (title.includes('tradition') || description.includes('culture') || description.includes('village')) {
    interests.push('int-culture-traditions')
  }
  
  if (title.includes('historique') || description.includes('histoire') || description.includes('patrimoine')) {
    interests.push('int-culture-history')
  }
  
  // Aventure
  if (pack.difficulty_level === 'hard' || title.includes('trek') || description.includes('randonnée') || description.includes('aventure')) {
    interests.push('int-adventure-hiking')
  }
  
  if (title.includes('escalade') || description.includes('climbing') || title.includes('tsingy') || description.includes('expédition')) {
    interests.push('int-adventure-climbing')
  }
  
  // Relaxation
  if (title.includes('nosy be') || title.includes('plage') || description.includes('beach') || description.includes('détente')) {
    interests.push('int-relaxation-beach')
  }
  
  if (title.includes('spa') || description.includes('bien-être')) {
    interests.push('int-relaxation-spa')
  }
  
  // Gastronomie
  if (description.includes('cuisine') || description.includes('gastronomie') || description.includes('repas')) {
    interests.push('int-gastronomy-local')
  }
  
  if (description.includes('marché') || description.includes('produits locaux')) {
    interests.push('int-gastronomy-markets')
  }
  
  // Photographie
  if (description.includes('photo') || title.includes('découverte') || pack.category_id === 'cat-nature') {
    interests.push('int-photography-landscape')
  }
  
  if (title.includes('safari') || description.includes('observation')) {
    interests.push('int-photography-wildlife')
  }
  
  return [...new Set(interests)] // Éliminer les doublons
}

/**
 * Récupérer toutes les FAQ d'un pack via ses centres d'intérêt
 */
export async function getFAQsByPack(packId: string) {
  try {
    console.log(`🔍 [Supabase] Fetching FAQs for pack: ${packId}`)
    
    // 1. Récupérer le pack
    const { data: pack, error: packError } = await supabase
      .from('packs')
      .select('*')
      .eq('id', packId)
      .single()

    if (packError || !pack) {
      console.error('❌ [Supabase] Error fetching pack:', packError)
      return { success: false, error: packError?.message || 'Pack non trouvé', faqs: [] }
    }

    console.log(`📋 [Supabase] Pack found: ${pack.title}`)

    // 2. Déterminer les centres d'intérêt du pack via la logique métier
    const mockInterestIds = getPackInterests(pack)
    console.log(`📋 [Supabase] Determined pack interests (mock IDs): ${mockInterestIds.join(', ')}`)
    
    if (mockInterestIds.length === 0) {
      console.log('ℹ️ [Supabase] No interests determined for this pack')
      return { success: true, faqs: [], total: 0 }
    }

    // 3. Mapper les mock IDs vers les vrais UUIDs de la base de données
    // Créer un mapping des noms d'intérêts mockés vers les vrais IDs
    const interestNameMapping: Record<string, string> = {
      'int-nature-wildlife': 'Faune sauvage',
      'int-nature-flora': 'Flore tropicale',
      'int-culture-traditions': 'Traditions locales',
      'int-culture-history': 'Histoire',
      'int-adventure-hiking': 'Randonnée',
      'int-adventure-climbing': 'Escalade',
      'int-relaxation-beach': 'Plages paradisiaques',
      'int-relaxation-spa': 'Bien-être & Spa',
      'int-gastronomy-local': 'Cuisine locale',
      'int-gastronomy-markets': 'Marchés locaux',
      'int-photography-landscape': 'Photographie de paysages',
      'int-photography-wildlife': 'Photographie animalière'
    }

    const interestNames = mockInterestIds.map(id => interestNameMapping[id]).filter(Boolean)
    console.log(`📋 [Supabase] Mapped to interest names: ${interestNames.join(', ')}`)

    if (interestNames.length === 0) {
      console.log('ℹ️ [Supabase] No mapped interest names found')
      return { success: true, faqs: [], total: 0 }
    }

    // 4. Récupérer les vrais UUIDs des intérêts par leurs noms
    const { data: interests, error: interestsError } = await supabase
      .from('interests')
      .select('id, name')
      .in('name', interestNames)

    if (interestsError) {
      console.error('❌ [Supabase] Error fetching interests:', interestsError)
      
      // FALLBACK : Si la table interests n'existe pas, utiliser des FAQ mockeées
      if (interestsError.message.includes('does not exist') || 
          interestsError.code === 'PGRST204' || 
          interestsError.code === 'PGRST205') {
        console.log('💡 [Supabase] Table interests non trouvée, utilisation de FAQ mockeées')
        
        // Utiliser le même fallback que pour les FAQ
        return await generateMockFAQsForPack(mockInterestIds)
      }
      
      return { success: false, error: interestsError.message, faqs: [] }
    }

    const realInterestIds = interests?.map(interest => interest.id) || []
    console.log(`📋 [Supabase] Found ${realInterestIds.length} real interest UUIDs`)

    if (realInterestIds.length === 0) {
      console.log('ℹ️ [Supabase] No real interest UUIDs found')
      return { success: true, faqs: [], total: 0 }
    }

    // 5. Récupérer toutes les FAQ des centres d'intérêt du pack
    const { data: faqs, error: faqsError } = await supabase
      .from('faqs')
      .select(`
        *,
        interests (
          name,
          icon_url
        )
      `)
      .in('interest_id', realInterestIds)
      .eq('is_active', true)
      .order('interests(name)', { ascending: true })
      .order('order_index', { ascending: true })

    if (faqsError) {
      console.error('❌ [Supabase] Error fetching pack FAQs:', faqsError)
      
      // FALLBACK : Si les tables FAQ/interests n'existent pas ou sont vides, retourner des FAQ mockeées
      if (faqsError.message.includes('does not exist') || 
          faqsError.code === 'PGRST204' || 
          faqsError.code === 'PGRST205' ||
          faqsError.message.includes('uuid')) {
        console.log('💡 [Supabase] Tables FAQ/interests non trouvées ou problème UUID, utilisation de FAQ mockeées')
        return await generateMockFAQsForPack(mockInterestIds)
      }
      
      return { success: false, error: faqsError.message, faqs: [] }
    }

    console.log(`✅ [Supabase] Found ${faqs?.length || 0} FAQs for pack`)

    // 4. Grouper les FAQ par centre d'intérêt
    const groupedFAQs = (faqs || []).reduce((acc, faq) => {
      const interestName = faq.interests?.name || 'Autre'
      const interestIcon = faq.interests?.icon_url || '❓'
      
      if (!acc[interestName]) {
        acc[interestName] = {
          interest_name: interestName,
          interest_icon: interestIcon,
          faqs: []
        }
      }
      
      acc[interestName].faqs.push({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        order_index: faq.order_index
      })
      
      return acc
    }, {} as Record<string, any>)

    console.log(`✅ [Supabase] Grouped FAQs into ${Object.keys(groupedFAQs).length} interest groups`)

    return { 
      success: true, 
      faqs: Object.values(groupedFAQs),
      total: faqs?.length || 0
    }
  } catch (error) {
    console.error('💥 [Supabase] Error in getFAQsByPack:', error)
    return { success: false, error: error.message, faqs: [] }
  }
}

/**
 * Récupérer toutes les FAQ (admin)
 */
export async function getAllFAQs(includeInactive = false) {
  try {
    let query = supabase
      .from('faqs')
      .select(`
        *,
        interests (
          name,
          icon_url
        )
      `)

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: faqs, error } = await query.order('interests(name)', { ascending: true })
                                            .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching all FAQs:', error)
      return { success: false, error: error.message, faqs: [] }
    }

    const formattedFAQs = faqs.map(faq => ({
      ...faq,
      interest_name: faq.interests?.name,
      interest_icon: faq.interests?.icon_url
    }))

    return { success: true, faqs: formattedFAQs }
  } catch (error) {
    console.error('Error in getAllFAQs:', error)
    return { success: false, error: error.message, faqs: [] }
  }
}

/**
 * Créer une nouvelle FAQ
 */
export async function createFAQ(faqData: CreateFAQData) {
  try {
    // Pour les FAQ générales, pas besoin de vérifier le centre d'intérêt
    if (faqData.faq_type === 'general' || !faqData.interest_id) {
      // Si pas d'ordre spécifié, mettre à la fin des FAQ générales
      if (!faqData.order_index) {
        const { data: lastFaq } = await supabase
          .from('faqs')
          .select('order_index')
          .eq('faq_type', 'general')
          .order('order_index', { ascending: false })
          .limit(1)
          .single()

        faqData.order_index = (lastFaq?.order_index || 0) + 1
      }

      const faqToInsert = {
        ...faqData,
        interest_id: null,
        faq_type: 'general'
      }

      const { data: newFaq, error } = await supabase
        .from('faqs')
        .insert([faqToInsert])
        .select('*')
        .single()

      if (error) {
        console.error('Error creating general FAQ:', error)
        return { success: false, error: error.message }
      }

      const formattedFaq = {
        ...newFaq,
        interest_name: 'GasyWay',
        interest_icon: '❓'
      }

      return { success: true, faq: formattedFaq }
    }

    // Pour les FAQ liées aux centres d'intérêt
    const { data: interest, error: interestError } = await supabase
      .from('interests')
      .select('id, name')
      .eq('id', faqData.interest_id)
      .single()

    if (interestError || !interest) {
      return { success: false, error: 'Centre d\'intérêt non trouvé' }
    }

    // Si pas d'ordre spécifié, mettre à la fin
    if (!faqData.order_index) {
      const { data: lastFaq } = await supabase
        .from('faqs')
        .select('order_index')
        .eq('interest_id', faqData.interest_id)
        .order('order_index', { ascending: false })
        .limit(1)
        .single()

      faqData.order_index = (lastFaq?.order_index || 0) + 1
    }

    const faqToInsert = {
      ...faqData,
      faq_type: 'interest'
    }

    const { data: newFaq, error } = await supabase
      .from('faqs')
      .insert([faqToInsert])
      .select(`
        *,
        interests (
          name,
          icon_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating FAQ:', error)
      return { success: false, error: error.message }
    }

    const formattedFaq = {
      ...newFaq,
      interest_name: newFaq.interests?.name,
      interest_icon: newFaq.interests?.icon_url
    }

    return { success: true, faq: formattedFaq }
  } catch (error) {
    console.error('Error in createFAQ:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Mettre à jour une FAQ
 */
export async function updateFAQ(faqId: string, updates: UpdateFAQData) {
  try {
    const { data: updatedFaq, error } = await supabase
      .from('faqs')
      .update(updates)
      .eq('id', faqId)
      .select(`
        *,
        interests (
          name,
          icon_url
        )
      `)
      .single()

    if (error) {
      console.error('Error updating FAQ:', error)
      return { success: false, error: error.message }
    }

    const formattedFaq = {
      ...updatedFaq,
      interest_name: updatedFaq.interests?.name,
      interest_icon: updatedFaq.interests?.icon_url
    }

    return { success: true, faq: formattedFaq }
  } catch (error) {
    console.error('Error in updateFAQ:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Supprimer une FAQ
 */
export async function deleteFAQ(faqId: string) {
  try {
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', faqId)

    if (error) {
      console.error('Error deleting FAQ:', error)
      return { success: false, error: error.message }
    }

    return { success: true, message: 'FAQ supprimée avec succès' }
  } catch (error) {
    console.error('Error in deleteFAQ:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Réorganiser l'ordre des FAQ d'un centre d'intérêt
 */
export async function reorderFAQs(interestId: string, faqIds: string[]) {
  try {
    const updates = faqIds.map((faqId, index) => ({
      id: faqId,
      order_index: index + 1
    }))

    const { error } = await supabase
      .from('faqs')
      .upsert(updates, { onConflict: 'id' })

    if (error) {
      console.error('Error reordering FAQs:', error)
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Ordre des FAQ mis à jour' }
  } catch (error) {
    console.error('Error in reorderFAQs:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Statistiques FAQ (admin)
 */
export async function getFAQStats() {
  try {
    const { data: stats, error } = await supabase.rpc('get_faq_stats')

    if (error) {
      // Fallback si la fonction n'existe pas
      const [totalResult, activeResult, byInterestResult] = await Promise.all([
        supabase.from('faqs').select('id', { count: 'exact' }),
        supabase.from('faqs').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('faqs').select('interest_id', { count: 'exact' }).eq('is_active', true)
      ])

      return {
        success: true,
        stats: {
          total_faqs: totalResult.count || 0,
          active_faqs: activeResult.count || 0,
          interests_with_faqs: byInterestResult.data?.length || 0
        }
      }
    }

    return { success: true, stats }
  } catch (error) {
    console.error('Error in getFAQStats:', error)
    return { success: false, error: error.message, stats: {} }
  }
}