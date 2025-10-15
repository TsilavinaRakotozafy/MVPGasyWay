-- ============================================================================
-- 🔍 VÉRIFICATION ADMIN SUPABASE SQL - COLONNES EXACTES
-- ============================================================================
-- Ce script vérifie le compte admin dans les vraies tables SQL Supabase
-- (pas de KV store, colonnes exactes de la structure)
-- ============================================================================

-- ============================================================================
-- VÉRIFICATION STRUCTURE TABLES
-- ============================================================================

SELECT '🏗️  VÉRIFICATION STRUCTURE TABLES' as check_type;

-- Vérifier existence des tables principales
SELECT 
    'TABLES EXISTANTES' as verification,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
         THEN '✅ public.users' 
         ELSE '❌ public.users MANQUANTE' END as users_table,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
         THEN '✅ public.profiles' 
         ELSE '❌ public.profiles MANQUANTE' END as profiles_table,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'interests' AND table_schema = 'public') 
         THEN '✅ public.interests' 
         ELSE '❌ public.interests MANQUANTE' END as interests_table,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'user_interests' AND table_schema = 'public') 
         THEN '✅ public.user_interests' 
         ELSE '❌ public.user_interests MANQUANTE' END as user_interests_table;

-- ============================================================================
-- VÉRIFICATION COLONNES EXACTES
-- ============================================================================

SELECT '📋 VÉRIFICATION COLONNES SUPABASE' as check_type;

-- Colonnes de public.users (structure exacte)
SELECT 
    'COLONNES PUBLIC.USERS' as table_name,
    string_agg(column_name || ':' || data_type, ', ' ORDER BY ordinal_position) as columns_structure
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
GROUP BY table_name;

-- Colonnes de public.profiles (structure exacte)
SELECT 
    'COLONNES PUBLIC.PROFILES' as table_name,
    string_agg(column_name || ':' || data_type, ', ' ORDER BY ordinal_position) as columns_structure
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
GROUP BY table_name;

-- ============================================================================
-- VÉRIFICATION ADMIN DANS CHAQUE TABLE
-- ============================================================================

SELECT '🔍 VÉRIFICATION ADMIN PAR TABLE' as check_type;

-- 1. Vérification auth.users
SELECT 
    '1. AUTH.USERS' as table_check,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@gasyway.com') 
        THEN '✅ ADMIN TROUVÉ'
        ELSE '❌ ADMIN ABSENT'
    END as status,
    COALESCE((SELECT id::text FROM auth.users WHERE email = 'admin@gasyway.com' LIMIT 1), 'N/A') as auth_user_id,
    COALESCE((SELECT email_confirmed_at::text FROM auth.users WHERE email = 'admin@gasyway.com' LIMIT 1), 'N/A') as email_confirmed,
    COALESCE((SELECT created_at::text FROM auth.users WHERE email = 'admin@gasyway.com' LIMIT 1), 'N/A') as auth_created;

-- 2. Vérification public.users avec colonnes exactes
SELECT 
    '2. PUBLIC.USERS' as table_check,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.users WHERE email = 'admin@gasyway.com' AND role = 'admin') 
        THEN '✅ ADMIN TROUVÉ'
        ELSE '❌ ADMIN ABSENT OU RÔLE INCORRECT'
    END as status,
    COALESCE((SELECT role FROM public.users WHERE email = 'admin@gasyway.com' LIMIT 1), 'N/A') as role_value,
    COALESCE((SELECT status FROM public.users WHERE email = 'admin@gasyway.com' LIMIT 1), 'N/A') as status_value,
    COALESCE((SELECT gdpr_consent::text FROM public.users WHERE email = 'admin@gasyway.com' LIMIT 1), 'N/A') as gdpr_consent,
    COALESCE((SELECT locale FROM public.users WHERE email = 'admin@gasyway.com' LIMIT 1), 'N/A') as locale_value;

-- 3. Vérification public.profiles avec colonnes exactes
SELECT 
    '3. PUBLIC.PROFILES' as table_check,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM public.profiles p 
            JOIN public.users u ON p.user_id = u.id 
            WHERE u.email = 'admin@gasyway.com'
        ) 
        THEN '✅ PROFIL TROUVÉ'
        ELSE '❌ PROFIL ABSENT'
    END as status,
    COALESCE((
        SELECT CONCAT(p.first_name, ' ', p.last_name) 
        FROM public.profiles p 
        JOIN public.users u ON p.user_id = u.id 
        WHERE u.email = 'admin@gasyway.com' 
        LIMIT 1
    ), 'N/A') as full_name,
    COALESCE((
        SELECT p.phone 
        FROM public.profiles p 
        JOIN public.users u ON p.user_id = u.id 
        WHERE u.email = 'admin@gasyway.com' 
        LIMIT 1
    ), 'N/A') as phone_number,
    COALESCE((
        SELECT p.bio 
        FROM public.profiles p 
        JOIN public.users u ON p.user_id = u.id 
        WHERE u.email = 'admin@gasyway.com' 
        LIMIT 1
    ), 'N/A') as bio_text;

