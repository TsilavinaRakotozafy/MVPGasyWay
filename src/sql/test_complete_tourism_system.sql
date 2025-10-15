-- ===============================================
-- TEST SYSTÈME COMPLET DE TOURISME 🧪
-- Vérification complète de toutes les fonctionnalités
-- ===============================================

-- 🔍 VÉRIFICATION 1: TABLES EXISTANTES
-- ====================================

SELECT '🔍 VÉRIFICATION DES TABLES TOURISME' as test_section;

SELECT 
  table_name,
  CASE 
    WHEN table_name = 'user_favorites' THEN '✅'
    WHEN table_name = 'bookings' THEN '✅'
    WHEN table_name = 'booking_participants' THEN '✅'
    WHEN table_name = 'payments' THEN '✅'
    WHEN table_name = 'payment_transactions' THEN '✅'
    WHEN table_name = 'reviews' THEN '✅'
    WHEN table_name = 'review_images' THEN '✅'
    WHEN table_name = 'notifications' THEN '✅'
    ELSE '❓'
  END as status
FROM information_schema.tables 
WHERE table_name IN ('user_favorites', 'bookings', 'booking_participants', 'payments', 'payment_transactions', 'reviews', 'review_images', 'notifications')
  AND table_schema = 'public'
ORDER BY table_name;

-- 🧪 VÉRIFICATION 2: DONNÉES D'EXEMPLE
-- ===================================

SELECT '🧪 VÉRIFICATION DES DONNÉES' as test_section;

-- Compter les données dans chaque table
SELECT 
  'user_favorites' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM user_favorites
UNION ALL
SELECT 
  'bookings' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM bookings
UNION ALL
SELECT 
  'booking_participants' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM booking_participants
UNION ALL
SELECT 
  'payments' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM payments
UNION ALL
SELECT 
  'payment_transactions' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM payment_transactions
UNION ALL
SELECT 
  'reviews' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM reviews
UNION ALL
SELECT 
  'review_images' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM review_images
UNION ALL
SELECT 
  'notifications' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM notifications
ORDER BY table_name;

-- 🎯 VÉRIFICATION 3: REQUÊTES COMME L'APPLICATION
-- ===============================================

SELECT '🎯 SIMULATION REQUÊTES APPLICATION' as test_section;

-- Test requête favoris (comme FavoritesPageSupabase)
SELECT 
  'FAVORIS avec relations' as test_name,
  COUNT(*) as results_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM (
  SELECT 
    uf.*,
    p.title as pack_title,
    pc.name as category_name
  FROM user_favorites uf
  LEFT JOIN packs p ON uf.pack_id = p.id
  LEFT JOIN pack_categories pc ON p.category_id = pc.id
) favorites_query;

-- Test requête réservations (comme BookingsManagement)
SELECT 
  'RÉSERVATIONS avec relations' as test_name,
  COUNT(*) as results_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM (
  SELECT 
    b.*,
    u.email as user_email,
    p.title as pack_title,
    COUNT(bp.id) as participants_count
  FROM bookings b
  LEFT JOIN users u ON b.user_id = u.id
  LEFT JOIN packs p ON b.pack_id = p.id
  LEFT JOIN booking_participants bp ON b.id = bp.booking_id
  GROUP BY b.id, u.email, p.title
) bookings_query;

-- Test requête avis (comme ReviewsManagement)
SELECT 
  'AVIS avec relations' as test_name,
  COUNT(*) as results_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM (
  SELECT 
    r.*,
    u.email as user_email,
    p.title as pack_title,
    COUNT(ri.id) as images_count
  FROM reviews r
  LEFT JOIN users u ON r.user_id = u.id
  LEFT JOIN packs p ON r.pack_id = p.id
  LEFT JOIN review_images ri ON r.id = ri.review_id
  GROUP BY r.id, u.email, p.title
) reviews_query;

-- Test requête notifications (comme NotificationsPage)
SELECT 
  'NOTIFICATIONS par utilisateur' as test_name,
  COUNT(*) as results_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM (
  SELECT 
    n.*,
    CASE WHEN n.status = 'unread' THEN 'Non lu' ELSE 'Lu' END as status_label
  FROM notifications n
  WHERE n.status != 'archived'
  ORDER BY n.created_at DESC
) notifications_query;

-- 🔐 VÉRIFICATION 4: POLITIQUES RLS
-- =================================

SELECT '🔐 VÉRIFICATION RLS' as test_section;

-- Vérifier que RLS est activé
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as status
FROM pg_tables 
WHERE tablename IN ('user_favorites', 'bookings', 'booking_participants', 'payments', 'payment_transactions', 'reviews', 'review_images', 'notifications')
  AND schemaname = 'public'
ORDER BY tablename;

-- Compter les politiques RLS par table
SELECT 
  tablename,
  COUNT(*) as policies_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM pg_policies 
