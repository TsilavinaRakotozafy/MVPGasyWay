-- =====================================================
-- VÉRIFICATION SYSTÈME FAQ - GasyWay
-- Script de diagnostic complet
-- =====================================================

-- =====================================================
-- 1. VÉRIFICATION STRUCTURE TABLE
-- =====================================================

SELECT 
    '=== STRUCTURE TABLE FAQS ===' as section;

-- Vérifier l'existence de la table
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'faqs') 
        THEN '✅ Table faqs existe'
        ELSE '❌ Table faqs manquante'
    END as table_status;

-- Vérifier les colonnes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'faq_type' THEN '✅ Support types FAQ'
        WHEN column_name = 'interest_id' AND is_nullable = 'YES' THEN '✅ interest_id optionnel'
        ELSE ''
    END as status
FROM information_schema.columns 
WHERE table_name = 'faqs'
ORDER BY ordinal_position;

-- =====================================================
-- 2. VÉRIFICATION CONTRAINTES
-- =====================================================

SELECT 
    '=== CONTRAINTES ===' as section;

-- Vérifier les contraintes CHECK
SELECT 
    constraint_name,
    check_clause,
    CASE 
        WHEN constraint_name = 'faq_type_consistency' THEN '✅ Contrainte cohérence types'
        WHEN constraint_name LIKE '%faq_type%' THEN '✅ Contrainte valeurs faq_type'
        ELSE ''
    END as status
FROM information_schema.check_constraints
WHERE table_name = 'faqs';

-- =====================================================
-- 3. VÉRIFICATION INDEX
-- =====================================================

SELECT 
    '=== INDEX ===' as section;

-- Vérifier les index
SELECT 
    indexname,
    indexdef,
    CASE 
        WHEN indexname = 'idx_faqs_general' THEN '✅ Index FAQ générales'
        WHEN indexname = 'idx_faqs_type_active' THEN '✅ Index type/actif'
        WHEN indexname LIKE 'idx_faqs%' THEN '✅ Index FAQ'
        ELSE ''
    END as status
FROM pg_indexes 
WHERE tablename = 'faqs'
ORDER BY indexname;

-- =====================================================
-- 4. VÉRIFICATION VUES
-- =====================================================

SELECT 
    '=== VUES ===' as section;

-- Vérifier l'existence des vues
SELECT 
    table_name as view_name,
    CASE 
        WHEN table_name = 'general_faqs' THEN '✅ Vue FAQ générales'
        WHEN table_name = 'pack_faqs' THEN '✅ Vue FAQ packs'
        WHEN table_name = 'admin_faqs_complete' THEN '✅ Vue admin complète'
        ELSE '📋 Vue FAQ'
    END as status
FROM information_schema.views 
WHERE table_name LIKE '%faq%'
ORDER BY table_name;

-- =====================================================
-- 5. VÉRIFICATION DONNÉES
-- =====================================================

SELECT 
    '=== DONNÉES FAQ ===' as section;

-- Compter les FAQ par type
SELECT 
    faq_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_active = true) as actives,
    COUNT(*) FILTER (WHERE is_active = false) as inactives
FROM faqs
GROUP BY faq_type
UNION ALL
SELECT 
    'TOTAL' as faq_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_active = true) as actives,
    COUNT(*) FILTER (WHERE is_active = false) as inactives
FROM faqs;

-- =====================================================
-- 6. VÉRIFICATION FAQ GÉNÉRALES
-- =====================================================

SELECT 
    '=== FAQ GÉNÉRALES ===' as section;

-- Lister les FAQ générales
SELECT 
    order_index,
    LEFT(question, 50) || '...' as question_preview,
    CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END as status
FROM faqs 
WHERE faq_type = 'general'
ORDER BY order_index;

-- =====================================================
-- 7. VÉRIFICATION FAQ PAR CENTRES D'INTÉRÊT
-- =====================================================

SELECT 
    '=== FAQ PAR CENTRES D''INTÉRÊT ===' as section;

-- Compter les FAQ par centre d'intérêt
SELECT 
    i.name_fr as centre_interet,
    i.icon,
    COUNT(f.id) as nb_faqs,
    COUNT(f.id) FILTER (WHERE f.is_active = true) as nb_faqs_actives
FROM interests i
LEFT JOIN faqs f ON i.id = f.interest_id
GROUP BY i.id, i.name_fr, i.icon
HAVING COUNT(f.id) > 0
ORDER BY nb_faqs_actives DESC;

-- =====================================================
-- 8. VÉRIFICATION VUES FONCTIONNELLES
-- =====================================================

SELECT 
    '=== TEST VUES ===' as section;