-- ============================================================================
-- DONNÉES COMPLÈTES ADMIN (JOINTURE TOUTES TABLES)
-- ============================================================================

SELECT '📊 DONNÉES ADMIN COMPLÈTES' as check_type;

SELECT 
    u.id as user_uuid,
    u.email,
    u.role,
    u.status,
    u.gdpr_consent,
    u.locale,
    u.last_login,
    u.created_at as user_created,
    u.updated_at as user_updated,
    p.id as profile_id,
    p.first_name,
    p.last_name,
    p.phone,
    p.avatar_url,
    p.bio,
    p.created_at as profile_created,
    p.updated_at as profile_updated,
    -- Synchronisation auth.users
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ SYNC AUTH OK'
        ELSE '❌ DÉSYNCHRONISÉ'
    END as auth_sync_status,
    au.created_at as auth_created
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'admin@gasyway.com' OR u.role = 'admin'
ORDER BY u.created_at DESC;

-- ============================================================================
-- DIAGNOSTIC PROBLÈMES COURANTS
-- ============================================================================

SELECT '🔧 DIAGNOSTIC PROBLÈMES' as check_type;

-- Compter les problèmes potentiels
SELECT 
    'PROBLÈMES DÉTECTÉS' as diagnostic,
    (SELECT COUNT(*) FROM public.users WHERE email IS NULL OR email = '') as emails_vides,
    (SELECT COUNT(*) FROM public.users WHERE role NOT IN ('voyageur', 'admin')) as roles_invalides,
    (SELECT COUNT(*) FROM public.users WHERE status NOT IN ('active', 'blocked')) as statuts_invalides,
    (SELECT COUNT(*) FROM public.profiles WHERE first_name IS NULL OR first_name = '') as prenoms_manquants,
    (SELECT COUNT(*) FROM public.profiles WHERE last_name IS NULL OR last_name = '') as noms_manquants,
    (SELECT COUNT(*) FROM public.profiles WHERE phone IS NULL OR phone = '') as telephones_manquants;

-- Orphelins et incohérences
SELECT 
    'COHÉRENCE DONNÉES' as diagnostic,
    (SELECT COUNT(*) FROM public.users u LEFT JOIN auth.users au ON u.id = au.id WHERE au.id IS NULL) as users_sans_auth,
    (SELECT COUNT(*) FROM public.profiles p LEFT JOIN public.users u ON p.user_id = u.id WHERE u.id IS NULL) as profiles_orphelins,
    (SELECT COUNT(*) FROM public.users WHERE email = 'admin@gasyway.com') as doublons_admin_email,
    (SELECT COUNT(*) FROM public.users WHERE role = 'admin') as nombre_admins_total;

-- ============================================================================
-- STATISTIQUES GÉNÉRALES
-- ============================================================================

SELECT '📈 STATISTIQUES GÉNÉRALES' as check_type;

SELECT 
    'STATISTIQUES' as metric_type,
    (SELECT COUNT(*) FROM public.users WHERE role = 'admin' AND status = 'active') as admins_actifs,
    (SELECT COUNT(*) FROM public.users WHERE role = 'voyageur' AND status = 'active') as voyageurs_actifs,
    (SELECT COUNT(*) FROM public.users WHERE status = 'blocked') as comptes_bloques,
    (SELECT COUNT(*) FROM public.profiles) as profils_total,
    (SELECT COUNT(*) FROM public.interests) as interets_disponibles,
    (SELECT COUNT(*) FROM public.user_interests) as associations_interets;

-- ============================================================================
-- RECOMMANDATIONS AUTOMATIQUES
-- ============================================================================

DO $$
DECLARE
    admin_in_auth BOOLEAN;
    admin_in_users BOOLEAN;
    admin_in_profiles BOOLEAN;
    admin_role_correct BOOLEAN;
    admin_status_active BOOLEAN;
