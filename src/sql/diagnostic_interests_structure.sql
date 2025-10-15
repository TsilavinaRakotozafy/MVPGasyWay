-- =====================================================
-- DIAGNOSTIC DE LA STRUCTURE DE LA TABLE INTERESTS
-- À exécuter dans Supabase SQL Editor AVANT le script de régions
-- =====================================================

-- 1. ANALYSER LA STRUCTURE DE LA TABLE INTERESTS
-- =====================================================

SELECT 
    '=== STRUCTURE DE LA TABLE INTERESTS ===' as diagnostic_step,
    NULL as table_name,
    NULL as column_name,
    NULL as data_type,
    NULL as is_nullable,
    NULL as column_default
UNION ALL
SELECT 
    'Column Info' as diagnostic_step,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'interests' 
ORDER BY diagnostic_step DESC, ordinal_position;

-- 2. VÉRIFIER SI LA TABLE INTEREST_CATEGORIES EXISTE
-- =====================================================

SELECT 
    '=== VÉRIFICATION INTEREST_CATEGORIES ===' as diagnostic_step,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interest_categories') 
        THEN 'Table interest_categories EXISTS' 
        ELSE 'Table interest_categories NOT FOUND' 
    END as result;

-- 3. AFFICHER UN ÉCHANTILLON DE DONNÉES INTERESTS
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interests') THEN
        RAISE NOTICE '=== ÉCHANTILLON DE DONNÉES INTERESTS ===';
        -- Cette partie sera visible dans les logs Supabase
        PERFORM 1;
    ELSE
        RAISE NOTICE 'TABLE INTERESTS NOT FOUND!';
    END IF;
END $$;

-- Requête pour voir les données (si la table existe)
SELECT 
    '=== SAMPLE INTERESTS DATA ===' as diagnostic_step,
    id,
    name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interests' AND column_name = 'emoji')
        THEN 'HAS EMOJI COLUMN'
        ELSE 'NO EMOJI COLUMN'
    END as emoji_status,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interests' AND column_name = 'icon')
        THEN 'HAS ICON COLUMN' 
        ELSE 'NO ICON COLUMN'
    END as icon_status,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interests' AND column_name = 'category')
        THEN 'HAS CATEGORY COLUMN (STRING)'
        ELSE 'NO CATEGORY COLUMN'
    END as category_status,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interests' AND column_name = 'category_id')
        THEN 'HAS CATEGORY_ID COLUMN (UUID)'
        ELSE 'NO CATEGORY_ID COLUMN'
    END as category_id_status
FROM interests
LIMIT 3
UNION ALL
SELECT 
    'TOTAL INTERESTS COUNT' as diagnostic_step,
    (SELECT COUNT(*)::text FROM interests) as id,
    NULL as name,
    NULL as emoji_status,
    NULL as icon_status, 
    NULL as category_status,
    NULL as category_id_status;

-- 4. VÉRIFIER LES TYPES DE DONNÉES POUR CATEGORY
-- =====================================================

SELECT 
    '=== CATEGORY COLUMN ANALYSIS ===' as diagnostic_step,
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'uuid' THEN 'UUID TYPE - REFERENCES TABLE'
        WHEN data_type LIKE 'character%' OR data_type = 'text' THEN 'STRING TYPE - DIRECT VALUE'
        ELSE 'OTHER TYPE: ' || data_type
    END as interpretation
FROM information_schema.columns 
WHERE table_name = 'interests' 
AND (column_name = 'category' OR column_name = 'category_id');

-- 5. SI CATEGORY_ID EXISTE, AFFICHER LES CATÉGORIES
-- =====================================================

DO $$
DECLARE
    has_category_id boolean;
    has_category_table boolean;
BEGIN
    -- Vérifier si category_id existe
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'interests' AND column_name = 'category_id'
    ) INTO has_category_id;
    
    -- Vérifier si la table interest_categories existe
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'interest_categories'
    ) INTO has_category_table;
    
    IF has_category_id AND has_category_table THEN
        RAISE NOTICE 'FOUND: interests.category_id (UUID) + interest_categories table';
        -- Les catégories seront affichées dans la requête suivante
    ELSIF has_category_id AND NOT has_category_table THEN
        RAISE NOTICE 'WARNING: interests.category_id exists but no interest_categories table found!';
    ELSE
        RAISE NOTICE 'INFO: Using direct category strings (no category_id)';
    END IF;
END $$;

-- Afficher les catégories si elles existent
SELECT 
    '=== CATEGORIES AVAILABLE ===' as diagnostic_step,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interest_categories')
        THEN ic.name
        ELSE 'NO CATEGORIES TABLE'
    END as category_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interest_categories')
        THEN ic.id::text
        ELSE NULL
    END as category_id
FROM interest_categories ic
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interest_categories')
LIMIT 10;

-- =====================================================
-- RECOMMANDATIONS BASÉES SUR LA STRUCTURE DÉTECTÉE
-- =====================================================

SELECT '=== RECOMMANDATIONS ===' as diagnostic_step,
CASE 
    WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interests' AND column_name = 'category_id')
         AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interest_categories')
    THEN 'STRUCTURE RELATIONNELLE: Utilisez interest_categories.name via category_id'
    
    WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interests' AND column_name = 'category')
    THEN 'STRUCTURE DIRECTE: Utilisez interests.category (string direct)'
    
    ELSE 'STRUCTURE INCONNUE: Vérifiez vos colonnes manuellement'
END as recommendation;