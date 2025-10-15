/**
 * =====================================================
 * HOOK : useCompanyInfo avec cache localStorage
 * =====================================================
 * Cache TTL : 30 minutes (données changent rarement)
 * Invalidation automatique après mise à jour admin
 */

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { CompanyInfo } from '../supabase/functions/server/company-info';

const CACHE_KEY = 'gasyway_company_info';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes en millisecondes

interface CachedData {
  data: CompanyInfo;
  timestamp: number;
}

interface UseCompanyInfoReturn {
  data: CompanyInfo | null;
  loading: boolean;
  error: any;
  refresh: () => Promise<void>;
}

/**
 * Hook personnalisé pour récupérer les informations de l'entreprise
 * Avec cache localStorage pour optimiser les performances
 */
export function useCompanyInfo(): UseCompanyInfoReturn {
  const [data, setData] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  /**
   * Charger les données (avec cache)
   */
  async function loadCompanyInfo() {
    try {
      setLoading(true);
      setError(null);

      // 1️⃣ Vérifier le cache localStorage
      const cached = localStorage.getItem(CACHE_KEY);
      
      if (cached) {
        try {
          const { data: cachedData, timestamp }: CachedData = JSON.parse(cached);
          
          // Cache encore valide ?
          if (Date.now() - timestamp < CACHE_TTL) {
            console.log('✅ Company info chargée depuis le cache (5ms)');
            setData(cachedData);
            setLoading(false);
            return;
          } else {
            console.log('⏰ Cache expiré, rechargement depuis Supabase...');
          }
        } catch (parseError) {
          console.warn('⚠️ Erreur parsing cache, rechargement...');
          localStorage.removeItem(CACHE_KEY);
        }
      }

      // 2️⃣ Cache expiré ou inexistant → requête Supabase
      const { data: freshData, error: fetchError } = await supabase
        .from('company_info')
        .select('*')
        .eq('is_active', true)
        .single();

      if (fetchError) {
        console.error('❌ Erreur chargement company_info:', fetchError);
        setError(fetchError);
        setLoading(false);
        return;
      }

      if (!freshData) {
        console.warn('⚠️ Aucune company_info trouvée');
        setData(null);
        setLoading(false);
        return;
      }

      // 3️⃣ Sauvegarder dans le cache
      const cachePayload: CachedData = {
        data: freshData as CompanyInfo,
        timestamp: Date.now()
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
      console.log('✅ Company info chargée depuis Supabase et mise en cache (30 min)');

      setData(freshData as CompanyInfo);
      setLoading(false);
    } catch (err) {
      console.error('❌ Exception useCompanyInfo:', err);
      setError(err);
      setLoading(false);
    }
  }

  /**
   * Forcer le rechargement (invalider le cache)
   */
  async function refresh() {
    console.log('🔄 Invalidation cache company_info...');
    localStorage.removeItem(CACHE_KEY);
    await loadCompanyInfo();
  }

  // Charger au montage du composant
  useEffect(() => {
    loadCompanyInfo();
  }, []);

  return { data, loading, error, refresh };
}

/**
 * Fonction utilitaire pour invalider manuellement le cache
 * Utilisée après une mise à jour admin
 */
export function invalidateCompanyInfoCache() {
  console.log('🗑️ Cache company_info invalidé manuellement');
  localStorage.removeItem(CACHE_KEY);
  
  // Broadcaster aux autres onglets
  window.dispatchEvent(new Event('company_info_updated'));
}
