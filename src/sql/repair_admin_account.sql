-- ============================================================================
-- 🔧 SCRIPT DE RÉPARATION DU COMPTE ADMIN GASYWAY
-- ============================================================================
-- Ce script répare les problèmes courants du compte administrateur
-- À exécuter si des incohérences sont détectées
-- ============================================================================

BEGIN;

DO $$
DECLARE
    admin_email VARCHAR := 'admin@gasyway.com';
    admin_auth_id UUID;
    repair_actions TEXT[] := ARRAY[]::TEXT[];
    admin_in_auth BOOLEAN := false;
    admin_in_users BOOLEAN := false;
    admin_in_profiles BOOLEAN := false;
BEGIN
    
    RAISE NOTICE '🔧 DÉBUT - Réparation du compte admin';
    RAISE NOTICE '=====================================';
    
    -- ========================================================================
    -- DIAGNOSTIC INITIAL
    -- ========================================================================
    
    RAISE NOTICE '🔍 Diagnostic des problèmes...';
    
    -- Vérifier auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = admin_email) INTO admin_in_auth;
    IF admin_in_auth THEN
        SELECT id INTO admin_auth_id FROM auth.users WHERE email = admin_email LIMIT 1;
        RAISE NOTICE '✅ Admin trouvé dans auth.users: %', admin_auth_id;
    ELSE
        RAISE NOTICE '❌ Admin ABSENT de auth.users';
        repair_actions := array_append(repair_actions, 'CRÉER_AUTH_USER');
    END IF;
    
    -- Vérifier public.users
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = admin_email) INTO admin_in_users;
    IF admin_in_users THEN
        RAISE NOTICE '✅ Admin trouvé dans public.users';
    ELSE
        RAISE NOTICE '❌ Admin ABSENT de public.users';
        repair_actions := array_append(repair_actions, 'CRÉER_PUBLIC_USER');
    END IF;
    
    -- Vérifier profiles
    IF admin_in_auth THEN
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = admin_auth_id) INTO admin_in_profiles;
        IF admin_in_profiles THEN
            RAISE NOTICE '✅ Profil admin trouvé';
        ELSE
            RAISE NOTICE '❌ Profil admin ABSENT';
            repair_actions := array_append(repair_actions, 'CRÉER_PROFIL');
        END IF;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Actions de réparation nécessaires: %', array_length(repair_actions, 1);
    
    -- ========================================================================
    -- RÉPARATIONS AUTOMATIQUES
    -- ========================================================================
    
    IF NOT admin_in_auth THEN
        RAISE NOTICE '';
        RAISE NOTICE '🚫 ARRÊT - Admin non trouvé dans auth.users';
        RAISE NOTICE '';
        RAISE NOTICE '📝 ACTIONS MANUELLES REQUISES:';
        RAISE NOTICE '1. Aller dans Supabase Dashboard';
        RAISE NOTICE '2. Authentication → Users → "Add user"';
        RAISE NOTICE '3. Email: %', admin_email;
        RAISE NOTICE '4. Password: Admin123!GasyWay';
        RAISE NOTICE '5. ✅ Cocher "Confirm email"';
        RAISE NOTICE '6. Cliquer "Create user"';
        RAISE NOTICE '7. Relancer ce script';
        
        RAISE EXCEPTION 'Création manuelle requise dans auth.users';
    END IF;
    
    -- Réparation public.users
    IF NOT admin_in_users OR 'CRÉER_PUBLIC_USER' = ANY(repair_actions) THEN
        RAISE NOTICE '';
        RAISE NOTICE '🔧 Réparation public.users...';
        
        INSERT INTO public.users (
            id, email, role, gdpr_consent, status, locale, created_at, updated_at
        ) VALUES (
            admin_auth_id, admin_email, 'admin', true, 'active', 'fr', now(), now()
        ) ON CONFLICT (id) DO UPDATE SET
            email = admin_email,
            role = 'admin',
            status = 'active',
            gdpr_consent = true,
            locale = 'fr',
            updated_at = now();
        
        RAISE NOTICE '✅ public.users réparé';
    END IF;
    
    -- Réparation profiles
    IF NOT admin_in_profiles OR 'CRÉER_PROFIL' = ANY(repair_actions) THEN
        RAISE NOTICE '';
        RAISE NOTICE '🔧 Réparation profiles...';
        
        INSERT INTO public.profiles (
            user_id, first_name, last_name, phone, created_at, updated_at
        ) VALUES (
            admin_auth_id, 'Admin', 'GasyWay', '+261123456789', now(), now()
        ) ON CONFLICT (user_id) DO UPDATE SET
            first_name = 'Admin',
            last_name = 'GasyWay',
            phone = '+261123456789',
            updated_at = now();
        
        RAISE NOTICE '✅ profiles réparé';
    END IF;
    
    -- ========================================================================
    -- NETTOYAGE DES DOUBLONS
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '🧹 Nettoyage des doublons...';
    
    -- Supprimer les doublons dans users (garder le plus récent)
    WITH user_duplicates AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
        FROM public.users 
        WHERE email = admin_email
    )
    DELETE FROM public.users 
    WHERE id IN (SELECT id FROM user_duplicates WHERE rn > 1);
    
    -- Supprimer les doublons dans profiles
    WITH profile_duplicates AS (
        SELECT user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
        FROM public.profiles 
        WHERE user_id = admin_auth_id
    )
    DELETE FROM public.profiles 
    WHERE user_id IN (SELECT user_id FROM profile_duplicates WHERE rn > 1);
    
    -- Nettoyer les profils orphelins (sans utilisateur correspondant)
    DELETE FROM public.profiles 
    WHERE user_id NOT IN (SELECT id FROM public.users);
    
    RAISE NOTICE '✅ Nettoyage terminé';
    
    -- ========================================================================
    -- VÉRIFICATIONS FINALES
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Vérifications finales...';
    
    -- Revérifier tout
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = admin_email) INTO admin_in_auth;
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = admin_email AND role = 'admin') INTO admin_in_users;
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = admin_auth_id) INTO admin_in_profiles;
    
    IF admin_in_auth AND admin_in_users AND admin_in_profiles THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 RÉPARATION RÉUSSIE!';
        RAISE NOTICE '====================';
        RAISE NOTICE 'ID: %', admin_auth_id;
        RAISE NOTICE 'Email: %', admin_email;
        RAISE NOTICE 'Statut: Compte admin fonctionnel';
        RAISE NOTICE '';
        RAISE NOTICE '🔑 Connexion possible avec:';
        RAISE NOTICE 'Email: %', admin_email;
        RAISE NOTICE 'Password: Admin123!GasyWay';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ RÉPARATION INCOMPLÈTE';
        RAISE NOTICE 'Auth.users: %', CASE WHEN admin_in_auth THEN 'OK' ELSE 'KO' END;
        RAISE NOTICE 'Public.users: %', CASE WHEN admin_in_users THEN 'OK' ELSE 'KO' END;
        RAISE NOTICE 'Profiles: %', CASE WHEN admin_in_profiles THEN 'OK' ELSE 'KO' END;
    END IF;
    
