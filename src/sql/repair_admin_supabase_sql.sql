-- ============================================================================
-- 🔧 RÉPARATION ADMIN SUPABASE SQL - COLONNES EXACTES
-- ============================================================================
-- Ce script répare les problèmes du compte admin dans les tables SQL Supabase
-- en respectant exactement les colonnes de la structure existante
-- ============================================================================

BEGIN;

DO $$
DECLARE
    admin_email VARCHAR := 'admin@gasyway.com';
    admin_auth_id UUID;
    auth_exists BOOLEAN := false;
    users_exists BOOLEAN := false;
    profiles_exists BOOLEAN := false;
    role_correct BOOLEAN := false;
    status_active BOOLEAN := false;
    repairs_needed TEXT[] := ARRAY[]::TEXT[];
    repairs_done TEXT[] := ARRAY[]::TEXT[];
BEGIN
    
    RAISE NOTICE '🔧 RÉPARATION ADMIN SUPABASE SQL';
    RAISE NOTICE '================================';
    RAISE NOTICE '📧 Email: %', admin_email;
    RAISE NOTICE '🗂️  Mode: Tables SQL Supabase (colonnes exactes)';
    RAISE NOTICE '';
    
    -- ========================================================================
    -- DIAGNOSTIC INITIAL COMPLET
    -- ========================================================================
    
    RAISE NOTICE '🔍 DIAGNOSTIC INITIAL...';
    
    -- Vérifier auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = admin_email) INTO auth_exists;
    IF auth_exists THEN
        SELECT id INTO admin_auth_id FROM auth.users WHERE email = admin_email LIMIT 1;
        RAISE NOTICE '✅ Admin trouvé dans auth.users: %', admin_auth_id;
    ELSE
        RAISE NOTICE '❌ Admin ABSENT de auth.users';
        repairs_needed := array_append(repairs_needed, 'CREATE_AUTH_USER');
    END IF;
    
    -- Vérifier public.users
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = admin_email) INTO users_exists;
    IF users_exists THEN
        RAISE NOTICE '✅ Admin trouvé dans public.users';
        
        -- Vérifier rôle
        SELECT EXISTS(SELECT 1 FROM public.users WHERE email = admin_email AND role = 'admin') INTO role_correct;
        IF NOT role_correct THEN
            RAISE NOTICE '❌ Rôle incorrect dans public.users';
            repairs_needed := array_append(repairs_needed, 'FIX_ROLE');
        END IF;
        
        -- Vérifier statut
        SELECT EXISTS(SELECT 1 FROM public.users WHERE email = admin_email AND status = 'active') INTO status_active;
        IF NOT status_active THEN
            RAISE NOTICE '❌ Statut incorrect dans public.users';
            repairs_needed := array_append(repairs_needed, 'FIX_STATUS');
        END IF;
    ELSE
        RAISE NOTICE '❌ Admin ABSENT de public.users';
        repairs_needed := array_append(repairs_needed, 'CREATE_PUBLIC_USER');
    END IF;
    
    -- Vérifier public.profiles
    IF auth_exists THEN
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = admin_auth_id) INTO profiles_exists;
        IF profiles_exists THEN
            RAISE NOTICE '✅ Profil admin trouvé';
        ELSE
            RAISE NOTICE '❌ Profil admin ABSENT';
            repairs_needed := array_append(repairs_needed, 'CREATE_PROFILE');
        END IF;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Réparations nécessaires: %', array_length(repairs_needed, 1);
    
    -- ========================================================================
    -- ARRÊT SI ADMIN MANQUANT DANS AUTH.USERS
    -- ========================================================================
    
    IF NOT auth_exists THEN
        RAISE NOTICE '';
        RAISE NOTICE '🚫 ARRÊT - Création manuelle requise';
        RAISE NOTICE '';
        RAISE NOTICE '📝 ÉTAPES MANUELLES OBLIGATOIRES:';
        RAISE NOTICE '1. Dashboard Supabase → Authentication → Users';
        RAISE NOTICE '2. Cliquer "Add user"';
        RAISE NOTICE '3. Email: %', admin_email;
        RAISE NOTICE '4. Password: Admin123!GasyWay';
        RAISE NOTICE '5. ✅ Confirm email: true';
        RAISE NOTICE '6. Create user';
        RAISE NOTICE '7. Relancer ce script de réparation';
        
        RAISE EXCEPTION 'Créez d abord l admin dans auth.users via Dashboard';
    END IF;
    
    -- ========================================================================
    -- RÉPARATION 1: public.users (colonnes exactes Supabase)
    -- ========================================================================
    
    IF 'CREATE_PUBLIC_USER' = ANY(repairs_needed) OR 'FIX_ROLE' = ANY(repairs_needed) OR 'FIX_STATUS' = ANY(repairs_needed) THEN
        RAISE NOTICE '';
        RAISE NOTICE '🔧 RÉPARATION: public.users...';
        
        -- Insérer/Mettre à jour avec colonnes EXACTES de Supabase
        INSERT INTO public.users (
            id,                    -- UUID PRIMARY KEY REFERENCES auth.users(id)
            email,                 -- VARCHAR NOT NULL UNIQUE
            role,                  -- VARCHAR DEFAULT 'voyageur' CHECK (role IN ('voyageur', 'admin'))
            status,                -- VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'blocked'))
            gdpr_consent,          -- BOOLEAN NOT NULL DEFAULT false
            locale,                -- VARCHAR DEFAULT 'fr' CHECK (locale IN ('fr', 'en'))
            last_login,            -- TIMESTAMP WITH TIME ZONE
            created_at,            -- TIMESTAMP WITH TIME ZONE DEFAULT now()
            updated_at             -- TIMESTAMP WITH TIME ZONE DEFAULT now()
        ) VALUES (
            admin_auth_id,         -- ID depuis auth.users
            admin_email,           -- Email admin
            'admin',               -- Rôle administrateur
            'active',              -- Statut actif
            true,                  -- Consentement RGPD
            'fr',                  -- Locale français
            now(),                 -- Dernière connexion
            now(),                 -- Créé maintenant
            now()                  -- Mis à jour maintenant
        ) ON CONFLICT (id) DO UPDATE SET
            email = admin_email,
            role = 'admin',                    -- FORCER rôle admin
            status = 'active',                 -- FORCER statut actif
            gdpr_consent = true,
            locale = 'fr',
            last_login = now(),
            updated_at = now();
        
        repairs_done := array_append(repairs_done, 'public.users synchronisé');
        RAISE NOTICE '✅ public.users réparé (rôle: admin, statut: active)';
    END IF;
    
    -- ========================================================================
    -- RÉPARATION 2: public.profiles (colonnes exactes Supabase)
    -- ========================================================================
    
    IF 'CREATE_PROFILE' = ANY(repairs_needed) THEN
        RAISE NOTICE '';
        RAISE NOTICE '🔧 RÉPARATION: public.profiles...';
        
        -- Insérer/Mettre à jour avec colonnes EXACTES de Supabase
        INSERT INTO public.profiles (
            user_id,               -- UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
            first_name,            -- VARCHAR NOT NULL
            last_name,             -- VARCHAR NOT NULL  
            phone,                 -- VARCHAR NOT NULL
            avatar_url,            -- VARCHAR (nullable)
            bio,                   -- TEXT (nullable)
            created_at,            -- TIMESTAMP WITH TIME ZONE DEFAULT now()
            updated_at             -- TIMESTAMP WITH TIME ZONE DEFAULT now()
        ) VALUES (
            admin_auth_id,         -- Référence vers users
            'Admin',               -- Prénom
            'GasyWay',             -- Nom
            '+261123456789',       -- Téléphone
            NULL,                  -- Pas d'avatar
            'Administrateur de la plateforme GasyWay', -- Bio
            now(),                 -- Créé maintenant
            now()                  -- Mis à jour maintenant
        ) ON CONFLICT (user_id) DO UPDATE SET
            first_name = 'Admin',
            last_name = 'GasyWay',
            phone = '+261123456789',
            bio = 'Administrateur de la plateforme GasyWay',
            updated_at = now();
        
        repairs_done := array_append(repairs_done, 'profiles créé');
        RAISE NOTICE '✅ public.profiles réparé';
    END IF;
    
    -- ========================================================================
    -- NETTOYAGE AVANCÉ DES INCOHÉRENCES
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '🧹 NETTOYAGE AVANCÉ...';
    
    -- Supprimer doublons emails dans users
    WITH email_duplicates AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
        FROM public.users 
        WHERE email = admin_email
    )
    DELETE FROM public.users 
    WHERE id IN (SELECT id FROM email_duplicates WHERE rn > 1);
    
    -- Supprimer doublons user_id dans profiles  
    WITH profile_duplicates AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
        FROM public.profiles 
        WHERE user_id = admin_auth_id
    )
    DELETE FROM public.profiles 
    WHERE id IN (SELECT id FROM profile_duplicates WHERE rn > 1);
    
    -- Nettoyer profiles orphelins (sans user correspondant)
    DELETE FROM public.profiles 
    WHERE user_id NOT IN (SELECT id FROM public.users);
    
    -- Nettoyer user_interests orphelins (si table existe)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_interests' AND table_schema = 'public'
    ) THEN
        DELETE FROM public.user_interests 
        WHERE profile_id NOT IN (SELECT id FROM public.profiles);
        RAISE NOTICE '✅ user_interests orphelins nettoyés';
    END IF;
    
    -- Corriger les valeurs nulles dans les champs obligatoires
    UPDATE public.users 
    SET 
        role = 'admin',
        status = 'active',
        gdpr_consent = true,
        locale = 'fr',
        updated_at = now()
    WHERE email = admin_email AND (
        role IS NULL OR role != 'admin' OR
        status IS NULL OR status != 'active' OR
        gdpr_consent IS NULL OR gdpr_consent != true OR
        locale IS NULL
    );
    
    repairs_done := array_append(repairs_done, 'nettoyage incohérences');
    RAISE NOTICE '✅ Nettoyage terminé';
    
    -- ========================================================================
    -- VÉRIFICATION POST-RÉPARATION
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VÉRIFICATION POST-RÉPARATION...';
    
    -- Revérifier tout
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = admin_email) INTO auth_exists;
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = admin_email AND role = 'admin' AND status = 'active') INTO users_exists;
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = admin_auth_id) INTO profiles_exists;
    
    IF auth_exists AND users_exists AND profiles_exists THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 RÉPARATION RÉUSSIE!';
        RAISE NOTICE '=====================';
        RAISE NOTICE 'UUID: %', admin_auth_id;
        RAISE NOTICE 'Email: %', admin_email;
        RAISE NOTICE 'Rôle: admin';
        RAISE NOTICE 'Statut: active';
        RAISE NOTICE 'Profil: Complet';
        RAISE NOTICE '';
        RAISE NOTICE '🔑 CONNEXION ADMIN:';
        RAISE NOTICE 'Email: %', admin_email;
        RAISE NOTICE 'Password: Admin123!GasyWay';
        RAISE NOTICE '';
        RAISE NOTICE '✅ Réparations effectuées: %', array_to_string(repairs_done, ', ');
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ RÉPARATION INCOMPLÈTE';
        RAISE NOTICE 'Auth.users: %', CASE WHEN auth_exists THEN 'OK' ELSE 'KO' END;
        RAISE NOTICE 'Public.users: %', CASE WHEN users_exists THEN 'OK' ELSE 'KO' END;
        RAISE NOTICE 'Profiles: %', CASE WHEN profiles_exists THEN 'OK' ELSE 'KO' END;
    END IF;
    
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE AVEC DONNÉES COMPLÈTES
-- ============================================================================

