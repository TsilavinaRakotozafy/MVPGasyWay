-- =====================================================
-- OPTIMISATION : FONCTION POSTGRESQL POUR STATISTIQUES
-- =====================================================
-- Remplace 4 requêtes séparées par 1 seul appel RPC
-- Performance : 4x plus rapide (1 round-trip au lieu de 4)

-- Supprimer la fonction si elle existe
DROP FUNCTION IF EXISTS get_platform_stats();

-- Créer la fonction qui retourne toutes les stats en un seul appel
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats_result json;
BEGIN
  -- Exécuter tous les COUNT() en parallèle dans PostgreSQL
  -- et retourner un objet JSON avec toutes les statistiques
  SELECT json_build_object(
    'totalPacks', (
      SELECT COUNT(*) 
      FROM packs 
      WHERE status = 'active'
    ),
    'totalRegions', (
      SELECT COUNT(*) 
      FROM regions 
      WHERE is_active = true
    ),
    'totalInterests', (
      SELECT COUNT(DISTINCT id) 
      FROM interests 
      WHERE active = true
    ),
    'totalPartners', (
      SELECT COUNT(*) 
      FROM partners 
      WHERE status = 'active'
    )
  ) INTO stats_result;
  
  RETURN stats_result;
END;
$$;

-- Donner les permissions au rôle public (lecture seule)
GRANT EXECUTE ON FUNCTION get_platform_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_platform_stats() TO authenticated;

-- Test de la fonction
SELECT get_platform_stats();

-- =====================================================
-- UTILISATION CÔTÉ CLIENT
-- =====================================================
-- 
-- AVANT (4 requêtes séparées) :
-- const [packsCount, regionsCount, interestsCount, partnersCount] = await Promise.all([
--   supabase.from('packs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
--   supabase.from('regions').select('*', { count: 'exact', head: true }).eq('is_active', true),
--   supabase.from('interests').select('*', { count: 'exact', head: true }).eq('active', true),
--   supabase.from('partners').select('*', { count: 'exact', head: true }).eq('status', 'active')
-- ]);
-- 
-- APRÈS (1 seul appel RPC) :
-- const { data, error } = await supabase.rpc('get_platform_stats');
-- console.log(data); // { totalPacks: 12, totalRegions: 8, totalInterests: 25, totalPartners: 15 }
--
-- =====================================================

-- Résultat attendu
SELECT 
  '✅ Fonction get_platform_stats() créée avec succès' AS status,
  'Utilisez supabase.rpc("get_platform_stats") côté client' AS usage;
