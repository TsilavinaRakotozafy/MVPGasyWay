-- =================================================================
-- DIAGNOSTIC STRUCTURE TABLE PACKS - GASYWAY
-- Détection automatique des colonnes de la table packs
-- =================================================================

-- 🔍 ÉTAPE 1: Vérifier l'existence et la structure de la table packs
SELECT 
    'PACKS TABLE STATUS' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packs') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status;

-- 🔍 ÉTAPE 2: Lister toutes les colonnes de la table packs
SELECT 
    'PACKS COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'packs' 
ORDER BY ordinal_position;

-- 🔍 ÉTAPE 3: Vérifier les colonnes spécifiques problématiques
SELECT 
    'SPECIFIC COLUMNS CHECK' as check_type,
    'images' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'packs' AND column_name = 'images'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'SPECIFIC COLUMNS CHECK' as check_type,
    'image_url' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'packs' AND column_name = 'image_url'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'SPECIFIC COLUMNS CHECK' as check_type,
    'image_urls' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'packs' AND column_name = 'image_urls'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'SPECIFIC COLUMNS CHECK' as check_type,
    'gallery' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'packs' AND column_name = 'gallery'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status;

-- 🔍 ÉTAPE 4: Aperçu des données actuelles de la table packs
SELECT 
    'PACKS DATA SAMPLE' as check_type,
    id,
    title,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'images') 
        THEN 'images column exists'
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'image_url') 
        THEN 'image_url column exists'
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'image_urls') 
        THEN 'image_urls column exists'
        ELSE 'no image column found'
    END as image_column_status
FROM packs 
LIMIT 3;

-- =================================================================
-- 🔍 ÉTAPE 5: Vérifier autres tables mentionnées dans les vues
-- =================================================================

SELECT 
    'RELATED TABLES STATUS' as check_type,
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_name IN ('categories', 'interest_categories', 'partners', 'bookings', 'reviews', 'favorites', 'notifications', 'conversations')
ORDER BY table_name;

-- =================================================================
-- RÉSULTAT ATTENDU: 
-- Ce script vous donnera la structure exacte de votre table packs
-- et identifiera quelle colonne d'image utiliser dans les vues
-- =================================================================