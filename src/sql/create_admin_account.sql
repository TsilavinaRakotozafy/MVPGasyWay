-- ============================================================================
-- 🔐 SCRIPT DE CRÉATION DU COMPTE ADMIN GASYWAY
-- ============================================================================
-- Ce script crée un compte administrateur complet dans toutes les tables SQL
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- ============================================================================

BEGIN;

-- Variables de configuration
DO $$
DECLARE
    admin_email VARCHAR := 'admin@gasyway.com';
    admin_password VARCHAR := 'Admin123!GasyWay';
    admin_first_name VARCHAR := 'Admin';
    admin_last_name VARCHAR := 'GasyWay';
    admin_phone VARCHAR := '+261123456789';
    admin_auth_id UUID;
    admin_exists BOOLEAN;
BEGIN
    
    RAISE NOTICE '🚀 DÉBUT - Création du compte admin GasyWay';
    RAISE NOTICE '📧 Email: %', admin_email;
    
    -- ========================================================================
    -- ÉTAPE 1: Vérifier si l'utilisateur existe dans auth.users
    -- ========================================================================
    
    RAISE NOTICE '🔍 ÉTAPE 1: Vérification dans auth.users...';
    
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = admin_email
    ) INTO admin_exists;
    
    IF admin_exists THEN
        -- Récupérer l'ID de l'admin existant
        SELECT id INTO admin_auth_id 
        FROM auth.users 
        WHERE email = admin_email 
        LIMIT 1;
        
        RAISE NOTICE '✅ Admin trouvé dans auth.users - ID: %', admin_auth_id;
    ELSE
        RAISE NOTICE '❌ Admin NON TROUVÉ dans auth.users';
        RAISE NOTICE '';
        RAISE NOTICE '📝 ACTIONS REQUISES AVANT DE CONTINUER:';
        RAISE NOTICE '1. Aller dans Supabase Dashboard';
        RAISE NOTICE '2. Authentication → Users → "Add user"';
        RAISE NOTICE '3. Email: %', admin_email;
        RAISE NOTICE '4. Password: %', admin_password;
        RAISE NOTICE '5. ✅ Cocher "Confirm email"';
        RAISE NOTICE '6. Cliquer "Create user"';
        RAISE NOTICE '7. Relancer ce script après création';
        RAISE NOTICE '';
        
        RAISE EXCEPTION 'Créez d abord l admin via le Dashboard, puis relancez ce script.';
    END IF;
    
    -- ========================================================================
    -- ÉTAPE 2: Créer/Mettre à jour dans public.users
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '👤 ÉTAPE 2: Synchronisation dans public.users...';
    
    -- Vérifier si la table users existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Table public.users n existe pas. Exécutez d abord le script create_tables.sql';
    END IF;
    
    -- Insérer ou mettre à jour dans public.users
    INSERT INTO public.users (
        id, 
        email, 
        role, 
        gdpr_consent, 
        status, 
        locale,
        created_at,
        updated_at
    ) VALUES (
        admin_auth_id,
        admin_email,
        'admin',
        true,
        'active',
        'fr',
        now(),
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = 'admin',
        gdpr_consent = true,
        status = 'active',
        locale = 'fr',
        updated_at = now();
    
    RAISE NOTICE '✅ Données synchronisées dans public.users';
    
    -- ========================================================================
    -- ÉTAPE 3: Créer/Mettre à jour le profil dans profiles
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 ÉTAPE 3: Création du profil dans profiles...';
    
    -- Vérifier si la table profiles existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Table public.profiles n existe pas. Exécutez d abord le script create_tables.sql';
    END IF;
    
    -- Insérer ou mettre à jour le profil
    INSERT INTO public.profiles (
        user_id,
        first_name,
        last_name,
        phone,
        created_at,
        updated_at
    ) VALUES (
        admin_auth_id,
        admin_first_name,
        admin_last_name,
        admin_phone,
        now(),
        now()
    ) ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        updated_at = now();
    
    RAISE NOTICE '✅ Profil créé/mis à jour dans profiles';
    
    -- ========================================================================
    -- ÉTAPE 4: Nettoyage des éventuels doublons
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '🧹 ÉTAPE 4: Nettoyage des doublons...';
    
    -- Supprimer les éventuels doublons dans users (garder le plus récent)
    WITH duplicates AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
        FROM public.users 
        WHERE email = admin_email
    )
    DELETE FROM public.users 
    WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
    );
    
    -- Supprimer les éventuels doublons dans profiles
    WITH profile_duplicates AS (
        SELECT user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
        FROM public.profiles 
        WHERE user_id = admin_auth_id
    )
    DELETE FROM public.profiles 
    WHERE user_id IN (
        SELECT user_id FROM profile_duplicates WHERE rn > 1
    );
    
    RAISE NOTICE '✅ Nettoyage terminé';
    
    -- ========================================================================
    -- ÉTAPE 5: Vérification finale et affichage des résultats
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 ÉTAPE 5: Vérification finale...';
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '🎉 COMPTE ADMIN CRÉÉ AVEC SUCCÈS!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'ID: %', admin_auth_id;
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Rôle: admin';
    RAISE NOTICE 'Statut: active';
    RAISE NOTICE 'Nom: % %', admin_first_name, admin_last_name;
    RAISE NOTICE 'Téléphone: %', admin_phone;
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 INFORMATIONS DE CONNEXION:';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Password: %', admin_password;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Vous pouvez maintenant vous connecter à GasyWay!';
    
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - Affichage des données créées
-- ============================================================================

SELECT 
    '=== VÉRIFICATION COMPTE ADMIN ===' as message;

SELECT 
    u.id,
    u.email,
    u.role,
    u.status,
    u.gdpr_consent,
    u.locale,
    u.created_at,
    p.first_name,
    p.last_name,
    p.phone,
    p.created_at as profile_created_at
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.role = 'admin'
ORDER BY u.created_at DESC;

-- Statistiques
SELECT 
    '=== STATISTIQUES ===' as message;

SELECT 
    'Admins actifs' as type,
    COUNT(*) as nombre
FROM public.users 
WHERE role = 'admin' AND status = 'active'

UNION ALL

SELECT 
    'Total utilisateurs' as type,
    COUNT(*) as nombre
FROM public.users 
WHERE status != 'deleted'

UNION ALL

SELECT 
    'Profils créés' as type,
    COUNT(*) as nombre
FROM public.profiles;

COMMIT;

-- ============================================================================
-- 📝 NOTES IMPORTANTES
-- ============================================================================

/*
🔸 CE SCRIPT FAIT QUOI :
   • Vérifie l'existence de l'admin dans auth.users
   • Synchronise les données dans public.users  
   • Crée le profil détaillé dans public.profiles
   • Nettoie les éventuels doublons
   • Fournit une vérification complète

🔸 PRÉREQUIS :
   • Utilisateur créé dans auth.users via Dashboard
   • Tables créées avec create_tables.sql
   • Accès SQL Editor Supabase

🔸 EN CAS D'ERREUR :
   1. Vérifiez que l'utilisateur existe dans auth.users
   2. Vérifiez que les tables sont créées
   3. Relancez le script après correction

🔸 DONNÉES DE CONNEXION :
   • Email: admin@gasyway.com
   • Mot de passe: Admin123!GasyWay
   • Rôle: admin

🔸 SÉCURITÉ :
   • Le mot de passe n'est pas stocké en base (géré par Supabase Auth)
   • Seules les métadonnées sont synchronisées
   • Conformité RGPD respectée
*/