END $$;

-- ============================================================================
-- VÉRIFICATION POST-RÉPARATION
-- ============================================================================

SELECT '🔍 VÉRIFICATION POST-RÉPARATION' as status;

SELECT 
    u.id,
    u.email,
    u.role,
    u.status,
    p.first_name,
    p.last_name,
    p.phone,
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ Synchro OK'
        ELSE '❌ Désynchronisé'
    END as auth_sync_status
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'admin@gasyway.com'
ORDER BY u.created_at DESC;

-- Statistiques des réparations
SELECT 
    'Admins actifs' as metric,
    COUNT(*) as count
FROM public.users 
WHERE role = 'admin' AND status = 'active'

UNION ALL

SELECT 
    'Profils orphelins restants' as metric,
    COUNT(*) as count
FROM public.profiles p
LEFT JOIN public.users u ON p.user_id = u.id
WHERE u.id IS NULL;

COMMIT;

-- ============================================================================
-- 📝 PROBLÈMES FRÉQUENTS ET SOLUTIONS
-- ============================================================================

/*
🔸 PROBLÈMES COURANTS RÉSOLUS :
   • Admin manquant dans public.users
   • Profil manquant dans profiles
   • Doublons causés par créations multiples
   • Désynchronisation entre auth.users et public.users
   • Profils orphelins (sans utilisateur parent)

🔸 LIMITATIONS :
   • Ne peut pas créer dans auth.users (Dashboard seulement)
   • Ne peut pas modifier les mots de passe auth
   • Requiert les tables existantes

🔸 APRÈS RÉPARATION :
   • Tester la connexion sur l'application
   • Vérifier les permissions admin
   • Contrôler l'accès aux fonctions admin

🔸 SI PROBLÈME PERSISTE :
   1. Exécuter verify_admin_account.sql
   2. Vérifier les logs d'erreur
   3. Recreer complètement via create_admin_account.sql
*/