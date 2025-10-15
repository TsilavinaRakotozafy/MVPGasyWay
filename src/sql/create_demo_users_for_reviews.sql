-- =============================================
-- SCRIPT : CRÉATION D'UTILISATEURS DEMO POUR AVIS
-- Crée des utilisateurs de test pour pouvoir créer des avis
-- =============================================

DO $$
DECLARE
    demo_users TEXT[] := ARRAY[
        'marie.dubois@demo.mg',
        'jean.martin@demo.mg', 
        'sophie.bernard@demo.mg',
        'paul.moreau@demo.mg',
        'claire.simon@demo.mg'
    ];
    demo_names TEXT[] := ARRAY[
        'Marie,Dubois',
        'Jean,Martin',
        'Sophie,Bernard', 
        'Paul,Moreau',
        'Claire,Simon'
    ];
    demo_email TEXT;
    demo_name TEXT;
    first_name TEXT;
    last_name TEXT;
    user_exists BOOLEAN;
    demo_user_id UUID;
BEGIN
    RAISE NOTICE '🔍 Création d''utilisateurs demo pour les avis...';
    RAISE NOTICE '================================================';
    
    FOR i IN 1..array_length(demo_users, 1) LOOP
        demo_email := demo_users[i];
        demo_name := demo_names[i];
        first_name := split_part(demo_name, ',', 1);
        last_name := split_part(demo_name, ',', 2);
        
        -- Vérifier si l'utilisateur existe déjà
        SELECT EXISTS(SELECT 1 FROM users WHERE email = demo_email) INTO user_exists;
        
        IF NOT user_exists THEN
            -- Générer un UUID pour l'utilisateur
            demo_user_id := gen_random_uuid();
            
            -- Créer l'utilisateur dans la table users
            INSERT INTO users (
                id,
                email,
                first_name,
                last_name,
                phone,
                role,
                status,
                first_login_completed,
                gdpr_consent,
                locale,
                created_at,
                updated_at,
                last_login
            ) VALUES (
                demo_user_id,
                demo_email,
                first_name,
                last_name,
                '+261340000' || LPAD((i*111)::TEXT, 3, '0'), -- Numéro unique
                'voyageur',
                'active',
                true,
                true,
                'fr',
                now() - (random() * interval '90 days'), -- Créé dans les 3 derniers mois
                now(),
                now() - (random() * interval '30 days')  -- Dernière connexion dans le dernier mois
            );
            
            RAISE NOTICE '✅ Utilisateur demo créé: % % (%)', first_name, last_name, demo_email;
        ELSE
            RAISE NOTICE '👍 Utilisateur demo existe déjà: %', demo_email;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Création des utilisateurs demo terminée !';
    
END $$;

-- =============================================
-- VÉRIFICATION DES UTILISATEURS CRÉÉS
-- =============================================

SELECT 
    'USERS DEMO CRÉÉS' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'voyageur' THEN 1 END) as voyageurs,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as actifs
FROM users 
WHERE email LIKE '%@demo.mg';

-- Afficher la liste des utilisateurs demo
SELECT 
    first_name || ' ' || last_name as nom_complet,
    email,
    role,
    status,
    first_login_completed,
    DATE(created_at) as date_creation
FROM users 
WHERE email LIKE '%@demo.mg'
ORDER BY created_at DESC;

-- =============================================
-- MESSAGE FINAL
-- =============================================

DO $$
DECLARE
    demo_users_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO demo_users_count 
    FROM users 
    WHERE email LIKE '%@demo.mg' AND role = 'voyageur' AND status = 'active';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 UTILISATEURS DEMO PRÊTS !';
    RAISE NOTICE '';
    RAISE NOTICE '👥 % utilisateurs voyageurs actifs disponibles', demo_users_count;
    RAISE NOTICE '';
    RAISE NOTICE '📝 PROCHAINES ÉTAPES :';
    RAISE NOTICE '   1. Exécutez le script populate_demo_reviews.sql';
    RAISE NOTICE '   2. Ou créez des avis manuellement depuis l''interface';
    RAISE NOTICE '';
    
END $$;