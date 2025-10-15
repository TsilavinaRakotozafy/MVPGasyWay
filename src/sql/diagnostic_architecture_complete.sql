-- ===============================================
-- DIAGNOSTIC COMPLET DE L'ARCHITECTURE SUPABASE
-- Analyse de toutes les tables et colonnes existantes
-- ===============================================

-- 1. LISTER TOUTES LES TABLES EXISTANTES
SELECT 
  '=== TABLES EXISTANTES ===' as section,
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. ANALYSER LA STRUCTURE DE LA TABLE USERS (si existe)
SELECT 
  '=== STRUCTURE TABLE USERS ===' as section,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. ANALYSER LA STRUCTURE DE LA TABLE PROFILES (si existe)  
SELECT 
  '=== STRUCTURE TABLE PROFILES ===' as section,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. ANALYSER LA STRUCTURE DE LA TABLE INTERESTS (si existe)
SELECT 
  '=== STRUCTURE TABLE INTERESTS ===' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'interests' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. ANALYSER LA STRUCTURE DE LA TABLE INTEREST_CATEGORY (si existe)
SELECT 
  '=== STRUCTURE TABLE INTEREST_CATEGORY ===' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'interest_category' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. ANALYSER LA STRUCTURE DE LA TABLE USER_INTERESTS (si existe)
SELECT 
  '=== STRUCTURE TABLE USER_INTERESTS ===' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_interests' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. ANALYSER LA STRUCTURE DE LA TABLE PARTNERS (si existe)
SELECT 
  '=== STRUCTURE TABLE PARTNERS ===' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'partners' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. ANALYSER LA STRUCTURE DE LA TABLE PACKS (si existe)
SELECT 
  '=== STRUCTURE TABLE PACKS ===' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'packs' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. VÉRIFIER LES TYPES ENUM EXISTANTS
SELECT 
  '=== TYPES ENUM EXISTANTS ===' as section,
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('partner_status', 'partner_type', 'verification_status', 'user_role', 'user_status')
ORDER BY t.typname, e.enumsortorder;

-- 10. VÉRIFIER LES POLITIQUES RLS
SELECT 
  '=== POLITIQUES RLS EXISTANTES ===' as section,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('users', 'profiles', 'interests', 'interest_category', 'user_interests', 'partners', 'packs')
ORDER BY tablename, policyname;

-- 11. COMPTER LES DONNÉES DANS CHAQUE TABLE
SELECT 
  '=== NOMBRE D''ENREGISTREMENTS ===' as section,
  'users' as table_name,
  COUNT(*) as count
FROM users
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')

UNION ALL

SELECT 
  '=== NOMBRE D''ENREGISTREMENTS ===' as section,
  'profiles' as table_name,
  COUNT(*) as count
FROM profiles
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')

UNION ALL

SELECT 
  '=== NOMBRE D''ENREGISTREMENTS ===' as section,
  'interests' as table_name,
  COUNT(*) as count
FROM interests
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interests')

UNION ALL

SELECT 
  '=== NOMBRE D''ENREGISTREMENTS ===' as section,
  'interest_category' as table_name,
  COUNT(*) as count
FROM interest_category
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interest_category')

UNION ALL

SELECT 
  '=== NOMBRE D''ENREGISTREMENTS ===' as section,
  'user_interests' as table_name,
  COUNT(*) as count
FROM user_interests
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_interests')

UNION ALL

SELECT 
  '=== NOMBRE D''ENREGISTREMENTS ===' as section,
  'partners' as table_name,
  COUNT(*) as count
FROM partners
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners')

UNION ALL

SELECT 
  '=== NOMBRE D''ENREGISTREMENTS ===' as section,
  'packs' as table_name,
  COUNT(*) as count
FROM packs
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packs');

-- 12. TESTER UNE REQUÊTE COMME DANS AuthContextSQL.tsx
SELECT 
  '=== TEST REQUÊTE AUTHCONTEXTSQL ===' as section,
  'Colonnes disponibles dans users:' as info,
  column_name
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
AND column_name IN ('first_name', 'last_name', 'phone', 'bio', 'profile_picture_url', 'first_login_completed')
ORDER BY column_name;

-- 13. RÉSUMÉ FINAL
SELECT 
  '=== RÉSUMÉ ARCHITECTURE ===' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
    THEN '✅ Table users existe'
    ELSE '❌ Table users manquante'
  END as status_users,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
    THEN '✅ Table profiles existe'
    ELSE '❌ Table profiles manquante'
  END as status_profiles,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interests') 
    THEN '✅ Table interests existe'
    ELSE '❌ Table interests manquante'
  END as status_interests,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners') 
    THEN '✅ Table partners existe'
    ELSE '❌ Table partners manquante'
  END as status_partners;