/**
 * =====================================================
 * ENDPOINT SERVEUR : COMPANY INFO
 * =====================================================
 * Gestion centralisée des informations de l'entreprise
 * Cache recommandé côté client : 30 minutes (données rarement modifiées)
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface CompanyValue {
  icon: string;
  title: string;
  description: string;
}

export interface CompanyInfo {
  id: string;
  // Coordonnées
  contact_email: string;
  contact_phone: string;
  address: string;
  
  // Textes de présentation
  hero_title: string;
  hero_description: string;
  mission_title: string;
  mission_description: string;
  vision_title: string;
  vision_description: string;
  commitment_title: string;
  commitment_description: string;
  
  // Valeurs de l'entreprise
  values?: CompanyValue[];
  
  // Réseaux sociaux
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  whatsapp_number?: string;
  
  // Informations légales
  legal_name?: string;
  registration_number?: string;
  founding_year?: number;
  legal_form?: string;
  
  // Horaires
  business_hours?: string;
  timezone?: string;
  supported_languages?: string[];
  
  // Métadonnées
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Récupérer les informations actives de l'entreprise
 */
export async function getCompanyInfo(
  supabase: SupabaseClient
): Promise<{ data: CompanyInfo | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('company_info')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ Erreur récupération company_info:', error);
      return { data: null, error };
    }

    console.log('✅ Company info récupérée avec succès');
    return { data: data as CompanyInfo, error: null };
  } catch (err) {
    console.error('❌ Exception getCompanyInfo:', err);
    return { data: null, error: err };
  }
}

/**
 * Mettre à jour les informations de l'entreprise (admin uniquement)
 */
export async function updateCompanyInfo(
  supabase: SupabaseClient,
  updates: Partial<Omit<CompanyInfo, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ data: CompanyInfo | null; error: any }> {
  try {
    // Récupérer l'ID de l'enregistrement actif
    const { data: existing, error: fetchError } = await supabase
      .from('company_info')
      .select('id')
      .eq('is_active', true)
      .single();

    if (fetchError || !existing) {
      console.error('❌ Aucune company_info active trouvée');
      return { data: null, error: fetchError || new Error('No active company info found') };
    }

    // Mettre à jour
    const { data, error } = await supabase
      .from('company_info')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour company_info:', error);
      return { data: null, error };
    }

    console.log('✅ Company info mise à jour avec succès');
    return { data: data as CompanyInfo, error: null };
  } catch (err) {
    console.error('❌ Exception updateCompanyInfo:', err);
    return { data: null, error: err };
  }
}

/**
 * Vérifier si l'utilisateur est admin (nécessaire pour les modifications)
 */
export async function isUserAdmin(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    return userData?.role === 'admin';
  } catch (err) {
    console.error('❌ Erreur vérification admin:', err);
    return false;
  }
}
