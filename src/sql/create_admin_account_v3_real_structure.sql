-- ============================================================================
-- 🔐 SCRIPT CRÉATION ADMIN GASYWAY V3 - STRUCTURE SUPABASE RÉELLE
-- ============================================================================
-- Ce script respecte la VRAIE structure Supabase du client :
-- • Table users : id, email, status, gdpr_consent, locale, last_login, created_at, updated_at
-- • Table profiles : id, user_id, first_name, last_name, phone, avatar_url, bio, ROLE, created_at, updated_at
-- LE ROLE EST DANS PROFILES, PAS DANS USERS !
-- ============================================================================

BEGIN;

-- Variables de configuration exactes pour la structure réelle
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
    
    RAISE NOTICE '🚀 CRÉATION ADMIN GASYWAY V3 - STRUCTURE RÉELLE';
    RAISE NOTICE '===============================================';
    RAISE NOTICE '📧 Email: %', admin_email;
    RAISE NOTICE '🗂️  Structure: ROLE dans PROFILES (pas dans users)';
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
    -- ÉTAPE 2: Synchronisation dans public.users (SANS le rôle)
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '👤 ÉTAPE 2: Synchronisation public.users (sans rôle)...';
    
    -- Vérifier que la table users existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users' AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Table public.users introuvable. Créez les tables d abord.';
    END IF;
    
    -- Insérer/Mettre à jour dans users SANS le rôle (qui est dans profiles)
    INSERT INTO public.users (
        id,                    -- UUID PRIMARY KEY REFERENCES auth.users(id)
        email,                 -- VARCHAR NOT NULL UNIQUE
        status,                -- VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'blocked'))
        gdpr_consent,          -- BOOLEAN NOT NULL DEFAULT false
        locale,                -- VARCHAR DEFAULT 'fr' CHECK (locale IN ('fr', 'en'))
        last_login,            -- TIMESTAMP WITH TIME ZONE
        created_at,            -- TIMESTAMP WITH TIME ZONE DEFAULT now()
        updated_at             -- TIMESTAMP WITH TIME ZONE DEFAULT now()
    ) VALUES (
        admin_auth_id,         -- ID depuis auth.users
        admin_email,           -- Email admin
        'active',              -- Statut actif
        true,                  -- Consentement RGPD
        'fr',                  -- Locale français
        now(),                 -- Dernière connexion = maintenant
        now(),                 -- Créé maintenant
        now()                  -- Mis à jour maintenant
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        status = 'active',                 -- Forcer statut actif
        gdpr_consent = true,               -- Consentement validé
        locale = 'fr',                     -- Locale française
        last_login = now(),                -- Mise à jour dernière connexion
        updated_at = now();                -- Timestamp de mise à jour
    
    RAISE NOTICE '✅ Données synchronisées dans public.users';
    RAISE NOTICE '   Statut: active';
    RAISE NOTICE '   RGPD: true';
    RAISE NOTICE '   ⚠️  RÔLE: Sera dans profiles';
    
    -- ========================================================================
    -- ÉTAPE 3: Création profil dans public.profiles (AVEC le rôle)
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 ÉTAPE 3: Création profil public.profiles (avec rôle)...';
    
    -- Vérifier que la table profiles existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Table public.profiles introuvable. Créez les tables d abord.';
    END IF;
    
    -- Insérer/Mettre à jour dans profiles AVEC le rôle
    INSERT INTO public.profiles (
        user_id,               -- UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
        first_name,            -- VARCHAR NOT NULL
        last_name,             -- VARCHAR NOT NULL
        phone,                 -- VARCHAR NOT NULL
        avatar_url,            -- VARCHAR (nullable)
        bio,                   -- TEXT (nullable)
        role,                  -- ⭐ LE RÔLE EST ICI dans votre structure !
        created_at,            -- TIMESTAMP WITH TIME ZONE DEFAULT now()
        updated_at             -- TIMESTAMP WITH TIME ZONE DEFAULT now()
    ) VALUES (
        admin_auth_id,         -- Référence vers users
        admin_first_name,      -- Prénom admin
        admin_last_name,       -- Nom admin
        admin_phone,           -- Téléphone admin
        NULL,                  -- Pas d'avatar par défaut
        'Administrateur de la plateforme GasyWay', -- Bio descriptive
        'admin',               -- ⭐ RÔLE ADMIN dans profiles !
        now(),                 -- Créé maintenant
        now()                  -- Mis à jour maintenant
    ) ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        bio = 'Administrateur de la plateforme GasyWay',
        role = 'admin',                    -- ⭐ Forcer le rôle admin
        updated_at = now();                -- Timestamp de mise à jour
    
    RAISE NOTICE '✅ Profil créé dans public.profiles';
    RAISE NOTICE '   Nom: % %', admin_first_name, admin_last_name;
    RAISE NOTICE '   Téléphone: %', admin_phone;
    RAISE NOTICE '   🎯 RÔLE: admin (dans profiles)';
    
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
        WHERE user_id = admin_auth_id AND role = 'admin'
    ) INTO profile_exists;
    
    IF admin_exists AND profile_exists THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 SUCCÈS - COMPTE ADMIN CRÉÉ (STRUCTURE RÉELLE)!';
        RAISE NOTICE '==============================================';
        RAISE NOTICE 'UUID: %', admin_auth_id;
        RAISE NOTICE 'Email: %', admin_email;
        RAISE NOTICE '🎯 Rôle: admin (dans profiles)';
        RAISE NOTICE 'Statut: active (dans users)';
        RAISE NOTICE 'Nom: % %', admin_first_name, admin_last_name;
        RAISE NOTICE 'Téléphone: %', admin_phone;
        RAISE NOTICE '';
        RAISE NOTICE '🔑 CONNEXION:';
        RAISE NOTICE 'Email: %', admin_email;
        RAISE NOTICE 'Password: %', admin_password;
        RAISE NOTICE '';
        RAISE NOTICE '✅ Admin prêt pour connexion GasyWay!';
        RAISE NOTICE '✅ Structure respectée: rôle dans profiles';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ PROBLÈME DÉTECTÉ';
        RAISE NOTICE 'Auth.users: %', CASE WHEN admin_exists THEN 'OK' ELSE 'MANQUANT' END;
        RAISE NOTICE 'Profiles avec rôle: %', CASE WHEN profile_exists THEN 'OK' ELSE 'MANQUANT' END;
    END IF;
    
