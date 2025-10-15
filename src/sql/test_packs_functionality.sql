-- ===============================================
-- TEST FONCTIONNALITÉS PACKS SUPABASE 🧪
-- Vérification que tout fonctionne correctement
-- ===============================================

-- 🔍 VÉRIFICATION 1: TABLES EXISTANTES
-- ====================================

SELECT '🔍 VÉRIFICATION DES TABLES' as test_section;

SELECT 
  table_name,
  CASE 
    WHEN table_name = 'pack_categories' THEN '✅'
    WHEN table_name = 'packs' THEN '✅'
    WHEN table_name = 'pack_images' THEN '✅'
    WHEN table_name = 'pack_services' THEN '✅'
    WHEN table_name = 'pack_itinerary' THEN '✅'
    ELSE '❓'
  END as status
FROM information_schema.tables 
WHERE table_name LIKE 'pack%'
  AND table_schema = 'public'
ORDER BY table_name;

-- 🧪 VÉRIFICATION 2: DONNÉES D'EXEMPLE
-- ===================================

SELECT '🧪 VÉRIFICATION DES DONNÉES' as test_section;

-- Compter les catégories
SELECT 
  'pack_categories' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM pack_categories;

-- Compter les packs
SELECT 
  'packs' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM packs;

-- Compter les images
SELECT 
  'pack_images' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM pack_images;

-- Compter les services
SELECT 
  'pack_services' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM pack_services;

-- Compter l'itinéraire
SELECT 
  'pack_itinerary' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM pack_itinerary;

-- 🎯 VÉRIFICATION 3: REQUÊTES COMME L'APPLICATION
-- ===============================================

SELECT '🎯 SIMULATION REQUÊTES APPLICATION' as test_section;

-- Requête complète comme dans PacksManagement.tsx
SELECT 
  'REQUÊTE COMPLÈTE (comme dans l''app)' as test_name,
  COUNT(*) as packs_returned,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM (
  SELECT 
    p.*,
    pc.name as category_name,
    pc.icon as category_icon,
    COALESCE(img_count.count, 0) as images_count,
    COALESCE(serv_incl.count, 0) as included_services_count,
    COALESCE(serv_excl.count, 0) as excluded_services_count
  FROM packs p
  LEFT JOIN pack_categories pc ON p.category_id = pc.id
  LEFT JOIN (
    SELECT pack_id, COUNT(*) as count 
    FROM pack_images 
    GROUP BY pack_id
  ) img_count ON p.id = img_count.pack_id
  LEFT JOIN (
    SELECT pack_id, COUNT(*) as count 
    FROM pack_services 
    WHERE is_included = true 
    GROUP BY pack_id
  ) serv_incl ON p.id = serv_incl.pack_id
  LEFT JOIN (
    SELECT pack_id, COUNT(*) as count 
    FROM pack_services 
    WHERE is_included = false 
    GROUP BY pack_id
  ) serv_excl ON p.id = serv_excl.pack_id
  ORDER BY p.created_at DESC
) complete_query;

-- 🔐 VÉRIFICATION 4: POLITIQUES RLS
-- =================================

SELECT '🔐 VÉRIFICATION RLS' as test_section;

-- Vérifier que RLS est activé
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as status
FROM pg_tables 
WHERE tablename LIKE 'pack%'
  AND schemaname = 'public'
ORDER BY tablename;

-- Compter les politiques RLS par table
SELECT 
  tablename,
  COUNT(*) as policies_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM pg_policies 
WHERE tablename LIKE 'pack%'
GROUP BY tablename
ORDER BY tablename;

-- 📊 VÉRIFICATION 5: DONNÉES DÉTAILLÉES
-- =====================================

SELECT '📊 APERÇU DES DONNÉES CRÉÉES' as test_section;

-- Aperçu des catégories
SELECT 
  'CATÉGORIES:' as info,
  name,
  icon,
  description
FROM pack_categories
ORDER BY name;

