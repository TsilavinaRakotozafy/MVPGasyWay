-- =================================================================
-- DIAGNOSTIC STRUCTURE BASE DE DONNÉES GASYWAY
-- Pour identifier les tables existantes avant de créer les vues
-- =================================================================

-- 📊 LISTER TOUTES LES TABLES EXISTANTES
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 📊 VÉRIFIER LES TABLES SPÉCIFIQUES ATTENDUES
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'users', 'packs', 'categories', 'partners', 'bookings', 
            'reviews', 'favorites', 'notifications', 'services', 
            'service_categories', 'conversations', 'messages'
        ) THEN '✅ Attendue'
        ELSE '❓ Nouvelle'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 📊 STRUCTURE DE LA TABLE PACKS (pour voir les colonnes disponibles)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'packs'
ORDER BY ordinal_position;

-- 📊 VÉRIFIER SI categories/interest_categories/pack_categories existe
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%categor%'
ORDER BY table_name;

-- 📊 VÉRIFIER SI la table interests existe (peut remplacer categories)
SELECT 
    table_name,
    'Peut remplacer categories' as note
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('interests', 'interest_categories', 'pack_categories')
ORDER BY table_name;

-- 📊 STRUCTURE COMPLÈTE DES RELATIONS PACK
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'packs';

-- 📊 COMPTER LES DONNÉES EXISTANTES
SELECT 
    'users' as table_name,
    COUNT(*) as row_count
FROM users
UNION ALL
SELECT 
    'packs' as table_name,
    COUNT(*) as row_count
FROM packs
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') 
        THEN 'categories'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interest_categories')
        THEN 'interest_categories'
        ELSE 'NO_CATEGORY_TABLE'
    END as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') 
        THEN (SELECT COUNT(*) FROM categories)
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interest_categories')
        THEN (SELECT COUNT(*) FROM interest_categories)
        ELSE 0
    END as row_count;

-- 📊 DERNIÈRE VÉRIFICATION - TABLES AVEC "PACK" DANS LE NOM
SELECT 
    table_name,
    'Table liée aux packs' as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%pack%'
ORDER BY table_name;