END $$;

-- ============================================================================
-- VÉRIFICATION COMPLÈTE POST-CRÉATION (STRUCTURE RÉELLE)
-- ============================================================================

SELECT '🔍 VÉRIFICATION COMPLÈTE ADMIN - STRUCTURE RÉELLE' as status;

-- Données complètes admin avec jointures (rôle depuis profiles)
SELECT 
    'ADMIN COMPLET' as verification,
    u.id as user_uuid,
    u.email,
    u.status,
    u.gdpr_consent,
    u.locale,
    u.last_login,
    u.created_at as user_created,
    p.first_name,
    p.last_name,
    p.phone,
    p.bio,
    p.role,                               -- ⭐ RÔLE depuis profiles !
    p.created_at as profile_created,
    -- Vérification synchronisation auth
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ SYNC OK'
        ELSE '❌ DÉSYNC'
    END as auth_sync_status
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'admin@gasyway.com' OR p.role = 'admin'
ORDER BY u.created_at DESC;

-- Statistiques tables avec rôle dans profiles
SELECT 
    'STATISTIQUES RÉELLES' as verification,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as admins_via_profiles,
    (SELECT COUNT(*) FROM public.users WHERE status = 'active') as users_actifs,
    (SELECT COUNT(*) FROM public.profiles) as profiles_total,
    (SELECT COUNT(*) FROM public.interests) as interests_total;

-- Test cohérence données avec structure réelle
SELECT 
    'COHÉRENCE STRUCTURE RÉELLE' as verification,
    (SELECT COUNT(*) FROM public.users u LEFT JOIN auth.users au ON u.id = au.id WHERE au.id IS NULL) as users_sans_auth,
    (SELECT COUNT(*) FROM public.profiles p LEFT JOIN public.users u ON p.user_id = u.id WHERE u.id IS NULL) as profiles_orphelins,
    (SELECT COUNT(*) FROM public.users WHERE email IS NULL OR email = '') as emails_vides,
    (SELECT COUNT(*) FROM public.profiles WHERE role IS NULL) as profiles_sans_role;

COMMIT;

-- ============================================================================
-- 📝 NOTES STRUCTURE SUPABASE RÉELLE
-- ============================================================================

/*
🔸 STRUCTURE RÉELLE RESPECTÉE :

public.users (SANS rôle):
✅ id UUID PRIMARY KEY REFERENCES auth.users(id)
✅ email VARCHAR NOT NULL UNIQUE  
✅ status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'blocked'))
✅ gdpr_consent BOOLEAN NOT NULL DEFAULT false
✅ locale VARCHAR DEFAULT 'fr' CHECK (locale IN ('fr', 'en'))
✅ last_login TIMESTAMP WITH TIME ZONE
✅ created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
✅ updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
❌ PAS DE COLONNE 'role' (elle est dans profiles)

public.profiles (AVEC rôle):
✅ id UUID PRIMARY KEY DEFAULT gen_random_uuid()
✅ user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
✅ first_name VARCHAR NOT NULL
✅ last_name VARCHAR NOT NULL
✅ phone VARCHAR NOT NULL
✅ avatar_url VARCHAR (nullable)
✅ bio TEXT (nullable)
⭐ role VARCHAR CHECK (role IN ('voyageur', 'admin')) -- LE RÔLE EST ICI !
✅ created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
✅ updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
✅ UNIQUE(user_id) -- Un utilisateur = un profil

🔸 DIFFÉRENCES AVEC LES DOCS GÉNÉRIQUES :
❌ Le rôle N'EST PAS dans users
✅ Le rôle EST dans profiles
✅ Code AuthContextSQL adapté
✅ Queries ajustées en conséquence

🔸 PRÉREQUIS :
✅ Admin créé dans auth.users via Dashboard
✅ Tables existantes avec cette structure
✅ Permissions SQL Editor actives

🔸 APRÈS EXÉCUTION :
✅ Test de connexion sur application
✅ Vérification rôle admin détecté depuis profiles
✅ Accès dashboard admin fonctionnel
*/