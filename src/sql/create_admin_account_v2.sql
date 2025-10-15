-- ============================================================================
-- 🔐 SCRIPT CRÉATION ADMIN GASYWAY V2 - COLONNES SUPABASE SQL EXACTES
-- ============================================================================
-- Ce script crée le compte admin en respectant exactement les colonnes 
-- des tables Supabase SQL existantes (pas de KV store)
-- ============================================================================

BEGIN;

-- Variables de configuration exactes pour les colonnes Supabase
DO $$
DECLARE
    admin_email VARCHAR := 'admin@gasyway.com';
    admin_password VARCHAR := 'Admin123!GasyWay';
    admin_first_name VARCHAR := 'Admin';
    admin_last_name VARCHAR := 'GasyWay';
    admin_phone VARCHAR := '+261123456789';
    admin_auth_id UUID;
    admin_exists BOOLEAN;
    profile_exists BOOLEAN;
BEGIN
    
    RAISE NOTICE '🚀 CRÉATION ADMIN GASYWAY V2';
    RAISE NOTICE '============================';
    RAISE NOTICE '📧 Email: %', admin_email;
    RAISE NOTICE '🗂️  Structure: Tables SQL Supabase (users, profiles)';
    RAISE NOTICE '';
    
    -- ========================================================================
    -- ÉTAPE 1: Vérification auth.users (créé via Dashboard Supabase)
    -- ========================================================================
    
    RAISE NOTICE '🔍 ÉTAPE 1: Vérification auth.users...';
    
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = admin_email
    ) INTO admin_exists;
    
    IF admin_exists THEN
        SELECT id INTO admin_auth_id 
        FROM auth.users 
        WHERE email = admin_email 
        LIMIT 1;
        
        RAISE NOTICE '✅ Admin trouvé dans auth.users';
        RAISE NOTICE '   ID: %', admin_auth_id;
    ELSE
        RAISE NOTICE '❌ Admin NON TROUVÉ dans auth.users';
        RAISE NOTICE '';
        RAISE NOTICE '📝 ACTIONS REQUISES:';
        RAISE NOTICE '1. Supabase Dashboard → Authentication → Users';
        RAISE NOTICE '2. Cliquer "Add user"';
        RAISE NOTICE '3. Email: %', admin_email;
        RAISE NOTICE '4. Password: %', admin_password;
        RAISE NOTICE '5. ✅ Confirm email: true';
        RAISE NOTICE '6. Create user';
        RAISE NOTICE '7. Relancer ce script';
        
        RAISE EXCEPTION 'Créez d abord l admin dans auth.users via Dashboard';
    END IF;
    
    -- ========================================================================
    -- ÉTAPE 2: Synchronisation dans public.users (colonnes exactes Supabase)
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '👤 ÉTAPE 2: Synchronisation public.users...';
    
    -- Vérifier que la table users existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users' AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Table public.users introuvable. Créez les tables d abord.';
    END IF;
    
    -- Insérer/Mettre à jour avec les colonnes EXACTES de la structure Supabase
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
        now(),                 -- Dernière connexion = maintenant
        now(),                 -- Créé maintenant
        now()                  -- Mis à jour maintenant
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = 'admin',                    -- Forcer le rôle admin
        status = 'active',                 -- Forcer statut actif
        gdpr_consent = true,               -- Consentement validé
        locale = 'fr',                     -- Locale française
        last_login = now(),                -- Mise à jour dernière connexion
        updated_at = now();                -- Timestamp de mise à jour
    
    RAISE NOTICE '✅ Données synchronisées dans public.users';
    RAISE NOTICE '   Rôle: admin';
    RAISE NOTICE '   Statut: active';
    RAISE NOTICE '   RGPD: true';
    
    -- ========================================================================
    -- ÉTAPE 3: Création profil dans public.profiles (colonnes exactes)
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 ÉTAPE 3: Création profil public.profiles...';
    
    -- Vérifier que la table profiles existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Table public.profiles introuvable. Créez les tables d abord.';
    END IF;
    
    -- Insérer/Mettre à jour avec les colonnes EXACTES de la structure Supabase
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
        admin_first_name,      -- Prénom admin
        admin_last_name,       -- Nom admin
        admin_phone,           -- Téléphone admin
        NULL,                  -- Pas d'avatar par défaut
        'Administrateur de la plateforme GasyWay', -- Bio descriptive
        now(),                 -- Créé maintenant
        now()                  -- Mis à jour maintenant
    ) ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        bio = 'Administrateur de la plateforme GasyWay',
        updated_at = now();                -- Timestamp de mise à jour
    
    RAISE NOTICE '✅ Profil créé dans public.profiles';
    RAISE NOTICE '   Nom: % %', admin_first_name, admin_last_name;
    RAISE NOTICE '   Téléphone: %', admin_phone;
    
    -- ========================================================================
    -- ÉTAPE 4: Nettoyage données incohérentes
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '🧹 ÉTAPE 4: Nettoyage données incohérentes...';
    
    -- Supprimer doublons users (garder le plus récent)
    WITH user_duplicates AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
        FROM public.users 
        WHERE email = admin_email
    )
    DELETE FROM public.users 
    WHERE id IN (SELECT id FROM user_duplicates WHERE rn > 1);
    
    -- Supprimer doublons profiles (garder le plus récent)
    WITH profile_duplicates AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
        FROM public.profiles 
        WHERE user_id = admin_auth_id
    )
    DELETE FROM public.profiles 
    WHERE id IN (SELECT id FROM profile_duplicates WHERE rn > 1);
    
    -- Nettoyer profils orphelins (sans user correspondant)
    DELETE FROM public.profiles 
    WHERE user_id NOT IN (SELECT id FROM public.users);
    
    -- Nettoyer user_interests orphelins (si table existe)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_interests' AND table_schema = 'public'
    ) THEN
        DELETE FROM public.user_interests 
        WHERE profile_id NOT IN (SELECT id FROM public.profiles);
    END IF;
    
    RAISE NOTICE '✅ Nettoyage terminé';
    
    -- ========================================================================
    -- ÉTAPE 5: Vérification finale de cohérence
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 ÉTAPE 5: Vérification finale...';
    
    -- Vérifier la cohérence auth.users ↔ public.users ↔ public.profiles
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE user_id = admin_auth_id
    ) INTO profile_exists;
    
    IF admin_exists AND profile_exists THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 SUCCÈS - COMPTE ADMIN CRÉÉ!';
        RAISE NOTICE '================================';
        RAISE NOTICE 'UUID: %', admin_auth_id;
        RAISE NOTICE 'Email: %', admin_email;
        RAISE NOTICE 'Rôle: admin';
        RAISE NOTICE 'Statut: active';
        RAISE NOTICE 'Nom: % %', admin_first_name, admin_last_name;
        RAISE NOTICE 'Téléphone: %', admin_phone;
        RAISE NOTICE '';
        RAISE NOTICE '🔑 CONNEXION:';
        RAISE NOTICE 'Email: %', admin_email;
        RAISE NOTICE 'Password: %', admin_password;
        RAISE NOTICE '';
        RAISE NOTICE '✅ Admin prêt pour connexion GasyWay!';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ PROBLÈME DÉTECTÉ';
        RAISE NOTICE 'Auth.users: %', CASE WHEN admin_exists THEN 'OK' ELSE 'MANQUANT' END;
        RAISE NOTICE 'Profiles: %', CASE WHEN profile_exists THEN 'OK' ELSE 'MANQUANT' END;
    END IF;
    