-- Aperçu des packs avec catégorie
SELECT 
  'PACKS:' as info,
  p.title,
  pc.name as category,
  p.status,
  p.difficulty_level,
  p.price,
  p.duration_days,
  p.location
FROM packs p
LEFT JOIN pack_categories pc ON p.category_id = pc.id
ORDER BY p.created_at DESC;

-- Aperçu des services par pack
SELECT 
  'SERVICES PAR PACK:' as info,
  p.title as pack_title,
  ps.service_name,
  CASE WHEN ps.is_included THEN 'Inclus' ELSE 'Exclu' END as service_type
FROM packs p
JOIN pack_services ps ON p.id = ps.pack_id
ORDER BY p.title, ps.is_included DESC, ps.display_order;

-- Aperçu des images par pack
SELECT 
  'IMAGES PAR PACK:' as info,
  p.title as pack_title,
  pi.image_url,
  CASE WHEN pi.is_primary THEN 'Principale' ELSE 'Secondaire' END as image_type
FROM packs p
JOIN pack_images pi ON p.id = pi.pack_id
ORDER BY p.title, pi.display_order;

-- 🎉 RÉSULTAT FINAL
-- ==================

SELECT '🎉 RÉSULTAT FINAL DU TEST' as test_section;

DO $$
DECLARE
  categories_count INTEGER;
  packs_count INTEGER;
  images_count INTEGER;
  services_count INTEGER;
  itinerary_count INTEGER;
  policies_count INTEGER;
  all_tests_passed BOOLEAN := true;
BEGIN
  -- Compter les éléments
  SELECT COUNT(*) INTO categories_count FROM pack_categories;
  SELECT COUNT(*) INTO packs_count FROM packs;
  SELECT COUNT(*) INTO images_count FROM pack_images;
  SELECT COUNT(*) INTO services_count FROM pack_services;
  SELECT COUNT(*) INTO itinerary_count FROM pack_itinerary;
  SELECT COUNT(*) INTO policies_count FROM pg_policies WHERE tablename LIKE 'pack%';
  
  -- Vérifications
  IF categories_count = 0 THEN all_tests_passed := false; END IF;
  IF packs_count = 0 THEN all_tests_passed := false; END IF;
  IF images_count = 0 THEN all_tests_passed := false; END IF;
  IF services_count = 0 THEN all_tests_passed := false; END IF;
  IF itinerary_count = 0 THEN all_tests_passed := false; END IF;
  IF policies_count = 0 THEN all_tests_passed := false; END IF;
  
  -- Résultat
  IF all_tests_passed THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 TOUS LES TESTS SONT RÉUSSIS !';
    RAISE NOTICE '================================';
    RAISE NOTICE '✅ Tables créées: 5/5';
    RAISE NOTICE '✅ Catégories: %', categories_count;
    RAISE NOTICE '✅ Packs: %', packs_count;
    RAISE NOTICE '✅ Images: %', images_count;
    RAISE NOTICE '✅ Services: %', services_count;
    RAISE NOTICE '✅ Itinéraires: %', itinerary_count;
    RAISE NOTICE '✅ Politiques RLS: %', policies_count;
    RAISE NOTICE '';
    RAISE NOTICE '🚀 LE SYSTÈME PACKS EST PRÊT À ÊTRE UTILISÉ !';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '❌ CERTAINS TESTS ONT ÉCHOUÉ !';
    RAISE NOTICE '============================';
    RAISE NOTICE 'Catégories: %', categories_count;
    RAISE NOTICE 'Packs: %', packs_count;
    RAISE NOTICE 'Images: %', images_count;
    RAISE NOTICE 'Services: %', services_count;
    RAISE NOTICE 'Itinéraires: %', itinerary_count;
    RAISE NOTICE 'Politiques RLS: %', policies_count;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  VÉRIFIEZ LES RÉSULTATS CI-DESSUS !';
    RAISE NOTICE '';
  END IF;
END $$;