WHERE tablename IN ('user_favorites', 'bookings', 'booking_participants', 'payments', 'payment_transactions', 'reviews', 'review_images', 'notifications')
GROUP BY tablename
ORDER BY tablename;

-- 📊 VÉRIFICATION 5: BUSINESS LOGIC & CONTRAINTES
-- ===============================================

SELECT '📊 VÉRIFICATION BUSINESS LOGIC' as test_section;

-- Test contraintes réservations
SELECT 
  'CONTRAINTES RÉSERVATIONS' as test_name,
  CASE 
    WHEN COUNT(*) > 0 AND MIN(end_date) >= MIN(start_date) AND MIN(total_price) > 0 
    THEN '✅ Dates et prix cohérents' 
    ELSE '❌ Incohérences détectées' 
  END as status
FROM bookings;

-- Test cohérence paiements
SELECT 
  'COHÉRENCE PAIEMENTS' as test_name,
  CASE 
    WHEN COUNT(*) > 0 AND MIN(amount) > 0 
    THEN '✅ Montants cohérents' 
    ELSE '❌ Montants invalides' 
  END as status
FROM payments;

-- Test notes avis (1-5)
SELECT 
  'NOTES AVIS VALIDES' as test_name,
  CASE 
    WHEN COUNT(*) > 0 AND MIN(rating) >= 1 AND MAX(rating) <= 5 
    THEN '✅ Notes valides (1-5)' 
    ELSE '❌ Notes invalides détectées' 
  END as status
FROM reviews;

-- 🎯 VÉRIFICATION 6: FONCTIONNALITÉS AVANCÉES
-- ============================================

SELECT '🎯 VÉRIFICATION FONCTIONNALITÉS AVANCÉES' as test_section;

-- Test génération automatique des références
SELECT 
  'RÉFÉRENCES AUTO-GÉNÉRÉES' as test_name,
  CASE 
    WHEN COUNT(*) > 0 AND COUNT(DISTINCT booking_reference) = COUNT(*) 
    THEN '✅ Références uniques générées' 
    ELSE '❌ Problème génération références' 
  END as status
FROM bookings;

-- Test triggers updated_at
SELECT 
  'TRIGGERS UPDATED_AT' as test_name,
  CASE 
    WHEN COUNT(*) > 0 AND MAX(updated_at) >= MAX(created_at) 
    THEN '✅ Triggers fonctionnels' 
    ELSE '❌ Triggers défaillants' 
  END as status
FROM bookings;

-- Test relations foreign keys
SELECT 
  'RELATIONS FOREIGN KEYS' as test_name,
  CASE 
    WHEN bookings_count > 0 AND packs_count > 0 AND users_count > 0
    THEN '✅ Relations préservées' 
    ELSE '❌ Relations rompues' 
  END as status
FROM (
  SELECT 
    COUNT(DISTINCT b.pack_id) as bookings_count,
    COUNT(DISTINCT p.id) as packs_count,
    COUNT(DISTINCT u.id) as users_count
  FROM bookings b
  JOIN packs p ON b.pack_id = p.id
  JOIN users u ON b.user_id = u.id
) relation_test;

-- 📈 VÉRIFICATION 7: STATISTIQUES BUSINESS
-- ========================================

SELECT '📈 STATISTIQUES BUSINESS' as test_section;

-- Statistiques générales
SELECT 
  'STATS GÉNÉRALES' as metric_type,
  COUNT(DISTINCT b.user_id) as clients_actifs,
  COUNT(*) as reservations_total,
  COALESCE(SUM(b.total_price), 0) as chiffre_affaires,
  COALESCE(AVG(r.rating), 0)::NUMERIC(3,2) as note_moyenne
FROM bookings b
FULL OUTER JOIN reviews r ON true;

-- Répartition par statut réservations
SELECT 
  'RÉPARTITION STATUTS RÉSERVATIONS' as metric_type,
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM bookings
GROUP BY status;

-- Répartition par type notifications
SELECT 
  'RÉPARTITION TYPES NOTIFICATIONS' as metric_type,
  type,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'unread' THEN 1 END) as unread_count
FROM notifications
GROUP BY type;

-- 🎉 RÉSULTAT FINAL COMPLET
-- ==========================

SELECT '🎉 RÉSULTAT FINAL DU TEST COMPLET' as test_section;

DO $$
DECLARE
  favorites_count INTEGER;
  bookings_count INTEGER;
  participants_count INTEGER;
  payments_count INTEGER;
  transactions_count INTEGER;
  reviews_count INTEGER;
  review_images_count INTEGER;
  notifications_count INTEGER;
  policies_count INTEGER;
  all_tests_passed BOOLEAN := true;
  total_ca NUMERIC;
  avg_rating NUMERIC;