-- Test vue general_faqs
SELECT 
    'general_faqs' as vue,
    COUNT(*) as nb_elements,
    '✅ Vue fonctionnelle' as status
FROM general_faqs
UNION ALL

-- Test vue pack_faqs
SELECT 
    'pack_faqs' as vue,
    COUNT(DISTINCT pack_id) as nb_elements,
    '✅ Vue fonctionnelle' as status
FROM pack_faqs;

-- =====================================================
-- 9. VÉRIFICATION COHÉRENCE DONNÉES
-- =====================================================

SELECT 
    '=== COHÉRENCE DONNÉES ===' as section;

-- Vérifier les incohérences
SELECT 
    'FAQ générales avec interest_id' as test,
    COUNT(*) as nb_erreurs,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ Erreur' END as status
FROM faqs 
WHERE faq_type = 'general' AND interest_id IS NOT NULL

UNION ALL

SELECT 
    'FAQ interest sans interest_id' as test,
    COUNT(*) as nb_erreurs,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ Erreur' END as status
FROM faqs 
WHERE faq_type = 'interest' AND interest_id IS NULL

UNION ALL

SELECT 
    'FAQ avec interest_id inexistant' as test,
    COUNT(*) as nb_erreurs,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ Erreur' END as status
FROM faqs f
LEFT JOIN interests i ON f.interest_id = i.id
WHERE f.interest_id IS NOT NULL AND i.id IS NULL;

-- =====================================================
-- 10. VÉRIFICATION PERMISSIONS RLS
-- =====================================================

SELECT 
    '=== PERMISSIONS RLS ===' as section;

-- Vérifier si RLS est activé
SELECT 
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN '✅ RLS activé' ELSE '❌ RLS désactivé' END as rls_status
FROM pg_tables 
WHERE tablename = 'faqs';

-- Vérifier les politiques RLS
SELECT 
    policyname,
    cmd,
    qual,
    '✅ Politique active' as status
FROM pg_policies 
WHERE tablename = 'faqs';

-- =====================================================
-- 11. STATISTIQUES DÉTAILLÉES
-- =====================================================

SELECT 
    '=== STATISTIQUES ===' as section;

-- Statistiques par pack (top 5)
SELECT 
    pack_title,
    COUNT(*) as nb_faqs_heritees,
    COUNT(*) FILTER (WHERE faq_type = 'general') as nb_faqs_generales,
    COUNT(*) FILTER (WHERE faq_type = 'interest') as nb_faqs_specifiques
FROM pack_faqs
GROUP BY pack_id, pack_title
ORDER BY nb_faqs_heritees DESC
LIMIT 5;

-- =====================================================
-- 12. RÉSUMÉ FINAL
-- =====================================================

SELECT 
    '=== RÉSUMÉ SYSTÈME FAQ ===' as section;

SELECT 
    '📊 Système FAQ GasyWay' as composant,
    CASE 
        WHEN EXISTS (SELECT 1 FROM faqs WHERE faq_type = 'general')
         AND EXISTS (SELECT 1 FROM general_faqs)
         AND EXISTS (SELECT 1 FROM pack_faqs)
        THEN '✅ OPÉRATIONNEL'
        ELSE '❌ PROBLÈME DÉTECTÉ'
    END as statut,
    (SELECT COUNT(*) FROM faqs WHERE faq_type = 'general') || ' FAQ générales' as detail1,
    (SELECT COUNT(*) FROM faqs WHERE faq_type = 'interest') || ' FAQ spécifiques' as detail2;

-- =====================================================
-- 13. RECOMMANDATIONS
-- =====================================================

SELECT 
    '=== RECOMMANDATIONS ===' as section;

-- Suggestions d'amélioration
WITH stats AS (
    SELECT 
        COUNT(*) FILTER (WHERE faq_type = 'general') as nb_general,
        COUNT(*) FILTER (WHERE faq_type = 'interest') as nb_interest,
        COUNT(DISTINCT interest_id) as nb_interests_with_faqs
    FROM faqs
    WHERE is_active = true
)
SELECT 
    CASE 
        WHEN nb_general < 5 THEN '💡 Ajouter plus de FAQ générales (minimum 5-10 recommandées)'
        WHEN nb_general > 20 THEN '💡 Considérer regrouper certaines FAQ générales'
        ELSE '✅ Nombre de FAQ générales approprié'
    END as recommandation_generale,
    CASE 
        WHEN nb_interests_with_faqs < 3 THEN '💡 Ajouter des FAQ spécifiques pour plus de centres d''intérêt'
        ELSE '✅ Bonne couverture des centres d''intérêt'
    END as recommandation_specifique
FROM stats;