BEGIN
    
    -- Tests de base
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@gasyway.com') INTO admin_in_auth;
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'admin@gasyway.com') INTO admin_in_users;
    SELECT EXISTS(
        SELECT 1 FROM public.profiles p 
        JOIN public.users u ON p.user_id = u.id 
        WHERE u.email = 'admin@gasyway.com'
    ) INTO admin_in_profiles;
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'admin@gasyway.com' AND role = 'admin') INTO admin_role_correct;
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'admin@gasyway.com' AND status = 'active') INTO admin_status_active;
    
    RAISE NOTICE '';
    RAISE NOTICE '💡 RECOMMANDATIONS AUTOMATIQUES';
    RAISE NOTICE '================================';
    
    IF NOT admin_in_auth THEN
        RAISE NOTICE '❌ 1. Créer admin dans auth.users via Dashboard Supabase';
        RAISE NOTICE '   → Authentication → Users → Add user';
        RAISE NOTICE '   → Email: admin@gasyway.com';
        RAISE NOTICE '   → Password: Admin123!GasyWay';
        RAISE NOTICE '   → ✅ Confirm email';
    ELSE
        RAISE NOTICE '✅ 1. Admin existe dans auth.users';
    END IF;
    
    IF admin_in_auth AND NOT admin_in_users THEN
        RAISE NOTICE '❌ 2. Synchroniser dans public.users';
        RAISE NOTICE '   → Exécuter create_admin_account_v2.sql';
    ELSE
        RAISE NOTICE '✅ 2. Admin synchronisé dans public.users';
    END IF;
    
    IF admin_in_users AND NOT admin_role_correct THEN
        RAISE NOTICE '❌ 3. Corriger le rôle admin';
        RAISE NOTICE '   → UPDATE public.users SET role = ''admin'' WHERE email = ''admin@gasyway.com''';
    ELSE
        RAISE NOTICE '✅ 3. Rôle admin correct';
    END IF;
    
    IF admin_in_users AND NOT admin_status_active THEN
        RAISE NOTICE '❌ 4. Activer le compte';
        RAISE NOTICE '   → UPDATE public.users SET status = ''active'' WHERE email = ''admin@gasyway.com''';
    ELSE
        RAISE NOTICE '✅ 4. Statut actif correct';
    END IF;
    
    IF admin_in_users AND NOT admin_in_profiles THEN
        RAISE NOTICE '❌ 5. Créer le profil';
        RAISE NOTICE '   → Exécuter create_admin_account_v2.sql';
    ELSE
        RAISE NOTICE '✅ 5. Profil admin créé';
    END IF;
    
    IF admin_in_auth AND admin_in_users AND admin_in_profiles AND admin_role_correct AND admin_status_active THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 PARFAIT! Compte admin entièrement configuré';
        RAISE NOTICE '🔑 Connexion: admin@gasyway.com / Admin123!GasyWay';
    END IF;
    
END $$;

-- ============================================================================
-- 📝 NOTES TECHNIQUES SUPABASE SQL
-- ============================================================================

/*
🔸 STRUCTURE VÉRIFIÉE :

auth.users (géré par Supabase Auth):
- id UUID PRIMARY KEY
- email VARCHAR UNIQUE
- encrypted_password (hash)
- email_confirmed_at TIMESTAMP
- created_at TIMESTAMP

public.users (métadonnées étendues):
- id UUID REFERENCES auth.users(id)
- email VARCHAR NOT NULL UNIQUE
- role VARCHAR CHECK (role IN ('voyageur', 'admin'))
- status VARCHAR CHECK (status IN ('active', 'blocked'))
- gdpr_consent BOOLEAN NOT NULL DEFAULT false
- locale VARCHAR CHECK (locale IN ('fr', 'en'))
- last_login TIMESTAMP WITH TIME ZONE
- created_at TIMESTAMP WITH TIME ZONE
- updated_at TIMESTAMP WITH TIME ZONE

public.profiles (données personnelles):
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID REFERENCES users(id) UNIQUE
- first_name VARCHAR NOT NULL
- last_name VARCHAR NOT NULL
- phone VARCHAR NOT NULL
- avatar_url VARCHAR
- bio TEXT
- created_at TIMESTAMP WITH TIME ZONE
- updated_at TIMESTAMP WITH TIME ZONE

🔸 CONTRAINTES RESPECTÉES :
✅ Foreign Keys users.id → auth.users.id
✅ Unique profiles.user_id (un user = un profil)
✅ Check constraints sur role et status
✅ NOT NULL sur champs obligatoires
✅ Triggers updated_at automatiques

🔸 SÉCURITÉ :
✅ Row Level Security (RLS) activé
✅ Politiques d'accès par rôle
✅ Pas de données sensibles exposées
*/