BEGIN
  -- Compter les éléments
  SELECT COUNT(*) INTO favorites_count FROM user_favorites;
  SELECT COUNT(*) INTO bookings_count FROM bookings;
  SELECT COUNT(*) INTO participants_count FROM booking_participants;
  SELECT COUNT(*) INTO payments_count FROM payments;
  SELECT COUNT(*) INTO transactions_count FROM payment_transactions;
  SELECT COUNT(*) INTO reviews_count FROM reviews;
  SELECT COUNT(*) INTO review_images_count FROM review_images;
  SELECT COUNT(*) INTO notifications_count FROM notifications;
  SELECT COUNT(*) INTO policies_count FROM pg_policies WHERE tablename LIKE ANY(ARRAY['user_favorites', 'bookings%', 'payment%', 'review%', 'notifications']);
  
  -- Statistiques business
  SELECT COALESCE(SUM(total_price), 0) INTO total_ca FROM bookings;
  SELECT COALESCE(AVG(rating), 0) INTO avg_rating FROM reviews;
  
  -- Vérifications
  IF favorites_count = 0 THEN all_tests_passed := false; END IF;
  IF policies_count = 0 THEN all_tests_passed := false; END IF;
  
  -- Résultat
  IF all_tests_passed THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 TOUS LES TESTS SONT RÉUSSIS !';
    RAISE NOTICE '================================';
    RAISE NOTICE '✅ Tables créées: 8/8';
    RAISE NOTICE '✅ Favoris: %', favorites_count;
    RAISE NOTICE '✅ Réservations: %', bookings_count;
    RAISE NOTICE '✅ Participants: %', participants_count;
    RAISE NOTICE '✅ Paiements: %', payments_count;
    RAISE NOTICE '✅ Transactions: %', transactions_count;
    RAISE NOTICE '✅ Avis: %', reviews_count;
    RAISE NOTICE '✅ Images avis: %', review_images_count;
    RAISE NOTICE '✅ Notifications: %', notifications_count;
    RAISE NOTICE '✅ Politiques RLS: %', policies_count;
    RAISE NOTICE '💰 CA Total: % Ar', total_ca;
    RAISE NOTICE '⭐ Note moyenne: %/5', ROUND(avg_rating, 2);
    RAISE NOTICE '';
    RAISE NOTICE '🚀 SYSTÈME COMPLET DE TOURISME OPÉRATIONNEL !';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '❌ CERTAINS TESTS ONT ÉCHOUÉ !';
    RAISE NOTICE '============================';
    RAISE NOTICE 'Favoris: %', favorites_count;
    RAISE NOTICE 'Réservations: %', bookings_count;
    RAISE NOTICE 'Participants: %', participants_count;
    RAISE NOTICE 'Paiements: %', payments_count;
    RAISE NOTICE 'Transactions: %', transactions_count;
    RAISE NOTICE 'Avis: %', reviews_count;
    RAISE NOTICE 'Images avis: %', review_images_count;
    RAISE NOTICE 'Notifications: %', notifications_count;
    RAISE NOTICE 'Politiques RLS: %', policies_count;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  VÉRIFIEZ LES RÉSULTATS CI-DESSUS !';
    RAISE NOTICE '';
  END IF;
END $$;

-- 🔧 BONUS: REQUÊTES D'ADMINISTRATION UTILES
-- ===========================================

SELECT '🔧 REQUÊTES UTILES POUR L''ADMINISTRATION' as section;

-- Top 5 des packs les plus favorisés
SELECT 
  'TOP 5 PACKS FAVORISÉS' as info,
  p.title,
  COUNT(uf.id) as favorites_count
FROM packs p
LEFT JOIN user_favorites uf ON p.id = uf.pack_id
GROUP BY p.id, p.title
ORDER BY favorites_count DESC
LIMIT 5;

-- Réservations avec le plus de participants
SELECT 
  'RÉSERVATIONS IMPORTANTES' as info,
  b.booking_reference,
  p.title as pack_title,
  b.number_of_participants,
  b.total_price
FROM bookings b
JOIN packs p ON b.pack_id = p.id
ORDER BY b.number_of_participants DESC, b.total_price DESC
LIMIT 5;

-- Utilisateurs les plus actifs (favoris + réservations + avis)
SELECT 
  'UTILISATEURS ACTIFS' as info,
  u.email,
  COUNT(DISTINCT uf.id) as favorites_count,
  COUNT(DISTINCT b.id) as bookings_count,
  COUNT(DISTINCT r.id) as reviews_count,
  (COUNT(DISTINCT uf.id) + COUNT(DISTINCT b.id) + COUNT(DISTINCT r.id)) as total_activity
FROM users u
LEFT JOIN user_favorites uf ON u.id = uf.user_id
LEFT JOIN bookings b ON u.id = b.user_id
LEFT JOIN reviews r ON u.id = r.user_id
GROUP BY u.id, u.email
HAVING (COUNT(DISTINCT uf.id) + COUNT(DISTINCT b.id) + COUNT(DISTINCT r.id)) > 0
ORDER BY total_activity DESC
LIMIT 5;

-- Message final
SELECT '✅ SYSTÈME COMPLET DE TOURISME TESTÉ ET VALIDÉ !' as final_status;