END $$;

-- ============================================================================
-- VÉRIFICATION COMPLÈTE POST-CRÉATION
-- ============================================================================

SELECT '🔍 VÉRIFICATION COMPLÈTE ADMIN' as status;

-- Données complètes admin avec jointures
SELECT 
    'ADMIN COMPLET' as verification,
    u.id as user_uuid,
    u.email,
    u.role,
    u.status,
    u.gdpr_consent,
    u.locale,
    u.last_login,
    u.created_at as user_created,
    p.first_name,
    p.last_name,
    p.phone,
    p.bio,
    p.created_at as profile_created,
    -- Vérification synchronisation auth
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ SYNC OK'
        ELSE '❌ DÉSYNC'
    END as auth_sync_status
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'admin@gasyway.com' OR u.role = 'admin'
ORDER BY u.created_at DESC;

-- Statistiques tables
SELECT 
    'STATISTIQUES' as verification,
    (SELECT COUNT(*) FROM public.users WHERE role = 'admin' AND status = 'active') as admins_actifs,
    (SELECT COUNT(*) FROM public.users WHERE status = 'active') as users_actifs,
    (SELECT COUNT(*) FROM public.profiles) as profiles_total,
    (SELECT COUNT(*) FROM public.interests) as interests_total;

-- Test cohérence données
SELECT 
    'COHÉRENCE' as verification,
    (SELECT COUNT(*) FROM public.users u LEFT JOIN auth.users au ON u.id = au.id WHERE au.id IS NULL) as users_sans_auth,
    (SELECT COUNT(*) FROM public.profiles p LEFT JOIN public.users u ON p.user_id = u.id WHERE u.id IS NULL) as profiles_orphelins,
    (SELECT COUNT(*) FROM public.users WHERE email IS NULL OR email = '') as emails_vides;

COMMIT;

-- ============================================================================
-- 📝 NOTES SPÉCIFIQUES SUPABASE SQL
-- ============================================================================

/*
🔸 COLONNES RESPECTÉES EXACTEMENT :

public.users:
✅ id UUID PRIMARY KEY REFERENCES auth.users(id)
✅ email VARCHAR NOT NULL UNIQUE  
✅ role VARCHAR DEFAULT 'voyageur' CHECK (role IN ('voyageur', 'admin'))
✅ status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'blocked'))
✅ gdpr_consent BOOLEAN NOT NULL DEFAULT false
✅ locale VARCHAR DEFAULT 'fr' CHECK (locale IN ('fr', 'en'))
✅ last_login TIMESTAMP WITH TIME ZONE
✅ created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
✅ updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()

public.profiles:
✅ id UUID PRIMARY KEY DEFAULT gen_random_uuid()
✅ user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
✅ first_name VARCHAR NOT NULL
✅ last_name VARCHAR NOT NULL
✅ phone VARCHAR NOT NULL
✅ avatar_url VARCHAR (nullable)
✅ bio TEXT (nullable)
✅ created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
✅ updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
✅ UNIQUE(user_id) -- Un utilisateur = un profil

🔸 DIFFÉRENCES AVEC KV STORE :
❌ Plus de stockage clé-valeur
✅ Utilisation des tables relationnelles Supabase
✅ Respect des contraintes FK et CHECK
✅ Triggers updated_at automatiques
✅ RLS (Row Level Security) respecté

🔸 PRÉREQUIS :
✅ Tables créées via create_tables.sql
✅ Admin créé dans auth.users via Dashboard
✅ Permissions SQL Editor actives

🔸 APRÈS EXÉCUTION :
✅ Test de connexion sur application
✅ Vérification rôle admin détecté
✅ Accès dashboard admin fonctionnel
*/