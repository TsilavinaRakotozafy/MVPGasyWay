-- ============================================================================
-- 🔍 SCRIPT DE VÉRIFICATION DU COMPTE ADMIN GASYWAY
-- ============================================================================
-- Ce script vérifie l'état du compte administrateur dans toutes les tables
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- ============================================================================

-- ============================================================================
-- VÉRIFICATIONS PRINCIPALES
-- ============================================================================

SELECT '🔍 VÉRIFICATION COMPTE ADMIN' as status;

-- 1. Vérifier dans auth.users
SELECT 
    '1. AUTH.USERS' as table_name,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@gasyway.com') 
        THEN '✅ TROUVÉ'
        ELSE '❌ ABSENT'
    END as status,
    COALESCE((SELECT id::text FROM auth.users WHERE email = 'admin@gasyway.com' LIMIT 1), 'N/A') as user_id,
    COALESCE((SELECT email_confirmed_at::text FROM auth.users WHERE email = 'admin@gasyway.com' LIMIT 1), 'N/A') as email_confirmed
FROM dual
LIMIT 1;

-- 2. Vérifier dans public.users
SELECT 
    '2. PUBLIC.USERS' as table_name,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.users WHERE email = 'admin@gasyway.com' AND role = 'admin') 
        THEN '✅ TROUVÉ'
        ELSE '❌ ABSENT'
    END as status,
    COALESCE((SELECT role FROM public.users WHERE email = 'admin@gasyway.com' LIMIT 1), 'N/A') as role,
    COALESCE((SELECT status FROM public.users WHERE email = 'admin@gasyway.com' LIMIT 1), 'N/A') as account_status
FROM dual
LIMIT 1;

-- 3. Vérifier dans profiles
SELECT 
    '3. PROFILES' as table_name,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM public.profiles p 
            JOIN public.users u ON p.user_id = u.id 
            WHERE u.email = 'admin@gasyway.com'
        ) 
        THEN '✅ TROUVÉ'
        ELSE '❌ ABSENT'
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
    ), 'N/A') as phone
FROM dual
LIMIT 1;

-- ============================================================================
-- DONNÉES COMPLÈTES DE L'ADMIN
-- ============================================================================

SELECT '📊 DONNÉES COMPLÈTES' as status;

SELECT 
    u.id as user_id,
    u.email,
    u.role,
    u.status,
    u.gdpr_consent,
    u.locale,
    u.created_at as user_created,
    p.first_name,
    p.last_name,
    p.phone,
    p.created_at as profile_created,
    -- Vérification auth.users
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ Synchro OK'
        ELSE '❌ Pas de sync'
    END as auth_sync_status
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'admin@gasyway.com' OR u.role = 'admin'
ORDER BY u.created_at DESC;

-- ============================================================================
-- STATISTIQUES ET DIAGNOSTICS
-- ============================================================================

SELECT '📈 STATISTIQUES' as status;

-- Nombre total d'admins
SELECT 
    'Admins actifs' as metric,
    COUNT(*) as value
FROM public.users 
WHERE role = 'admin' AND status = 'active'

UNION ALL

-- Nombre total d'utilisateurs
SELECT 
    'Total utilisateurs' as metric,
    COUNT(*) as value
FROM public.users 
WHERE status != 'deleted'

UNION ALL

-- Profils sans utilisateur (orphelins)
SELECT 
    'Profils orphelins' as metric,
    COUNT(*) as value
FROM public.profiles p
LEFT JOIN public.users u ON p.user_id = u.id
WHERE u.id IS NULL

UNION ALL

-- Utilisateurs sans profil
SELECT 
    'Users sans profil' as metric,
    COUNT(*) as value
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL AND u.status = 'active';

-- ============================================================================
-- VÉRIFICATION DE COHÉRENCE
-- ============================================================================

SELECT '🔧 VÉRIFICATION DE COHÉRENCE' as status;

-- Vérifier les doublons email
SELECT 
    'Doublons email' as check_type,
    COUNT(*) as issues_found
FROM (
    SELECT email, COUNT(*) as cnt
    FROM public.users 
    GROUP BY email 
    HAVING COUNT(*) > 1
) duplicates

UNION ALL

-- Vérifier les profils orphelins
SELECT 
    'Profils orphelins' as check_type,
    COUNT(*) as issues_found
FROM public.profiles p
LEFT JOIN public.users u ON p.user_id = u.id
WHERE u.id IS NULL

UNION ALL

-- Vérifier la synchronisation auth
SELECT 
    'Désync auth/users' as check_type,
    COUNT(*) as issues_found
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.id IS NULL AND u.status = 'active';

-- ============================================================================
-- RECOMMANDATIONS
-- ============================================================================

DO $$
DECLARE
    admin_in_auth BOOLEAN;
    admin_in_users BOOLEAN;
    admin_in_profiles BOOLEAN;
    recommendations TEXT := '';
BEGIN
    
    -- Vérifications
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@gasyway.com') INTO admin_in_auth;
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'admin@gasyway.com') INTO admin_in_users;
    SELECT EXISTS(
        SELECT 1 FROM public.profiles p 
        JOIN public.users u ON p.user_id = u.id 
        WHERE u.email = 'admin@gasyway.com'
    ) INTO admin_in_profiles;
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 RECOMMANDATIONS:';
    RAISE NOTICE '==================';
    
    IF NOT admin_in_auth THEN
        RAISE NOTICE '❌ Créer l admin dans auth.users via Dashboard';
    END IF;
    
    IF admin_in_auth AND NOT admin_in_users THEN
        RAISE NOTICE '❌ Synchroniser dans public.users (exécuter create_admin_account.sql)';
    END IF;
    
    IF admin_in_auth AND admin_in_users AND NOT admin_in_profiles THEN
        RAISE NOTICE '❌ Créer le profil (exécuter create_admin_account.sql)';
    END IF;
    
    IF admin_in_auth AND admin_in_users AND admin_in_profiles THEN
        RAISE NOTICE '✅ Compte admin correctement configuré!';
        RAISE NOTICE '';
        RAISE NOTICE '🔑 Connexion possible avec:';
        RAISE NOTICE 'Email: admin@gasyway.com';
        RAISE NOTICE 'Password: Admin123!GasyWay';
    END IF;
    
END $$;

-- ============================================================================
-- 📝 NOTES D'UTILISATION
-- ============================================================================

/*
🔸 CE SCRIPT VÉRIFIE :
   • Existence dans auth.users (authentification)
   • Synchronisation dans public.users (métadonnées)
   • Profil dans public.profiles (informations détaillées)
   • Cohérence des données entre tables

🔸 STATUTS POSSIBLES :
   • ✅ TROUVÉ : Données présentes et cohérentes
   • ❌ ABSENT : Données manquantes
   • ❌ Désync : Données incohérentes entre tables

🔸 EN CAS DE PROBLÈME :
   1. Suivre les recommandations affichées
   2. Exécuter create_admin_account.sql si nécessaire
   3. Vérifier via Dashboard Supabase

🔸 CONNEXION ADMIN :
   • Email: admin@gasyway.com
   • Mot de passe: Admin123!GasyWay
   • Interface: https://votre-app.com (rôle admin détecté)
*/