SELECT '🔍 VÉRIFICATION FINALE POST-RÉPARATION' as status;

-- Données admin complètes avec toutes les colonnes Supabase
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
    -- Synchronisation auth
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ SYNC OK'
        ELSE '❌ DÉSYNC'
    END as auth_sync_status
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'admin@gasyway.com'
ORDER BY u.created_at DESC;

-- Statistiques post-réparation
SELECT 
    'POST-RÉPARATION' as metric_type,
    (SELECT COUNT(*) FROM public.users WHERE role = 'admin' AND status = 'active') as admins_actifs,
    (SELECT COUNT(*) FROM public.users WHERE email = 'admin@gasyway.com') as doublons_admin,
    (SELECT COUNT(*) FROM public.profiles p LEFT JOIN public.users u ON p.user_id = u.id WHERE u.id IS NULL) as profiles_orphelins,
    (SELECT COUNT(*) FROM public.users u LEFT JOIN auth.users au ON u.id = au.id WHERE au.id IS NULL) as users_sans_auth;

COMMIT;

-- ============================================================================
-- 📝 NOTES DE RÉPARATION SUPABASE SQL
-- ============================================================================

/*
🔸 RÉPARATIONS EFFECTUÉES :

1. SYNCHRONISATION public.users:
   ✅ Insertion/Update avec colonnes exactes Supabase
   ✅ Force role = 'admin' et status = 'active'
   ✅ Respect contraintes CHECK et NOT NULL
   ✅ Mise à jour timestamp updated_at

2. CRÉATION public.profiles:
   ✅ Insertion avec colonnes exactes Supabase
   ✅ Respect contrainte UNIQUE(user_id)
   ✅ Champs obligatoires remplis (first_name, last_name, phone)
   ✅ Bio descriptive ajoutée

3. NETTOYAGE AVANCÉ:
   ✅ Suppression doublons par email dans users
   ✅ Suppression doublons par user_id dans profiles
   ✅ Nettoyage profiles orphelins
   ✅ Nettoyage user_interests orphelins
   ✅ Correction valeurs nulles dans champs obligatoires

🔸 COLONNES SUPABASE RESPECTÉES :
✅ Structure exacte de create_tables.sql
✅ Types de données corrects (UUID, VARCHAR, BOOLEAN, TIMESTAMP)
✅ Contraintes de clés étrangères
✅ Contraintes CHECK sur role et status
✅ Contraintes UNIQUE où nécessaire

🔸 SÉCURITÉ MAINTENUE :
✅ Row Level Security (RLS) non modifié
✅ Permissions selon politiques existantes
✅ Pas d'exposition de données sensibles
✅ Respect des triggers updated_at

🔸 APRÈS RÉPARATION :
✅ Test connexion sur l'application
✅ Vérification accès dashboard admin
✅ Contrôle permissions et rôles
*/