/**
 * =====================================================
 * HOOK : useFAQs avec cache localStorage
 * =====================================================
 * Cache TTL : 30 minutes (FAQ changent rarement)
 * Charge les FAQ générales depuis Supabase
 */

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';

const CACHE_KEY = 'gasyway_general_faqs';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export interface GeneralFAQ {
  id: string;
  question: string;
  answer: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface CachedData {
  data: GeneralFAQ[];
  timestamp: number;
}

interface UseFAQsReturn {
  faqs: GeneralFAQ[];
  loading: boolean;
  error: any;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer les FAQ générales
 * Avec cache localStorage pour optimiser les performances
 */
export function useFAQs(): UseFAQsReturn {
  const [faqs, setFaqs] = useState<GeneralFAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  /**
   * Charger les FAQ (avec cache)
   */
  async function loadFAQs() {
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
            console.log('✅ FAQ générales chargées depuis le cache (5ms)');
            setFaqs(cachedData);
            setLoading(false);
            return;
          } else {
            console.log('⏰ Cache FAQ expiré, rechargement depuis Supabase...');
          }
        } catch (parseError) {
          console.warn('⚠️ Erreur parsing cache FAQ, rechargement...');
          localStorage.removeItem(CACHE_KEY);
        }
      }

      // 2️⃣ Cache expiré ou inexistant → requête Supabase
      const { data: freshData, error: fetchError } = await supabase
        .from('faqs')
        .select('id, question, answer, order_index, created_at, updated_at')
        .eq('faq_type', 'general')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (fetchError) {
        console.error('❌ Erreur chargement FAQ générales:', fetchError);
        setError(fetchError);
        setLoading(false);
        return;
      }

      if (!freshData || freshData.length === 0) {
        console.warn('⚠️ Aucune FAQ générale trouvée');
        setFaqs([]);
        setLoading(false);
        return;
      }

      // 3️⃣ Sauvegarder dans le cache
      const cachePayload: CachedData = {
        data: freshData as GeneralFAQ[],
        timestamp: Date.now()
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
      console.log(`✅ ${freshData.length} FAQ générales chargées depuis Supabase et mises en cache (30 min)`);

      setFaqs(freshData as GeneralFAQ[]);
      setLoading(false);
    } catch (err) {
      console.error('❌ Exception useFAQs:', err);
      setError(err);
      setLoading(false);
    }
  }

  /**
   * Forcer le rechargement (invalider le cache)
   */
  async function refresh() {
    console.log('🔄 Invalidation cache FAQ générales...');
    localStorage.removeItem(CACHE_KEY);
    await loadFAQs();
  }

  // Charger au montage du composant
  useEffect(() => {
    loadFAQs();
  }, []);

  return { faqs, loading, error, refresh };
}

/**
 * Fonction utilitaire pour invalider manuellement le cache
 * Utilisée après une mise à jour admin
 */
export function invalidateFAQsCache() {
  console.log('🗑️ Cache FAQ générales invalidé manuellement');
  localStorage.removeItem(CACHE_KEY);
  
  // Broadcaster aux autres onglets
  window.dispatchEvent(new Event('faqs_updated'));
}
